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
 * Author: Chris Osborn
 * Date: 4/4/11
 */

"use strict";

var Q = require('q');
var crypto = require('crypto');
var Pipe = require('./Pipe').Pipe;

/**
 * @namespace
 * @name StreamUtil
 */

///////////////////////////////////////////////////////////////////////////////
/**
 * Returns true if the arguments are byte-for-byte equal. Each arg can be a
 * buffer, stream, or promise for a buffer or stream.
 *
 * @memberOf StreamUtil
 * 
 * @param {mixed} left
 * @param {mixed} right
 *
 * @param promise   boolean
 */
function equal(left, right) {

    return Q.all([
        hashAnything(left, 'sha1'),
        hashAnything(right, 'sha1')
    ]).spread(
        function(hash1, hash2) {
            return hash1 == hash2;
        }
    );
}

exports.equal = equal;

///////////////////////////////////////////////////////////////////////////////
/**
 * Takes a string, buffer, stream, or a promise for any of the above and
 * returns its hash.
 * 
 * @memberOf StreamUtil
 *
 * @param {object} obj
 * @param {string} algorithm
 *
 * @return {string}
 */
function hashAnything(obj, algorithm) {

    if (Q.isPromise(obj)) {
        return obj.then(
            function(result) {
                return hashAnything(result, algorithm);
            }
        )
    }
    
    var hash = crypto.createHash(algorithm);

    if (typeof obj == 'string' || Buffer.isBuffer(obj)) {
        hash.update(obj);
        return hash.digest();
    }

    // looks like we were given a stream

    var def = Q.defer();
    
    obj.on('data', function(chunk) {
        hash.update(chunk);
    });

    obj.on('end', function() {
        def.resolve(hash.digest());
    });

    // a stream error results in rejection
    obj.on('error', def.reject);

    // in case it's been paused
    obj.resume();

    return def.promise;
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Buffers a readable stream and returns the complete data
 * (or error) in a callback.
 * 
 * @memberOf StreamUtil
 *
 * @deprecated use {@link Pipe.buffer()} instead
 * @param stream a readable stream
 * @return promise of buffer
 */

function buffer(stream) {
    return Pipe.buffer(stream);
}

exports.buffer = buffer;
