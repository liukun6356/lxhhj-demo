//reference: https://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
// r = v - f(v*255)/255;
// g = f(v*255) - f(v*255^2)/255;
// b = f(v*255^2) - f(v*255^3)/255;
// a = f(v*255^3) - f(v*255^4)/255 ≈ f(v*255^3)
export const glsl_pack = `
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
