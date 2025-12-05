
export interface SaveTreeNodeJSON {
    resources?: string, //关联的资源
    [p: string]: any;
}

export interface ProjectConfig {
    version: string,
    name: string,
    configFilePath: string,
    createTime: string,
    lastUpdateTime: string,

    //资源id
    resources: string[],

    //图层树
    layerTree: SaveTreeNodeJSON[],

    //地图设置
    viewOptions: {
        extent: any,
        spatialReference: any
    }
}
