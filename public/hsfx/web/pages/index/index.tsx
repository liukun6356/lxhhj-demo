import 'element-plus/dist/index.css';
import { getGlobalCtx } from "./global";
import './style.scss';
import { loadTuflow } from './result';

getGlobalCtx();
const caseName = new URL(location.href).searchParams.get('case');
caseName && loadTuflow(caseName);