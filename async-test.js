var async = require('async');

var test = 1;

async.series([
    function(callback){
        // do some stuff ...
        
        console.log('one', test);
        test = 2;
        callback(null, 'one');
    },
    function(callback){
        // do some more stuff ...
        console.log('two', test);
        callback(null, 'two');
    }
],
// optional callback
function(err, results){
    console.log('results', results);
    // results is now equal to ['one', 'two']
});