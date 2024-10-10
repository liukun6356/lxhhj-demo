uniform sampler2D colorTexture;
uniform sampler2D mergeTexture;
uniform float alpha;
varying vec2 v_textureCoordinates;
void main(){
    vec4 color = texture2D(colorTexture, v_textureCoordinates);
    vec4 mergeColor =  texture2D(mergeTexture, v_textureCoordinates);
    if(length(mergeColor.rgb)>0.01){
        gl_FragColor = mix(color,mergeColor,alpha);
    }else{
        gl_FragColor = color;
    }
}
