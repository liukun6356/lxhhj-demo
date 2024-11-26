const styleConfig = {
    "label": {
        "name": "文字",
        "primitive": true,
        "style": [
            {
                "name": "text",
                "label": "内容",
                "type": "textarea",
                "defval": ""
            },
            {
                "name": "font_family",
                "label": "字体",
                "type": "combobox",
                "defval": "微软雅黑",
                "data": [
                    {
                        "label": "微软雅黑",
                        "value": "微软雅黑"
                    },
                    {
                        "label": "宋体",
                        "value": "宋体"
                    },
                    {
                        "label": "楷体",
                        "value": "楷体"
                    },
                    {
                        "label": "隶书",
                        "value": "隶书"
                    },
                    {
                        "label": "黑体",
                        "value": "黑体"
                    }
                ]
            },
            {
                "name": "font_size",
                "label": "字体大小",
                "type": "number",
                "min": 3,
                "step": 1,
                "defval": 30
            },
            {
                "name": "font_weight",
                "label": "是否加粗",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "bold"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "font_style",
                "label": "是否斜体",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "italic"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outline",
                "label": "是否衬色",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "衬色颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outlineWidth",
                "label": "衬色宽度",
                "type": "number",
                "min": 1,
                "max": 5,
                "step": 1,
                "defval": 3
            },
            {
                "name": "background",
                "label": "是否背景",
                "type": "radio",
                "defval": false
            },
            {
                "name": "backgroundColor",
                "label": "背景颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "backgroundPadding",
                "label": "背景内边距",
                "type": "number",
                "step": 1,
                "defval": 5
            },
            {
                "name": "pixelOffsetX",
                "label": "横向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "pixelOffsetY",
                "label": "纵向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "addHeight",
                "label": "偏移高度",
                "type": "number",
                "step": 1,
                "defval": 0
            }
        ],
        "type": "label"
    },
    "canvasLabel": {
        "name": "Canvas文字",
        "style": [
            {
                "name": "text",
                "label": "内容",
                "type": "textarea",
                "defval": ""
            },
            {
                "name": "font_family",
                "label": "字体",
                "type": "combobox",
                "defval": "微软雅黑",
                "data": [
                    {
                        "label": "微软雅黑",
                        "value": "微软雅黑"
                    },
                    {
                        "label": "宋体",
                        "value": "宋体"
                    },
                    {
                        "label": "楷体",
                        "value": "楷体"
                    },
                    {
                        "label": "隶书",
                        "value": "隶书"
                    },
                    {
                        "label": "黑体",
                        "value": "黑体"
                    }
                ]
            },
            {
                "name": "font_size",
                "label": "字体大小",
                "type": "number",
                "min": 3,
                "step": 1,
                "defval": 30
            },
            {
                "name": "font_weight",
                "label": "是否加粗",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "bold"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "font_style",
                "label": "是否斜体",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "italic"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "stroke",
                "label": "是否衬色",
                "type": "radio",
                "defval": false
            },
            {
                "name": "strokeColor",
                "label": "衬色颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "strokeWidth",
                "label": "衬色宽度",
                "type": "number",
                "min": 1,
                "max": 5,
                "step": 1,
                "defval": 3
            },
            {
                "name": "background",
                "label": "是否背景",
                "type": "radio",
                "defval": false
            },
            {
                "name": "backgroundColor",
                "label": "背景颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "backgroundPadding",
                "label": "背景内边距",
                "type": "number",
                "step": 1,
                "defval": 5
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 1,
                "max": 10,
                "step": 1,
                "defval": 4
            },
            {
                "name": "pixelOffsetX",
                "label": "横向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "pixelOffsetY",
                "label": "纵向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            }
        ],
        "type": "canvasLabel"
    },
    "point": {
        "name": "点标记",
        "primitive": true,
        "style": [
            {
                "name": "pixelSize",
                "label": "像素大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": true
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            }
        ],
        "type": "point"
    },
    "billboard": {
        "name": "图标点标记",
        "primitive": true,
        "extends": [
            "divBillboard",
            "divBillboardP",
            "canvasBillboard"
        ],
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": 1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "image",
                "label": "图标",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "billboard"
    },
    "div": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "divPlane": {
        "name": "DIV三维平面",
        "style": [
            {
                "name": "scale",
                "label": "比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 90
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "divPlane"
    },
    "billboardIndicator": {
        "name": "可拖拽图标点",
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "min": 0,
                "defval": 1
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            }
        ],
        "type": "billboardIndicator"
    },
    "fontBillboard": {
        "name": "字体点标记",
        "style": [
            {
                "name": "iconClass",
                "label": "Class样式",
                "type": "label",
                "defval": "fa fa-automobile"
            },
            {
                "name": "iconSize",
                "label": "图标大小",
                "type": "number",
                "step": 1,
                "defval": 50
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            }
        ],
        "type": "fontBillboard"
    },
    "model": {
        "name": "gltf模型",
        "primitive": true,
        "style": [
            {
                "name": "url",
                "label": "路径",
                "type": "label",
                "defval": ""
            },
            {
                "name": "scale",
                "label": "比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "minimumPixelSize",
                "label": "最小像素大小",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "silhouette",
                "label": "是否轮廓",
                "type": "radio",
                "defval": false
            },
            {
                "name": "silhouetteColor",
                "label": "轮廓颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "silhouetteSize",
                "label": "轮廓宽度",
                "type": "number",
                "step": 1,
                "defval": 2
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "runAnimations",
                "label": "是否动画",
                "type": "radio",
                "defval": true
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": true
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "model"
    },
    "circle": {
        "name": "圆",
        "primitive": true,
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "height",
                "label": "高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "放大扩散线",
                        "value": "ScanLine"
                    },
                    {
                        "label": "半径扫描",
                        "value": "CircleScan"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "雷达线",
                        "value": "RadarLine"
                    },
                    {
                        "label": "波纹雷达扫描",
                        "value": "RadarWave"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "circle"
    },
    "ellipse": {
        "name": "椭圆",
        "style": [
            {
                "name": "semiMinorAxis",
                "label": "短半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "semiMajorAxis",
                "label": "长半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "放大扩散线",
                        "value": "ScanLine"
                    },
                    {
                        "label": "半径扫描",
                        "value": "CircleScan"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "雷达线",
                        "value": "RadarLine"
                    },
                    {
                        "label": "波纹雷达扫描",
                        "value": "RadarWave"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "ellipse"
    },
    "cylinder": {
        "name": "圆锥体",
        "primitive": true,
        "extends": [
            "coneTrack",
            "coneTrackP"
        ],
        "style": [
            {
                "name": "topRadius",
                "label": "顶部半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "bottomRadius",
                "label": "底部半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "length",
                "label": "锥体高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "条纹扩散",
                        "value": "CylinderWave"
                    }
                ]
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "step": 1,
                "defval": 128
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "cylinder"
    },
    "frustum": {
        "name": "四棱椎体",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "rgba(0,255,0,0.4)"
            },
            {
                "name": "length",
                "label": "长度",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "angle",
                "label": "夹角1",
                "type": "slider",
                "min": 0.1,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "angle2",
                "label": "夹角2",
                "type": "slider",
                "min": 0.1,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            }
        ],
        "type": "frustum"
    },
    "ellipsoid": {
        "name": "球体",
        "primitive": true,
        "style": [
            {
                "name": "radii_x",
                "label": "X半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "radii_y",
                "label": "Y半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "radii_z",
                "label": "Z半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "innerRadii_x",
                "label": "内部X半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "innerRadii_y",
                "label": "内部Y半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "innerRadii_z",
                "label": "内部Z半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "minimumClockDegree",
                "label": "最小时钟角度",
                "type": "number",
                "defval": 0
            },
            {
                "name": "maximumClockDegree",
                "label": "最大时钟角度",
                "type": "number",
                "defval": 360
            },
            {
                "name": "minimumConeDegree",
                "label": "最小锥角",
                "type": "number",
                "defval": 0
            },
            {
                "name": "maximumConeDegree",
                "label": "最大圆锥角",
                "type": "number",
                "defval": 180
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "波纹",
                        "value": "EllipsoidWave"
                    },
                    {
                        "label": "电弧",
                        "value": "EllipsoidElectric"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "ellipsoid"
    },
    "plane": {
        "name": "平面",
        "primitive": true,
        "style": [
            {
                "name": "dimensions_x",
                "label": "长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "plane_normal",
                "label": "方向",
                "type": "combobox",
                "defval": "z",
                "data": [
                    {
                        "label": "X轴",
                        "value": "x"
                    },
                    {
                        "label": "Y轴",
                        "value": "y"
                    },
                    {
                        "label": "Z轴",
                        "value": "z"
                    }
                ]
            },
            {
                "name": "plane_distance",
                "label": "偏移距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "plane"
    },
    "doubleSidedPlane": {
        "name": "双面渲染图片平面",
        "primitive": true,
        "style": [
            {
                "name": "image",
                "label": "填充的图片",
                "type": "label"
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "noWhite",
                "label": "不显示白色",
                "type": "radio",
                "defval": true
            },
            {
                "name": "dimensions_x",
                "label": "长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            }
        ],
        "type": "doubleSidedPlane"
    },
    "box": {
        "name": "盒子",
        "primitive": true,
        "style": [
            {
                "name": "dimensions_x",
                "label": "盒子长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "盒子宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_z",
                "label": "盒子高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "box"
    },
    "particleSystem": {
        "name": "粒子效果",
        "style": [
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "particleSize",
                "label": "粒子大小",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 60,
                "step": 1
            },
            {
                "name": "emissionRate",
                "label": "发射速率",
                "type": "slider",
                "defval": 100,
                "min": 0,
                "max": 500,
                "step": 1
            },
            {
                "name": "gravity",
                "label": "重力因子",
                "type": "slider",
                "defval": 0,
                "min": -20,
                "max": 20,
                "step": 0.1
            },
            {
                "name": "transX",
                "label": "偏移值X",
                "type": "slider",
                "defval": 0,
                "min": -50,
                "max": 50,
                "step": 0.1
            },
            {
                "name": "transY",
                "label": "偏移值Y",
                "type": "slider",
                "defval": 0,
                "min": -50,
                "max": 50,
                "step": 0.1
            },
            {
                "name": "transZ",
                "label": "偏移值Z",
                "type": "slider",
                "defval": 0,
                "min": -50,
                "max": 50,
                "step": 0.1
            },
            {
                "name": "startScale",
                "label": "开始比例",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 10,
                "step": 1
            },
            {
                "name": "endScale",
                "label": "结束比例",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 10,
                "step": 1
            },
            {
                "name": "minimumParticleLife",
                "label": "最小寿命",
                "type": "slider",
                "defval": 3,
                "min": 0.1,
                "max": 30,
                "step": 0.1
            },
            {
                "name": "maximumParticleLife",
                "label": "最大寿命",
                "type": "slider",
                "defval": 6,
                "min": 0.1,
                "max": 30,
                "step": 0.1
            }
        ],
        "type": "particleSystem"
    },
    "cloud": {
        "name": "积云",
        "style": [
            {
                "name": "scaleX",
                "label": "比例X",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "scaleY",
                "label": "比例Y",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "maximumSizeX",
                "label": "最大尺寸X",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "maximumSizeY",
                "label": "最大尺寸Y",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "maximumSizeZ",
                "label": "最大尺寸Z",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "slice",
                "label": "切片",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "brightness",
                "label": "亮度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            }
        ],
        "type": "cloud"
    },
    "lightCone": {
        "name": "光锥体",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "radius",
                "label": "底部半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 100
            },
            {
                "name": "height",
                "label": "锥体高度",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1000
            },
            {
                "name": "setHeight",
                "label": "指定坐标高度",
                "type": "number",
                "min": 0,
                "max": 999999999,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "lightCone"
    },
    "tetrahedron": {
        "name": "四面体",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "width",
                "label": "顶部大小",
                "type": "number",
                "step": 1,
                "defval": 20
            },
            {
                "name": "height",
                "label": "椎体高度",
                "type": "number",
                "step": 1,
                "defval": 30
            },
            {
                "name": "animation",
                "label": "是否动画",
                "type": "radio",
                "defval": true
            },
            {
                "name": "moveHeight",
                "label": "动画高度",
                "type": "number",
                "step": 1,
                "defval": 30
            },
            {
                "name": "moveDuration",
                "label": "动画时长",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 2
            },
            {
                "name": "rotationAngle",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 1
            }
        ],
        "type": "tetrahedron"
    },
    "rectangularSensor": {
        "name": "相控阵雷达范围",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00FF00"
            },
            {
                "name": "lineColor",
                "label": "边线颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "xHalfAngleDegree",
                "label": "上下夹角",
                "type": "slider",
                "min": 0,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "yHalfAngleDegree",
                "label": "左右夹角",
                "type": "slider",
                "min": 0,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "showScanPlane",
                "label": "扫描面",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scanPlaneColor",
                "label": "扫描面颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "scanPlaneMode",
                "label": "扫描面方向",
                "type": "combobox",
                "defval": "vertical",
                "data": [
                    {
                        "label": "垂直方向",
                        "value": "vertical"
                    },
                    {
                        "label": "水平方向",
                        "value": "horizontal"
                    }
                ]
            },
            {
                "name": "scanPlaneRate",
                "label": "扫描速率",
                "type": "number",
                "min": 1,
                "max": 100,
                "step": 0.1,
                "defval": 3
            }
        ],
        "type": "rectangularSensor"
    },
    "camberRadar": {
        "name": "双曲面雷达范围",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "radius",
                "label": "内曲面半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1,
                "toFixed": 1
            },
            {
                "name": "startRadius",
                "label": "外曲面半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1,
                "toFixed": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "startFovH",
                "label": "左横截面角度",
                "type": "slider",
                "min": -180,
                "max": 180,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "endFovH",
                "label": "右横截面角度",
                "type": "slider",
                "min": -180,
                "max": 180,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "startFovV",
                "label": "垂直起始角度",
                "type": "slider",
                "min": 0,
                "max": 90,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "endFovV",
                "label": "垂直结束角度",
                "type": "slider",
                "min": 0,
                "max": 90,
                "step": 0.01,
                "defval": 1
            }
        ],
        "type": "camberRadar"
    },
    "jammingRadar": {
        "name": "自定义干扰雷达",
        "style": [
            {
                "name": "scale",
                "label": "大小比例",
                "type": "slider",
                "min": 0.1,
                "max": 10,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "autoColor",
                "label": "是否内置渐变色",
                "type": "radio",
                "defval": true
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "rgba(255,0,0,0.5)"
            },
            {
                "name": "outline",
                "label": "是否显示边线",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "边线颜色",
                "type": "color",
                "defval": "#ffffff"
            }
        ],
        "type": "jammingRadar"
    },
    "fixedJammingRadar": {
        "name": "固定算法干扰雷达",
        "style": [
            {
                "name": "scale",
                "label": "大小比例",
                "type": "slider",
                "min": 0.1,
                "max": 10,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "autoColor",
                "label": "是否内置渐变色",
                "type": "radio",
                "defval": true
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "rgba(255,0,0,0.5)"
            },
            {
                "name": "outline",
                "label": "是否显示边线",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "边线颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "pt",
                "label": "发射功率",
                "type": "number",
                "defval": 8000000
            },
            {
                "name": "gt",
                "label": "天线主瓣增益",
                "type": "number",
                "defval": 500
            },
            {
                "name": "lambda",
                "label": "信号波长(lambda)",
                "type": "number",
                "defval": 0.056
            },
            {
                "name": "sigma",
                "label": "反射截面积(sigma)",
                "type": "number",
                "defval": 3
            },
            {
                "name": "n",
                "label": "脉冲积累数",
                "type": "number",
                "defval": 16
            },
            {
                "name": "k",
                "label": "玻尔兹曼常数",
                "type": "number",
                "defval": 1.38e-23
            },
            {
                "name": "t0",
                "label": "绝对温度",
                "type": "number",
                "defval": 290
            },
            {
                "name": "bn",
                "label": "接收机通频带宽度",
                "type": "number",
                "defval": 1600000
            },
            {
                "name": "fn",
                "label": "接收机噪声系数",
                "type": "number",
                "defval": 5
            },
            {
                "name": "sn",
                "label": "接收机最小可检测信噪比",
                "type": "number",
                "defval": 2
            }
        ],
        "type": "fixedJammingRadar"
    },
    "satellite": {
        "name": "卫星",
        "primitive": false,
        "style": [
            {
                "name": "tle1",
                "label": "tle1",
                "type": "label",
                "defval": ""
            },
            {
                "name": "tle2",
                "label": "tle2",
                "type": "label",
                "defval": ""
            },
            {
                "name": "path_show",
                "label": "是否显示路径",
                "type": "radio",
                "defval": false
            },
            {
                "name": "path_width",
                "label": "路径线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "path_color",
                "label": "路径颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "model_show",
                "label": "是否显示模型",
                "type": "radio",
                "defval": false
            },
            {
                "name": "model_url",
                "label": "模型路径",
                "type": "label",
                "defval": ""
            },
            {
                "name": "model_heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "model_pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "model_roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "model_scale",
                "label": "比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "model_minimumPixelSize",
                "label": "最小像素大小",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "model_distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "model_distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "model_distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "cone_show",
                "label": "是否显示视椎体",
                "type": "radio",
                "defval": false
            },
            {
                "name": "cone_angle1",
                "label": "视椎体半场角1",
                "type": "slider",
                "min": 0.1,
                "max": 80,
                "step": 0.01,
                "defval": 5
            },
            {
                "name": "cone_angle2",
                "label": "视椎体半场角2",
                "type": "slider",
                "min": 0.1,
                "max": 80,
                "step": 0.01,
                "defval": 5
            },
            {
                "name": "cone_color",
                "label": "视椎体颜色",
                "type": "color",
                "defval": "rgba(255,255,0,0.4)"
            }
        ],
        "type": "satellite"
    },
    "conicSensor": {
        "name": "卫星圆锥体",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "rgba(255,0,0,0.4)"
            },
            {
                "name": "length",
                "label": "长度",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "angle",
                "label": "夹角",
                "type": "slider",
                "min": 1,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "topShow",
                "label": "显示顶盖",
                "type": "radio",
                "defval": true
            },
            {
                "name": "shadowShow",
                "label": "地面投影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "conicSensor"
    },
    "rectSensor": {
        "name": "卫星四棱椎体",
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "rgba(0,255,0,0.4)"
            },
            {
                "name": "length",
                "label": "长度",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "angle1",
                "label": "夹角1",
                "type": "slider",
                "min": 0.1,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "angle2",
                "label": "夹角2",
                "type": "slider",
                "min": 0.1,
                "max": 89,
                "step": 0.01,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "topShow",
                "label": "显示顶盖",
                "type": "radio",
                "defval": true
            },
            {
                "name": "rayEllipsoid",
                "label": "求交地球",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "rectSensor"
    },
    "pointLight": {
        "name": "点光源",
        "style": [
            {
                "name": "color",
                "label": "光颜色",
                "type": "color",
                "defval": "rgba(0,255,0,0.4)"
            },
            {
                "name": "intensity",
                "label": "光强度",
                "type": "number",
                "min": 1,
                "max": 10000,
                "step": 1,
                "defval": 1
            },
            {
                "name": "radius",
                "label": "点光源半径",
                "type": "number",
                "min": 1,
                "max": 10000,
                "step": 1,
                "defval": 1
            }
        ],
        "type": "pointLight"
    },
    "spotLight": {
        "name": "聚光灯",
        "style": [
            {
                "name": "color",
                "label": "光颜色",
                "type": "color",
                "defval": "rgba(0,255,0,0.4)"
            },
            {
                "name": "intensity",
                "label": "光强度",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "radius",
                "label": "聚光灯半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "innerCone",
                "label": "内圆锥角",
                "type": "slider",
                "min": 0,
                "max": 45,
                "step": 0.1,
                "defval": 10
            },
            {
                "name": "outerCone",
                "label": "外圆锥角",
                "type": "slider",
                "min": 0,
                "max": 45,
                "step": 0.1,
                "defval": 10
            }
        ],
        "type": "spotLight"
    },
    "pointVisibility": {
        "name": "圆形可视域区域",
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "slider",
                "min": 1,
                "max": 3000,
                "step": 1,
                "defval": 1
            },
            {
                "name": "showFrustum",
                "label": "视椎体框线",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "pointVisibility"
    },
    "coneVisibility": {
        "name": "扇形可视域区域",
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "slider",
                "min": 1,
                "max": 3000,
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "showFrustum",
                "label": "视椎体框线",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "coneVisibility"
    },
    "viewDome": {
        "name": "开敞度分析球",
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "min": 1,
                "max": 999999999,
                "step": 1,
                "defval": 1
            },
            {
                "name": "visibleColor",
                "label": "可见区域颜色",
                "type": "color",
                "defval": "rgba(0,183,239, 0.5)"
            },
            {
                "name": "hiddenColor",
                "label": "不可见区域颜色",
                "type": "color",
                "defval": "rgba(227,108,9, 0.5)"
            }
        ],
        "type": "viewDome"
    },
    "polyline": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "path": {
        "name": "路径",
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "leadTime",
                "label": "轨迹前",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "trailTime",
                "label": "轨迹保留",
                "type": "number",
                "step": 1,
                "defval": 9999
            }
        ],
        "type": "path"
    },
    "polylineVolume": {
        "name": "管道线",
        "primitive": true,
        "style": [
            {
                "name": "shape",
                "label": "形状",
                "type": "combobox",
                "defval": "pipeline",
                "data": [
                    {
                        "label": "空心管",
                        "value": "pipeline"
                    },
                    {
                        "label": "实心管",
                        "value": "circle"
                    },
                    {
                        "label": "星状管",
                        "value": "star"
                    }
                ]
            },
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "thicknes",
                "label": "厚度",
                "type": "number",
                "step": 1,
                "defval": 3
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "min": 1,
                "max": 360,
                "step": 1,
                "defval": 90
            },
            {
                "name": "startAngle",
                "label": "开始角度",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.1,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "材质类型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "polylineVolume"
    },
    "wall": {
        "name": "墙体",
        "primitive": true,
        "style": [
            {
                "name": "diffHeight",
                "label": "墙高",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "走马灯",
                        "value": "WallScroll"
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/arrow.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrowh",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/arrow-h.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "axisY": true
                        }
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "axisY": true
                        }
                    },
                    {
                        "label": "图片fence",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "axisY": true,
                            "color": "#ff0000",
                            "image2": "http://data.mars3d.cn/img/textures/tanhao.png",
                            "color2": "#FFFF00",
                            "outline": false,
                            "diffHeight": 1000,
                            "lastMaterialType": "Image"
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "wall"
    },
    "scrollWall": {
        "name": "走马灯围墙",
        "style": [
            {
                "name": "diffHeight",
                "label": "墙高",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "speed",
                "label": "速度",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "reverse",
                "label": "方向",
                "type": "radio",
                "defval": true
            },
            {
                "name": "style",
                "label": "样式",
                "type": "combobox",
                "defval": 1,
                "data": [
                    {
                        "label": "样式1",
                        "value": 1
                    },
                    {
                        "label": "样式2",
                        "value": 2
                    }
                ]
            }
        ],
        "type": "scrollWall"
    },
    "thickWall": {
        "name": "厚度墙",
        "style": [
            {
                "name": "diffHeight",
                "label": "墙高",
                "type": "number",
                "step": 100,
                "defval": 9999
            },
            {
                "name": "width",
                "label": "墙厚度",
                "type": "number",
                "step": 1,
                "defval": 9999
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "number",
                "step": 0.1,
                "min": 0,
                "max": 1,
                "defval": 1
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "thickWall"
    },
    "diffuseWall": {
        "name": "扩散围墙",
        "style": [
            {
                "name": "diffHeight",
                "label": "墙高",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "speed",
                "label": "速度",
                "type": "number",
                "step": 1,
                "defval": 10
            }
        ],
        "type": "diffuseWall"
    },
    "corridor": {
        "name": "走廊",
        "primitive": true,
        "style": [
            {
                "name": "height",
                "label": "高程",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "width",
                "label": "走廊宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "cornerType",
                "label": "顶点样式",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "圆滑",
                        "value": 0
                    },
                    {
                        "label": "斜接",
                        "value": 1
                    },
                    {
                        "label": "斜切",
                        "value": 2
                    }
                ]
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "corridor"
    },
    "road": {
        "name": "道路",
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "width",
                "label": "路宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "height",
                "label": "路高度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            }
        ],
        "type": "road"
    },
    "rectangle": {
        "name": "矩形",
        "primitive": true,
        "style": [
            {
                "name": "height",
                "label": "高程",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "stRotationDegree",
                "label": "材质角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "rectangle"
    },
    "polygon": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "sector": {
        "name": "扇形面",
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "toFixed": 2,
                "step": 0.1,
                "defval": 0
            },
            {
                "name": "startAngle",
                "label": "开始角度",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "endAngle",
                "label": "结束角度",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "noCenter",
                "label": "不连中心点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "sector"
    },
    "pit": {
        "name": "井",
        "style": [
            {
                "name": "diffHeight",
                "label": "井深度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "splitNum",
                "label": "插值数",
                "type": "number",
                "step": 1,
                "defval": 50
            },
            {
                "name": "image",
                "label": "墙面贴图",
                "type": "label"
            },
            {
                "name": "imageBottom",
                "label": "底面贴图",
                "type": "label"
            }
        ],
        "type": "pit"
    },
    "water": {
        "name": "水面",
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "baseWaterColor",
                "label": "基础颜色",
                "type": "color",
                "defval": "#123e59"
            },
            {
                "name": "blendColor",
                "label": "混合颜色",
                "type": "color",
                "defval": "#123e59"
            },
            {
                "name": "normalMap",
                "label": "反射图片",
                "type": "label",
                "defval": "http://data.mars3d.cn/img/textures/waterNormals.jpg"
            },
            {
                "name": "frequency",
                "label": "波数",
                "type": "number",
                "min": 1,
                "max": 100000,
                "step": 1,
                "defval": 9000
            },
            {
                "name": "amplitude",
                "label": "水波振幅",
                "type": "number",
                "min": 0,
                "max": 100,
                "step": 1,
                "defval": 5
            },
            {
                "name": "animationSpeed",
                "label": "动画速度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.01,
                "defval": 0.03
            },
            {
                "name": "specularIntensity",
                "label": "反射强度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 0.5
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "offsetHeight",
                "label": "偏移高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "water"
    },
    "video": {
        "name": "视频",
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "video"
    },
    "reflectionWater": {
        "name": "反射水面",
        "style": [
            {
                "name": "color",
                "label": "水面颜色",
                "type": "color",
                "defval": "#7badd0"
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 0.9
            },
            {
                "name": "normalMap",
                "label": "水扰动的法线图",
                "type": "label",
                "defval": "http://data.mars3d.cn/img/textures/waterNormals.jpg"
            },
            {
                "name": "reflectivity",
                "label": "反射率",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 0.5
            },
            {
                "name": "ripple",
                "label": "波纹大小",
                "type": "number",
                "min": 0,
                "max": 1000,
                "step": 1,
                "defval": 50
            },
            {
                "name": "shiny",
                "label": "光照强度",
                "type": "number",
                "min": 1,
                "max": 1000,
                "step": 1,
                "defval": 100
            },
            {
                "name": "animationSpeed",
                "label": "动画速度",
                "type": "number",
                "min": 0.1,
                "max": 10,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "specularIntensity",
                "label": "反射强度",
                "type": "slider",
                "min": 0,
                "max": 0.9,
                "step": 0.01,
                "defval": 0.3
            },
            {
                "name": "distortion",
                "label": "倒影扭曲程度",
                "type": "number",
                "min": 0,
                "max": 10,
                "step": 0.1,
                "defval": 3.7
            },
            {
                "name": "farDistance",
                "label": "远距离",
                "type": "number",
                "step": 1,
                "defval": 10000
            },
            {
                "name": "farColor",
                "label": "远距离颜色",
                "type": "color",
                "defval": "#91B3FF"
            }
        ],
        "type": "reflectionWater"
    },
    "labelP": {
        "name": "文字",
        "primitive": true,
        "style": [
            {
                "name": "text",
                "label": "内容",
                "type": "textarea",
                "defval": ""
            },
            {
                "name": "font_family",
                "label": "字体",
                "type": "combobox",
                "defval": "微软雅黑",
                "data": [
                    {
                        "label": "微软雅黑",
                        "value": "微软雅黑"
                    },
                    {
                        "label": "宋体",
                        "value": "宋体"
                    },
                    {
                        "label": "楷体",
                        "value": "楷体"
                    },
                    {
                        "label": "隶书",
                        "value": "隶书"
                    },
                    {
                        "label": "黑体",
                        "value": "黑体"
                    }
                ]
            },
            {
                "name": "font_size",
                "label": "字体大小",
                "type": "number",
                "min": 3,
                "step": 1,
                "defval": 30
            },
            {
                "name": "font_weight",
                "label": "是否加粗",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "bold"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "font_style",
                "label": "是否斜体",
                "type": "combobox",
                "defval": "normal",
                "data": [
                    {
                        "label": "是",
                        "value": "italic"
                    },
                    {
                        "label": "否",
                        "value": "normal"
                    }
                ]
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outline",
                "label": "是否衬色",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineColor",
                "label": "衬色颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outlineWidth",
                "label": "衬色宽度",
                "type": "number",
                "min": 1,
                "max": 5,
                "step": 1,
                "defval": 3
            },
            {
                "name": "background",
                "label": "是否背景",
                "type": "radio",
                "defval": false
            },
            {
                "name": "backgroundColor",
                "label": "背景颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "backgroundPadding",
                "label": "背景内边距",
                "type": "number",
                "step": 1,
                "defval": 5
            },
            {
                "name": "pixelOffsetX",
                "label": "横向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "pixelOffsetY",
                "label": "纵向偏移像素",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "addHeight",
                "label": "偏移高度",
                "type": "number",
                "step": 1,
                "defval": 0
            }
        ],
        "type": "label"
    },
    "pointP": {
        "name": "点标记",
        "primitive": true,
        "style": [
            {
                "name": "pixelSize",
                "label": "像素大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#3388ff"
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": true
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            }
        ],
        "type": "point"
    },
    "billboardP": {
        "name": "图标点标记",
        "primitive": true,
        "extends": [
            "divBillboard",
            "divBillboardP",
            "canvasBillboard"
        ],
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": 1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "image",
                "label": "图标",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "billboard"
    },
    "divBillboard": {
        "name": "图标点标记",
        "primitive": true,
        "extends": [
            "divBillboard",
            "divBillboardP",
            "canvasBillboard"
        ],
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": 1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "image",
                "label": "图标",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "billboard"
    },
    "divBillboardP": {
        "name": "图标点标记",
        "primitive": true,
        "extends": [
            "divBillboard",
            "divBillboardP",
            "canvasBillboard"
        ],
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": 1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "image",
                "label": "图标",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "billboard"
    },
    "canvasBillboard": {
        "name": "图标点标记",
        "primitive": true,
        "extends": [
            "divBillboard",
            "divBillboardP",
            "canvasBillboard"
        ],
        "style": [
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "scale",
                "label": "大小比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "horizontalOrigin",
                "label": "横向对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": 1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直对齐",
                "type": "combobox",
                "valType": "number",
                "defval": 1,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "visibleDepth",
                "label": "是否被遮挡",
                "type": "radio",
                "defval": true
            },
            {
                "name": "image",
                "label": "图标",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "billboard"
    },
    "divBoderLabel": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "divLightPoint": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "divUpLabel": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "popup": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "tooltip": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "divIndicator": {
        "name": "DIV点标记",
        "extends": [
            "divBoderLabel",
            "divLightPoint",
            "divUpLabel",
            "popup",
            "tooltip",
            "divIndicator"
        ],
        "style": [
            {
                "name": "color",
                "label": "颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "boderColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#00ffff"
            },
            {
                "name": "size",
                "label": "大小",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "horizontalOrigin",
                "label": "横向定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "左边",
                        "value": 1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "右边",
                        "value": -1
                    }
                ]
            },
            {
                "name": "verticalOrigin",
                "label": "垂直定位",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "顶部",
                        "value": -1
                    },
                    {
                        "label": "居中",
                        "value": 0
                    },
                    {
                        "label": "底部",
                        "value": 1
                    }
                ]
            },
            {
                "name": "scaleByDistance",
                "label": "是否按视距缩放",
                "type": "radio",
                "defval": false
            },
            {
                "name": "scaleByDistance_far",
                "label": "上限",
                "type": "number",
                "step": 1,
                "defval": 1000000
            },
            {
                "name": "scaleByDistance_farValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 0.1
            },
            {
                "name": "scaleByDistance_near",
                "label": "下限",
                "type": "number",
                "step": 1,
                "defval": 1000
            },
            {
                "name": "scaleByDistance_nearValue",
                "label": "比例值",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "testPoint",
                "label": "是否显示测试点",
                "type": "radio",
                "defval": false
            },
            {
                "name": "html",
                "label": "Html文本",
                "type": "label",
                "defval": ""
            }
        ],
        "type": "div"
    },
    "modelP": {
        "name": "gltf模型",
        "primitive": true,
        "style": [
            {
                "name": "url",
                "label": "路径",
                "type": "label",
                "defval": ""
            },
            {
                "name": "scale",
                "label": "比例",
                "type": "number",
                "step": 1,
                "defval": 1
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "minimumPixelSize",
                "label": "最小像素大小",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "defval": 1,
                "min": 0,
                "max": 1,
                "step": 0.01
            },
            {
                "name": "silhouette",
                "label": "是否轮廓",
                "type": "radio",
                "defval": false
            },
            {
                "name": "silhouetteColor",
                "label": "轮廓颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "silhouetteSize",
                "label": "轮廓宽度",
                "type": "number",
                "step": 1,
                "defval": 2
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "runAnimations",
                "label": "是否动画",
                "type": "radio",
                "defval": true
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": true
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "model"
    },
    "circleP": {
        "name": "圆",
        "primitive": true,
        "style": [
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "height",
                "label": "高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "放大扩散线",
                        "value": "ScanLine"
                    },
                    {
                        "label": "半径扫描",
                        "value": "CircleScan"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "雷达线",
                        "value": "RadarLine"
                    },
                    {
                        "label": "波纹雷达扫描",
                        "value": "RadarWave"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "circle"
    },
    "cylinderP": {
        "name": "圆锥体",
        "primitive": true,
        "extends": [
            "coneTrack",
            "coneTrackP"
        ],
        "style": [
            {
                "name": "topRadius",
                "label": "顶部半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "bottomRadius",
                "label": "底部半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "length",
                "label": "锥体高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "条纹扩散",
                        "value": "CylinderWave"
                    }
                ]
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "step": 1,
                "defval": 128
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "cylinder"
    },
    "coneTrack": {
        "name": "圆锥体",
        "primitive": true,
        "extends": [
            "coneTrack",
            "coneTrackP"
        ],
        "style": [
            {
                "name": "topRadius",
                "label": "顶部半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "bottomRadius",
                "label": "底部半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "length",
                "label": "锥体高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "条纹扩散",
                        "value": "CylinderWave"
                    }
                ]
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "step": 1,
                "defval": 128
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "cylinder"
    },
    "coneTrackP": {
        "name": "圆锥体",
        "primitive": true,
        "extends": [
            "coneTrack",
            "coneTrackP"
        ],
        "style": [
            {
                "name": "topRadius",
                "label": "顶部半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "bottomRadius",
                "label": "底部半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "length",
                "label": "锥体高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "波纹扩散",
                        "value": "CircleWave"
                    },
                    {
                        "label": "条纹扩散",
                        "value": "CylinderWave"
                    }
                ]
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "step": 1,
                "defval": 128
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "cylinder"
    },
    "ellipsoidP": {
        "name": "球体",
        "primitive": true,
        "style": [
            {
                "name": "radii_x",
                "label": "X半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "radii_y",
                "label": "Y半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "radii_z",
                "label": "Z半径",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "innerRadii_x",
                "label": "内部X半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "innerRadii_y",
                "label": "内部Y半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "innerRadii_z",
                "label": "内部Z半径",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "minimumClockDegree",
                "label": "最小时钟角度",
                "type": "number",
                "defval": 0
            },
            {
                "name": "maximumClockDegree",
                "label": "最大时钟角度",
                "type": "number",
                "defval": 360
            },
            {
                "name": "minimumConeDegree",
                "label": "最小锥角",
                "type": "number",
                "defval": 0
            },
            {
                "name": "maximumConeDegree",
                "label": "最大圆锥角",
                "type": "number",
                "defval": 180
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "波纹",
                        "value": "EllipsoidWave"
                    },
                    {
                        "label": "电弧",
                        "value": "EllipsoidElectric"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "ellipsoid"
    },
    "planeP": {
        "name": "平面",
        "primitive": true,
        "style": [
            {
                "name": "dimensions_x",
                "label": "长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "plane_normal",
                "label": "方向",
                "type": "combobox",
                "defval": "z",
                "data": [
                    {
                        "label": "X轴",
                        "value": "x"
                    },
                    {
                        "label": "Y轴",
                        "value": "y"
                    },
                    {
                        "label": "Z轴",
                        "value": "z"
                    }
                ]
            },
            {
                "name": "plane_distance",
                "label": "偏移距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "plane"
    },
    "doubleSidedPlaneP": {
        "name": "双面渲染图片平面",
        "primitive": true,
        "style": [
            {
                "name": "image",
                "label": "填充的图片",
                "type": "label"
            },
            {
                "name": "opacity",
                "label": "透明度",
                "type": "slider",
                "min": 0,
                "max": 1,
                "step": 0.1,
                "defval": 1
            },
            {
                "name": "noWhite",
                "label": "不显示白色",
                "type": "radio",
                "defval": true
            },
            {
                "name": "dimensions_x",
                "label": "长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            }
        ],
        "type": "doubleSidedPlane"
    },
    "boxP": {
        "name": "盒子",
        "primitive": true,
        "style": [
            {
                "name": "dimensions_x",
                "label": "盒子长度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_y",
                "label": "盒子宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "dimensions_z",
                "label": "盒子高度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "heading",
                "label": "方向角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "pitch",
                "label": "俯仰角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "roll",
                "label": "翻滚角",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "box"
    },
    "polylineP": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "curve": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "brushLine": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "distanceMeasure": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "heightMeasure": {
        "name": "线",
        "primitive": true,
        "extends": [
            "curve",
            "brushLine",
            "distanceMeasure",
            "heightMeasure"
        ],
        "style": [
            {
                "name": "width",
                "label": "线宽",
                "type": "number",
                "step": 1,
                "defval": 4
            },
            {
                "name": "materialType",
                "label": "线型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "虚线",
                        "value": "PolylineDash"
                    },
                    {
                        "label": "虚线箭头",
                        "value": "LineDashArrow"
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "箭头",
                        "value": "PolylineArrow"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "OD线",
                        "value": "ODLine"
                    },
                    {
                        "label": "闪烁线",
                        "value": "LineFlicker"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动blue",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动dovetail",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-dovetail.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-right.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动aqua",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-aqua.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动azure",
                        "value": "LineFlow-5",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-azure.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动red",
                        "value": "LineFlow-6",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-red.png",
                            "color": "#ff0000",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动yellow",
                        "value": "LineFlow-7",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#ffff00",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动colour",
                        "value": "LineFlow-8",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-colour.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动gradual",
                        "value": "LineFlow-9",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-gradual.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动pulse",
                        "value": "LineFlow-10",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-pulse.png"
                        }
                    },
                    {
                        "label": "流动sprite",
                        "value": "LineFlow-11",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-sprite.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动tarans",
                        "value": "LineFlow-13",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-tarans.png"
                        }
                    },
                    {
                        "label": "流动vertebral",
                        "value": "LineFlow-14",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动vertebral-blue",
                        "value": "LineFlow-15",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-vertebral-blue.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence-line",
                        "value": "LineFlow-16",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动transarrow",
                        "value": "LineFlow-17",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-arrow-trans.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动天青",
                        "value": "LineFlow-18",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "repeat_x": 1
                        }
                    },
                    {
                        "label": "天青pulse",
                        "value": "LineFlow-19",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/line-color-yellow.png",
                            "color": "#33e8df",
                            "width": 8
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polyline"
    },
    "polylineVolumeP": {
        "name": "管道线",
        "primitive": true,
        "style": [
            {
                "name": "shape",
                "label": "形状",
                "type": "combobox",
                "defval": "pipeline",
                "data": [
                    {
                        "label": "空心管",
                        "value": "pipeline"
                    },
                    {
                        "label": "实心管",
                        "value": "circle"
                    },
                    {
                        "label": "星状管",
                        "value": "star"
                    }
                ]
            },
            {
                "name": "radius",
                "label": "半径",
                "type": "number",
                "step": 1,
                "defval": 10
            },
            {
                "name": "thicknes",
                "label": "厚度",
                "type": "number",
                "step": 1,
                "defval": 3
            },
            {
                "name": "slices",
                "label": "边线边数",
                "type": "number",
                "min": 1,
                "max": 360,
                "step": 1,
                "defval": 90
            },
            {
                "name": "startAngle",
                "label": "开始角度",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.1,
                "defval": 0
            },
            {
                "name": "materialType",
                "label": "材质类型",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "实线",
                        "value": "Color"
                    },
                    {
                        "label": "轨迹线",
                        "value": "LineTrail"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#000000"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "polylineVolume"
    },
    "wallP": {
        "name": "墙体",
        "primitive": true,
        "style": [
            {
                "name": "diffHeight",
                "label": "墙高",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "走马灯",
                        "value": "WallScroll"
                    },
                    {
                        "label": "流动arrow",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/arrow.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动arrowh",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/arrow-h.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-2",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "axisY": true
                        }
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow-3",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "axisY": true
                        }
                    },
                    {
                        "label": "图片fence",
                        "value": "LineFlow-4",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "axisY": true,
                            "color": "#ff0000",
                            "image2": "http://data.mars3d.cn/img/textures/tanhao.png",
                            "color2": "#FFFF00",
                            "outline": false,
                            "diffHeight": 1000,
                            "lastMaterialType": "Image"
                        }
                    }
                ]
            },
            {
                "name": "closure",
                "label": "是否闭合",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            }
        ],
        "type": "wall"
    },
    "corridorP": {
        "name": "走廊",
        "primitive": true,
        "style": [
            {
                "name": "height",
                "label": "高程",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "width",
                "label": "走廊宽度",
                "type": "number",
                "step": 1,
                "defval": 100
            },
            {
                "name": "cornerType",
                "label": "顶点样式",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "圆滑",
                        "value": 0
                    },
                    {
                        "label": "斜接",
                        "value": 1
                    },
                    {
                        "label": "斜切",
                        "value": 2
                    }
                ]
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "corridor"
    },
    "rectangleP": {
        "name": "矩形",
        "primitive": true,
        "style": [
            {
                "name": "height",
                "label": "高程",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    }
                ]
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "rotationDegree",
                "label": "旋转角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "stRotationDegree",
                "label": "材质角度",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "rectangle"
    },
    "polygonP": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "video2D": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "attackArrow": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "attackArrowPW": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "attackArrowYW": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "closeVurve": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "straightArrow": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "doubleArrow": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "fineArrow": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "fineArrowYW": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "areaMeasure": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "gatheringPlace": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "isosTriangle": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "lune": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "regular": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    },
    "parallelogram": {
        "name": "面",
        "primitive": true,
        "extends": [
            "video2D",
            "attackArrow",
            "attackArrowPW",
            "attackArrowYW",
            "closeVurve",
            "straightArrow",
            "doubleArrow",
            "fineArrow",
            "fineArrowYW",
            "areaMeasure",
            "gatheringPlace",
            "isosTriangle",
            "lune",
            "regular",
            "parallelogram"
        ],
        "style": [
            {
                "name": "diffHeight",
                "label": "立体高度",
                "type": "number",
                "step": 1,
                "defval": 0,
                "max": 10000000
            },
            {
                "name": "fill",
                "label": "是否填充",
                "type": "radio",
                "defval": true
            },
            {
                "name": "materialType",
                "label": "填充材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "网格",
                        "value": "Grid"
                    },
                    {
                        "label": "条纹",
                        "value": "Stripe"
                    },
                    {
                        "label": "棋盘",
                        "value": "Checkerboard"
                    },
                    {
                        "label": "文本",
                        "value": "Text"
                    },
                    {
                        "label": "渐变面",
                        "value": "PolyGradient"
                    },
                    {
                        "label": "水面",
                        "value": "Water"
                    },
                    {
                        "label": "蓝光水面",
                        "value": "WaterLight"
                    }
                ]
            },
            {
                "name": "stRotationDegree",
                "label": "填充方向",
                "type": "slider",
                "min": 0,
                "max": 360,
                "step": 0.01,
                "defval": 0
            },
            {
                "name": "outline",
                "label": "是否边框",
                "type": "radio",
                "defval": false
            },
            {
                "name": "outlineWidth",
                "label": "边框宽度",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 1
            },
            {
                "name": "outlineColor",
                "label": "边框颜色",
                "type": "color",
                "defval": "#ffffff"
            },
            // {
            //     "name": "outlineStyle",
            //     "next": "width",
            //     "label": "边框宽度",
            //     "type": "number",
            //     "min": 0,
            //     "step": 1,
            //     "defval": 1,
            //     "contant": "outlineWidth"
            // },
            {
                "name": "outlineStyle",
                "next": "materialType",
                "label": "边框材质",
                "type": "combobox",
                "defval": "Color",
                "data": [
                    {
                        "label": "纯色",
                        "value": "Color",
                        "contant": "outlineColor",
                        "defval": "#fff"
                    },
                    {
                        "label": "十字间隔",
                        "value": "LineCross"
                    },
                    {
                        "label": "图片",
                        "value": "Image",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/map/gugong.jpg"
                        }
                    },
                    {
                        "label": "衬色线",
                        "value": "PolylineOutline"
                    },
                    {
                        "label": "光晕",
                        "value": "PolylineGlow"
                    },
                    {
                        "label": "泛光线",
                        "value": "LineBloom"
                    },
                    {
                        "label": "流动颜色",
                        "value": "LineFlowColor"
                    },
                    {
                        "label": "流动line",
                        "value": "LineFlow",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence-line.png",
                            "repeat_x": 10
                        }
                    },
                    {
                        "label": "流动fence",
                        "value": "LineFlow-1",
                        "defval": {
                            "image": "http://data.mars3d.cn/img/textures/fence.png",
                            "repeat_x": 10
                        }
                    }
                ]
            },
            {
                "name": "distanceDisplayCondition",
                "label": "是否按视距显示",
                "type": "radio",
                "defval": false
            },
            {
                "name": "distanceDisplayCondition_far",
                "label": "最大距离",
                "type": "number",
                "step": 1,
                "defval": 100000
            },
            {
                "name": "distanceDisplayCondition_near",
                "label": "最小距离",
                "type": "number",
                "step": 1,
                "defval": 0
            },
            {
                "name": "hasShadows",
                "label": "是否阴影",
                "type": "radio",
                "defval": false
            },
            {
                "name": "flat",
                "label": "不考虑光照",
                "type": "radio",
                "defval": false
            },
            {
                "name": "arcType",
                "label": "球面弧线规则",
                "type": "combobox",
                "valType": "number",
                "defval": 0,
                "data": [
                    {
                        "label": "空间直线",
                        "value": 0
                    },
                    {
                        "label": "大地弧线",
                        "value": 1
                    },
                    {
                        "label": "方位线",
                        "value": 2
                    }
                ]
            },
            {
                "name": "clampToGround",
                "label": "是否贴地",
                "type": "radio",
                "defval": false
            },
            {
                "name": "zIndex",
                "label": "层级顺序",
                "type": "number",
                "min": 0,
                "step": 1,
                "defval": 0
            }
        ],
        "type": "polygon"
    }
}
export default styleConfig
