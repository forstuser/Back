#!/usr/bin/env node


'use strict';

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _os = require('os');

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var numCPUs = (0, _os.cpus)().length;
/**
 * Module dependencies.
 */


var server = _app2.default.server;
var options = _app2.default.options;

if (_cluster2.default.isMaster) {
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		_cluster2.default.fork();
	}

	// If a worker dies, log it to the console and start another worker.
	_cluster2.default.on('exit', function (worker, code, signal) {
		console.log('Worker ' + worker.process.pid + ' died.');
		_cluster2.default.fork();
	});

	// Log when a worker starts listening
	_cluster2.default.on('listening', function (worker, address) {
		console.log('Worker started with PID ' + worker.process.pid + '.');
	});
} else {
	server.connection(options);
}