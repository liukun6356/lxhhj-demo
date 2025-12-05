import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { getTileKey } from 'web/arcgis/supports/tile';
import { blockEvent } from "web/utils/dom";
import { ReprojTile } from "./ReprojTile";
import { ReprojTileLayerView } from "./ReprojTileLayer";
export function createReprojDebug(layerview: ReprojTileLayerView) {
    const class1 = "debug-reproj-container";
    const class2 = "debug-reproj-tile-list";

    const style = document.createElement('style');
    style.innerHTML = `
        .${class1}{
            position:absolute;
            z-index:9999;
            left:0;
            top:0;
            background:white;
            display:flex;
            gap:10px;
            width:auto;
            align-items: flex-start;
        }
        .${class2}{
            position:absolute;
            z-index:9999;
            right:0;
            top:0;
            overflow:auto;
            height:300px;
            background:white;
            padding:10px;
        }
        .${class2} .active {
            box-shadow: 0 0 0 2px red;
        }
    `;
    document.head.appendChild(style);
    const container = document.createElement('div');
    container.classList.add(class1);
    const canvas1 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    const canvas2 = document.createElement('canvas');
    const ctx2 = canvas2.getContext('2d');
    const canvas3 = document.createElement('canvas');
    const ctx3 = canvas3.getContext('2d');
    document.body.appendChild(container);
    container.appendChild(canvas1);
    container.appendChild(canvas2);
    container.appendChild(canvas3);

    const list = document.createElement('div');
    list.classList.add(class2);
    document.body.appendChild(list);

    let lastSelect: HTMLDivElement;
    list.addEventListener('click', e => {
        blockEvent(e);
        if (e.target === lastSelect) return;
        if (e.target === e.currentTarget) return;
        const id = (e.target as HTMLDivElement).dataset.id;
        const [level, row, col, _] = id.split('/').map(i => +i);
        //@ts-ignore
        const item = layerview._cache.get(getTileKey({ level, row, col }));
        item && debugTile(item);
        lastSelect && lastSelect.classList.remove('active');
        lastSelect = e.target as HTMLDivElement;
        lastSelect.classList.add('active');
    });

    const handle = reactiveUtils.watch(() => layerview.effectiveTiles, tiles => {
        list.innerHTML = tiles.map(t => `<div data-id="${t.id}">${t.id}</div>`).join('');
    }, { initial: true });

    //@ts-ignore
    function debugTile({ meshBuffer, tileSize, srcAtlasPixelSize, srcAtlas, _imagebitmap }: ReprojTile) {
        canvas1.width = tileSize[0];
        canvas1.height = tileSize[1];
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
        for (let i = 0; i < meshBuffer.length; i += 12) {
            const x1 = meshBuffer[i];
            const y1 = meshBuffer[i + 1];
            const x2 = meshBuffer[i + 4];
            const y2 = meshBuffer[i + 5];
            const x3 = meshBuffer[i + 8];
            const y3 = meshBuffer[i + 9];
            ctx1.beginPath();
            ctx1.moveTo(...normalizedXYToCanvas([x1, y1], canvas1));
            ctx1.lineTo(...normalizedXYToCanvas([x2, y2], canvas1));
            ctx1.lineTo(...normalizedXYToCanvas([x3, y3], canvas1));
            ctx1.closePath();
            ctx1.stroke();
        }

        canvas2.width = srcAtlasPixelSize[0];
        canvas2.height = srcAtlasPixelSize[1];
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.strokeStyle = 'red';

        for (let key in srcAtlas) {
            const item = srcAtlas[key];
            if (!item.imagebitmap) continue;
            ctx2.drawImage(item.imagebitmap, item.dxdy[0], item.dxdy[1]);
        }

        for (let i = 0; i < meshBuffer.length; i += 12) {
            const u0 = meshBuffer[i + 2];
            const v0 = meshBuffer[i + 3];
            const u1 = meshBuffer[i + 6];
            const v1 = meshBuffer[i + 7];
            const u2 = meshBuffer[i + 10];
            const v2 = meshBuffer[i + 11];
            ctx2.beginPath();
            ctx2.moveTo(...normalizedXYToCanvas([u0, v0], canvas2));
            ctx2.lineTo(...normalizedXYToCanvas([u1, v1], canvas2));
            ctx2.lineTo(...normalizedXYToCanvas([u2, v2], canvas2));
            ctx2.closePath();
            ctx2.stroke();
        }

        if (_imagebitmap) {
            canvas3.width = _imagebitmap.width;
            canvas3.height = _imagebitmap.height;
            ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
            ctx3.drawImage(_imagebitmap, 0, 0);
        }
        function normalizedXYToCanvas(xy: number[], canvas: HTMLCanvasElement) {
            return [
                xy[0] * canvas.width,
                (1 - xy[1]) * canvas.height
            ] as [number, number]
        }
    }
    return {
        destroy() {
            container.remove();
            style.remove();
            list.remove();
            handle.remove();
        }
    }
}