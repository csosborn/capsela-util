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

var Class = require('capsela-util').Class;

var A = Class.extend({
    staticOnA: function() {
        return 'A!';
    },
    staticInitCalls: 0,
    init: function() {
        this.staticInitCalls++;
    },
    extensions: [],
    extended: function(subclass) {
        this.extensions.push(subclass);
    }
},
{
    init: function() {
        this.aInitRan = true;
    },
    identify: function() {
        return 'A';
    },
    overrideMe: function() {
        return 42;
    },
    'get name': function() {
        return this._name;
    },
    'set name': function(newname) {
        this._name = newname;
    }
});

var B = A.extend(
{},         // this class has no static interface
{
    init: function(arg1, arg2) {
        this.bInitRan = true;
        this.bInitArg1 = arg1;
        this.bInitArg2 = arg2;
    },
    identify: function() {
        return 'B';
    },
    overrideMe: function(multiple) {
        return multiple * 37;
    }
});

var C = B.extend(
null,       // null is also acceptable when there is no static interface
{
    // this class has no init method, and that's fine
    identify: function() {
        return 'C';
    },
    overrideMe: function() {
        return 2 * this._super(3);
    }
});

var Abstract = Class.extend(
null,
{
    doThings: Class.ABSTRACT_METHOD,
    doMoreThings: Class.ABSTRACT_METHOD
});


var LessAbstract = Abstract.extend(
null,
{
    doThings: function() {}
});

var Concrete = LessAbstract.extend(
null,
{
    doMoreThings: function() {}
});


module.exports = {

    'can extend class': function(test) {
        test.expect(12);

        var a = new A();
        var b = new B();
        var c = new C();

        // instanceof should do what we expect, either with reference to
        // the direct parent or indirectly
        test.ok(a instanceof A);
        test.ok(b instanceof A);
        test.ok(b instanceof B);
        test.ok(c instanceof A);
        test.ok(c instanceof B);
        test.ok(c instanceof C);

        test.ok(!A.is_abstract);
        test.ok(!B.is_abstract);
        test.ok(!C.is_abstract);


        test.equals(a.identify(), 'A');
        test.equals(b.identify(), 'B');
        test.equals(c.identify(), 'C');

        test.done();
    },

    'superclass "extended" method called when subclass created': function(test) {
        test.expect(3);

        test.equal(2, A.extensions.length);
        test.equal(B, A.extensions[0]);
        test.equal(C, A.extensions[1]);

        test.done();
    },

    'class can have static methods': function(test) {
        test.expect(3);

        test.ok(typeof A.staticOnA == 'function');
        test.equals(A.staticOnA(), 'A!');

        var a = new A();
        test.ok(typeof a.staticOnA == 'undefined');

        test.done();
    },

    'static methods are inherited': function(test) {
        test.expect(3);

        test.ok(typeof B.staticOnA == 'function');
        test.equals(B.staticOnA(), 'A!');

        var b = new B();
        test.ok(typeof b.staticOnA == 'undefined');

        test.done();
    },

    'static init method runs on definition': function(test) {
        test.expect(1);
        test.equal(1, A.staticInitCalls);
        test.done();
    },

    'instance init method runs on construction': function(test) {
        test.expect(3);
        var a = new A();
        test.ok(a.aInitRan, "a's a init ran");

        var b = new B();
        test.ok(!b.aInitRan, "b's a init didn't run");
        test.ok(b.bInitRan, "b's b init ran");

        test.done();
    },

    'instance init method receives constructor arguments': function(test) {
        test.expect(4);

        var b = new B('monkey', 'squirrel');
        test.equals('monkey', b.bInitArg1);
        test.equals('squirrel', b.bInitArg2);

        var b2 = new B();
        test.ok(typeof b2.bInitArg1 == 'undefined');
        test.ok(typeof b2.bInitArg2 == 'undefined');

        test.done();
    },

    'can instantiate without calling init': function(test) {
        test.expect(4);

        var a = A.instantiate();
        test.ok(a instanceof A);
        test.ok(!a.aInitRan, "a's init didn't run");

        var b = B.instantiate();
        test.ok(b instanceof B);
        test.ok(b instanceof A);

        test.done();
    },

    'subclass can override parent method': function(test) {
        test.expect(2);

        var a = new A();
        var b = new B();

        test.equals(a.overrideMe(2), 42);
        test.equals(b.overrideMe(2), 74);

        test.done();
    },

    'run parent method implementation via _super': function(test) {
        test.expect(1);

        var c = new C();
        test.equals(c.overrideMe(), 222);

        test.done();
    },

    'parent method implementation can be mocked': function(test) {
        test.expect(2);

        var original = B.prototype.overrideMe;

        // provide a mock implementation of B's overrideMe, and make sure
        // that c's call to _super() invokes it.
        B.prototype.overrideMe = function(arg) {
            test.equal(arg, 3);
            return 6;
        };

        var c = new C();
        test.equals(c.overrideMe(), 12);

        B.prototype.overrideMe = original;
        
        test.done();
    },

    'instance has Class attribute': function(test) {
        test.expect(2);

        var a = new A();
        var b = new B();
        test.equals(a.Class, A);
        test.equals(b.Class, B);

        test.done();
    },

    'class has Super attribute': function(test) {
        test.expect(3);

        test.equals(Class, A.Super);
        test.equals(A, B.Super);
        test.equals(B, C.Super);

        test.done();
    },

    'class can inherit EventEmitter as mixin': function(test) {
        test.expect(2);

        var EventEmitter = require('events').EventEmitter;

        var SpecialEvent = Class.extend({
            mixin: EventEmitter
        },
        {
            init: function() {
                this.initRan = true;
            }
        });

        var se = new SpecialEvent();
        test.ok(se.initRan);

        se.on('testevent', function(arg) {
             test.equals('monkeys', arg);
        });
        se.emit('testevent', 'monkeys');

        test.done();
    },

    'class can inherit array of mixins': function(test) {
        test.expect(3);

        var EventEmitter = require('events').EventEmitter;

        function OtherClass() {}
        OtherClass.prototype.bananas = function() {
            return 'yes, bananas';
        };

        var SpecialEvent = Class.extend({
            mixin: [OtherClass, EventEmitter]
        },
        {
            init: function() {
                this.initRan = true;
            }
        });

        var se = new SpecialEvent();
        test.ok(se.initRan);

        // the resulting object should behave like an EventEmitter
        se.on('testevent', function(arg) {
             test.equals('monkeys', arg);
        });
        se.emit('testevent', 'monkeys');

        // it should also behave like an OtherClass instance
        test.equals('yes, bananas', se.bananas());

        test.done();
    },

    'conflicting mixins are not allowed': function(test) {

        function MixinOne() {}
        MixinOne.prototype.rock = function() {};

        function MixinTwo() {}
        MixinTwo.prototype.paper = function() {};

        function MixinThree() {}
        MixinThree.prototype.scissors = function() {};


        test.doesNotThrow(function() {
            var Aggregate = Class.extend({
                mixin: [MixinOne, MixinTwo, MixinThree]
            });

            test.ok(typeof Aggregate.prototype.rock == 'function');
            test.ok(typeof Aggregate.prototype.paper == 'function');
            test.ok(typeof Aggregate.prototype.scissors == 'function');
        });

        MixinTwo.prototype.scissors = function() {};

        test.throws(function() {
            var Aggregate = Class.extend({
                mixin: [MixinOne, MixinTwo, MixinThree]
            });
        }, Error, 'property "scissors" present in two different mixin classes');

        test.done();
    },

    'class with abstract methods is abstract': function(test) {

        // Abstract class should have true is_abstract property, and it should
        // not be writable or enumerable
        test.ok(Abstract.is_abstract === true);

        test.throws(function() {
            Abstract.is_abstract = false;
        });

        for (var prop in Abstract) {
            if (prop == 'is_abstract') {
                test.ok(false, 'is_abstract property should not be enumerable');
            }
        }

        test.ok(LessAbstract.is_abstract);

        test.done();
    },

    'cannot instantiate abstract class': function(test) {
        test.expect(2);

        try {
            new Abstract();
        } catch (e) {
            test.equal('an abstract class cannot be instantiated', e.message);
        }

        try {
            new LessAbstract();
        } catch (e) {
            test.equal('an abstract class cannot be instantiated', e.message);
        }

        test.done();
    },

    'concrete extension of abstract class is not abstract': function(test) {
        test.expect(2);

        test.ok(Concrete.is_abstract === false);

        var concrete = new Concrete();
        test.ok(concrete instanceof Concrete);

        test.done();
    },

    'getter and setter shorthand supported': function(test) {
        var a = new A();
        test.equal(a._name, undefined);
        a.name = 'fred';
        test.equal(a._name, 'fred');
        test.equal(a.name, 'fred');
        a._name = 'fredd';
        test.equal(a.name, 'fredd');

        // make sure the "name" property is non-configurable
        var err;
        try {
            Object.defineProperty(A.prototype, 'name', {
                get: function() { return 'I am a banana!' }
            });
        } catch (e) {
            err = e;
        }
        test.ok(err instanceof TypeError);

        test.done();
    }

};
