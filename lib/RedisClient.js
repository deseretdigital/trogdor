/**
 * Created by jcarmony on 11/7/14.
 */
var redis = require("redis"),
    client = redis.createClient();

module.exports = client;