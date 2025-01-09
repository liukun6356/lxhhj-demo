import { glsl_color_mapping_classbreak, glsl_color_mapping_gradient } from "./color-mapping";
import { PointStyleCode, UseDefaultValue } from "./typeMisc";
import { ColorMappingTypeCode } from "./common";

//数据纹理插值
const part_common = `
    #define MAPPING_GRADIENT ${ColorMappingTypeCode.gradient.toFixed(1)}
    #define MAPPING_CLASS_BREAK ${ColorMappingTypeCode["class-break"].toFixed(1)}

    struct DataValue { 
        sampler2D tex1;
        sampler2D tex2;
        vec2 texSize;
        float lerpValue;
        bvec2 enable;
    };

    struct ColorMapping { 
        float type;
        sampler2D texture;
        vec2 valueRange;
        bvec2 trunc;
    };
    uniform ColorMapping u_colorMapping;
    uniform DataValue u_dataValue;

    ${glsl_color_mapping_gradient}
    ${glsl_color_mapping_classbreak}

    float samplerDataTex(sampler2D map, vec2 uv, float componentIndex){
        vec4 data = texture2D(map, uv);
        if( componentIndex == 0.0 ) return data.r;
        if( componentIndex == 1.0 ) return data.g;
        if( componentIndex == 2.0 ) return data.b;
        if( componentIndex == 3.0 ) return data.a;
    }

    float lookupValue(float dataIndex){
        float pixelIndex = floor(dataIndex / 4.0);
        vec2 texSize = u_dataValue.texSize;
        float col = mod(pixelIndex, texSize.x);
        float row = floor(pixelIndex / texSize.x);
        float componentIndex = mod(dataIndex, 4.0); //第几个分量
        
        vec2 onePixel = 1.0 / texSize;
        vec2 halfOnePixel = onePixel / 2.0;
        vec2 uv = vec2(col, row) * onePixel + halfOnePixel;

        float v1 = u_dataValue.enable.x ? samplerDataTex(u_dataValue.tex1, uv, componentIndex) : 0.0;
        float v2 = u_dataValue.enable.y ? samplerDataTex(u_dataValue.tex2, uv, componentIndex) : 0.0;
        return mix(v1, v2, u_dataValue.lerpValue);
    }
    vec4 getColor(float dataIndex){
        float value = lookupValue(dataIndex);
        return u_colorMapping.type == MAPPING_GRADIENT 
            ? mappingcolor_gradient(
                u_colorMapping.texture, 
                value, 
                u_colorMapping.valueRange,
                u_colorMapping.trunc.x,
                u_colorMapping.trunc.y
            ) 
            : mappingcolor_classbreak(
                u_colorMapping.texture,
                value, 
                u_colorMapping.trunc.x,
                u_colorMapping.trunc.y
            );
    }
`;

export const PolygonShader = {
    vertex: `
    precision highp float;

    uniform vec4 u_tile;
    uniform float u_resolution;
    uniform mat3 u_display;
    uniform mat3 u_rotation;

    attribute vec2 position;//相对于tile中心点坐标;
    attribute float dataIndex;
   
    varying vec2 v_posInTileNormalized;// tile内的归一化坐标
    varying vec4 v_color;
    
    ${part_common}
    
    void main() {
        v_color = getColor(dataIndex);
      
        vec2 posInTile = position / u_resolution;        
        v_posInTileNormalized = posInTile / (u_tile.zw * 0.5);
        
        posInTile = (u_rotation * vec3(posInTile, 1.0)).xy;
        vec2 screenPos = u_tile.xy + posInTile * vec2(1, -1);
        
        gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy; 
        gl_Position.zw = vec2(0.0, 1.0);
    }`,
    fragment: `
    precision highp float;
    varying vec2 v_posInTileNormalized;
    varying vec4 v_color;

    void main(){
       bool show = all(lessThanEqual(abs(v_posInTileNormalized), vec2(1))); 
       if(!show) discard;
       gl_FragColor = v_color;
    }`,
};

export const TriangleRenderSizeFactor = 2.0; //三角形渲染时缩放
export const PointShader = {
    vertex: `
    precision highp float;
    #define DEFAULT_VALUE ${UseDefaultValue.toFixed(1)}
    #define POINT_STYLE_CIRCLE ${PointStyleCode.circle.toFixed(1)}
    #define POINT_STYLE_SQUARE ${PointStyleCode.square.toFixed(1)}
    #define POINT_STYLE_TRIANGLE ${PointStyleCode.triangle.toFixed(1)}

    struct PointStyle { 
        sampler2D texture;
        vec2 texSize;
        float defaultSize;
        float defaultUpright;
        float defaultType;
    };
    uniform PointStyle u_pointStyle;

    uniform vec4 u_tile; // xy:tile中心点屏幕位置(pixel), zw:tile当前宽高(pixel)
    uniform float u_resolution;
    uniform mat3 u_display;
    uniform mat3 u_rotation;

    attribute vec2 offset;
    attribute vec2 instance_position;
    attribute float instance_dataIndex;
    attribute float instance_styleIndex;

    ${part_common}

    struct Style {
        float size;
        float type;
        bool upright;
    };

    Style lookUpStyle(float styleIndex){
        vec2 texSize = u_pointStyle.texSize;
        float col = mod(styleIndex, texSize.x); //第几列
        float row = floor(styleIndex / texSize.x); //第几行
        vec2 onePixel = 1.0 / texSize;
        vec2 halfOnePixel = onePixel / 2.0;
        vec2 uv = vec2(col, row) * onePixel + halfOnePixel;
        //rgba uint8 纹理
        vec4 data = texture2D(u_pointStyle.texture, uv) * 255.0;

        bool defaultUpright = u_pointStyle.defaultUpright > 0.5;

        float pointSize = data.r == DEFAULT_VALUE ? u_pointStyle.defaultSize : data.r;
        bool isUpright = data.g == DEFAULT_VALUE ? defaultUpright : (data.g > 128.0);     
        float pointType = data.b == DEFAULT_VALUE ? u_pointStyle.defaultType
                                                  : floor(data.b + 0.5);
        return Style(pointSize, pointType, isUpright);
    }


    varying vec4 v_color;
    varying vec2 v_offset;
    varying float v_pointSize;
    varying float v_pointType;

    void main(){
        //1. color
        v_color = getColor(instance_dataIndex);

        //2. resolve style
        Style style = lookUpStyle(instance_styleIndex);

        v_offset = offset;
        v_pointType = style.type;

        //实际渲染真实的大小
        float pointSize = style.size * 0.5;
        pointSize *= style.type == POINT_STYLE_TRIANGLE ? ${TriangleRenderSizeFactor.toFixed(1)} : 1.0;

        v_pointSize = pointSize;


        //3. resolve geometry
        vec2 posInTile = instance_position / u_resolution; //点在tile内的坐标
        vec2 posOffset = offset * pointSize; //偏移               

        vec2 screenPos;
        
        if(style.upright){
            posInTile = (u_rotation * vec3(posInTile, 1.0)).xy;
            screenPos = u_tile.xy + (posInTile + posOffset) * vec2(1, -1);
        }else{
            posInTile = (u_rotation * vec3(posInTile + posOffset, 1.0)).xy;
            screenPos = u_tile.xy + posInTile * vec2(1, -1);
        }

        gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy;     
        gl_Position.zw = vec2(0.0, 1.0);
    }`,
    fragment: `
    precision highp float;

    #define POINT_STYLE_CIRCLE ${PointStyleCode.circle.toFixed(1)}
    #define POINT_STYLE_SQUARE ${PointStyleCode.square.toFixed(1)}
    #define POINT_STYLE_TRIANGLE ${PointStyleCode.triangle.toFixed(1)}
    
    varying vec4 v_color;
    varying vec2 v_offset;
    varying float v_pointSize;
    varying float v_pointType;

    
    //A(0, 1), B(-√3/2, -0.5) C(√3/2, -0.5);
    const float s3 = pow(3.0, 0.5);
    const vec2 rotate_120cw = vec2(-s3/2.0, -0.5);
    const vec2 rotate_120ccw = vec2( s3/2.0, -0.5); 
    vec2 getTriangleDirInfo(vec2 pos){
        float d_bc = pos.y + 0.5;
        float d_ab = dot(pos, rotate_120ccw) + 0.5;
        float d_ac = dot(pos, rotate_120cw) + 0.5;
        
        bool isInTriangle = d_bc >= 0.0 && d_ab >= 0.0 && d_ac >= 0.0;
        float minDir = min(min(d_bc, d_ab), d_ac);
        return vec2(isInTriangle ? 1.0 : 0.0, minDir * 2.0);
    }

    void main(){
        float alpha = v_color.a;
        float pointType = v_pointType;
        float edgeBlurPixel = clamp(v_pointSize / 2.0, 0.0, 2.0);
        if(pointType == POINT_STYLE_TRIANGLE){
            vec2 bInfo = getTriangleDirInfo(v_offset);
            if(bInfo.x < 0.5) discard;
            float edge = min(edgeBlurPixel / (v_pointSize * 0.5), 1.0);
            alpha *= smoothstep(0.0, edge, bInfo.y);
        }else if(pointType == POINT_STYLE_SQUARE){
            float disToCenter = max(abs(v_offset.x), abs(v_offset.y));
            float edge = 1.0 - min(1.0, edgeBlurPixel / v_pointSize); 
            alpha *= 1.0 - smoothstep(edge, 1.0, disToCenter);
        }else{
            float disToCenter = length(v_offset);
            if(disToCenter > 1.0) discard;
            float edge = 1.0 - min(1.0, edgeBlurPixel / v_pointSize); 
            alpha *= 1.0 - smoothstep(edge, 1.0, disToCenter);
        }
        gl_FragColor = vec4(v_color.rgb, alpha);
    }`,
};

export const PolylineShader = {
    vertex: `
    precision highp float;
    #define DEFAULT_VALUE ${UseDefaultValue.toFixed(1)}

    struct PolylineStyle { 
        sampler2D texture;
        vec2 texSize;
        float defaultLineWidth;
    };

    uniform PolylineStyle u_polylineStyle;

    uniform vec4 u_tile;
    uniform float u_resolution;
    uniform mat3 u_display;
    uniform mat3 u_rotation;

    attribute vec2 position;
    attribute vec2 offset; 
    attribute float dataIndexAndSide;
    attribute float styleIndex;

    varying vec4 v_color;
    varying float v_lineSide;
    varying float v_lineWidth;
    
    ${part_common}

    float lookUpLineWidth(float styleIndex){
        vec2 texSize = u_polylineStyle.texSize;
        float col = mod(styleIndex, texSize.x); //第几列
        float row = floor(styleIndex / texSize.x); //第几行
        vec2 onePixel = 1.0 / texSize;
        vec2 halfOnePixel = onePixel / 2.0;
        vec2 uv = vec2(col, row) * onePixel + halfOnePixel;
        vec4 data = texture2D(u_polylineStyle.texture, uv) * 255.0;

        return (data.r == DEFAULT_VALUE ? u_polylineStyle.defaultLineWidth : data.r) * 0.5;
    }


    void main() {
        float dataIndex = dataIndexAndSide > 0.0 ? dataIndexAndSide : -dataIndexAndSide;

        v_color = getColor(dataIndex);

        float lineWidth = lookUpLineWidth(styleIndex);

        v_lineWidth = lineWidth;

        v_lineSide = dataIndexAndSide > 0.0 ? 1.0 : -1.0;

        vec2 posInTile = position / u_resolution + offset * lineWidth;
        posInTile = (u_rotation * vec3(posInTile, 1.0)).xy;
        vec2 screenPos = u_tile.xy + posInTile * vec2(1, -1);
        
        gl_Position.xy = (u_display * vec3(screenPos, 1.0)).xy; 
        gl_Position.zw = vec2(0.0, 1.0);
    }`,
    fragment: `
    precision highp float;

    varying vec4 v_color;
    varying float v_lineSide;
    varying float v_lineWidth;
  
    void main(){
        gl_FragColor.rgb = v_color.rgb;
        float alpha = v_color.a;
        float edgeBlurPixel = clamp(v_lineWidth / 2.0, 0.0, 2.0);
        float edge = 1.0 - min(1.0, edgeBlurPixel / v_lineWidth);
        alpha *= 1.0 - smoothstep(edge, 1.0, abs(v_lineSide));
        gl_FragColor.a = alpha;
    }`,
};
