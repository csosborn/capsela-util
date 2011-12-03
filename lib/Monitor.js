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
 * Author: Seth
 * Date: Feb 10, 2011
 */

"use strict";

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

/**
 * @todo override 'on' and 'addlistener' to throw an exception if a 'complete'
 * listener is added after the 'complete' even has already been fired
 */

///////////////////////////////////////////////////////////////////////////////
/**
 * Creates a new monitor that will call completion() when it hears back from
 * all its reports.
 * 
 * @param expected  the number of reports expected. If this argument is zero or
 * undefined the monitor will be open-ended, and will not fire its 'complete'
 * event until both doneAddingReports() has been called and all added reports
 * have completed.
 */
function Monitor(expected) {
    if (!expected) {
        this.openEnded = true;
        this.expected = false;
    } else {
        this.expected = expected;
    }
    this.collected = 0;
}

inherits(Monitor, EventEmitter);

///////////////////////////////////////////////////////////////////////////////
/**
 * Creates a new reporter for the given item and returns its callback. Item is
 * just for handing back to event listeners; it can be a string, object or null.
 *
 * @param item
*/
Monitor.prototype.addReport = function(item) {
    var t = this;

    // if it is open-ended, then the expected number of reports is just the
    // number of times addReport has been called
    if (t.openEnded) {
        if (t.doneAdding) {
            throw new Error('cannot add another report after calling doneAddingReports()');
        }
        t.expected++;
    }
    
    return function() {
        t.processReport(item, Array.prototype.slice.call(arguments));
    };
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Processes a report for the specified item.
 *
 * @param item
 * @param args  An array of argumentss to pass with the 'report' event.
 */
Monitor.prototype.processReport = function(item, args) {

    this.collected++;

    // emit 'report', with the given args
    args.unshift(item);
    args.unshift('report');
    this.emit.apply(this, args);

    // see if all reports are in
    if (!this.openEnded || this.doneAdding) {
        if (this.collected == this.expected) {
            this.emit('complete');
        }
    }
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Called on an open-ended monitor to indicated that no more expected reports
 * will be added, and that the complete event can be fired whenever the remaining
 * outstanding reports are done.
 * 
 */
Monitor.prototype.doneAddingReports = function() {
    if (!this.openEnded) {
        throw new Error('doneAddingReports() called on a closed-ended Monitor');
    }
    this.doneAdding = true;
    if (this.collected == this.expected) {
        this.emit('complete');
    }
};

exports.Monitor = Monitor;