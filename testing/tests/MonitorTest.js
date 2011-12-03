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
 * Date: Feb 10, 2011
 */

"use strict";

var Monitor = require('capsela-util').Monitor;

exports["test one reporter"] = function(test) {

    var monitor = new Monitor(1);

    test.expect(3);

    monitor.on('report', function(id, arg1, arg2) {
        test.equal(id, 'justme');
        test.equal(arg1, 'monkeys');
        test.equal(arg2, 'chickens');
    });

    monitor.on('complete', function() {
        test.done();
    });

    (monitor.addReport('justme'))('monkeys', 'chickens');
};

exports["test several reporters"] = function(test) {

    var monitor = new Monitor(2);

    test.expect(6);

    monitor.on('report', function(id, name, age, occupation) {

        if (id == 1) {
            test.equal(name, 'john');
            test.equal(age, '30');
            test.equal(occupation, 'guard');
        }

        if (id == 2) {
            test.equal(name, 'andy');
            test.equal(age, '36');
            test.ok(occupation == undefined);
        }
    });

    monitor.on('complete', function() {
        test.done();
    });

    // tests adding reports AFTER some reports have already come back
    (monitor.addReport('1'))('john', '30', 'guard');
    (monitor.addReport('2'))('andy', '36');
};

exports["test for loop"] = function(test) {

    var jobs = ['delete children', 'delete me', 'delete parent'];

    var monitor = new Monitor(jobs.length);

    var reported = {};

    test.expect(jobs.length * 2);

    monitor.on('report', function(id, index, result) {
        reported[id] = true;
//        console.log(result);
        test.equal(result.blimps, 3 * index);
    });

    monitor.on('complete', function() {

        jobs.forEach(function(id) {
           test.ok(reported[id]);
        });

        test.done();
    });

    var callbacks = [];

    // test adding all up front

    for (var i in jobs) {
        if (jobs.hasOwnProperty(i)) {
            callbacks.push(monitor.addReport(jobs[i]));
        }
    }

    // now call the callbacks
    for (var i in callbacks) {
        if (callbacks.hasOwnProperty(i)) {
            callbacks[i](i, {'blimps': 3*i});
        }
    }
};

exports["test recursion"] = function(test) {

    var data = {
        '/': {
            '/home': {
                '/home/user': {
                    '/home/user/file1': 'FILE',
                    '/home/user/file2': 'FILE',
                    '/home/user/file3': 'FILE'
                }
            },
            '/usr' : {
                '/usr/local': {
                    '/usr/local/lib': {
                        '/usr/local/lib/lib1.so': 'FILE',
                        '/usr/local/lib/lib2.so': 'FILE',
                        '/usr/local/lib/lib3.so': 'FILE'
                    },
                    '/usr/local/bin': {
                        '/usr/local/bin/bin1': 'FILE',
                        '/usr/local/bin/bin2': 'FILE',
                        '/usr/local/bin/bin3': 'FILE'
                    }
                },
                '/usr/bin': {
                    '/usr/bin/bin1': 'FILE',
                    '/usr/bin/bin2': 'FILE',
                    '/usr/bin/bin3': 'FILE'
                }
            },
            '/temp': {
                
            }
        }
    };

    var fileCount = 0;
    var dirCount = 0;

    process(data, function() {

        test.equal(fileCount, 12);
        test.equal(dirCount, 9);
        test.done();
    });

    function process(data, cb) {

        var children = 0;

        for(var i in data) {
            if(data.hasOwnProperty(i)) {
                children++;
            }
        }

        if (children == 0) {

//            console.log('path has no children');

            cb();
            return;
        }

        var statMonitor = new Monitor(children);
        var deleteMonitor = new Monitor(children);

//        console.log('children = ' + children);

        statMonitor.on('report', function(path, value) {
//            console.log('checking ' + path);

            if (value == 'FILE') {
                fileCount++;
//                console.log('unlinking ' + path);
                (deleteMonitor.addReport(path))();
            }
            else {
                dirCount++;
//                console.log(path + ' is directory');
                process(value, deleteMonitor.addReport(path));
            }
        });

        deleteMonitor.on('complete', function() {

            // all the children are gone; rm the parent
//            console.log('children gone');
            cb();
            return;
        });

        // kill all the files
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                var path = i;
                (statMonitor.addReport(path))(data[path]);
            }
        }
    }

};


exports['test open-ended monitor'] = function(test) {
    test.expect(5);

    var monitor = new Monitor();

    var items = {};
    for (var i = 0; i < 3; i++) {
        items[i] = true;
        setTimeout(monitor.addReport(i), 1);
    }

    monitor
        .on('report', function(item) {
            test.ok(items[item]);
            items[item] = false;
        })
        .on('complete', function() {
            test.done();
        });

    for (var j = 3; j < 5; j++) {
        items[j] = true;
        setTimeout(monitor.addReport(j), 1);
    }

    monitor.doneAddingReports();
};


exports['test open-ended monitor with 0 reports'] = function(test) {
    test.expect(1);

    var monitor = new Monitor();
    monitor
        .on('report', function() {
            test.ok(false, 'unexpected report event');
        })
        .on('complete', function() {
            test.ok('complete called');
            test.done();
        })
        .doneAddingReports();
    
};


exports['test doneAddingReports() on closed-ended monitor'] = function(test) {
    test.expect(1);

    var monitor = new Monitor(83);
    try {
        monitor.doneAddingReports();
    } catch (e) {
        test.equal('doneAddingReports() called on a closed-ended Monitor', e.message);
    }

    test.done();
};


exports['test add report after calling doneAddingReports() generates error'] = function(test) {
    test.expect(1);

    var monitor = new Monitor();
    process.nextTick(monitor.addReport());
    monitor.doneAddingReports();

    try {
        monitor.addReport();
    } catch (e) {
        test.equal('cannot add another report after calling doneAddingReports()', e.message);
    }

    test.done();
};