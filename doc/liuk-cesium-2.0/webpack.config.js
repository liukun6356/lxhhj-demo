const path = require("path");
const webpack = require("webpack");
const MiniCssExtract = require("mini-css-extract-plugin");
const optimizeCss = require("optimize-css-assets-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
var JavaScriptObfuscator = require("webpack-obfuscator");

//写入
var pageinfo = require("./writeVersion.js");

module.exports = function(env) {
  var minimize, jsfilename, cssfilename;
  if (env.min) {
    minimize = true;
    jsfilename = "das3d.js";
    cssfilename = "das3d.css";
  } else {
    minimize = false;
    jsfilename = "das3d-src.js";
    cssfilename = "das3d-src.css";
  }

  var config = {
    mode: "production",
    optimization: {
      minimize: minimize // true 为开启压缩，为了缩短打包时间，一般在开发环境不开启，
    },
    devtool: "none",
    stats: "errors-only",
    entry: "./src/app.js",
    output: {
      library: "das3d",
      libraryTarget: "umd",
      path: path.resolve(__dirname, "dist/das3d"),
      filename: jsfilename
    },
    externals: {
      //依赖的公共包，不一起打包
      cesium: {
        commonjs2: "cesium/Cesium", //if(typeof exports === 'object' && typeof module === 'object')
        amd: "cesium/Cesium", //	else if(typeof define === 'function' && define.amd)
        commonjs: "cesium/Cesium", //else if(typeof exports === 'object')
        root: "Cesium"
      },
      "@turf/turf": {
        commonjs2: "@turf/turf",
        amd: "@turf/turf",
        commonjs: "@turf/turf",
        root: "turf"
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtract.loader, "css-loader"]
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          use: {
            loader: "url-loader",
            options: {
              limit: 1000,
              name: "img/[name].[ext]"
            }
          }
        },
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader"
          }
        },
        {
          test: /\.glsl$/,
          use: {
            loader: "webpack-glsl-loader"
          }
        }
      ]
    },
    plugins: [
      new MiniCssExtract({ filename: cssfilename }),
      new webpack.BannerPlugin({ banner: pageinfo.banner })
    ]
  };

  if (minimize) {
    config.plugins.push(new CleanWebpackPlugin());

    config.plugins.push(
      new optimizeCss({
        cssProcessor: require("cssnano"),
        cssProcessorOptions: { safe: true, discardComments: { removeAll: true } },
        canPrint: true
      })
    );

    //更高级的混淆
    config.plugins.push(
      new JavaScriptObfuscator({
        rotateUnicodeArray: true,
        compact: true, //压缩代码

        controlFlowFlattening: false, //是否启用控制流扁平化(降低1.5倍的运行速度)
        controlFlowFlatteningThreshold: 0.7, //应用概率0-1;在较大的代码库中，建议降低此值，因为大量的控制流转换可能会增加代码的大小并降低代码的速度。

        deadCodeInjection: false, //随机的死代码块(增加了混淆代码的大小)
        deadCodeInjectionThreshold: 0.3, //死代码块的影响概率

        debugProtection: false, //是否禁止使用 F12开发者工具的控制台选项卡，可以用来在线代码的禁止别人调试
        debugProtectionInterval: false, //如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
        disableConsoleOutput: false, //是否禁止使用的console.log，console.info，console.error和console.warn。这使得调试器的使用更加困难。
        domainLock: [], //锁定混淆的源代码，使其仅在特定域和/或子域上运行。这使得某人只需复制并粘贴您的源代码并在其他地方运行就变得非常困难。

        identifierNamesGenerator: "hexadecimal", //设置标识符名称生成器。 hexadecimal(十六进制) mangled(短标识符)
        selfDefending: false, //【如果报错，改为false】使输出代码可抵抗格式设置和变量重命名。如果尝试在混淆后的代码上使用JavaScript美化器，则该代码将无法再使用，从而使其难以理解和修改。

        stringArray: true, //删除字符串文字并将它们放在一个特殊的数组中
        stringArrayEncoding: "base64", //'rc4'   'base64'
        stringArrayThreshold: 0.75,

        transformObjectKeys: false //启用对象键的转换
      })
    );
  }

  return config;
};
