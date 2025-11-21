<!--概化图-->
<template>
  <div class="monitorEChart_wrap">
    <div class="top_full">
      <el-icon :size="18" :color="'#fff'" @click="visibleFullDiagram = true">
        <FullScreen/>
      </el-icon>
      <el-icon style="margin-left: 20px" :size="18" :color="'#fff'" @click="emit('close')">
        <Close/>
      </el-icon>
    </div>
    <div class="img"></div>
    <Teleport to="body">
      <Transition name="diagram">
        <div class="fullDiagram_wrap" v-if="visibleFullDiagram">
          <div class="top_close_full">
            <el-icon :size="26" :color="'#fff'" @click="visibleFullDiagram = false">
              <CloseBold/>
            </el-icon>
          </div>
          <div class="full_img">
            <img class="full_img_png" src="@/assets/images/cesiumMap/fullImg@2x.png">
            <div class="full_img_content">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">四清</div>
                <div class="twoTitile titilep">{{ getHardCoded('四清','水库站').value1 }} m</div>
                <div :class="[ getHardCoded('四清','水库站').value2 > 0 ? 'threeTitile' : 'threeTitile1','titilep']">{{ getHardCoded('四清','水库站').value2 }} m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/icons/2d/reservoir-1@2x.png" alt="" width="50" height="50"/>
              </div>
            </div>
            <div class="full_img_contentTwo">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">仙岭</div>
                <div class="twoTitile titilep">{{ getHardCoded('仙岭','水库站').value1}}m</div>
                <div :class="[ getHardCoded('仙岭','水库站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{getHardCoded('仙岭','水库站').value2}}m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/icons/2d/reservoir-1@2x.png" alt="" width="50" height="50"/>
              </div>
            </div>
            <div class="full_img_contentThree">
              <div>
                <img src="@/assets/images/cesiumMap/icons/2d/reservoir-1@2x.png" alt="" width="50" height="50"/>
              </div>
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">江源</div>
                <div class="twoTitile titilep">{{  getHardCoded('江源','水库站').value1 }}m</div>
                <div :class="[ getHardCoded('江源','水库站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('江源','水库站').value2
                  }}m
                </div>
              </div>
            </div>
            <div class="full_img_contentFour">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">高峰</div>
                <div class="twoTitile titilep">{{ getHardCoded('高峰','水库站').value1 }}m</div>
                <div :class="[getHardCoded('高峰','水库站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('高峰','水库站').value2
                  }}m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/icons/2d/reservoir-1@2x.png" alt="" width="50" height="50"/>
              </div>
            </div>

            <div class="full_img_contentFive">
              <div class="full_img_content_img">
                <img src="@/assets/images/cesiumMap/swz1.png" alt="" width="10" height="30"/>
              </div>
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">坳上</div>
                <div class="twoTitile titilep">{{ getHardCoded('坳上','河道站').value1 }}m</div>
                <div :class="[ getHardCoded('坳上','河道站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('坳上','河道站').value2
                  }}m
                </div>
              </div>
            </div>
            <div class="full_img_contentSix">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">坳上</div>
                <div class="twoTitile titilep">{{ getHardCoded('坳上','视频站').value1 }}m</div>
                <div :class="[ getHardCoded('坳上','视频站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('坳上','视频站').value2
                  }}m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/swz.png" alt="" width="10" height="30"/>
              </div>
            </div>
            <div class="full_img_contentSeven">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">海泉</div>
                <div class="twoTitile titilep">{{ getHardCoded('海泉','河道站').value1  }}m</div>
                <div :class="[ getHardCoded('海泉','河道站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('海泉','河道站').value2
                  }}m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/swz1.png" alt="" width="10" height="30"/>
              </div>
            </div>
            <div class="full_img_contentEight">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">燕泉河</div>
                <div class="twoTitile titilep">{{ getHardCoded('燕泉河','视频站').value1 }}m</div>
                <div :class="[ getHardCoded('燕泉河','视频站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('燕泉河','视频站').value2
                  }}m
                </div>
              </div>
              <div class="full_img_content_img">
                <img src="@/assets/images/cesiumMap/swz.png" alt="" width="10" height="30"/>
              </div>
            </div>
            <div class="full_img_contentNine">
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">郴州</div>
                <div class="twoTitile titilep">{{ getHardCoded('郴州','视频站').value1 }}m</div>
                <div :class="[ getHardCoded('郴州','视频站').value2 > 0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('郴州','视频站').value2
                  }}m
                </div>
              </div>
              <div>
                <img src="@/assets/images/cesiumMap/swz.png" alt="" width="10" height="30"/>
              </div>
            </div>
            <div class="full_img_contentNine2">
              <div class="full_img_content_img">
                <img src="@/assets/images/cesiumMap/swz.png" alt="" width="10" height="30"/>
              </div>
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">郴州</div>
                <div class="twoTitile titilep">{{ getHardCoded('郴州','河道站').value1 }}m</div>
                <div :class="[ getHardCoded('郴州','河道站').value2 >0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('郴州','河道站').value2
                  }}m
                </div>
              </div>
            </div>
            <div class="full_img_content11">
              <div class="full_img_content_img">
                <img src="@/assets/images/cesiumMap/swz.png" alt="" width="10" height="30"/>
              </div>
              <div class="full_img_content_oneTitile">
                <div class="oneTitile titilep">鸡嘴桥</div>
                <div class="twoTitile titilep">{{ getHardCoded('鸡嘴桥','视频站').value1 }}m</div>
                <div :class="[ getHardCoded('鸡嘴桥','视频站').value2>0 ? 'threeTitile' : 'threeTitile1','titilep']">{{
                    getHardCoded('鸡嘴桥','视频站').value2
                  }}m
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, toRefs} from 'vue';
import {} from "@/api/cesiumMap";
import moment from "moment";
// import {getSelectReservoirDataNew, getSelectRiverwayDataNew, getSelectVideoDataNew} from "@/api/cesiumMap";

// Emits
const emit = defineEmits(['close'])

const model = reactive({
  visibleFullDiagram: false,
  hardCodedList:[]
})
const {visibleFullDiagram} = toRefs(model)

onMounted(() => {
  getlist();
})

const getlist = async () => {
  const params = {
    isNoDataStation: true
  }
  // const {data: data1} = await getSelectReservoirDataNew(params)
  // const {data: data2} = await getSelectRiverwayDataNew(params)
  // const {data: data3} = await getSelectVideoDataNew(params)
  const temp =[
    {id: "5aed44c0507811efa44d0242ac110002", label: "仙岭", type: "水库站", value1: 1,value2:11},
    {id: "5aed65cb507811efa44d0242ac110002", label: "四清", type: "水库站", value1: 2,value2:1},
    {id: "5aed8fd2507811efa44d0242ac110002", label: "高峰", type: "水库站", value1: 3,value2:13},
    {id: "5aedae1e507811efa44d0242ac110002", label: "江源", type: "水库站", value1: 4,value2:14},
    {id: "7529ffc3507d11efa44d0242ac110002", label: "郴州", type: "河道站", value1: 5,value2:15},
    {id: "752a5741507d11efa44d0242ac110002", label: "坳上", type: "河道站", value1: 6,value2:16},
    {id: "752a7a02507d11efa44d0242ac110002", label: "海泉", type: "河道站", value1: 7,value2:17},
    {id: "379732d4508111efa44d0242ac110002", label: "郴州", type: "视频站", value1: 8,value2:18},
    {id: "3797781a508111efa44d0242ac110002", label: "坳上", type: "视频站", value1: 9,value2:19},
    {id: "3797b7d6508111efa44d0242ac110002", label: "燕泉河", type: "视频站", value1: 10,value2:110},
    {id: "3797dbdc508111efa44d0242ac110002", label: "鸡嘴桥", type: "视频站", value1: 11,value2:111}
  ]
  // const data = [...data1,...data2,...data3]
  // data.forEach(item=>{
  //   const index = temp.findIndex(x=>x.id === item.id)
  //   temp[index] = [...temp[index],item]
  // })
  model.hardCodedList = temp || []
}

const getHardCoded = (label, type) => model.hardCodedList.find(item => item.label === label && item.type === type) || {value1:'--', value2:'--',}
</script>

<style scoped lang="scss">
.monitorEChart_wrap {
  z-index: 1000;
  position: absolute;
  width: 50%;
  height: 330px;
  left: 50%;
  transform: translateX(-50%);
  bottom: 5%;
  padding: 20px;
  background: rgb(0, 0, 0, 0.8);
  border-radius: 4px;
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;

  .top_full {
    text-align: right;
    padding-right: 10px;

    i {
      cursor: pointer;
    }
  }

  .img {
    flex-grow: 1;
    overflow: hidden;
    width: 100%;
    background-image: url("@/assets/images/cesiumMap/img.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
}

.fullDiagram_wrap {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background: rgb(0, 0, 0, 0.8);
  border-radius: 4px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 10000;

  .top_close_full {
    text-align: right;

    i {
      cursor: pointer;
    }
  }

  .full_img {
    position: relative;
    width: 100%;
    height: 800px;
    margin-top: -80px;
    margin-left: -24px;
    transform: translate(0%, 20%);
    text-align: center;
    z-index: 0;
    user-select: none;

    .full_img_png {
      //width: calc(100vw - 6vw);
      transform: translate(-50%, -49%);
      width: calc(100vw - 6vw);
      position: absolute;
      left: 50%;
      top: 50%;
    }

    .full_img_content {
      position: absolute;
      left: 20.5%;
      top: 2.5%;

      .full_img_content_oneTitile {
        display: flex;

        .titilep {
          padding: 5px 5px 0px 5px;
          line-height: 30px;
        }


      }
    }

    .full_img_contentTwo {
      position: absolute;
      left: 20.6%;
      top: 15.5%;

      .full_img_content_oneTitile {
        display: flex;

        .titilep {
          padding: 5px 5px 0px 5px;
          line-height: 30px;
        }
      }
    }

    .full_img_contentThree {
      position: absolute;
      left: 13.8%;
      top: 35.0%;

    }

    .full_img_contentFour {
      position: absolute;
      left: 83.9%;
      top: 50%;
      display: flex;
    }

    .full_img_contentFive {
      position: absolute;
      left: 21%;
      top: 39%;
      text-align: center;

      .full_img_content_img {
        transform: rotate(180deg);
      }
    }

    .full_img_contentSix {
      position: absolute;
      left: 21%;
      top: 26%;
      text-align: center;
    }

    .full_img_contentSeven {
      position: absolute;
      left: 36%;
      top: 26%;
      text-align: center;

    }

    .full_img_contentEight {
      position: absolute;
      left: 46%;
      top: 26%;
      text-align: center;
      display: flex;

      .full_img_content_img {
        transform: rotate(270deg);
        margin-left: 50px;
        margin-top: -40px;
      }
    }

    .full_img_contentNine {
      position: absolute;
      left: 57%;
      top: 26%;
      text-align: center;

    }

    .full_img_contentNine2 {
      position: absolute;
      left: 57%;
      top: 39%;
      text-align: center;

      .full_img_content_img {
        transform: rotate(180deg);
      }
    }

    .full_img_contentTen {
      position: absolute;
      left: 65%;
      top: 27%;
      text-align: center;

    }

    .full_img_content11 {
      position: absolute;
      left: 71%;
      top: 27%;
      text-align: center;
      display: flex;

      .full_img_content_img {
        transform: rotate(-270deg);
        margin-right: 50px;
        margin-top: -40px;
      }
    }

    .full_img_content12 {
      position: absolute;
      left: 80%;
      top: 27%;
      text-align: center;
    }

    .oneTitile {
      font-size: 20px;
      color: #2EA5FF;
      font-family: SourceHanSansCN-Bold, SourceHanSansCN;
      font-weight: bold;
    }

    .twoTitile {
      font-size: 14px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #FFFFFF;
    }

    .threeTitile {
      font-size: 14px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #FF0000;
    }

    .threeTitile1 {
      font-size: 14px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #03FF00;
    }
  }
}
</style>