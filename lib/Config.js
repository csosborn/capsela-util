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

var sys = require('sys');
var fs = require('fs');
var path = require('path');
var ini = require('./Ini');

exports.load = function(configDirectory, mode) {

    // load the config file first thing, synchronously
    // can reload async later

    if (!mode) {
        throw new Error('mode must be one of development, testing, production');
    }

    var configPath = path.join(configDirectory, 'config.ini');
    var config = ini.parse(fs.readFileSync(configPath, 'utf8'))[mode];

    if (!config) {
        throw new Error('section [' + mode + '] does not exist in ' + configPath);
    }

    config.mode = mode;

    // merge in a local_config.ini if it exists?
    try {
        var localConfigPath = path.join(configDirectory, 'local_config.ini');
        var localConfig = ini.parse(fs.readFileSync(localConfigPath, 'utf8'))[mode];
        ini.merge(config, localConfig);
    }
    catch(err) {
        // guess there isn't one
    }

    return config;
};



