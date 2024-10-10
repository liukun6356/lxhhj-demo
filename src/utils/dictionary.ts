/**
 * @author: liuk
 * @date: 2023/11/7
 * @describe: 逻辑处理函数
 */
import {computed} from 'vue'
// 字典
const dictionarys = computed(() => [])
// [
//   {
//     key: 'type',
//     label: '测站类型',
//     types: ["", "雨量站", "河道站","水库站"]
//   },
// ]


// 导出数据处理函数
export function formatExcelDataArr(val) {
    const arr = JSON.parse(JSON.stringify(val))
    const keys = dictionarys.value.map(item => item.key)
    let key;
    return arr.map(item => {
        Object.entries(item).forEach(([k, v]) => {
                switch (true) {
                    case /time/.test(k):
                        item[k] = formatData(v)
                        break
                    case keys.includes(k):
                        switch (true) {
                            case v === 't':
                                key = 1;
                                break
                            case v === 'f' || v === '/' || !v:
                                key = 0;
                                break
                            case typeof v === 'boolean':
                                key = +v;
                                break
                            default:
                                key = v.toString();
                                break
                        }
                        item[k] = dictionarys.value.find(item => item.key === k).types[key] || '--'
                        break
                    default:
                        item[k] = v || '--'
                        break
                }
            }
        )
        return item
    })
}

// 展示table列表数值函数
export function formatVal(key, val, unit?: string, dictKey?: string, format?: string) {
    dictKey = dictKey?.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())// 下划线转小驼峰
    const temp = dictionarys.value.find(item => item.key === (dictKey || key))
    val = !Number.isNaN(+val) && /\./.test(val) ? (+val).toFixed(2) : val // 保留两位小数
    val = typeof val === 'boolean' ? +val : val
    if (/time/.test(key.toLowerCase())) return val ? moment(val).format(format || 'YYYY/MM/DD HH:00') : '--'
    // if (/time/.test(key)) return formatData(val)
    return temp ? temp.types[val] : val || val === 0 ? val + (unit || '') : '--'
}

// 下拉框
export function formatOptions(key) {
    key = key?.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())// 下划线转小驼峰
    const temp = dictionarys.value.find(item => item.key === key)
    if (!temp) return []
    return Object.entries(temp.types).filter(item => item[1]).map(([k, v]) => ({label: v, value: k}))
}

// 数量校验函数
export const numValidateFn = (str, info) => { // [0.3,1.4]  或   [75，135)
    const temp = str.match(/(\(|\)|\[|\]){1}/g).map(val => {
        switch (val) {
            case '[':
                return '>='
            case ']':
                return '<='
            case '(':
                return '>'
            case ')':
                return '<'
        }
    })
    const numArr = str.replace(/(\(|\)|\[|\]){1}/g, '').split(',').map((item) => /\+∞/g.test(item) ? 1e7 : item.trim())
    return (rule: any, value: any, callback: any) => {
        if (!value) {
            callback()
        } else if (!eval(`value${temp[0] + numArr[0]} && value${temp[1] + numArr[1]}`)) {
            callback(new Error(`${info}应在${str.replace(/\+∞/g, 1e7)}之间`))
        } else {
            callback()
        }
    }
}

// 小数点位数校验函数
export function formatDecimalPoint(digits, info?: string) {
    return function (rule: any, value: any, callback: any) {
        const len = /\./.test(value) ? value.toString().split('.').pop().length : 0
        if (len > digits) {
            switch (true) {
                case digits === 0:
                    callback(new Error(`${info || ''}输入框限制不能输小数`))
                    break
                default:
                    callback(new Error(`${info || ''}最大保留${digits}位小数点位数`))
            }
        } else {
            callback()
        }
    }
}

// 保留两个小数点
export function formatToFixed(val, fractionDights = 1, emptyStr = '--') {
    switch (typeof val) {
        case 'number':
            return Number.isNaN(val) || !Number.isFinite(val) ? emptyStr : val.toFixed(fractionDights)
        case 'string':
            return Number.isNaN(Number(val)) ? emptyStr : Number(val).toFixed(fractionDights)
        default:
            return emptyStr
    }
}

// 获取 时间格式
import moment from "moment";

export function formatData(date, format?: string) {
    if (!Number.isNaN(+date) && date < 1e10) date = date * 1e3
    // if (!Number.isFinite(date)) return '--'
    return date ? moment(date).format(format || 'YYYY-MM-DD HH:mm') : '--'
}

export const copyUrl = (str) => { // 复制链接
    let inputDom = document.createElement('input');  // 创建一个input元素
    inputDom.setAttribute('readonly', 'readonly'); // 防止手机上弹出软键盘
    inputDom.value = str; // 给input元素赋值
    document.body.appendChild(inputDom); // 添加到body
    inputDom.select(); //选中input元素的内容
    document.execCommand('Copy'); // 执行浏览器复制命令
    inputDom.style.display = 'none';
    inputDom.remove(); // 移除input元素
    ElMessage.success('复制到剪贴板成功');
}

// 防抖
export function debounce(fn, delay, timer = null) {
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(this, ...args), delay);
    };
}

// 节流
export const throttle = (fn, delay = 60, info?: string) => {
    let lock = false
    return function (...args) {
        if (lock) {
            info && ElMessage.warning(info)
            return
        }
        fn.apply(this, args)
        lock = true
        setTimeout(() => (lock = false), delay)
    }
}

export const fileExport = async (file: Blob, filename: string) => {
    if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.readAsText(file);
        const errMsg = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
        });
        ElMessage.error(errMsg);
        return;
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// 机组详情，热源详情 历史数据   详见春城正式环境问题75
// 根据时间范围自动修改采样频率 ：小时 - 1分钟（60秒）；天 - 5分钟（5*60=300秒）；周-1小时（60*60=3600秒）；月-1天（24*60*60=86400秒）
export const getTimeFrameRate = (start_time, end_time) => {
    switch (true) {
        case Math.abs(end_time - start_time) <= 24 * 60 * 60://天 - 5分钟（5*60=300秒）
            return {sampling_rate: 5 * 60, format: 'HH:mm'}
        case Math.abs(end_time - start_time) <= 7 * 24 * 60 * 60://周-1小时（60*60=3600秒）
            return {sampling_rate: 60 * 60, format: 'YYYY/MM/DD HH点'}
        default:
            return {sampling_rate: 24 * 60 * 60, format: 'YYYY/MM/DD'}
    }
}

// 坐标转成wkt
import * as turf from '@turf/turf'
import {ElMessage} from "element-plus";

export const toWKTMULTIPOLYGON = (posArr) => {
    const arr = posArr.sort((a, b) => a.lng - b.lng);
    arr[arr.length] = arr[0]
    return JSON.stringify(turf.multiPolygon([[arr]]).geometry)
    // return `{"type":"MultiPolygon","coordinates":[[${JSON.stringify(arr)}]]}`
}

// 笛卡尔3d转4326
export const cartesianToWgs84 = (cartesian) => {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;
    return [longitude, latitude, height]
}

/**
 * @description 生成唯一 uuid
 * @return string
 */
export function generateUUID() {
    if (typeof crypto === 'object') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
            const callback = (c: any) => {
                const num = Number(c);
                return (num ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))).toString(16);
            };
            return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, callback);
        }
    }
    let timestamp = new Date().getTime();
    let performanceNow = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let random = Math.random() * 16;
        if (timestamp > 0) {
            random = (timestamp + random) % 16 | 0;
            timestamp = Math.floor(timestamp / 16);
        } else {
            random = (performanceNow + random) % 16 | 0;
            performanceNow = Math.floor(performanceNow / 16);
        }
        return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
}

// 简化多边形
export const simplifyMULTIPOLYGON = (posArr, properties = {}) => {
    if (posArr.length < 3) return 'null' // 无效多边形
    // 获取中心点
    const enter = turf.center(turf.featureCollection(posArr.map(item => turf.point(item))))
    // 把无序的多边形点，围成一个顺序的面
    const temp = posArr.map(item => ({
        pos: item,
        bearing: turf.bearing(enter, turf.point(item))
    })).sort((a, b) => a.bearing - b.bearing)
    const arr = temp.map(item => item.pos)
    arr[arr.length] = arr[0]
    // 简化多边形
    const geojson = turf.simplify(turf.multiPolygon([[arr]]), {tolerance: 0.005, highQuality: false})
    geojson.properties = properties
    return JSON.stringify(geojson)
}

// 矩阵数据翻转
/*
* | 1 2 3      | 1 4 7
* | 4 5 6  =>  | 2 5 8
* | 7 8 9      | 3 6 9
* */
export const transformMatrix = (original, rows, cols) => {
    if (original.length !== rows * cols) {
        throw new Error('原始数据长度与行列数不匹配');
    }
    const newMatrix = [];
    for (let c = 0; c < cols; c++) { // 遍历每一列
        for (let r = 0; r < rows; r++) { // 遍历每一行
            // 计算原始矩阵的索引
            const originalIndex = r * cols + c;
            // 计算新矩阵的索引
            const newIndex = c * rows + r;
            newMatrix[newIndex] = original[originalIndex];
        }
    }
    return newMatrix;
}

// wkt转成坐标
export const MULTIPOLYGONtoWKT = (position) => {
    return JSON.parse(position).coordinates[0][0]
}
// 获取单位
export const getEquiUnit = (val) => {
    switch (true) {
        case  /温/.test(val):
            return ' ℃'
        case  /补水/.test(val):
            return ' T'
        case  /开度/.test(val):
            return ' °'
        // case  /流量/.test(val):
        //     return ' T'
        case  /压力/.test(val):
            return ' Mpa'
        case  /热量/.test(val):
            return ' GJ'
        case  /排放量/.test(val):
            return ' mg/m³'
        case  /电量/.test(val):
            return ' w'
        case  /频率/.test(val):
            return ' Hz'
        case  /雨/.test(val):
            return 'mm'
        case  /(流量|DDRM)/.test(val):
            return 'm³/s'
        case  /水位/.test(val):
            return 'm'
    }
}

// 树 -> 数组
export const treeToArr = (node) => {
    const nodeToArray = (node, arr) => {
        const {children, ...item} = node
        arr.push(item)
        children && children.forEach(val => nodeToArray(val, arr))
        return arr
    }
    return nodeToArray(node, [])
}
// 数组 -> 树
export const arrToTree = (arr) => {
    if (!Array.isArray(arr) || arr.length < 1) return null
    const [root] = arr.filter(val => val.parentId === 0)
    const addChildren = (node, arrList) => {
        const children = arrList
            .filter(val => val.parentId === node.id)
            .map(val => addChildren(val, arrList))
        return {...node, children}
    }
    return addChildren(root, arr)
}

// 获取当天时间整小时 - n
const getTheHourTime = (h) => {
    const theHourTime = new Date();
    theHourTime.setHours(h)
    theHourTime.setMinutes(0);
    theHourTime.setSeconds(0);
    theHourTime.setMilliseconds(0);
    return theHourTime
}
export const theHourTime = new Date();
theHourTime.setMinutes(0);
theHourTime.setSeconds(0);
theHourTime.setMilliseconds(0);


export const theHourTime0h = new Date();
theHourTime0h.setHours(0)
theHourTime0h.setMinutes(0);
theHourTime0h.setSeconds(0);
theHourTime0h.setMilliseconds(0);

/**
 * 将 HEX 颜色转换为 RGBA 颜色
 * @param {string} hex - HEX 颜色字符串（例如：#RRGGBB 或 #RRGGBBAA）
 * @returns {string} RGBA 颜色字符串（例如：rgba(R, G, B, A)）
 */
// 批量将 HEX 颜色数组转换为 RGBA 颜色数组 --> hexArray.map(hexToRgba);
const hexToRgba = (hex) => {
    // 去掉 HEX 字符串的 #
    hex = hex.replace(/^#/, '');

    let r, g, b, a = 1;

    if (hex.length === 8) { // #RRGGBBAA
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else if (hex.length === 6) { // #RRGGBB
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 4) { // #RGB
        r = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        g = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        b = parseInt(hex.charAt(3) + hex.charAt(3), 16);
    } else if (hex.length === 5) { // #RGBA
        r = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        g = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        b = parseInt(hex.charAt(3) + hex.charAt(3), 16);
        a = parseInt(hex.charAt(4) + hex.charAt(4), 16) / 255;
    } else {
        throw new Error('Invalid HEX color format');
    }

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// 导出逻辑 --------------------------------------------------------------------------
/**
 * 将json数据导出为excel
 * @param {object} options
 * @param {[]} data 数据源 // {'供热系统': "大唐热电供热系统", '供热面积(万m²)': 34.099, '分布式水泵数量': 0, '当前供热系统': "大唐热电供热系统"}
 * @param {string} fileName 文件名称
 * @param [] keySort  字段排序 // ['供热系统', '供热面积(万m²)', '分布式水泵数量','当前供热系统']
 * @param {string} sheetName sheet名称
 * @param {boolean} titleNum 表头数
 */
import XLSXStyle from "xlsx-style-vite" //"^0.0.2"
import FileSaver from "file-saver";// "^2.0.5"
import * as XLSX from "xlsx";//"^0.17.0",

export const exportToExcel = (data, fileName, keySort, sheetName = "sheet1", titleNum = 1) => {
    // const sheet = XLSX.utils.json_to_sheet(data)
    const temp = data.map(item => {
        const arr = []
        keySort.forEach(k => arr.push(item[k]))
        return arr
    })
    temp.unshift(keySort)
    const sheet = XLSX.utils.aoa_to_sheet(temp)
    const wb = {
        SheetNames: [sheetName],
        Sheets: {
            [sheetName]: sheet
        }
    }
    const range = XLSX.utils.decode_range(wb.Sheets[sheetName]['!ref']);
    //单元格边框样式
    const borderStyle = {
        top: {
            style: "thin",
            color: {rgb: "000000"}
        },
        bottom: {
            style: "thin",
            color: {rgb: "000000"}
        },
        left: {
            style: "thin",
            color: {rgb: "000000"}
        },
        right: {
            style: "thin",
            color: {rgb: "000000"}
        }
    };
    const cWidth = [];
    for (let C = range.s.c; C < range.e.c + 1; ++C) {   //SHEET列
        let len = 100; //默认列宽
        const len_max = 400; //最大列宽
        for (let R = range.s.r; R <= range.e.r; ++R) {  //SHEET行
            const cell = {c: C, r: R};                    //二维 列行确定一个单元格
            const cell_ref = XLSX.utils.encode_cell(cell);  //单元格 A1、A2
            if (wb.Sheets[sheetName][cell_ref]) {
                if (R < titleNum) {
                    wb.Sheets[sheetName][cell_ref].s = {  //设置第一行单元格的样式 style
                        font: {
                            sz: 14, // 标题字号
                            color: {rgb: '060B0E'},// 颜色
                            bold: true//加粗
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        fill: {
                            fgColor: {rgb: 'E4E4E4'}, // 背景
                        },
                        border: borderStyle,//用上面定义好的边框样式
                    };
                } else {
                    wb.Sheets[sheetName][cell_ref].s = {
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        border: borderStyle,//用上面定义好的边框样式
                    };
                }
                //动态自适应：计算列宽
                const va = JSON.parse(JSON.stringify(wb.Sheets[sheetName][cell_ref].v || ''));
                const card1 = JSON.parse(JSON.stringify(va.toString())).match(/[\u4e00-\u9fa5]/g); //匹配中文
                let card11 = "";
                if (card1) card11 = card1.join("")
                const card2 = JSON.parse(JSON.stringify(va.toString())).replace(/([^\u0000-\u00FF])/g, "");  //剔除中文
                let st = 0;
                if (card11) st += card11.length * 20  //中文字节码长度
                if (card2) st += card2.length * 10  //非中文字节码长度
                if (st > len) len = st;
            }
        }
        cWidth.push({'wpx': len > len_max ? len_max : len});     //列宽
    }
    wb.Sheets[sheetName]['!cols'] = cWidth;
    const wopts = {bookType: 'xlsx', bookSST: false, type: 'binary'};
    const wbout = XLSXStyle.write(wb, wopts); //一定要用XLSXStyle不要用XLSX，XLSX是没有格式的！
    FileSaver(new Blob([s2ab(wbout)], {type: ""}), fileName + '.xlsx');

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
}

/**
 * 将table导出为excel
 * @param {object} options
 * @param {[]} table 表格元素
 * @param {string} fileName 文件名称
 * @param {string} sheetName sheet名称
 * @param {boolean} titleNum 表头数
 */
export const exportTableToExcel = (dom, fileName, sheetName = "sheet1", titleNum = 1) => {
    const wb = XLSX.utils.table_to_book(dom, {sheet: sheetName, raw: true});
    const range = XLSX.utils.decode_range(wb.Sheets[sheetName]['!ref']);
    //单元格边框样式
    const borderStyle = {
        top: {
            style: "thin",
            color: {rgb: "000000"}
        },
        bottom: {
            style: "thin",
            color: {rgb: "000000"}
        },
        left: {
            style: "thin",
            color: {rgb: "000000"}
        },
        right: {
            style: "thin",
            color: {rgb: "000000"}
        }
    };
    const cWidth = [];
    for (let C = range.s.c; C < range.e.c + 1; ++C) {   //SHEET列
        let len = 100; //默认列宽
        const len_max = 400; //最大列宽
        for (let R = range.s.r; R <= range.e.r; ++R) {  //SHEET行
            const cell = {c: C, r: R};                    //二维 列行确定一个单元格
            const cell_ref = XLSX.utils.encode_cell(cell);  //单元格 A1、A2
            if (wb.Sheets[sheetName][cell_ref]) {
                // if (R == 0){
                if (R < titleNum) {
                    wb.Sheets[sheetName][cell_ref].s = {  //设置第一行单元格的样式 style
                        font: {
                            sz: 14,
                            color: {rgb: '060B0E'},
                            bold: true
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        fill: {
                            fgColor: {rgb: 'E4E4E4'},
                        },
                        border: borderStyle,//用上面定义好的边框样式
                    };
                } else {
                    wb.Sheets[sheetName][cell_ref].s = {
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center',
                        },
                        border: borderStyle,//用上面定义好的边框样式
                    };
                }
                //动态自适应：计算列宽
                const va = JSON.parse(JSON.stringify(wb.Sheets[sheetName][cell_ref].v || ''));
                const card1 = JSON.parse(JSON.stringify(va.toString())).match(/[\u4e00-\u9fa5]/g); //匹配中文
                let card11 = "";
                if (card1) {
                    card11 = card1.join("")
                }
                const card2 = JSON.parse(JSON.stringify(va.toString())).replace(/([^\u0000-\u00FF])/g, "");  //剔除中文
                let st = 0;
                if (card11) {
                    st += card11.length * 20  //中文字节码长度
                }
                if (card2) {
                    st += card2.length * 10  //非中文字节码长度
                }
                if (st > len) {
                    len = st;
                }
            }
        }
        if (len > len_max) {//最大宽度
            len = len_max;
        }
        cWidth.push({'wpx': len});     //列宽
    }
    wb.Sheets[sheetName]['!cols'] = cWidth.slice(1, -1);
    // 删除列-----重点-----0就是第一列。。
    // wb.Sheets[sheetName]['!cols'][0] = {hidden: true}
    deleteCol(wb.Sheets[sheetName], 0)
    deleteCol(wb.Sheets[sheetName], cWidth.length - 1)
    // 合并列
    // wb.Sheets[sheetName]["!merges"] = [
    //   {  //合并A1A2单元格
    //     s: {//s为开始
    //       c: 0,//开始列
    //       r: 0//开始取值范围
    //     },
    //     e: {//e结束
    //       c: 1,//结束列
    //       r: 0//结束范围
    //     }
    //   }
    // ]
    const wopts = {bookType: 'xlsx', bookSST: false, type: 'binary'};
    const wbout = XLSXStyle.write(wb, wopts); //一定要用XLSXStyle不要用XLSX，XLSX是没有格式的！
    FileSaver(new Blob([s2ab(wbout)], {type: ""}), fileName + '.xlsx');

    function encodeCell(r, c) {
        return XLSX.utils.encode_cell({r, c});
    }

    // 删除行
    function deleteRow(ws, index) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let row = index; row < range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                ws[encodeCell(row, col)] = ws[encodeCell(row + 1, col)];
            }
        }
        range.e.r--;
        ws['!ref'] = XLSX.utils.encode_range(range.s, range.e);
    }

    // 删除列
    function deleteCol(ws, index) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let col = index; col < range.e.c; col++) {
            for (let row = range.s.r; row <= range.e.r; row++) {
                ws[encodeCell(row, col)] = ws[encodeCell(row, col + 1)];
            }
        }
        range.e.c--;
        ws['!ref'] = XLSX.utils.encode_range(range.s, range.e);
    }

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
}
