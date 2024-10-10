import * as Cesium from "cesium";
import * as point from "../util/point";
import * as tileset from "../util/tileset";
import * as _util from "../util/util";
import * as daslog from "../util/log";

//默认右键菜单
export function getDefaultContextMenu(viewer) {
  var stages = viewer.scene.postProcessStages;
  var that = {};

  return [
    {
      text: "查看此处坐标",
      iconCls: "fa fa-info-circle",
      visible: function(e) {
        return Cesium.defined(e.position);
      },
      callback: function(e) {
        //经纬度
        var mpt = point.formatPosition(e.position);
        var inhtml = `经度：${mpt.x}, 纬度：${mpt.y}, 高程：${mpt.z}`;
        _util.alert(inhtml, "位置信息");

        //打印方便测试
        var ptX = point.formatNum(e.position.x, 1); //笛卡尔
        var ptY = point.formatNum(e.position.y, 1);
        var ptZ = point.formatNum(e.position.z, 1);

        daslog.log(`经纬度：${mpt.x},${mpt.y},${mpt.z}, 笛卡尔：${ptX},${ptY},${ptZ}`);
      }
    },

    {
      text: "查看当前视角",
      iconCls: "fa fa-camera-retro",
      callback: function(e) {
        var mpt = JSON.stringify(point.getCameraView(viewer));

        //打印方便测试， 说明：可配置到config.json中center参数使用，或调用viewer.das.centerAt(参数)方法
        daslog.log(mpt);

        _util.alert(mpt, "当前视角信息");
      }
    },
    {
      text: "视角切换",
      iconCls: "fa fa-street-view",
      children: [
        {
          text: "绕此处环绕飞行",
          iconCls: "fa fa-retweet",
          visible: function(e) {
            return e.position && !point.windingPoint.isStart;
          },
          callback: function(e) {
            point.windingPoint.start(viewer, e.position);
          }
        },
        {
          text: "关闭环绕飞行",
          iconCls: "fa fa-remove",
          visible: function(e) {
            return point.windingPoint.isStart;
          },
          callback: function(e) {
            point.windingPoint.stop();
          }
        },

        {
          text: "移动到此处",
          iconCls: "fa fa-send-o",
          visible: function(e) {
            return Cesium.defined(e.position);
          },
          callback: function(e) {
            var cameraDistance =
              Cesium.Cartesian3.distance(e.position, viewer.camera.positionWC) * 0.1;

            viewer.das.centerPoint(e.position, {
              radius: cameraDistance, //距离目标点的距离
              maximumHeight: viewer.camera.positionCartographic.height
            });
          }
        },
        {
          text: "第一视角站到此处",
          iconCls: "fa fa-male",
          visible: function(e) {
            return Cesium.defined(e.position);
          },
          callback: function(e) {
            viewer.camera.flyTo({
              destination: point.addPositionsHeight(e.position, 10), //升高10米
              orientation: {
                heading: viewer.camera.heading,
                pitch: 0.0,
                roll: 0.0
              },
              maximumHeight: viewer.camera.positionCartographic.height
            });
          }
        },
        {
          text: "开启键盘漫游",
          iconCls: "fa fa-keyboard-o",
          visible: function(e) {
            return !viewer.das.keyboardRoam.enable;
          },
          callback: function(e) {
            viewer.das.keyboardRoam.enable = true;
          }
        },
        {
          text: "关闭键盘漫游",
          iconCls: "fa fa-keyboard-o",
          visible: function(e) {
            return viewer.das.keyboardRoam.enable;
          },
          callback: function(e) {
            viewer.das.keyboardRoam.enable = false;
          }
        },
        {
          text: "取消锁定",
          iconCls: "fa fa-unlock-alt",
          visible: function(e) {
            return viewer.trackedEntity != undefined;
          },
          callback: function(e) {
            viewer.trackedEntity = undefined;
          }
        }
      ]
    },
    {
      text: "三维模型",
      iconCls: "fa fa-building-o",
      visible: function(e) {
        var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
        return Cesium.defined(model);
      },
      children: [
        {
          text: "显示三角网",
          iconCls: "fa fa-connectdevelop",
          visible: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            return !model.debugWireframe;
          },
          callback: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            model.debugWireframe = true;
          }
        },
        {
          text: "关闭三角网",
          iconCls: "fa fa-connectdevelop",
          visible: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            return model.debugWireframe;
          },
          callback: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            model.debugWireframe = false;
          }
        },
        {
          text: "显示包围盒",
          iconCls: "fa fa-codepen",
          visible: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            return !model.debugShowBoundingVolume;
          },
          callback: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            model.debugShowBoundingVolume = true;
          }
        },
        {
          text: "关闭包围盒",
          iconCls: "fa fa-codepen",
          visible: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            return model.debugShowBoundingVolume;
          },
          callback: function(e) {
            var model = tileset.pick3DTileset(viewer, e.position); //拾取绘制返回的模型
            model.debugShowBoundingVolume = false;
          }
        }
      ]
    },

    {
      text: "地形服务",
      iconCls: "fa fa-globe",
      visible: function(e) {
        return !Cesium.defined(e.target);
      },
      children: [
        {
          text: "开启地形",
          iconCls: "fa fa-medium",
          visible: function(e) {
            return !viewer.das.hasTerrain();
          },
          callback: function(e) {
            viewer.das.updateTerrainProvider(true);
          }
        },
        {
          text: "关闭地形",
          iconCls: "fa fa-medium",
          visible: function(e) {
            return viewer.das.hasTerrain();
          },
          callback: function(e) {
            viewer.das.updateTerrainProvider(false);
          }
        },
        {
          text: "显示三角网",
          iconCls: "fa fa-connectdevelop",
          visible: function(e) {
            return !viewer.scene.globe._surface.tileProvider._debug.wireframe;
          },
          callback: function(e) {
            viewer.scene.globe._surface.tileProvider._debug.wireframe = true;
          }
        },
        {
          text: "关闭三角网",
          iconCls: "fa fa-connectdevelop",
          visible: function(e) {
            return viewer.scene.globe._surface.tileProvider._debug.wireframe;
          },
          callback: function(e) {
            viewer.scene.globe._surface.tileProvider._debug.wireframe = false;
          }
        }
      ]
    },
    {
      text: "图上标记",
      iconCls: "fa fa-eyedropper",
      children: [
        {
          text: "标记点",
          iconCls: "fa fa-map-marker",
          callback: function(e) {
            viewer.das.draw.startDraw({
              type: "point",
              style: {
                pixelSize: 12,
                color: "#3388ff"
              },
              success: function(entity) {
                var positions = viewer.das.draw.getCoordinates(entity);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(positions));
              }
            });
          }
        },
        {
          text: "标记线",
          iconCls: "fa fa-reorder",
          callback: function(e) {
            viewer.das.draw.startDraw({
              type: "polyline",
              style: {
                color: "#55ff33",
                width: 3
              },
              success: function(entity) {
                var positions = viewer.das.draw.getCoordinates(entity);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(positions));
              }
            });
          }
        },
        {
          text: "标记面",
          iconCls: "fa fa-medium",
          callback: function(e) {
            viewer.das.draw.startDraw({
              type: "polygon",
              style: {
                color: "#29cf34",
                opacity: 0.5,
                outline: true,
                outlineWidth: 2.0
              },
              success: function(entity) {
                var positions = viewer.das.draw.getCoordinates(entity);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(positions));
              }
            });
          }
        },
        {
          text: "标记圆",
          iconCls: "fa fa-genderless",
          callback: function(e) {
            viewer.das.draw.startDraw({
              type: "circle",
              style: {
                color: "#ffff00",
                opacity: 0.6
              },
              success: function(entity) {
                var positions = viewer.das.draw.getCoordinates(entity);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(positions));
              }
            });
          }
        },
        {
          text: "标记矩形",
          iconCls: "fa fa-retweet",
          callback: function(e) {
            viewer.das.draw.startDraw({
              type: "rectangle",
              style: {
                color: "#ffff00",
                opacity: 0.6
              },
              success: function(entity) {
                var positions = viewer.das.draw.getCoordinates(entity);
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(positions));
              }
            });
          }
        },
        {
          text: "允许编辑",
          iconCls: "fa fa-pencil",
          visible: function(e) {
            return !viewer.das.draw._hasEdit;
          },
          callback: function(e) {
            viewer.das.draw.hasEdit(true);
          }
        },
        {
          text: "禁止编辑",
          iconCls: "fa fa-pencil-square",
          visible: function(e) {
            return viewer.das.draw._hasEdit;
          },
          callback: function(e) {
            viewer.das.draw.hasEdit(false);
          }
        },
        {
          text: "导出GeoJSON",
          iconCls: "fa fa-file-text-o",
          visible: function(e) {
            return viewer.das.draw.hasDraw();
          },
          callback: function(e) {
            _util.downloadFile("图上标记.json", JSON.stringify(viewer.das.draw.toGeoJSON()));
          }
        },
        {
          text: "清除所有标记",
          iconCls: "fa fa-trash-o",
          visible: function(e) {
            return viewer.das.draw.hasDraw();
          },
          callback: function(e) {
            viewer.das.draw.clearDraw();
          }
        }
      ]
    },
    {
      text: "特效效果",
      iconCls: "fa fa-rss",
      children: [
        {
          text: "开启泛光",
          iconCls: "fa fa-ticket",
          visible: function(e) {
            return !viewer.scene.postProcessStages.bloom.enabled;
          },
          callback: function(e) {
            //加泛光  （参考官方示例: bloom）
            var bloom = viewer.scene.postProcessStages.bloom;
            if (!that.bloom) {
              bloom.enabled = false;
              bloom.uniforms.glowOnly = false;
              bloom.uniforms.contrast = 128;
              bloom.uniforms.brightness = -0.3;
              bloom.uniforms.delta = 1.0;
              bloom.uniforms.sigma = 3.78;
              bloom.uniforms.stepSize = 5.0;

              that.bloom = true;
            }
            bloom.enabled = true;
          }
        },
        {
          text: "关闭泛光",
          iconCls: "fa fa-ticket",
          visible: function(e) {
            return viewer.scene.postProcessStages.bloom.enabled;
          },
          callback: function(e) {
            viewer.scene.postProcessStages.bloom.enabled = false;
          }
        },

        {
          text: "开启亮度",
          iconCls: "fa fa-trello",
          visible: function(e) {
            return !that.BrightnessStage;
          },
          callback: function(e) {
            if (!that.BrightnessStage) {
              that.BrightnessStage = Cesium.PostProcessStageLibrary.createBrightnessStage();
              stages.add(that.BrightnessStage);

              that.BrightnessStage.uniforms.brightness = 2.0;
            }
            that.BrightnessStage.enabled = true;
          }
        },
        {
          text: "关闭亮度",
          iconCls: "fa fa-trello",
          visible: function(e) {
            return that.BrightnessStage;
          },
          callback: function(e) {
            if (that.BrightnessStage) {
              stages.remove(that.BrightnessStage);
              that.BrightnessStage = undefined;
            }
          }
        },

        {
          text: "开启夜视",
          iconCls: "fa fa-dashboard",
          visible: function(e) {
            return !that.NightVisionStage;
          },
          callback: function(e) {
            if (!that.NightVisionStage) {
              that.NightVisionStage = Cesium.PostProcessStageLibrary.createNightVisionStage();
              stages.add(that.NightVisionStage);
            }
            that.NightVisionStage.enabled = true;
          }
        },
        {
          text: "关闭夜视",
          iconCls: "fa fa-dashboard",
          visible: function(e) {
            return that.NightVisionStage;
          },
          callback: function(e) {
            if (that.NightVisionStage) {
              stages.remove(that.NightVisionStage);
              that.NightVisionStage = undefined;
            }
          }
        },

        {
          text: "开启黑白",
          iconCls: "fa fa-star-half-full",
          visible: function(e) {
            return !that.BlackAndWhiteStage;
          },
          callback: function(e) {
            if (!that.BlackAndWhiteStage) {
              that.BlackAndWhiteStage = Cesium.PostProcessStageLibrary.createBlackAndWhiteStage();
              stages.add(that.BlackAndWhiteStage);
            }
            that.BlackAndWhiteStage.enabled = true;
          }
        },
        {
          text: "关闭黑白",
          iconCls: "fa fa-star-half-full",
          visible: function(e) {
            return that.BlackAndWhiteStage;
          },
          callback: function(e) {
            if (that.BlackAndWhiteStage) {
              stages.remove(that.BlackAndWhiteStage);
              that.BlackAndWhiteStage = undefined;
            }
          }
        },

        {
          text: "开启马赛克",
          iconCls: "fa fa-delicious",
          visible: function(e) {
            return !that.MosaicStage;
          },
          callback: function(e) {
            if (!that.MosaicStage) {
              that.MosaicStage = new Cesium.PostProcessStage({
                fragmentShader: `uniform sampler2D colorTexture; 
                                varying vec2 v_textureCoordinates; 
                                const int KERNEL_WIDTH=16; 
                                void main(void) 
                                { 
                                    vec2 step = 1.0 / czm_viewport.zw; 
                                    vec2 integralPos = v_textureCoordinates - mod(v_textureCoordinates, 8.0 * step); 
                                    vec3 averageValue = vec3(0.0); 
                                    for (int i = 0; i < KERNEL_WIDTH; i++) 
                                    { 
                                        for (int j = 0; j < KERNEL_WIDTH; j++) 
                                        { 
                                            averageValue += texture2D(colorTexture, integralPos + step * vec2(i, j)).rgb; 
                                        } 
                                    } 
                                    averageValue /= float(KERNEL_WIDTH * KERNEL_WIDTH); 
                                    gl_FragColor = vec4(averageValue, 1.0); 
                                } `
              });
              stages.add(that.MosaicStage);
            }
            that.MosaicStage.enabled = true;
          }
        },
        {
          text: "关闭马赛克",
          iconCls: "fa fa-delicious",
          visible: function(e) {
            return that.MosaicStage;
          },
          callback: function(e) {
            if (that.MosaicStage) {
              stages.remove(that.MosaicStage);
              that.MosaicStage = undefined;
            }
          }
        },
        {
          text: "开启景深",
          iconCls: "fa fa-simplybuilt",
          visible: function(e) {
            return !that.DepthOfFieldStage;
          },
          callback: function(e) {
            if (!that.DepthOfFieldStage) {
              that.DepthOfFieldStage = Cesium.PostProcessStageLibrary.createDepthOfFieldStage();
              stages.add(that.DepthOfFieldStage);

              var uniforms = that.DepthOfFieldStage.uniforms;
              uniforms.focalDistance = 87; //焦距
              uniforms.delta = 1;
              uniforms.sigma = 3.78;
              uniforms.stepSize = 2.46; //步长
            }
            that.DepthOfFieldStage.enabled = true;
          }
        },
        {
          text: "关闭景深",
          iconCls: "fa fa-simplybuilt",
          visible: function(e) {
            return that.DepthOfFieldStage;
          },
          callback: function(e) {
            if (that.DepthOfFieldStage) {
              stages.remove(that.DepthOfFieldStage);
              that.DepthOfFieldStage = undefined;
            }
          }
        }
      ]
    },
    {
      text: "场景设置",
      iconCls: "fa fa-gear",
      children: [
        {
          text: "开启深度监测",
          iconCls: "fa fa-eye-slash",
          visible: function(e) {
            return !viewer.scene.globe.depthTestAgainstTerrain;
          },
          callback: function(e) {
            viewer.scene.globe.depthTestAgainstTerrain = true;
          }
        },
        {
          text: "关闭深度监测",
          iconCls: "fa fa-eye",
          visible: function(e) {
            return viewer.scene.globe.depthTestAgainstTerrain;
          },
          callback: function(e) {
            viewer.scene.globe.depthTestAgainstTerrain = false;
          }
        },

        {
          text: "显示星空背景",
          iconCls: "fa fa-moon-o",
          visible: function(e) {
            return !viewer.scene.skyBox.show;
          },
          callback: function(e) {
            viewer.scene.skyBox.show = true; //天空盒
            viewer.scene.moon.show = true; //太阳
            viewer.scene.sun.show = true; //月亮
          }
        },
        {
          text: "关闭星空背景",
          iconCls: "fa fa-moon-o",
          visible: function(e) {
            return viewer.scene.skyBox.show;
          },
          callback: function(e) {
            viewer.scene.skyBox.show = false; //天空盒
            viewer.scene.moon.show = false; //太阳
            viewer.scene.sun.show = false; //月亮
          }
        },
        {
          text: "开启日照阴影",
          iconCls: "fa fa-sun-o",
          visible: function(e) {
            return !viewer.shadows;
          },
          callback: function(e) {
            viewer.shadows = true;
            viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
            viewer.scene.globe.enableLighting = true;
          }
        },
        {
          text: "关闭日照阴影",
          iconCls: "fa fa-sun-o",
          visible: function(e) {
            return viewer.shadows;
          },
          callback: function(e) {
            viewer.shadows = false;
            viewer.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY;
            viewer.scene.globe.enableLighting = false;
          }
        },
        {
          text: "开启大气渲染",
          iconCls: "fa fa-soundcloud",
          visible: function(e) {
            return !viewer.scene.skyAtmosphere.show;
          },
          callback: function(e) {
            viewer.scene.skyAtmosphere.show = true;
            viewer.scene.globe.showGroundAtmosphere = true;
          }
        },
        {
          text: "关闭大气渲染",
          iconCls: "fa fa-soundcloud",
          visible: function(e) {
            return viewer.scene.skyAtmosphere.show;
          },
          callback: function(e) {
            viewer.scene.skyAtmosphere.show = false;
            viewer.scene.globe.showGroundAtmosphere = false;
          }
        },

        {
          text: "场景截图",
          iconCls: "fa fa-download",
          callback: function(e) {
            viewer.das.expImage();
          }
        }
      ]
    }
  ];
}
