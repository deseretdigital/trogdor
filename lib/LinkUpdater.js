var _ = require('lodash'),
    fs = require('fs'),
    Q = require('q'),
    shell = require('shelljs'),
    GitHelper = require('./GitHelper');

var LinkUpdater = function(opts){
    var options = {
        repos: [],
        masterDir: '',
        branchDir: '',
        linkDir: ''
    };

    _.assign(options, opts);

    var buildLinkDir = function(branchName){
        var repoLinks = {};

        _.forEach(options.repos, function(repoDetails, repoName){
            var branchLink = options.branchDir + '/' + repoName + '/' + branchName;
            var masterLink = options.branchDir + '/' + repoName + '/' + repoDetails.master;
            if(fs.existsSync(branchLink)){
                repoLinks[repoName] = branchLink;
            }
            else
            {
                repoLinks[repoName] = masterLink;
            }
        });

        var baseBranchLinkDir = options.linkDir + '/' + branchName;

        console.log('repoLinks', repoLinks);

        if(fs.existsSync(baseBranchLinkDir) == false){
            fs.mkdirSync(baseBranchLinkDir);
        }

        _.forEach(repoLinks, function(linkDest, repoName){
            var linkSrc = baseBranchLinkDir + '/' + repoName;

            if(fs.existsSync(linkSrc))
            {
                // Verify that the link is correct
                if(fs.readlinkSync(linkSrc) != linkDest)
                {
                    fs.unlinkSync(linkSrc);
                    fs.symlinkSync(linkSrc, linkDest);
                }
            }
            else
            {
                fs.symlinkSync(linkDest, linkSrc);
            }

        });
    };

    var run = function(){
        console.log("Running link updater");
        var deferred = Q.defer();

        if(fs.existsSync(options.linkDir) == false)
        {
            fs.mkdirSync(options.linkDir);
        }

        var allBranches = [];

        _.forEach(options.repos, function(repoDetails, repoName){
            var masterRepoDir = options.masterDir + '/' + repoName;

            var masterHelper = GitHelper(masterRepoDir);

            var branchNames = masterHelper.getBranchNames();

            allBranches = _.union(allBranches, branchNames);
        });



        console.log("allBranches", allBranches);

        _.forEach(allBranches, function(branchName){
            buildLinkDir(branchName);
        });

        deferred.resolve();

        return deferred.promise;
    };

    return {
        run: run
    }
};

module.exports = LinkUpdater;