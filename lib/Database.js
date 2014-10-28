var Db = require('tingodb')().Db;
var trogdor = require('../index.js');


var db = new Db(trogdor.config.paths.data, {});

module.exports = db;