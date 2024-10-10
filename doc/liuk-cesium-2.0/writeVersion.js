//获取当前库的相关基本信息,并写入version文件

const fs = require("fs");
const packageinfo = require("./package.json");

Date.prototype.format = function(fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
    "H+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
};

//============写入SDK的版本信息及打包时间=============
//当前时间
var update = new Date().format("yyyy-M-d HH:mm:ss");

var content = `//当前版本  2020年10月1日 - 至今
export const version = "${packageinfo.version}";
//发布时间
export const update = "${update}";
`;

fs.writeFile("./src/version.js", content, error => {
  // eslint-disable-next-line no-console
  if (error) console.log("version写入失败,原因是" + error.message);
  // eslint-disable-next-line no-console
  else console.log("写入成功");
});

//============输出SDK相关banner注释信息=============

exports.banner = `${packageinfo.description}
版本信息：v${packageinfo.version}, hash值: [hash]
编译日期：${update}
版权所有：Copyright by 大势智慧 ${packageinfo.homepage}
`;
