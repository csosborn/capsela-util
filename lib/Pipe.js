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
 * Date: 4/23/11
 */

"use strict";

var Class = require('./Class').Class;

var EventEmitter = require ('events').EventEmitter;
var util = require('util');
var Q = require('qq');

var Pipe = Class.extend({
},
{
    ////////////////////////////////////////////////////////////////////////////
    /**
     *
     * @param buffer    set to true to buffer all input
     */
    init: function(buffer) {
        this.emitter = new EventEmitter();
        this.paused = false;
        this.queue = [];
        this.done = Q.defer();
        this.buffering = buffer;
    },

    ////////////////////////////////////////////////////////////////////////////

    on: function() {
        return this.emitter.on.apply(this.emitter, arguments);
    },

    ////////////////////////////////////////////////////////////////////////////

    addListener: function() {
        return this.emitter.addListener.apply(this.emitter, arguments);
    },

    ////////////////////////////////////////////////////////////////////////////

    removeListener: function() {
        return this.emitter.addListener.apply(this.emitter, arguments);
    },

    ////////////////////////////////////////////////////////////////////////////

    pause: function() {
        this.paused = true;
    },

    ////////////////////////////////////////////////////////////////////////////

    resume: function() {

        // play back the queued events
        while(this.queue.length > 0) {
            var event = this.queue.shift();
            this.emitter.emit(event.name, event.arg);
        }

        this.paused = false;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param event
     * @param arg
     */
    emit: function(event, arg) {

        if (this.paused) {
            this.queue.push({name: event, arg: arg});
        }
        else {
            this.emitter.emit(event, arg);
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param chunk
     * @param encoding
     */
    write: function(chunk, encoding) {

        // convert to buffer if necessary
        if (typeof chunk == 'string') {
            chunk = new Buffer(chunk, encoding);
        }

        if (this.buffering) {

            if (this.buffer == undefined) {
                this.buffer = chunk;
            }
            else {
                // concatenate with buffered content
                var buf = new Buffer(this.buffer.length + chunk.length);
                this.buffer.copy(buf);
                chunk.copy(buf, this.buffer.length);
                this.buffer = buf;
            }
        }

        if (this.encoding) {
            this.emit('data', chunk.toString(this.encoding));
        }
        else {
            this.emit('data', chunk);
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param chunk
     * @param encoding
     */
    end: function(chunk, encoding) {

        if (chunk) {
            this.write(chunk, encoding);
        }
        
        this.emit('end');
        this.done.resolve(this.buffer);
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for the pipe's data, resolved when end() is called
     * on the pipe.
     */
    getData: function() {

        this.buffering = true;
        return this.done.promise;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param encoding
     */
    setEncoding: function(encoding) {
        this.encoding = encoding;
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     */
    destroy: function() {
        // do nothing since Pipe has no underlying file descriptor
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param destination
     * @param options
     */
    pipe: function(destination, options) {
        var end = options && options.end;
        end = end !== false;
        util.pump(this, destination, function(err) {
            if (!err && end) {
                destination.end();
            }
        });
    }
});

exports.Pipe = Pipe;