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

var fs = require('fs');

// ideally these might be compressed into a single regex
var regex = {
    comment: /^\s*;.*$|^\s*$/,
    section: /^\s*\[\s*(\w+)\s*(:\s*(\w+))?\s*\]\s*$/,
    assignment: /^\s*([^\s]+)\s*=\s*['"]?(.*?)['"]?\s*$/
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Parses the specified .ini file and calls callback(err, data) when ready.
 *
 * @param file
 * @param callback
 */
exports.parseFile = function(file, callback){

    if(!callback){
        throw new Error('no callback provided');
    }

    fs.readFile(file, 'utf8', function(err, data){
        
        if(err){
            callback(err);
        }
        else{
            try {
                callback(null, parse(data));
            }
            catch(error) {
                callback(error);
            }
        }
    });
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Parses .ini file data into an object. Supports section inheritance as well
 * as dot-separated parameter nesting.
 * 
 * @param data
 */
function parse(data){

    var result = {};
    var lines = data.split(/\r\n|\r|\n/);

    var container = result;
    
    // parse each line
    for (var index in lines) {
        if (lines.hasOwnProperty(index)) {

            if (regex.comment.exec(lines[index])) {continue}

            var matches;

            // match sections
            if (matches = regex.section.exec(lines[index])) {

                // if the section inherits, copy in its parent's bindings
                // so yes, you can only inherit sections above you
                if (matches[3]) {
                    result[matches[1]] = JSON.parse(JSON.stringify(result[matches[3]]));
                }
                else {
                    result[matches[1]] = {};
                }

                container = result[matches[1]];

                continue;
            }

            // match assignments
            if (matches = regex.assignment.exec(lines[index])) {

                // split the name by dots
                var parts = matches[1].split(".");

                var currentObj = container;

                while(parts.length > 1) {

                    var name = parts.shift();

                    if (!currentObj[name]) {
                        currentObj[name] = {};
                    }

                    currentObj = currentObj[name];
                }

                currentObj[parts[0]] = isNaN(matches[2]) ? matches[2] : parseFloat(matches[2]);

                continue;
            }

            throw new Error("malformed line: " + lines[index]);
        }
    }

    return result;
}

exports.parse = parse;



///////////////////////////////////////////////////////////////////////////////
/**
 * Recursively merges the payload object into the target object. Arrays are
 * not supported.
 *
 * @param target
 * @param payload
 */
function merge(target, payload){

    // payload overrides target
    for (var i in payload) {
        if (payload.hasOwnProperty(i)) {

            // if either side is a primitive, clobber
            // otherwise merge
            if (typeof target[i] == "boolean" ||
                    typeof target[i] == "number" ||
                    typeof target[i] == "string" ||
                    target[i] == null ||
                    typeof payload[i] == "boolean" ||
                    typeof payload[i] == "number" ||
                    typeof payload[i] == "string" ||
                    payload[i] == null) {
                target[i] = payload[i];
            }
            else {
                merge(target[i], payload[i]);
            }
        }
    }
}

exports.merge = merge;