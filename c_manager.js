/****************************************************
* author：  hualei
* time：    2013/5/29 10:25:37
* des: 
扩展整合自
flight.js ：https://github.com/flightjs/flight
es-shim.js ：https://github.com/kriskowal/es5-shim/
*****************************************************/


/*
***  es5 compatibility ref:http://kangax.github.io/es5-compat-table/

                            ios4   ios5   ios6   android2.2   android2.3  android3   android4
Function.prototype.bind:     no     no                           yes        yes         yes

*/

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5
if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        var slice = Array.prototype.slice;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {
            if (this instanceof bound) {
                var F = function () { };
                F.prototype = target.prototype;
                var self = new F;

                var result = target.apply(
                    self,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return self;
            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );
            }
        };
        return bound;
    };
}


; (function () {

    "use strict";

    window.c_manager = {};

/**
    utils.js
*/
    ; (function (undefined) {

        var arry = [];
        var DEFAULT_INTERVAL = 100;
        var utils = {
            merge: function (/*obj1, obj2,....deepCopy*/) {
                // unpacking arguments by hand benchmarked faster
                var l = arguments.length,
                    i = 0,
                    args = new Array(l + 1);
                for (; i < l; i++) args[i + 1] = arguments[i];

                if (l === 0) {
                    return {};
                }

                //start with empty object so a copy is created
                args[0] = {};

                if (args[args.length - 1] === true) {
                    //jquery extend requires deep copy as first arg
                    args.pop();
                    args.unshift(true);
                }

                return $.extend.apply(undefined, args);
            },
            push: function (base, extra, protect) {
                if (base) {
                    Object.keys(extra || {}).forEach(function (key) {
                        if (base[key] && protect) {
                            throw Error("utils.push attempted to overwrite '" + key + "' while running in protected mode");
                        }

                        if (typeof base[key] == "object" && typeof extra[key] == "object") {
                            //recurse
                            this.push(base[key], extra[key]);
                        } else {
                            //no protect, so extra wins
                            base[key] = extra[key];
                        }
                    }, this);
                }

                return base;
            },
            delegate: function (rules) {
                return function (e, data) {
                    var target = $(e.target), parent;

                    Object.keys(rules).forEach(function (selector) {
                        if ((parent = target.closest(selector)).length) {
                            data = data || {};
                            data.el = parent[0];
                            return rules[selector].apply(this, [e, data]);
                        }
                    }, this);
                };
            }
        };
        window.c_manager.utils = utils;
    })();


/**
    compose.js
*/
    ; (function (undefined) {

        function unlockProperty(obj, prop, op) {
            //简化掉debug需求
            op.call(obj);
        }

        function mixin(base, mixins) {
            base.mixedIn = base.hasOwnProperty('mixedIn') ? base.mixedIn : [];

            /** start 防止组件关键方法被覆盖 --by hualei5280  **/
            var get_fnName = function (mixin) {
                var functionNameRegEx = /function (.*?)\s?\(/;
                if (mixin.name == null) {
                    var m = mixin.toString().match(functionNameRegEx);
                    return (m && m[1]) ? m[1] : "";
                } else {
                    return (mixin.name == "withBaseComponent") ? "" : mixin.name;
                }
            }
            var protectPropertys = ["mixedIn", "trigger", "on", "off", /*"resolveDelegateRules", 此方法已改为私有方法*/ "defaultAttrs", "select",
                             "teardown", "before", "after", "around"];
            //注：只保护flight提供的方法不被重写，别处使用compose.mixin方法可能会受影响
            var protectObj = {};
            var first = true;

            mixins.forEach(function (mixin) {
                if (base.mixedIn.indexOf(mixin) == -1) {

                    var fnName = get_fnName(mixin);
                    if (fnName) {
                        if (first) {
                            protectPropertys.forEach(function (prop) {
                                protectObj[prop] = base[prop];
                            });
                            first = false;
                        }
                        mixin.call(base);
                        for (var pro in protectObj) {
                            if (protectObj[pro] != base[pro]) throw new Error("the property of [" + pro + "] in [" + fnName + "] class is a keyword and can't be rewritten.");
                        }
                    } else {
                        mixin.call(base);
                    }
                    base.mixedIn.push(mixin);

                    /** end  **/
                }
            });
        }

        window.c_manager.compose = {
            mixin: mixin,
            unlockProperty: unlockProperty
        };
    })();

/**
    advice.js
*/
    ; (function (undefined) {
        var compose = window.c_manager.compose;
        var advice = {
            around: function (base, wrapped) {
                return function composedAround() {
                    // unpacking arguments by hand benchmarked faster
                    var i = 0, l = arguments.length, args = new Array(l + 1);
                    args[0] = base.bind(this);
                    for (; i < l; i++) args[i + 1] = arguments[i];

                    return wrapped.apply(this, args);
                }
            },

            before: function (base, before) {
                var beforeFn = (typeof before == 'function') ? before : before.obj[before.fnName];
                return function composedBefore() {
                    beforeFn.apply(this, arguments);
                    return base.apply(this, arguments);
                }
            },

            after: function (base, after) {
                var afterFn = (typeof after == 'function') ? after : after.obj[after.fnName];
                return function composedAfter() {
                    var res = (base.unbound || base).apply(this, arguments);
                    afterFn.apply(this, arguments);
                    return res;
                }
            },

            // a mixin that allows other mixins to augment existing functions by adding additional
            // code before, after or around.
            withAdvice: function () {
                ['before', 'after', 'around'].forEach(function (m) {
                    this[m] = function (method, fn) {

                        compose.unlockProperty(this, method, function () {
                            if (typeof this[method] == 'function') {
                                return this[method] = advice[m](this[method], fn);
                            } else {
                                return this[method] = fn;
                            }
                        });

                    };
                }, this);
            }
        };

        window.c_manager.advice = advice;
    })();

/**
    registry.js
*/
    ; (function (undefined) {

        function parseEventArgs(instance, args) {
            var element, type, callback;
            var end = args.length;

            if (typeof args[end - 1] === 'function') {
                end -= 1;
                callback = args[end];
            }

            if (typeof args[end - 1] === 'object') {
                end -= 1;
            }

            if (end == 2) {
                element = args[0];
                type = args[1];
            } else {
                element = instance.node;
                type = args[0];
            }

            return {
                element: element,
                type: type,
                callback: callback
            };
        }

        function matchEvent(a, b) {
            return (
              (a.element == b.element) &&
              (a.type == b.type) &&
              (b.callback == null || (a.callback == b.callback))
            );
        }

        function Registry() {

            var registry = this;

            (this.reset = function () {
                this.components = [];
                this.allInstances = {};
                this.events = [];
            }).call(this);

            function ComponentInfo(component) {
                this.component = component;
                this.attachedTo = [];
                this.instances = {};

                this.addInstance = function (instance) {
                    var instanceInfo = new InstanceInfo(instance);
                    this.instances[instance.identity] = instanceInfo;
                    this.attachedTo.push(instance.node);

                    return instanceInfo;
                }

                this.removeInstance = function (instance) {
                    delete this.instances[instance.identity];
                    var indexOfNode = this.attachedTo.indexOf(instance.node);
                    (indexOfNode > -1) && this.attachedTo.splice(indexOfNode, 1);

                    if (!Object.keys(this.instances).length) {
                        //if I hold no more instances remove me from registry
                        registry.removeComponentInfo(this);
                    }
                }

                this.isAttachedTo = function (node) {
                    return this.attachedTo.indexOf(node) > -1;
                }
            }

            function InstanceInfo(instance) {
                this.instance = instance;
                this.events = [];

                this.addBind = function (event) {
                    this.events.push(event);
                    registry.events.push(event);
                };

                this.removeBind = function (event) {
                    for (var i = 0, e; e = this.events[i]; i++) {
                        if (matchEvent(e, event)) {
                            this.events.splice(i, 1);
                        }
                    }
                }
            }

            this.addInstance = function (instance) {
                var component = this.findComponentInfo(instance);

                if (!component) {
                    component = new ComponentInfo(instance.constructor);
                    this.components.push(component);
                }

                var inst = component.addInstance(instance);

                this.allInstances[instance.identity] = inst;

                return component;
            };

            this.removeInstance = function (instance) {
                var index, instInfo = this.findInstanceInfo(instance);

                //remove from component info
                var componentInfo = this.findComponentInfo(instance);
                componentInfo && componentInfo.removeInstance(instance);

                //remove from registry
                delete this.allInstances[instance.identity];
            };

            this.removeComponentInfo = function (componentInfo) {
                var index = this.components.indexOf(componentInfo);
                (index > -1) && this.components.splice(index, 1);
            };

            this.findComponentInfo = function (which) {
                //var component = which.attachTo ? which : which.constructor;
                var component = which.teardownAll ? which : which.constructor; // 由于去掉了attachTo方法

                for (var i = 0, c; c = this.components[i]; i++) {
                    if (c.component === component) {
                        return c;
                    }
                }

                return null;
            };

            this.findInstanceInfo = function (instance) {
                return this.allInstances[instance.identity] || null;
            };

            this.findInstanceInfoByNode = function (node) {
                var result = [];
                Object.keys(this.allInstances).forEach(function (k) {
                    var thisInstanceInfo = this.allInstances[k];
                    if (thisInstanceInfo.instance.node === node) {
                        result.push(thisInstanceInfo);
                    }
                }, this);
                return result;
            };

            this.on = function (componentOn) {
                var instance = registry.findInstanceInfo(this), boundCallback;

                // unpacking arguments by hand benchmarked faster
                var l = arguments.length, i = 1;
                var otherArgs = new Array(l - 1);
                for (; i < l; i++) otherArgs[i - 1] = arguments[i];

                // change by hualei5280 
                // support the common delegete function: 
                // e.g. this.on('click', '.c-p-next', commonFunc)
                if (otherArgs.length == 3 && this.$node.find(otherArgs[1]).length) {
                    var key = '_delegate' + otherArgs[1], obj = {};
                    this.attr[key] = otherArgs[1];
                    obj[key] = otherArgs[2];
                    otherArgs = [otherArgs[0], obj];
                }


                if (instance) {
                    boundCallback = componentOn.apply(null, otherArgs);
                    if (boundCallback) {
                        otherArgs[otherArgs.length - 1] = boundCallback;
                    }
                    var event = parseEventArgs(this, otherArgs);
                    instance.addBind(event);
                }
            };

            this.off = function (el, type, callback) {
                var event = parseEventArgs(this, arguments),
                    instance = registry.findInstanceInfo(this);

                if (instance) {
                    instance.removeBind(event);
                }

                //remove from global event registry
                for (var i = 0, e; e = registry.events[i]; i++) {
                    if (matchEvent(e, event)) {
                        registry.events.splice(i, 1);
                    }
                }
            };

            //debug tools may want to add advice to trigger
            //registry.trigger = new Function;

            this.teardown = function () {
                registry.removeInstance(this);
            };

            this.withRegistration = function () {
                this.before('initialize', function () {
                    registry.addInstance(this);
                });

                this.around('on', registry.on);
                this.after('off', registry.off);
                //debug tools may want to add advice to trigger
                //window.DEBUG && DEBUG.enabled && this.after('trigger', registry.trigger);
                this.after('teardown', { obj: registry, fnName: 'teardown' });
            };
        }

        window.c_manager.registry = new Registry;
    })();

/**
    component.js
*/
    ; (function (undefined) {
        var advice = window.c_manager.advice,
            utils = window.c_manager.utils,
            compose = window.c_manager.compose,
            registry = window.c_manager.registry;

        var functionNameRegEx = /function (.*?)\s?\(/;
        var componentId = 0;

        function teardownInstance(instanceInfo) {
            instanceInfo.events.slice().forEach(function (event) {
                var args = [event.type];

                event.element && args.unshift(event.element);
                (typeof event.callback == 'function') && args.push(event.callback);

                this.off.apply(this, args);
            }, instanceInfo.instance);
        }


        function teardown() {
            teardownInstance(registry.findInstanceInfo(this));
        }

        //teardown for all instances of this constructor
        function teardownAll() {
            var componentInfo = registry.findComponentInfo(this);

            componentInfo && Object.keys(componentInfo.instances).forEach(function (k) {
                var info = componentInfo.instances[k];
                info.instance.teardown();
            });
        }


        //common mixin allocates basic functionality - used by all component prototypes
        //callback context is bound to component
        function withBaseComponent() {

            // delegate trigger, bind and unbind to an element
            // if $element not supplied, use component's node
            // other arguments are passed on
            // event can be either a string specifying the type
            // of the event, or a hash specifying both the type
            // and a default function to be called.
            this.trigger = function () {
                var $element, type, data, event, defaultFn;
                var lastIndex = arguments.length - 1, lastArg = arguments[lastIndex];

                if (typeof lastArg != "string" && !(lastArg && lastArg.defaultBehavior)) {
                    lastIndex--;
                    data = lastArg;
                }

                if (lastIndex == 1) {
                    $element = $(arguments[0]);
                    event = arguments[1];
                } else {
                    $element = this.$node;
                    event = arguments[0];
                }

                if (event.defaultBehavior) {
                    defaultFn = event.defaultBehavior;
                    event = $.Event(event.type);
                }

                type = event.type || event;

                if (typeof this.attr.eventData === 'object') {
                    data = $.extend(true, {}, this.attr.eventData, data);
                }

                $element.trigger((event || type), data);

                if (defaultFn && !event.isDefaultPrevented()) {
                    (this[defaultFn] || defaultFn).call(this);
                }

                return $element;
            };

            this.on = function () {
                var $element, type, callback, originalCb;
                var lastIndex = arguments.length - 1, origin = arguments[lastIndex];

                if (typeof origin == "object") {
                    //delegate callback
                    originalCb = utils.delegate(
                    //this.resolveDelegateRules(origin)
                    resolveDelegateRules.call(this, origin)
                    );
                } else {
                    originalCb = origin;
                }

                if (typeof originalCb != 'function' && typeof originalCb != 'object') {
                    throw new Error("Unable to bind to '" + type + "' because the given callback is not a function or an object");
                }

                callback = originalCb.bind(this);
                callback.target = originalCb;

                // if the original callback is already branded by jQuery's guid, copy it to the context-bound version
                if (originalCb.guid) {
                    callback.guid = originalCb.guid;
                }

                if (lastIndex == 2) {
                    $element = $(arguments[0]);
                    type = arguments[1];
                } else {
                    $element = this.$node;
                    type = arguments[0];
                }

                $element.on(type, callback);

                // get jquery's guid from our bound fn, so unbinding will work
                originalCb.guid = callback.guid;

                return callback;
            };

            this.off = function () {
                var $element, type, callback;
                var lastIndex = arguments.length - 1;

                if (typeof arguments[lastIndex] == "function") {
                    callback = arguments[lastIndex];
                    lastIndex -= 1;
                }

                if (lastIndex == 1) {
                    $element = $(arguments[0]);
                    type = arguments[1];
                } else {
                    $element = this.$node;
                    type = arguments[0];
                }

                return $element.off(type, callback);
            };

            var resolveDelegateRules = function (ruleInfo) {  // 改为私有函数，减少公开方法
                //this.resolveDelegateRules = function (ruleInfo) {
                var rules = {};
                Object.keys(ruleInfo).forEach(function (r) {
                    if (!(r in this.attr)) {
                        throw new Error('Component "' + this.toString() + '" wants to listen on "' + r + '" but no such attribute was defined.');
                    }
                    rules[this.attr[r]] = ruleInfo[r];
                }, this);
                return rules;
            };

            this.defaultAttrs = function (defaults) {
                utils.push(this.defaults, defaults, true) || (this.defaults = defaults);
            };

            this.select = function (attributeKey) {
                return this.$node.find(this.attr[attributeKey]);
            };

            /* start 增加读写属性方法 -- by: hualei5280 */
            this.getAttr = function (attr) {
                return this.attr[attr];
            }
            this.setAttr = function (opt) {
                var len = arguments.length;
                if (len == 1) {
                    if (typeof opt !== 'object') return;
                    $.extend(true, this.attr, opt);
                } else if (len == 2) {
                    var key = arguments[0],
                        val = arguments[1];
                    if (typeof key !== 'string') return;
                    this.attr[key] = val;
                }
            }
            /* end  增加读写属性方法 -- by: hualei5280 */

            this.initialize = $.noop;
            this.teardown = teardown;
        }



        // define the constructor for a custom component type
        // takes an unlimited number of mixin functions as arguments
        // typical api call with 3 mixins: define(timeline, withTweetCapability, withScrollCapability);
        function define(/*mixins*/) {
            // unpacking arguments by hand benchmarked faster
            var l = arguments.length;
            var mixins = new Array(l + 3); //add three for common mixins
            for (var i = 0; i < l; i++) mixins[i] = arguments[i];

            Component.toString = function () {
                var prettyPrintMixins = mixins.map(function (mixin) {
                    if (mixin.name == null) {
                        //function name property not supported by this browser, use regex
                        var m = mixin.toString().match(functionNameRegEx);
                        return (m && m[1]) ? m[1] : "";
                    } else {
                        return (mixin.name != "withBaseComponent") ? mixin.name : "";
                    }
                }).filter(Boolean).join(', ');
                return prettyPrintMixins;
            };


            function Component(node) {

                var $node = $(node),
                    len = $node.length;
                if (!len) {
                    throw new Error("Component needs a node");
                }

                this.node = $node[0];
                if (len > 1) {
                    this.$node = $($node[0]);
                } else {
                    this.$node = $node;
                }

                var componentInfo = registry.findComponentInfo(this);
                if (componentInfo && componentInfo.isAttachedTo(this.node)) return;

                // unpacking arguments by hand benchmarked faster
                var l = arguments.length;
                var args = new Array(l - 1);
                for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

                var options = utils.merge.apply(utils, args) || {};

                this.identity = componentId++;


                this.toString = Component.toString;

                //merge defaults with supplied options
                //put options in attr.__proto__ to avoid merge overhead
                var attr = Object.create(options);
                for (var key in this.defaults) {
                    if (!options.hasOwnProperty(key)) {
                        attr[key] = this.defaults[key];
                    }
                }
                this.attr = attr;

                /* //去掉此处，让属性值可以为null
                Object.keys(this.defaults || {}).forEach(function (key) {
                    if (this.defaults[key] === null && this.attr[key] === null) {
                        throw new Error('Required attribute "' + key + '" not specified in attachTo for component "' + this.toString() + '".');
                    }
                }, this);
                */
                this.initialize.call(this, options);
            }

            Component.teardownAll = teardownAll;

            mixins.unshift(withBaseComponent, advice.withAdvice, registry.withRegistration);
            compose.mixin(Component.prototype, mixins);

            return Component;
        }

        define.teardownAll = function () {
            registry.components.slice().forEach(function (c) {
                c.component.teardownAll();
            });
            registry.reset();
        };

        window.c_manager.defineComponent = define;

    })();

})()