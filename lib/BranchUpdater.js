var _ = require('lodash'),
    fs = require('fs'),
    Q = require('q'),
    shell = require('shelljs'),
    trogdor = require('../index.js')
    GitHelper = require('./GitHelper');

var BranchUpdater = function(opts) {

    var options = {
        repos: [],
        masterDir: '',
        branchDir: ''
    };

    _.assign(options, opts);

    var processRepo = function(repoName, repoDetails){
        console.log("process repo called");
        if(fs.existsSync(repoName) == false)
        {
            fs.mkdirSync(repoName);
        }

        console.log("dirs made");
        shell.cd(repoName);

        var branchNames = getBranchNames(repoName);
        var masterRepoDir = options.masterDir + '/' + repoName;

        _.forEach(branchNames, function(branchName){
            if(fs.existsSync(branchName) == false)
            {
                var cmd = 'git clone --depth 1 --single-branch --branch=' + branchName + ' file://' + masterRepoDir + ' ' + branchName;
                shell.exec(cmd, {silent:false});
            }
            else
            {
                shell.cd(branchName);

                var cmd = 'git fetch origin';
                shell.exec(cmd);

                cmd = 'git reset --hard origin/' + branchName;
                shell.exec(cmd);

                shell.cd('..');
            }
        });

        // Get a list of all directories;
        var dirs = _.difference(shell.ls('*'), ['.', '..']);

        _.forEach(dirs, function(dirName){
            if(_.indexOf(branchNames, dirName) == -1)
            {
                console.log('deleting old branch ' + repoName + '/' + dirName);
                shell.rm('-rf', dirName);
            }
        });

        shell.cd('..');
    };

    var getBranchNames = function(repoName)
    {
        console.log("getBranchNames", repoName);

        var masterRepoDir = options.masterDir + '/' + repoName;

        var masterHelper = GitHelper(masterRepoDir);

        var branchNames = masterHelper.getBranchNames();

        return branchNames;
    };


    var run = function(){

        var deferred = Q.defer();

        console.log('Run Called');

        // Make sure branchDir exists
        if(fs.existsSync(options.branchDir) == false)
        {
            fs.mkdirSync(options.branchDir);
        }

        console.log("fs finished");

        var prevDir = process.cwd();

        shell.cd(options.branchDir);

        console.log("cd finished");

        _.forEach(options.repos, function(repoDetails, repoName){
            processRepo(repoName, repoDetails);
        });

        shell.cd(prevDir);

        deferred.resolve();

        return deferred.promise;
    };

    return {
        run: run
    }
};

module.exports = BranchUpdater;