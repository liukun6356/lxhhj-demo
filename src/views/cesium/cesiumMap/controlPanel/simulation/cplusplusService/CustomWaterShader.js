/*
        tbn.x = dot(czm_sunPositionWC, tang);\
        tbn.y = dot(czm_sunPositionWC, binorm);\
        tbn.z = dot(czm_sunPositionWC, norm);\

        tbn.x = dot(vec3(0,0,10000), tang);\
        tbn.y = dot(vec3(0,0,10000), binorm);\
        tbn.z = dot(vec3(0,0,10000), norm);\
 */
export class CustomWaterShader {
    constructor() {
        this.vert_text = '\
        void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) \
        {\
            vec3 norm = normalize(czm_normal*vsInput.attributes.normalMC);\
            vec3 tang = normalize(czm_normal*vsInput.attributes.tangentMC);\
            vec3 binorm =vsInput.attributes.bitangentMC;\
            vec4 neyeDir = czm_modelView * vec4(vsInput.attributes.positionMC,1.0);\
            vec3 refeyeDir = normalize(neyeDir.xyz / neyeDir.w);\
            \
            v_fresratio = u_fresratio+(1.0-u_fresratio)*pow((1.0-dot(-refeyeDir,norm)),u_fresnel_power);\
            \
            vec3 tbn;\
            tbn.x = dot(czm_sunPositionWC, tang);\
            tbn.y = dot(czm_sunPositionWC, binorm);\
            tbn.z = dot(czm_sunPositionWC, norm);\
            v_lightdir = normalize(tbn);\
            \
            tbn.x = dot(-neyeDir.xyz, tang);\
            tbn.y = dot(-neyeDir.xyz, binorm);\
            tbn.z = dot(-neyeDir.xyz, norm);\
            v_eyedir = normalize(tbn);\
            \
            v_texcoord0 = vsInput.attributes.texCoord_0 + vec2(czm_frameNumber * 0.0005, czm_frameNumber * 0.0005);\
            v_texcoord1 = vsInput.attributes.texCoord_0 + vec2(czm_frameNumber * -0.0005, czm_frameNumber * -0.0005);\
            \
            float noise_height = 0.0;\
            if(u_use_noise){\
            }\
            vec4 vert_surface_color = texture(u_surface_tex, vsInput.attributes.texCoord_1);\
            float color_r = vert_surface_color.x * 255.0;\
            float color_g = vert_surface_color.y * 255.0;\
            float color_b = vert_surface_color.z * 255.0;\
            v_vertex_height = color_r + color_g / 100.0 + color_b / 10000.0;\
            \
            vec4 vert_next_surface_color = texture(u_next_surface_tex, vsInput.attributes.texCoord_1);\
            float next_color_r = vert_next_surface_color.x * 255.0;\
            float next_color_g = vert_next_surface_color.y * 255.0;\
            float next_color_b = vert_next_surface_color.z * 255.0;\
            float vertex_next_height = next_color_r + next_color_g / 100.0 + next_color_b / 10000.0 ;\
            \
            v_vertex_height += (vertex_next_height - v_vertex_height) * u_percent + noise_height;\
            v_vertex_height -= sqrt(pow(6375516.70, 2.0) + pow(vsOutput.positionMC.x, 2.0) + pow(vsOutput.positionMC.z, 2.0)) - 6375516.70;\
            vsOutput.positionMC += vec3(0.0, v_vertex_height, 0.0);\
            \
        }';

        this.frag_text = '\
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) \
            {\
                if (140.0 > v_vertex_height){\
                    discard;\
                }\
                float distSqr = dot(v_lightdir, v_lightdir);\
                float att = clamp(1.0 - 1.0 * sqrt(distSqr), 0.5, 1.0);\
                vec3 lVec = v_lightdir * inversesqrt(distSqr);\
                vec3 vVec = normalize(v_eyedir);\
                vec3 secbump = normalize(texture(u_normal_tex, v_texcoord1).xyz * 2.0 - 1.0);\
                vec3 bump = normalize(texture(u_normal_tex, v_texcoord0).xyz * 2.0 - 1.0);\
                vec3 modbump = mix(secbump, bump, 0.5);\
                \
                vec3 reflection = vec3(texture(u_sky_tex, reflect(v_eyedir, modbump).xy));\
                vec3 refraction = vec3(texture(u_sky_tex, refract(v_eyedir, modbump, 0.66).xy));\
                vec3 sky_fuse_color = mix(reflection, refraction, v_fresratio);\
                \
                vec3 base = vec3(0.5, 0.2, 0.0);\
                vec3 mixDif = mix(base,sky_fuse_color,  0.5);\
                material.diffuse =vec3(mixDif.xy,0.25);\
                material.alpha = 0.9;\
            }';
    }
    //

    //命名缺省_tex_uniform，入参是Cesium.TextureUniform
    createShader(surface, next_surface, normal, sky, noise) {
        const eta = 0.752;
        const fresratio = ((1.0 - eta) * (1.0 - eta)) / ((1.0 + eta) * (1.0 + eta));
        //需要改进，在水顶点移动后，法线值就有变化了，需要重新计算法线以及光照各种参数
        const shader = new Cesium.CustomShader({
            mode: Cesium.CustomShaderMode.REPLACE_MATERIAL,
            uniforms: {
                u_surface_tex: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: surface
                },
                u_next_surface_tex: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: next_surface
                },
                u_normal_tex: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: normal
                },
                u_noise_tex: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: noise
                },
                u_sky_tex: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: sky
                },
                u_percent: {
                    type: Cesium.UniformType.FLOAT,
                    value: 0.0
                },
                u_eta: {
                    type: Cesium.UniformType.FLOAT,
                    value: eta
                },
                u_fresnel_power: {
                    type: Cesium.UniformType.FLOAT,
                    value: 5.0
                },
                u_fresratio: {
                    type: Cesium.UniformType.FLOAT,
                    value: fresratio
                },
                u_use_noise: {
                    type: Cesium.UniformType.BOOL,
                    value: false
                }
            },
            varyings: {
                v_fresratio: Cesium.VaryingType.FLOAT,
                v_vertex_height: Cesium.VaryingType.FLOAT,
                v_lightdir: Cesium.VaryingType.VEC3,
                v_eyedir: Cesium.VaryingType.VEC3,
                v_texcoord0: Cesium.VaryingType.VEC2,
                v_texcoord1: Cesium.VaryingType.VEC2,
            },
            vertexShaderText: this.vert_text,
            fragmentShaderText: this.frag_text
        });
        return shader;
    }
}

