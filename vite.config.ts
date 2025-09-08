import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import {terser} from 'rollup-plugin-terser';
import vitePluginMars3d from "vite-plugin-mars3d"
import glsl from 'vite-plugin-glsl';
import cesium from "vite-plugin-cesium";

// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
        include: ['simplex-noise', '@tweenjs/tween.js'], // 强制包含 simplex-noise
    },
    plugins: [
        vue(),
        vitePluginMars3d(),
        // glsl(),
        cesium()
    ],
    worker: {format: 'es'},
    resolve: {// Vite路径别名配置
        alias: {
            '@': path.resolve('./src'),
        },
    },
    server: {// 本地环境配置   ---- 打包与这无关！！！
        host: true,
        port: 60219,
        open: true, // 运行自动打开浏览器
        proxy: {// 本地反向代理解决浏览器跨域限制
            "/dev-api": {
                target: "http://192.168.40.54:8081/slf",// 联调环境(fixed)
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/dev-api/, ""),
            },
            "/geoserve-api": {
                target: "http://192.168.30.50:8089", // dsy内网geoserver地址
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/geoserve-api/, ""),
            },
            "/modelview-api":{
                target: "http://127.0.0.1:6060/modelView", // dsy内网geoserver地址
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/modelview-api/, ""),
            },
            "/modelData-api":{
                target: "http://127.0.0.1:6060/modelData", // dsy内网geoserver地址
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/modelData-api/, ""),
            },
        },
    },
    build: { // 打包配置
        chunkSizeWarningLimit: 1500,// chunk 大小警告的限制
        rollupOptions: {
            plugins: [
                // 使用 terser 插件压缩代码
                terser({
                    compress: {
                        drop_console: true// 去除 console.log 输出
                    }
                }),
            ],
        }
    }
})
