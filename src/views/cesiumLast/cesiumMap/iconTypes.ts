import rain2d1 from "@/assets/images/cesiumMap/icons/2d/rain1@2x.png"
import rain2d2 from "@/assets/images/cesiumMap/icons/2d/rain2@2x.png"
import rain2d3 from "@/assets/images/cesiumMap/icons/2d/rain3@2x.png"
import rain2d4 from "@/assets/images/cesiumMap/icons/2d/rain4@2x.png"
import rain2d5 from "@/assets/images/cesiumMap/icons/2d/rain5@2x.png"
import rain2d6 from "@/assets/images/cesiumMap/icons/2d/rain6@2x.png"
import rain2d7 from "@/assets/images/cesiumMap/icons/2d/rain7@2x.png"
import rain3d1 from "@/assets/images/cesiumMap/icons/3d/rain1@2x.png"
import rain3d2 from "@/assets/images/cesiumMap/icons/3d/rain2@2x.png"
import rain3d3 from "@/assets/images/cesiumMap/icons/3d/rain3@2x.png"
import rain3d4 from "@/assets/images/cesiumMap/icons/3d/rain4@2x.png"
import rain3d5 from "@/assets/images/cesiumMap/icons/3d/rain5@2x.png"
import rain3d6 from "@/assets/images/cesiumMap/icons/3d/rain6@2x.png"
import rain3d7 from "@/assets/images/cesiumMap/icons/3d/rain7@2x.png"

import river2d1 from "@/assets/images/cesiumMap/icons/2d/river-1@2x.png"
import river2d2 from "@/assets/images/cesiumMap/icons/2d/river-2@2x.png"
import river2d3 from "@/assets/images/cesiumMap/icons/2d/river-3@2x.png"
import river2d4 from "@/assets/images/cesiumMap/icons/2d/river-4@2x.png"
import river3d1 from "@/assets/images/cesiumMap/icons/3d/river-1@2x.png"
import river3d2 from "@/assets/images/cesiumMap/icons/3d/river-2@2x.png"
import river3d3 from "@/assets/images/cesiumMap/icons/3d/river-3@2x.png"
import river3d4 from "@/assets/images/cesiumMap/icons/3d/river-4@2x.png"
import riverBoard1 from "@/assets/images/cesiumMap/icons/board/river-1.png"
import riverBoard2 from "@/assets/images/cesiumMap/icons/board/river-2.png"

import reservoir2d1 from "@/assets/images/cesiumMap/icons/2d/reservoir-1@2x.png"
import reservoir2d2 from "@/assets/images/cesiumMap/icons/2d/reservoir-2@2x.png"
import reservoir2d3 from "@/assets/images/cesiumMap/icons/2d/reservoir-3@2x.png"
import reservoir2d4 from "@/assets/images/cesiumMap/icons/2d/reservoir-4@2x.png"
import reservoir3d1 from "@/assets/images/cesiumMap/icons/3d/reservoir-1@2x.png"
import reservoir3d2 from "@/assets/images/cesiumMap/icons/3d/reservoir-2@2x.png"
import reservoir3d3 from "@/assets/images/cesiumMap/icons/3d/reservoir-3@2x.png"
import reservoir3d4 from "@/assets/images/cesiumMap/icons/3d/reservoir-4@2x.png"

import flowVideo2d1 from "@/assets/images/cesiumMap/icons/2d/flowVideo-1@2x.png"
import flowVideo2d2 from "@/assets/images/cesiumMap/icons/2d/flowVideo-2@2x.png"
import flowVideo2d3 from "@/assets/images/cesiumMap/icons/2d/flowVideo-3@2x.png"
import flowVideo2d4 from "@/assets/images/cesiumMap/icons/2d/flowVideo-4@2x.png"
import flowVideo3d1 from "@/assets/images/cesiumMap/icons/3d/flowVideo-1@2x.png"
import flowVideo3d2 from "@/assets/images/cesiumMap/icons/3d/flowVideo-2@2x.png"
import flowVideo3d3 from "@/assets/images/cesiumMap/icons/3d/flowVideo-3@2x.png"
import flowVideo3d4 from "@/assets/images/cesiumMap/icons/3d/flowVideo-4@2x.png"

import monitoring2d1 from "@/assets/images/cesiumMap/icons/2d/monitoring-1@2x.png"
import monitoring3d1 from "@/assets/images/cesiumMap/icons/3d/monitoring-1@2x.png"

import hydropower2d1 from "@/assets/images/cesiumMap/icons/2d/wzHydropower@2x.png"
import hydropower3d1 from "@/assets/images/cesiumMap/icons/3d/wzHydropower@2x.png"

import wzReservoir2d1 from "@/assets/images/cesiumMap/icons/2d/wzReservoir@2x.png"
import wzReservoir3d1 from "@/assets/images/cesiumMap/icons/3d/wzReservoir@2x.png"

import gateDam2d1 from "@/assets/images/cesiumMap/icons/2d/gateDam-1@2x.png"
import gateDam2d2 from "@/assets/images/cesiumMap/icons/2d/gateDam-2@2x.png"
import gateDam2d3 from "@/assets/images/cesiumMap/icons/2d/gateDam-3@2x.png"
import gateDam2d4 from "@/assets/images/cesiumMap/icons/2d/gateDam-4@2x.png"
import gateDam3d1 from "@/assets/images/cesiumMap/icons/3d/gateDam-1@2x.png"
import gateDam3d2 from "@/assets/images/cesiumMap/icons/3d/gateDam-2@2x.png"
import gateDam3d3 from "@/assets/images/cesiumMap/icons/3d/gateDam-3@2x.png"
import gateDam3d4 from "@/assets/images/cesiumMap/icons/3d/gateDam-4@2x.png"

// 正常    1   normal
// 超保证  2   overguarantee
// 超历史  3   Transcendent
// 超警戒  4   hyperalert


export default {
    rain: { // 测站-雨量站
        "2d": {
            1: rain2d1,
            2: rain2d2,
            3: rain2d3,
            4: rain2d4,
            5: rain2d5,
            6: rain2d6,
            7: rain2d7,
            length:8,
        },
        "3d": {
            1: rain3d1,
            2: rain3d2,
            3: rain3d3,
            4: rain3d4,
            5: rain3d5,
            6: rain3d6,
            7: rain3d7
        },
    },
    river: {// 测站-河道站
        "2d": {
            1: river2d1,//正常
            2: river2d2,//超保证
            3: river2d3,//超历史
            4: river2d4,//超警戒
        },
        "3d": {
            1: river3d1,
            2: river3d2,
            3: river3d3,
            4: river3d4,
        },
        "board": {
            1: riverBoard1,
            2: riverBoard2
        }
    },
    reservoir: {// 测站-水库站
        "2d": {
            1: reservoir2d1,
            2: reservoir2d2,
            3: reservoir2d3,
            4: reservoir2d4,
        },
        "3d": {
            1: reservoir3d1,
            2: reservoir3d2,
            3: reservoir3d3,
            4: reservoir3d4,
        }
    },
    flowVideo: {// 测站-视频测流站
        "2d": {
            1: flowVideo2d1,
            2: flowVideo2d2,
            3: flowVideo2d3,
            4: flowVideo2d4,
        },
        "3d": {
            1: flowVideo3d1,
            2: flowVideo3d2,
            3: flowVideo3d3,
            4: flowVideo3d4,
        }
    },
    monitoring: {// 测站-河道监控
        "2d": {
            1: monitoring2d1
        },
        "3d": {
            1: monitoring3d1
        }
    },
    wzReservoir: {// 水利工程-水库站
        "2d": {
            1: wzReservoir2d1,
        },
        "3d": {
            1: wzReservoir3d1,
        }
    },
    wzHydropower: {// 水利工程-水电站
        "2d": {
            1: hydropower2d1,
        },
        "3d": {
            1: hydropower3d1,
        }
    },
    gateDam: {// 水利工程-闸坝
        "2d": {
            1: gateDam2d1,
            2: gateDam2d2,
            3: gateDam2d3,
            4: gateDam2d4,
        },
        "3d": {
            1: gateDam3d1,
            2: gateDam3d2,
            3: gateDam3d3,
            4: gateDam3d4,
        }
    },
}