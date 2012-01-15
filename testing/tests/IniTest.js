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
 * Date: Feb 10, 2011
 */

"use strict";

//var assert = require('assert');
//var testbench = require('../../TestBench');

var ini = require('capsela-util').Ini;
var fs = require('fs');

exports["test merge"] = function(test) {

    var mergeTarget = {
        bedtime: "8 o'clock",
        alpha: 245,
        beta: "7:30",
        gamma: {x: 'yes', y: 'no'},
        zip: {code: 10002, line: 275}
    };

    var mergePayload = {
        bedtime: "7 o'clock",
        alpha: {channel: 23, sheet: 54},
        zip: {code: {shout: "yabba-dabba-doo"}, tie: 475},
        gamma: 'maybe',
        monkeys: 1000000
    };

    ini.merge(mergeTarget, mergePayload);

    test.equal(mergeTarget.bedtime, "7 o'clock");
    test.deepEqual(mergeTarget.alpha, {channel: 23, sheet: 54});
    test.equal(mergeTarget.beta, "7:30");
    test.equal(mergeTarget.gamma, "maybe");
    test.deepEqual(mergeTarget.zip, {code: {shout: "yabba-dabba-doo"}, line: 275, tie: 475});
    test.equal(mergeTarget.monkeys, 1000000);

    test.done();
};

exports["test parse no sections"] = function(test) {

    var testData =
"bedtime = 8 o'clock\n\
zip.code = 10002";

    var result = ini.parse(testData);
    
    test.equal(result.bedtime, "8 o'clock");
    test.ok(result.zip.code === 10002);
    test.equal(10003, result.zip.code + 1);
    test.done();
};

exports["test parse numbers"] = function(test) {

    var testData =
"[general]\n\
days_this_week = 7\n\
days_last_week =  07\n\
days_next_week =  7.00000\n\
days_till_xmas =  -54\n\
days_till_bday =  7 days\n\
days_in_month = which month?\n";

    var result = ini.parse(testData).general;

    test.ok(result.days_this_week === 7);
    test.equal(8, result.days_this_week + 1);

    test.ok(result.days_last_week === 7);
    test.ok(result.days_next_week === 7);
    test.ok(result.days_till_xmas === -54);
    test.ok(result.days_till_bday === "7 days");
    test.ok(result.days_in_month === "which month?");

    test.done();
};

exports["test parse multi section"] = function(test) {

    var testData =
"[general]\n\
pool.width = 7\n\
pool.length = 17\n\
circumference = 32\n\
[production : general]\n\
pool.width = 8\n\
[development]\n\
pool.depth = 5\n\
[testing : production]\n\
pool.width = 18\n";

    var expected = {
        general: {
            pool: {width: 7, length: 17},
            circumference: 32
        },
        production: {
            pool: {width: 8, length: 17},
            circumference: 32
        },
        development: {
            pool: {depth: 5}
        },
        testing: {
            pool: {width: 18, length: 17},
            circumference: 32
        }
    };

    test.deepEqual(ini.parse(testData), expected);

    test.done();
};

exports["test parse file success"] = function(test) {

    ini.parseFile(__dirname + '/../fixtures/config.ini', function(err, result) {

        test.ok(err == null);

        fs.readFile(__dirname + '/../fixtures/config.json', null, function(err, data) {
            test.ok(err == null);
            test.deepEqual(result, JSON.parse(data));
            test.done();
        });
    });

};
exports["test parse file failure"] = function(test) {

    ini.parseFile(__dirname + '/../fixtures/broken.ini', function(err, result) {
        test.ok(err);
        test.done();
    });

};