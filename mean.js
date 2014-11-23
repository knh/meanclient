var http = require('http');

var mean = require('./lib/mean');
var config = require('./config.js');

/** Initialize the server **/
var server = http.createServer(mean(config));

server.listen(config.port || 3000);
