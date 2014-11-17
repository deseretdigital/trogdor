/**
 * Created by jcarmony on 11/7/14.
 */
var _ = require('lodash'),
    express = require('express'),
    GitHelper = require('./GitHelper'),
    shell = require('shelljs'),
    fs = require('fs');

var RestRouter = function(trogdor){
    var router = express.Router();

    var config = trogdor.config;

    router.route('/branches')
        .get(function(req, res){
            var allBranches = [];

            _.forEach(config.repos, function(repoDetails, repoName){
                var repoHelper =  GitHelper(config.paths.master + '/' + repoName);
                var branches = repoHelper.getBranchNames();

                allBranches = _.union(allBranches, branches);
            });

            allBranches.sort();

            var allBranchData = [];

            _.forEach(allBranches, function(branchName){
                var data = {
                    name: branchName,
                    links: {}
                };

                var linkDir = config.paths.links + '/' + branchName;

                var links = _.difference(shell.ls(linkDir), ['.','..']);

                _.forEach(links, function(link){
                     data.links[link] = fs.readlinkSync(linkDir + '/' + link);
                });

                allBranchData.push(data);
            });

            res.json({branches: allBranchData});
        });



    return router;
};


module.exports = RestRouter;