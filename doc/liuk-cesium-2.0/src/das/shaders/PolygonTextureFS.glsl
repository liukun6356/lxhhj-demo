#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

#define OES_texture_float_linear

varying vec2 depth;

vec4 packDepth(float depth)
{
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * depth;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    return enc;
}

void main()
{
    float fDepth = (depth.x / 5000.0)/2.0 + 0.5;
    gl_FragColor = packDepth(fDepth);
}
