(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Make the ldf-client module available as a global browser object.
// To be compiled with browserify into deps/ldf-client-browser.js

window.ldf = require('ldf-client');
window.N3  = require('ldf-client/node_modules/n3'); // expose the same N3 version as used in the client

},{"ldf-client":11,"ldf-client/node_modules/n3":40}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":10}],4:[function(require,module,exports){
module.exports=require(2)
},{"/Users/tsteiner/Documents/Browser.js/node_modules/browserify/lib/_empty.js":2}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],7:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":8}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],9:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],10:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":9,"_process":8,"inherits":6}],11:[function(require,module,exports){
/*! @license ©2013 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/** Main ldf-client module exports. */
var SparqlResultWriter = require('./lib/writers/SparqlResultWriter');
SparqlResultWriter.register('application/json', './JSONResultWriter');
SparqlResultWriter.register('application/sparql-results+json', './SparqlJSONResultWriter');
SparqlResultWriter.register('application/sparql-results+xml', './SparqlXMLResultWriter');

module.exports = {
  SparqlIterator: require('./lib/triple-pattern-fragments/SparqlIterator.js'),
  FragmentsClient: require('./lib/triple-pattern-fragments/FragmentsClient'),
  Logger: require('./lib/util/Logger'),
  HttpClient: require('./lib/util/HttpClient'),
  SparqlResultWriter: SparqlResultWriter,
};

},{"./lib/triple-pattern-fragments/FragmentsClient":23,"./lib/triple-pattern-fragments/SparqlIterator.js":25,"./lib/util/HttpClient":31,"./lib/util/Logger":32,"./lib/writers/SparqlResultWriter":37}],12:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A CompositeExtractor combines metadata from different extractors. */

var MetadataExtractor = require('./MetadataExtractor'),
    _ = require('lodash');

/**
 * Creates a new `CompositeExtractor`.
 * @classdesc A `CompositeExtractor` combines metadata from different extractors.
 * @param {object.<string, MetadataExtractor>|Extractor[]} extractors Metadata extractors (per type);
 *        the extraction callback will be invoked once for each type
 * @constructor
 * @augments MetadataExtractor
 */
function CompositeExtractor(extractors) {
  if (!(this instanceof CompositeExtractor))
    return new CompositeExtractor(extractors);
  MetadataExtractor.call(this);

  this._extractors = _.isArray(extractors) ? { '': extractors } : extractors;
  if (!_.any(this._extractors, 'length')) this._extractors = null;
}
MetadataExtractor.inherits(CompositeExtractor);

/* Extracts metadata from the stream of triples. */
CompositeExtractor.prototype._extract = function (metadata, tripleStream, callback) {
  _.each(this._extractors || void callback(null, {}), function (extractors, type) {
    var combined, pending = extractors.length;
    function addMetadata(error, metadata) {
      if (!error)
        combined = combined ? _.defaults(combined, metadata) : metadata;
      if (--pending === 0) {
        var result = combined;
        if (type) result = {}, result[type] = combined;
        callback(null, result);
      }
    }
    _.each(extractors, function (e) { e.extract(metadata, tripleStream, addMetadata); });
  });
};

module.exports = CompositeExtractor;

},{"./MetadataExtractor":15,"lodash":38}],13:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A ControlsExtractor extracts hypermedia controls from a triple stream. */

var MetadataExtractor = require('./MetadataExtractor'),
    UriTemplate = require('uritemplate'),
    rdf = require('../util/RdfUtil'),
    assert = require('assert');

// Extract these types of links from representations
var LINK_TYPES = ['firstPage', 'nextPage', 'previousPage', 'lastPage'];

/**
 * Creates a new `ControlsExtractor`.
 * @classdesc A `ControlsExtractor` extracts hypermedia controls from a triple stream.
 * @constructor
 * @augments MetadataExtractor
 */
function ControlsExtractor() {
  if (!(this instanceof ControlsExtractor))
    return new ControlsExtractor();
  MetadataExtractor.call(this);
}
MetadataExtractor.inherits(ControlsExtractor);

/* Extracts controls from the stream of triples. */
ControlsExtractor.prototype._extract = function (metadata, tripleStream, callback) {
  var controlData = Object.create(null);
  tripleStream.on('data', function (triple) {
    if (triple.predicate.indexOf(rdf.HYDRA) === 0) {
      var property = triple.predicate.substr(rdf.HYDRA.length),
          propertyData = controlData[property] || (controlData[property] = {}),
          subjectData = propertyData[triple.subject] || (propertyData[triple.subject] = []);
      subjectData.push(triple.object);
    }
  });
  // Send the controls
  tripleStream.on('end', function () {
    var controls = Object.create(defaultControls);
    controls.fragment = metadata.fragmentUrl;

    // Parse the links
    LINK_TYPES.forEach(function (property) {
      var linkTargets = (controlData[property] || {})[controls.fragment];
      if (linkTargets && linkTargets.length > 0)
        Object.defineProperty(controls, property, { value: linkTargets[0], enumerable: true });
    });

    // Parse the search form
    // TODO: Make parser independent of a specifically structured control set
    var searchForms = controlData.search;
    if (searchForms) {
      assert(Object.keys(searchForms).length === 1, 'Expected 1 hydra:search');
      var searchForm = searchForms[Object.keys(searchForms)[0]][0],
          searchTemplates = (controlData.template || {})[searchForm] || [];

      // Parse the template
      assert(searchTemplates.length === 1, 'Expected 1 hydra:template for ' + searchForm);
      var searchTemplateValue = rdf.getLiteralValue(searchTemplates[0]),
          searchTemplate = UriTemplate.parse(searchTemplateValue);

      // Parse the template mappings
      var mappings = (controlData.mapping || {})[searchForm] || [];
      assert(mappings.length === 3, 'Expected 3 hydra:mappings for ' + searchForm);
      mappings = mappings.reduce(function (mappings, mapping) {
        var variable = ((controlData.variable || {})[mapping] || [])[0],
            property = ((controlData.property || {})[mapping] || [])[0];
        assert(variable, 'Expected a hydra:variable for ' + mapping);
        assert(property, 'Expected a hydra:property for ' + mapping);
        mappings[property] = rdf.getLiteralValue(variable);
        return mappings;
      }, {});

      // Gets the URL of the Triple Pattern Fragment with the given triple pattern
      controls.getFragmentUrl = function (triplePattern) {
        var variables = {};
        variables[mappings[rdf.RDF_SUBJECT]]   = triplePattern.subject;
        variables[mappings[rdf.RDF_PREDICATE]] = triplePattern.predicate;
        variables[mappings[rdf.RDF_OBJECT]]    = triplePattern.object;
        return searchTemplate.expand(variables);
      };
    }
    callback(null, controls);
  });
};

// Default hypermedia controls for fragments
var defaultControls = {
  getFragmentUrl: function (triplePattern) {
    throw new Error('The fragment ' + this.fragment +
                    ' does not contain Triple Pattern Fragment hypermedia controls.');
  },
};
LINK_TYPES.forEach(function (property) {
  Object.defineProperty(defaultControls, property, {
    get: function () {
      throw new Error('The fragment ' + this.fragment +
                      ' does not contain controls for ' + property + '.');
    },
  });
});

module.exports = ControlsExtractor;

},{"../util/RdfUtil":33,"./MetadataExtractor":15,"assert":3,"uritemplate":52}],14:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A CountExtractor extracts count metadata from a triple stream. */

var MetadataExtractor = require('./MetadataExtractor'),
    rdf = require('../util/RdfUtil');

var DEFAULT_COUNT_PREDICATES = toHash([rdf.VOID_TRIPLES, rdf.HYDRA_TOTALITEMS]);

/**
 * Creates a new `CountExtractor`.
 * @classdesc A `CountExtractor` extracts count metadata from a triple stream.
 * @param {object} options
 * @param {string[]} [options.request=void:triples and hydra:totalItems] The count predicates to look for.
 * @constructor
 * @augments MetadataExtractor
 */
function CountExtractor(options) {
  if (!(this instanceof CountExtractor))
    return new CountExtractor(options);
  MetadataExtractor.call(this);
  this._countPredicates = toHash(options && options.countPredicates) || DEFAULT_COUNT_PREDICATES;
}
MetadataExtractor.inherits(CountExtractor);

/* Extracts metadata from the stream of triples. */
CountExtractor.prototype._extract = function (metadata, tripleStream, callback) {
  var countPredicates = this._countPredicates;
  tripleStream.on('end', sendMetadata);
  tripleStream.on('data', extractCount);

  // Tries to extract count information from the triple
  function extractCount(triple) {
    if (triple.predicate in countPredicates && triple.subject === metadata.fragmentUrl) {
      var count = triple.object.match(/\d+/);
      count && sendMetadata({ totalTriples: parseInt(count[0], 10) });
    }
  }
  // Sends the metadata through the callback and disables further extraction
  function sendMetadata(metadata) {
    tripleStream.removeListener('end', sendMetadata);
    tripleStream.removeListener('data', extractCount);
    callback(null, metadata || {});
  }
};

/**
 * Converts an array into an object with its values as keys.
 * @param {Array} array The keys for the object
 * @returns {Object} An object with the array's values as keys
 * @private
 */
function toHash(array) {
  return array && array.reduce(function (hash, key) { return hash[key] = true, hash; }, Object.create(null));
}

module.exports = CountExtractor;

},{"../util/RdfUtil":33,"./MetadataExtractor":15}],15:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* MetadataExtractor is a base class for objects that extract metadata from a triple stream. */

var util = require('util');

/**
 * Creates a new `MetadataExtractor`.
 * @classdesc A `MetadataExtractor` is a base class for metadata extractors.
 * @constructor
 */
function MetadataExtractor() {
  if (!(this instanceof MetadataExtractor))
    return new MetadataExtractor();
}
/**
 * Makes the specified class inherit from the current class.
 * @param {child} child The class that will inherit from the current class.
 */
MetadataExtractor.inherits = function (child) {
  util.inherits(child, this);
  child.inherits = this.inherits;
};

/**
 * Extracts metadata from the stream of triples.
 * @param {?object} metadata Existing metadata about the triples.
 * @param {String=} metadata.fragmentUrl URL of the fragment the triples belong to.
 * @param {?Iterator} tripleStream The stream of triples to extract from.
 * @param {?metadataCallback} callback The callback through which metadata will be sent.
 */
MetadataExtractor.prototype.extract = function (metadata, tripleStream, callback) {
  if (!callback) return;
  if (!tripleStream) return callback(null, {});
  this._extract(metadata || {}, tripleStream, callback);
};

/**
 * Extracts metadata from the stream of triples (with checked arguments).
 * @param {object} metadata Existing metadata about the triples.
 * @param {String=} metadata.fragmentUrl URL of the fragment the triples belong to.
 * @param {Iterator} tripleStream The stream of triples to extract from.
 * @param {metadataCallback} callback The callback through which metadata will be sent.
 * @private
 */
MetadataExtractor.prototype._extract = function (metadata, tripleStream, callback) {
  throw new Error('Not implemented');
};

/**
 * Callback that returns metadata.
 * @callback metadataCallback
 * @param {?Error} error The error that occurred during metadata extraction.
 * @param {object} metadata The metadata as an object.
*/

module.exports = MetadataExtractor;

},{"util":10}],16:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A DistinctIterator emits the unique items from a source. */

var FilterIterator = require('./FilterIterator'),
    crypto = require('crypto');

// Creates a new DistinctIterator with the given filter
function DistinctIterator(source, options) {
  if (!(this instanceof DistinctIterator))
    return new DistinctIterator(source, options);
  FilterIterator.call(this, source, null, options);
  this._uniques = {};
}
FilterIterator.inherits(DistinctIterator);

// Filters distinct items from the source
DistinctIterator.prototype._filter = function (item) {
  // An item is considered unique if its hash has not occurred before
  var uniques = this._uniques, itemHash = createHash(item);
  if (!(itemHash in uniques)) {
    uniques[itemHash] = true;
    this._push(item);
  }
};

// Creates a unique hash for the given object
function createHash(object) {
  var hash = crypto.createHash('sha1');
  hash.update(JSON.stringify(object));
  return hash.digest('base64');
}

module.exports = DistinctIterator;

},{"./FilterIterator":17,"crypto":35}],17:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A FilterIterator filters the results of another iterator. */

var TransformIterator = require('./Iterator').TransformIterator;

// Creates a new FilterIterator with the given filter
function FilterIterator(source, filter, options) {
  if (!(this instanceof FilterIterator))
    return new FilterIterator(filter, options);
  TransformIterator.call(this, source, options);

  if (typeof filter === 'function')
    this._filter = filter;
}
TransformIterator.inherits(FilterIterator);

// Reads the items from the source that match the filter
FilterIterator.prototype._read = function () {
  var source = this._source;
  if (source) {
    // Try reading items until one matches the filter
    var item;
    do { if ((item = source.read()) === null) return; }
    while (!this._filter(item));
    // Push a matching item
    this._push(item);
  }
};

// Returns whether the item should be emitted by the iterator
FilterIterator.prototype._filter = function (item) {
  throw new Error('The _filter method has not been implemented.');
};

module.exports = FilterIterator;

},{"./Iterator":18}],18:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* An iterator allows fast pull-based access to a stream of items. */

var EventEmitter = require('events').EventEmitter,
    util = require('util');

// Empty placeholder function
function noop() {}

// Creates a new Iterator
function Iterator(options) {
  if (!(this instanceof Iterator))
    return new Iterator(options);
  EventEmitter.call(this);

  options = options || {};
  // Internal buffer of preloaded items
  this._buffer = [];
  // Desired maximum buffer size; negative means the iterator has ended
  // TODO: setting options.bufferSize to 0 doesn't work (some readable events don't fire)
  this._maxBufferSize = options.bufferSize || 4;

  // Start filling the buffer when the first 'readable' listener is attached
  this.on('newListener', function waitForReadableListener(event) {
    if (event === 'readable') {
      this._fillBufferAsync();
      this.removeListener('newListener', waitForReadableListener);
    }
  });

  // Drain the iterator when 'data' listeners are attached
  this.on('newListener', function waitForDataListener(event) {
    if (event === 'data') {
      var self = this;
      this.removeListener('newListener', waitForDataListener);
      function readAll() {
        // Try to read an item while there are still data listeners
        var item;
        while (EventEmitter.listenerCount(self, 'data') !== 0 &&
               (item = self.read()) !== null)
          self.emit('data', item);
        // Detach the listener if nobody is listening anymore
        if (EventEmitter.listenerCount(self, 'data') === 0) {
          self.removeListener('readable', readAll);
          self.removeListener('newListener', waitForDataListener); // A listener could already be attached
          self.addListener('newListener', waitForDataListener);
        }
      }
      this.removeListener('readable', readAll); // A listener could already be attached
      this.addListener('readable', readAll);
      setImmediate(readAll);
    }
  });

}
util.inherits(Iterator, EventEmitter);

// Reads an item from the iterator, or returns `null` if none is available
Iterator.prototype.read = function () {
  // Try to add a new item to the buffer if it is empty
  var item = null, buffer = this._buffer;
  if (buffer.length === 0 && this._maxBufferSize >= 0) {
    try { this._read(); }
    catch (readError) { this._error(readError); }
  }
  // Return the first item of the buffer if it exists
  if (buffer.length !== 0) {
    item = buffer.shift();
    this._fillBufferAsync();
  }
  return item;
};

// Closes the iterator, clearing pending and future events
Iterator.prototype.close = function () {
  if (!this._ended) {
    this.emit('close');
    this._rejectDataListeners();
  }
};

// Reads items into the buffer by calling `this._push`/`push`
Iterator.prototype._read = function () {
  throw new Error('The _read method has not been implemented.');
};

// Adds an item to the iterator, or ends it if `null` is pushed;
// arrival of new data can be signaled with `push()`
Iterator.prototype._push = function (item) {
  // `null` indicates the end of the stream
  if (item === null)
    return this._end();
  // A missing `item` parameter signals the iterator will become readable
  if (item === undefined)
    return this._ended || this.emit('readable');
  // Negative maximum buffer size means the stream has ended
  if (this._maxBufferSize < 0)
    throw new Error('Cannot push because the iterator was ended.');
  this._buffer.push(item);
  this.emit('readable');
};

// Signals that no further items will become available
Iterator.prototype._end = function () {
  if (this._maxBufferSize >= 0) {
    // Indicate we are no longer accepting new items
    this._maxBufferSize = -1;
    // Try to fill the buffer (if the end is reached, 'end' will be emitted)
    this._fillBufferAsync();
  }
};

// Fills the buffer using `_read` to speed up subsequent `read` calls,
// or emits the 'end' event if no items are left.
Iterator.prototype._fillBuffer = function () {
  // Keep filling as long as the length changes and is less than the maximum
  var buffer = this._buffer, prevBufferLength = -1;
  while (prevBufferLength !== buffer.length && this._buffer.length < this._maxBufferSize) {
    prevBufferLength = buffer.length;
    try { this._read && this._read(); }
    catch (readError) { this._error(readError); }
  }
  // Emit the 'end' event if the iterator is empty
  if (this.ended) {
    this.emit('end');
    this._rejectDataListeners();
  }
};

// Asynchronously calls `_fillBuffer`
Iterator.prototype._fillBufferAsync = function () {
  // Fill if the buffer size is below maximum or the iterator has ended
  if (!this._fillBufferPending && (this._buffer.length < this._maxBufferSize || this.ended)) {
    this._fillBufferPending = true;
    setImmediate(function (self) {
      self._fillBufferPending = false;
      self._fillBuffer();
    }, this);
  }
};

// Continuously fill the buffer as far as possible
Iterator.prototype._bufferAll = function () {
  this._maxBufferSize = Infinity;
  this._fillBufferAsync();
  this.on('readable', this._fillBuffer.bind(this));
};

// Signals that an iterator error has occurred
Iterator.prototype._error = function (error) {
  if (!this._handlingError) {
    this._handlingError = true;
    this.emit('error', error);
  }
};

// Removes all current and future data listeners
Iterator.prototype._rejectDataListeners = function () {
  removeDataListeners.call(this);
  this.removeListener('newListener', removeDataListeners);
  this.on('newListener', removeDataListeners);
};
function removeDataListeners() {
  this.removeAllListeners('data');
  this.removeAllListeners('readable');
  this.removeAllListeners('end');
  this.removeAllListeners('error');
}

// Returns whether the iterator has no more items
Object.defineProperty(Iterator.prototype, 'ended', {
  enumerable: true,
  // An iterator has ended if the buffer is empty and the maximum buffer size negative
  get: function () { return this._buffer.length === 0 && this._maxBufferSize < 0; },
});

// Checks whether a value has been set for the given property
Iterator.prototype.hasProperty = function (propertyName) {
  return ('_properties' in this) && (propertyName in this._properties);
};

// Gets the value of the property,
// either as return value (sync) or through the callback (async, when ready)
Iterator.prototype.getProperty = function (propertyName, callback, self) {
  if (this.hasProperty(propertyName)) {
    var value = this._properties[propertyName];
    return callback ? (self ? callback.call(self, value) : callback(value)) : value;
  }
  callback && this.once(propertyName + 'Set', self ? callback.bind(self) : callback);
};

// Sets the property to the given value
Iterator.prototype.setProperty = function (propertyName, value) {
  var properties = this._properties || (this._properties = Object.create(null));
  properties[propertyName] = value;
  this.emit(propertyName + 'Set', value);
};

// Inherits the properties of the source iterator
Iterator.prototype._inheritProperties = function (source) {
  if (source.setProperty) {
    // Ensure the source has properties
    source.setProperty('child', true);
    this._properties = Object.create(source._properties);
    // Add existing property listeners to source
    for (var event in this._events) {
      /\Set$/.test(event) && this.listeners(event).forEach(function (listener) {
        source.addListener(event, listener);
      });
    }
    // Add new property listeners to source
    this.on('newListener', function (event, listener) {
      if (/\Set$/.test(event))
        source.addListener(event, listener);
    });
  }
};

// Returns the remaining items of the iterator as an array
Iterator.prototype.toArray = function (callback) {
  var self = this, items = [];
  if (this.ended) return done();
  this.on('data',  read);
  this.on('end',   done);
  this.on('error', done);
  function read(item) { items.push(item); }
  function done(error) {
    self.removeListener('data',  read);
    self.removeListener('end',   done);
    self.removeListener('error', done);
    try { callback && callback(error, error ? null : items); }
    finally { callback = items = null; }
  }
};

// Creates a clone of this iterator that replays the stream.
// When the first clone is created, the stream is cached in memory.
// After cloning, the iterator may not be read directly.
Iterator.prototype.clone = function () {
  // If no clone was created of this iterator, initialize the cloning mechanism
  if (!this._origRead) {
    // `_cache` will hold all items read by the buffer
    this._cache = [];
    // Remove the listener limit, as clones might use a lot of listeners
    this.setMaxListeners(0);
    // Disable regular reading; all reads should happen through clones
    this._origRead = this.read;
    this.read = function () {
      throw new Error('This iterator has been cloned and may not be read directly.');
    };
  }

  // Create a new clone that inherits its properties from this iterator
  var clone = new Iterator();
  clone._inheritProperties(this);
  // If there are no items in this stream, just end the clone
  if (this.ended && this._cache.length === 0)
    clone._end();
  // Allow this clone to be read
  else {
    var source = this, readPosition = 0;
    // Reads an item from the clone
    clone.read = function () {
      var item;
      // Try to retrieve the item from cache
      if (readPosition < source._cache.length)
        item = source._cache[readPosition++];
      // If unavailable, try to read it from the source iterator
      else {
        item = source._origRead();
        item && (source._cache[readPosition++] = item);
      }
      // If no more items are available, end the clone
      if (source.ended && readPosition === source._cache.length)
        clone._end();
      return item;
    };
    // Disable the buffered reading mechanism
    clone._read = noop;
    // Signal when new items are available
    this.on('readable', function () { clone.emit('readable'); });
    // Signal when no more items will become available
    this.on('end', function () {
      if (readPosition === source._cache.length)
        clone._end();
    });
    // Pass errors from the source
    this.on('error', function (error) { clone.emit('error', error); });
  }
  return clone;
};

// Generates a textual representation of the iterator
Iterator.prototype.toString = function () {
  return '[' + this.constructor.name + ']';
};

// Makes the specified class inherit from the iterator
Iterator.inherits = function (child) {
  util.inherits(child, this);
  child.inherits = this.inherits;
};




/*    PRE-DEFINED ITERATOR TYPES    */


// Creates an empty iterator
function EmptyIterator() {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator();
  Iterator.call(this);
  this._end();
}
Iterator.inherits(EmptyIterator);



// Creates a single-item iterator
function SingleIterator(item) {
  if (!(this instanceof SingleIterator))
    return new SingleIterator(item);
  Iterator.call(this);
  this._push(item);
  this._end();
}
Iterator.inherits(SingleIterator);



// Creates an iterator that never emits an item
function WaitingIterator() {
  if (!(this instanceof WaitingIterator))
    return new WaitingIterator();
  Iterator.call(this);
  this._rejectDataListeners();
}
Iterator.inherits(WaitingIterator);

// Don't read anything
WaitingIterator.prototype.read = function () { return null; };



// Creates an iterator from an array
function ArrayIterator(array) {
  if (!(this instanceof ArrayIterator))
    return new ArrayIterator(array);
  Iterator.call(this);

  // Push all items of the array and end the iterator
  var length = (array && array.length) | 0;
  if (length > 0) {
    var buffer = this._buffer = new Array(length);
    for (var i = 0; i < length; i++)
      buffer[i] = array[i];
  }
  this._end();
}
Iterator.inherits(ArrayIterator);



// Creates an iterator that bases its output on another iterator or stream.
// The source can be passed as an optional first argument, or set later through `setSource`.
function TransformIterator(source, options) {
  if (!(this instanceof TransformIterator))
    return new TransformIterator(source, options);
  // Shift the arguments if the optional `source` argument is not given
  if (source && typeof source.on !== 'function') options = source, source = null;
  Iterator.call(this, options);
  source && this.setSource(source);
}
Iterator.inherits(TransformIterator);

// Keep track of the transformer's status
var WAITING = 0, TRANSFORMING = 1, ENDING = 2;
TransformIterator.prototype._transformStatus = WAITING;

// Sets the iterator's source
TransformIterator.prototype.setSource = function (source) {
  if (this.hasOwnProperty('_source'))
    throw new Error('Source already set.');
  this._source = source;
  this._properties || this._inheritProperties(source);

  // If the source is still active, listen to its events
  if (!source.ended) {
    var self = this;
    source.on('error', function (error) { self._error(error); });
    source.on('end', function () {
      // If not transforming, end immediately
      if (self._transformStatus === WAITING) self._flush();
      // Otherwise, end as soon as the transformation has finished
      else self._transformStatus = ENDING;
    });
    // When a readable listener is attached, wait for the source to become readable
    this.on('newListener', function waitForReadable(event) {
      if (event === 'readable') {
        self._fillBufferAsync();
        source.on('readable', function () { self._fillBuffer(); });
        this.removeListener('newListener', waitForReadable);
      }
    });
    if (EventEmitter.listenerCount(this, 'readable') !== 0)
      this.emit('newListener', 'readable');
  }
  // If the source has already ended, simply end this iterator
  else this._end();
};

// The default source never emits items
TransformIterator.prototype._source = WaitingIterator();

// Reads data by calling `_transform`
TransformIterator.prototype._read = function () {
  switch (this._transformStatus) {
  // Read if we're not already transforming
  case WAITING:
    var item = this._source.read();
    if (item !== null) {
      var self = this;
      this._transformStatus = TRANSFORMING;
      this._transform(item, function () {
        if (self._transformStatus === TRANSFORMING)
          self._transformStatus = WAITING;
        self.emit('readable', self);
      });
    }
    break;
  // End the iterator if the source has ended
  case ENDING:
    this._transformStatus = WAITING;
    this._flush();
    break;
  }
};

// Transforms data from the source iterator
TransformIterator.prototype._transform = function (item, done) {
  throw new Error('The _transform method has not been implemented.');
};

// Flushes remaining data after the source has ended
TransformIterator.prototype._flush = function () {
  this._end();
};

// Generates a textual representation of the iterator
TransformIterator.prototype.toString = function () {
  return Iterator.prototype.toString.call(this) +
         '\n  <= ' + this.getSourceString();
};

// Generates a textual representation of the source of this iterator
TransformIterator.prototype.getSourceString = function () {
  return this.hasOwnProperty('_source') ? this._source.toString() : '(none)';
};



// Creates an iterator with another iterator or stream as source
function PassthroughIterator(source, options) {
  if (!(this instanceof PassthroughIterator))
    return new PassthroughIterator(source, options);
  TransformIterator.call(this, source, options);
}
TransformIterator.inherits(PassthroughIterator);

// Sets the iterator's source and inherit its properties
PassthroughIterator.prototype.setSource = function (source) {
  TransformIterator.prototype.setSource.call(this, source);
  this._inheritProperties(source);
};

// Reads a chunk from the source
PassthroughIterator.prototype._read = function () {
  // If an item was ready, push it
  var item = this._source && this._source.read();
  if (item !== null) this._push(item);
};

// Generates a textual representation of the iterator
PassthroughIterator.prototype.toString = function () {
  if (!this.hasOwnProperty('_source'))
    return Iterator.prototype.toString.call(this);
  return this.getSourceString();
};



// Creates a push-only iterator with an in-memory buffer
function BufferIterator() {
  if (!(this instanceof BufferIterator))
    return new BufferIterator();
  Iterator.call(this);
}
Iterator.inherits(BufferIterator);

// Don't actively read; wait for _push calls
BufferIterator.prototype._read = noop;




/*             EXPORTS              */


module.exports = Iterator;
Iterator.Iterator = Iterator;
Iterator.EmptyIterator = Iterator.empty = EmptyIterator;
Iterator.SingleIterator = Iterator.single = SingleIterator;
Iterator.WaitingIterator = Iterator.waiting = WaitingIterator;
Iterator.ArrayIterator = Iterator.fromArray = ArrayIterator;
Iterator.TransformIterator = Iterator.transform = TransformIterator;
Iterator.StreamIterator = Iterator.fromStream = PassthroughIterator;
Iterator.PassthroughIterator = Iterator.passthrough = PassthroughIterator;
Iterator.BufferIterator = Iterator.buffered = BufferIterator;

},{"events":5,"util":10}],19:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A LimitIterator emits a given number of items from a source. */

var TransformIterator = require('./Iterator').TransformIterator;

// Creates a new LimitIterator with the given offset and limit
function LimitIterator(source, offset, limit, options) {
  if (!(this instanceof LimitIterator))
    return new LimitIterator(source, offset, limit, options);
  TransformIterator.call(this, source, options);

  this._offset = offset = isFinite(offset) ? Math.max(~~offset, 0) : 0;
  this._limit  = limit  = isFinite(limit)  ? Math.max(~~limit,  0) : Infinity;
  (limit === 0) && this._end();
}
TransformIterator.inherits(LimitIterator);

// Reads `limit` items after skipping `offset` items
LimitIterator.prototype._read = function () {
  // Read only if the limit has not been reached yet
  if (!this._reading && this._limit !== 0) {
    var source = this._source, item;
    if (source) {
      this._reading = true;
      // Skip items until the desired offset is reached
      while (this._offset !== 0) {
        if ((item = source.read()) === null)
          return this._reading = false;
        this._offset--;
      }
      // Read the next item (careful: a recursive invocation)
      if ((item = source.read()) !== null) {
        if (this._maxBufferSize > -1) this._push(item); // TODO: eliminate and check
        if (--this._limit <= 0) this._end();
      }
      this._reading = false;
    }
  }
};

module.exports = LimitIterator;

},{"./Iterator":18}],20:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A MultiTransformIterator transforms items of a source into zero, one, or multiple items.
    To this end, it creates a new transforming iterator for each item it reads from the source. */

var TransformIterator = require('./Iterator').TransformIterator;

// Creates a new MultiTransformIterator
function MultiTransformIterator(source, options) {
  if (!(this instanceof MultiTransformIterator))
    return new MultiTransformIterator(source, options);
  TransformIterator.call(this, source, options);

  // Keep a copy of the options to create transformers, removing the `optional` setting
  this._options = options || {};
  if (this._optional = this._options.optional || false)
    (this._options = Object.create(this._options)).optional = false;
  // Queue of transformers, each corresponding to a different item of the source
  this._transformerQueue = [];
  // Bound event handlers that will be attached to transformers
  var self = this;
  this._emitError = function (error) { self.emit('error', error); };
  this._fillBufferBound = function () { self._fillBuffer(); };
}
TransformIterator.inherits(MultiTransformIterator);

// Keep track of the transformer's status
var WAITING = 0, TRANSFORMING = 1, ENDING = 2;

// Reads an item from the next readable transformer,
// creating transformers for new items as necessary
MultiTransformIterator.prototype._read = function () {
  var item, transformer, transformerQueue = this._transformerQueue, optional = this._optional;

  // Disallow recursive transformations
  if (this._transformStatus !== WAITING) return;
  this._transformStatus = TRANSFORMING;

  // Find the first readable transformer by dequeuing ended transformers
  while ((transformer = transformerQueue[0]) && transformer.ended) {
    transformerQueue.shift();
    // If transforming is optional and the transformer was empty, read the original item
    if (optional) {
      if (!this._itemTransformed) {
        this._push(transformer.item);
        return this._transformStatus = WAITING;
      }
      this._itemTransformed = false;
    }
  }

  // Create new transformers if no readable transformer was left
  if (!transformer) {
    do {
      // Create a transformer for the next item
      if (item = this._source.read()) {
        transformer = this._createTransformer(item, this._options);
        // If the transformer has items, add it to the queue and listen for events
        if (transformer && !transformer.ended) {
          transformer.item = item;
          transformerQueue.push(transformer);
          transformer.on('error',    this._emitError);
          transformer.on('readable', this._fillBufferBound);
          transformer.on('end',      this._fillBufferBound);
        }
        // If transforming is optional and the transformer is empty, read the original item
        else if (optional) {
          this._push(item);
          return this._transformStatus = WAITING;
        }
      }
    } while (item && transformerQueue.length < this._maxBufferSize);
    // If no fragments are left, this iterator has ended
    if (!(transformer = transformerQueue[0])) {
      if (this._source.ended)
        this._end();
      return this._transformStatus = WAITING;
    }
  }

  // Read an item from the first readable transformer
  item = this._readTransformer(transformer, transformer.item);
  if (item !== null) {
    optional && (this._itemTransformed = true);
    this._push(item);
  }
  this._transformStatus = WAITING;
};

// Creates a transforming iterator for the given item.
// A transformer may output several items per item.
MultiTransformIterator.prototype._createTransformer = function (item, options) {
  throw new Error('The _createTransformer method has not been implemented.');
};

// Reads an item from the given transforming iterator
MultiTransformIterator.prototype._readTransformer = function (transformer, transformerItem) {
  return transformer.read();
};

// Flushes remaining data after the source has ended
MultiTransformIterator.prototype._flush = function () {
  // Transformers might still have items, so try to fill the buffer
  this._fillBuffer();
};

module.exports = MultiTransformIterator;

},{"./Iterator":18}],21:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A SortIterator emits the items of a source in a sorted way. */

var TransformIterator = require('./Iterator').TransformIterator;

// Creates a new SortIterator with the given filter
function SortIterator(source, sort, options) {
  if (!(this instanceof SortIterator))
    return new SortIterator(source, sort, options);
  // Shift arguments if `sort` is omitted
  if (typeof sort !== 'function')
    options = sort, sort = null;
  TransformIterator.call(this, source, options);

  // The `window` parameter indicates the length of the sliding window to apply sorting
  var window = options && options.window;
  this._windowLength = isFinite(window) && window > 0 ? ~~window : Infinity;
  this._sort = sort || defaultSort;
  this._sorted = [];
}
TransformIterator.inherits(SortIterator);

// Reads the smallest item in the current sorting window
SortIterator.prototype._read = function () {
  var item, sorted = this._sorted, source = this._source, length = sorted.length;
  if (source) {
    // Try to read items until we reach the desired window length
    while (length !== this._windowLength && (item = source.read()) !== null) {
      // Insert the item in the sorted window (smallest last)
      var left = 0, right = length - 1, mid, order;
      while (left <= right) {
        order = this._sort(item, sorted[mid = (left + right) >> 1]);
        if      (order < 0) left  = mid + 1;
        else if (order > 0) right = mid - 1;
        else left = mid, right = -1;
      }
      sorted.splice(left, 0, item), length++;
    }
    // Push the smallest item in the window
    (length === this._windowLength) && this._push(sorted.pop());
  }
};

// Flushes remaining data after the source has ended
SortIterator.prototype._flush = function () {
  var sorted = this._sorted, length = sorted.length;
  while (length--)
    this._push(sorted.pop());
  this._end();
};

// Default sorting function
function defaultSort(a, b) {
  if (a < b) return -1;
  if (a > b) return  1;
  return 0;
}

module.exports = SortIterator;

},{"./Iterator":18}],22:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A UnionIterator returns the results from a set of source iterators. */

var Iterator = require('./Iterator');

// Creates a new UnionIterator from the given sources
function UnionIterator(sources, options) {
  if (!(this instanceof UnionIterator))
    return new UnionIterator(sources, options);
  Iterator.call(this, options);

  // Construct a list of readable sources
  this._sources = [];
  this._sourceIndex = 0;
  if (sources && sources.length) {
    // Create event listeners
    var self = this;
    function fillBuffer()     { self._fillBuffer(); }
    function emitError(error) { self._error(error); }

    // Add all readable sources and listen to their events
    for (var i = 0, l = sources.length; i < l; i++) {
      var source = sources[i];
      if (source && !source.ended) {
        this._sources.push(source);
        source.on('readable', fillBuffer);
        source.on('end',      fillBuffer);
        source.on('error',    emitError);
      }
    }
  }
  // If there are no readable sources, end the iterator
  (this._sources.length === 0) && this._end();
  this._reading = false;
}
Iterator.inherits(UnionIterator);

// Reads items from the sources in a round-robin way
UnionIterator.prototype._read = function () {
  if (this._reading) return;
  this._reading = true;

  var item = null, sources = this._sources, attempts = sources.length;
  // While no item has been found, attempt to read all sources once
  while (!item && attempts--) {
    var source = sources[this._sourceIndex];
    item = source.read();
    // Remove the current source if it has ended
    source.ended ? sources.splice(this._sourceIndex, 1) : this._sourceIndex++;
    (this._sourceIndex < sources.length) || (this._sourceIndex = 0);
  }
  // Push the item if one has been found
  (item !== null) && this._push(item);
  // End the iterator if no readable sources are left
  (this._sources.length === 0) && this._end();
  this._reading = false;
};

module.exports = UnionIterator;

},{"./Iterator":18}],23:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A FragmentsClient fetches Triple Pattern Fragments through HTTP. */

var HttpClient = require('../util/HttpClient'),
    Iterator = require('../iterators/Iterator'),
    rdf = require('../util/RdfUtil'),
    Cache = require('lru-cache'),
    CompositeExtractor = require('../extractors/CompositeExtractor'),
    CountExtractor = require('../extractors/CountExtractor'),
    ControlsExtractor = require('../extractors/ControlsExtractor'),
    _ = require('lodash');

// Prefer quad-based serialization formats (which allow a strict data/metadata separation),
// and prefer less verbose formats. Also, N3 support is only partial.
var DEFAULT_ACCEPT = 'application/trig;q=1.0,application/n-quads;q=0.7,' +
                     'text/turtle;q=0.6,application/n-triples;q=0.3,text/n3;q=0.2';
var parserTypes = [
  require('./TrigFragmentIterator'),
  require('./TurtleFragmentIterator'),
];

// Creates a new FragmentsClient
function FragmentsClient(startFragment, options) {
  if (!(this instanceof FragmentsClient))
    return new FragmentsClient(startFragment, options);

  // Set HTTP and cache options
  options = _.defaults(options || {}, { contentType: DEFAULT_ACCEPT });
  this._cache = new Cache({ max: 100 });
  this._httpClient = options.httpClient || new HttpClient(options);

  // Extract counts and triple pattern fragments controls by default
  this._metadataExtractor = options.metadataExtractor || new CompositeExtractor({
    metadata: [ new CountExtractor() ],
    controls: [ new ControlsExtractor() ],
  });

  if (startFragment) {
    // Fetch the start fragment if necessary
    if (typeof startFragment === 'string') {
      var startFragmentUrl = this._startFragmentUrl = startFragment;
      startFragment = new Fragment(this);
      startFragment.loadFromUrl(startFragmentUrl);
    }
    this._startFragment = startFragment;
    startFragment.setMaxListeners(100); // several error listeners might be attached temporarily
    startFragment.once('error', function (error) { startFragment.error = error; });
    startFragment.getProperty('controls', function () {
      startFragment.error = null;
      startFragment.removeAllListeners('error');
    });
  }
}

// Returns the Triple Pattern Fragment for the given triple pattern
FragmentsClient.prototype.getFragmentByPattern = function (pattern) {
  // Check whether the fragment was cached
  var cache = this._cache, key = JSON.stringify(pattern);
  if (cache.has(key))
    return cache.get(key).clone();
  // Create a dummy iterator until the fragment is loaded
  var fragment = new Fragment(this);

  // Ensure the start fragment is loaded correctly
  var startFragment = this._startFragment;
  if (startFragment.error !== null) {
    if (startFragment.error)
      return setImmediate(startFragmentError), fragment;
    startFragment.once('error', startFragmentError);
  }
  function startFragmentError() { fragment.emit('error', startFragment.error); fragment._end(); }

  // Retrieve the fragment using the start fragment's controls
  startFragment.getProperty('controls', function (controls) {
    // Replace all variables and blanks in the pattern by `null`
    var subject   = rdf.isVariableOrBlank(pattern.subject)   ? null : pattern.subject;
    var predicate = rdf.isVariableOrBlank(pattern.predicate) ? null : pattern.predicate;
    var object    = rdf.isVariableOrBlank(pattern.object)    ? null : pattern.object;

    // Only attempt to fetch the fragment if its components are valid
    if (rdf.isLiteral(subject) || rdf.isLiteral(predicate)) return fragment.empty();

    // Load and cache the fragment
    pattern = { subject: subject, predicate: predicate, object: object };
    fragment.loadFromUrl(controls.getFragmentUrl(pattern));
  });
  cache.set(key, fragment);
  return fragment.clone();
};

// Creates a new Triple Pattern Fragment
function Fragment(fragmentsClient) {
  if (!(this instanceof Fragment))
    return new Fragment(fragmentsClient);
  Iterator.call(this);

  this._fragmentsClient = fragmentsClient;
}
Iterator.inherits(Fragment);

// Reads data from the current page of the fragment
Fragment.prototype._read = function () {
  if (this._fragmentPage) {
    var item = this._fragmentPage.read();
    item && this._push(item);
  }
};

// Loads the Triple Pattern Fragment located at the given URL
Fragment.prototype.loadFromUrl = function (pageUrl) {
  // Fetch a page of the fragment
  var self = this, fragmentsClient = this._fragmentsClient, fragmentPage,
      headers = { 'user-agent': 'Triple Pattern Fragments Client' };
  if (fragmentsClient._startFragmentUrl) headers.referer = fragmentsClient._startFragmentUrl;
  fragmentPage = fragmentsClient._httpClient.get(pageUrl, headers);
  fragmentPage.on('error', function (error) { self.emit('error', error); });

  fragmentPage.getProperty('statusCode', function (statusCode) {
    // Don't parse the page if its retrieval was unsuccessful
    if (statusCode !== 200) {
      fragmentPage.emit('error', new Error('Could not retrieve ' + pageUrl +
                                           ' (' + statusCode + ')'));
      return self._end();
    }

    // Obtain the page's data, metadata, and controls
    fragmentPage.getProperty('contentType', function (contentType) {
      // Parse the page using the appropriate parser for the content type
      var Parser = _.find(parserTypes, function (P) { return P.supportsContentType(contentType); });
      if (!Parser)
        return self.emit('error', new Error('No parser for ' + contentType + ' at ' + pageUrl));
      var parsedPage = self._fragmentPage = new Parser(fragmentPage, pageUrl);
      parsedPage.on('readable', function () { self.emit('readable'); });

      // Extract the page's metadata and controls
      var controls = {};
      fragmentsClient._metadataExtractor.extract({ fragmentUrl: pageUrl },
        parsedPage.metadataStream, function (error, metadata) {
          // Emit all new properties
          for (var type in metadata)
            if (!self.getProperty(type))
              self.setProperty(type, metadata[type]);
          // Store the controls so we can find the next page
          controls = metadata.controls || controls;
        });

      // Load the next page when this one is finished, using setImmediate to wait for controls
      parsedPage.on('end', function () { setImmediate(loadNextPage); });
      function loadNextPage() {
        // Find the next page's URL through hypermedia controls in the current page
        var nextPage;
        try { nextPage = controls && controls.nextPage; } catch (controlError) {}
        // Load the next page, or end if none was found
        nextPage ? self.loadFromUrl(nextPage) : self._end();
      }
      parsedPage.on('error', function (error) { fragmentPage.emit('error', error); });

      // A new page of data has been loaded, so this fragment is readable again
      self.emit('readable');
    });
  });
};

// Empties the fragment and returns it
Fragment.prototype.empty = function () {
  if (!this.getProperty('metadata'))
    this.setProperty('metadata', { totalTriples: 0 });
  return this._end(), this;
};

module.exports = FragmentsClient;

},{"../extractors/CompositeExtractor":12,"../extractors/ControlsExtractor":13,"../extractors/CountExtractor":14,"../iterators/Iterator":18,"../util/HttpClient":31,"../util/RdfUtil":33,"./TrigFragmentIterator":26,"./TurtleFragmentIterator":28,"lodash":38,"lru-cache":39}],24:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A ReorderingGraphPatternIterator builds bindings by reading matches for a basic graph pattern. */

var Iterator = require('../iterators/Iterator'),
    MultiTransformIterator = require('../iterators/MultiTransformIterator'),
    rdf = require('../util/RdfUtil'),
    _ = require('lodash'),
    Logger = require('../util/ExecutionLogger')('ReorderingGraphPatternIterator');

var TriplePatternIterator = require('./TriplePatternIterator');

// Creates a new ReorderingGraphPatternIterator
function ReorderingGraphPatternIterator(parent, pattern, options) {
  // Empty patterns have no effect; return a pass-through iterator
  if (!pattern || !pattern.length)
    return new Iterator.passthrough(parent, options);
  // A one-element pattern can be solved by a triple pattern iterator
  if (pattern.length === 1)
    return new TriplePatternIterator(parent, pattern[0], options);
  // For length two or more, construct a ReorderingGraphPatternIterator
  if (!(this instanceof ReorderingGraphPatternIterator))
    return new ReorderingGraphPatternIterator(parent, pattern, options);
  MultiTransformIterator.call(this, parent, options);

  this._pattern = pattern;
  this._client = this._options.fragmentsClient;
}
MultiTransformIterator.inherits(ReorderingGraphPatternIterator);

// Creates a pipeline with triples matching the binding of the iterator's graph pattern
ReorderingGraphPatternIterator.prototype._createTransformer = function (bindings, options) {
  // Apply the context bindings to the iterator's graph pattern
  var boundPattern = rdf.applyBindings(bindings, this._pattern);
  // Select the smallest connected subpattern with the least number of unique variables in the resulting pattern
  var subPatterns = _.sortBy(rdf.findConnectedPatterns(boundPattern), function (patterns) {
        var distinctVariableCount = _.union.apply(_, patterns.map(rdf.getVariables)).length;
        return -(boundPattern.length * distinctVariableCount + patterns.length);
      }),
      subPattern = subPatterns.pop(), remainingPatterns = subPattern.length, pipeline;

  // If this subpattern has only one triple pattern, use it to create the pipeline
  if (remainingPatterns === 1)
    return createPipeline(subPattern.pop());

  // Otherwise, we must first find the best triple pattern to start the pipeline
  pipeline = new Iterator.PassthroughIterator(true);
  // Retrieve and inspect the triple patterns' metadata to decide which has least matches
  var bestIndex = 0, minMatches = Infinity;
  subPattern.forEach(function (triplePattern, index) {
    var fragment = this._client.getFragmentByPattern(triplePattern);
    fragment.getProperty('metadata', function (metadata) {
      Logger.logBinding(this, bindings, triplePattern, metadata.totalTriples);
      // We don't need more data from the fragment
      fragment.close();
      // If there are no matches, the entire graph pattern has no matches
      if (metadata.totalTriples === 0)
        return pipeline._end();
      // This triple pattern is the best if it has the lowest number of matches
      if (metadata.totalTriples < minMatches)
        bestIndex = index, minMatches = metadata.totalTriples;
      // After all patterns were checked, create the pipeline from the best pattern
      if (--remainingPatterns === 0)
        pipeline.setSource(createPipeline(subPattern.splice(bestIndex, 1)[0]));
    }, this);
    // If the fragment errors, pretend it was empty
    fragment.on('error', function (error) {
      Logger.warning(error.message);
      if (!fragment.getProperty('metadata'))
        fragment.setProperty('metadata', { totalTriples: 0 });
    });
  }, this);
  return pipeline;

  // Creates the pipeline of iterators for the bound graph pattern,
  // starting with a TriplePatternIterator for the triple pattern,
  // then a ReorderingGraphPatternIterator for the remainder of the subpattern,
  // and finally, ReorderingGraphPatternIterators for the remaining subpatterns.
  function createPipeline(triplePattern) {
    // Create the iterator for the triple pattern
    var startIterator = Iterator.single(bindings),
        pipeline = new TriplePatternIterator(startIterator, triplePattern, options);
    // If the chosen subpattern has more triples, create a ReorderingGraphPatternIterator for it
    if (subPattern && subPattern.length !== 0)
      pipeline = new ReorderingGraphPatternIterator(pipeline, subPattern, options);
    // Create ReorderingGraphPatternIterators for all interconnected subpatterns
    while (subPattern = subPatterns.pop())
      pipeline = new ReorderingGraphPatternIterator(pipeline, subPattern, options);
    return pipeline;
  }
};

// Generates a textual representation of the iterator
ReorderingGraphPatternIterator.prototype.toString = function () {
  return '[' + this.constructor.name +
         ' {' + this._pattern.map(rdf.toQuickString).join(' ') + '}]' +
         '\n  <= ' + this.getSourceString();
};

module.exports = ReorderingGraphPatternIterator;

},{"../iterators/Iterator":18,"../iterators/MultiTransformIterator":20,"../util/ExecutionLogger":30,"../util/RdfUtil":33,"./TriplePatternIterator":27,"lodash":38}],25:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* An SparqlIterator returns the results of a SPARQL query. */

var SparqlParser = require('sparqljs').Parser,
    Iterator = require('../iterators/Iterator'),
    TransformIterator = Iterator.TransformIterator,
    ReorderingGraphPatternIterator = require('./ReorderingGraphPatternIterator'),
    UnionIterator = require('../iterators/UnionIterator'),
    FilterIterator = require('../iterators/FilterIterator'),
    SortIterator = require('../iterators/SortIterator'),
    LimitIterator = require('../iterators/LimitIterator'),
    DistinctIterator = require('../iterators/DistinctIterator'),
    SparqlExpressionEvaluator = require('../util/SparqlExpressionEvaluator'),
    _ = require('lodash'),
    util = require('util'),
    rdf = require('../util/RdfUtil'),
    createErrorType = require('../util/CustomError');

// Creates an iterator from a SPARQL query
function SparqlIterator(source, queryText, options) {
  // Shift arguments if `source` was omitted
  if (typeof source === 'string')
    options = queryText, queryText = source, source = null;

  // Transform the query into a cascade of iterators
  try {
    // Create an iterator that projects the bindings according to the query type
    var query = new SparqlParser(options.prefixes).parse(queryText),
        queryIterator, QueryConstructor = queryConstructors[query.queryType];
    if (!QueryConstructor)
      throw new Error('No iterator available for query type: ' + query.queryType);
    queryIterator = new QueryConstructor(true, query, options);

    // Create an iterator for bindings of the query's graph pattern
    var graphIterator = new SparqlGroupsIterator(source || Iterator.single({}),
                              queryIterator.patterns || query.where, options);
    // Create iterators for each order
    for (var i = query.order && (query.order.length - 1); i >= 0; i--) {
      var order = SparqlExpressionEvaluator(query.order[i].expression),
          ascending = !query.order[i].descending;
      graphIterator = new SortIterator(graphIterator, function (a, b) {
        var orderA = order(a), orderB = order(b);
        if (orderA < orderB) return ascending ? -1 :  1;
        if (orderB < orderA) return ascending ?  1 : -1;
        return 0;
      }, options);
    }
    queryIterator.setSource(graphIterator);

    // Create iterators for modifiers
    if (query.distinct)
      queryIterator = new DistinctIterator(queryIterator, options);
    // Add offsets and limits if requested
    if ('offset' in query || 'limit' in query)
      queryIterator = new LimitIterator(queryIterator, query.offset, query.limit, options);
    queryIterator.queryType = query.queryType;
    return queryIterator;
  }
  catch (error) {
    if (/Parse error/.test(error.message))
      error = new InvalidQueryError(queryText, error);
    else
      error = new UnsupportedQueryError(queryText, error);
    throw error;
  }
}
TransformIterator.inherits(SparqlIterator);

var queryConstructors = {
  SELECT: SparqlSelectIterator,
  CONSTRUCT: SparqlConstructIterator,
  DESCRIBE: SparqlDescribeIterator,
  ASK: SparqlAskIterator,
};



// Creates an iterator for a parsed SPARQL SELECT query
function SparqlSelectIterator(source, query, options) {
  TransformIterator.call(this, source, options);
  this.setProperty('variables', query.variables);
}
SparqlIterator.inherits(SparqlSelectIterator);

// Executes the SELECT projection
SparqlSelectIterator.prototype._transform = function (bindings, done) {
  this._push(this.getProperty('variables').reduce(function (row, variable) {
    // Project a simple variable by copying its value
    if (variable !== '*')
      row[variable] = rdf.deskolemize(bindings[variable]);
    // Project a star selector by copying all variable bindings
    else
      for (variable in bindings)
        if (rdf.isVariable(variable))
          row[variable] = rdf.deskolemize(bindings[variable]);
    return row;
  }, Object.create(null)));
  done();
};



// Creates an iterator for a parsed SPARQL CONSTRUCT query
function SparqlConstructIterator(source, query, options) {
  TransformIterator.call(this, source, options);

  // Push constant triple patterns only once
  this._template = query.template.filter(function (triplePattern) {
    return rdf.hasVariables(triplePattern) || this._push(triplePattern);
  }, this);
  this._blankNodeId = 0;
}
SparqlIterator.inherits(SparqlConstructIterator);

// Executes the CONSTRUCT projection
SparqlConstructIterator.prototype._transform = function (bindings, done) {
  var blanks = Object.create(null);
  this._template.forEach(function (triplePattern) {
    // Apply the result bindings to the triple pattern, ensuring no variables are left
    var s = triplePattern.subject, p = triplePattern.predicate, o = triplePattern.object,
        s0 = s[0], p0 = p[0], o0 = o[0];
    if (s0 === '?') { if ((s = rdf.deskolemize(bindings[s])) === undefined) return; }
    else if (s0 === '_') s = blanks[s] || (blanks[s] = '_:b' + this._blankNodeId++);
    if (p0 === '?') { if ((p = rdf.deskolemize(bindings[p])) === undefined) return; }
    else if (p0 === '_') p = blanks[p] || (blanks[p] = '_:b' + this._blankNodeId++);
    if (o0 === '?') { if ((o = rdf.deskolemize(bindings[o])) === undefined) return; }
    else if (o0 === '_') o = blanks[o] || (blanks[o] = '_:b' + this._blankNodeId++);
    this._push({ subject: s, predicate: p, object: o });
  }, this);
  done();
};



// Creates an iterator for a parsed SPARQL DESCRIBE query
function SparqlDescribeIterator(source, query, options) {
  // Create a template with `?var ?p ?o` patterns for each variable
  var variables = query.variables, template = query.template = [];
  for (var i = 0, l = variables.length; i < l; i++)
    template.push(rdf.triple(variables[i], '?__predicate' + i, '?__object' + i));
  query.where = query.where.concat({ type: 'bgp', triples: template });
  SparqlConstructIterator.call(this, source, query, options);
}
SparqlConstructIterator.inherits(SparqlDescribeIterator);

// Creates an iterator for a parsed SPARQL ASK query
function SparqlAskIterator(source, query, options) {
  TransformIterator.call(this, source, options);
}
SparqlIterator.inherits(SparqlAskIterator);

// If an answer to the query exists, end the iterator
SparqlAskIterator.prototype._transform = function (bindings, done) {
  this._push(true);
  this._push(null);
  done();
};

// If the iterator was not ended, no answer exists
SparqlAskIterator.prototype._flush = function () {
  if (!this.ended) {
    this._push(false);
    this._push(null);
  }
};


// Creates an iterator for a list of SPARQL groups
function SparqlGroupsIterator(source, groups, options) {
  // Chain iterators for each of the graphs in the group
  return groups.reduce(function (source, group) {
    return new SparqlGroupIterator(source, group, options);
  }, source);
}
Iterator.inherits(SparqlGroupsIterator);




// Creates an iterator for a SPARQL group
function SparqlGroupIterator(source, group, options) {
  // Reset flags on the options for child iterators
  var childOptions = options.optional ? _.create(options, { optional: false }) : options;

  switch (group.type) {
  case 'bgp':
    return new ReorderingGraphPatternIterator(source, group.triples, options);
  case 'group':
    return new SparqlGroupsIterator(source, group.patterns, childOptions);
  case 'optional':
    childOptions = _.create(options, { optional: true });
    return new SparqlGroupsIterator(source, group.patterns, childOptions);
  case 'union':
    return new UnionIterator(group.patterns.map(function (patternToken) {
      return new SparqlGroupIterator(source.clone(), patternToken, childOptions);
    }), options);
  case 'filter':
    // A set of bindings matches the filter if it doesn't evaluate to 0 or false
    var evaluate = SparqlExpressionEvaluator(group.expression);
    return new FilterIterator(source, function (bindings) {
      return !/^"false"|^"0"/.test(evaluate(bindings));
    }, options);
  default:
    throw new Error('Unsupported group type: ' + group.type);
  }
}
Iterator.inherits(SparqlGroupIterator);


// Error thrown when the query has a syntax error
var InvalidQueryError = createErrorType('InvalidQueryError', function (query, cause) {
  this.message = 'Syntax error in query\n' + cause.message;
});

// Error thrown when no combination of iterators can solve the query
var UnsupportedQueryError = createErrorType('UnsupportedQueryError', function (query, cause) {
  this.message = 'The query is not yet supported\n' + cause.message;
});


module.exports = SparqlIterator;
SparqlIterator.InvalidQueryError = InvalidQueryError;
SparqlIterator.UnsupportedQueryError = UnsupportedQueryError;

},{"../iterators/DistinctIterator":16,"../iterators/FilterIterator":17,"../iterators/Iterator":18,"../iterators/LimitIterator":19,"../iterators/SortIterator":21,"../iterators/UnionIterator":22,"../util/CustomError":29,"../util/RdfUtil":33,"../util/SparqlExpressionEvaluator":34,"./ReorderingGraphPatternIterator":24,"lodash":38,"sparqljs":51,"util":10}],26:[function(require,module,exports){
/*! @license ©2013 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A TrigFragmentIterator reads data and metadata from Linked Data Fragments in TriG. */

var TurtleFragmentIterator = require('./TurtleFragmentIterator');

// Creates a new TrigFragmentIterator
function TrigFragmentIterator(source, fragmentUrl) {
  if (!(this instanceof TrigFragmentIterator))
    return new TrigFragmentIterator(source, fragmentUrl);
  TurtleFragmentIterator.call(this, source, fragmentUrl);
}
TurtleFragmentIterator.inherits(TrigFragmentIterator);

// Sends the given parsed quad to the data or metadata stream
TrigFragmentIterator.prototype._processTriple = function (quad) {
  // Quads with a non-default graph are considered metadata
  if (!quad.graph) this._push(quad);
  else this.metadataStream._push(quad);
};

// Indicates whether the class supports the content type
TrigFragmentIterator.supportsContentType = function (contentType) {
  return (/^application\/(?:trig|n-quads)$/).test(contentType);
};

module.exports = TrigFragmentIterator;

},{"./TurtleFragmentIterator":28}],27:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A TriplePatternIterator builds bindings by reading matches for a triple pattern. */

var MultiTransformIterator = require('../iterators/MultiTransformIterator'),
    rdf = require('../util/RdfUtil'),
    Logger = require('../util/ExecutionLogger')('TriplePatternIterator');

// Creates a new TriplePatternIterator
function TriplePatternIterator(parent, pattern, options) {
  if (!(this instanceof TriplePatternIterator))
    return new TriplePatternIterator(parent, pattern, options);
  MultiTransformIterator.call(this, parent, options);

  this._pattern = pattern;
  this._client = this._options.fragmentsClient;
}
MultiTransformIterator.inherits(TriplePatternIterator);

// Creates a fragment with triples that match the binding of the iterator's triple pattern
TriplePatternIterator.prototype._createTransformer = function (bindings, options) {
  // Apply the bindings to the iterator's triple pattern
  var boundPattern = rdf.applyBindings(bindings, this._pattern);

  // Retrieve the fragment that corresponds to the resulting pattern
  var fragment = this._client.getFragmentByPattern(boundPattern);
  Logger.logFragment(this, fragment, bindings);
  fragment.on('error', function (error) { Logger.warning(error.message); });
  return fragment;
};

// Reads a binding from the given fragment
TriplePatternIterator.prototype._readTransformer = function (fragment, fragmentBindings) {
  // Read until we find a triple that leads to consistent bindings
  var triple;
  while (triple = fragment.read()) {
    // Extend the bindings such that they bind the iterator's pattern to the triple
    try { return rdf.extendBindings(fragmentBindings, this._pattern, triple); }
    catch (bindingError) { /* non-data triple, didn't match the bindings */ }
  }
  // No consistent bindings were available (yet)
  return null;
};

// Generates a textual representation of the iterator
TriplePatternIterator.prototype.toString = function () {
  return '[' + this.constructor.name +
         ' {' + rdf.toQuickString(this._pattern) + ')}' +
         '\n  <= ' + this.getSourceString();
};

module.exports = TriplePatternIterator;

},{"../iterators/MultiTransformIterator":20,"../util/ExecutionLogger":30,"../util/RdfUtil":33}],28:[function(require,module,exports){
/*! @license ©2013 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* A TurtleFragmentIterator reads data and metadata from Linked Data Fragments in Turtle. */

var TransformIterator = require('../iterators/Iterator').TransformIterator,
    BufferIterator = require('../iterators/Iterator').BufferIterator,
    rdf = require('../util/RdfUtil'),
    N3 = require('n3');

// Creates a new TurtleFragmentIterator
function TurtleFragmentIterator(source, fragmentUrl) {
  if (!(this instanceof TurtleFragmentIterator))
    return new TurtleFragmentIterator(source, fragmentUrl);
  TransformIterator.call(this, source);

  // Expose an additional metadata stream
  this.metadataStream = new BufferIterator();
  if (source && source.ended) return this.metadataStream._push(null);
  // When a metadata listener is added, drain the source to read metadata
  this.metadataStream.on('newListener', function metadataListenerAdded(event) {
    if (event === 'data' || event === 'end') {
      this.removeListener('newListener', metadataListenerAdded);
      self._bufferAll();
    }
  });

  // Convert Turtle into triples using the N3 parser
  var self = this;
  this._parser = new N3.Parser({ documentURI: fragmentUrl });
  this._parser.parse(function (error, triple) {
    triple && self._push(self._processTriple(triple)) ||
    error  && self.emit('error', error);
  });
  this._fragmentUrl = fragmentUrl;
}
TransformIterator.inherits(TurtleFragmentIterator);

// Sends a chunk of Turtle to the N3 parser to convert it to triples
TurtleFragmentIterator.prototype._transform = function (chunk, done) {
  this._parser.addChunk(chunk), done();
};

// Sends the given parsed triple to the data or metadata stream
TurtleFragmentIterator.prototype._processTriple = function (triple) {
  // This separation between data and metadata/controls is an approximation;
  // for a proper separation, use an RDF format with graph support (see TrigFragmentParser).
  if (triple.subject !== this._fragmentUrl && triple.predicate.indexOf(rdf.HYDRA) !== 0)
    this._push(triple);
  else
    this.metadataStream._push(triple);
};

// Closes the streams after the source has ended
TurtleFragmentIterator.prototype._flush = function () {
  // Ensure the parser processes possible pending triples
  this._parser.end();
  // Once all triples have been processed, end both streams
  this.metadataStream._end();
  this._end();
};

// Indicates whether the class supports the content type
TurtleFragmentIterator.supportsContentType = function (contentType) {
  return (/^(?:text\/turtle|text\/n3|application\/n-triples)$/).test(contentType);
};

module.exports = TurtleFragmentIterator;

},{"../iterators/Iterator":18,"../util/RdfUtil":33,"n3":40}],29:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */

// Creates a constructor for an Error with the given name
function createErrorType(name, init) {
  function E(message) {
    this.name = name;
    if (!Error.captureStackTrace)
      this.stack = (new Error()).stack;
    else
      Error.captureStackTrace(this, this.constructor);
    this.message = message;
    init && init.apply(this, arguments);
  }
  E.prototype = new Error();
  E.prototype.name = name;
  E.prototype.constructor = E;
  return E;
}

module.exports = createErrorType;

},{}],30:[function(require,module,exports){
/*! @license ©2013 Miel Vander Sande - Multimedia Lab / iMinds / Ghent University
 * */
var Logger = require('./Logger'), util = require('util'), Iterator = require('../iterators/Iterator');

if (typeof Iterator.prototype.uniqueId === 'undefined') {
  var uniqueId = 0;
  Iterator.prototype.uniqueId = function () {
    if (typeof this.__uniqueid === 'undefined')
      this.__uniqueid = ++uniqueId;
    return this.__uniqueid;
  };
}

function ExecutionLogger(name) {
  if (!(this instanceof ExecutionLogger))
    return new ExecutionLogger(name);
  Logger.call(this, name);
}
util.inherits(ExecutionLogger, Logger);

//TODO
ExecutionLogger.prototype.logBinding = function (iterator, bindings, triplePattern, count) {
  if (Logger.enabled('debug'))
    this.debug(ExecutionLogger.index++, iterator.uniqueId(), bindings, triplePattern, count);
};

//TODO
ExecutionLogger.prototype.logFragment = function (iterator, fragment, bindings) {
  if (Logger.enabled('debug')) {
    var self = this;
    fragment.getProperty('metadata', function (metadata) {
      self.logBinding(iterator, bindings, iterator._pattern, metadata && metadata.totalTriples);
    });
  }
};

ExecutionLogger.index = 1;

module.exports = ExecutionLogger;

},{"../iterators/Iterator":18,"./Logger":32,"util":10}],31:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */

var Iterator = require('../iterators/Iterator'),
    request = require('request'),
    Logger = require('../util/Logger.js'),
    zlib = require('zlib'),
    _ = require('lodash');

var activeRequests = {}, requestId = 0;

/**
 * Creates a new `HttpClient`.
 * @classdesc An `HttpClient` retrieves representations of resources through HTTP
 * and offers them through an iterator interface.
 * @param {String} [options.request=(the request npm module)] The HTTP request module
 * @param {String} [options.contentType=* / *] The desired content type of representations
 * @constructor
 */
function HttpClient(options) {
  if (!(this instanceof HttpClient))
    return new HttpClient(options);

  options = options || {};
  this._request = options.request || request;
  this._contentType = options.contentType || '*/*';
  this._queue = [];
  this._activeRequests = 0;
  this._maxActiveRequests = options.concurrentRequests || 20;
  this._logger = options.logger || Logger('HttpClient');
}

/**
 * Retrieves a representation of the resource with the given URL.
 * @param {string} url The URL of the resource
 * @param {Object} [headers] Additional HTTP headers to add
 * @param {Object} [options] Additional options for the HTTP request
 * @returns {Iterator} An iterator of the representation
 */
HttpClient.prototype.get = function (url, headers, options) {
  return this.request(url, 'GET', headers, options);
};

/**
 * Retrieves a representation of the resource with the given URL.
 * @param {string} url The URL of the resource
 * @param {string} [method='GET'] method The HTTP method to use
 * @param {Object} [headers] Additional HTTP headers to add
 * @param {Object} [options] Additional options for the HTTP request
 * @returns {Iterator} An iterator of the representation
 */
HttpClient.prototype.request = function (url, method, headers, options) {
  var responseIterator = new Iterator.PassthroughIterator(true), self = this;

  function performRequest() {
    self._logger.info('Requesting', url);
    self._activeRequests++;

    // Create the request
    var acceptHeaders = { accept: self._contentType, 'accept-encoding': 'gzip,deflate' };
    var requestOptions = {
      url: url,
      method: method || 'GET',
      headers: headers ? _.assign(acceptHeaders, headers) : acceptHeaders,
      timeout: 5000,
      followRedirect: true,
    }, request, startTime = new Date();
    try { request = self._request(options ? _.assign(requestOptions, options) : requestOptions); }
    catch (error) { return setImmediate(emitError, error), responseIterator; }
    activeRequests[request._id = requestId++] = request;
    function emitError(error) {
      responseIterator._error(error);
      delete activeRequests[request && request._id];
    }

    // React to a possible response
    request.on('response', function (response) {
      var statusCode = response.statusCode, headers = response.headers,
          responseTime = new Date() - startTime, encoding, contentType, nextRequest;
      // Start a possible queued request
      delete activeRequests[request._id];
      self._activeRequests--;
      (nextRequest = self._queue.shift()) && nextRequest();

      // Decompress the response when necessary
      switch (encoding = headers['content-encoding'] || '') {
      case 'gzip':
        response.pipe(response = zlib.createGunzip());
        break;
      case 'deflate':
        response.pipe(response = zlib.createInflate());
        break;
      case '':
        break;
      default:
        return responseIterator._error(new Error('Unsupported encoding: ' + encoding));
      }
      response.on('error', emitError);

      // Redirect output to the iterator
      response.setEncoding && response.setEncoding('utf8');
      response.pause && response.pause();
      responseIterator.setSource(response);
      // Responses _must_ be entirely consumed,
      // or they can lead to out-of-memory errors (http://nodejs.org/api/http.html)
      responseIterator._bufferAll();

      // Emit the metadata
      contentType = (headers['content-type'] || '').replace(/\s*(?:;.*)?$/, '');
      responseIterator.setProperty('statusCode', statusCode);
      responseIterator.setProperty('contentType', contentType);
      responseIterator.setProperty('responseTime', responseTime);
    })
    .on('error', emitError);
  }

  // Start or enqueue the request
  if (this._activeRequests < this._maxActiveRequests)
    performRequest();
  else
    this._queue.push(performRequest);

  return responseIterator;
};

// Abort all active requests
HttpClient.abortAll = function () {
  for (var id in activeRequests) {
    activeRequests[id].abort();
    delete activeRequests[id];
  }
};

module.exports = HttpClient;

},{"../iterators/Iterator":18,"../util/Logger.js":32,"lodash":38,"request":36,"zlib":4}],32:[function(require,module,exports){
/*! @license ©2013 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/* Extended by Miel Vander Sande: loosely based on log.js
 * https://github.com/visionmedia/log.js/blob/master/lib/log.js */

var rdf = require('./RdfUtil'),
    _ = require('lodash');

var LOG_LEVELS = ['EMERGENCY', 'ALERT', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'];

/**
 * Creates a new `Logger`.
 * @constructor
 * @classdesc A `Logger` provides debug output.
 * @param name The name of the logger
 */
function Logger(name) {
  if (!(this instanceof Logger))
    return new Logger(name);
  this._name = name || '';
}

/**
 * Logs the message with the given level
 * @param {String} level The log level
 * @param {...Object} items The items to log
 */
Logger.prototype.log = function (level, items) {
  items = _.map(items, this._format, this);
  items.unshift('[' + new Date() + ']', level, this._name);
  this._print(items);
};

// Add helper log functions for each level
LOG_LEVELS.forEach(function (level) {
  Logger.prototype[level.toLowerCase()] = function () { this.log(level, arguments); };
});

/**
 * Formats the item for logging, depending on its type.
 * @protected
 * @param {Object} item The item to format.
 * @returns {Object} the formatted item
 */
Logger.prototype._format = function (item) {
  // Stringify falsy items
  if (!item)
    return '' + item;
  // Format an array
  if (item instanceof Array)
    return JSON.stringify(item.map(this._format, this));
  // Format a triple
  if (item.subject && item.predicate && item.object)
    return rdf.toQuickString(item);
  // Return any other item as JSON
  return typeof item === 'string' ? item : JSON.stringify(item);
};

/**
 * Outputs the items to the console.
 * @param {Array} items The items to output.
 * @protected
 */
Logger.prototype._print = function (items) {
  console.error.apply(console, items);
};

/**
 * Outputs the items to the console as CSV.
 * @param {Array} items The items to output.
 * @protected
 */
Logger.prototype._printCSV = function (items) {
  console.error(items.map(function (item) {
    return !/["\n\r,]/.test(item) ? item : '"' + item.replace(/"/g, '""') + '"';
  }).join(','));
};

/**
 * Disables all loggers below the specified level.
 * @param {String} level The log level to disable
 */
Logger.setLevel = function (level) {
  var levelIndex = _.indexOf(LOG_LEVELS, level.toUpperCase());
  if (levelIndex >= 0)
    while (++levelIndex < LOG_LEVELS.length)
      Logger.prototype[LOG_LEVELS[levelIndex].toLowerCase()] = _.noop;
};

/**
 * Returns whether the given logging level is enabled
 * @param {String} level The log level to check
 */
Logger.enabled = function (level) {
  return (level in Logger.prototype) && (Logger.prototype[level] !== _.noop);
};

/**
 * Sets the logging mode of all loggers.
 * @param {String} modeName The name of the mode ("CSV", "plain")
 */
Logger.setMode = function (modeName) {
  if (modeName.toUpperCase() === 'CSV')
    Logger.prototype._print = Logger.prototype._printCSV;
};

module.exports = Logger;

},{"./RdfUtil":33,"lodash":38}],33:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
var N3 = require('n3'),
    _ = require('lodash');

/**
 * Utility functions for working with URIs, triples, variables, and patterns.
 * @exports RdfUtil
 * @extends N3.Util
 */
var util = module.exports = N3.Util({});

/* Methods for URIs */

/** Checks whether two URIs are equal after decoding, to make up for encoding differences. **/
util.decodedURIEquals = function (URIa, URIb) {
  if (URIa === URIb) return true;
  try { return decodeURI(URIa) === decodeURI(URIb); }
  catch (error) { return false; }
};

/** Transforms a skolemized URI into a blank node. */
util.deskolemize = function (URI) {
  return URI && URI.replace(genidMatcher, function (URI, id) {
    return '_:' + id.replace(/\W/g, '_');
  });
};
var genidMatcher = /^https?:\/\/[^\/]+\/\.well-known\/genid\/([^]+)$/;


/* Methods for triples */

/** Creates a triple object from the components. */
util.triple = function (subject, predicate, object) {
  return { subject: subject, predicate: predicate, object: object };
};


/* Methods for variables and triple patterns */

/** Creates a quick string representation of a triple or triple component. */
util.toQuickString = function (triple) {
  // Empty object means empty string
  if (!triple)
    return '';
  // Convert a triple component by abbreviating it
  if (typeof triple === 'string') {
    if (util.isVariableOrBlank(triple))
      return triple;
    if (util.isLiteral(triple))
      return '"' + util.getLiteralValue(triple) + '"';
    var match = triple.match(/([a-zA-Z\(\)_\.,'0-9]+)[^a-zAZ]*?$/);
    return match ? match[1] : triple;
  }
  // Convert a triple by converting its components
  return util.toQuickString(triple.subject) + ' ' +
         util.toQuickString(triple.predicate) + ' ' +
         util.toQuickString(triple.object) + '.';
};

/** Checks whether the entity represents a variable. */
util.isVariable = function (entity) {
  return (typeof entity !== 'string') || (entity[0] === '?');
};

/** Checks whether the triple pattern has variables. */
util.hasVariables = function (pattern) {
  return !!pattern && (util.isVariable(pattern.subject) ||
                       util.isVariable(pattern.predicate) ||
                       util.isVariable(pattern.object));
};

/** Returns all variables in the triple pattern. */
util.getVariables = function (pattern) {
  var variables = [];
  if (util.isVariable(pattern.subject))   variables.push(pattern.subject);
  if (util.isVariable(pattern.predicate)) variables.push(pattern.predicate);
  if (util.isVariable(pattern.object))    variables.push(pattern.object);
  return variables;
};

/** Checks whether the entity represents a variable or blank node. */
util.isVariableOrBlank = function (entity) {
  return (typeof entity !== 'string') || (entity[0] === '?') ||
                                         (entity[0] === '_' && entity[1] === ':');
};

/** Checks whether the triple pattern has variables or blanks. */
util.hasVariablesOrBlanks = function (pattern) {
  return !!pattern && (util.isVariableOrBlank(pattern.subject) ||
                       util.isVariableOrBlank(pattern.predicate) ||
                       util.isVariableOrBlank(pattern.object));
};

/** Creates a filter for triples that match the given pattern. */
util.tripleFilter = function (triplePattern) {
  var pattern = triplePattern || {},
      subject   = util.isVariableOrBlank(pattern.subject)   ? null : pattern.subject,
      predicate = util.isVariableOrBlank(pattern.predicate) ? null : pattern.predicate,
      object    = util.isVariableOrBlank(pattern.object)    ? null : pattern.object;
  return function (triple) {
    return (subject === null   || subject   === triple.subject) &&
           (predicate === null || predicate === triple.predicate) &&
           (object === null    || object    === triple.object);
  };
};

/** Applies the given bindings to the triple or graph pattern, returning a bound copy thereof. */
util.applyBindings = function (bindings, pattern) {
  // Bind a graph pattern
  if (typeof pattern.map === 'function')
    return pattern.map(function (p) { return util.applyBindings(bindings, p); });
  // Bind a triple pattern
  return {
    subject:   bindings[pattern.subject]   || pattern.subject,
    predicate: bindings[pattern.predicate] || pattern.predicate,
    object:    bindings[pattern.object]    || pattern.object,
  };
};

/** Finds the bindings that transform the pattern into the triple. */
util.findBindings = function (triplePattern, boundTriple) {
  return util.extendBindings(null, triplePattern, boundTriple);
};

/** Creates augmented bindings that include bindings to transform the pattern into the triple. */
util.extendBindings = function (bindings, triplePattern, boundTriple) {
  var newBindings = Object.create(null);
  for (var binding in bindings)
    newBindings[binding] = bindings[binding];
  util.addBinding(newBindings, triplePattern.subject,   boundTriple.subject);
  util.addBinding(newBindings, triplePattern.predicate, boundTriple.predicate);
  util.addBinding(newBindings, triplePattern.object,    boundTriple.object);
  return newBindings;
};

/** Extends the bindings with a binding that binds the left component to the right. */
util.addBinding = function (bindings, left, right) {
  // The left side may be variable; the right side may not
  if (util.isVariableOrBlank(right))
    throw new Error('Right-hand side must not be variable.');
  // If the left one is the variable
  if (util.isVariableOrBlank(left)) {
    // Add it to the bindings if it wasn't already bound
    if (!(left in bindings))
      bindings[left] = right;
    // The right-hand side should be consistent with the binding
    else if (right !== bindings[left])
      throw new Error(['Cannot bind', left, 'to', right,
                       'because it was already bound to', bindings[left] + '.'].join(' '));
  }
  // Both are constants, so they should be equal for a successful binding
  else if (left !== right) {
    throw new Error(['Cannot bind', left, 'to', right].join(' '));
  }
  // Return the extended bindings
  return bindings;
};


/* Methods for graph patterns */

/** Finds connected subpatterns within the possibly disconnected graph pattern. */
util.findConnectedPatterns = function (graphPattern) {
  // Zero or single-triple patterns have exactly one cluster
  if (graphPattern.length <= 1)
    return [graphPattern];

  // Initially consider all individual triple patterns as disconnected clusters
  var clusters = graphPattern.map(function (triple) {
    return {
      triples:  [triple],
      variables: _.values(triple).filter(util.isVariableOrBlank),
    };
  }), commonVar;

  // Continue clustering as long as different clusters have common variables
  do {
    // Find a variable that occurs in more than one subpattern
    var allVariables = _.flatten(_.pluck(clusters, 'variables'));
    if (commonVar = _.find(allVariables, hasDuplicate)) {
      // Partition the subpatterns by whether they contain that common variable
      var hasCommon = _.groupBy(clusters,
                                function (c) { return _.contains(c.variables, commonVar); });
      // Replace the subpatterns with a common variable by a subpattern that combines them
      clusters = hasCommon[false] || [];
      clusters.push({
        triples:   _.union.apply(_, _.pluck(hasCommon[true], 'triples')),
        variables: _.union.apply(_, _.pluck(hasCommon[true], 'variables')),
      });
    }
  } while (commonVar);

  // The subpatterns consist of the triples of each cluster
  return _.pluck(clusters, 'triples');
};

// Array filter that finds values occurring more than once
function hasDuplicate(value, index, array) {
  return index !== array.lastIndexOf(value);
}

/* Common RDF namespaces and URIs */

namespace('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', [
  'type', 'subject', 'predicate', 'object',
]);

namespace('void', 'http://rdfs.org/ns/void#', [
  'triples',
]);

namespace('hydra', 'http://www.w3.org/ns/hydra/core#', [
  'search', 'template', 'mapping', 'property', 'variable', 'totalItems',
]);

namespace('foaf', 'http://xmlns.com/foaf/0.1/');

namespace('dbpedia', 'http://dbpedia.org/resource/');
namespace('dbpedia-owl', 'http://dbpedia.org/ontology/');

function namespace(prefix, base, names) {
  var key = prefix.replace(/[^a-z]/g, '').toUpperCase();
  util[key] = base;
  names && names.forEach(function (name) {
    util[key + '_' + name.toUpperCase()] = base + name;
  });
}

Object.freeze(util);

},{"lodash":38,"n3":40}],34:[function(require,module,exports){
/*! @license ©2014 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */

var util = require('util'),
    N3Util = require('n3').Util,
    createErrorType = require('./CustomError');

var XSD = 'http://www.w3.org/2001/XMLSchema#',
    XSD_INTEGER = XSD + 'integer',
    XSD_DOUBLE  = XSD + 'double',
    XSD_BOOLEAN = XSD + 'boolean',
    XSD_TRUE  = '"true"^^'  + XSD_BOOLEAN,
    XSD_FALSE = '"false"^^' + XSD_BOOLEAN;

/**
 * Creates a function that evaluates the given SPARQL expression.
 * @constructor
 * @param expression a SPARQL expression
 * @returns {Function} a function that evaluates the SPARQL expression.
 */
function SparqlExpressionEvaluator(expression) {
  if (!expression) return noop;
  var expressionType = expression && expression.type || typeof expression,
      evaluator = evaluators[expressionType];
  if (!evaluator) throw new UnsupportedExpressionError(expressionType);
  return evaluator(expression);
}

// Evaluates the expression with the given bindings
SparqlExpressionEvaluator.evaluate = function (expression, bindings) {
  return SparqlExpressionEvaluator(expression)(bindings);
};

// The null operation
function noop() { }

// Evaluators for each of the expression types
var evaluators = {
  // Does nothing
  null: function () { return noop; },

  // Evaluates an IRI, literal, or variable
  string: function (expression) {
    // Evaluate a IRIs or literal to its own value
    if (expression[0] !== '?')
      return function () { return expression; };
    // Evaluate a variable to its value
    else
      return function (bindings) {
        return bindings && bindings[expression];
      };
  },

  // Evaluates an operation
  operation: function (expression) {
    // Find the operator and check the number of arguments matches the expression
    var operatorName = expression.operator, operator = operators[operatorName];
    if (!operator)
      throw new UnsupportedOperatorError(operatorName);
    if (operator.length !== expression.args.length)
      throw new InvalidArgumentsNumberError(operatorName, expression.args.length, operator.length);

    // Special case: some operators accept expressions instead of evaluated expressions
    if (operator.acceptsExpressions) {
      return (function (operator, args) {
        return function (bindings) {
          return operator.apply(bindings, args);
        };
      })(operator, expression.args);
    }

    // Parse the expressions for each of the arguments
    var argumentExpressions = new Array(expression.args.length);
    for (var i = 0; i < expression.args.length; i++)
      argumentExpressions[i] = SparqlExpressionEvaluator(expression.args[i]);

    // Create a function that evaluates the operator with the arguments and bindings
    return (function (operator, argumentExpressions) {
      return function (bindings) {
        // Evaluate the arguments
        var args = new Array(argumentExpressions.length),
            origArgs = new Array(argumentExpressions.length);
        for (var i = 0; i < argumentExpressions.length; i++) {
          var arg = args[i] = origArgs[i] = argumentExpressions[i](bindings);
          // If any argument is undefined, the result is undefined
          if (arg === undefined) return;
          // Convert the arguments if necessary
          switch (operator.type) {
          case 'numeric':
            args[i] = parseFloat(N3Util.getLiteralValue(arg));
            break;
          case 'boolean':
            args[i] = arg !== XSD_FALSE &&
                     (!N3Util.isLiteral(arg) || N3Util.getLiteralValue(arg) !== '0');
            break;
          }
        }
        // Call the operator on the evaluated arguments
        var result = operator.apply(null, args);
        // Convert result if necessary
        switch (operator.resultType) {
        case 'numeric':
          // TODO: determine type instead of taking the type of the first argument
          var type = N3Util.getLiteralType(origArgs[0]) || XSD_INTEGER;
          return '"' + result + '"^^' + type;
        case 'boolean':
          return result ? XSD_TRUE : XSD_FALSE;
        default:
          return result;
        }
      };
    })(operator, argumentExpressions);
  },
};

// Operators for each of the operator types
var operators = {
  '+':  function (a, b) { return a  +  b; },
  '-':  function (a, b) { return a  -  b; },
  '*':  function (a, b) { return a  *  b; },
  '/':  function (a, b) { return a  /  b; },
  '=':  function (a, b) { return a === b; },
  '!=': function (a, b) { return a !== b; },
  '<':  function (a, b) { return a  <  b; },
  '<=': function (a, b) { return a  <= b; },
  '>':  function (a, b) { return a  >  b; },
  '>=': function (a, b) { return a  >= b; },
  '!':  function (a)    { return !a;      },
  '&&': function (a, b) { return a &&  b; },
  '||': function (a, b) { return a ||  b; },
  lang: function (a)    {
    return '"' + N3Util.getLiteralLanguage(a).toLowerCase() + '"';
  },
  langmatches: function (a, b) {
    return a.toLowerCase() === b.toLowerCase();
  },
  regex: function (subject, pattern) {
    if (N3Util.isLiteral(subject))
      subject = N3Util.getLiteralValue(subject);
    return new RegExp(N3Util.getLiteralValue(pattern)).test(subject);
  },
  str: function (a) {
    return N3Util.isLiteral(a) ? a : '"' + a + '"';
  },
  'http://www.w3.org/2001/XMLSchema#double': function (a) {
    a = a.toFixed();
    if (a.indexOf('.') < 0) a += '.0';
    return '"' + a + '"^^http://www.w3.org/2001/XMLSchema#double';
  },
  bound: function (a) {
    if (a[0] !== '?')
      throw new Error('BOUND expects a variable but got: ' + a);
    return a in this ? XSD_TRUE : XSD_FALSE;
  },
};

// Tag all operators that expect their arguments to be numeric
[
  '+', '-', '*', '/', '<', '<=', '>', '>=',
  'http://www.w3.org/2001/XMLSchema#double',
].forEach(function (operatorName) {
  operators[operatorName].type = 'numeric';
});

// Tag all operators that expect their arguments to be boolean
[
  '!', '&&', '||',
].forEach(function (operatorName) {
  operators[operatorName].type = 'boolean';
});

// Tag all operators that have numeric results
[
  '+', '-', '*', '/', '<', '<=', '>', '>=',
].forEach(function (operatorName) {
  operators[operatorName].type = operators[operatorName].resultType = 'numeric';
});

// Tag all operators that have boolean results
[
  '!', '&&', '||', '=', '<', '<=', '>', '>=', 'langmatches', 'regex',
].forEach(function (operatorName) {
  operators[operatorName].resultType = 'boolean';
});

// Tag all operators that take expressions instead of evaluated expressions
operators.bound.acceptsExpressions = true;



var UnsupportedExpressionError = createErrorType('UnsupportedExpressionError', function (expressionType) {
  this.message = 'Unsupported expression type: ' + expressionType + '.';
});

var UnsupportedOperatorError = createErrorType('UnsupportedExpressionError', function (operatorName) {
  this.message = 'Unsupported operator: ' + operatorName.toUpperCase() + '.';
});

var InvalidArgumentsNumberError = createErrorType('InvalidArgumentsNumberError',
function (operatorName, actualNumber, expectedNumber) {
  this.message = 'Invalid number of arguments for ' + operatorName.toUpperCase() + ': ' +
                 actualNumber + ' (expected: ' + expectedNumber + ').';
});



module.exports = SparqlExpressionEvaluator;
module.exports.UnsupportedExpressionError = UnsupportedExpressionError;
module.exports.UnsupportedOperatorError = UnsupportedOperatorError;
module.exports.InvalidArgumentsNumberError = InvalidArgumentsNumberError;

},{"./CustomError":29,"n3":40,"util":10}],35:[function(require,module,exports){
/*! @license ©2015 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/** Browser replacement for a subset of crypto. */

exports.createHash = function () {
  var contents;
  return {
    update: function (c) { contents ? (contents += c) : (contents = c); },
    digest: function ()  { return sha1(contents); },
  };
};

/*! @license SHA-1 implementation ©2002-2014 Chris Veness / MIT Licence */

/**
 * Generates SHA-1 hash of string.
 *
 * @param   {string} msg - (Unicode) string to be hashed.
 * @returns {string} Hash of msg as hex character string.
 */
function sha1(msg) {
  // constants [§4.2.1]
  var K = [ 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6 ];

  // PREPROCESSING

  msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

  // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
  var l = msg.length / 4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
  var N = Math.ceil(l / 16);  // number of 16-integer-blocks required to hold 'l' ints
  var M = new Array(N);

  for (var i = 0; i < N; i++) {
    M[i] = new Array(16);
    for (var j = 0; j < 16; j++) {  // encode 4 chars per integer, big-endian encoding
      M[i][j] = (msg.charCodeAt(i * 64 + j * 4)     << 24) |
                (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
                (msg.charCodeAt(i * 64 + j * 4 + 2) << 8)  |
                (msg.charCodeAt(i * 64 + j * 4 + 3));
    } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
  }
  // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
  // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
  // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
  M[N - 1][14] = ((msg.length - 1) * 8) / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

  // set initial hash value [§5.3.1]
  var H0 = 0x67452301;
  var H1 = 0xefcdab89;
  var H2 = 0x98badcfe;
  var H3 = 0x10325476;
  var H4 = 0xc3d2e1f0;

  // HASH COMPUTATION [§6.1.2]

  var W = new Array(80), a, b, c, d, e, t;
  for (i = 0; i < N; i++) {

    // 1 - prepare message schedule 'W'
    for (t = 0;  t < 16; t++) W[t] = M[i][t];
    for (t = 16; t < 80; t++) W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);

    // 2 - initialise five working variables a, b, c, d, e with previous hash value
    a = H0, b = H1, c = H2, d = H3, e = H4;

    // 3 - main loop
    for (t = 0; t < 80; t++) {
      var s = Math.floor(t / 20); // seq for blocks of 'f' functions and 'K' constants
      var T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) & 0xffffffff;
      e = d;
      d = c;
      c = ROTL(b, 30);
      b = a;
      a = T;
    }

    // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
    H0 = (H0 + a) & 0xffffffff;
    H1 = (H1 + b) & 0xffffffff;
    H2 = (H2 + c) & 0xffffffff;
    H3 = (H3 + d) & 0xffffffff;
    H4 = (H4 + e) & 0xffffffff;
  }

  return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
}

/**
 * Function 'f' [§4.1.1].
 */
function f(s, x, y, z)  {
  switch (s) {
  case 0:
    return (x & y) ^ (~x & z);           // Ch()
  case 1:
    return  x ^ y  ^  z;                 // Parity()
  case 2:
    return (x & y) ^ (x & z) ^ (y & z);  // Maj()
  case 3:
    return  x ^ y  ^  z;                 // Parity()
  }
}

/**
 * Rotates left (circular left shift) value x by n positions [§3.2.5].
 */
function ROTL(x, n) {
  return (x << n) | (x >>> (32 - n));
}

/**
 * Hexadecimal representation of a number.
 */
function toHexStr(n) {
  // note can't use toString(16) as it is implementation-dependant,
  // and in IE returns signed numbers when used on full words
  var s = "", v;
  for (var i = 7; i >= 0; i--) { v = (n >>> (i * 4)) & 0xf; s += v.toString(16); }
  return s;
}

},{}],36:[function(require,module,exports){
/*! @license ©2013 Ruben Verborgh - Multimedia Lab / iMinds / Ghent University */
/** Browser replacement for the request module using jQuery. */

var EventEmitter = require('events').EventEmitter,
    SingleIterator = require('../../lib/iterators/Iterator').SingleIterator;

require('setimmediate');

// Requests the given resource as an iterator
function createRequest(settings) {
  var request = new EventEmitter();

  // Delegate the request to jQuery's AJAX module
  var jqXHR = jQuery.ajax({
    url: settings.url,
    timeout: settings.timeout,
    type: settings.method,
    headers: { accept: settings.headers && settings.headers.accept || '*/*' },
  })
  // Emit the result as a readable response iterator
  .success(function () {
    var response = new SingleIterator(jqXHR.responseText || '');
    response.statusCode = jqXHR.status;
    response.headers = { 'content-type': jqXHR.getResponseHeader('content-type') };
    request.emit('response', response);
  });
  request.abort = function () { jqXHR.abort(); };

  return request;
}

module.exports = createRequest;

},{"../../lib/iterators/Iterator":18,"events":5,"setimmediate":48}],37:[function(require,module,exports){
/*! @license ©2014 Miel Vander Sande - Multimedia Lab / iMinds / Ghent University */
/* Serializing the output of a SparqlIterator */

var TransformIterator = require('../iterators/Iterator').TransformIterator;

function SparqlResultWriter(mediaType, sparqlIterator) {
  // Handle subclass construction by initializing an instance
  if (mediaType === true) {
    TransformIterator.call(this, true);
    this._empty = true;
    return setImmediate((function () {
      var variables = sparqlIterator.getProperty('variables') || [];
      this._writeHead(variables.map(function (v) { return v.substring(1); }));
      this.setSource(sparqlIterator);
    }).bind(this));
  }
  // Otherwise, create a result writer based on the media type
  else {
    var ResultWriter = SparqlResultWriter.writers[mediaType];
    if (!ResultWriter)
      throw new Error('The requested result format ' + mediaType + ' is not supported.');
    if (typeof ResultWriter === 'string')
      ResultWriter = SparqlResultWriter.writers[mediaType] = require(ResultWriter);
    return new ResultWriter(sparqlIterator);
  }
}
TransformIterator.inherits(SparqlResultWriter);

SparqlResultWriter.writers = {};
SparqlResultWriter.register = function (mimeType, ResultWriter) {
  SparqlResultWriter.writers[mimeType] = ResultWriter;
};

SparqlResultWriter.prototype._writeHead = function (variableNames) { };

SparqlResultWriter.prototype._transform = function (result, done) {
  if (typeof result === 'boolean')
    this._writeBoolean(result);
  else
    this._writeBindings(result);
  delete this._empty;
  done();
};

SparqlResultWriter.prototype._writeBindings = function (result, done) {
  throw new Error('The _writeBindings method has not been implemented.');
};

SparqlResultWriter.prototype._writeBoolean = function (result, done) {
  throw new Error('The _writeBoolean method has not been implemented.');
};

module.exports = SparqlResultWriter;

},{"../iterators/Iterator":18}],38:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
      descriptor.value = null;
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * https://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.2';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
;(function () { // closure for web browsers

if (typeof module === 'object' && module.exports) {
  module.exports = LRUCache
} else {
  // just set the global for non-node platforms.
  this.LRUCache = LRUCache
}

function hOP (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function naiveLength () { return 1 }

function LRUCache (options) {
  if (!(this instanceof LRUCache))
    return new LRUCache(options)

  if (typeof options === 'number')
    options = { max: options }

  if (!options)
    options = {}

  this._max = options.max
  // Kind of weird to have a default max of Infinity, but oh well.
  if (!this._max || !(typeof this._max === "number") || this._max <= 0 )
    this._max = Infinity

  this._lengthCalculator = options.length || naiveLength
  if (typeof this._lengthCalculator !== "function")
    this._lengthCalculator = naiveLength

  this._allowStale = options.stale || false
  this._maxAge = options.maxAge || null
  this._dispose = options.dispose
  this.reset()
}

// resize the cache when the max changes.
Object.defineProperty(LRUCache.prototype, "max",
  { set : function (mL) {
      if (!mL || !(typeof mL === "number") || mL <= 0 ) mL = Infinity
      this._max = mL
      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._max }
  , enumerable : true
  })

// resize the cache when the lengthCalculator changes.
Object.defineProperty(LRUCache.prototype, "lengthCalculator",
  { set : function (lC) {
      if (typeof lC !== "function") {
        this._lengthCalculator = naiveLength
        this._length = this._itemCount
        for (var key in this._cache) {
          this._cache[key].length = 1
        }
      } else {
        this._lengthCalculator = lC
        this._length = 0
        for (var key in this._cache) {
          this._cache[key].length = this._lengthCalculator(this._cache[key].value)
          this._length += this._cache[key].length
        }
      }

      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._lengthCalculator }
  , enumerable : true
  })

Object.defineProperty(LRUCache.prototype, "length",
  { get : function () { return this._length }
  , enumerable : true
  })


Object.defineProperty(LRUCache.prototype, "itemCount",
  { get : function () { return this._itemCount }
  , enumerable : true
  })

LRUCache.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  var i = 0;
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    i++
    var hit = this._lruList[k]
    if (this._maxAge && (Date.now() - hit.now > this._maxAge)) {
      del(this, hit)
      if (!this._allowStale) hit = undefined
    }
    if (hit) {
      fn.call(thisp, hit.value, hit.key, this)
    }
  }
}

LRUCache.prototype.keys = function () {
  var keys = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    keys[i++] = hit.key
  }
  return keys
}

LRUCache.prototype.values = function () {
  var values = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    values[i++] = hit.value
  }
  return values
}

LRUCache.prototype.reset = function () {
  if (this._dispose && this._cache) {
    for (var k in this._cache) {
      this._dispose(k, this._cache[k].value)
    }
  }

  this._cache = Object.create(null) // hash of items by key
  this._lruList = Object.create(null) // list of items in order of use recency
  this._mru = 0 // most recently used
  this._lru = 0 // least recently used
  this._length = 0 // number of items in the list
  this._itemCount = 0
}

// Provided for debugging/dev purposes only. No promises whatsoever that
// this API stays stable.
LRUCache.prototype.dump = function () {
  return this._cache
}

LRUCache.prototype.dumpLru = function () {
  return this._lruList
}

LRUCache.prototype.set = function (key, value) {
  if (hOP(this._cache, key)) {
    // dispose of the old one before overwriting
    if (this._dispose) this._dispose(key, this._cache[key].value)
    if (this._maxAge) this._cache[key].now = Date.now()
    this._cache[key].value = value
    this.get(key)
    return true
  }

  var len = this._lengthCalculator(value)
  var age = this._maxAge ? Date.now() : 0
  var hit = new Entry(key, value, this._mru++, len, age)

  // oversized objects fall out of cache automatically.
  if (hit.length > this._max) {
    if (this._dispose) this._dispose(key, value)
    return false
  }

  this._length += hit.length
  this._lruList[hit.lu] = this._cache[key] = hit
  this._itemCount ++

  if (this._length > this._max) trim(this)
  return true
}

LRUCache.prototype.has = function (key) {
  if (!hOP(this._cache, key)) return false
  var hit = this._cache[key]
  if (this._maxAge && (Date.now() - hit.now > this._maxAge)) {
    return false
  }
  return true
}

LRUCache.prototype.get = function (key) {
  return get(this, key, true)
}

LRUCache.prototype.peek = function (key) {
  return get(this, key, false)
}

LRUCache.prototype.pop = function () {
  var hit = this._lruList[this._lru]
  del(this, hit)
  return hit || null
}

LRUCache.prototype.del = function (key) {
  del(this, this._cache[key])
}

function get (self, key, doUse) {
  var hit = self._cache[key]
  if (hit) {
    if (self._maxAge && (Date.now() - hit.now > self._maxAge)) {
      del(self, hit)
      if (!self._allowStale) hit = undefined
    } else {
      if (doUse) use(self, hit)
    }
    if (hit) hit = hit.value
  }
  return hit
}

function use (self, hit) {
  shiftLU(self, hit)
  hit.lu = self._mru ++
  if (self._maxAge) hit.now = Date.now()
  self._lruList[hit.lu] = hit
}

function trim (self) {
  while (self._lru < self._mru && self._length > self._max)
    del(self, self._lruList[self._lru])
}

function shiftLU (self, hit) {
  delete self._lruList[ hit.lu ]
  while (self._lru < self._mru && !self._lruList[self._lru]) self._lru ++
}

function del (self, hit) {
  if (hit) {
    if (self._dispose) self._dispose(hit.key, hit.value)
    self._length -= hit.length
    self._itemCount --
    delete self._cache[ hit.key ]
    shiftLU(self, hit)
  }
}

// classy, since V8 prefers predictable objects.
function Entry (key, value, lu, length, now) {
  this.key = key
  this.value = value
  this.lu = lu
  this.length = length
  this.now = now
}

})()

},{}],40:[function(require,module,exports){
// Replace local require by a lazy loader
var globalRequire = require;
require = function () {};

// Expose submodules
var exports = module.exports = {
  Lexer:        require('./lib/N3Lexer'),
  Parser:       require('./lib/N3Parser'),
  Writer:       require('./lib/N3Writer'),
  Store:        require('./lib/N3Store'),
  StreamParser: require('./lib/N3StreamParser'),
  StreamWriter: require('./lib/N3StreamWriter'),
  Util:         require('./lib/N3Util'),
};

// Load submodules on first access
Object.keys(exports).forEach(function (submodule) {
  Object.defineProperty(exports, submodule, {
    configurable: true,
    enumerable: true,
    get: function () {
      delete exports[submodule];
      return exports[submodule] = globalRequire('./lib/N3' + submodule);
    },
  });
});

},{"./lib/N3Lexer":41,"./lib/N3Parser":42,"./lib/N3Store":43,"./lib/N3StreamParser":44,"./lib/N3StreamWriter":45,"./lib/N3Util":46,"./lib/N3Writer":47}],41:[function(require,module,exports){
// **N3Lexer** tokenizes N3 documents.
var fromCharCode = String.fromCharCode;
var immediately = typeof setImmediate === 'function' ? setImmediate :
                  function setImmediate(func) { setTimeout(func, 0); };

// Regular expression and replacement string to escape N3 strings.
// Note how we catch invalid unicode sequences separately (they will trigger an error).
var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\[uU]|\\(.)/g;
var escapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                           'n': '\n', 'r': '\r', 't': '\t', 'f': '\f', 'b': '\b',
                           '_': '_', '~': '~', '.': '.', '-': '-', '!': '!', '$': '$', '&': '&',
                           '(': '(', ')': ')', '*': '*', '+': '+', ',': ',', ';': ';', '=': '=',
                           '/': '/', '?': '?', '#': '#', '@': '@', '%': '%' };
var illegalIriChars = /[\x00-\x20<>\\"\{\}\|\^\`]/;

// ## Constructor
function N3Lexer(options) {
  if (!(this instanceof N3Lexer))
    return new N3Lexer(options);

  // In line mode (N-Triples or N-Quads), only simple features may be parsed
  if (options && options.lineMode) {
    // Don't tokenize special literals
    this._tripleQuotedString = this._number = this._boolean = /$0^/;
    // Swap the tokenize method for a restricted version
    var self = this;
    this._tokenize = this.tokenize;
    this.tokenize = function (input, callback) {
      this._tokenize(input, function (error, token) {
        if (!error && /IRI|prefixed|literal|langcode|type|\.|eof/.test(token.type))
          callback && callback(error, token);
        else
          callback && callback(error || self._syntaxError(token.type, callback = null));
      });
    };
  }
}

N3Lexer.prototype = {
  // ## Regular expressions
  // It's slightly faster to have these as properties than as in-scope variables.

  _iri: /^<((?:[^>\\]|\\[uU])+)>/, // IRI with escape sequences; needs sanity check after unescaping
  _unescapedIri: /^<([^\x00-\x20<>\\"\{\}\|\^\`]*)>/, // IRI without escape sequences; no unescaping
  _unescapedString: /^"[^"\\]+"(?=[^"\\])/, // non-empty string without escape sequences
  _singleQuotedString: /^"[^"\\]*(?:\\.[^"\\]*)*"(?=[^"\\])|^'[^'\\]*(?:\\.[^'\\]*)*'(?=[^'\\])/,
  _tripleQuotedString: /^""("[^"\\]*(?:(?:\\.|"(?!""))[^"\\]*)*")""|^''('[^'\\]*(?:(?:\\.|'(?!''))[^'\\]*)*')''/,
  _langcode: /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9\-])/i,
  _prefix: /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=[#\s<])/,
  _prefixed: /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?=\.?[,;\s#()\[\]\{\}"'<])/,
  _blank: /^_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=\.?[,;:\s#()\[\]\{\}"'<])/,
  _number: /^[\-+]?(?:\d+\.?\d*([eE](?:[\-\+])?\d+)|\d*\.?\d+)(?=[.,;:\s#()\[\]\{\}"'<])/,
  _boolean: /^(?:true|false)(?=[.,;:\s#()\[\]\{\}"'<])/,
  _keyword: /^@[a-z]+(?=[\s#<:])/,
  _sparqlKeyword: /^(?:PREFIX|BASE|GRAPH)(?=[\s#<:])/i,
  _shortPredicates: /^a(?=\s+|<)/,
  _newline: /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/,
  _whitespace: /^[ \t]+/,
  _endOfFile: /^(?:#[^\n\r]*)?$/,

  // ## Private methods

  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback.
  _tokenizeToEnd: function (callback, inputFinished) {
    // Continue parsing as far as possible; the loop will return eventually.
    var input = this._input;
    while (true) {
      // Count and skip whitespace lines.
      var whiteSpaceMatch;
      while (whiteSpaceMatch = this._newline.exec(input))
        input = input.substr(whiteSpaceMatch[0].length, input.length), this._line++;
      // Skip whitespace on current line.
      if (whiteSpaceMatch = this._whitespace.exec(input))
        input = input.substr(whiteSpaceMatch[0].length, input.length);

      // Stop for now if we're at the end.
      if (this._endOfFile.test(input)) {
        // If the input is finished, emit EOF.
        if (inputFinished)
          callback(input = null, { line: this._line, type: 'eof', value: '', prefix: '' });
        return this._input = input;
      }

      // Look for specific token types based on the first character.
      var line = this._line, type = '', value = '', prefix = '',
          firstChar = input[0], match = null, matchLength = 0, unescaped, inconclusive = false;
      switch (firstChar) {
      case '^':
        // Try to match a type.
        if (input.length === 1) break;
        else if (input[1] !== '^') return reportSyntaxError(this);
        this._prevTokenType = '^';
        // Move to type IRI or prefixed name.
        input = input.substr(2);
        if (input[0] !== '<') {
          inconclusive = true;
          break;
        }
        // Fall through in case the type is an IRI.

      case '<':
        // Try to find a full IRI without escape sequences.
        if (match = this._unescapedIri.exec(input)) {
          type = 'IRI';
          value = match[1];
        }
        // Try to find a full IRI with escape sequences.
        else if (match = this._iri.exec(input)) {
          unescaped = this._unescape(match[1]);
          if (unescaped === null || illegalIriChars.test(unescaped))
            return reportSyntaxError(this);
          type = 'IRI';
          value = unescaped;
        }
        break;

      case '_':
        // Try to find a blank node. Since it can contain (but not end with) a dot,
        // we always need a non-dot character before deciding it is a prefixed name.
        // Therefore, try inserting a space if we're at the end of the input.
        if ((match = this._blank.exec(input)) ||
            inputFinished && (match = this._blank.exec(input + ' '))) {
          type = 'prefixed';
          prefix = '_';
          value = match[1];
        }
        break;

      case '"':
      case "'":
        // Try to find a non-empty double-quoted literal without escape sequences.
        if (match = this._unescapedString.exec(input)) {
          type = 'literal';
          value = match[0];
        }
        // Try to find any other literal wrapped in a pair of single or double quotes.
        else if (match = this._singleQuotedString.exec(input)) {
          unescaped = this._unescape(match[0]);
          if (unescaped === null)
            return reportSyntaxError(this);
          type = 'literal';
          value = unescaped.replace(/^'|'$/g, '"');
        }
        // Try to find a literal wrapped in three pairs of single or double quotes.
        else if (match = this._tripleQuotedString.exec(input)) {
          unescaped = match[1] || match[2];
          // Count the newlines and advance line counter.
          this._line += unescaped.split(/\r\n|\r|\n/).length - 1;
          unescaped = this._unescape(unescaped);
          if (unescaped === null)
            return reportSyntaxError(this);
          type = 'literal';
          value = unescaped.replace(/^'|'$/g, '"');
        }
        break;

      case '@':
        // Try to find a language code.
        if (this._prevTokenType === 'literal' && (match = this._langcode.exec(input))) {
          type = 'langcode';
          value = match[1];
        }
        // Try to find a keyword.
        else if (match = this._keyword.exec(input)) {
          type = match[0];
        }
        break;

      case '.':
        // Try to find a dot as punctuation.
        if (input.length === 1 ? inputFinished : (input[1] < '0' || input[1] > '9')) {
          type = '.';
          matchLength = 1;
          break;
        }
        // Fall through to numerical case (could be a decimal dot).

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '+':
      case '-':
        // Try to find a number.
        if (match = this._number.exec(input)) {
          type = 'literal';
          value = '"' + match[0] + '"^^http://www.w3.org/2001/XMLSchema#' +
                  (match[1] ? 'double' : (/^[+\-]?\d+$/.test(match[0]) ? 'integer' : 'decimal'));
        }
        break;

      case 'B':
      case 'b':
      case 'p':
      case 'P':
      case 'G':
      case 'g':
        // Try to find a SPARQL-style keyword.
        if (match = this._sparqlKeyword.exec(input))
          type = match[0].toUpperCase();
        else
          inconclusive = true;
        break;

      case 'f':
      case 't':
        // Try to match a boolean.
        if (match = this._boolean.exec(input)) {
          type = 'literal';
          value = '"' + match[0] + '"^^http://www.w3.org/2001/XMLSchema#boolean';
        }
        else
          inconclusive = true;
        break;

      case 'a':
        // Try to find an abbreviated predicate.
        if (match = this._shortPredicates.exec(input)) {
          type = 'abbreviation';
          value = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        }
        else
          inconclusive = true;
        break;

      case ',':
      case ';':
      case '[':
      case ']':
      case '(':
      case ')':
      case '{':
      case '}':
        // The next token is punctuation
        matchLength = 1;
        type = firstChar;
        break;

      default:
        inconclusive = true;
      }

      // Some first characters do not allow an immediate decision, so inspect more.
      if (inconclusive) {
        // Try to find a prefix.
        if ((this._prevTokenType === '@prefix' || this._prevTokenType === 'PREFIX') &&
            (match = this._prefix.exec(input))) {
          type = 'prefix';
          value = match[1] || '';
        }
        // Try to find a prefixed name. Since it can contain (but not end with) a dot,
        // we always need a non-dot character before deciding it is a prefixed name.
        // Therefore, try inserting a space if we're at the end of the input.
        else if ((match = this._prefixed.exec(input)) ||
                 inputFinished && (match = this._prefixed.exec(input + ' '))) {
          type = 'prefixed';
          prefix = match[1] || '';
          value = this._unescape(match[2]);
        }
      }

      // A type token is special: it can only be emitted after an IRI or prefixed name is read.
      if (this._prevTokenType === '^')
        type = (type === 'IRI' || type === 'prefixed') ? 'type' : '';

      // What if nothing of the above was found?
      if (!type) {
        // We could be in streaming mode, and then we just wait for more input to arrive.
        // Otherwise, a syntax error has occurred in the input.
        // One exception: error on an unaccounted linebreak (= not inside a triple-quoted literal).
        if (inputFinished || (!/^'''|^"""/.test(input) && /\n|\r/.test(input)))
          return reportSyntaxError(this);
        else
          return this._input = input;
      }

      // Emit the parsed token.
      callback(null, { line: line, type: type, value: value, prefix: prefix });
      this._prevTokenType = type;

      // Advance to next part to tokenize.
      input = input.substr(matchLength || match[0].length, input.length);
    }

    // Signals the syntax error through the callback
    function reportSyntaxError(self) { callback(self._syntaxError(/^\S*/.exec(input)[0])); }
  },

  // ### `_unescape` replaces N3 escape codes by their corresponding characters.
  _unescape: function (item) {
    try {
      return item.replace(escapeSequence, function (sequence, unicode4, unicode8, escapedChar) {
        var charCode;
        if (unicode4) {
          charCode = parseInt(unicode4, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          return fromCharCode(charCode);
        }
        else if (unicode8) {
          charCode = parseInt(unicode8, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          if (charCode <= 0xFFFF) return fromCharCode(charCode);
          return fromCharCode(0xD800 + ((charCode -= 0x10000) / 0x400), 0xDC00 + (charCode & 0x3FF));
        }
        else {
          var replacement = escapeReplacements[escapedChar];
          if (!replacement)
            throw new Error();
          return replacement;
        }
      });
    }
    catch (error) { return null; }
  },

  // ### `_syntaxError` creates a syntax error for the given issue
  _syntaxError: function (issue) {
    this._input = null;
    return new Error('Syntax error: unexpected "' + issue + '" on line ' + this._line + '.');
  },


  // ## Public methods

  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  tokenize: function (input, callback) {
    var self = this;
    this._line = 1;

    // If the input is a string, continuously emit tokens through the callback until the end.
    if (typeof input === 'string') {
      this._input = input;
      immediately(function () { self._tokenizeToEnd(callback, true); });
    }
    // Otherwise, the input will be streamed.
    else {
      this._input = '';

      // If no input was given, it will be streamed through `addChunk` and ended with `end`
      if (!input || typeof input === 'function') {
        this.addChunk = addChunk;
        this.end = end;
        if (!callback)
          callback = input;
      }
      // Otherwise, the input itself must be a stream
      else {
        if (typeof input.setEncoding === 'function')
          input.setEncoding('utf8');
        input.on('data', addChunk);
        input.on('end', end);
      }
    }

    // Adds the data chunk to the buffer and parses as far as possible
    function addChunk(data) {
      if (self._input !== null) {
        self._input += data;
        self._tokenizeToEnd(callback, false);
      }
    }

    // Parses until the end
    function end() {
      if (self._input !== null) {
        self._tokenizeToEnd(callback, true);
      }
    }
  },
};

// ## Exports

// Export the `N3Lexer` class as a whole.
module.exports = N3Lexer;

},{}],42:[function(require,module,exports){
// **N3Parser** parses N3 documents.
var N3Lexer = require('./N3Lexer');

var RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDF_NIL    = RDF_PREFIX + 'nil',
    RDF_FIRST  = RDF_PREFIX + 'first',
    RDF_REST   = RDF_PREFIX + 'rest';

var absoluteIRI = /:/,
    documentPart = /[^\/]*$/,
    rootIRI = /^(?:[^:]+:\/*)?[^\/]*/;

// The next ID for new blank nodes
var blankNodePrefix = 0, blankNodeCount = 0;

// ## Constructor
function N3Parser(options) {
  if (!(this instanceof N3Parser))
    return new N3Parser(options);
  this._tripleStack = [];
  this._graph = null;

  // Set the document IRI.
  options = options || {};
  if (!options.documentIRI) {
    this._baseIRI = null;
    this._baseIRIPath = null;
  }
  else {
    if (options.documentIRI.indexOf('#') > 0)
      throw new Error('Invalid document IRI');
    this._baseIRI = options.documentIRI;
    this._baseIRIPath = this._baseIRI.replace(documentPart, '');
    this._baseIRIRoot = this._baseIRI.match(rootIRI)[0];
  }

  // Set supported features depending on the format.
  var format = (typeof options.format === 'string') && options.format.match(/\w*$/)[0].toLowerCase(),
      isTurtle = format === 'turtle', isTriG = format === 'trig',
      isNTriples = /triple/.test(format), isNQuads = /quad/.test(format),
      isLineMode = isNTriples || isNQuads;
  if (!(this._supportsNamedGraphs = !isTurtle))
    this._readPredicateOrNamedGraph = this._readPredicate;
  this._supportsQuads = !(isTurtle || isTriG || isNTriples);
  // Disable relative IRIs in N-Triples or N-Quads mode
  if (isLineMode) {
    this._baseIRI = '';
    this._resolveIRI = function (token) {
      this._error('Disallowed relative IRI', token);
      return this._callback = noop, this._subject = null;
    };
  }
  this._blankNodePrefix = typeof options.blankNodePrefix !== 'string' ? '' :
                            '_:' + options.blankNodePrefix.replace(/^_:/, '');
  this._lexer = options.lexer || new N3Lexer({ lineMode: isLineMode });
}

// ## Private class methods

// ### `_resetBlankNodeIds` restarts blank node identification.
N3Parser._resetBlankNodeIds = function () {
  blankNodePrefix = blankNodeCount = 0;
};

N3Parser.prototype = {
  // ## Private methods

  // ### `_readInTopContext` reads a token when in the top context.
  _readInTopContext: function (token) {
    switch (token.type) {
    // If an EOF token arrives in the top context, signal that we're done.
    case 'eof':
      if (this._graph !== null)
        return this._error('Unclosed graph', token);
      delete this._prefixes._;
      return this._callback(null, null, this._prefixes);
    // It could be a prefix declaration.
    case '@prefix':
      this._sparqlStyle = false;
      return this._readPrefix;
    case 'PREFIX':
      this._sparqlStyle = true;
      return this._readPrefix;
    // It could be a base declaration.
    case '@base':
      this._sparqlStyle = false;
      return this._readBaseIRI;
    case 'BASE':
      this._sparqlStyle = true;
      return this._readBaseIRI;
    // It could be a graph.
    case '{':
      if (this._supportsNamedGraphs) {
        this._graph = '';
        this._subject = null;
        return this._readSubject;
      }
    case 'GRAPH':
      if (this._supportsNamedGraphs) {
        return this._readNamedGraphLabel;
      }
    // Otherwise, the next token must be a subject.
    default:
      return this._readSubject(token);
    }
  },

  // ### `_readSubject` reads a triple's subject.
  _readSubject: function (token) {
    this._predicate = null;
    switch (token.type) {
    case 'IRI':
      if (this._baseIRI === null || absoluteIRI.test(token.value))
        this._subject = token.value;
      else
        this._subject = this._resolveIRI(token);
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      this._subject = prefix + token.value;
      break;
    case '[':
      // Start a new triple with a new blank node as subject.
      this._subject = '_:b' + blankNodeCount++;
      this._tripleStack.push({ subject: this._subject, predicate: null, object: null, type: 'blank' });
      return this._readBlankNodeHead;
    case '(':
      // Start a new list
      this._tripleStack.push({ subject: RDF_NIL, predicate: null, object: null, type: 'list' });
      this._subject = null;
      return this._readListItem;
    case '}':
      return this._readPunctuation(token);
    default:
      return this._error('Expected subject but got ' + token.type, token);
    }
    // The next token must be a predicate,
    // or, if the subject was actually a graph IRI, a named graph.
    return this._readPredicateOrNamedGraph;
  },

  // ### `_readPredicate` reads a triple's predicate.
  _readPredicate: function (token) {
    var type = token.type;
    switch (type) {
    case 'IRI':
    case 'abbreviation':
      if (this._baseIRI === null || absoluteIRI.test(token.value))
        this._predicate = token.value;
      else
        this._predicate = this._resolveIRI(token);
      break;
    case 'prefixed':
      if (token.prefix === '_') {
        return this._error('Disallowed blank node as predicate', token);
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        this._predicate = prefix + token.value;
      }
      break;
    case '.':
    case ']':
    case '}':
      // Expected predicate didn't come, must have been trailing semicolon.
      if (this._predicate === null)
        return this._error('Unexpected ' + type, token);
      this._subject = null;
      return type === ']' ? this._readBlankNodeTail(token) : this._readPunctuation(token);
    case ';':
      // Extra semicolons can be safely ignored
      return this._readPredicate;
    default:
      return this._error('Expected predicate to follow "' + this._subject + '"', token);
    }
    // The next token must be an object.
    return this._readObject;
  },

  // ### `_readObject` reads a triple's object.
  _readObject: function (token) {
    switch (token.type) {
    case 'IRI':
      if (this._baseIRI === null || absoluteIRI.test(token.value))
        this._object = token.value;
      else
        this._object = this._resolveIRI(token);
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      this._object = prefix + token.value;
      break;
    case 'literal':
      this._object = token.value;
      return this._readDataTypeOrLang;
    case '[':
      // Start a new triple with a new blank node as subject.
      var blank = '_:b' + blankNodeCount++;
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: blank, type: 'blank' });
      this._subject = blank;
      return this._readBlankNodeHead;
    case '(':
      // Start a new list
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: RDF_NIL, type: 'list' });
      this._subject = null;
      return this._readListItem;
    default:
      return this._error('Expected object to follow "' + this._predicate + '"', token);
    }
    return this._getTripleEndReader();
  },

  // ### `_readPredicateOrNamedGraph` reads a triple's predicate, or a named graph.
  _readPredicateOrNamedGraph: function (token) {
    return token.type === '{' ? this._readGraph(token) : this._readPredicate(token);
  },

  // ### `_readGraph` reads a graph.
  _readGraph: function (token) {
    if (token.type !== '{')
      return this._error('Expected graph but got ' + token.type, token);
    // The "subject" we read is actually the GRAPH's label
    this._graph = this._subject, this._subject = null;
    return this._readSubject;
  },

  // ### `_readBlankNodeHead` reads the head of a blank node.
  _readBlankNodeHead: function (token) {
    if (token.type === ']') {
      this._subject = null;
      return this._readBlankNodeTail(token);
    }
    this._predicate = null;
    return this._readPredicate(token);
  },

  // ### `_readBlankNodeTail` reads the end of a blank node.
  _readBlankNodeTail: function (token) {
    if (token.type !== ']')
      return this._readBlankNodePunctuation(token);

    // Store blank node triple.
    if (this._subject !== null)
      this._callback(null, { subject:   this._subject,
                             predicate: this._predicate,
                             object:    this._object,
                             graph:     this._graph || '' });

    // Restore parent triple that contains the blank node.
    var triple = this._tripleStack.pop();
    this._subject = triple.subject;
    // Was the blank node the object?
    if (triple.object !== null) {
      // Restore predicate and object as well, and continue by reading punctuation.
      this._predicate = triple.predicate;
      this._object = triple.object;
      return this._getTripleEndReader();
    }
    // The blank node was the subject, so continue reading the predicate.
    // If the blank node didn't contain any predicates, it could also be the label of a named graph.
    return this._predicate !== null ? this._readPredicate : this._readPredicateOrNamedGraph;
  },

  // ### `_readDataTypeOrLang` reads an _optional_ data type or language.
  _readDataTypeOrLang: function (token) {
    switch (token.type) {
    case 'type':
      var value;
      if (token.prefix === '') {
        if (this._baseIRI === null || absoluteIRI.test(token.value))
          value = token.value;
        else
          value = this._resolveIRI(token);
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        value = prefix + token.value;
      }
      this._object += '^^' + value;
      return this._getTripleEndReader();
    case 'langcode':
      this._object += '@' + token.value.toLowerCase();
      return this._getTripleEndReader();
    default:
      return this._getTripleEndReader().call(this, token);
    }
  },

  // ### `_readListItem` reads items from a list.
  _readListItem: function (token) {
    var item = null,                  // The actual list item.
        itemHead = null,              // The head of the rdf:first predicate.
        prevItemHead = this._subject, // The head of the previous rdf:first predicate.
        stack = this._tripleStack,    // The stack of triples part of recursion (lists, blanks, etc.).
        parentTriple = stack[stack.length - 1], // The triple containing the current list.
        next = this._readListItem;    // The next function to execute.

    switch (token.type) {
    case 'IRI':
      item = token.value;
      break;
    case 'prefixed':
      var prefix = this._prefixes[token.prefix];
      if (prefix === undefined)
        return this._error('Undefined prefix "' + token.prefix + ':"', token);
      item = prefix + token.value;
      break;
    case 'literal':
      item = token.value;
      next = this._readDataTypeOrLang;
      break;
    case '[':
      // Stack the current list triple and start a new triple with a blank node as subject.
      itemHead = '_:b' + blankNodeCount++;
      item     = '_:b' + blankNodeCount++;
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: item, type: 'blank' });
      this._subject = item;
      next = this._readBlankNodeHead;
      break;
    case '(':
      // Stack the current list triple and start a new list
      itemHead = '_:b' + blankNodeCount++;
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: RDF_NIL, type: 'list' });
      this._subject = null;
      next = this._readListItem;
      break;
    case ')':
      // Restore the parent triple.
      stack.pop();
      // If this list is contained within a parent list, return the membership triple here.
      // This will be `<parent list element> rdf:first <this list>.`.
      if (stack.length !== 0 && stack[stack.length - 1].type === 'list')
        this._callback(null, { subject:   parentTriple.subject,
                               predicate: parentTriple.predicate,
                               object:    parentTriple.object,
                               graph:     this._graph || '' });
      // Restore the parent triple's subject.
      this._subject = parentTriple.subject;
      // Was this list in the parent triple's subject?
      if (parentTriple.predicate === null) {
        // The next token is the predicate.
        next = this._readPredicate;
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.subject === RDF_NIL)
          return next;
      }
      // The list was in the parent triple's object.
      else {
        // Restore the parent triple's predicate and object as well.
        this._predicate = parentTriple.predicate;
        this._object = parentTriple.object;
        next = this._getTripleEndReader();
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.object === RDF_NIL)
          return next;
      }
      // Close the list by making the item head nil.
      itemHead = RDF_NIL;
      break;
    default:
      return this._error('Expected list item instead of "' + token.type + '"', token);
    }

     // Create a new blank node if no item head was assigned yet.
    if (itemHead === null)
      this._subject = itemHead = '_:b' + blankNodeCount++;

    // Is this the first element of the list?
    if (prevItemHead === null) {
      // This list is either the object or the subject.
      if (parentTriple.object === RDF_NIL)
        parentTriple.object = itemHead;
      else
        parentTriple.subject = itemHead;
    }
    else {
      // The rest of the list is in the current head.
      this._callback(null, { subject:   prevItemHead,
                             predicate: RDF_REST,
                             object:    itemHead,
                             graph:     this._graph || '' });
    }
    // Add the item's value.
    if (item !== null)
      this._callback(null, { subject:   itemHead,
                             predicate: RDF_FIRST,
                             object:    item,
                             graph:     this._graph || '' });
    return next;
  },

  // ### `_readPunctuation` reads punctuation between triples or triple parts.
  _readPunctuation: function (token) {
    var next, subject = this._subject, graph = this._graph;
    switch (token.type) {
    // A closing brace ends a graph
    case '}':
      if (this._graph === null)
        return this._error('Unexpected graph closing', token);
      this._graph = null;
    // A dot just ends the statement, without sharing anything with the next.
    case '.':
      this._subject = null;
      next = this._readInTopContext;
      break;
    // Semicolon means the subject is shared; predicate and object are different.
    case ';':
      next = this._readPredicate;
      break;
    // Comma means both the subject and predicate are shared; the object is different.
    case ',':
      next = this._readObject;
      break;
    // An IRI means this is a quad (only allowed if not already inside a graph).
    case 'IRI':
      if (this._supportsQuads && this._graph === null) {
        if (this._baseIRI === null || absoluteIRI.test(token.value))
          graph = token.value;
        else
          graph = this._resolveIRI(token);
        subject = this._subject;
        next = this._readQuadPunctuation;
        break;
      }
    // An prefixed name means this is a quad (only allowed if not already inside a graph).
    case 'prefixed':
      if (this._supportsQuads && this._graph === null) {
        var prefix = this._prefixes[token.prefix];
        if (prefix === undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        graph = prefix + token.value;
        next = this._readQuadPunctuation;
        break;
      }
    default:
      return this._error('Expected punctuation to follow "' + this._object + '"', token);
    }
    // A triple has been completed now, so return it.
    if (subject !== null)
      this._callback(null, { subject:   subject,
                             predicate: this._predicate,
                             object:    this._object,
                             graph:     graph || '' });
    return next;
  },

    // ### `_readBlankNodePunctuation` reads punctuation in a blank node
  _readBlankNodePunctuation: function (token) {
    var next;
    switch (token.type) {
    // Semicolon means the subject is shared; predicate and object are different.
    case ';':
      next = this._readPredicate;
      break;
    // Comma means both the subject and predicate are shared; the object is different.
    case ',':
      next = this._readObject;
      break;
    default:
      return this._error('Expected punctuation to follow "' + this._object + '"', token);
    }
    // A triple has been completed now, so return it.
    this._callback(null, { subject:   this._subject,
                           predicate: this._predicate,
                           object:    this._object,
                           graph:     this._graph || '' });
    return next;
  },

  // ### `_readQuadPunctuation` reads punctuation after a quad.
  _readQuadPunctuation: function (token) {
    if (token.type !== '.')
      return this._error('Expected dot to follow quad', token);
    return this._readInTopContext;
  },

  // ### `_readPrefix` reads the prefix of a prefix declaration.
  _readPrefix: function (token) {
    if (token.type !== 'prefix')
      return this._error('Expected prefix to follow @prefix', token);
    this._prefix = token.value;
    return this._readPrefixIRI;
  },

  // ### `_readPrefixIRI` reads the IRI of a prefix declaration.
  _readPrefixIRI: function (token) {
    if (token.type !== 'IRI')
      return this._error('Expected IRI to follow prefix "' + this._prefix + ':"', token);
    var prefixIRI;
    if (this._baseIRI === null || absoluteIRI.test(token.value))
      prefixIRI = token.value;
    else
      prefixIRI = this._resolveIRI(token);
    this._prefixes[this._prefix] = prefixIRI;
    this._prefixCallback(this._prefix, prefixIRI);
    return this._readDeclarationPunctuation;
  },

  // ### `_readBaseIRI` reads the IRI of a base declaration.
  _readBaseIRI: function (token) {
    if (token.type !== 'IRI')
      return this._error('Expected IRI to follow base declaration', token);
    if (token.value.indexOf('#') > 0)
      return this._error('Invalid base IRI', token);
    if (this._baseIRI === null || absoluteIRI.test(token.value))
      this._baseIRI = token.value;
    else
      this._baseIRI = this._resolveIRI(token);
    this._baseIRIPath = this._baseIRI.replace(documentPart, '');
    this._baseIRIRoot = this._baseIRI.match(rootIRI)[0];
    return this._readDeclarationPunctuation;
  },

  // ### `_readNamedGraphLabel` reads the label of a named graph.
  _readNamedGraphLabel: function (token) {
    switch (token.type) {
    case 'IRI':
    case 'prefixed':
      return this._readSubject(token), this._readGraph;
    case '[':
      return this._readNamedGraphBlankLabel;
    default:
      return this._error('Invalid graph label', token);
    }
  },

  // ### `_readNamedGraphLabel` reads a blank node label of a named graph.
  _readNamedGraphBlankLabel: function (token) {
    if (token.type !== ']')
      return this._error('Invalid graph label', token);
    this._subject = '_:b' + blankNodeCount++;
    return this._readGraph;
  },

  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration.
  _readDeclarationPunctuation: function (token) {
    // SPARQL-style declarations don't have punctuation.
    if (this._sparqlStyle)
      return this._readInTopContext(token);

    if (token.type !== '.')
      return this._error('Expected declaration to end with a dot', token);
    return this._readInTopContext;
  },

  // ### `_getTripleEndReader` gets the next reader function at the end of a triple.
  _getTripleEndReader: function () {
    var stack = this._tripleStack;
    if (stack.length === 0)
      return this._readPunctuation;

    switch (stack[stack.length - 1].type) {
    case 'blank':
      return this._readBlankNodeTail;
    case 'list':
      return this._readListItem;
    }
  },

  // ### `_error` emits an error message through the callback.
  _error: function (message, token) {
    this._callback(new Error(message + ' at line ' + token.line + '.'));
  },

  // ### `_resolveIRI` resolves an IRI token against the base path
  _resolveIRI: function (token) {
    var iri = token.value;
    switch (iri[0]) {
    // An empty relative IRI indicates the base IRI
    case undefined:
      return this._baseIRI;
    // Resolve relative fragment IRIs against the base IRI
    case '#':
      return this._baseIRI     + iri;
    // Resolve relative query string IRIs by replacing the query string
    case '?':
      return this._baseIRI.replace(/(?:\?.*)?$/, iri);
    // Resolve root relative IRIs at the root of the base IRI
    case '/':
      return this._baseIRIRoot + iri;
    // Resolve all other IRIs at the base IRI's path
    default:
      return this._baseIRIPath + iri;
    }
  },

  // ## Public methods

  // ### `parse` parses the N3 input and emits each parsed triple through the callback.
  parse: function (input, tripleCallback, prefixCallback) {
    // The read callback is the next function to be executed when a token arrives.
    // We start reading in the top context.
    this._readCallback = this._readInTopContext;
    this._prefixes = Object.create(null);
    this._prefixes._ = this._blankNodePrefix || '_:b' + blankNodePrefix++ + '_';

    // If the input argument is not given, shift parameters
    if (typeof input === 'function')
      prefixCallback = tripleCallback, tripleCallback = input, input = null;

    // Set the triple and prefix callbacks.
    this._callback = tripleCallback || noop;
    this._prefixCallback = prefixCallback || noop;

    // Execute the read callback when a token arrives.
    var self = this;
    this._lexer.tokenize(input, function (error, token) {
      if (error !== null)
        self._callback(error), self._callback = noop;
      else if (self._readCallback !== undefined)
        self._readCallback = self._readCallback(token);
    });

    // If no input was given, it can be added with `addChunk` and ended with `end`
    if (!input) {
      this.addChunk = this._lexer.addChunk;
      this.end = this._lexer.end;
    }
  }
};

// The empty function
function noop() {}

// ## Exports

// Export the `N3Parser` class as a whole.
module.exports = N3Parser;

},{"./N3Lexer":41}],43:[function(require,module,exports){
// **N3Store** objects store N3 triples by graph in memory.

var expandPrefixedName = require('./N3Util').expandPrefixedName;

// ## Constructor
function N3Store(triples, options) {
  if (!(this instanceof N3Store))
    return new N3Store(triples, options);

  // The number of triples is initially zero.
  this._size = 0;
  // `_graphs` contains subject, predicate, and object indexes per graph.
  this._graphs = Object.create(null);
  // `_entities` maps entities such as `http://xmlns.com/foaf/0.1/name` to numbers.
  // This saves memory, since only the numbers have to be stored in `_graphs`.
  this._entities = Object.create(null);
  this._entities['><'] = 0; // Dummy entry, so the first actual key is non-zero
  this._entityCount = 0;
  // `_blankNodeIndex` is the index of the last created blank node that was automatically named
  this._blankNodeIndex = 0;

  // Shift parameters if `triples` is not given
  if (!options && triples && !triples[0])
    options = triples, triples = null;

  // Add triples and prefixes if passed
  this._prefixes = Object.create(null);
  if (options && options.prefixes)
    this.addPrefixes(options.prefixes);
  if (triples)
    this.addTriples(triples);
}

N3Store.prototype = {
  // ## Public properties

  // ### `size` returns the number of triples in the store.
  get size() {
    // Return the triple count if if was cached.
    var size = this._size;
    if (size !== null)
      return size;

    // Calculate the number of triples by counting to the deepest level.
    var graphs = this._graphs, subjects, subject;
    for (var graphKey in graphs)
      for (var subjectKey in (subjects = graphs[graphKey].subjects))
        for (var predicateKey in (subject = subjects[subjectKey]))
          size += Object.keys(subject[predicateKey]).length;
    return this._size = size;
  },

  // ## Private methods

  // ### `_addToIndex` adds a triple to a three-layered index.
  _addToIndex: function (index0, key0, key1, key2) {
    // Create layers as necessary.
    var index1 = index0[key0] || (index0[key0] = {});
    var index2 = index1[key1] || (index1[key1] = {});
    // Setting the key to _any_ value signalizes the presence of the triple.
    index2[key2] = null;
  },

  // ### `_removeFromIndex` removes a triple from a three-layered index.
  _removeFromIndex: function (index0, key0, key1, key2) {
    // Remove the triple from the index.
    var index1 = index0[key0], index2 = index1[key1], key;
    delete index2[key2];

    // Remove intermediary index layers if they are empty.
    for (key in index2) return;
    delete index1[key1];
    for (key in index1) return;
    delete index0[key0];
  },

  // ### `_findInIndex` finds a set of triples in a three-layered index.
  // The index base is `index0` and the keys at each level are `key0`, `key1`, and `key2`.
  // Any of these keys can be `null`, which is interpreted as a wildcard.
  // `name0`, `name1`, and `name2` are the names of the keys at each level,
  // used when reconstructing the resulting triple
  // (for instance: _subject_, _predicate_, and _object_).
  // Finally, `graph` will be the graph of the created triples.
  _findInIndex: function (index0, key0, key1, key2, name0, name1, name2, graph) {
    var results = [], entityKeys = Object.keys(this._entities), tmp, index1, index2;

    // If a key is specified, use only that part of index 0.
    if (key0) (tmp = index0, index0 = {})[key0] = tmp[key0];
    for (var value0 in index0) {
      var entity0 = entityKeys[value0];

      if (index1 = index0[value0]) {
        // If a key is specified, use only that part of index 1.
        if (key1) (tmp = index1, index1 = {})[key1] = tmp[key1];
        for (var value1 in index1) {
          var entity1 = entityKeys[value1];

          if (index2 = index1[value1]) {
            // If a key is specified, use only that part of index 2, if it exists.
            var values = key2 ? (key2 in index2 ? [key2] : []) : Object.keys(index2);
            // Create triples for all items found in index 2.
            for (var l = values.length - 1; l >= 0; l--) {
              var result = { subject: '', predicate: '', object: '', graph: graph };
              result[name0] = entity0;
              result[name1] = entity1;
              result[name2] = entityKeys[values[l]];
              results.push(result);
            }
          }
        }
      }
    }
    return results;
  },

  // ### `_countInIndex` counts matching triples in a three-layered index.
  // The index base is `index0` and the keys at each level are `key0`, `key1`, and `key2`.
  // Any of these keys can be `null`, which is interpreted as a wildcard.
  _countInIndex: function (index0, key0, key1, key2) {
    var count = 0, tmp, index1, index2;

    // If a key is specified, count only that part of index 0.
    if (key0) (tmp = index0, index0 = {})[key0] = tmp[key0];
    for (var value0 in index0) {
      if (index1 = index0[value0]) {
        // If a key is specified, count only that part of index 1.
        if (key1) (tmp = index1, index1 = {})[key1] = tmp[key1];
        for (var value1 in index1) {
          if (index2 = index1[value1]) {
            // If a key is specified, count the triple if it exists.
            if (key2) (key2 in index2) && count++;
            // Otherwise, count all triples.
            else count += Object.keys(index2).length;
          }
        }
      }
    }
    return count;
  },

  // ## Public methods

  // ### `addTriple` adds a new N3 triple to the store.
  addTriple: function (subject, predicate, object, graph) {
    // Shift arguments if a triple object is given instead of components
    if (!predicate)
      graph = subject.graph, object = subject.object,
        predicate = subject.predicate, subject = subject.subject;

    // Find the graph that will contain the triple.
    graph = graph || '';
    var graphItem = this._graphs[graph];
    // Create the graph if it doesn't exist yet.
    if (!graphItem) {
      graphItem = this._graphs[graph] = {
        subjects: {},
        predicates: {},
        objects: {}
      };
      // Freezing a graph helps subsequent `add` performance,
      // and properties will never be modified anyway.
      Object.freeze(graphItem);
    }

    // Since entities can often be long IRIs, we avoid storing them in every index.
    // Instead, we have a separate index that maps entities to numbers,
    // which are then used as keys in the other indexes.
    var entities = this._entities;
    subject   = entities[subject]   || (entities[subject]   = ++this._entityCount);
    predicate = entities[predicate] || (entities[predicate] = ++this._entityCount);
    object    = entities[object]    || (entities[object]    = ++this._entityCount);

    this._addToIndex(graphItem.subjects,   subject,   predicate, object);
    this._addToIndex(graphItem.predicates, predicate, object,    subject);
    this._addToIndex(graphItem.objects,    object,    subject,   predicate);

    // The cached triple count is now invalid.
    this._size = null;
  },

  // ### `addTriples` adds multiple N3 triples to the store.
  addTriples: function (triples) {
    for (var i = triples.length - 1; i >= 0; i--)
      this.addTriple(triples[i]);
  },

  // ### `addPrefix` adds support for querying with the given prefix
  addPrefix: function (prefix, iri) {
    this._prefixes[prefix] = iri;
  },

  // ### `addPrefixes` adds support for querying with the given prefixes
  addPrefixes: function (prefixes) {
    for (var prefix in prefixes)
      this.addPrefix(prefix, prefixes[prefix]);
  },

  // ### `removeTriple` removes an N3 triple from the store if it exists.
  removeTriple: function (subject, predicate, object, graph) {
    // Shift arguments if a triple object is given instead of components.
    if (!predicate)
      graph = subject.graph, object = subject.object,
        predicate = subject.predicate, subject = subject.subject;
    graph = graph || '';

    // Find internal identifiers for all components.
    var graphItem, entities = this._entities, graphs = this._graphs;
    if (!(subject     = entities[subject]))   return;
    if (!(predicate   = entities[predicate])) return;
    if (!(object      = entities[object]))    return;
    if (!(graphItem   = graphs[graph]))       return;

    // Verify that the triple exists.
    var subjects, predicates;
    if (!(subjects   = graphItem.subjects[subject])) return;
    if (!(predicates = subjects[predicate])) return;
    if (!(object in predicates)) return;

    // Remove it from all indexes.
    this._removeFromIndex(graphItem.subjects,   subject,   predicate, object);
    this._removeFromIndex(graphItem.predicates, predicate, object,    subject);
    this._removeFromIndex(graphItem.objects,    object,    subject,   predicate);
    if (this._size !== null) this._size--;

    // Remove the graph if it is empty.
    for (subject in graphItem.subjects) return;
    delete graphs[graph];
  },

  // ### `removeTriples` removes multiple N3 triples from the store.
  removeTriples: function (triples) {
    for (var i = triples.length - 1; i >= 0; i--)
      this.removeTriple(triples[i]);
  },

  // ### `find` finds a set of triples matching a pattern, expanding prefixes as necessary.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  find: function (subject, predicate, object, graph) {
    var prefixes = this._prefixes;
    return this.findByIRI(
      expandPrefixedName(subject,   prefixes),
      expandPrefixedName(predicate, prefixes),
      expandPrefixedName(object,    prefixes),
      expandPrefixedName(graph,     prefixes)
    );
  },

  // ### `findByIRI` finds a set of triples matching a pattern.
  // Setting `subject`, `predicate`, or `object` to a falsy value means an _anything_ wildcard.
  // Setting `graph` to a falsy value means the default graph.
  findByIRI: function (subject, predicate, object, graph) {
    graph = graph || '';
    var graphItem = this._graphs[graph], entities = this._entities;

    // If the specified graph contain no triples, there are no results.
    if (!graphItem) return [];

    // Translate IRIs to internal index keys.
    // Optimization: if the entity doesn't exist, no triples with it exist.
    if (subject   && !(subject   = entities[subject]))   return [];
    if (predicate && !(predicate = entities[predicate])) return [];
    if (object    && !(object    = entities[object]))    return [];

    // Choose the optimal index, based on what fields are present
    if (subject) {
      if (object)
        // If subject and object are given, the object index will be the fastest.
        return this._findInIndex(graphItem.objects, object, subject, predicate,
                                 'object', 'subject', 'predicate', graph);
      else
        // If only subject and possibly predicate are given, the subject index will be the fastest.
        return this._findInIndex(graphItem.subjects, subject, predicate, null,
                                 'subject', 'predicate', 'object', graph);
    }
    else if (predicate)
      // If only predicate and possibly object are given, the predicate index will be the fastest.
      return this._findInIndex(graphItem.predicates, predicate, object, null,
                               'predicate', 'object', 'subject', graph);
    else if (object)
      // If only object is given, the object index will be the fastest.
      return this._findInIndex(graphItem.objects, object, null, null,
                               'object', 'subject', 'predicate', graph);
    else
      // If nothing is given, iterate subjects and predicates first
      return this._findInIndex(graphItem.subjects, null, null, null,
                               'subject', 'predicate', 'object', graph);
  },

  // ### `count` returns the number of triples matching a pattern, expanding prefixes as necessary.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  count: function (subject, predicate, object, graph) {
    var prefixes = this._prefixes;
    return this.countByIRI(
      expandPrefixedName(subject,   prefixes),
      expandPrefixedName(predicate, prefixes),
      expandPrefixedName(object,    prefixes),
      expandPrefixedName(graph,     prefixes)
    );
  },

  // ### `countByIRI` returns the number of triples matching a pattern.
  // Setting `subject`, `predicate`, or `object` to `null` means an _anything_ wildcard.
  // Setting `graph` to `null` means the default graph.
  countByIRI: function (subject, predicate, object, graph) {
    graph = graph || '';
    var graphItem = this._graphs[graph], entities = this._entities;

    // If the specified graph contain no triples, there are no results.
    if (!graphItem) return 0;

    // Translate IRIs to internal index keys.
    // Optimization: if the entity doesn't exist, no triples with it exist.
    if (subject   && !(subject   = entities[subject]))   return 0;
    if (predicate && !(predicate = entities[predicate])) return 0;
    if (object    && !(object    = entities[object]))    return 0;

    // Choose the optimal index, based on what fields are present
    if (subject) {
      if (object)
        // If subject and object are given, the object index will be the fastest.
        return this._countInIndex(graphItem.objects, object, subject, predicate);
      else
        // If only subject and possibly predicate are given, the subject index will be the fastest.
        return this._countInIndex(graphItem.subjects, subject, predicate, object);
    }
    else if (predicate) {
      // If only predicate and possibly object are given, the predicate index will be the fastest.
      return this._countInIndex(graphItem.predicates, predicate, object, subject);
    }
    else {
      // If only object is possibly given, the object index will be the fastest.
      return this._countInIndex(graphItem.objects, object, subject, predicate);
    }
  },

  // ### `createBlankNode` creates a new blank node, returning its name.
  createBlankNode: function (suggestedName) {
    var name;
    if (suggestedName) {
      name = suggestedName = '_:' + suggestedName;
      var index = 1;
      while (this._entities[name])
        name = suggestedName + index++;
    }
    else {
      do { name = '_:b' + this._blankNodeIndex++; }
      while (this._entities[name]);
    }
    this._entities[name] = this._entityCount++;
    return name;
  },
};

// ## Exports

// Export the `N3Store` class as a whole.
module.exports = N3Store;

},{"./N3Util":46}],44:[function(require,module,exports){
// **N3StreamParser** parses an N3 stream into a triple stream
var Transform = require('stream').Transform,
    util = require('util'),
    N3Parser = require('./N3Parser.js');

// ## Constructor
function N3StreamParser(options) {
  if (!(this instanceof N3StreamParser))
    return new N3StreamParser(options);

  // Initialize Transform base class
  Transform.call(this, { decodeStrings: true });
  this._readableState.objectMode = true;

  // Set up parser
  var self = this, parser = new N3Parser(options);
  parser.parse(
    // Handle triples by pushing them down the pipeline
    function (error, triple) {
      triple && self.push(triple) ||
      error  && self.emit('error', error);
    },
    // Emit prefixes through the `prefix` event
    this.emit.bind(this, 'prefix'));

  // Implement Transform methods on top of parser
  this._transform = function (chunk, encoding, done) { parser.addChunk(chunk); done(); };
  this._flush = function (done) { parser.end(); done(); };
}
util.inherits(N3StreamParser, Transform);

// ## Exports
// Export the `N3StreamParser` class as a whole.
module.exports = N3StreamParser;

},{"./N3Parser.js":42,"stream":undefined,"util":10}],45:[function(require,module,exports){
// **N3StreamWriter** serializes a triple stream into an N3 stream
var Transform = require('stream').Transform,
    util = require('util'),
    N3Writer = require('./N3Writer.js');

// ## Constructor
function N3StreamWriter(options) {
  if (!(this instanceof N3StreamWriter))
    return new N3StreamWriter(options);

  // Initialize Transform base class
  Transform.call(this, { encoding: 'utf8' });
  this._writableState.objectMode = true;

  // Set up writer with a dummy stream object
  var self = this;
  var writer = new N3Writer({
    write: function (chunk, encoding, callback) { self.push(chunk); callback && callback(); },
    end: function (callback) { self.push(null); callback && callback(); },
  }, options);

  // Implement Transform methods on top of writer
  this._transform = function (triple, encoding, done) { writer.addTriple(triple, done); };
  this._flush = function (done) { writer.end(done); };
}
util.inherits(N3StreamWriter, Transform);

// ## Exports
// Export the `N3StreamWriter` class as a whole.
module.exports = N3StreamWriter;

},{"./N3Writer.js":47,"stream":undefined,"util":10}],46:[function(require,module,exports){
// **N3Util** provides N3 utility functions

var Xsd = 'http://www.w3.org/2001/XMLSchema#';
var XsdString  = Xsd + 'string';
var XsdInteger = Xsd + 'integer';
var XsdDecimal = Xsd + 'decimal';
var XsdBoolean = Xsd + 'boolean';
var RdfLangString = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString';

var N3Util = {
  // Tests whether the given entity (triple object) represents an IRI in the N3 library
  isIRI: function (entity) {
    if (!entity)
      return entity;
    var firstChar = entity[0];
    return firstChar !== '"' && firstChar !== '_';
  },

  // Tests whether the given entity (triple object) represents a literal in the N3 library
  isLiteral: function (entity) {
    return entity && entity[0] === '"';
  },

  // Tests whether the given entity (triple object) represents a blank node in the N3 library
  isBlank: function (entity) {
    return entity && entity.substr(0, 2) === '_:';
  },

  // Gets the string value of a literal in the N3 library
  getLiteralValue: function (literal) {
    var match = /^"([^]*)"/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1];
  },

  // Gets the type of a literal in the N3 library
  getLiteralType: function (literal) {
    var match = /^"[^]*"(?:\^\^([^"]+)|(@)[^@"]+)?$/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1] || (match[2] ? RdfLangString : XsdString);
  },

  // Gets the language of a literal in the N3 library
  getLiteralLanguage: function (literal) {
    var match = /^"[^]*"(?:@([^@"]+)|\^\^[^"]+)?$/.exec(literal);
    if (!match)
      throw new Error(literal + ' is not a literal');
    return match[1] ? match[1].toLowerCase() : '';
  },

  // Tests whether the given entity (triple object) represents a prefixed name
  isPrefixedName: function (entity) {
    return entity && /^[^:\/"']*:[^:\/"']+$/.test(entity);
  },

  // Expands the prefixed name to a full IRI (also when it occurs as a literal's type)
  expandPrefixedName: function (prefixedName, prefixes) {
    var match = /(?:^|"\^\^)([^:\/#"'\^_]*):[^\/]*$/.exec(prefixedName), prefix, base, index;
    if (match)
      prefix = match[1], base = prefixes[prefix], index = match.index;
    if (base === undefined)
      return prefixedName;

    // The match index is non-zero when expanding a literal's type.
    return index === 0 ? base + prefixedName.substr(prefix.length + 1)
                       : prefixedName.substr(0, index + 3) +
                         base + prefixedName.substr(index + prefix.length + 4);
  },

  // Creates an IRI in N3.js representation
  createIRI: function (iri) {
    return iri && iri[0] === '"' ? N3Util.getLiteralValue(iri) : iri;
  },

  // Creates a literal in N3.js representation
  createLiteral: function (value, modifier) {
    if (!modifier) {
      switch (typeof value) {
      case 'boolean':
        modifier = XsdBoolean;
        break;
      case 'number':
        if (isFinite(value)) {
          modifier = value % 1 === 0 ? XsdInteger : XsdDecimal;
          break;
        }
      default:
        return '"' + value + '"';
      }
    }
    return '"' + value +
           (/^[a-z]+(-[a-z0-9]+)*$/i.test(modifier) ? '"@'  + modifier.toLowerCase()
                                                    : '"^^' + modifier);
  },
};

// Add the N3Util functions to the given object or its prototype
function AddN3Util(parent, toPrototype) {
  for (var name in N3Util)
    if (!toPrototype)
      parent[name] = N3Util[name];
    else
      parent.prototype[name] = ApplyToThis(N3Util[name]);

  return parent;
}

// Returns a function that applies `f` to the `this` object
function ApplyToThis(f) {
  return function (a) { return f(this, a); };
}

// Expose N3Util, attaching all functions to it
module.exports = AddN3Util(AddN3Util);

},{}],47:[function(require,module,exports){
// **N3Writer** writes N3 documents.

// Matches a literal as represented in memory by the N3 library
var N3LiteralMatcher = /^"([^]*)"(?:\^\^(.+)|@([\-a-z]+))?$/i;

// rdf:type predicate (for 'a' abbreviation)
var RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDF_TYPE   = RDF_PREFIX + 'type';

// Characters in literals that require escaping
var escape    = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/,
    escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g,
    escapeReplacements = { '\\': '\\\\', '"': '\\"', '\t': '\\t',
                           '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f' };

// ## Constructor
function N3Writer(outputStream, options) {
  if (!(this instanceof N3Writer))
    return new N3Writer(outputStream, options);

  // Shift arguments if the first argument is not a stream
  if (outputStream && typeof outputStream.write !== 'function')
    options = outputStream, outputStream = null;
  options = options || {};

  // If no output stream given, send the output as string through the end callback
  if (!outputStream) {
    var output = '';
    this._outputStream = {
      write: function (chunk, encoding, done) { output += chunk; done && done(); },
      end:   function (done) { done && done(null, output); },
    };
    this._endStream = true;
  }
  else {
    this._outputStream = outputStream;
    this._endStream = options.end === undefined ? true : !!options.end;
  }

  // Initialize writer, depending on the format
  this._subject = null;
  if (!(/triple|quad/i).test(options.format)) {
    this._graph = '';
    this._prefixIRIs = Object.create(null);
    options.prefixes && this.addPrefixes(options.prefixes);
  }
  else {
    this._writeTriple = this._writeTripleLine;
  }
}

N3Writer.prototype = {
  // ## Private methods

  // ### `_write` writes the argument to the output stream
  _write: function (string, callback) {
    this._outputStream.write(string, 'utf8', callback);
  },

    // ### `_writeTriple` writes the triple to the output stream
  _writeTriple: function (subject, predicate, object, graph, done) {
    try {
      // Write the graph's label if it has changed
      if (this._graph !== graph) {
        // Close the previous graph and start the new one
        this._write((this._subject === null ? '' : (this._graph ? '\n}\n' : '.\n')) +
                    (graph ? this._encodeIriOrBlankNode(graph) + ' {\n' : ''));
        this._graph = graph, this._subject = null;
      }
      // Don't repeat the subject if it's the same
      if (this._subject === subject) {
        // Don't repeat the predicate if it's the same
        if (this._predicate === predicate)
          this._write(', ' + this._encodeObject(object), done);
        // Same subject, different predicate
        else
          this._write(';\n    ' +
                      this._encodePredicate(this._predicate = predicate) + ' ' +
                      this._encodeObject(object), done);
      }
      // Different subject; write the whole triple
      else
        this._write((this._subject === null ? '' : '.\n') +
                    this._encodeSubject(this._subject = subject) + ' ' +
                    this._encodePredicate(this._predicate = predicate) + ' ' +
                    this._encodeObject(object), done);
    }
    catch (error) { done && done(error); }
  },

  // ### `_writeTripleLine` writes the triple or quad to the output stream as a single line
  _writeTripleLine: function (subject, predicate, object, graph, done) {
    // Don't use prefixes
    delete this._prefixMatch;
    // Write the triple
    try {
      this._write(this._encodeIriOrBlankNode(subject) + ' ' +
                  this._encodeIriOrBlankNode(predicate) + ' ' +
                  this._encodeObject(object) +
                  (graph ? ' ' + this._encodeIriOrBlankNode(graph) + '.\n' : '.\n'), done);
    }
    catch (error) { done && done(error); }
  },

  // ### `_encodeIriOrBlankNode` represents an IRI or blank node
  _encodeIriOrBlankNode: function (iri) {
    // A blank node is represented as-is
    if (iri[0] === '_' && iri[1] === ':') return iri;
    // Escape special characters
    if (escape.test(iri))
      iri = iri.replace(escapeAll, characterReplacer);
    // Try to represent the IRI as prefixed name
    var prefixMatch = this._prefixRegex.exec(iri);
    return !prefixMatch ? '<' + iri + '>' :
           (!prefixMatch[1] ? iri : this._prefixIRIs[prefixMatch[1]] + prefixMatch[2]);
  },

  // ### `_encodeLiteral` represents a literal
  _encodeLiteral: function (value, type, language) {
    // Escape special characters
    if (escape.test(value))
      value = value.replace(escapeAll, characterReplacer);
    // Write the literal, possibly with type or language
    if (language)
      return '"' + value + '"@' + language;
    else if (type)
      return '"' + value + '"^^' + this._encodeIriOrBlankNode(type);
    else
      return '"' + value + '"';
  },

  // ### `_encodeSubject` represents a subject
  _encodeSubject: function (subject) {
    if (subject[0] === '"')
      throw new Error('A literal as subject is not allowed: ' + subject);
    return this._encodeIriOrBlankNode(subject);
  },

  // ### `_encodePredicate` represents a predicate
  _encodePredicate: function (predicate) {
    if (predicate[0] === '"')
      throw new Error('A literal as predicate is not allowed: ' + predicate);
    return predicate === RDF_TYPE ? 'a' : this._encodeIriOrBlankNode(predicate);
  },

  // ### `_encodeObject` represents an object
  _encodeObject: function (object) {
    // Represent an IRI or blank node
    if (object[0] !== '"')
      return this._encodeIriOrBlankNode(object);
    // Represent a literal
    var match = N3LiteralMatcher.exec(object);
    if (!match) throw new Error('Invalid literal: ' + object);
    return this._encodeLiteral(match[1], match[2], match[3]);
  },

  // ### `_blockedWrite` replaces `_write` after the writer has been closed
  _blockedWrite: function () {
    throw new Error('Cannot write because the writer has been closed.');
  },

  // ### `addTriple` adds the triple to the output stream
  addTriple: function (subject, predicate, object, graph, done) {
    // The triple was given as a triple object, so shift parameters
    if (typeof object !== 'string')
      this._writeTriple(subject.subject, subject.predicate, subject.object,
                        subject.graph || '', predicate);
    // The optional `graph` parameter was not provided
    else if (typeof graph !== 'string')
      this._writeTriple(subject, predicate, object, '', graph);
    // The `graph` parameter was provided
    else
      this._writeTriple(subject, predicate, object, graph, done);
  },

  // ### `addTriples` adds the triples to the output stream
  addTriples: function (triples) {
    for (var i = 0; i < triples.length; i++)
      this.addTriple(triples[i]);
  },

  // ### `addPrefix` adds the prefix to the output stream
  addPrefix: function (prefix, iri, done) {
    var prefixes = {};
    prefixes[prefix] = iri;
    this.addPrefixes(prefixes, done);
  },

  // ### `addPrefixes` adds the prefixes to the output stream
  addPrefixes: function (prefixes, done) {
    // Add all useful prefixes
    var prefixIRIs = this._prefixIRIs, hasPrefixes = false;
    for (var prefix in prefixes) {
      // Verify whether the prefix can be used and does not exist yet
      var iri = prefixes[prefix];
      if (/[#\/]$/.test(iri) && prefixIRIs[iri] !== (prefix += ':')) {
        hasPrefixes = true;
        prefixIRIs[iri] = prefix;
        // Finish a possible pending triple
        if (this._subject !== null) {
          this._write(this._graph ? '\n}\n' : '.\n');
          this._subject = null, this._graph = '';
        }
        // Write prefix
        this._write('@prefix ' + prefix + ' <' + iri + '>.\n');
      }
    }
    // Recreate the prefix matcher
    if (hasPrefixes) {
      var IRIlist = '', prefixList = '';
      for (var prefixIRI in prefixIRIs) {
        IRIlist += IRIlist ? '|' + prefixIRI : prefixIRI;
        prefixList += (prefixList ? '|' : '') + prefixIRIs[prefixIRI];
      }
      IRIlist = IRIlist.replace(/[\]\/\(\)\*\+\?\.\\\$]/g, '\\$&');
      this._prefixRegex = new RegExp('^(?:' + prefixList + ')[^\/]*$|' +
                                     '^(' + IRIlist + ')([a-zA-Z][\\-_a-zA-Z0-9]*)$');
    }
    // End a prefix block with a newline
    this._write(hasPrefixes ? '\n' : '', done);
  },

  // ### `_prefixRegex` matches a prefixed name or IRI that begins with one of the added prefixes
  _prefixRegex: /$0^/,

  // ### `end` signals the end of the output stream
  end: function (done) {
    // Finish a possible pending triple
    if (this._subject !== null) {
      this._write(this._graph ? '\n}\n' : '.\n');
      this._subject = null;
    }
    // Disallow further writing
    this._write = this._blockedWrite;

    // Try to end the underlying stream, ensuring done is called exactly one time
    var singleDone = done && function (error, result) { singleDone = null, done(error, result); };
    if (this._endStream) {
      try { return this._outputStream.end(singleDone); }
      catch (error) { /* error closing stream */ }
    }
    singleDone && singleDone();
  },
};

// Replaces a character by its escaped version
function characterReplacer(character) {
  // Replace a single character by its escaped version
  var result = escapeReplacements[character];
  if (result === undefined) {
    // Replace a single character with its 4-bit unicode escape sequence
    if (character.length === 1) {
      result = character.charCodeAt(0).toString(16);
      result = '\\u0000'.substr(0, 6 - result.length) + result;
    }
    // Replace a surrogate pair with its 8-bit unicode escape sequence
    else {
      result = ((character.charCodeAt(0) - 0xD800) * 0x400 +
                 character.charCodeAt(1) + 0x2400).toString(16);
      result = '\\U00000000'.substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

// ## Exports

// Export the `N3Writer` class as a whole.
module.exports = N3Writer;

},{}],48:[function(require,module,exports){
(function (process){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
        return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
        var args = [].slice.call(arguments, 1);
        return function() {
            if (typeof handler === "function") {
                handler.apply(undefined, args);
            } else {
                (new Function("" + handler))();
            }
        };
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    task();
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            process.nextTick(partiallyApplied(runIfPresent, handle));
            return handle;
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
            return handle;
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(new Function("return this")()));

}).call(this,require('_process'))
},{"_process":8}],49:[function(require,module,exports){
var XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';

module.exports = function SparqlGenerator() { return { stringify: toQuery }; };

// Converts the parsed query object into a SPARQL query
function toQuery(q) {
  var query = '';
  for (var key in q.prefixes)
    query += 'PREFIX ' + key + ': <' + q.prefixes[key] + '>\n';

  if (q.queryType)
    query += q.queryType.toUpperCase() + ' ';
  if (q.reduced)
    query += 'REDUCED ';
  if (q.distinct)
    query += 'DISTINCT ';

  if (q.variables)
    query += mapJoin(q.variables, function (variable) {
      return isString(variable) ? toEntity(variable) :
             '(' + toExpression(variable.expression) + ' AS ' + variable.variable + ')';
    }) + ' ';
  else if (q.template)
    query += patterns.group(q.template, true) + '\n';

  if (q.from)
    query += mapJoin(q.from.default || [], function (g) { return 'FROM ' + toEntity(g) + '\n'; }, '') +
             mapJoin(q.from.named || [], function (g) { return 'FROM NAMED ' + toEntity(g) + '\n'; }, '');
  if (q.where)
    query += 'WHERE ' + patterns.group(q.where, true)  + '\n';

  if (q.updates)
    query += mapJoin(q.updates, toUpdate, ';\n');
  else if (q.values)
    query += patterns.values(q);

  if (q.order)
    query += 'ORDER BY ' + mapJoin(q.order, function (it) {
      var expr = toExpression(it.expression);
      return !it.descending ? expr : 'DESC(' + expr + ')';
    }) + '\n';
  if (q.group)
    query += 'GROUP BY ' + mapJoin(q.group, function (it) {
      return isString(it.expression) ? it.expression : '(' + toExpression(it.expression) + ')';
    }) + '\n';
  if (q.having)
    query += 'HAVING (' + mapJoin(q.having, toExpression) + ')\n';

  if (q.offset)
    query += 'OFFSET ' + q.offset + '\n';
  if (q.limit)
    query += 'LIMIT ' + q.limit + '\n';
  return query.trim();
}

// Converts the parsed SPARQL pattern into a SPARQL pattern
function toPattern(pattern) {
  var type = pattern.type || (pattern instanceof Array) && 'array' ||
             (pattern.subject && pattern.predicate && pattern.object ? 'triple' : '');
  if (!(type in patterns))
    throw new Error('Unknown entry type: ' + type);
  return patterns[type](pattern);
}
var patterns = {
  triple: function (t) {
    return toEntity(t.subject) + ' ' + toEntity(t.predicate) + ' ' + toEntity(t.object) + '.';
  },
  array: function (items) {
    return mapJoin(items, toPattern, '\n');
  },
  bgp: function (bgp) {
    return mapJoin(bgp.triples, patterns.triple, '\n');
  },
  graph: function (graph) {
    return 'GRAPH ' + toEntity(graph.name) + ' ' + patterns.group(graph);
  },
  group: function (group, inline) {
    group = inline !== true ? patterns.array(group.patterns || group.triples)
                            : toPattern(group.type !== 'group' ? group : group.patterns);
    return group.indexOf('\n') === -1 ? '{ ' + group + ' }' : '{\n' + indent(group) + '\n}';
  },
  query: function (query) {
    return '{\n' + indent(toQuery(query)) + '\n}';
  },
  filter: function (filter) {
    return 'FILTER(' + toExpression(filter.expression) + ')';
  },
  bind: function (bind) {
    return 'BIND(' + toExpression(bind.expression) + ' AS ' + bind.variable + ')';
  },
  optional: function (optional) {
    return 'OPTIONAL ' + patterns.group(optional);
  },
  union: function (union) {
    return mapJoin(union.patterns, function (p) { return patterns.group(p, true); }, '\nUNION\n');
  },
  minus: function (minus) {
    return 'MINUS ' + patterns.group(minus);
  },
  values: function (valuesList) {
    // Gather unique keys
    var keys = Object.keys(valuesList.values.reduce(function (keyHash, values) {
      for (var key in values) keyHash[key] = true;
      return keyHash;
    }, {}));
    // Create value rows
    return 'VALUES (' + keys.join(' ') + ') {\n' +
      mapJoin(valuesList.values, function (values) {
        return '  (' + mapJoin(keys, function (key) {
          return values[key] !== undefined ? toEntity(values[key]) : 'UNDEF';
        }) + ')';
      }, '\n') + '\n}';
  },
  service: function (service) {
    return 'SERVICE ' + (service.silent ? 'SILENT ' : '') + toEntity(service.name) + ' ' +
           patterns.group(service);
  },
};

// Converts the parsed expression object into a SPARQL expression
function toExpression(expr) {
  if (isString(expr))
    return toEntity(expr);

  switch (expr.type.toLowerCase()) {
    case 'aggregate':
      return expr.aggregation.toUpperCase() +
             '(' + (expr.distinct ? 'DISTINCT ' : '') + toExpression(expr.expression) +
             (expr.separator ? '; SEPARATOR = ' + toEntity('"' + expr.separator + '"') : '') + ')';
    case 'functioncall':
      return toEntity(expr.function) + '(' + mapJoin(expr.args, toExpression, ', ') + ')';
    case 'operation':
      var operator = expr.operator.toUpperCase(), args = expr.args || [], arg = args[0];
      switch (expr.operator.toLowerCase()) {
      // Infix operators
      case '<':
      case '>':
      case '>=':
      case '<=':
      case '&&':
      case '||':
      case '=':
      case '!=':
      case '+':
      case '-':
      case '*':
      case '/':
        return mapJoin(args, function (arg) {
          return isString(arg) ? toEntity(arg) : '(' + toExpression(arg) + ')';
        }, ' ' + operator + ' ');
      // Unary operators
      case '!':
        return '!' + toExpression(arg);
      // IN and NOT IN
      case 'notin':
        operator = 'NOT IN';
      case 'in':
        return toExpression(arg) + ' ' + operator +
               '(' + (isString(arg = args[1]) ? arg : mapJoin(arg, toExpression, ', ')) + ')';
      // EXISTS and NOT EXISTS
      case 'notexists':
        operator = 'NOT EXISTS';
      case 'exists':
        return operator + ' ' + patterns.group(arg, true);
      // Other expressions
      default:
        return operator + '(' + mapJoin(args, toExpression, ', ') + ')';
      }
    default:
      throw new Error('Unknown expression type: ' + expr.type);
  }
}

// Converts the parsed entity (or property path) into a SPARQL entity
function toEntity(value) {
  // regular entity
  if (isString(value)) {
    switch (value[0]) {
    // variable, * selector, or blank node
    case '?':
    case '$':
    case '*':
    case '_':
      return value;
    // literal
    case '"':
      var match = value.match(/^"(.*)"(?:(@.+)|\^\^(.+))?$/) || {},
          lexical = match[1] || '', language = match[2] || '', datatype = match[3];
      value = '"' + lexical.replace(escape, escapeReplacer) + '"' + language;
      if (datatype) {
        if (datatype === XSD_INTEGER && /^\d+$/.test(lexical)) return lexical;
        value += '^^<' + datatype + '>';
      }
      return value;
    // IRI
    default:
      return '<' + value + '>';
    }
  }
  // property path
  else {
    var items = value.items.map(toEntity), path = value.pathType;
    switch (path) {
    // prefix operator
    case '^':
    case '!':
      return path + items[0];
    // postfix operator
    case '*':
    case '+':
    case '?':
      return items[0] + path;
    // infix operator
    default:
      return '(' + items.join(path) + ')';
    }
  }
}
var escape = /["\\\t\n\r\b\f]/g,
    escapeReplacer = function (c) { return escapeReplacements[c]; },
    escapeReplacements = { '\\': '\\\\', '"': '\\"', '\t': '\\t',
                           '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f' };

// Converts the parsed update object into a SPARQL update clause
function toUpdate(update) {
  switch (update.type || update.updateType) {
  case 'load':
    return 'LOAD' + (update.source ? ' ' + toEntity(update.source) : '') +
           (update.destination ? ' INTO GRAPH ' + toEntity(update.destination) : '');
  case 'insert':
    return 'INSERT DATA '  + patterns.group(update.insert, true);
  case 'delete':
    return 'DELETE DATA '  + patterns.group(update.delete, true);
  case 'deletewhere':
    return 'DELETE WHERE ' + patterns.group(update.delete, true);
  case 'insertdelete':
    return (update.graph ? 'WITH ' + toEntity(update.graph) + '\n' : '') +
           (update.delete.length ? 'DELETE ' + patterns.group(update.delete, true) + '\n' : '') +
           (update.insert.length ? 'INSERT ' + patterns.group(update.insert, true) + '\n' : '') +
           'WHERE ' + patterns.group(update.where, true);
  case 'add':
  case 'copy':
  case 'move':
    return update.type.toUpperCase() + (update.source.default ? ' DEFAULT ' : ' ') +
           'TO ' + toEntity(update.destination.name);
  default:
    throw new Error('Unknown update query type: ' + update.type);
  }
}

// Checks whether the object is a string
function isString(object) { return typeof object === 'string'; }

// Maps the array with the given function, and joins the results using the separator
function mapJoin(array, func, sep) { return array.map(func).join(isString(sep) ? sep : ' '); }

// Indents each line of the string
function indent(text) { return text.replace(/^/gm, '  '); }

},{}],50:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[11,14,23,33,42,47,95,105,108,110,111,120,121,126,288,289,290,291,292],$V1=[95,105,108,110,111,120,121,126,288,289,290,291,292],$V2=[1,21],$V3=[1,25],$V4=[6,82],$V5=[37,38,50],$V6=[37,50],$V7=[1,55],$V8=[1,57],$V9=[1,53],$Va=[1,56],$Vb=[27,28,283],$Vc=[12,15,277],$Vd=[107,129,286,293],$Ve=[12,15,107,129,277],$Vf=[1,76],$Vg=[1,80],$Vh=[1,82],$Vi=[107,129,286,287,293],$Vj=[12,15,107,129,277,287],$Vk=[1,89],$Vl=[2,229],$Vm=[1,88],$Vn=[12,15,27,28,79,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$Vo=[6,37,38,50,60,67,70,78,80,82],$Vp=[6,12,15,27,37,38,50,60,67,70,78,80,82,277],$Vq=[6,12,15,27,28,30,31,37,38,40,50,60,67,70,78,79,80,82,89,104,107,120,121,123,128,155,156,158,161,162,163,181,192,203,208,210,211,213,214,222,237,242,259,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,297,298,300,301,302,303,304,305,306,307,308,309],$Vr=[1,104],$Vs=[1,105],$Vt=[6,12,15,27,28,38,40,79,82,107,155,156,158,161,162,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294],$Vu=[27,31],$Vv=[2,284],$Vw=[1,118],$Vx=[1,116],$Vy=[6,192],$Vz=[2,301],$VA=[2,289],$VB=[37,123],$VC=[6,40,67,70,78,80,82],$VD=[2,231],$VE=[1,132],$VF=[1,134],$VG=[1,144],$VH=[1,150],$VI=[1,153],$VJ=[1,149],$VK=[1,151],$VL=[1,147],$VM=[1,148],$VN=[1,154],$VO=[1,155],$VP=[1,158],$VQ=[1,159],$VR=[1,160],$VS=[1,161],$VT=[1,162],$VU=[1,163],$VV=[1,164],$VW=[1,165],$VX=[1,166],$VY=[1,167],$VZ=[1,168],$V_=[1,169],$V$=[6,60,67,70,78,80,82],$V01=[27,28,37,38,50],$V11=[12,15,27,28,79,203,237,239,240,241,243,245,246,248,249,252,254,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,301,309,310,311,312,313,314],$V21=[2,374],$V31=[12,15,40,79,89,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$V41=[6,104,192],$V51=[40,107],$V61=[6,40,70,78,80,82],$V71=[2,313],$V81=[2,305],$V91=[12,15,27,181,277],$Va1=[2,341],$Vb1=[2,337],$Vc1=[12,15,27,28,31,38,40,79,82,107,155,156,158,161,162,163,181,192,203,208,210,211,213,214,242,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294],$Vd1=[12,15,27,28,30,31,38,40,79,82,89,107,155,156,158,161,162,163,181,192,203,208,210,211,213,214,222,237,242,259,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,298,301,302,303,304,305,306,307,308,309],$Ve1=[12,15,27,28,30,31,38,40,79,82,89,107,155,156,158,161,162,163,181,192,203,208,210,211,213,214,222,237,242,259,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,298,301,302,303,304,305,306,307,308,309],$Vf1=[1,227],$Vg1=[1,238],$Vh1=[6,40,78,80,82],$Vi1=[1,249],$Vj1=[1,251],$Vk1=[1,252],$Vl1=[1,253],$Vm1=[1,254],$Vn1=[1,256],$Vo1=[1,257],$Vp1=[2,405],$Vq1=[1,260],$Vr1=[1,261],$Vs1=[1,262],$Vt1=[1,268],$Vu1=[1,263],$Vv1=[1,264],$Vw1=[1,265],$Vx1=[1,266],$Vy1=[1,267],$Vz1=[1,274],$VA1=[1,273],$VB1=[38,40,82,107,155,156,158,161,162],$VC1=[1,282],$VD1=[1,283],$VE1=[40,107,294],$VF1=[12,15,27,28,31,79,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$VG1=[12,15,27,28,31,38,40,79,82,107,155,156,158,161,162,163,192,210,211,213,214,242,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294],$VH1=[12,15,27,28,79,239,240,241,243,245,246,248,249,252,254,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,309,310,311,312,313,314],$VI1=[2,398],$VJ1=[1,301],$VK1=[1,302],$VL1=[1,303],$VM1=[12,15,31,40,79,89,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$VN1=[28,40],$VO1=[2,304],$VP1=[6,40,82],$VQ1=[6,12,15,28,40,70,78,80,82,239,240,241,243,245,246,248,249,252,254,277,309,310,311,312,313,314],$VR1=[6,12,15,27,28,38,40,70,73,75,78,79,80,82,107,155,156,158,161,162,163,210,213,214,239,240,241,243,245,246,248,249,252,254,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294,309,310,311,312,313,314],$VS1=[6,12,15,27,28,30,31,38,40,67,70,73,75,78,79,80,82,107,155,156,158,161,162,163,192,210,213,214,222,237,239,240,241,242,243,245,246,248,249,252,254,259,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,298,301,302,303,304,305,306,307,308,309,310,311,312,313,314],$VT1=[1,326],$VU1=[1,325],$VV1=[1,332],$VW1=[1,331],$VX1=[28,163],$VY1=[6,12,15,27,28,40,67,70,78,80,82,239,240,241,243,245,246,248,249,252,254,277,309,310,311,312,313,314],$VZ1=[6,12,15,27,28,30,31,38,40,60,67,70,73,75,78,79,80,82,107,155,156,158,161,162,163,192,210,213,214,222,237,239,240,241,242,243,245,246,248,249,252,254,259,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,295,298,301,302,303,304,305,306,307,308,309,310,311,312,313,314],$V_1=[12,15,28,181,203,208,277],$V$1=[2,355],$V02=[1,354],$V12=[38,40,82,107,155,156,158,161,162,294],$V22=[2,343],$V32=[12,15,27,28,31,38,40,79,82,107,155,156,158,161,162,163,181,192,210,211,213,214,242,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294],$V42=[30,31,192,242,302,303],$V52=[30,31,192,222,237,242,259,271,272,273,274,275,276,301,302,303,304,305,306,307,308,309],$V62=[30,31,192,222,237,242,259,271,272,273,274,275,276,283,298,301,302,303,304,305,306,307,308,309],$V72=[1,387],$V82=[1,402],$V92=[1,399],$Va2=[1,400],$Vb2=[12,15,27,28,79,203,237,239,240,241,243,245,246,248,249,252,254,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,301,309,310,311,312,313,314],$Vc2=[12,15,27,28,38,40,79,82,107,155,156,158,161,162,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$Vd2=[12,15,27,277],$Ve2=[12,15,27,28,38,40,79,82,107,155,156,158,161,162,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,294],$Vf2=[2,316],$Vg2=[12,15,27,181,192,277],$Vh2=[1,453],$Vi2=[1,454],$Vj2=[12,15,31,79,89,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$Vk2=[6,12,15,27,28,40,73,75,78,80,82,239,240,241,243,245,246,248,249,252,254,277,309,310,311,312,313,314],$Vl2=[2,311],$Vm2=[12,15,28,181,203,277],$Vn2=[38,40,82,107,155,156,158,161,162,192,211,294],$Vo2=[12,15,27,28,40,79,107,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277],$Vp2=[12,15,27,28,31,79,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,297,298],$Vq2=[12,15,27,28,31,79,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,297,298,300,301],$Vr2=[1,545],$Vs2=[1,546],$Vt2=[2,299],$Vu2=[12,15,31,181,208,277];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"QueryOrUpdateUnit":3,"QueryOrUpdateUnit_repetition0":4,"QueryOrUpdateUnit_group0":5,"EOF":6,"Query":7,"Query_group0":8,"Query_option0":9,"BaseDecl":10,"BASE":11,"IRIREF":12,"PrefixDecl":13,"PREFIX":14,"PNAME_NS":15,"SelectQuery":16,"SelectClause":17,"SelectQuery_repetition0":18,"WhereClause":19,"SolutionModifier":20,"SubSelect":21,"SubSelect_option0":22,"SELECT":23,"SelectClause_option0":24,"SelectClause_group0":25,"SelectClauseItem":26,"VAR":27,"(":28,"Expression":29,"AS":30,")":31,"ConstructQuery":32,"CONSTRUCT":33,"ConstructTemplate":34,"ConstructQuery_repetition0":35,"ConstructQuery_repetition1":36,"WHERE":37,"{":38,"ConstructQuery_option0":39,"}":40,"DescribeQuery":41,"DESCRIBE":42,"DescribeQuery_group0":43,"DescribeQuery_repetition0":44,"DescribeQuery_option0":45,"AskQuery":46,"ASK":47,"AskQuery_repetition0":48,"DatasetClause":49,"FROM":50,"DatasetClause_option0":51,"iri":52,"WhereClause_option0":53,"GroupGraphPattern":54,"SolutionModifier_option0":55,"SolutionModifier_option1":56,"SolutionModifier_option2":57,"SolutionModifier_option3":58,"GroupClause":59,"GROUP":60,"BY":61,"GroupClause_repetition_plus0":62,"GroupCondition":63,"BuiltInCall":64,"FunctionCall":65,"HavingClause":66,"HAVING":67,"HavingClause_repetition_plus0":68,"OrderClause":69,"ORDER":70,"OrderClause_repetition_plus0":71,"OrderCondition":72,"ASC":73,"BrackettedExpression":74,"DESC":75,"Constraint":76,"LimitOffsetClauses":77,"LIMIT":78,"INTEGER":79,"OFFSET":80,"ValuesClause":81,"VALUES":82,"InlineData":83,"InlineData_repetition0":84,"InlineData_repetition1":85,"InlineData_repetition2":86,"DataBlockValue":87,"Literal":88,"UNDEF":89,"DataBlockValueList":90,"DataBlockValueList_repetition0":91,"Update":92,"Update_repetition0":93,"Update1":94,"LOAD":95,"Update1_option0":96,"Update1_option1":97,"Update1_group0":98,"Update1_option2":99,"GraphRefAll":100,"Update1_group1":101,"Update1_option3":102,"GraphOrDefault":103,"TO":104,"CREATE":105,"Update1_option4":106,"GRAPH":107,"INSERTDATA":108,"QuadPattern":109,"DELETEDATA":110,"DELETEWHERE":111,"Update1_option5":112,"InsertClause":113,"Update1_option6":114,"Update1_repetition0":115,"Update1_option7":116,"DeleteClause":117,"Update1_option8":118,"Update1_repetition1":119,"DELETE":120,"INSERT":121,"UsingClause":122,"USING":123,"UsingClause_option0":124,"WithClause":125,"WITH":126,"IntoGraphClause":127,"INTO":128,"DEFAULT":129,"GraphOrDefault_option0":130,"GraphRefAll_group0":131,"QuadPattern_option0":132,"QuadPattern_repetition0":133,"QuadsNotTriples":134,"QuadsNotTriples_group0":135,"QuadsNotTriples_option0":136,"QuadsNotTriples_option1":137,"QuadsNotTriples_option2":138,"TriplesTemplate":139,"TriplesTemplate_repetition0":140,"TriplesSameSubject":141,"TriplesTemplate_option0":142,"GroupGraphPatternSub":143,"GroupGraphPatternSub_option0":144,"GroupGraphPatternSub_repetition0":145,"GroupGraphPatternSubTail":146,"GraphPatternNotTriples":147,"GroupGraphPatternSubTail_option0":148,"GroupGraphPatternSubTail_option1":149,"TriplesBlock":150,"TriplesBlock_repetition0":151,"TriplesSameSubjectPath":152,"TriplesBlock_option0":153,"GraphPatternNotTriples_repetition0":154,"OPTIONAL":155,"MINUS":156,"GraphPatternNotTriples_group0":157,"SERVICE":158,"GraphPatternNotTriples_option0":159,"GraphPatternNotTriples_group1":160,"FILTER":161,"BIND":162,"NIL":163,"FunctionCall_option0":164,"FunctionCall_repetition0":165,"ExpressionList":166,"ExpressionList_repetition0":167,"ConstructTemplate_option0":168,"ConstructTriples":169,"ConstructTriples_repetition0":170,"ConstructTriples_option0":171,"VarOrTerm":172,"PropertyListNotEmpty":173,"TriplesNode":174,"PropertyList":175,"PropertyList_option0":176,"PropertyListNotEmpty_repetition0":177,"VerbObjectList":178,"Verb":179,"ObjectList":180,"a":181,"ObjectList_repetition0":182,"GraphNode":183,"PropertyListPathNotEmpty":184,"TriplesNodePath":185,"TriplesSameSubjectPath_option0":186,"PropertyListPathNotEmpty_group0":187,"PropertyListPathNotEmpty_repetition0":188,"GraphNodePath":189,"PropertyListPathNotEmpty_repetition1":190,"PropertyListPathNotEmptyTail":191,";":192,"PropertyListPathNotEmptyTail_group0":193,"Path":194,"Path_repetition0":195,"PathSequence":196,"PathSequence_repetition0":197,"PathEltOrInverse":198,"PathElt":199,"PathPrimary":200,"PathElt_option0":201,"PathEltOrInverse_option0":202,"!":203,"PathNegatedPropertySet":204,"PathOneInPropertySet":205,"PathNegatedPropertySet_repetition0":206,"PathNegatedPropertySet_option0":207,"^":208,"TriplesNode_repetition_plus0":209,"[":210,"]":211,"TriplesNodePath_repetition_plus0":212,"BLANK_NODE_LABEL":213,"ANON":214,"Expression_repetition0":215,"ConditionalAndExpression":216,"ConditionalAndExpression_repetition0":217,"RelationalExpression":218,"AdditiveExpression":219,"RelationalExpression_group0":220,"RelationalExpression_option0":221,"IN":222,"MultiplicativeExpression":223,"AdditiveExpression_repetition0":224,"AdditiveExpressionTail":225,"AdditiveExpressionTail_group0":226,"NumericLiteralPositive":227,"AdditiveExpressionTail_repetition0":228,"NumericLiteralNegative":229,"AdditiveExpressionTail_repetition1":230,"UnaryExpression":231,"MultiplicativeExpression_repetition0":232,"MultiplicativeExpressionTail":233,"MultiplicativeExpressionTail_group0":234,"UnaryExpression_option0":235,"PrimaryExpression":236,"-":237,"Aggregate":238,"FUNC_ARITY0":239,"FUNC_ARITY1":240,"FUNC_ARITY2":241,",":242,"IF":243,"BuiltInCall_group0":244,"BOUND":245,"BNODE":246,"BuiltInCall_option0":247,"EXISTS":248,"COUNT":249,"Aggregate_option0":250,"Aggregate_group0":251,"FUNC_AGGREGATE":252,"Aggregate_option1":253,"GROUP_CONCAT":254,"Aggregate_option2":255,"Aggregate_option3":256,"GroupConcatSeparator":257,"SEPARATOR":258,"=":259,"String":260,"LANGTAG":261,"^^":262,"DECIMAL":263,"DOUBLE":264,"true":265,"false":266,"STRING_LITERAL1":267,"STRING_LITERAL2":268,"STRING_LITERAL_LONG1":269,"STRING_LITERAL_LONG2":270,"INTEGER_POSITIVE":271,"DECIMAL_POSITIVE":272,"DOUBLE_POSITIVE":273,"INTEGER_NEGATIVE":274,"DECIMAL_NEGATIVE":275,"DOUBLE_NEGATIVE":276,"PNAME_LN":277,"QueryOrUpdateUnit_repetition0_group0":278,"SelectClause_option0_group0":279,"DISTINCT":280,"REDUCED":281,"SelectClause_group0_repetition_plus0":282,"*":283,"DescribeQuery_group0_repetition_plus0_group0":284,"DescribeQuery_group0_repetition_plus0":285,"NAMED":286,"SILENT":287,"CLEAR":288,"DROP":289,"ADD":290,"MOVE":291,"COPY":292,"ALL":293,".":294,"UNION":295,"PropertyListNotEmpty_repetition0_repetition_plus0":296,"|":297,"/":298,"PathElt_option0_group0":299,"?":300,"+":301,"||":302,"&&":303,"!=":304,"<":305,">":306,"<=":307,">=":308,"NOT":309,"CONCAT":310,"COALESCE":311,"SUBSTR":312,"REGEX":313,"REPLACE":314,"$accept":0,"$end":1},
terminals_: {2:"error",6:"EOF",11:"BASE",12:"IRIREF",14:"PREFIX",15:"PNAME_NS",23:"SELECT",27:"VAR",28:"(",30:"AS",31:")",33:"CONSTRUCT",37:"WHERE",38:"{",40:"}",42:"DESCRIBE",47:"ASK",50:"FROM",60:"GROUP",61:"BY",67:"HAVING",70:"ORDER",73:"ASC",75:"DESC",78:"LIMIT",79:"INTEGER",80:"OFFSET",82:"VALUES",89:"UNDEF",95:"LOAD",104:"TO",105:"CREATE",107:"GRAPH",108:"INSERTDATA",110:"DELETEDATA",111:"DELETEWHERE",120:"DELETE",121:"INSERT",123:"USING",126:"WITH",128:"INTO",129:"DEFAULT",155:"OPTIONAL",156:"MINUS",158:"SERVICE",161:"FILTER",162:"BIND",163:"NIL",181:"a",192:";",203:"!",208:"^",210:"[",211:"]",213:"BLANK_NODE_LABEL",214:"ANON",222:"IN",237:"-",239:"FUNC_ARITY0",240:"FUNC_ARITY1",241:"FUNC_ARITY2",242:",",243:"IF",245:"BOUND",246:"BNODE",248:"EXISTS",249:"COUNT",252:"FUNC_AGGREGATE",254:"GROUP_CONCAT",258:"SEPARATOR",259:"=",261:"LANGTAG",262:"^^",263:"DECIMAL",264:"DOUBLE",265:"true",266:"false",267:"STRING_LITERAL1",268:"STRING_LITERAL2",269:"STRING_LITERAL_LONG1",270:"STRING_LITERAL_LONG2",271:"INTEGER_POSITIVE",272:"DECIMAL_POSITIVE",273:"DOUBLE_POSITIVE",274:"INTEGER_NEGATIVE",275:"DECIMAL_NEGATIVE",276:"DOUBLE_NEGATIVE",277:"PNAME_LN",280:"DISTINCT",281:"REDUCED",283:"*",286:"NAMED",287:"SILENT",288:"CLEAR",289:"DROP",290:"ADD",291:"MOVE",292:"COPY",293:"ALL",294:".",295:"UNION",297:"|",298:"/",300:"?",301:"+",302:"||",303:"&&",304:"!=",305:"<",306:">",307:"<=",308:">=",309:"NOT",310:"CONCAT",311:"COALESCE",312:"SUBSTR",313:"REGEX",314:"REPLACE"},
productions_: [0,[3,3],[7,2],[10,2],[13,3],[16,4],[21,4],[17,3],[26,1],[26,5],[32,5],[32,7],[41,5],[46,4],[49,3],[19,2],[20,4],[59,3],[63,1],[63,1],[63,3],[63,5],[63,1],[66,2],[69,3],[72,2],[72,2],[72,1],[72,1],[77,2],[77,2],[77,4],[77,4],[81,2],[83,4],[83,6],[87,1],[87,1],[87,1],[90,3],[92,2],[94,4],[94,3],[94,5],[94,4],[94,2],[94,2],[94,2],[94,6],[94,6],[117,2],[113,2],[122,3],[125,2],[127,3],[103,1],[103,2],[100,2],[100,1],[109,4],[134,7],[139,3],[54,3],[54,3],[143,2],[146,3],[150,3],[147,2],[147,2],[147,2],[147,3],[147,4],[147,2],[147,6],[147,1],[76,1],[76,1],[76,1],[65,2],[65,6],[166,1],[166,4],[34,3],[169,3],[141,2],[141,2],[175,1],[173,2],[178,2],[179,1],[179,1],[179,1],[180,2],[152,2],[152,2],[184,4],[191,1],[191,3],[194,2],[196,2],[199,2],[198,2],[200,1],[200,1],[200,2],[200,3],[204,1],[204,1],[204,4],[205,1],[205,1],[205,2],[205,2],[174,3],[174,3],[185,3],[185,3],[183,1],[183,1],[189,1],[189,1],[172,1],[172,1],[172,1],[172,1],[172,1],[172,1],[29,2],[216,2],[218,1],[218,3],[218,4],[219,2],[225,2],[225,2],[225,2],[223,2],[233,2],[231,2],[231,2],[231,2],[236,1],[236,1],[236,1],[236,1],[236,1],[236,1],[74,3],[64,1],[64,2],[64,4],[64,6],[64,8],[64,2],[64,4],[64,2],[64,4],[64,3],[238,5],[238,5],[238,6],[257,4],[88,1],[88,2],[88,3],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[260,1],[260,1],[260,1],[260,1],[227,1],[227,1],[227,1],[229,1],[229,1],[229,1],[52,1],[52,1],[52,1],[278,1],[278,1],[4,0],[4,2],[5,1],[5,1],[8,1],[8,1],[8,1],[8,1],[9,0],[9,1],[18,0],[18,2],[22,0],[22,1],[279,1],[279,1],[24,0],[24,1],[282,1],[282,2],[25,1],[25,1],[35,0],[35,2],[36,0],[36,2],[39,0],[39,1],[284,1],[284,1],[285,1],[285,2],[43,1],[43,1],[44,0],[44,2],[45,0],[45,1],[48,0],[48,2],[51,0],[51,1],[53,0],[53,1],[55,0],[55,1],[56,0],[56,1],[57,0],[57,1],[58,0],[58,1],[62,1],[62,2],[68,1],[68,2],[71,1],[71,2],[84,0],[84,2],[85,0],[85,2],[86,0],[86,2],[91,0],[91,2],[93,0],[93,3],[96,0],[96,1],[97,0],[97,1],[98,1],[98,1],[99,0],[99,1],[101,1],[101,1],[101,1],[102,0],[102,1],[106,0],[106,1],[112,0],[112,1],[114,0],[114,1],[115,0],[115,2],[116,0],[116,1],[118,0],[118,1],[119,0],[119,2],[124,0],[124,1],[130,0],[130,1],[131,1],[131,1],[131,1],[132,0],[132,1],[133,0],[133,2],[135,1],[135,1],[136,0],[136,1],[137,0],[137,1],[138,0],[138,1],[140,0],[140,3],[142,0],[142,1],[144,0],[144,1],[145,0],[145,2],[148,0],[148,1],[149,0],[149,1],[151,0],[151,3],[153,0],[153,1],[154,0],[154,3],[157,1],[157,1],[159,0],[159,1],[160,1],[160,1],[164,0],[164,1],[165,0],[165,3],[167,0],[167,3],[168,0],[168,1],[170,0],[170,3],[171,0],[171,1],[176,0],[176,1],[296,1],[296,2],[177,0],[177,3],[182,0],[182,3],[186,0],[186,1],[187,1],[187,1],[188,0],[188,3],[190,0],[190,2],[193,1],[193,1],[195,0],[195,3],[197,0],[197,3],[299,1],[299,1],[299,1],[201,0],[201,1],[202,0],[202,1],[206,0],[206,3],[207,0],[207,1],[209,1],[209,2],[212,1],[212,2],[215,0],[215,3],[217,0],[217,3],[220,1],[220,1],[220,1],[220,1],[220,1],[220,1],[221,0],[221,1],[224,0],[224,2],[226,1],[226,1],[228,0],[228,2],[230,0],[230,2],[232,0],[232,2],[234,1],[234,1],[235,0],[235,1],[244,1],[244,1],[244,1],[244,1],[244,1],[247,0],[247,1],[250,0],[250,1],[251,1],[251,1],[253,0],[253,1],[255,0],[255,1],[256,0],[256,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

      $$[$0-1].prefixes = Parser.prefixes;
      Parser.prefixes = null;
      base = basePath = baseRoot = '';
      return $$[$0-1];
    
break;
case 2:
this.$ = extend({ type: 'query' }, $$[$0-1], $$[$0]);
break;
case 3:

      base = resolveIRI($$[$0])
      basePath = base.replace(/[^\/]*$/, '');
      baseRoot = base.match(/^(?:[a-z]+:\/*)?[^\/]*/)[0];
    
break;
case 4:

      if (!Parser.prefixes) Parser.prefixes = {};
      $$[$0-1] = $$[$0-1].substr(0, $$[$0-1].length - 1);
      $$[$0] = resolveIRI($$[$0]);
      Parser.prefixes[$$[$0-1]] = $$[$0];
    
break;
case 5:
this.$ = extend($$[$0-3], groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 6:
this.$ = extend({ type: 'query' }, $$[$0-3], $$[$0-2], $$[$0-1], $$[$0]);
break;
case 7:
this.$ = extend({ queryType: 'SELECT', variables: $$[$0] === '*' ? ['*'] : $$[$0] }, $$[$0-1] && ($$[$0-2] = lowercase($$[$0-1]), $$[$0-1] = {}, $$[$0-1][$$[$0-2]] = true, $$[$0-1]));
break;
case 8: case 89: case 121: case 146:
this.$ = toVar($$[$0]);
break;
case 9: case 21:
this.$ = expression($$[$0-3], { variable: toVar($$[$0-1]) });
break;
case 10:
this.$ = extend({ queryType: 'CONSTRUCT', template: $$[$0-3] }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 11:
this.$ = extend({ queryType: 'CONSTRUCT', template: $$[$0-2] = ($$[$0-2] ? $$[$0-2].triples : []) }, groupDatasets($$[$0-5]), { where: [ { type: 'bgp', triples: appendAllTo([], $$[$0-2]) } ] }, $$[$0]);
break;
case 12:
this.$ = extend({ queryType: 'DESCRIBE', variables: $$[$0-3] === '*' ? ['*'] : $$[$0-3].map(toVar) }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 13:
this.$ = extend({ queryType: 'ASK' }, groupDatasets($$[$0-2]), $$[$0-1], $$[$0]);
break;
case 14: case 52:
this.$ = { iri: $$[$0], named: !!$$[$0-1] };
break;
case 15:
this.$ = { where: $$[$0].patterns };
break;
case 16:
this.$ = extend($$[$0-3], $$[$0-2], $$[$0-1], $$[$0]);
break;
case 17:
this.$ = { group: $$[$0] };
break;
case 18: case 19: case 25: case 27:
this.$ = expression($$[$0]);
break;
case 20:
this.$ = expression($$[$0-1]);
break;
case 22: case 28:
this.$ = expression(toVar($$[$0]));
break;
case 23:
this.$ = { having: $$[$0] };
break;
case 24:
this.$ = { order: $$[$0] };
break;
case 26:
this.$ = expression($$[$0], { descending: true });
break;
case 29:
this.$ = { limit:  toInt($$[$0]) };
break;
case 30:
this.$ = { offset: toInt($$[$0]) };
break;
case 31:
this.$ = { limit: toInt($$[$0-2]), offset: toInt($$[$0]) };
break;
case 32:
this.$ = { limit: toInt($$[$0]), offset: toInt($$[$0-2]) };
break;
case 33:
this.$ = { type: 'values', values: $$[$0] };
break;
case 34:

      $$[$0-3] = toVar($$[$0-3]);
      this.$ = $$[$0-1].map(function(v) { var o = {}; o[$$[$0-3]] = v; return o; })
    
break;
case 35:

      var length = $$[$0-4].length;
      $$[$0-4] = $$[$0-4].map(toVar);
      this.$ = $$[$0-1].map(function (values) {
        if (values.length !== length)
          throw Error('Inconsistent VALUES length');
        var valuesObject = {};
        for(var i = 0; i<length; i++)
          valuesObject[$$[$0-4][i]] = values[i];
        return valuesObject;
      });
    
break;
case 38:
this.$ = undefined;
break;
case 39: case 62: case 82: case 105: case 147:
this.$ = $$[$0-1];
break;
case 40:
this.$ = { type: 'update', updates: appendTo($$[$0-1], $$[$0]) };
break;
case 41:
this.$ = extend({ type: 'load', silent: !!$$[$0-2], source: $$[$0-1] }, $$[$0] && { destination: $$[$0] });
break;
case 42:
this.$ = { type: lowercase($$[$0-2]), silent: !!$$[$0-1], graph: $$[$0] };
break;
case 43:
this.$ = { type: lowercase($$[$0-4]), silent: !!$$[$0-3], source: $$[$0-2], destination: $$[$0] };
break;
case 44:
this.$ = { type: 'create', silent: !!$$[$0-2], graph: $$[$0-1] };
break;
case 45:
this.$ = { updateType: 'insert',      insert: $$[$0] };
break;
case 46:
this.$ = { updateType: 'delete',      delete: $$[$0] };
break;
case 47:
this.$ = { updateType: 'deletewhere', delete: $$[$0] };
break;
case 48:
this.$ = extend({ updateType: 'insertdelete' }, $$[$0-5], { insert: $$[$0-4] || [] }, { delete: $$[$0-3] || [] }, groupDatasets($$[$0-2]), { where: $$[$0].patterns });
break;
case 49:
this.$ = extend({ updateType: 'insertdelete' }, $$[$0-5], { delete: $$[$0-4] || [] }, { insert: $$[$0-3] || [] }, groupDatasets($$[$0-2]), { where: $$[$0].patterns });
break;
case 50: case 51: case 54: case 138:
this.$ = $$[$0];
break;
case 53:
this.$ = { graph: $$[$0] };
break;
case 55:
this.$ = { type: 'graph', default: true };
break;
case 56: case 57:
this.$ = { type: 'graph', name: $$[$0] };
break;
case 58:
 this.$ = {}; this.$[lowercase($$[$0])] = true; 
break;
case 59:
this.$ = $$[$0-2] ? unionAll($$[$0-1], [$$[$0-2]]) : unionAll($$[$0-1]);
break;
case 60:

      var graph = extend($$[$0-3] || { triples: [] }, { type: 'graph', name: toVar($$[$0-5]) });
      this.$ = $$[$0] ? [graph, $$[$0]] : [graph];
    
break;
case 61: case 66:
this.$ = { type: 'bgp', triples: unionAll($$[$0-2], [$$[$0-1]]) };
break;
case 63:

      // Simplify the groups by merging adjacent BGPs and moving filters to the back
      if ($$[$0-1].length > 1) {
        var groups = [], currentBgp, filters = [];
        for (var i = 0, group; group=$$[$0-1][i]; i++) {
          switch (group.type) {
            // Add a BGP's triples to the current BGP
            case 'bgp':
              if (group.triples.length) {
                if (!currentBgp)
                  appendTo(groups, currentBgp = group);
                else
                  appendAllTo(currentBgp.triples, group.triples);
              }
              break;
            // Save filters separately
            case 'filter':
              appendTo(filters, group);
              break;
            // All other groups break up a BGP
            default:
              // Only add the group if its pattern is non-empty
              if (!group.patterns || group.patterns.length > 0) {
                appendTo(groups, group);
                currentBgp = null;
              }
          }
        }
        $$[$0-1] = appendAllTo(groups, filters);
      }
      this.$ = { type: 'group', patterns: $$[$0-1] }
    
break;
case 64:
this.$ = $$[$0-1] ? unionAll([$$[$0-1]], $$[$0]) : unionAll($$[$0]);
break;
case 65:
this.$ = $$[$0] ? [$$[$0-2], $$[$0]] : $$[$0-2];
break;
case 67:
this.$ = $$[$0-1].length ? { type: 'union', patterns: unionAll($$[$0-1].map(degroupSingle), [degroupSingle($$[$0])]) } : degroupSingle($$[$0]);
break;
case 68:
this.$ = extend($$[$0], { type: 'optional' });
break;
case 69:
this.$ = extend($$[$0], { type: 'minus' });
break;
case 70:
this.$ = extend($$[$0], { type: 'graph', name: toVar($$[$0-1]) });
break;
case 71:
this.$ = extend($$[$0], { type: 'service', name: toVar($$[$0-1]), silent: !!$$[$0-2] });
break;
case 72:
this.$ = { type: 'filter', expression: $$[$0] };
break;
case 73:
this.$ = { type: 'bind', variable: toVar($$[$0-1]), expression: $$[$0-3] };
break;
case 78:
this.$ = { type: 'functionCall', function: $$[$0-1], args: [] };
break;
case 79:
this.$ = { type: 'functionCall', function: $$[$0-5], args: appendTo($$[$0-2], $$[$0-1]), distinct: !!$$[$0-3] };
break;
case 80: case 96: case 107: case 187: case 197: case 209: case 211: case 221: case 225: case 245: case 247: case 249: case 251: case 253: case 274: case 280: case 291: case 301: case 307: case 313: case 317: case 327: case 329: case 333: case 341: case 343: case 349: case 351: case 355: case 357: case 366: case 374: case 376: case 386: case 390: case 392: case 394:
this.$ = [];
break;
case 81:
this.$ = appendTo($$[$0-2], $$[$0-1]);
break;
case 83:
this.$ = unionAll($$[$0-2], [$$[$0-1]]);
break;
case 84: case 93:
this.$ = $$[$0].map(function (t) { return extend(triple($$[$0-1]), t); });
break;
case 85:
this.$ = appendAllTo($$[$0].map(function (t) { return extend(triple($$[$0-1].entity), t); }), $$[$0-1].triples) /* the subject is a blank node, possibly with more triples */;
break;
case 87:
this.$ = unionAll($$[$0-1], [$$[$0]]);
break;
case 88:
this.$ = objectListToTriples($$[$0-1], $$[$0]);
break;
case 91: case 103: case 110:
this.$ = RDF_TYPE;
break;
case 92:
this.$ = appendTo($$[$0-1], $$[$0]);
break;
case 94:
this.$ = !$$[$0] ? $$[$0-1].triples : appendAllTo($$[$0].map(function (t) { return extend(triple($$[$0-1].entity), t); }), $$[$0-1].triples) /* the subject is a blank node, possibly with more triples */;
break;
case 95:
this.$ = objectListToTriples(toVar($$[$0-3]), appendTo($$[$0-2], $$[$0-1]), $$[$0]);
break;
case 97:
this.$ = objectListToTriples(toVar($$[$0-1]), $$[$0]);
break;
case 98:
this.$ = $$[$0-1].length ? path('|',appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 99:
this.$ = $$[$0-1].length ? path('/', appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 100:
this.$ = $$[$0] ? path($$[$0], [$$[$0-1]]) : $$[$0-1];
break;
case 101:
this.$ = $$[$0-1] ? path($$[$0-1], [$$[$0]]) : $$[$0];;
break;
case 104: case 111:
this.$ = path($$[$0-1], [$$[$0]]);
break;
case 108:
this.$ = path('|', appendTo($$[$0-2], $$[$0-1]));
break;
case 112:
this.$ = path($$[$0-1], [RDF_TYPE]);
break;
case 113: case 115:
this.$ = createList($$[$0-1]);
break;
case 114: case 116:
this.$ = createAnonymousObject($$[$0-1]);
break;
case 117:
this.$ = { entity: $$[$0], triples: [] } /* for consistency with TriplesNode */;
break;
case 119:
this.$ = { entity: $$[$0], triples: [] } /* for consistency with TriplesNodePath */;
break;
case 125:
this.$ = blank();
break;
case 126:
this.$ = RDF_NIL;
break;
case 127:
this.$ = $$[$0-1].length ? operation('||', appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 128:
this.$ = $$[$0-1].length ? operation('&&', appendTo($$[$0-1], $$[$0])) : $$[$0];
break;
case 130:
this.$ = operation($$[$0-1], [$$[$0-2], $$[$0]]);
break;
case 131:
this.$ = operation($$[$0-2] ? 'notin' : 'in', [$$[$0-3], $$[$0]]);
break;
case 132: case 136:
this.$ = createOperationTree($$[$0-1], $$[$0]);
break;
case 133: case 137:
this.$ = [$$[$0-1], $$[$0]];
break;
case 134:
this.$ = ['+', createOperationTree($$[$0-1], $$[$0])];
break;
case 135:
this.$ = ['-', createOperationTree($$[$0-1].replace('-', ''), $$[$0])];
break;
case 139:
this.$ = operation($$[$0-1], [$$[$0]]);
break;
case 140:
this.$ = operation('UMINUS', [$$[$0]]);
break;
case 149:
this.$ = operation(lowercase($$[$0-1]));
break;
case 150:
this.$ = operation(lowercase($$[$0-3]), [$$[$0-1]]);
break;
case 151:
this.$ = operation(lowercase($$[$0-5]), [$$[$0-3], $$[$0-1]]);
break;
case 152:
this.$ = operation(lowercase($$[$0-7]), [$$[$0-5], $$[$0-3], $$[$0-1]]);
break;
case 153:
this.$ = operation(lowercase($$[$0-1]), $$[$0]);
break;
case 154:
this.$ = operation('bound', [toVar($$[$0-1])]);
break;
case 155:
this.$ = operation($$[$0-1], []);
break;
case 156:
this.$ = operation($$[$0-3], [$$[$0-1]]);
break;
case 157:
this.$ = operation($$[$0-2] ? 'notexists' :'exists', [degroupSingle($$[$0])]);
break;
case 158: case 159:
this.$ = expression($$[$0-1], { type: 'aggregate', aggregation: lowercase($$[$0-4]), distinct: !!$$[$0-2] });
break;
case 160:
this.$ = expression($$[$0-2], { type: 'aggregate', aggregation: lowercase($$[$0-5]), distinct: !!$$[$0-3], separator: $$[$0-1] || ' ' });
break;
case 161:
this.$ = $$[$0].substr(1, $$[$0].length - 2);
break;
case 163:
this.$ = $$[$0-1] + lowercase($$[$0]);
break;
case 164:
this.$ = $$[$0-2] + '^^' + $$[$0];
break;
case 165: case 179:
this.$ = createLiteral($$[$0], XSD_INTEGER);
break;
case 166: case 180:
this.$ = createLiteral($$[$0], XSD_DECIMAL);
break;
case 167: case 181:
this.$ = createLiteral(lowercase($$[$0]), XSD_DOUBLE);
break;
case 170:
this.$ = XSD_TRUE;
break;
case 171:
this.$ = XSD_FALSE;
break;
case 172: case 173:
this.$ = unescapeString($$[$0], 1);
break;
case 174: case 175:
this.$ = unescapeString($$[$0], 3);
break;
case 176:
this.$ = createLiteral($$[$0].substr(1), XSD_INTEGER);
break;
case 177:
this.$ = createLiteral($$[$0].substr(1), XSD_DECIMAL);
break;
case 178:
this.$ = createLiteral($$[$0].substr(1).toLowerCase(), XSD_DOUBLE);
break;
case 182:
this.$ = resolveIRI($$[$0]);
break;
case 183:

      var namePos = $$[$0].indexOf(':'),
          prefix = $$[$0].substr(0, namePos),
          expansion = Parser.prefixes[prefix];
      if (!expansion) throw new Error('Unknown prefix: ' + prefix);
      this.$ = resolveIRI(expansion + $$[$0].substr(namePos + 1));
    
break;
case 184:

      $$[$0] = $$[$0].substr(0, $$[$0].length - 1);
      if (!($$[$0] in Parser.prefixes)) throw new Error('Unknown prefix: ' + $$[$0]);
      this.$ = resolveIRI(Parser.prefixes[$$[$0]]);
    
break;
case 188: case 198: case 206: case 210: case 212: case 218: case 222: case 226: case 240: case 242: case 244: case 246: case 248: case 250: case 252: case 275: case 281: case 292: case 308: case 340: case 352: case 371: case 373: case 387: case 391: case 393: case 395:
$$[$0-1].push($$[$0]);
break;
case 205: case 217: case 239: case 241: case 243: case 339: case 370: case 372:
this.$ = [$$[$0]];
break;
case 254: case 302: case 314: case 318: case 328: case 330: case 334: case 342: case 344: case 350: case 356: case 358: case 367: case 375: case 377:
$$[$0-2].push($$[$0-1]);
break;
}
},
table: [o($V0,[2,187],{3:1,4:2}),{1:[3]},o($V1,[2,253],{5:3,278:4,7:5,92:6,10:7,13:8,8:9,93:10,16:13,32:14,41:15,46:16,17:17,11:[1,11],14:[1,12],23:$V2,33:[1,18],42:[1,19],47:[1,20]}),{6:[1,22]},o($V0,[2,188]),{6:[2,189]},{6:[2,190]},o($V0,[2,185]),o($V0,[2,186]),{6:[2,195],9:23,81:24,82:$V3},{94:26,95:[1,27],98:28,101:29,105:[1,30],108:[1,31],110:[1,32],111:[1,33],112:34,116:35,120:[2,276],121:[2,270],125:41,126:[1,42],288:[1,36],289:[1,37],290:[1,38],291:[1,39],292:[1,40]},{12:[1,43]},{15:[1,44]},o($V4,[2,191]),o($V4,[2,192]),o($V4,[2,193]),o($V4,[2,194]),o($V5,[2,197],{18:45}),o($V6,[2,211],{34:46,36:47,38:[1,48]}),{12:$V7,15:$V8,27:$V9,43:49,52:54,277:$Va,283:[1,51],284:52,285:50},o($V5,[2,225],{48:58}),o($Vb,[2,203],{24:59,279:60,280:[1,61],281:[1,62]}),{1:[2,1]},{6:[2,2]},{6:[2,196]},{27:[1,64],28:[1,65],83:63},{6:[2,40],192:[1,66]},o($Vc,[2,255],{96:67,287:[1,68]}),o($Vd,[2,261],{99:69,287:[1,70]}),o($Ve,[2,266],{102:71,287:[1,72]}),{106:73,107:[2,268],287:[1,74]},{38:$Vf,109:75},{38:$Vf,109:77},{38:$Vf,109:78},{113:79,121:$Vg},{117:81,120:$Vh},o($Vi,[2,259]),o($Vi,[2,260]),o($Vj,[2,263]),o($Vj,[2,264]),o($Vj,[2,265]),{120:[2,277],121:[2,271]},{12:$V7,15:$V8,52:83,277:$Va},o($V0,[2,3]),{12:[1,84]},{19:85,37:$Vk,38:$Vl,49:86,50:$Vm,53:87},o($V5,[2,209],{35:90}),{37:[1,91],49:92,50:$Vm},o($Vn,[2,333],{168:93,169:94,170:95,40:[2,331]}),o($Vo,[2,221],{44:96}),o($Vo,[2,219],{52:54,284:97,12:$V7,15:$V8,27:$V9,277:$Va}),o($Vo,[2,220]),o($Vp,[2,217]),o($Vp,[2,215]),o($Vp,[2,216]),o($Vq,[2,182]),o($Vq,[2,183]),o($Vq,[2,184]),{19:98,37:$Vk,38:$Vl,49:99,50:$Vm,53:87},{25:100,26:103,27:$Vr,28:$Vs,282:101,283:[1,102]},o($Vb,[2,204]),o($Vb,[2,201]),o($Vb,[2,202]),o($Vt,[2,33]),{38:[1,106]},o($Vu,[2,247],{85:107}),o($V1,[2,254]),{12:$V7,15:$V8,52:108,277:$Va},o($Vc,[2,256]),{100:109,107:[1,110],129:[1,112],131:111,286:[1,113],293:[1,114]},o($Vd,[2,262]),o($Vc,$Vv,{103:115,130:117,107:$Vw,129:$Vx}),o($Ve,[2,267]),{107:[1,119]},{107:[2,269]},o($Vy,[2,45]),o($Vn,$Vz,{132:120,139:121,140:122,40:$VA,107:$VA}),o($Vy,[2,46]),o($Vy,[2,47]),o($VB,[2,272],{114:123,117:124,120:$Vh}),{38:$Vf,109:125},o($VB,[2,278],{118:126,113:127,121:$Vg}),{38:$Vf,109:128},o([120,121],[2,53]),o($V0,[2,4]),o($VC,$VD,{20:129,55:130,59:131,60:$VE}),o($V5,[2,198]),{38:$VF,54:133},o($Vc,[2,227],{51:135,286:[1,136]}),{38:[2,230]},{19:137,37:$Vk,38:$Vl,49:138,50:$Vm,53:87},{38:[1,139]},o($V6,[2,212]),{40:[1,140]},{40:[2,332]},{12:$V7,15:$V8,27:$VG,28:$VH,52:145,79:$VI,88:146,141:141,163:$VJ,172:142,174:143,210:$VK,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($V$,[2,223],{53:87,45:170,49:171,19:172,37:$Vk,38:$Vl,50:$Vm}),o($Vp,[2,218]),o($VC,$VD,{55:130,59:131,20:173,60:$VE}),o($V5,[2,226]),o($V5,[2,7]),o($V5,[2,207],{26:174,27:$Vr,28:$Vs}),o($V5,[2,208]),o($V01,[2,205]),o($V01,[2,8]),o($V11,$V21,{29:175,215:176}),o($V31,[2,245],{84:177}),{27:[1,179],31:[1,178]},o($Vy,[2,257],{97:180,127:181,128:[1,182]}),o($Vy,[2,42]),{12:$V7,15:$V8,52:183,277:$Va},o($Vy,[2,58]),o($Vy,[2,286]),o($Vy,[2,287]),o($Vy,[2,288]),{104:[1,184]},o($V41,[2,55]),{12:$V7,15:$V8,52:185,277:$Va},o($Vc,[2,285]),{12:$V7,15:$V8,52:186,277:$Va},o($V51,[2,291],{133:187}),o($V51,[2,290]),{12:$V7,15:$V8,27:$VG,28:$VH,52:145,79:$VI,88:146,141:188,163:$VJ,172:142,174:143,210:$VK,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($VB,[2,274],{115:189}),o($VB,[2,273]),o([37,120,123],[2,51]),o($VB,[2,280],{119:190}),o($VB,[2,279]),o([37,121,123],[2,50]),o($V4,[2,5]),o($V61,[2,233],{56:191,66:192,67:[1,193]}),o($VC,[2,232]),{61:[1,194]},o([6,40,60,67,70,78,80,82],[2,15]),o($Vn,$V71,{21:195,143:196,17:197,144:198,150:199,151:200,23:$V2,38:$V81,40:$V81,82:$V81,107:$V81,155:$V81,156:$V81,158:$V81,161:$V81,162:$V81}),{12:$V7,15:$V8,52:201,277:$Va},o($Vc,[2,228]),o($VC,$VD,{55:130,59:131,20:202,60:$VE}),o($V5,[2,210]),o($Vn,$Vz,{140:122,39:203,139:204,40:[2,213]}),o($V5,[2,82]),{40:[2,335],171:205,294:[1,206]},o($V91,$Va1,{173:207,177:208}),o($V91,$Va1,{177:208,175:209,176:210,173:211,40:$Vb1,107:$Vb1,294:$Vb1}),o($Vc1,[2,121]),o($Vc1,[2,122]),o($Vc1,[2,123]),o($Vc1,[2,124]),o($Vc1,[2,125]),o($Vc1,[2,126]),{12:$V7,15:$V8,27:$VG,28:$VH,52:145,79:$VI,88:146,163:$VJ,172:214,174:215,183:213,209:212,210:$VK,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($V91,$Va1,{177:208,173:216}),o($Vd1,[2,162],{261:[1,217],262:[1,218]}),o($Vd1,[2,165]),o($Vd1,[2,166]),o($Vd1,[2,167]),o($Vd1,[2,168]),o($Vd1,[2,169]),o($Vd1,[2,170]),o($Vd1,[2,171]),o($Ve1,[2,172]),o($Ve1,[2,173]),o($Ve1,[2,174]),o($Ve1,[2,175]),o($Vd1,[2,176]),o($Vd1,[2,177]),o($Vd1,[2,178]),o($Vd1,[2,179]),o($Vd1,[2,180]),o($Vd1,[2,181]),o($VC,$VD,{55:130,59:131,20:219,60:$VE}),o($Vo,[2,222]),o($V$,[2,224]),o($V4,[2,13]),o($V01,[2,206]),{30:[1,220]},o($V11,[2,376],{216:221,217:222}),{12:$V7,15:$V8,40:[1,223],52:225,79:$VI,87:224,88:226,89:$Vf1,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},{38:[1,228]},o($Vu,[2,248]),o($Vy,[2,41]),o($Vy,[2,258]),{107:[1,229]},o($Vy,[2,57]),o($Vc,$Vv,{130:117,103:230,107:$Vw,129:$Vx}),o($V41,[2,56]),o($Vy,[2,44]),{40:[1,231],107:[1,233],134:232},o($V51,[2,303],{142:234,294:[1,235]}),{37:[1,236],122:237,123:$Vg1},{37:[1,239],122:240,123:$Vg1},o($Vh1,[2,235],{57:241,69:242,70:[1,243]}),o($V61,[2,234]),{12:$V7,15:$V8,28:$Vi1,52:259,64:247,65:248,68:244,74:246,76:245,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},{12:$V7,15:$V8,27:$Vz1,28:$VA1,52:259,62:269,63:270,64:271,65:272,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},{40:[1,275]},{40:[1,276]},{19:277,37:$Vk,38:$Vl,53:87},o($VB1,[2,307],{145:278}),o($VB1,[2,306]),{12:$V7,15:$V8,27:$VG,28:$VC1,52:145,79:$VI,88:146,152:279,163:$VJ,172:280,185:281,210:$VD1,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($Vo,[2,14]),o($V4,[2,10]),{40:[1,284]},{40:[2,214]},{40:[2,83]},o($Vn,[2,334],{40:[2,336]}),o($VE1,[2,84]),{12:$V7,15:$V8,27:[1,287],52:288,178:285,179:286,181:[1,289],277:$Va},o($VE1,[2,85]),o($VE1,[2,86]),o($VE1,[2,338]),{12:$V7,15:$V8,27:$VG,28:$VH,31:[1,290],52:145,79:$VI,88:146,163:$VJ,172:214,174:215,183:291,210:$VK,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($VF1,[2,370]),o($VG1,[2,117]),o($VG1,[2,118]),{211:[1,292]},o($Vd1,[2,163]),{12:$V7,15:$V8,52:293,277:$Va},o($V4,[2,12]),{27:[1,294]},o([30,31,192,242],[2,127],{302:[1,295]}),o($VH1,$VI1,{218:296,219:297,223:298,231:299,235:300,203:$VJ1,237:$VK1,301:$VL1}),o($Vt,[2,34]),o($V31,[2,246]),o($VM1,[2,36]),o($VM1,[2,37]),o($VM1,[2,38]),o($VN1,[2,249],{86:304}),{12:$V7,15:$V8,52:305,277:$Va},o($Vy,[2,43]),o([6,37,120,121,123,192],[2,59]),o($V51,[2,292]),{12:$V7,15:$V8,27:[1,307],52:308,135:306,277:$Va},o($V51,[2,61]),o($Vn,[2,302],{40:$VO1,107:$VO1}),{38:$VF,54:309},o($VB,[2,275]),o($Vc,[2,282],{124:310,286:[1,311]}),{38:$VF,54:312},o($VB,[2,281]),o($VP1,[2,237],{58:313,77:314,78:[1,315],80:[1,316]}),o($Vh1,[2,236]),{61:[1,317]},o($V61,[2,23],{74:246,64:247,65:248,238:250,244:255,247:258,52:259,76:318,12:$V7,15:$V8,28:$Vi1,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,245:$Vn1,246:$Vo1,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1}),o($VQ1,[2,241]),o($VR1,[2,75]),o($VR1,[2,76]),o($VR1,[2,77]),o($V11,$V21,{215:176,29:319}),o($VS1,[2,148]),{163:[1,320]},{28:[1,321]},{28:[1,322]},{28:[1,323]},{28:$VT1,163:$VU1,166:324},{28:[1,327]},{28:[1,329],163:[1,328]},{248:[1,330]},{28:$VV1,163:$VW1},{28:[1,333]},{28:[1,334]},{28:[1,335]},o($VX1,[2,400]),o($VX1,[2,401]),o($VX1,[2,402]),o($VX1,[2,403]),o($VX1,[2,404]),{248:[2,406]},o($VC,[2,17],{238:250,244:255,247:258,52:259,64:271,65:272,63:336,12:$V7,15:$V8,27:$Vz1,28:$VA1,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,245:$Vn1,246:$Vo1,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1}),o($VY1,[2,239]),o($VY1,[2,18]),o($VY1,[2,19]),o($V11,$V21,{215:176,29:337}),o($VY1,[2,22]),o($VZ1,[2,62]),o($VZ1,[2,63]),o($VC,$VD,{55:130,59:131,20:338,60:$VE}),{38:[2,317],40:[2,64],81:348,82:$V3,107:[1,344],146:339,147:340,154:341,155:[1,342],156:[1,343],158:[1,345],161:[1,346],162:[1,347]},o($VB1,[2,315],{153:349,294:[1,350]}),o($V_1,$V$1,{184:351,187:352,194:353,195:355,27:$V02}),o($V12,[2,345],{187:352,194:353,195:355,186:356,184:357,12:$V$1,15:$V$1,28:$V$1,181:$V$1,203:$V$1,208:$V$1,277:$V$1,27:$V02}),{12:$V7,15:$V8,27:$VG,28:$VC1,52:145,79:$VI,88:146,163:$VJ,172:360,185:361,189:359,210:$VD1,212:358,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($V_1,$V$1,{187:352,194:353,195:355,184:362,27:$V02}),o($VC,$VD,{55:130,59:131,20:363,60:$VE}),o([40,107,211,294],[2,87],{296:364,192:[1,365]}),o($Vn,$V22,{180:366,182:367}),o($Vn,[2,89]),o($Vn,[2,90]),o($Vn,[2,91]),o($V32,[2,113]),o($VF1,[2,371]),o($V32,[2,114]),o($Vd1,[2,164]),{31:[1,368]},o($V11,[2,375]),o([30,31,192,242,302],[2,128],{303:[1,369]}),o($V42,[2,129],{220:370,221:371,222:[2,384],259:[1,372],304:[1,373],305:[1,374],306:[1,375],307:[1,376],308:[1,377],309:[1,378]}),o($V52,[2,386],{224:379}),o($V62,[2,394],{232:380}),{12:$V7,15:$V8,27:$V72,28:$Vi1,52:384,64:383,65:385,74:382,79:$VI,88:386,227:156,229:157,236:381,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},{12:$V7,15:$V8,27:$V72,28:$Vi1,52:384,64:383,65:385,74:382,79:$VI,88:386,227:156,229:157,236:388,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},{12:$V7,15:$V8,27:$V72,28:$Vi1,52:384,64:383,65:385,74:382,79:$VI,88:386,227:156,229:157,236:389,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},o($VH1,[2,399]),{28:[1,392],40:[1,390],90:391},o($Vy,[2,54]),{38:[1,393]},{38:[2,293]},{38:[2,294]},o($Vy,[2,48]),{12:$V7,15:$V8,52:394,277:$Va},o($Vc,[2,283]),o($Vy,[2,49]),o($VP1,[2,16]),o($VP1,[2,238]),{79:[1,395]},{79:[1,396]},{12:$V7,15:$V8,27:$V82,28:$Vi1,52:259,64:247,65:248,71:397,72:398,73:$V92,74:246,75:$Va2,76:401,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},o($VQ1,[2,242]),{31:[1,403]},o($VS1,[2,149]),o($V11,$V21,{215:176,29:404}),o($V11,$V21,{215:176,29:405}),o($V11,$V21,{215:176,29:406}),o($VS1,[2,153]),o($VS1,[2,80]),o($V11,[2,329],{167:407}),{27:[1,408]},o($VS1,[2,155]),o($V11,$V21,{215:176,29:409}),{38:$VF,54:410},o($VS1,[2,78]),o($V11,[2,325],{164:411,280:[1,412]}),o($Vb2,[2,407],{250:413,280:[1,414]}),o($V11,[2,411],{253:415,280:[1,416]}),o($V11,[2,413],{255:417,280:[1,418]}),o($VY1,[2,240]),{30:[1,420],31:[1,419]},{22:421,40:[2,199],81:422,82:$V3},o($VB1,[2,308]),o($Vc2,[2,309],{148:423,294:[1,424]}),{38:$VF,54:425},{38:$VF,54:426},{38:$VF,54:427},{12:$V7,15:$V8,27:[1,429],52:430,157:428,277:$Va},o($Vd2,[2,321],{159:431,287:[1,432]}),{12:$V7,15:$V8,28:$Vi1,52:259,64:247,65:248,74:246,76:433,238:250,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,244:255,245:$Vn1,246:$Vo1,247:258,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1},{28:[1,434]},o($Ve2,[2,74]),o($VB1,[2,66]),o($Vn,[2,314],{38:$Vf2,40:$Vf2,82:$Vf2,107:$Vf2,155:$Vf2,156:$Vf2,158:$Vf2,161:$Vf2,162:$Vf2}),o($V12,[2,93]),o($Vn,[2,349],{188:435}),o($Vn,[2,347]),o($Vn,[2,348]),o($V_1,[2,357],{196:436,197:437}),o($V12,[2,94]),o($V12,[2,346]),{12:$V7,15:$V8,27:$VG,28:$VC1,31:[1,438],52:145,79:$VI,88:146,163:$VJ,172:360,185:361,189:439,210:$VD1,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($VF1,[2,372]),o($VG1,[2,119]),o($VG1,[2,120]),{211:[1,440]},o($V4,[2,11]),o($V91,[2,342],{192:[1,441]}),o($Vg2,[2,339]),o([40,107,192,211,294],[2,88]),{12:$V7,15:$V8,27:$VG,28:$VH,52:145,79:$VI,88:146,163:$VJ,172:214,174:215,183:442,210:$VK,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($V01,[2,9]),o($V11,[2,377]),o($VH1,$VI1,{223:298,231:299,235:300,219:443,203:$VJ1,237:$VK1,301:$VL1}),{222:[1,444]},o($V11,[2,378]),o($V11,[2,379]),o($V11,[2,380]),o($V11,[2,381]),o($V11,[2,382]),o($V11,[2,383]),{222:[2,385]},o([30,31,192,222,242,259,302,303,304,305,306,307,308,309],[2,132],{225:445,226:446,227:447,229:448,237:[1,450],271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,301:[1,449]}),o($V52,[2,136],{233:451,234:452,283:$Vh2,298:$Vi2}),o($V62,[2,138]),o($V62,[2,141]),o($V62,[2,142]),o($V62,[2,143],{28:$VV1,163:$VW1}),o($V62,[2,144]),o($V62,[2,145]),o($V62,[2,146]),o($V62,[2,139]),o($V62,[2,140]),o($Vt,[2,35]),o($VN1,[2,250]),o($Vj2,[2,251],{91:455}),o($Vn,$Vz,{140:122,136:456,139:457,40:[2,295]}),o($VB,[2,52]),o($VP1,[2,29],{80:[1,458]}),o($VP1,[2,30],{78:[1,459]}),o($Vh1,[2,24],{74:246,64:247,65:248,238:250,244:255,247:258,52:259,76:401,72:460,12:$V7,15:$V8,27:$V82,28:$Vi1,73:$V92,75:$Va2,239:$Vj1,240:$Vk1,241:$Vl1,243:$Vm1,245:$Vn1,246:$Vo1,248:$Vp1,249:$Vq1,252:$Vr1,254:$Vs1,277:$Va,309:$Vt1,310:$Vu1,311:$Vv1,312:$Vw1,313:$Vx1,314:$Vy1}),o($Vk2,[2,243]),{28:$Vi1,74:461},{28:$Vi1,74:462},o($Vk2,[2,27]),o($Vk2,[2,28]),o([6,12,15,27,28,30,31,38,40,70,73,75,78,79,80,82,107,155,156,158,161,162,163,192,210,213,214,222,237,239,240,241,242,243,245,246,248,249,252,254,259,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,283,294,298,301,302,303,304,305,306,307,308,309,310,311,312,313,314],[2,147]),{31:[1,463]},{242:[1,464]},{242:[1,465]},o($V11,$V21,{215:176,29:466}),{31:[1,467]},{31:[1,468]},o($VS1,[2,157]),o($V11,[2,327],{165:469}),o($V11,[2,326]),o($V11,$V21,{215:176,251:470,29:472,283:[1,471]}),o($Vb2,[2,408]),o($V11,$V21,{215:176,29:473}),o($V11,[2,412]),o($V11,$V21,{215:176,29:474}),o($V11,[2,414]),o($VY1,[2,20]),{27:[1,475]},{40:[2,6]},{40:[2,200]},o($Vn,$V71,{151:200,149:476,150:477,38:$Vl2,40:$Vl2,82:$Vl2,107:$Vl2,155:$Vl2,156:$Vl2,158:$Vl2,161:$Vl2,162:$Vl2}),o($Vc2,[2,310]),o($Ve2,[2,67],{295:[1,478]}),o($Ve2,[2,68]),o($Ve2,[2,69]),{38:$VF,54:479},{38:[2,319]},{38:[2,320]},{12:$V7,15:$V8,27:[1,481],52:482,160:480,277:$Va},o($Vd2,[2,322]),o($Ve2,[2,72]),o($V11,$V21,{215:176,29:483}),{12:$V7,15:$V8,27:$VG,28:$VC1,52:145,79:$VI,88:146,163:$VJ,172:360,185:361,189:484,210:$VD1,213:$VL,214:$VM,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},o($VF1,[2,98],{297:[1,485]}),o($Vm2,[2,364],{198:486,202:487,208:[1,488]}),o($Vc1,[2,115]),o($VF1,[2,373]),o($Vc1,[2,116]),o($Vg2,[2,340]),o($Vn2,[2,92],{242:[1,489]}),o($V42,[2,130]),{28:$VT1,163:$VU1,166:490},o($V52,[2,387]),o($VH1,$VI1,{231:299,235:300,223:491,203:$VJ1,237:$VK1,301:$VL1}),o($V62,[2,390],{228:492}),o($V62,[2,392],{230:493}),o($V11,[2,388]),o($V11,[2,389]),o($V62,[2,395]),o($VH1,$VI1,{235:300,231:494,203:$VJ1,237:$VK1,301:$VL1}),o($V11,[2,396]),o($V11,[2,397]),{12:$V7,15:$V8,31:[1,495],52:225,79:$VI,87:496,88:226,89:$Vf1,227:156,229:157,260:152,263:$VN,264:$VO,265:$VP,266:$VQ,267:$VR,268:$VS,269:$VT,270:$VU,271:$VV,272:$VW,273:$VX,274:$VY,275:$VZ,276:$V_,277:$Va},{40:[1,497]},{40:[2,296]},{79:[1,498]},{79:[1,499]},o($Vk2,[2,244]),o($Vk2,[2,25]),o($Vk2,[2,26]),o($VS1,[2,150]),o($V11,$V21,{215:176,29:500}),o($V11,$V21,{215:176,29:501}),{31:[1,502],242:[1,503]},o($VS1,[2,154]),o($VS1,[2,156]),o($V11,$V21,{215:176,29:504}),{31:[1,505]},{31:[2,409]},{31:[2,410]},{31:[1,506]},{31:[2,415],192:[1,509],256:507,257:508},{31:[1,510]},o($VB1,[2,65]),o($VB1,[2,312]),{38:[2,318]},o($Ve2,[2,70]),{38:$VF,54:511},{38:[2,323]},{38:[2,324]},{30:[1,512]},o($Vn2,[2,351],{190:513,242:[1,514]}),o($V_1,[2,356]),o([12,15,27,28,31,79,163,210,213,214,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,297],[2,99],{298:[1,515]}),{12:$V7,15:$V8,28:[1,521],52:518,181:[1,519],199:516,200:517,203:[1,520],277:$Va},o($Vm2,[2,365]),o($Vn,[2,344]),o($V42,[2,131]),o($V52,[2,133]),o($V52,[2,134],{234:452,233:522,283:$Vh2,298:$Vi2}),o($V52,[2,135],{234:452,233:523,283:$Vh2,298:$Vi2}),o($V62,[2,137]),o($VN1,[2,39]),o($Vj2,[2,252]),o($Vo2,[2,297],{137:524,294:[1,525]}),o($VP1,[2,31]),o($VP1,[2,32]),{31:[1,526]},{242:[1,527]},o($VS1,[2,81]),o($V11,[2,330]),{31:[1,528],242:[1,529]},o($VS1,[2,158]),o($VS1,[2,159]),{31:[1,530]},{31:[2,416]},{258:[1,531]},o($VY1,[2,21]),o($Ve2,[2,71]),{27:[1,532]},o([38,40,82,107,155,156,158,161,162,211,294],[2,95],{191:533,192:[1,534]}),o($Vn,[2,350]),o($V_1,[2,358]),o($Vp2,[2,101]),o($Vp2,[2,362],{201:535,299:536,283:[1,538],300:[1,537],301:[1,539]}),o($Vq2,[2,102]),o($Vq2,[2,103]),{12:$V7,15:$V8,28:[1,543],52:544,163:[1,542],181:$Vr2,204:540,205:541,208:$Vs2,277:$Va},o($V_1,$V$1,{195:355,194:547}),o($V62,[2,391]),o($V62,[2,393]),o($Vn,$Vz,{140:122,138:548,139:549,40:$Vt2,107:$Vt2}),o($Vo2,[2,298]),o($VS1,[2,151]),o($V11,$V21,{215:176,29:550}),o($VS1,[2,79]),o($V11,[2,328]),o($VS1,[2,160]),{259:[1,551]},{31:[1,552]},o($Vn2,[2,352]),o($Vn2,[2,96],{195:355,193:553,194:554,12:$V$1,15:$V$1,28:$V$1,181:$V$1,203:$V$1,208:$V$1,277:$V$1,27:[1,555]}),o($Vp2,[2,100]),o($Vp2,[2,363]),o($Vp2,[2,359]),o($Vp2,[2,360]),o($Vp2,[2,361]),o($Vq2,[2,104]),o($Vq2,[2,106]),o($Vq2,[2,107]),o($Vu2,[2,366],{206:556}),o($Vq2,[2,109]),o($Vq2,[2,110]),{12:$V7,15:$V8,52:557,181:[1,558],277:$Va},{31:[1,559]},o($V51,[2,60]),o($V51,[2,300]),{31:[1,560]},{260:561,267:$VR,268:$VS,269:$VT,270:$VU},o($Ve2,[2,73]),o($Vn,$V22,{182:367,180:562}),o($Vn,[2,353]),o($Vn,[2,354]),{12:$V7,15:$V8,31:[2,368],52:544,181:$Vr2,205:564,207:563,208:$Vs2,277:$Va},o($Vq2,[2,111]),o($Vq2,[2,112]),o($Vq2,[2,105]),o($VS1,[2,152]),{31:[2,161]},o($Vn2,[2,97]),{31:[1,565]},{31:[2,369],297:[1,566]},o($Vq2,[2,108]),o($Vu2,[2,367])],
defaultActions: {5:[2,189],6:[2,190],22:[2,1],23:[2,2],24:[2,196],74:[2,269],89:[2,230],94:[2,332],204:[2,214],205:[2,83],268:[2,406],307:[2,293],308:[2,294],378:[2,385],421:[2,6],422:[2,200],429:[2,319],430:[2,320],457:[2,296],471:[2,409],472:[2,410],478:[2,318],481:[2,323],482:[2,324],508:[2,416],561:[2,161]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

  /*
    SPARQL parser in the Jison parser generator format.
  */

  // Common namespaces and entities
  var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      RDF_TYPE  = RDF + 'type',
      RDF_FIRST = RDF + 'first',
      RDF_REST  = RDF + 'rest',
      RDF_NIL   = RDF + 'nil',
      XSD = 'http://www.w3.org/2001/XMLSchema#',
      XSD_INTEGER  = XSD + 'integer',
      XSD_DECIMAL  = XSD + 'decimal',
      XSD_DOUBLE   = XSD + 'double',
      XSD_BOOLEAN  = XSD + 'boolean',
      XSD_TRUE =  '"true"^^'  + XSD_BOOLEAN,
      XSD_FALSE = '"false"^^' + XSD_BOOLEAN;

  var base = '', basePath = '', baseRoot = '';

  // Returns a lowercase version of the given string
  function lowercase(string) {
    return string.toLowerCase();
  }

  // Appends the item to the array and returns the array
  function appendTo(array, item) {
    return array.push(item), array;
  }

  // Appends the items to the array and returns the array
  function appendAllTo(array, items) {
    return array.push.apply(array, items), array;
  }

  // Extends a base object with properties of other objects
  function extend(base) {
    if (!base) base = {};
    for (var i = 1, l = arguments.length, arg; i < l && (arg = arguments[i] || {}); i++)
      for (var name in arg)
        base[name] = arg[name];
    return base;
  }

  // Creates an array that contains all items of the given arrays
  function unionAll() {
    var union = [];
    for (var i = 0, l = arguments.length; i < l; i++)
      union = union.concat.apply(union, arguments[i]);
    return union;
  }

  // Resolves an IRI against a base path
  function resolveIRI(iri) {
    // Strip off possible angular brackets
    if (iri[0] === '<')
      iri = iri.substring(1, iri.length - 1);
    switch (iri[0]) {
    // An empty relative IRI indicates the base IRI
    case undefined:
      return base;
    // Resolve relative fragment IRIs against the base IRI
    case '#':
      return base + iri;
    // Resolve relative query string IRIs by replacing the query string
    case '?':
      return base.replace(/(?:\?.*)?$/, iri);
    // Resolve root relative IRIs at the root of the base IRI
    case '/':
      return baseRoot + iri;
    // Resolve all other IRIs at the base IRI's path
    default:
      return /^[a-z]+:/.test(iri) ? iri : basePath + iri;
    }
  }

  // If the item is a variable, ensures it starts with a question mark
  function toVar(variable) {
    if (variable) {
      var first = variable[0];
      if (first === '?') return variable;
      if (first === '$') return '?' + variable.substr(1);
    }
    return variable;
  }

  // Creates an operation with the given name and arguments
  function operation(operatorName, args) {
    return { type: 'operation', operator: operatorName, args: args || [] };
  }

  // Creates an expression with the given type and attributes
  function expression(expr, attr) {
    var expression = { expression: expr };
    if (attr)
      for (var a in attr)
        expression[a] = attr[a];
    return expression;
  }

  // Creates a path with the given type and items
  function path(type, items) {
    return { type: 'path', pathType: type, items: items };
  }

  // Transforms a list of operations types and arguments into a tree of operations
  function createOperationTree(initialExpression, operationList) {
    for (var i = 0, l = operationList.length, item; i < l && (item = operationList[i]); i++)
      initialExpression = operation(item[0], [initialExpression, item[1]]);
    return initialExpression;
  }

  // Group datasets by default and named
  function groupDatasets(fromClauses) {
    var defaults = [], named = [], l = fromClauses.length, fromClause;
    for (var i = 0; i < l && (fromClause = fromClauses[i]); i++)
      (fromClause.named ? named : defaults).push(fromClause.iri);
    return l ? { from: { default: defaults, named: named } } : null;
  }

  // Converts the number to a string
  function toInt(string) {
    return parseInt(string, 10);
  }

  // Transforms a possibly single group into its patterns
  function degroupSingle(group) {
    return group.type === 'group' && group.patterns.length === 1 ? group.patterns[0] : group;
  }

  // Creates a literal with the given value and type
  function createLiteral(value, type) {
    return '"' + value + '"^^' + type;
  }

  // Creates a triple with the given subject, predicate, and object
  function triple(subject, predicate, object) {
    var triple = {};
    if (subject   != null) triple.subject   = subject;
    if (predicate != null) triple.predicate = predicate;
    if (object    != null) triple.object    = object;
    return triple;
  }

  // Creates a new blank node identifier
  function blank() {
    return '_:b' + blankId++;
  };
  var blankId = 0;
  Parser._resetBlanks = function () { blankId = 0; }

  // Regular expression and replacement strings to escape strings
  var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\(.)/g,
      escapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                             't': '\t', 'b': '\b', 'n': '\n', 'r': '\r', 'f': '\f' },
      fromCharCode = String.fromCharCode;

  // Translates escape codes in the string into their textual equivalent
  function unescapeString(string, trimLength) {
    string = string.substring(trimLength, string.length - trimLength);
    try {
      string = string.replace(escapeSequence, function (sequence, unicode4, unicode8, escapedChar) {
        var charCode;
        if (unicode4) {
          charCode = parseInt(unicode4, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          return fromCharCode(charCode);
        }
        else if (unicode8) {
          charCode = parseInt(unicode8, 16);
          if (isNaN(charCode)) throw new Error(); // can never happen (regex), but helps performance
          if (charCode < 0xFFFF) return fromCharCode(charCode);
          return fromCharCode(0xD800 + ((charCode -= 0x10000) >> 10), 0xDC00 + (charCode & 0x3FF));
        }
        else {
          var replacement = escapeReplacements[escapedChar];
          if (!replacement) throw new Error();
          return replacement;
        }
      });
    }
    catch (error) { return ''; }
    return '"' + string + '"';
  }

  // Creates a list, collecting its (possibly blank) items and triples associated with those items
  function createList(objects) {
    var list = blank(), head = list, listItems = [], listTriples, triples = [];
    objects.forEach(function (o) { listItems.push(o.entity); appendAllTo(triples, o.triples); });

    // Build an RDF list out of the items
    for (var i = 0, j = 0, l = listItems.length, listTriples = Array(l * 2); i < l;)
      listTriples[j++] = triple(head, RDF_FIRST, listItems[i]),
      listTriples[j++] = triple(head, RDF_REST,  head = ++i < l ? blank() : RDF_NIL);

    // Return the list's identifier, its triples, and the triples associated with its items
    return { entity: list, triples: appendAllTo(listTriples, triples) };
  }

  // Creates a blank node identifier, collecting triples with that blank node as subject
  function createAnonymousObject(propertyList) {
    var entity = blank();
    return {
      entity: entity,
      triples: propertyList.map(function (t) { return extend(triple(entity), t); })
    };
  }

  // Collects all (possibly blank) objects, and triples that have them as subject
  function objectListToTriples(predicate, objectList, otherTriples) {
    var objects = [], triples = [];
    objectList.forEach(function (l) {
      objects.push(triple(null, predicate, l.entity));
      appendAllTo(triples, l.triples);
    });
    return unionAll(objects, otherTriples || [], triples);
  }
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"flex":true,"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* ignore */
break;
case 1:return 11
break;
case 2:return 14
break;
case 3:return 23
break;
case 4:return 280
break;
case 5:return 281
break;
case 6:return 28
break;
case 7:return 30
break;
case 8:return 31
break;
case 9:return 283
break;
case 10:return 33
break;
case 11:return 37
break;
case 12:return 38
break;
case 13:return 40
break;
case 14:return 42
break;
case 15:return 47
break;
case 16:return 50
break;
case 17:return 286
break;
case 18:return 60
break;
case 19:return 61
break;
case 20:return 67
break;
case 21:return 70
break;
case 22:return 73
break;
case 23:return 75
break;
case 24:return 78
break;
case 25:return 80
break;
case 26:return 82
break;
case 27:return 192
break;
case 28:return 95
break;
case 29:return 287
break;
case 30:return 128
break;
case 31:return 288
break;
case 32:return 289
break;
case 33:return 105
break;
case 34:return 290
break;
case 35:return 104
break;
case 36:return 291
break;
case 37:return 292
break;
case 38:return 108
break;
case 39:return 110
break;
case 40:return 111
break;
case 41:return 126
break;
case 42:return 120
break;
case 43:return 121
break;
case 44:return 123
break;
case 45:return 129
break;
case 46:return 107
break;
case 47:return 293
break;
case 48:return 294
break;
case 49:return 155
break;
case 50:return 158
break;
case 51:return 162
break;
case 52:return 89
break;
case 53:return 156
break;
case 54:return 295
break;
case 55:return 161
break;
case 56:return 242
break;
case 57:return 181
break;
case 58:return 297
break;
case 59:return 298
break;
case 60:return 208
break;
case 61:return 300
break;
case 62:return 301
break;
case 63:return 203
break;
case 64:return 210
break;
case 65:return 211
break;
case 66:return 302
break;
case 67:return 303
break;
case 68:return 259
break;
case 69:return 304
break;
case 70:return 305
break;
case 71:return 306
break;
case 72:return 307
break;
case 73:return 308
break;
case 74:return 222
break;
case 75:return 309
break;
case 76:return 237
break;
case 77:return 245
break;
case 78:return 246
break;
case 79:return 239
break;
case 80:return 240
break;
case 81:return 241
break;
case 82:return 310
break;
case 83:return 311
break;
case 84:return 243
break;
case 85:return 313
break;
case 86:return 312
break;
case 87:return 314
break;
case 88:return 248
break;
case 89:return 249
break;
case 90:return 252
break;
case 91:return 254
break;
case 92:return 258
break;
case 93:return 262
break;
case 94:return 265
break;
case 95:return 266
break;
case 96:return 12
break;
case 97:return 15
break;
case 98:return 277
break;
case 99:return 213
break;
case 100:return 27
break;
case 101:return 261
break;
case 102:return 79
break;
case 103:return 263
break;
case 104:return 264
break;
case 105:return 271
break;
case 106:return 272
break;
case 107:return 273
break;
case 108:return 274
break;
case 109:return 275
break;
case 110:return 276
break;
case 111:return 'EXPONENT'
break;
case 112:return 267
break;
case 113:return 268
break;
case 114:return 269
break;
case 115:return 270
break;
case 116:return 163
break;
case 117:return 214
break;
case 118:return 6
break;
case 119:return 'INVALID'
break;
case 120:console.log(yy_.yytext);
break;
}
},
rules: [/^(?:\s+|#[^\n\r]*)/i,/^(?:BASE)/i,/^(?:PREFIX)/i,/^(?:SELECT)/i,/^(?:DISTINCT)/i,/^(?:REDUCED)/i,/^(?:\()/i,/^(?:AS)/i,/^(?:\))/i,/^(?:\*)/i,/^(?:CONSTRUCT)/i,/^(?:WHERE)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:DESCRIBE)/i,/^(?:ASK)/i,/^(?:FROM)/i,/^(?:NAMED)/i,/^(?:GROUP)/i,/^(?:BY)/i,/^(?:HAVING)/i,/^(?:ORDER)/i,/^(?:ASC)/i,/^(?:DESC)/i,/^(?:LIMIT)/i,/^(?:OFFSET)/i,/^(?:VALUES)/i,/^(?:;)/i,/^(?:LOAD)/i,/^(?:SILENT)/i,/^(?:INTO)/i,/^(?:CLEAR)/i,/^(?:DROP)/i,/^(?:CREATE)/i,/^(?:ADD)/i,/^(?:TO)/i,/^(?:MOVE)/i,/^(?:COPY)/i,/^(?:INSERT\s+DATA)/i,/^(?:DELETE\s+DATA)/i,/^(?:DELETE\s+WHERE)/i,/^(?:WITH)/i,/^(?:DELETE)/i,/^(?:INSERT)/i,/^(?:USING)/i,/^(?:DEFAULT)/i,/^(?:GRAPH)/i,/^(?:ALL)/i,/^(?:\.)/i,/^(?:OPTIONAL)/i,/^(?:SERVICE)/i,/^(?:BIND)/i,/^(?:UNDEF)/i,/^(?:MINUS)/i,/^(?:UNION)/i,/^(?:FILTER)/i,/^(?:,)/i,/^(?:a)/i,/^(?:\|)/i,/^(?:\/)/i,/^(?:\^)/i,/^(?:\?)/i,/^(?:\+)/i,/^(?:!)/i,/^(?:\[)/i,/^(?:\])/i,/^(?:\|\|)/i,/^(?:&&)/i,/^(?:=)/i,/^(?:!=)/i,/^(?:<)/i,/^(?:>)/i,/^(?:<=)/i,/^(?:>=)/i,/^(?:IN)/i,/^(?:NOT)/i,/^(?:-)/i,/^(?:BOUND)/i,/^(?:BNODE)/i,/^(?:(RAND|NOW|UUID|STUUID))/i,/^(?:(LANG|DATATYPE|IRI|URI|ABS|CEIL|FLOOR|ROUND|STRLEN|STR|UCASE|LCASE|ENCODE_FOR_URI|YEAR|MONTH|DAY|HOURS|MINUTES|SECONDS|TIMEZONE|TZ|MD5|SHA1|SHA256|SHA384|SHA512|isIRI|isURI|isBLANK|isLITERAL|isNUMERIC))/i,/^(?:(LANGMATCHES|CONTAINS|STRSTARTS|STRENDS|STRBEFORE|STRAFTER|STRLANG|STRDT|sameTerm))/i,/^(?:CONCAT)/i,/^(?:COALESCE)/i,/^(?:IF)/i,/^(?:REGEX)/i,/^(?:SUBSTR)/i,/^(?:REPLACE)/i,/^(?:EXISTS)/i,/^(?:COUNT)/i,/^(?:SUM|MIN|MAX|AVG|SAMPLE)/i,/^(?:GROUP_CONCAT)/i,/^(?:SEPARATOR)/i,/^(?:\^\^)/i,/^(?:true)/i,/^(?:false)/i,/^(?:(<([^<>\"\{\}\|\^`\\\u0000-\u0020])*>))/i,/^(?:((([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])(((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])|\.)*(((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]))?)?:))/i,/^(?:(((([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])(((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])|\.)*(((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]))?)?:)((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|:|[0-9]|((%([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%))))(((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])|\.|:|((%([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%))))*((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])|:|((%([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f]))|(\\(_|~|\.|-|!|\$|&|'|\(|\)|\*|\+|,|;|=|\/|\?|#|@|%)))))?)))/i,/^(?:(_:(((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9])(((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])|\.)*(((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|-|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040]))?))/i,/^(?:([\?\$]((((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9])(((?:([A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])|_))|[0-9]|\u00B7|[\u0300-\u036F]|[\u203F-\u2040])*)))/i,/^(?:(@[a-zA-Z]+(-[a-zA-Z0-9]+)*))/i,/^(?:([0-9]+))/i,/^(?:([0-9]*\.[0-9]+))/i,/^(?:([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+)))/i,/^(?:(\+([0-9]+)))/i,/^(?:(\+([0-9]*\.[0-9]+)))/i,/^(?:(\+([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+))))/i,/^(?:(-([0-9]+)))/i,/^(?:(-([0-9]*\.[0-9]+)))/i,/^(?:(-([0-9]+\.[0-9]*([eE][+-]?[0-9]+)|\.([0-9])+([eE][+-]?[0-9]+)|([0-9])+([eE][+-]?[0-9]+))))/i,/^(?:([eE][+-]?[0-9]+))/i,/^(?:('(([^\u0027\u005C\u000A\u000D])|(\\[tbnrf\\\"']|\\u([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])|\\U([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])))*'))/i,/^(?:("(([^\u0022\u005C\u000A\u000D])|(\\[tbnrf\\\"']|\\u([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])|\\U([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])))*"))/i,/^(?:('''(('|'')?([^'\\]|(\\[tbnrf\\\"']|\\u([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])|\\U([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f]))))*'''))/i,/^(?:("""(("|"")?([^\"\\]|(\\[tbnrf\\\"']|\\u([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])|\\U([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f])([0-9]|[A-F]|[a-f]))))*"""))/i,/^(?:(\((\u0020|\u0009|\u000D|\u000A)*\)))/i,/^(?:(\[(\u0020|\u0009|\u000D|\u000A)*\]))/i,/^(?:$)/i,/^(?:.)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":8,"fs":2,"path":7}],51:[function(require,module,exports){
var Parser = require('./lib/SparqlParser').Parser;
var Generator = require('./lib/SparqlGenerator');

module.exports = {
  // Creates a SPARQL parser with the given pre-defined prefixes
  Parser: function (prefixes) {
    // Create a copy of the prefixes
    var prefixesCopy = {};
    for (var prefix in prefixes || {})
      prefixesCopy[prefix] = prefixes[prefix];

    // Create a new parser with the given prefixes
    // (Workaround for https://github.com/zaach/jison/issues/241)
    var parser = new Parser();
    parser.parse = function () {
      Parser.prefixes = Object.create(prefixesCopy);
      return Parser.prototype.parse.apply(parser, arguments);
    };
    parser._resetBlanks = Parser._resetBlanks;
    return parser;
  },
  Generator: Generator,
};

},{"./lib/SparqlGenerator":49,"./lib/SparqlParser":50}],52:[function(require,module,exports){
(function (global){
/*global unescape, module, define, window, global*/

/*
 UriTemplate Copyright (c) 2012-2013 Franz Antesberger. All Rights Reserved.
 Available via the MIT license.
*/

(function (exportCallback) {
    "use strict";

var UriTemplateError = (function () {

    function UriTemplateError (options) {
        this.options = options;
    }

    UriTemplateError.prototype.toString = function () {
        if (JSON && JSON.stringify) {
            return JSON.stringify(this.options);
        }
        else {
            return this.options;
        }
    };

    return UriTemplateError;
}());

var objectHelper = (function () {
    function isArray (value) {
        return Object.prototype.toString.apply(value) === '[object Array]';
    }

    function isString (value) {
        return Object.prototype.toString.apply(value) === '[object String]';
    }
    
    function isNumber (value) {
        return Object.prototype.toString.apply(value) === '[object Number]';
    }
    
    function isBoolean (value) {
        return Object.prototype.toString.apply(value) === '[object Boolean]';
    }
    
    function join (arr, separator) {
        var
            result = '',
            first = true,
            index;
        for (index = 0; index < arr.length; index += 1) {
            if (first) {
                first = false;
            }
            else {
                result += separator;
            }
            result += arr[index];
        }
        return result;
    }

    function map (arr, mapper) {
        var
            result = [],
            index = 0;
        for (; index < arr.length; index += 1) {
            result.push(mapper(arr[index]));
        }
        return result;
    }

    function filter (arr, predicate) {
        var
            result = [],
            index = 0;
        for (; index < arr.length; index += 1) {
            if (predicate(arr[index])) {
                result.push(arr[index]);
            }
        }
        return result;
    }

    function deepFreezeUsingObjectFreeze (object) {
        if (typeof object !== "object" || object === null) {
            return object;
        }
        Object.freeze(object);
        var property, propertyName;
        for (propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                property = object[propertyName];
                // be aware, arrays are 'object', too
                if (typeof property === "object") {
                    deepFreeze(property);
                }
            }
        }
        return object;
    }

    function deepFreeze (object) {
        if (typeof Object.freeze === 'function') {
            return deepFreezeUsingObjectFreeze(object);
        }
        return object;
    }


    return {
        isArray: isArray,
        isString: isString,
        isNumber: isNumber,
        isBoolean: isBoolean,
        join: join,
        map: map,
        filter: filter,
        deepFreeze: deepFreeze
    };
}());

var charHelper = (function () {

    function isAlpha (chr) {
        return (chr >= 'a' && chr <= 'z') || ((chr >= 'A' && chr <= 'Z'));
    }

    function isDigit (chr) {
        return chr >= '0' && chr <= '9';
    }

    function isHexDigit (chr) {
        return isDigit(chr) || (chr >= 'a' && chr <= 'f') || (chr >= 'A' && chr <= 'F');
    }

    return {
        isAlpha: isAlpha,
        isDigit: isDigit,
        isHexDigit: isHexDigit
    };
}());

var pctEncoder = (function () {
    var utf8 = {
        encode: function (chr) {
            // see http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
            return unescape(encodeURIComponent(chr));
        },
        numBytes: function (firstCharCode) {
            if (firstCharCode <= 0x7F) {
                return 1;
            }
            else if (0xC2 <= firstCharCode && firstCharCode <= 0xDF) {
                return 2;
            }
            else if (0xE0 <= firstCharCode && firstCharCode <= 0xEF) {
                return 3;
            }
            else if (0xF0 <= firstCharCode && firstCharCode <= 0xF4) {
                return 4;
            }
            // no valid first octet
            return 0;
        },
        isValidFollowingCharCode: function (charCode) {
            return 0x80 <= charCode && charCode <= 0xBF;
        }
    };

    /**
     * encodes a character, if needed or not.
     * @param chr
     * @return pct-encoded character
     */
    function encodeCharacter (chr) {
        var
            result = '',
            octets = utf8.encode(chr),
            octet,
            index;
        for (index = 0; index < octets.length; index += 1) {
            octet = octets.charCodeAt(index);
            result += '%' + (octet < 0x10 ? '0' : '') + octet.toString(16).toUpperCase();
        }
        return result;
    }

    /**
     * Returns, whether the given text at start is in the form 'percent hex-digit hex-digit', like '%3F'
     * @param text
     * @param start
     * @return {boolean|*|*}
     */
    function isPercentDigitDigit (text, start) {
        return text.charAt(start) === '%' && charHelper.isHexDigit(text.charAt(start + 1)) && charHelper.isHexDigit(text.charAt(start + 2));
    }

    /**
     * Parses a hex number from start with length 2.
     * @param text a string
     * @param start the start index of the 2-digit hex number
     * @return {Number}
     */
    function parseHex2 (text, start) {
        return parseInt(text.substr(start, 2), 16);
    }

    /**
     * Returns whether or not the given char sequence is a correctly pct-encoded sequence.
     * @param chr
     * @return {boolean}
     */
    function isPctEncoded (chr) {
        if (!isPercentDigitDigit(chr, 0)) {
            return false;
        }
        var firstCharCode = parseHex2(chr, 1);
        var numBytes = utf8.numBytes(firstCharCode);
        if (numBytes === 0) {
            return false;
        }
        for (var byteNumber = 1; byteNumber < numBytes; byteNumber += 1) {
            if (!isPercentDigitDigit(chr, 3*byteNumber) || !utf8.isValidFollowingCharCode(parseHex2(chr, 3*byteNumber + 1))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Reads as much as needed from the text, e.g. '%20' or '%C3%B6'. It does not decode!
     * @param text
     * @param startIndex
     * @return the character or pct-string of the text at startIndex
     */
    function pctCharAt(text, startIndex) {
        var chr = text.charAt(startIndex);
        if (!isPercentDigitDigit(text, startIndex)) {
            return chr;
        }
        var utf8CharCode = parseHex2(text, startIndex + 1);
        var numBytes = utf8.numBytes(utf8CharCode);
        if (numBytes === 0) {
            return chr;
        }
        for (var byteNumber = 1; byteNumber < numBytes; byteNumber += 1) {
            if (!isPercentDigitDigit(text, startIndex + 3 * byteNumber) || !utf8.isValidFollowingCharCode(parseHex2(text, startIndex + 3 * byteNumber + 1))) {
                return chr;
            }
        }
        return text.substr(startIndex, 3 * numBytes);
    }

    return {
        encodeCharacter: encodeCharacter,
        isPctEncoded: isPctEncoded,
        pctCharAt: pctCharAt
    };
}());

var rfcCharHelper = (function () {

    /**
     * Returns if an character is an varchar character according 2.3 of rfc 6570
     * @param chr
     * @return (Boolean)
     */
    function isVarchar (chr) {
        return charHelper.isAlpha(chr) || charHelper.isDigit(chr) || chr === '_' || pctEncoder.isPctEncoded(chr);
    }

    /**
     * Returns if chr is an unreserved character according 1.5 of rfc 6570
     * @param chr
     * @return {Boolean}
     */
    function isUnreserved (chr) {
        return charHelper.isAlpha(chr) || charHelper.isDigit(chr) || chr === '-' || chr === '.' || chr === '_' || chr === '~';
    }

    /**
     * Returns if chr is an reserved character according 1.5 of rfc 6570
     * or the percent character mentioned in 3.2.1.
     * @param chr
     * @return {Boolean}
     */
    function isReserved (chr) {
        return chr === ':' || chr === '/' || chr === '?' || chr === '#' || chr === '[' || chr === ']' || chr === '@' || chr === '!' || chr === '$' || chr === '&' || chr === '(' ||
            chr === ')' || chr === '*' || chr === '+' || chr === ',' || chr === ';' || chr === '=' || chr === "'";
    }

    return {
        isVarchar: isVarchar,
        isUnreserved: isUnreserved,
        isReserved: isReserved
    };

}());

/**
 * encoding of rfc 6570
 */
var encodingHelper = (function () {

    function encode (text, passReserved) {
        var
            result = '',
            index,
            chr = '';
        if (typeof text === "number" || typeof text === "boolean") {
            text = text.toString();
        }
        for (index = 0; index < text.length; index += chr.length) {
            chr = text.charAt(index);
            result += rfcCharHelper.isUnreserved(chr) || (passReserved && rfcCharHelper.isReserved(chr)) ? chr : pctEncoder.encodeCharacter(chr);
        }
        return result;
    }

    function encodePassReserved (text) {
        return encode(text, true);
    }

    function encodeLiteralCharacter (literal, index) {
        var chr = pctEncoder.pctCharAt(literal, index);
        if (chr.length > 1) {
            return chr;
        }
        else {
            return rfcCharHelper.isReserved(chr) || rfcCharHelper.isUnreserved(chr) ? chr : pctEncoder.encodeCharacter(chr);
        }
    }

    function encodeLiteral (literal) {
        var
            result = '',
            index,
            chr = '';
        for (index = 0; index < literal.length; index += chr.length) {
            chr = pctEncoder.pctCharAt(literal, index);
            if (chr.length > 1) {
                result += chr;
            }
            else {
                result += rfcCharHelper.isReserved(chr) || rfcCharHelper.isUnreserved(chr) ? chr : pctEncoder.encodeCharacter(chr);
            }
        }
        return result;
    }

    return {
        encode: encode,
        encodePassReserved: encodePassReserved,
        encodeLiteral: encodeLiteral,
        encodeLiteralCharacter: encodeLiteralCharacter
    };

}());


// the operators defined by rfc 6570
var operators = (function () {

    var
        bySymbol = {};

    function create (symbol) {
        bySymbol[symbol] = {
            symbol: symbol,
            separator: (symbol === '?') ? '&' : (symbol === '' || symbol === '+' || symbol === '#') ? ',' : symbol,
            named: symbol === ';' || symbol === '&' || symbol === '?',
            ifEmpty: (symbol === '&' || symbol === '?') ? '=' : '',
            first: (symbol === '+' ) ? '' : symbol,
            encode: (symbol === '+' || symbol === '#') ? encodingHelper.encodePassReserved : encodingHelper.encode,
            toString: function () {
                return this.symbol;
            }
        };
    }

    create('');
    create('+');
    create('#');
    create('.');
    create('/');
    create(';');
    create('?');
    create('&');
    return {
        valueOf: function (chr) {
            if (bySymbol[chr]) {
                return bySymbol[chr];
            }
            if ("=,!@|".indexOf(chr) >= 0) {
                return null;
            }
            return bySymbol[''];
        }
    };
}());


/**
 * Detects, whether a given element is defined in the sense of rfc 6570
 * Section 2.3 of the RFC makes clear defintions:
 * * undefined and null are not defined.
 * * the empty string is defined
 * * an array ("list") is defined, if it is not empty (even if all elements are not defined)
 * * an object ("map") is defined, if it contains at least one property with defined value
 * @param object
 * @return {Boolean}
 */
function isDefined (object) {
    var
        propertyName;
    if (object === null || object === undefined) {
        return false;
    }
    if (objectHelper.isArray(object)) {
        // Section 2.3: A variable defined as a list value is considered undefined if the list contains zero members
        return object.length > 0;
    }
    if (typeof object === "string" || typeof object === "number" || typeof object === "boolean") {
        // falsy values like empty strings, false or 0 are "defined"
        return true;
    }
    // else Object
    for (propertyName in object) {
        if (object.hasOwnProperty(propertyName) && isDefined(object[propertyName])) {
            return true;
        }
    }
    return false;
}

var LiteralExpression = (function () {
    function LiteralExpression (literal) {
        this.literal = encodingHelper.encodeLiteral(literal);
    }

    LiteralExpression.prototype.expand = function () {
        return this.literal;
    };

    LiteralExpression.prototype.toString = LiteralExpression.prototype.expand;

    return LiteralExpression;
}());

var parse = (function () {

    function parseExpression (expressionText) {
        var
            operator,
            varspecs = [],
            varspec = null,
            varnameStart = null,
            maxLengthStart = null,
            index,
            chr = '';

        function closeVarname () {
            var varname = expressionText.substring(varnameStart, index);
            if (varname.length === 0) {
                throw new UriTemplateError({expressionText: expressionText, message: "a varname must be specified", position: index});
            }
            varspec = {varname: varname, exploded: false, maxLength: null};
            varnameStart = null;
        }

        function closeMaxLength () {
            if (maxLengthStart === index) {
                throw new UriTemplateError({expressionText: expressionText, message: "after a ':' you have to specify the length", position: index});
            }
            varspec.maxLength = parseInt(expressionText.substring(maxLengthStart, index), 10);
            maxLengthStart = null;
        }

        operator = (function (operatorText) {
            var op = operators.valueOf(operatorText);
            if (op === null) {
                throw new UriTemplateError({expressionText: expressionText, message: "illegal use of reserved operator", position: index, operator: operatorText});
            }
            return op;
        }(expressionText.charAt(0)));
        index = operator.symbol.length;

        varnameStart = index;

        for (; index < expressionText.length; index += chr.length) {
            chr = pctEncoder.pctCharAt(expressionText, index);

            if (varnameStart !== null) {
                // the spec says: varname =  varchar *( ["."] varchar )
                // so a dot is allowed except for the first char
                if (chr === '.') {
                    if (varnameStart === index) {
                        throw new UriTemplateError({expressionText: expressionText, message: "a varname MUST NOT start with a dot", position: index});
                    }
                    continue;
                }
                if (rfcCharHelper.isVarchar(chr)) {
                    continue;
                }
                closeVarname();
            }
            if (maxLengthStart !== null) {
                if (index === maxLengthStart && chr === '0') {
                    throw new UriTemplateError({expressionText: expressionText, message: "A :prefix must not start with digit 0", position: index});
                }
                if (charHelper.isDigit(chr)) {
                    if (index - maxLengthStart >= 4) {
                        throw new UriTemplateError({expressionText: expressionText, message: "A :prefix must have max 4 digits", position: index});
                    }
                    continue;
                }
                closeMaxLength();
            }
            if (chr === ':') {
                if (varspec.maxLength !== null) {
                    throw new UriTemplateError({expressionText: expressionText, message: "only one :maxLength is allowed per varspec", position: index});
                }
                if (varspec.exploded) {
                    throw new UriTemplateError({expressionText: expressionText, message: "an exploeded varspec MUST NOT be varspeced", position: index});
                }
                maxLengthStart = index + 1;
                continue;
            }
            if (chr === '*') {
                if (varspec === null) {
                    throw new UriTemplateError({expressionText: expressionText, message: "exploded without varspec", position: index});
                }
                if (varspec.exploded) {
                    throw new UriTemplateError({expressionText: expressionText, message: "exploded twice", position: index});
                }
                if (varspec.maxLength) {
                    throw new UriTemplateError({expressionText: expressionText, message: "an explode (*) MUST NOT follow to a prefix", position: index});
                }
                varspec.exploded = true;
                continue;
            }
            // the only legal character now is the comma
            if (chr === ',') {
                varspecs.push(varspec);
                varspec = null;
                varnameStart = index + 1;
                continue;
            }
            throw new UriTemplateError({expressionText: expressionText, message: "illegal character", character: chr, position: index});
        } // for chr
        if (varnameStart !== null) {
            closeVarname();
        }
        if (maxLengthStart !== null) {
            closeMaxLength();
        }
        varspecs.push(varspec);
        return new VariableExpression(expressionText, operator, varspecs);
    }

    function parse (uriTemplateText) {
        // assert filled string
        var
            index,
            chr,
            expressions = [],
            braceOpenIndex = null,
            literalStart = 0;
        for (index = 0; index < uriTemplateText.length; index += 1) {
            chr = uriTemplateText.charAt(index);
            if (literalStart !== null) {
                if (chr === '}') {
                    throw new UriTemplateError({templateText: uriTemplateText, message: "unopened brace closed", position: index});
                }
                if (chr === '{') {
                    if (literalStart < index) {
                        expressions.push(new LiteralExpression(uriTemplateText.substring(literalStart, index)));
                    }
                    literalStart = null;
                    braceOpenIndex = index;
                }
                continue;
            }

            if (braceOpenIndex !== null) {
                // here just { is forbidden
                if (chr === '{') {
                    throw new UriTemplateError({templateText: uriTemplateText, message: "brace already opened", position: index});
                }
                if (chr === '}') {
                    if (braceOpenIndex + 1 === index) {
                        throw new UriTemplateError({templateText: uriTemplateText, message: "empty braces", position: braceOpenIndex});
                    }
                    try {
                        expressions.push(parseExpression(uriTemplateText.substring(braceOpenIndex + 1, index)));
                    }
                    catch (error) {
                        if (error.prototype === UriTemplateError.prototype) {
                            throw new UriTemplateError({templateText: uriTemplateText, message: error.options.message, position: braceOpenIndex + error.options.position, details: error.options});
                        }
                        throw error;
                    }
                    braceOpenIndex = null;
                    literalStart = index + 1;
                }
                continue;
            }
            throw new Error('reached unreachable code');
        }
        if (braceOpenIndex !== null) {
            throw new UriTemplateError({templateText: uriTemplateText, message: "unclosed brace", position: braceOpenIndex});
        }
        if (literalStart < uriTemplateText.length) {
            expressions.push(new LiteralExpression(uriTemplateText.substr(literalStart)));
        }
        return new UriTemplate(uriTemplateText, expressions);
    }

    return parse;
}());

var VariableExpression = (function () {
    // helper function if JSON is not available
    function prettyPrint (value) {
        return (JSON && JSON.stringify) ? JSON.stringify(value) : value;
    }

    function isEmpty (value) {
        if (!isDefined(value)) {
            return true;
        }
        if (objectHelper.isString(value)) {
            return value === '';
        }
        if (objectHelper.isNumber(value) || objectHelper.isBoolean(value)) {
            return false;
        }
        if (objectHelper.isArray(value)) {
            return value.length === 0;
        }
        for (var propertyName in value) {
            if (value.hasOwnProperty(propertyName)) {
                return false;
            }
        }
        return true;
    }

    function propertyArray (object) {
        var
            result = [],
            propertyName;
        for (propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                result.push({name: propertyName, value: object[propertyName]});
            }
        }
        return result;
    }

    function VariableExpression (templateText, operator, varspecs) {
        this.templateText = templateText;
        this.operator = operator;
        this.varspecs = varspecs;
    }

    VariableExpression.prototype.toString = function () {
        return this.templateText;
    };

    function expandSimpleValue(varspec, operator, value) {
        var result = '';
        value = value.toString();
        if (operator.named) {
            result += encodingHelper.encodeLiteral(varspec.varname);
            if (value === '') {
                result += operator.ifEmpty;
                return result;
            }
            result += '=';
        }
        if (varspec.maxLength !== null) {
            value = value.substr(0, varspec.maxLength);
        }
        result += operator.encode(value);
        return result;
    }

    function valueDefined (nameValue) {
        return isDefined(nameValue.value);
    }

    function expandNotExploded(varspec, operator, value) {
        var
            arr = [],
            result = '';
        if (operator.named) {
            result += encodingHelper.encodeLiteral(varspec.varname);
            if (isEmpty(value)) {
                result += operator.ifEmpty;
                return result;
            }
            result += '=';
        }
        if (objectHelper.isArray(value)) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, operator.encode);
            result += objectHelper.join(arr, ',');
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, valueDefined);
            arr = objectHelper.map(arr, function (nameValue) {
                return operator.encode(nameValue.name) + ',' + operator.encode(nameValue.value);
            });
            result += objectHelper.join(arr, ',');
        }
        return result;
    }

    function expandExplodedNamed (varspec, operator, value) {
        var
            isArray = objectHelper.isArray(value),
            arr = [];
        if (isArray) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, function (listElement) {
                var tmp = encodingHelper.encodeLiteral(varspec.varname);
                if (isEmpty(listElement)) {
                    tmp += operator.ifEmpty;
                }
                else {
                    tmp += '=' + operator.encode(listElement);
                }
                return tmp;
            });
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, valueDefined);
            arr = objectHelper.map(arr, function (nameValue) {
                var tmp = encodingHelper.encodeLiteral(nameValue.name);
                if (isEmpty(nameValue.value)) {
                    tmp += operator.ifEmpty;
                }
                else {
                    tmp += '=' + operator.encode(nameValue.value);
                }
                return tmp;
            });
        }
        return objectHelper.join(arr, operator.separator);
    }

    function expandExplodedUnnamed (operator, value) {
        var
            arr = [],
            result = '';
        if (objectHelper.isArray(value)) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, operator.encode);
            result += objectHelper.join(arr, operator.separator);
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, function (nameValue) {
                return isDefined(nameValue.value);
            });
            arr = objectHelper.map(arr, function (nameValue) {
                return operator.encode(nameValue.name) + '=' + operator.encode(nameValue.value);
            });
            result += objectHelper.join(arr, operator.separator);
        }
        return result;
    }


    VariableExpression.prototype.expand = function (variables) {
        var
            expanded = [],
            index,
            varspec,
            value,
            valueIsArr,
            oneExploded = false,
            operator = this.operator;

        // expand each varspec and join with operator's separator
        for (index = 0; index < this.varspecs.length; index += 1) {
            varspec = this.varspecs[index];
            value = variables[varspec.varname];
            // if (!isDefined(value)) {
            // if (variables.hasOwnProperty(varspec.name)) {
            if (value === null || value === undefined) {
                continue;
            }
            if (varspec.exploded) {
                oneExploded = true;
            }
            valueIsArr = objectHelper.isArray(value);
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                expanded.push(expandSimpleValue(varspec, operator, value));
            }
            else if (varspec.maxLength && isDefined(value)) {
                // 2.4.1 of the spec says: "Prefix modifiers are not applicable to variables that have composite values."
                throw new Error('Prefix modifiers are not applicable to variables that have composite values. You tried to expand ' + this + " with " + prettyPrint(value));
            }
            else if (!varspec.exploded) {
                if (operator.named || !isEmpty(value)) {
                    expanded.push(expandNotExploded(varspec, operator, value));
                }
            }
            else if (isDefined(value)) {
                if (operator.named) {
                    expanded.push(expandExplodedNamed(varspec, operator, value));
                }
                else {
                    expanded.push(expandExplodedUnnamed(operator, value));
                }
            }
        }

        if (expanded.length === 0) {
            return "";
        }
        else {
            return operator.first + objectHelper.join(expanded, operator.separator);
        }
    };

    return VariableExpression;
}());

var UriTemplate = (function () {
    function UriTemplate (templateText, expressions) {
        this.templateText = templateText;
        this.expressions = expressions;
        objectHelper.deepFreeze(this);
    }

    UriTemplate.prototype.toString = function () {
        return this.templateText;
    };

    UriTemplate.prototype.expand = function (variables) {
        // this.expressions.map(function (expression) {return expression.expand(variables);}).join('');
        var
            index,
            result = '';
        for (index = 0; index < this.expressions.length; index += 1) {
            result += this.expressions[index].expand(variables);
        }
        return result;
    };

    UriTemplate.parse = parse;
    UriTemplate.UriTemplateError = UriTemplateError;
    return UriTemplate;
}());

    exportCallback(UriTemplate);

}(function (UriTemplate) {
        "use strict";
        // export UriTemplate, when module is present, or pass it to window or global
        if (typeof module !== "undefined") {
            module.exports = UriTemplate;
        }
        else if (typeof define === "function") {
            define([],function() {
                return UriTemplate;
            });
        }
        else if (typeof window !== "undefined") {
            window.UriTemplate = UriTemplate;
        }
        else {
            global.UriTemplate = UriTemplate;
        }
    }
));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
