export const ShpExts = {
    shp: '.shp',
    dbf: '.dbf',
    prj: '.prj',
    cpg: '.cpg'
} as const;

export const ProjConfigFileExt = '.hscfg';

export const GraphicUIDKey = 'FID';

export const Channels = {
    //misc
    ToggleDevTools: 'dev:toggle-dev-tools',
    //file
    LoadFileBuffer: 'file:load-file',
    LoadShpFiles: 'file:load-shp',
    
    //open proj
    ProjectOpenHistory: 'proj:open-histroy',
    CreateProject: 'proj:create',
    OpenProjectByDialogSelect: 'proj:dialog-select-open',
    OpenProject: 'proj:open',
    LoadProjectData: 'proj:load-data',
    SaveProject: 'proj:save',

    //tuflow
    LoadHdf5Data: 'tuflow:load-hdf5',
    LoadTuflowMesh: 'tuflow:load-mesh'
} as const;


