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
 * Date: Feb 17, 2011
 */

"use strict";

/*
 * syslog-compatible logging
 * 
 * what rolls downstairs
 * alone or in pairs
 * and over the neighbor's dog?
 */

var Class = require('./Class').Class;
var EventEmitter = require ('events').EventEmitter;

// should catch everything except absolute length limit
var hostnameValidator = /^[\w\d]([-\w\d]{0,61}[\w\d])?(\.[\w\d]([-\w\d]{0,61}[\w\d])?)*$/;

/*
 * from RFC 5424
 *
 * 0       Emergency: system is unusable
 * 1       Alert: action must be taken immediately
 * 2       Critical: critical conditions
 * 3       Error: error conditions
 * 4       Warning: warning conditions
 * 5       Notice: normal but significant condition
 * 6       Informational: informational messages
 * 7       Debug: debug-level messages
 */

// poor man's enum
var priorities = [
        'EMERGENCY',
        'ALERT',
        'CRITICAL',
        'ERROR',
        'WARNING',
        'NOTICE',
        'INFO',
        'DEBUG'
    ];

/** @class */
var Log = Class.extend(
/** @lends Log */ {

    mixin: EventEmitter,

    EMERGENCY:  0,
    ALERT:      1,
    CRITICAL:   2,
    ERROR:      3,
    WARNING:    4,
    NOTICE:     5,
    INFO:       6,
    DEBUG:      7
},
/** @lends Log# */ {

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Logs the given message with the specified priority.
     * 
     * @param priority
     * @param message
     */
    log: function(priority, message) {

        if (priority < 5) {
            this.writeEvent(priority, message, process.stderr);
        }
        else {
            this.writeEvent(priority, message, process.stdout);
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Watches the given logger and logs all of its log messages.
     *
     * @param {Logger} logger
     */
    watch: function(logger) {
        logger.on('log', this.log);
    },
        
    ////////////////////////////////////////////////////////////////////////////
    /**
     * Formats the given log event and writes it to the given stream.
     *
     * @param {Logger} logger
     */
    writeEvent: function(priority, message, stream) {

        var d = new Date(Date.now());
        var p = priorities[priority];

        function pad(n){return n<10 ? '0'+n : n}

        var timestamp = d.getFullYear()+'-'
            + pad(d.getMonth()+1)+'-'
            + pad(d.getDate())+' '
            + pad(d.getHours())+':'
            + pad(d.getMinutes())+':'
            + pad(d.getSeconds());

        stream.write(timestamp + " " + p + ": " + message);
    }
});

exports.Log = Log;