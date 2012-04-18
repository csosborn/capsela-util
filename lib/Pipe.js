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
 * Date: 4/23/11
 */

"use strict";

var Class = require('./Class').Class;

var EventEmitter = require ('events').EventEmitter;
var util = require('util');
var Q = require('q');

var Pipe = Class.extend(
/** @lends Pipe */ {

    mixin: EventEmitter,

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for a buffer or a string containing all the data
     * written to the given stream.
     *
     * @static
     * 
     * @param {stream} stream
     * @param {string} encoding  optional encoding to return the data as a string
     *
     * @return {promise}
     */
    buffer: function(stream, encoding) {

        var pipe = new Pipe(true);

        stream.on('error', function(err) {
            pipe.done.reject(err);
        });

        util.pump(stream, pipe);

        stream.resume();

        return pipe.getData(encoding);
    }
},
/** @lends Pipe# */ {
    ////////////////////////////////////////////////////////////////////////////
    /**
     * @constructs
     * @method init
     * @param {boolean} record    if true, will record all data sent through the pipe
     */
    init: function(record) {

        // flag defined in WritableStream interface
        this.writable = true;

        this.paused = false;
        this.queue = [];
        this.done = Q.defer();
        this.recording = record;
        this.chunks = [];
    },

    /////////////////////////////////////////////////////////////////////////////
    /**
     * Pauses the readstream.
     * 
     * @method pause
     */
    pause: function() {
        this.paused = true;
    },

    ////////////////////////////////////////////////////////////////////////////

    resume: function() {
        this.paused = false;
        this.fire();
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param {event} event
     * @param arg
     */
    enqueue: function(event, arg) {

        this.queue.push({name: event, arg: arg});
        this.fire();
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Fires the next event in the event queue. Will keep firing until paused
     * or the queue is emptied.
     */
    fire: function() {

        while (this.queue.length > 0 && !this.paused) {
            
            var event = this.queue.shift();
            this.emit(event.name, event.arg);
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * 
     * @param chunk
     * @param encoding
     */
    write: function(chunk, encoding) {

        if (!this.writable) {
            throw new Error("can't write to pipe after end()");
        }

        // convert to buffer if necessary
        if (typeof chunk == 'string') {
            chunk = new Buffer(chunk, encoding);
        }

        if (this.recording) {
            this.chunks.push(chunk);
        }

        this.enqueue('data', this.encoding ? chunk.toString(this.encoding) : chunk);
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

        // writable flag becomes false after end()
        this.writable = false;
        
        this.enqueue('end');

        if (this.recording) {
            
            switch (this.chunks.length) {

                case 0:
                    // stream end encountered with no data events
//                    var err = new Error('no data received');
//                    this.done.reject(err);
                    this.done.resolve(new Buffer(0));
                    break;

                case 1:
                    // just a single buffer, so no concatenation needed
                    this.done.resolve(this.chunks[0]);
                    break;

                default:
                    // multiple buffers that need to be fused together

                    var result;
                    var totalSize = 0;

                    this.chunks.forEach(function(chunk) {
                        totalSize += chunk.length;
                    });

                    result = new Buffer(totalSize);
                    var buff;
                    var offset = 0;

                    while (buff = this.chunks.shift()) {
                        buff.copy(result, offset);
                        offset += buff.length;
                    }

                    this.done.resolve(result);
                    break;
            }
        }
    },

    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a promise for the pipe's data, resolved when end() is called
     * on the pipe.
     *
     * @param encoding  optional encoding to return data as a string
     */
    getData: function(encoding) {

        this.recording = true;

        if (encoding) {
            return this.done.promise.then(
                function(buffer) {
                    return buffer.toString(encoding);
                }
            )
        }
        
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
        this.writable = false;
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
        return destination;
    }
});

exports.Pipe = Pipe;