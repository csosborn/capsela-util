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
 * Date: 10/18/11
 */

"use strict";

/**
 * wraps a stream to fail loudly if a data event is missed
 */

var Class = require('./Class').Class;

var EventEmitter = require ('events').EventEmitter;
var util = require('util');

var SafeStream = Class.extend({

    mixin: EventEmitter
},
{
    init: function(stream) {

        this.hadEvents = false;
        this.stream = stream;
        var t = this;

        var mark = function() {
            t.hadEvents = true;
        };

        // attach listeners
        this.stream.on('data', mark);
        this.stream.on('end', mark);
        this.stream.on('error', function(err) {
            mark();
            t.emit('error', err);
        });
    },
    
    ////////////////////////////////////////////////////////////////////////////

    on: function(event, cb) {

        // see if the stream has been deflowered

        if (this.hadEvents) {
            this.emit('error', new Error("you missed the boat"));
        }
        else if (event == 'error') {

            // add error listeners to this object
            EventEmitter.prototype.on.apply(this, arguments);
            return this;
        }
        else {
            // add other listeners to the wrapped stream directly
            this.stream.on.apply(this.stream, arguments);
            return this;
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    
    pause: function() {
        this.paused = true;
        return this.stream.pause();
    },

    ////////////////////////////////////////////////////////////////////////////

    resume: function() {
        this.paused = false;
        return this.stream.resume();
    },

    ////////////////////////////////////////////////////////////////////////////

    end: function() {
        return this.stream.end();
    },

    ////////////////////////////////////////////////////////////////////////////

    write: function(data, encoding) {
        return this.stream.write(data, encoding);
    }
});

exports.SafeStream = SafeStream;