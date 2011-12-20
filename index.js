"use strict";

var modules = [
    'Class', 'Pipe', 'SafeStream', 'Log',
    'Logger', 'StreamUtil', 'Config', 'Ini', 'MonkeyPatcher'];

function loadModule(name) {
    var module = require(__dirname + '/lib/' + name);
    exports[name] = module;
    for (var item in module) {
        exports[item] = module[item];
    }
}

modules.forEach(loadModule);

// the contents of the Ini module should be wrapped in an object when re-exported here
exports['Ini'] = require(__dirname + '/lib/Ini');