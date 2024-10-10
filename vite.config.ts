import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import {terser} from 'rollup-plugin-terser';
import vitePluginMars3d from "vite-plugin-mars3d"
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vitePluginMars3d(),
        glsl(),
    ],

    resolve: {// Vite路径别名配置
        alias: {
            '@': path.resolve('./src'),
        },
    },
    server: {// 本地环境配置   ---- 打包与这无关！！！
        host: true,
        port: 60219,
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
