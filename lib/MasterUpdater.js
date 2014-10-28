/**
 * Created by jcarmony on 10/16/14.
 */
var fs = require('fs'),
    _ = require('lodash'),
    Q = require('q'),
    shell = require('shelljs'),
    console = require('better-console');


var MasterUpdater = function(opts){
    var options = {
        repos: [],
        masterDir: './masterDir'
    };

    _.assign(options, opts);

    var updateRepo = function(repoName, repoDetails){

        if(fs.existsSync(repoName) == false)
        {
            console.log("Getting a fresh clone for " + repoName);
            shell.exec('git clone --mirror ' + repoDetails.url + ' ' + repoName);
        }
        else
        {
            console.log("Updating " + repoName);
            shell.cd(repoName);
            shell.exec('git fetch -p origin');
            shell.cd('..');
        }
    };

    var run = function(){
        var deferred = Q.defer();

        var prevDir = process.cwd();

        // Make sure the masterDir exists
        if(fs.existsSync(options.masterDir) == false)
        {
            fs.mkdirSync(options.masterDir);
        }

        // Move into master dir
        shell.cd(options.masterDir);

        // Loop through the repos
        _.forEach(options.repos, function(repoDetails, repoName){
            console.log("Repo: ", repoName);
            updateRepo(repoName, repoDetails);
        });

        shell.cd(prevDir);

        deferred.resolve();

        return deferred.promise;
    };


    return {
        run: run
    };
};

module.exports = MasterUpdater;