#!/usr/bin/env node


'use strict';

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _os = require('os');

var _app = require('./app');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import {executeCron} from './cronRunner';
const numCPUs = (0, _os.cpus)().length;

const server = _app.initModel;

// executeCron();

if (_cluster2.default.isMaster) {
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    _cluster2.default.fork();
  }

  // If a worker dies, log it to the console and start another worker.
  _cluster2.default.on('exit', (worker, code, signal) => {
    console.log('Worker ' + worker.process.pid + ' died.');
    _cluster2.default.fork();
  });

  // Log when a worker starts listening
  _cluster2.default.on('listening', (worker, address) => {
    console.log('Worker started with PID ' + worker.process.pid + '.');
  });
} else {
  server();
}