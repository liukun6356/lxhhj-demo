// 地理坐标系转换
import proj4 from 'proj4'

proj4.defs('EPSG:4547',`
    PROJCS["CGCS2000 / 3-degree Gauss-Kruger CM 114E",
    GEOGCS["China Geodetic Coordinate System 2000",
    DATUM["China_2000",
    SPHEROID["CGCS2000",6378137,298.257222101,
    AUTHORITY["EPSG","1024"]],
    AUTHORITY["EPSG","1043"]],
    PRIMEM["Greenwich",0,
    AUTHORITY["EPSG","8901"]],
    UNIT["degree",0.0174532925199433,
    AUTHORITY["EPSG","9122"]],
    AUTHORITY["EPSG","4490"]],
    PROJECTION["Transverse_Mercator"],
    PARAMETER["latitude_of_origin",0],
    PARAMETER["central_meridian",114],
    PARAMETER["scale_factor",1],
    PARAMETER["false_easting",500000],
    PARAMETER["false_northing",0],
    UNIT["metre",1,
    AUTHORITY["EPSG","9001"]],
    AUTHORITY["EPSG","4547"]]
`)


// proj4默认投影坐标系
// defs('EPSG:4326', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
// defs('EPSG:4269', "+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees");
// defs('EPSG:3857', "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs");
