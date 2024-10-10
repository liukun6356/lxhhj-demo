//es5语法定义的class，新类可以:
// XXXClass.extend({
// 	initialize: function (options) {
//   },
// });

export function ES5Class() {}

function extend(dest) {
  var i, j, len, src;

  for (j = 1, len = arguments.length; j < len; j++) {
    src = arguments[j];
    for (i in src) {
      dest[i] = src[i];
    }
  }
  return dest;
}

ES5Class.extend = function(props) {
  // @function extend(props: Object): Function
  // [Extends the current class](#class-inheritance) given the properties to be included.
  // Returns a Javascript function that is a class constructor (to be called with `new`).
  var NewClass = function() {
    // call the constructor
    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }

    // call all constructor hooks
    this.callInitHooks();
  };

  var parentProto = (NewClass.__super__ = this.prototype);

  var proto = Object.create(parentProto);
  proto.constructor = NewClass;

  NewClass.prototype = proto;

  // inherit parent's statics
  for (var i in this) {
    if (this.hasOwnProperty(i) && i !== "prototype" && i !== "__super__") {
      NewClass[i] = this[i];
    }
  }

  // mix static properties into the class
  if (props.statics) {
    extend(NewClass, props.statics);
    delete props.statics;
  }

  // mix includes into the prototype
  if (props.includes) {
    // checkDeprecatedMixinEvents(props.includes);
    extend.apply(null, [proto].concat(props.includes));
    delete props.includes;
  }

  // merge options
  if (proto.options) {
    props.options = extend(Object.create(proto.options), props.options);
  }

  // mix given properties into the prototype
  extend(proto, props);

  proto._initHooks = [];

  // add method for calling all hooks
  proto.callInitHooks = function() {
    if (this._initHooksCalled) {
      return;
    }

    if (parentProto.callInitHooks) {
      parentProto.callInitHooks.call(this);
    }

    this._initHooksCalled = true;

    for (var i = 0, len = proto._initHooks.length; i < len; i++) {
      proto._initHooks[i].call(this);
    }
  };

  return NewClass;
};
