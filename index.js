'use strict';

var util = require('util');
var path = require('path');
var events = require('events');
var deprecated = require('deprecated');
var vfs = require('vinyl-fs');
var _ = require('lodash');
var Q = require('q');
var MasterUpdater = require('./lib/MasterUpdater');
var BranchUpdater = require('./lib/BranchUpdater');
var LinkUpdater = require('./lib/LinkUpdater');

function Trogdor(){
    this.listeners = [];
}

// We want this to support events

Trogdor.prototype.on = function(eventName, callback){
    if(typeof this.listeners[eventName] == 'undefined')
    {
        this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
};

Trogdor.prototype.configure = function(configData) {
    var self = this;

    this.config = configData;

    // Resolve relative paths to absolutes
    _.forEach(this.config.paths, function (currentPath, key){
        if(currentPath.substring(0,1) != '/')
        {
            self.config.paths[key] = path.normalize(process.cwd() + '/' + currentPath);
        }

    });

    console.log('config.paths', this.config.paths);
};

Trogdor.prototype.run = function () {
    var self = this;

    console.log("running!");
    console.log(this.config);

    this.updateMaster()
        .then(function(){ return self.updateBranches(); })
        .then(function(){ return self.linkDirectories(); })
        .then(function(){ return self.finish(); })
        .fail(function(err){
            console.log("Error", err);
            throw err;
        })
        .done();
};

Trogdor.prototype.updateMaster = function()
{
    console.log("Updating Masters.");

    var masterDir = this.config.paths.master;

    var masterUpdater = MasterUpdater({
        masterDir: masterDir,
        repos: this.config.repos
    });

    // The Master Updater returns a promise
    return masterUpdater.run();
};

Trogdor.prototype.updateBranches = function(){

    console.log("Updating Branches");

    console.log('wtf?', this);
    console.log(this.config);

    var masterDir = this.config.paths.master;
    var branchDir = this.config.paths.branches;


    var branchUpdater = BranchUpdater({
        repos: this.config.repos,
        masterDir: masterDir,
        branchDir: branchDir
    });

    console.log("calling run");

    // returns a promise
    return branchUpdater.run();

};

Trogdor.prototype.linkDirectories = function(){
    console.log("Updating Links");


    var masterDir = this.config.paths.master;
    var branchDir = this.config.paths.branches;
    var linkDir = this.config.paths.links;


    var linkUpdater = LinkUpdater({
        repos: this.config.repos,
        masterDir: masterDir,
        branchDir: branchDir,
        linkDir: linkDir
    });

    console.log("calling linkUpdater run");

    // returns a promise
    return linkUpdater.run();

};

Trogdor.prototype.finish = function(){
    console.log("Finished!");
};

// let people use this class from our instance
Trogdor.prototype.Trogdor = Trogdor;

var inst = new Trogdor();
module.exports = inst;