/**
 * Copyright (C) 2011 Sitelier Inc.
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
 * Date: 1/1/12
 */

"use strict";

/**
 * Analyzes the given JS source according to Capsela conventions.
 *
 * @param source string
 *
 * @return object   the result of the source analysis
 */
exports.analyze = function(source) {

    var result = {
        functions: {},
        classes: {}
    };

    var tokens = tokenize(source);

    //console.log(tokens);
    var state = null;

    var IN_CLASS = 0;

    var curClass;

    for (var i = 0; i < tokens.length; i++) {

        switch (state) {

            case IN_CLASS:

                // look for methods
                // todo find static methods, properties etc.

                if (i + 2 < tokens.length &&
                    tokens[i].type == 'ident' &&
                    tokens[i + 1].type == 'sym' && tokens[i + 1].token == ':' &&
                    tokens[i + 2].type == 'keyword' && tokens[i + 2].token == 'function') {

                    var method = {params: []};

                    if (i > 0 &&
                        tokens[i - 1].type == 'fullcomment') {
                        method.doc = tokens[i - 1].token;
                    }

                    curClass.methods[tokens[i].token] = method;
                }

                break;

            default:

                if (i + 4 < tokens.length &&
                    tokens[i].type == 'ident' &&
                    tokens[i + 1].type == 'sym' && tokens[i + 1].token == '=' &&
                    tokens[i + 2].type == 'ident' &&
                    tokens[i + 3].type == 'sym' && tokens[i + 3].token == '.' &&
                    tokens[i + 4].type == 'ident' && tokens[i + 4].token == 'extend') {

                    state = IN_CLASS;
                    curClass = {
                        parent: tokens[i + 2].token,
                        methods: {}
                    };
                    
                    result.classes[tokens[i].token] = curClass;
                }

                break;
        }
    }

    // process the doc blocks
    // should probably tokenize these, too

    for (var className in result.classes) {

        curClass = result.classes[className];

        for (var name in curClass.methods) {

            var method = curClass.methods[name];

            if (method.doc) {

                // clean up the doc block
                var clean = method.doc.replace(/\/\*\*?\s*(\*\s)?|^\s*\*\s*\*?\s*\/?/mg, '');

                // break into parts
                var parts = clean.split('@').map(function(part) {
                    return part.trim();
                });

                if (parts[0] != '') {
                    method.desc = parts[0];
                }

                for (var index = 1; index < parts.length; index++) {

                    // get params
                    var match = parts[index].match(/^param\s+(\w+)\s*([\s\S]*)/);

                    if (match) {
                        method.params.push({name: match[1], desc: match[2]});
                    }

                    // get return info
                    match = parts[index].match(/^return\s+(\S+)\s*([\s\S]*)/);

                    if (match) {
                        method.returnType = match[1];
                        method.returnDesc = match[2];
                    }
                }

                delete(method.doc);
            }
        }
    }

    return result;
}

////////////////////////////////////////////////////////////////////////////////
// Based on public domain code by Christopher Diggins
// http://www.cdiggins.com

function tokenize(input, keepWs) {

    var re_keyword =/^var$|^function$|^if$|^else$|^for$|^while$/;
    var re_line_comment = /^\/\/.*\r/
    var re_full_comment = /^\/\*(?:.|[\n\r])*?\*\//
    var re_ident = /[a-zA-Z_][a-zA-Z0-9_]*\b/
    var re_integer = /[+-]?\d+/
    var re_float = /[+-]?\d+(([.]\d+)*([eE][+-]?\d+))?/
    var re_doublequote = /["][^"]*["]/
    var re_singlequote = /['][^']*[']/
    var re_tab = /\t/
    var re_nl = /\n|\r|\r\n/
    var re_space = /\s/
    var re_symbol = /\S/
    var re_token = /\/\/.*\r|\/\*(?:.|\n|\r)*?\*\/|\w+\b|[+-]?\d+(([.]\d+)*([eE][+-]?\d+))?|["][^"]*["]|['][^']*[']|./g
    var a = input.match(re_token);
    var tokens = [];

    for (var i = 0; i < a.length; i++) {

        var token = a[i];

        if (token.match(re_keyword)) {
            tokens.push({type: "keyword", token: token});
        }
        else if (token.match(re_line_comment)) {
            tokens.push({type: "linecomment", token: token});
        }
        else if (token.match(re_full_comment)) {
          tokens.push({type: "fullcomment", token: token});
        }
        else if (token.match(re_singlequote)) {
          tokens.push({type: "qstr", token: token});
        }
        else if (token.match(re_doublequote)) {
          tokens.push({type: "qqstr", token: token});
        }
        else if (token.match(re_ident)) {
          tokens.push({type: "ident", token: token});
        }
        else if (token.match(re_float)) {
          tokens.push({type: "real", token: token});
        }
        else if (token.match(re_integer)) {
          tokens.push({type: "int", token: token});
        }
        else if (token.match(re_space) && keepWs) {
          tokens.push({type: "ws", token: token});
        }
        else if (token.match(re_nl) && keepWs) {
          tokens.push({type: "nl", token: token});
        }
        else if (token.match(re_tab) && keepWs) {
          tokens.push({type: "tab", token: token});
        }
        else if (token.match(re_symbol)) {
          tokens.push({type: "sym", token: token});
        }
    }

    return tokens;
}
