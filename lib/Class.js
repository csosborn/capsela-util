/**
 * Copyright (c) 2011 Sitelier Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

/**
 * Based on "Simple JavaScript Inheritance"
 * Copyright John Resig (http://ejohn.org/) and MIT Licensed.
 * Also borrows some ideas from JavascriptMVC's $.Class.
 */

var skipInit = false;

var fnTest = /xyz/.test(function(){ var xyz; }) ? /\b_super\b/ : /.*/;

/**
 * Utility function used to copy attributes and methods from one prototype
 * to another, setting up _super() methods where a subclass overrides
 * its parent. This is used for both prototype and static inheritance
 * when extending classes.
 * 
 * @param newProps object containing new properties to be added
 * @param oldProps object containing superclass properties to be inherited or overridden
 * @param addTo object to which properties are added
 */
function inheritProps(newProps, oldProps, addTo) {

    var propsToLock = [];

    addTo = addTo || newProps;
    for (var name in newProps) {

        // Check if we're overwriting an existing function
        if (typeof newProps[name] == "function" &&
            typeof oldProps[name] == "function" &&
            fnTest.test(newProps[name])) {

            addTo[name] = (function(name, fn) {
                return function() {
                    var tmp = this._super;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = oldProps[name];

                    // The method only needs to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);

                    // clean up the temporary _super method
                    if (typeof tmp != 'undefined') {
                        this._super = tmp;
                    } else {
                        delete this._super;
                    }
                    return ret;
                };
            })(name, newProps[name]);

        } else {
            // we aren't overriding anything, so just copy from newProps

            // see if the method is shorthand for a getter/setter
            var match = name.match(/(set|get) ([\w\d]+)/);
            if (match) {
                // the new property must be configurable for now, since
                // we might need to add another getter/setter in a subsequent
                // iteration; it will be locked down after the for loop
                var props = { configurable: true };
                props[match[1]] = newProps[name];
                Object.defineProperty(addTo, match[2], props);
                propsToLock.push(match[2]);
            }
            else {
                addTo[name] = newProps[name];
            }
        }
    }

    // make getter/setter properties non-configurable
    var prop;
    while (prop = propsToLock.shift()) {
        Object.defineProperty(addTo, prop, { configurable: false });
    }
}

// The base Class implementation (does nothing)
function Class() {}

Class.ABSTRACT_METHOD = '__CLASS::ABSTRACT_METHOD__';

/**
 * Class derivation.
 * @param protoProps object containing attributes and methods to be added to the derived class's instance interface.
 * @param staticProps object containing attributes and methods to be added to the derived class's static interface.
 * @param mixins array containing Objects whose prototypes should be mixed into the derived class. Mixing in happens
 * sequentially, such that a property of one mixin will be overridden if a later mixin contains a property of the same
 * name.
 */
Class.extend = function(staticProps, protoProps) {

    // set up acceptable defaults
    protoProps = protoProps || {};
    staticProps = staticProps || {};

    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    skipInit = true;
    var prototype = new this();
    skipInit = false;

    var mixins = staticProps.mixin;
    if (mixins) {
        var mixinProps = {};
        if (typeof mixins == 'function') {
            mixins = [mixins];
        }
        
        for (var mi in mixins) {
            var mixin = mixins[mi].prototype;
            for (var prop in mixin) {
                if (typeof mixinProps[prop] == 'undefined') {
                    mixinProps[prop] = mixin[prop];
                } else {
                    throw new Error('property "' + prop +'" present in two different mixin classes');
                }
            }
        }
        
        inheritProps(mixinProps, protoProps, prototype);
    }

    // do instance inheritance (copy the superclass properties, then overlay the new prototype properties, setting
    // up _super() methods where the class being defined overrides its parent)
    inheritProps(protoProps, _super, prototype);

    // The dummy class constructor
    function NewClass() {
        // All construction is actually done in the init method
        if ( !skipInit ) {
            if (this.Class.is_abstract) {
                throw new Error('an abstract class cannot be instantiated');
            }
            if (this.init) {
                this.init.apply(this, arguments);
            }
        }
    }

    // do static inheritance
    inheritProps(this, {}, NewClass);
    inheritProps(staticProps, this, NewClass);


    // determine if the new class is abstract, and mark it accordingly
    var is_abstract = false;
    for (var prop in prototype) {
        if (prototype[prop] == Class.ABSTRACT_METHOD) {
            is_abstract = true;
        }
    }

    Object.defineProperty(NewClass, 'is_abstract',
        {
            value: is_abstract,
            writable: false,
            enumerable: false
        });

    // Populate our constructed prototype object
    NewClass.prototype = prototype;
    
    // Give each instance a way back to its class
    NewClass.prototype.Class = NewClass;

    // Give each class a way back to its superclass
    NewClass.Super = this;

    // Enforce the constructor to be what we expect
    NewClass.constructor = NewClass;

    // Provide a way to instantiate a class without calling its init() constructor.
    NewClass.instantiate = function() {
        skipInit = true;
        var instance = new this();
        skipInit = false;
        return instance;
    };

    // does the class define a static initializer?  now is the time to run it
    if (typeof NewClass.init == 'function') {
        NewClass.init();
    }

    // does this class define an 'extended' hook? if so, call it
    if (typeof this.extended == 'function') {
        this.extended(NewClass);
    }

    return NewClass;
};

exports.Class = Class;