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
 * Date: 7/19/11
 */

"use strict";

var Log = require('capsela-util').Log;
var Pipe = require('capsela-util').Pipe;
var mp = require('capsela-util').MonkeyPatcher;
var Logger = require('capsela-util').Logger;

module.exports = {

    setUp: mp.setUp,
    tearDown: mp.tearDown,

    "test write event": function(test) {

        test.expect(1);

        mp.patch(Date, 'now', function() {
            return 27000;
        });

        var log = new Log();

        log.writeEvent(Log.INFO, "this is a test", {
            write: function(data) {
                test.equal(data, "1969-12-31 19:00:27 INFO: this is a test\n");
            }
        });

        test.done();
    },

    "test watch": function(test) {

        test.expect(2);

        var log = new Log();
        var logger = new Logger();

        log.log = function(priority, message) {
            test.equal(priority, Log.INFO);
            test.equal(message, 'this is a test');
        }

        log.watch(logger);

        logger.log(Log.INFO, 'this is a test');

        test.done();
    }
};