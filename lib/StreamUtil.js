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
 * Author: Chris Osborn
 * Date: 4/4/11
 */

"use strict";

var Q = require('qq');

/**
 * Buffers a readable stream and returns the complete data
 * (or error) in a callback.
 * @param stream a readable stream
 * @return promise of buffer
 */

function bufferStream(stream) {

    var def = Q.defer();

    var totalSize = 0;
    var buffs = [];

    stream.on('data', function(data) {
        buffs.push(data);
        totalSize += data.length;
    });

    stream.on('end', function() {
        switch (buffs.length) {
            case 0:
                // stream end encountered with no data events; this is an error
                var err = new Error('no data received');
                def.reject(err);
                break;

            case 1:
                // just a single buffer, so no concatenation needed
                def.resolve(buffs[0]);
                break;

            default:
                // multiple buffers that need to be fused together
                var fusion = new Buffer(totalSize);
                var buff;
                var offset = 0;
                while (buff = buffs.shift()) {
                    buff.copy(fusion, offset);
                    offset += buff.length;
                }
                def.resolve(fusion);
                break;
        }
    });
    
    stream.on('error', function(err) {
        def.reject(err);
    });

    stream.resume();

    return def.promise;
}

exports.bufferStream = bufferStream;

/**
 * Returns true if the buffers are byte-for-byte equal
 *
 * @param a
 * @param b
 */
function equal(a, b) {

    if (a.length !== b.length) {
        return false;
    }

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

exports.equal = equal;