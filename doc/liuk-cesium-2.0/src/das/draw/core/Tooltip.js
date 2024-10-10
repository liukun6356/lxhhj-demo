import { zepto as $ } from "../../util/zepto";

export class Tooltip {
  //========== 构造方法 ==========
  constructor(frameDiv) {
    var div = document.createElement("DIV");
    div.className = "das3d-draw-tooltip right";

    var arrow = document.createElement("DIV");
    arrow.className = "das3d-draw-tooltip-arrow";
    div.appendChild(arrow);

    var title = document.createElement("DIV");
    title.className = "das3d-draw-tooltip-inner";
    div.appendChild(title);

    this._div = div;
    this._title = title;

    // add to frame div and display coordinates
    frameDiv.appendChild(div);

    //鼠标的移入
    $(".das3d-draw-tooltip").mouseover(function() {
      $(this).hide();
    });
  }

  setVisible(visible) {
    this._div.style.display = visible ? "block" : "none";
  }

  showAt(position, message) {
    if (position && message) {
      this.setVisible(true);

      this._title.innerHTML = message;
      this._div.style.top = position.y - this._div.clientHeight / 2 + "px";

      //left css时
      //this._div.style.left = (position.x - this._div.clientWidth - 30) + "px";

      //right css时
      this._div.style.left = position.x + 30 + "px";
    } else {
      this.setVisible(false);
    }
  }

  destroy(visible) {
    this.setVisible(false);
    $(this._div).remove();
  }
}

//样式文件在map.css
export var message = {
  draw: {
    point: {
      start: "单击 完成绘制"
    },
    polyline: {
      //线面
      start: "单击 开始绘制",
      cont: "单击增加点，右击删除点",
      end: "单击增加点，右击删除点<br/>双击完成绘制",
      end2: "单击完成绘制"
    }
  },
  edit: {
    start: "单击后 激活编辑<br/>右击 单击菜单删除",
    end: "释放后 完成修改"
  },
  dragger: {
    def: "拖动该点后<br/>修改位置 ", //默认
    moveAll: "拖动该点后<br/>整体平移",
    addMidPoint: "拖动该点后<br/>增加点",
    moveHeight: "拖动该点后<br/>修改高度",
    editRadius: "拖动该点后<br/>修改半径",
    editHeading: "拖动该点后<br/>修改方向",
    editScale: "拖动该点后<br/>修改缩放比例"
  },
  del: {
    def: "<br/>右击 删除该点",
    min: "无法删除，点数量不能少于"
  }
};
