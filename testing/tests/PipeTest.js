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
 *
 * Author: Seth Purcell
 * Date: 8/8/11
 */

"use strict";

var testCase = require('nodeunit').testCase;
var Pipe = require('capsela-util').Pipe;
var StreamUtil = require('capsela-util').StreamUtil;

module.exports['basics'] = testCase({

    "test write/end no encoding": function(test) {

        var pipe = new Pipe();
        var data = '';

        pipe.on('data', function(chunk) {
            test.equal(typeof chunk, 'object');
            data += chunk;
        });

        pipe.on('end', function() {
            test.equal(data, "this-is-how-we-do-it");
            test.done();
        });

        pipe.write('this-is-how');

        process.nextTick(function() {

            pipe.write('-we-do-it');
            pipe.end();
        });
    },

    "test write string": function(test) {

        var pipe = new Pipe();
        var expected = new Buffer('hello there', 'ascii');

        pipe.on('data', function(chunk) {
            test.equal(typeof chunk, 'object');
            StreamUtil.equal(chunk, expected).then(
                function(result) {
                    test.ok(result);
                    test.done();
                }
            )
        });

        pipe.write('hello there', 'ascii');
    },

    "test with encoding": function(test) {

        var pipe = new Pipe();
        pipe.setEncoding('ascii'); // determines how data event chunks appear

        pipe.on('data', function(chunk) {
            test.equal(typeof chunk, 'string');
            test.strictEqual(chunk, 'hello there');
            test.done();
        });

        pipe.write('aGVsbG8gdGhlcmU=', 'base64');
    },

    "test recording": function(test) {

        var pipe = new Pipe();

        pipe.write('it matters not'); // should be lost, since getData not yet called

        pipe.getData().then(
            function(data) {
                test.equal(data, 'how strait the gate\nnor how charged')
                test.ok(Buffer.isBuffer(data));
                test.done();
            }
        ).end();

        pipe.write('how strait the gate\n');
        pipe.end('nor how charged');
    },

    "test getData with encoding": function(test) {

        var pipe = new Pipe();

        pipe.write('it matters not'); // should be lost, since getData not yet called

        pipe.getData('utf8').then(
            function(data) {
                test.equal(data, 'how strait the gate\nnor how charged')
                test.ok(typeof data == 'string');
                test.ok(!Buffer.isBuffer(data));
                test.done();
            }
        ).end();

        pipe.write('how strait the gate\n');
        pipe.end('nor how charged')
    }
});

module.exports['buffering'] = testCase({

    "test buffer with error": function(test) {

        var input = new Pipe();

        Pipe.buffer(input).then(
            null,
            function(err) {
                test.equal(err.message, 'horse changed in mid-stream');
                test.done();
            }
        ).end();

        input.emit('error', new Error('horse changed in mid-stream'));
    },

    "test buffer with no data": function(test) {

        var input = new Pipe();

        Pipe.buffer(input).then(
            function(data) {
                test.ok(Buffer.isBuffer(data));
                test.equal(data.length, 0);
                test.done();
            }
        );

        // we used to call this an error

//        Pipe.buffer(input).then(
//            null,
//            function(err) {
//                test.equal(err.message, 'no data received');
//                test.done();
//            }
//        );

        input.end();
    },

    "test buffer paused stream": function(test) {

        var input = new Pipe();

        input.pause();

        input.write('it matters not');
        input.end();

        Pipe.buffer(input).then(
            function(data) {
                test.equal(data, 'it matters not');
                test.ok(Buffer.isBuffer(data));
                test.done();
            }
        ).end();
    },

    "test buffer with encoding": function(test) {

        var input = new Pipe();

        input.pause();

        input.write('it matters not');
        input.end();

        Pipe.buffer(input, 'utf8').then(
            function(data) {
                test.equal(data, 'it matters not');
                test.equal(typeof data, "string");
                test.ok(!Buffer.isBuffer(data));
                test.done();
            }
        ).end();
    }
});

module.exports['pause/resume'] = testCase({

    "test pause/resume": function(test) {

        var pipe = new Pipe();

        pipe.pause();

        pipe.write("we are the music makers");
        pipe.write("and we are the dreamers of the dreams");
        pipe.end();

        pipe.once('data', function(chunk) {

            pipe.pause();

            test.equal(chunk.toString('utf8'), "we are the music makers");

            pipe.once('data', function(chunk) {

                pipe.pause();

                test.equal(chunk.toString('utf8'), "and we are the dreamers of the dreams");

                pipe.on('end', function() {
                    test.done();
                });


                process.nextTick(function() {
                    pipe.resume();
                });
            });

            process.nextTick(function() {
                pipe.resume();
            });
        });

        pipe.resume();
    }
});