export const glsl_utils_rotate = `
vec2 rotate(vec2 point, mat3 rotateMat){
    return (rotateMat * vec3(point, 1)).xy;
}
vec2 rotateAround(vec2 point, vec2 rotateCenter, mat3 rotateMat){
    return (rotateMat * vec3(point - rotateCenter, 1)).xy + rotateCenter;
}
`;