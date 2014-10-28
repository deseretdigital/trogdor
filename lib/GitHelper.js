var _ = require('lodash'),
    shell = require('shelljs');

var GitHelper = function(gitDir){

    var getBranchNames = function(){
        var branchNames = [];

        console.log("Getting branches output");
        var cmd = 'git --git-dir=' + gitDir + ' branch --no-color';
        console.log("cmd", cmd);
        var output = shell.exec(cmd, {silent:false}).output;

        var lines = output.split("\n");

        _.forEach(lines, function(line){
            line = line.replace("*", "");
            line = line.trim();
            if(line.length > 0)
            {
                branchNames.push(line);
            }
        });

        console.log("branchNames", branchNames);

        return branchNames;
    };

    return {
        getBranchNames: getBranchNames
    }
};

module.exports = GitHelper;