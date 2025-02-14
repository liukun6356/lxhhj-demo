define(['exports'], (function (exports) { 'use strict';

    //reference: https://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
    // r = v - f(v*255)/255;
    // g = f(v*255) - f(v*255^2)/255;
    // b = f(v*255^2) - f(v*255^3)/255;
    // a = f(v*255^3) - f(v*255^4)/255 ≈ f(v*255^3)
    const glsl_pack = `
//v ∈ [0,1]
vec4 packNormalizeFloatToRGBA( in highp float v ) {
    vec4 enc = vec4(v, fract(vec3(255.0, 65025.0, 16581375.0) * v));
    enc.xyz -= enc.yzw / 255.0; 
    return enc;
}
float unpackRGBAToNormalizeFloat( const in highp vec4 v ) {
    return dot(v, vec4(1, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
vec3 packNormalizeFloatToRGB( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xyz;
}
float unpackRGBToNormalizeFloat( const in highp vec3 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0 ) );
}
vec2 packNormalizeFloatToRG( in highp float v ) {
	return packNormalizeFloatToRGBA( v ).xy;
}
float unpackRGToNormalizeFloat( const in highp vec2 v ) {
	return unpackRGBAToNormalizeFloat( vec4( v, 0, 0 ) );
}
`;
    function fract(v) {
        return v - Math.floor(v);
    }
    function packNormalizeFloatToRGBA(v) {
        if (v < 0 || v > 1)
            throw new Error("值不满足value ∈ [0, 1]");
        // v = v * 255;
        // const r = Math.floor(v);
        // v = (v - r) * 255;
        // const g = Math.floor(v);
        // v = (v - g) * 255;
        // const b = Math.floor(v);
        // v = (v - b) * 255;
        // const a = Math.floor(v);
        // return [r, g, b, a].map((i) => i / 255);
        const enc = [v, fract(v * 255), fract(v * 255 ** 2), fract(v * 255 ** 3)];
        return [
            enc[0] - enc[1] / 255,
            enc[1] - enc[2] / 255,
            enc[2] - enc[3] / 255,
            enc[3], //
        ];
    }
    function unpackRGBAToNormalizeFloat(rgba) {
        const [r, g, b, a] = rgba;
        return r + g / 255 + b / 255 ** 2 + a / 255 ** 3;
    }

    exports.glsl_pack = glsl_pack;

}));
//# sourceMappingURL=pack.js.map
