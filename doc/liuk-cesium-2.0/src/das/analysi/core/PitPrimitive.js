
import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
/**
 * Cesium
 * TerrainClip地形开挖依赖js
 */
 export class PitPrimitive extends DasClass {

    /**
     * TerrainClip地形挖掘
     * @param options
     */
    constructor(options) {
        super(options);
        this.viewer = options.viewer || null;
        this.style = options.style ;
        this.positions = options.positions ;
        this.positions_original = options.positions_original;
        // this.style = options.viewer ;
// var _0x307ac9 = function(_0x3fa19f) {
//     _0x4be8e2()(_0x39da96, _0x3fa19f);
//     var _0x4bb5c3 = _0x36fd49(_0x39da96);
//     function _0x39da96() {
    // var positions = {
    //     style : options.style ,
    //     positions : options.positions 
    // }
    //     var _0x159f21;
    //     return _0x264c51()(this, _0x39da96),
    //     (_0x159f21 = _0x4bb5c3.call(this, positions)).style.diffHeight = Cesium.defaultValue(_0x159f21.style.diffHeight, 10),
    //     _0x159f21.style.splitNum = Cesium.defaultValue(_0x159f21.style.splitNum, 50),
    //     _0x159f21;
        this._addedHook();
    }
    get czmObjectEx() {
            var _0x5cc947 = [];
            return this._bottomPrimitive && _0x5cc947.push(this._bottomPrimitive),
            this._primitive_label && _0x5cc947.push(this._primitive_label),
            _0x5cc947;
    }
    get center() {
            return this.centerOfMass;
    }
    get diffHeight() {
            return this.style.diffHeight;
    }
    set diffHeight(_0x4e4703) {
            this.style.diffHeight = _0x4e4703;
            for (var _0x5e8f76 = [], _0x22d584 = this._minHeight - _0x4e4703, _0xb0185b = this.wellData.cartoList, _0x360727 = 0, _0x439184 = _0xb0185b.length; _0x360727 < _0x439184; _0x360727++) {
                var _0x535e87 = _0xb0185b[_0x360727];
                _0x5e8f76.push(Cesium.Cartesian3.fromRadians(_0x535e87.longitude, _0x535e87.latitude, _0x22d584));
            }
            this.wellData.bottomPositions = _0x5e8f76,
            this._removePit(),
            this._createPit(this.wellData);
    }
    
    get primitiveCollection() {
        return this._primitiveCollection || (this._primitiveCollection = new Cesium.PrimitiveCollection(),
        this.viewer.scene.primitives.add(this._primitiveCollection)),
        // this._state == "added" && (this.viewer.scene.primitives.add(this._primitiveCollection),
        // Cesium.defined(this.options.zIndex) && (this.zIndex = this.options.zIndex))),
        this._primitiveCollection;

    }
    getMinHeight(positions) {
        var _0x1d8381 = 0;
        if (null == positions || 0x0 == positions.length)
            return _0x1d8381;
        var p = [];
        for (var height = _0x1d8381, _0x354cf4 = 0x0; _0x354cf4 < positions.length; _0x354cf4++) {
            var point = positions[_0x354cf4];
            var _Cartesian3 = Cesium.Cartesian3.fromDegrees(point[0],point[1],point[2]);
            p.push(_Cartesian3);
            var _0x5ca3ac = Cesium.Cartographic.fromCartesian(_Cartesian3);
            0x0 == _0x354cf4 && (height = _0x5ca3ac.height),
            _0x5ca3ac.height< height && (height = _0x5ca3ac.height);
        }
        this.positions = p;
        return Number(height.toFixed(2));
    }
    _getWellData() {
            if (0 != this.positions_original.length) {
                this._minHeight =  this.getMinHeight(this.positions_original);
                for (var h = this._minHeight - this.diffHeight, _0x6df4f2 = [], _0x3efb03 = [], _0x1e7c4c = [], generateArc = this.generateArc({
                    'scene': this.viewer.scene,
                    'positions': this.positions.concat(this.positions[0]),
                    // 'height': this.style.diffHeight,
                    'splitNum': this.style.splitNum
                }), index = 0, _0x456f85 = generateArc.length; index < _0x456f85; index++) {
                    var _0x470ccf = Cesium.Cartographic.fromCartesian(generateArc[index]);
                    _0x1e7c4c.push(new Cesium.Cartographic(_0x470ccf.longitude,_0x470ccf.latitude)),
                    _0x3efb03.push(Cesium.Cartesian3.fromRadians(_0x470ccf.longitude, _0x470ccf.latitude, h)),
                    _0x6df4f2.push(Cesium.Cartesian3.fromRadians(_0x470ccf.longitude, _0x470ccf.latitude, 0x0));
                }
                return {
                    'cartoList': _0x1e7c4c,
                    'bottomPositions': _0x3efb03,
                    'wallTopPositions': _0x6df4f2
                };
            }
        }

    
    granularity(positions,splitNum) {
        var _0x500e28 = splitNum ? splitNum : 10
            , _0x2c3923 = Cesium.Rectangle.fromCartesianArray(positions)
            , _0x1ab5aa = Math.max(_0x2c3923.height, _0x2c3923.width);
        return _0x1ab5aa /= _0x500e28;
    }
    _0x3c9d35(scene, _0x4d2890) {
        if (!_0x4d2890)
            return null;
        _0x4d2890 instanceof Cesium.Cartesian3 && (_0x4d2890 = [_0x4d2890]);
        for (var index = 0, _0x4e1154 = _0x4d2890.length; index < _0x4e1154; ++index) {
            var _0x3dfff7 = _0x4d2890[index]
              , _0x33ff0e = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, _0x3dfff7);
            if (Cesium.defined(_0x33ff0e)) {
                var _0x397062 = scene.pick(_0x33ff0e, 10, 10);
                if (Cesium.defined(_0x397062) && Cesium.defined(_0x397062.primitive) && _0x397062.primitive instanceof Cesium.Cesium3DTileset)
                    return _0x397062.primitive;
            }
        }
        return null;
    }
    _0x20f7d4(_0x6b6712, _0x52dca5) {
        var _0x2edc8f = {
            positions:"",
            scene : "",
            splitNum: 80

        };
        // var _0x2edc8f = arguments.length > 0x2 && void 0x0 !== arguments[0x2] ? arguments[0x2] : {};
        _0x2edc8f.cartographic = _0x2edc8f.cartographic || Cesium.Cartographic.fromCartesian(_0x52dca5);
        var _0x484ba3 = _0x2edc8f.cartographic
          , _0x1d6b78 = _0x2edc8f.callback;
        if (_0x2edc8f.asyn)
            _0x6b6712.clampToHeightMostDetailed([_0x52dca5], _0x2edc8f.objectsToExclude, 0.2).then(function(_0x5646bd) {
                var _0x52edb1 = _0x5646bd[0x0];
                if (Cesium.defined(_0x52edb1)) {
                    var _0x3321f4 = Cesium.cartographic.fromCartesian(_0x52edb1)
                      , _0x5daf34 = _0x3321f4.height;
                    if (Cesium.defined(_0x5daf34) && _0x5daf34 > -1000)
                        return void (_0x1d6b78 && _0x1d6b78(_0x5daf34, _0x3321f4));
                }
                this._0x4c8681(_0x6b6712, _0x52dca5, _0x2edc8f);
            });
        else {
            var _0x29c70c = _0x6b6712.sampleHeight(_0x484ba3, _0x2edc8f.objectsToExclude, 0.2);
            if (Cesium.defined(_0x29c70c) && _0x29c70c > -1000)
                return _0x1d6b78 && _0x1d6b78(_0x29c70c, _0x484ba3),
                _0x29c70c;
        }
        return 0x0;
    }
    _0x4c8681(_scene, _0xbdfad0,param) {
          var cartographic = param.cartographic || Cesium.Cartographic.fromCartesian(_0xbdfad0)
          , callback = param.callback
          , _0x1aa501 = Boolean(_scene.terrainProvider._layers);
        if (!_0x1aa501)
            return callback && callback(cartographic.height, cartographic),
            cartographic.height;
        if (param.asyn)
            Cesium.when(Cesium.sampleTerrainMostDetailed(_scene.terrainProvider, [cartographic]), function(_0x4eab5d) {
                var _0xd4abc, _0x27d1d9 = _0x4eab5d[0x0];
                _0xd4abc = Cesium.defined(_0x27d1d9) && Cesium.defined(_0x27d1d9.height) ? _0x27d1d9.height : _scene.globe.getHeight(cartographic),
                callback && callback(_0xd4abc, cartographic);
            });
        else {
            // var height = _scene.globe.getHeight(cartographic);
            var height = 0;
            if (Cesium.defined(height) && height > -1000)
                return callback && callback(height, cartographic),
                height;
        }
        return 0x0;
    }
    _0x25beae(_scene, _cartesian3,param) {
        if (!_cartesian3)
            return _cartesian3;
        var bool = Cesium.defaultValue(param.has3dtiles, Cesium.defined(this._0x3c9d35(_scene, _cartesian3)));
        return bool ? this._0x20f7d4(_scene, _cartesian3, param) : this._0x4c8681(_scene, _cartesian3, param);
    }
    generateArc(param) {
        var positions = param.positions
            , scene = param.scene
            , granularity = this.granularity(positions, param.splitNum || 100);
            granularity <= 0x0 && (granularity = null);
        for (var pointArray = Cesium.PolylinePipeline.generateArc({
            'positions': positions,
            'height': param.height,
            'minDistance': param.minDistance,
            'granularity': granularity
        }), _0x46ea99 = [], _0x2f9c85 = 0; _0x2f9c85 < pointArray.length; _0x2f9c85 += 3) {
            var _0x4a78a5 = Cesium.Cartesian3.unpack(pointArray, _0x2f9c85);
            if (scene && Cesium.defaultValue(param.surfaceHeight, true)) {
                delete param.callback;
                var height = this._0x25beae(scene, _0x4a78a5, param)
                    , _0x20c0b2 = Cesium.Cartographic.fromCartesian(_0x4a78a5);
                _0x4a78a5 = Cesium.Cartesian3.fromRadians(_0x20c0b2.longitude, _0x20c0b2.latitude, height);
            }
            _0x46ea99.push(_0x4a78a5);
        }
        return _0x46ea99;
    }
    _addedHook() {
        var _0x1d88e2 = this._getWellData();
        this.wellData = _0x1d88e2,
        this._createPit(_0x1d88e2);
        // this.style.label && this._addLabel();
    }
    _addLabel() {
        var _0x2e9acd = this.style.label;
        if (_0x2e9acd && _0x2e9acd.text) {
            Cesium.defined(this.style.clampToGround) && !Cesium.defined(_0x2e9acd.clampToGround) && (_0x2e9acd.clampToGround = this.style.clampToGround);
            var _0x58a7c2 = _0x50cc91.toCesiumVal(this.style.label, {}, this.attr);
            return _0x58a7c2.position = this._getLablePosition(),
            this._primitive_label = this._layer.labelCollection.add(_0x58a7c2),
            this._primitive_label;
        }

    }
    setPositionsHeight(_0x10e481) {
        var _0x231378 = arguments.length > 0x1 && void 0x0 !== arguments[0x1] ? arguments[0x1] : 0x0;
        if (!_0x10e481)
            return _0x10e481;
        if (Array.isArray(_0x10e481)) {
            for (var _0xf7f0b3 = [], _0x29ad1e = 0x0, _0x4119fc = _0x10e481.length; _0x29ad1e < _0x4119fc; _0x29ad1e++) {
                var _0x18c4f5 = Cesium.Cartographic.fromCartesian(_0x10e481[_0x29ad1e])
                  , _0x24cba8 = Cesium.Cartesian3.fromRadians(_0x18c4f5.longitude, _0x18c4f5.latitude, _0x231378);
                _0xf7f0b3['push'](_0x24cba8);
            }
            return _0xf7f0b3;
        }
        var _0x13e92b = Cesium.Cartographic.fromCartesian(_0x10e481);
        return Cesium.Cartesian3.fromRadians(_0x13e92b.longitude, _0x13e92b.latitude, _0x231378);
    }
    // _removedHook() {
    //         _0x170626()(_0x4f82d0()(_0x39da96.prototype), '_removedHook', this).call(this),
    //         this._removePit();
    //     }
    _removePit() {
        this._primitive && (this.primitiveCollection.remove(this._primitive), delete this._primitive),
        this._bottomPrimitive &&  (this.primitiveCollection.remove(this._bottomPrimitive), delete this._bottomPrimitive);
    }
    _createPit(param) {
        debugger
        var hasTerrain = true;
        var that = this;
        if (this._createBottomSurface(param.bottomPositions),hasTerrain) {
            var _0x1c775f = Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, param.cartoList);
            Cesium.when(_0x1c775f, function(_0x3f5ff9) {
                debugger
                for (var _0x54c3d2 = [], _0xae3f23 = -9999, _0x2d109c = [], _0x4e9c8a = 0, _0x5309d9 = _0x3f5ff9.length; _0x4e9c8a < _0x5309d9; _0x4e9c8a++) {
                    var _0x486620 = _0x3f5ff9[_0x4e9c8a];
                    _0x54c3d2.push(_0x486620.height),
                    _0xae3f23 = Math.max(_0x486620.height, _0xae3f23),
                    _0x2d109c.push(Cesium.Cartesian3.fromRadians(_0x486620.longitude, _0x486620.latitude, _0x486620.height));
                }
                that._maxHeight = _0xae3f23,
                that._topHeights = _0x54c3d2,
                that._createWellWall(param.bottomPositions, _0x2d109c);
            });
        } else{
            this._createWellWall(param.bottomPositions, param.wallTopPositions);
        }
    }
    _createWellWall(minimumArr, maximumArr) {
        var height = this._minHeight - this.diffHeight ;
        //初始化[仅执行1次]
        Cesium.Check.defined("dingmian", maximumArr),
        Cesium.Check.defined('dimianmian', minimumArr),
        Cesium.Check.typeOf.number.greaterThanOrEquals("dingmian.length", maximumArr.length, 3),
        Cesium.Check.typeOf.number.greaterThanOrEquals("dimian.length", minimumArr.length, 3);
        var _vertexFormat = new Cesium.VertexFormat({
            'st': true,
            'position': true,
            'bitangent': false,
            'normal': false,
            'color': false,
            'tangent': false
        });
        var _minimumArr = Cesium.clone(minimumArr),
         _maximumArr = Cesium.clone(maximumArr);
         var wellWall_geometry = this.createGeometryWell(_minimumArr,_maximumArr,_vertexFormat, this._topHeights, height, this._maxHeight);
        
        // var  wellWall = new WellWall();
        //     wellWall.create({
        //         'minimumArr': minimumArr,
        //         'maximumArr': maximumArr
        //     });
        // var wellWall_geometry = wellWall.createGeometry(wellWall, this._topHeights, height, this._maxHeight);
        this._primitive = new Cesium.Primitive({
            'geometryInstances': new Cesium.GeometryInstance({
                'geometry': wellWall_geometry,
                'attributes': {
                    'color': Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GREY)
                },
                // 'id': this.uuid
                // 'id': haoutil.math.getGuid()
            }),
            'appearance': new Cesium.MaterialAppearance({
                'translucent': false,
                'flat': true,
                'material': new Cesium.Material({
                    'fabric': {
                        'type': "Image",
                        'uniforms': {
                            'image': this.style.image,
                            'color': Cesium.Color.WHITE.withAlpha(this.style.opacity || 1)
                        }
                    }
                })
            }),
            'asynchronous': false
        }),
        // this.viewer.scene.primitives.add(this._primitive)
        this.primitiveCollection.add(this._primitive)
        // this.bindPickId(this._primitive);
    }
    createGeometryWell(_minimumArr,_maximumArr,_vertexFormat, _topHeights, height,maxHeight){
        var _indices, _maximum, _0x6d8121, _0x3ec98b, 
        _maxHeight = maxHeight ? maxHeight : 0,
         _attributes = new Cesium.GeometryAttributes();
        if (Cesium.defined(_vertexFormat.position) && Cesium.defined(_vertexFormat.st)) {
            if (Cesium.defined(_vertexFormat.position)) {
                _maximum = new Float64Array(0x4 * _maximumArr.length * 0x3);
                for (var index = 0x0; index < _maximumArr.length; index++)
                    index == _maximumArr.length - 0x1 ? (_maximum[0xc * index + 0x0] = _maximumArr[index]['x'],
                    _maximum[0xc * index + 0x1] = _maximumArr[index]['y'],
                    _maximum[0xc * index + 0x2] = _maximumArr[index]['z'],
                    _maximum[0xc * index + 0x3] = _minimumArr[index]['x'],
                    _maximum[0xc * index + 0x4] = _minimumArr[index]['y'],
                    _maximum[0xc * index + 0x5] = _minimumArr[index]['z'],
                    _maximum[0xc * index + 0x9] = _minimumArr[0x0]['x'],
                    _maximum[0xc * index + 0xa] = _minimumArr[0x0]['y'],
                    _maximum[0xc * index + 0xb] = _minimumArr[0x0]['z'],
                    _maximum[0xc * index + 0x6] = _maximumArr[0x0]['x'],
                    _maximum[0xc * index + 0x7] = _maximumArr[0x0]['y'],
                    _maximum[0xc * index + 0x8] = _maximumArr[0x0]['z']) : (_maximum[0xc * index + 0x0] = _maximumArr[index]['x'],
                    _maximum[0xc * index + 0x1] = _maximumArr[index]['y'],
                    _maximum[0xc * index + 0x2] = _maximumArr[index]['z'],
                    _maximum[0xc * index + 0x3] = _minimumArr[index]['x'],
                    _maximum[0xc * index + 0x4] = _minimumArr[index]['y'],
                    _maximum[0xc * index + 0x5] = _minimumArr[index]['z'],
                    _maximum[0xc * index + 0x9] = _minimumArr[index + 0x1]['x'],
                    _maximum[0xc * index + 0xa] = _minimumArr[index + 0x1]['y'],
                    _maximum[0xc * index + 0xb] = _minimumArr[index + 0x1]['z'],
                    _maximum[0xc * index + 0x6] = _maximumArr[index + 0x1]['x'],
                    _maximum[0xc * index + 0x7] = _maximumArr[index + 0x1]['y'],
                    _maximum[0xc * index + 0x8] = _maximumArr[index + 0x1]['z']);
                _attributes.position = new Cesium.GeometryAttribute({
                    'componentDatatype': Cesium.ComponentDatatype.DOUBLE,
                    'componentsPerAttribute': 3,
                    'values': _maximum
                });
            }
            if (Cesium.defined(_vertexFormat.st)) {
                for (var _0x1445f2 = new Float32Array(0x4 * _maximumArr.length * 0x2), _0x513407 = _maximumArr.length, _0x2be444 = 0x0; _0x2be444 < _maximumArr.length; _0x2be444++) {
                    var _0x5d4855 = _0x2be444 / _0x513407
                        , _0x2cfa35 = _topHeights && _topHeights[_0x2be444] || 0x0
                        , _0x4ff144 = (_0x2cfa35 - height) / (_maxHeight - height)
                        , _0x4abb65 = _0x2be444 + 0x1
                        , _0x42c6fa = _topHeights && _topHeights[_0x4abb65] || 0x0
                        , _0x124f20 = _0x4abb65 / _0x513407
                        , _0x34cd58 = (_0x42c6fa - height) / (_maxHeight - height);
                    _0x1445f2[0x8 * _0x2be444 + 0x0] = _0x5d4855,
                    _0x1445f2[0x8 * _0x2be444 + 0x1] = _0x4ff144 - 0x0,
                    _0x1445f2[0x8 * _0x2be444 + 0x2] = _0x5d4855,
                    _0x1445f2[0x8 * _0x2be444 + 0x3] = _0x4ff144 - _0x4ff144,
                    _0x1445f2[0x8 * _0x2be444 + 0x4] = _0x124f20,
                    _0x1445f2[0x8 * _0x2be444 + 0x5] = _0x34cd58 - 0x0,
                    _0x1445f2[0x8 * _0x2be444 + 0x6] = _0x124f20,
                    _0x1445f2[0x8 * _0x2be444 + 0x7] = _0x34cd58 - _0x34cd58;
                }
                _attributes.st = new Cesium.GeometryAttribute({
                    'componentDatatype': Cesium.ComponentDatatype.FLOAT,
                    'componentsPerAttribute': 0x2,
                    'values': _0x1445f2
                });
            }
            _indices = new Uint16Array(0x2 * _maximumArr.length * 0x3),
            _0x6d8121 = new Cesium.Cartesian3(9999999999999,9999999999999,9999999999999),
            _0x3ec98b = new Cesium.Cartesian3(-9999999999999,-9999999999999,-9999999999999);
            for (var _0x3f2481 = 0x0; _0x3f2481 < _maximumArr.length; _0x3f2481++)
                _indices[0x6 * _0x3f2481 + 0x0] = 0x4 * _0x3f2481 + 0x0,
                _indices[0x6 * _0x3f2481 + 0x1] = 0x4 * _0x3f2481 + 0x1,
                _indices[0x6 * _0x3f2481 + 0x2] = 0x4 * _0x3f2481 + 0x2,
                _indices[0x6 * _0x3f2481 + 0x3] = 0x4 * _0x3f2481 + 0x1,
                _indices[0x6 * _0x3f2481 + 0x4] = 0x4 * _0x3f2481 + 0x2,
                _indices[0x6 * _0x3f2481 + 0x5] = 0x4 * _0x3f2481 + 0x3,
                _maximumArr[_0x3f2481]['x'] >= _0x3ec98b['x'] && _maximumArr[_0x3f2481]['y'] >= _0x3ec98b['y'] && _maximumArr[_0x3f2481]['z'] >= _0x3ec98b['z'] && (_0x3ec98b = _maximumArr[_0x3f2481]),
                _minimumArr[_0x3f2481]['x'] <= _0x6d8121['x'] && _minimumArr[_0x3f2481]['y'] <= _0x6d8121['y'] && _minimumArr[_0x3f2481]['z'] <= _0x6d8121['z'] && (_0x6d8121 = _minimumArr[_0x3f2481]);
        }
        var _0x50b4b8 = Cesium.Cartesian3.subtract(_0x3ec98b, _0x6d8121, new Cesium.Cartesian3())
            , _0x5a8355 = 0.5 * Cesium.Cartesian3.magnitude(_0x50b4b8);
        return new Cesium.Geometry({
            'attributes': _attributes,
            'indices': _indices,
            'primitiveType': Cesium.PrimitiveType.TRIANGLES,
            'boundingSphere': new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO,_0x5a8355)
        });
    }
    _createBottomSurface(pos) {
        if (pos.length) {
            var pos_arr = Cesium.defaultValue(pos, Cesium.defaultValue.EMPTY_OBJECT);
            var _vertexFormat = new Cesium.VertexFormat({
                'st': !0x0,
                'position': !0x0,
                'bitangent': !0x1,
                'normal': !0x1,
                'color': !0x1,
                'tangent': !0x1
            });
            var _pos_arr = Cesium.clone(pos_arr);
            var _SERectangle = Cesium.BoundingRectangle.fromPoints(_pos_arr, new Cesium.BoundingRectangle());
            // this._workerName = "createCustomPlaneGeometry";
            var _indices, _attributesVal,
            _attributes = new Cesium.GeometryAttributes(), posLength = _pos_arr.length;
            if (Cesium.defined(_vertexFormat.position)) {
                _attributesVal = new Float64Array(0x3 * posLength);
                for (var i = 0x0; i < posLength; i++)
                    _attributesVal[i % posLength * 0x3 + 0x0] = _pos_arr[i]['x'],
                    _attributesVal[i % posLength * 0x3 + 0x1] = _pos_arr[i]['y'],
                    _attributesVal[i % posLength * 0x3 + 0x2] = _pos_arr[i]['z'];
                if (_attributes.position = new Cesium.GeometryAttribute({
                    'componentDatatype': Cesium.ComponentDatatype.DOUBLE,
                    'componentsPerAttribute': 3,
                    'values': _attributesVal
                }),
                Cesium.defined(_vertexFormat['st'])) {
                    for (var _0x4043dd = new Float32Array(0x2 * posLength), _0xfdcf7c = _SERectangle['x'], _0x377003 = _SERectangle['y'], j = 0x0; j < posLength; j++)
                        _0x4043dd[0x2 * j + 0x0] = Math.abs((_attributesVal[0x3 * j + 0x0] - _0xfdcf7c) / _SERectangle.width),
                        _0x4043dd[0x2 * j + 0x1] = Math.abs((_attributesVal[0x3 * j + 0x1] - _0x377003) / _SERectangle.height);
                    _attributes['st'] = new Cesium.GeometryAttribute({
                        'componentDatatype': Cesium.ComponentDatatype.FLOAT,
                        'componentsPerAttribute': 2,
                        'values': _0x4043dd
                    });
                }
                _indices = new Uint16Array(0x3 * (posLength - 0x2));
                for (var _0x3b1878 = 0x1; _0x3b1878 < posLength - 0x1; _0x3b1878++)
                    _indices[0x3 * (_0x3b1878 - 0x1) + 0x0] = 0x0,
                    _indices[0x3 * (_0x3b1878 - 0x1) + 0x1] = _0x3b1878,
                    _indices[0x3 * (_0x3b1878 - 0x1) + 0x2] = _0x3b1878 + 0x1;
            }
            var bottomSurface_geometry =  new Cesium.Geometry({
                'attributes': _attributes,
                'indices': _indices,
                'primitiveType': Cesium.PrimitiveType.TRIANGLE_FAN,
                'boundingSphere': new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO,Math.sqrt(2))
            });


            // var bottomSurface = new BottomSurface();
            // bottomSurface.create({'pos_arr': pos});
            // var bottomSurface_geometry = bottomSurface.createGeometry(bottomSurface);
            this._bottomPrimitive = new Cesium.Primitive({
                'geometryInstances': new Cesium.GeometryInstance({
                    'geometry': bottomSurface_geometry
                }),
                'appearance': new Cesium.MaterialAppearance({
                    'translucent': false,
                    'flat': true,
                    'material': new Cesium.Material({
                        'fabric': {
                            'type': "Image",
                            'uniforms': {
                                'image': this.style.imageBottom,
                                'color': Cesium.Color.WHITE.withAlpha(this.style.opacity || 1)
                            }
                        }
                    })
                }),
                'asynchronous': false
            }),
            // this.viewer.scene.primitives.add(this._bottomPrimitive)
            this.primitiveCollection.add(this._bottomPrimitive)
            // this.bindPickId(this._bottomPrimitive);
           return Boolean(this.viewer.terrainProvider._layers);
        }
    }
    bindPickId(data) {
        return data._das3d_layerId = this._layer._uuid,
        data._das3d_graphicId = this._uuid,
        this;
    }
}
