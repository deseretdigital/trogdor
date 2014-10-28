#!/usr/bin/env node
const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));

const cli = new Liftoff({
    name: 'trogdor',
    /* moduleName: 'trogdor',     // these are assigned
    configName: 'trogdorfile.js', // automatically by
    processTitle: 'trogdor',   // the "name" option */
    extensions: require('interpret').jsVariants,
    // ^ automatically attempt to require module for any javascript variant
    // supported by interpret.  e.g. coffee-script / livescript, etc
    nodeFlags: ['--harmony'] // to support all flags: require('v8flags').fetch();
    // ^ respawn node with any flag listed here
}).on('require', function (name, module) {
    console.log('Loading:',name);
}).on('requireFail', function (name, err) {
    console.log('Unable to load:', name, err);
}).on('respawn', function (flags, child) {
    console.log('Detected node flags:', flags);
    console.log('Respawned to PID:', child.pid);
});

cli.launch({
    cwd: argv.cwd,
    configPath: argv.trogdorfile,
    require: argv.require,
    completion: argv.completion,
    verbose: argv.verbose
}, invoke);

function invoke (env) {

    if (argv.verbose) {
        console.log('LIFTOFF SETTINGS:', this);
        console.log('CLI OPTIONS:', argv);
        console.log('CWD:', env.cwd);
        console.log('LOCAL MODULES PRELOADED:', env.require);
        console.log('SEARCHING FOR:', env.configNameRegex);
        console.log('FOUND CONFIG AT:',  env.configPath);
        console.log('CONFIG BASE DIR:', env.configBase);
        console.log('YOUR LOCAL MODULE IS LOCATED:', env.modulePath);
        console.log('LOCAL PACKAGE.JSON:', env.modulePackage);
        console.log('CLI PACKAGE.JSON', require('../package'));
    }

    if(env.configPath) {
        process.chdir(env.configBase);
        require(env.configPath);
    } else {
        console.log('No trogdorfile.js found.');
    }
}