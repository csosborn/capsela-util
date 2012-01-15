/*!
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
 *
 * Author: Seth Purcell
 * Date: 10/18/11
 */

"use strict";

var SafeStream = require('capsela-util').SafeStream;
var Pipe = require('capsela-util').Pipe;

module.exports['basics'] = {

    "test nominal": function(test) {

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        test.equal(s.on('data', function(chunk) {
            test.equal(chunk, 'oh yeah');
            test.done();
        }), s);

        // send some data
        pipe.write('oh yeah');
    },

    "test shout after data": function(test) {

        test.expect(3);

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        s.on('error', function(err) {
            test.equal(err.message, "you missed the boat");
        });

        // send some data
        pipe.write('oh yeah');

        s.on('data', function() {});
        s.on('end', function() {});
        s.on('error', function() {});
        
        test.done();
    },

    "test shout after end": function(test) {
        
        test.expect(3);

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        s.on('error', function(err) {
            test.equal(err.message, "you missed the boat");
        });

        pipe.end();

        s.on('data', function() {});
        s.on('end', function() {});
        s.on('error', function() {});

        test.done();
    },

    "test shout after error": function(test) {

        test.expect(4);

        var pipe = new Pipe();
        var s = new SafeStream(pipe);
        var count = 0;

        s.on('error', function(err) {

            if (count == 0) {
                test.equal(err.message, "forced error");
            }
            else {
                test.equal(err.message, "you missed the boat");
            }

            count++;
        });

        // the error should be passed through
        pipe.emit('error', new Error('forced error'));

        s.on('data', function() {});
        s.on('end', function() {});
        s.on('error', function() {});

        test.done();
    },

    "test pause/resume": function(test) {

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        test.ok(!pipe.paused);
        test.ok(!s.paused);
        s.pause();
        test.ok(pipe.paused);
        test.ok(s.paused);
        s.resume();
        test.ok(!pipe.paused);
        test.ok(!s.paused);

        test.done();
    },

    "test end": function(test) {

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        pipe.end = function() {
            test.done();
        };

        s.end();
    },

    "test write": function(test) {

        var pipe = new Pipe();
        var s = new SafeStream(pipe);

        pipe.write = function(data, encoding) {
            test.equal(data, 'hi there');
            test.equal(encoding, 'utf8');
            test.done();
        };

        s.write('hi there', 'utf8');
    }
};