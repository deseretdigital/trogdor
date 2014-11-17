var _ = require('lodash'),
    fs = require('fs'),
    Q = require('q'),
    shell = require('shelljs'),
    async = require('async'),
    GitHelper = require('./GitHelper');

var BranchUpdater = function(opts) {

    var options = {
        repos: [],
        masterDir: '',
        branchDir: ''
    };

    _.assign(options, opts);

    var trogdor = options.trogdor;

    var setup = function(){
        var deferred = Q.defer();

        // Make sure branchDir exists
        if(fs.existsSync(options.branchDir) == false)
        {
            fs.mkdirSync(options.branchDir);
        }

        console.log("fs finished");

        

        shell.cd(options.branchDir);

        deferred.resolve();

        return deferred.promise;
    }

    var cleanupRepo = function(repoDir){
        var deferred = Q.defer();

        var prevDir = process.cwd();

        shell.cd(repoDir);

        // Get a list of all directories;
        var dirs = _.difference(shell.ls('*'), ['.', '..']);

        _.forEach(dirs, function(dirName){
            if(_.indexOf(branchNames, dirName) == -1)
            {
                console.log('deleting old branch ' + repoName + '/' + dirName);
                shell.rm('-rf', dirName);
            }
        });

        shell.cd(prevDir);

        deferred.resolve();        
        return deferred.promise;
    }

    var cloneOrUpdateBranches = function(branches, callback){
        if(branches.length <= 0)
        {
            return callback();
        }

        var branch = branches.pop();

        var updated = false;

        if(fs.existsSync(branch.branchName) == false)
        {
            var cmd = 'git clone --depth 1 --single-branch --branch=' + branch.branchName + ' file://' + branch.masterRepoDir + ' ' + branch.branchName;
            console.log("clone command", cmd);
            shell.exec(cmd, {silent:false});
            updated = true;
        }
        else
        {
            shell.cd(branch.branchName);

            // Lets get the current hash
            var startHash = shell.exec('git rev-parse HEAD').output.trim();

            var cmd = 'git fetch origin';
            shell.exec(cmd);

            cmd = 'git reset --hard origin/' + branch.branchName;
            shell.exec(cmd);

            var endHash = shell.exec('git rev-parse HEAD').output.trim();

            if(startHash != endHash)
            {
                updated = true;
            }

            shell.cd('..');
        }

        if(updated)
        {
            var cwd = process.cwd();
            shell.cd(branch.branchName);

            var branchDir = process.cwd();

            trogdor.emit('branchUpdate')
            .then(function(){
                setTimeout(function(){
                    // reset the cwd
                    shell.cd(cwd);
                    cloneOrUpdateBranches(branches, callback);
                }, 500);
            });
        }
        else
        {
            setTimeout(function(){
                cloneOrUpdateBranches(branches, callback);
            }, 500);
        }
    };

    var processRepo = function(repos, callback){
        if(repos.length <= 0)
        {
            // cleanup by cding back
            shell.cd('..');
            return callback();
        }

        var repo = repos.pop();
        var repoName = repo.name;
        var repoDetails = repo.details;

        // Lets Make sure the repoDir is there for us to populate
        console.log("process repo called");
        if(fs.existsSync(repoName) == false)
        {
            fs.mkdirSync(repoName);
        }

        console.log("dirs made");
        shell.cd(repoName);

        var branchNames = getBranchNames(repoName);
        var masterRepoDir = options.masterDir + '/' + repoName;

        var branches = [];

        _.forEach(branchNames, function(branchName){
            branches.push({
                branchName: branchName,
                repoName: repoName,
                masterRepoDir: masterRepoDir
            });
        });

        cloneOrUpdateBranches(branches, function(){
            processRepo(repos, callback);
        });
    };

    var processRepos = function(){
        var deferred = Q.defer();

        // make of copy of the repos so we can pop values from it
        var repos = [];

        _.forEach(options.repos, function(repoDetails, repoName){
            repos.push({
                details: repoDetails,
                name: repoName
            });
        });

        processRepo(repos, function(){
            deferred.resolve();
        });


        return deferred.promise;
    };

    var cleanupRepos = function(){
        console.log("I should clean up...");
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
        var prevDir = process.cwd();

        console.log('Run Called');
        
        setup()
        .then(function(){
            console.log("Calling Process Repos");
            return processRepos();
        }).then(function(){
            return cleanupRepos();
        }).done();

        return deferred.promise;
    };

    return {
        run: run
    }
};

module.exports = BranchUpdater;