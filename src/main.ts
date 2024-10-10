import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router';
import {setupStore} from '@/store/index.ts';

// 引入ElementPlus
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入全局样式
import '@/styles/index.scss';

// 导入proj4投影
import "@/utils/projection"

const app = createApp(App);
// 全局挂载
setupStore(app);
app.use(router);
app.use(ElementPlus, {locale: zhCn});
app.mount('#app');