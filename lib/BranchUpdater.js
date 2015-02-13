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
        var newHash = '';

        if(fs.existsSync(branch.branchName) == false)
        {
            var cmd = 'git clone --depth 10 --single-branch --branch=' + branch.branchName + ' file://' + branch.masterRepoDir + ' ' + branch.branchName;
            console.log("clone command", cmd);
            shell.exec(cmd, {silent:false});
            updated = true;

            shell.cd(branch.branchName);
            newHash = shell.exec('git rev-parse HEAD').output.trim();

            // Make .trogdor file
            fs.mkdirSync('.trogdor');

            shell.cd('..');
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
                newHash = endHash;
            }

            shell.cd('..');
        }

        if(updated)
        {
            var cwd = process.cwd();
            shell.cd(branch.branchName);

            var branchDir = process.cwd();

            trogdor.emit('branchUpdate', { repoName: branch.repoName, branchName: branch.branchName, branchHash: newHash, branchDir: branchDir })
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
            shell.cd('..');
            return callback();
        }

        console.log("BranchUpdater#processRepo repos", repos);

        var repo = repos.pop();
        var repoName = repo.name;
        var repoDetails = repo.details;

        // Lets Make sure the repoDir is there for us to populate
        console.log("BranchUpdater#processRepo repoName", repoName);
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
            shell.cd('..');
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
        var deferred = Q.defer();
        console.log("cleaning up old branches")
        console.log('options.paths', options);
        shell.cd(options.branchDir);

        // make of copy of the repos so we can pop values from it
        var repos = [];

        _.forEach(options.repos, function(repoDetails, repoName){
            repos.push({
                details: repoDetails,
                name: repoName
            });
        });

        cleanupRepo(repos, function(){
            shell.cd('..');
            deferred.resolve();
        });


        return deferred.promise;
    };

    var cleanupRepo = function(repoList, finalCallback){
        if(repoList.length <= 0)
        {
            return finalCallback();
        }

        var currentRepo = repoList.pop();

        console.log('cleaning up: ', currentRepo, process.cwd());

        shell.cd(currentRepo.name);

        var legitBranchNames = getBranchNames(currentRepo.name);

        // Get List of leftover supervisor configs 
        var existingBranchNames = _.difference(shell.ls(''), ['.', '..']);

        var badBranchNames = _.difference(existingBranchNames, legitBranchNames);
        var promiseChain = Q(true);
        _.forEach(badBranchNames, function(badBranch){
            promiseChain.then(function(){
                console.log('BranchUpdater#cleanupRepo badBranch', badBranch);
                shell.exec('rm -rf ' + badBranch);
                return trogdor.emit('branchDelete', { repoName: currentRepo.name, branchName: badBranch });
            });
            
        });


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
        }).then(function(){
            deferred.resolve();
        }).done();

        return deferred.promise;
    };

    return {
        run: run
    }
};

module.exports = BranchUpdater;