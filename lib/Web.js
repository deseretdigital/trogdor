var http = require('http');
var express = require('express');
var browserify = require('browserify-middleware');
var path = require('path');
var RestRouter = require('./RestRouter');

var Web = function(trogdor){
    

    var app = express();

    /* I mostly use browserify but you can use any module system you like or none at all */

    



    app.get('/index.js', browserify(__dirname + '/../web/index.js', { transform: ['reactify']}));

    /* Rest API */
    app.use('/api', RestRouter(trogdor));
    
    /* Static Files */
    app.use("/", express.static(path.resolve(__dirname + '/../web/')));


    var listen = function(port){
        http.createServer(app).listen(3000);    
    };

    return {
        listen: listen
    };
};

module.exports = Web;