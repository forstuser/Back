/*jshint esversion: 6 */
'use strict';

const Hapi = require('hapi');
const cors = require('hapi-cors');
const good = require('good');
const hapiJWT = require('hapi-auth-jwt2');
const models = require('./api/models');
const routers = require('./routes/router');
const hapiSwagger = require('hapi-swagger');
const inert = require('inert');
const vision = require('vision');
const config = require("./config/main");
const fs = require('fs');
const path = require("path");
// Create a server with a host and port
const server = new Hapi.Server();

const PORT = config.APP.PORT || 8443;

const SERVER_OPTIONS = {
	port: PORT
};

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
if (process.env.NODE_ENV !== "production") {
	const TLS_OPTIONS = {
		key: fs.readFileSync(path.resolve(__dirname, 'cert/key.key')),
		cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.crt')),
		ca: fs.readFileSync(path.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
	};

	SERVER_OPTIONS.tls = TLS_OPTIONS;
}

if (process.env.NODE_ENV !== 'production') {
	server.connection(SERVER_OPTIONS);
}

const goodLoggingOption = {
	ops: {
		interval: 1000
	},
	reporters: {
		myConsoleReporter: [{
			module: 'good-squeeze',
			name: 'Squeeze',
			args: [{log: '*', response: '*'}]
		}, {
			module: 'good-console'
		}, 'stdout'],
		myFileReporter: [{
			module: 'good-squeeze',
			name: 'Squeeze',
			args: [{log: '*', response: '*', error: '*'}]
		}, {
			module: 'good-squeeze',
			name: 'SafeJson',
			args: [
				null,
				{separator: ','}
			]
		}, {
			module: 'rotating-file-stream',
			args: [
				'log.json',
				{
					size: '10M', // rotate every 10 MegaBytes written
					interval: '1d', // rotate daily
					compress: 'gzip', // compress rotated files
					history: `logs-${new Date().getTime()}`,
					path: './logs'
				}
			]
		}]
	}
};

models.sequelize.sync().then(() => {
	server.register([
		{
			register: good,
			options: goodLoggingOption
		},
		{
			register: inert
		},
		{
			register: vision
		},
		{
			register: hapiSwagger,
			options: {
				info: {
					title: 'Test API Documentation',
					version: '1.0.0'
				}
			}
		},
		{
			register: cors,
			options: {
				origins: ['*'],
				methods: ['POST, GET, OPTIONS', 'PUT', 'DELETE']
			}
		}], (err) => {
		if (!err) {
			server.register(hapiJWT, (jwtErr) => {
				if (!jwtErr) {
					const jwtKey = config.JWT_SECRET;
					server.auth.strategy('jwt', 'jwt',
						{
							key: jwtKey.toString(),
							validateFunc: (decoded, request, callback) => {
								if (!decoded) {
									return callback(null, false);
								}

								return callback(null, true);
							},
							verifyOptions: {algorithms: ['HS512']} // pick a strong algorithm
						});
					server.start(() => {
						console.log(server.info.uri);
					});
					routers(server, models);
				}
			});
		}
	});
}).catch(err => console.log(err, 'Something went wrong with the Database Update!'));

module.exports = {
	server: server,
	options: SERVER_OPTIONS
};