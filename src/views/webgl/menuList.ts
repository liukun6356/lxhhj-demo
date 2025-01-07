export default [
    {
        id: 1,
        label: 'demo效果',
        children: [
            {
                id: 11,
                label: '点，线，三角',
                name: "Webgl-main-HelloWebgl"
            },
            {
                id: 12,
                label: 'spinEditing',
                name: "Webgl-main-SpinEditing"
            },
            {
                id: 13,
                label: '图像处理',
                name: "Webgl-main-ImageProcessing"
            },
            {
                id: 14,
                label: '二维平移',
                name: "Webgl-main-Transform2d"
            },
            {
                id: 15,
                label: '二维平移(矩阵)',
                name: "Webgl-main-Transform2dmatrix"
            },
        ],
    },
];

/*
glsl命名约定
a_  代表缓存，值从缓冲中提供
u_  代表全局变量，直接对着色器设置
v_  代表可变量，从顶点着色器的顶点中插值出来的

*/
