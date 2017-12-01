'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _hapiAuthJwt = require('hapi-auth-jwt2');

var _hapiAuthJwt2 = _interopRequireDefault(_hapiAuthJwt);

var _hapiCors = require('hapi-cors');

var _hapiCors2 = _interopRequireDefault(_hapiCors);

var _hapiSwagger = require('hapi-swagger');

var _hapiSwagger2 = _interopRequireDefault(_hapiSwagger);

var _inert = require('inert');

var _inert2 = _interopRequireDefault(_inert);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _vision = require('vision');

var _vision2 = _interopRequireDefault(_vision);

var _models = require('./api/models');

var _models2 = _interopRequireDefault(_models);

var _main = require('./config/main');

var _main2 = _interopRequireDefault(_main);

var _router = require('./routes/router');

var _router2 = _interopRequireDefault(_router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Create a server with a host and port
var server = new _hapi2.default.Server();

var PORT = _main2.default.APP.PORT || 8443;

var SERVER_OPTIONS = {
	port: PORT
};

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
if (process.env.NODE_ENV !== 'production') {
	var TLS_OPTIONS = {
		key: _fs2.default.readFileSync(_path2.default.resolve(__dirname, 'cert/key.key')),
		cert: _fs2.default.readFileSync(_path2.default.resolve(__dirname, 'cert/cert.crt')),
		ca: _fs2.default.readFileSync(_path2.default.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
	};

	SERVER_OPTIONS.tls = TLS_OPTIONS;
}

if (process.env.NODE_ENV !== 'production') {
	server.connection(SERVER_OPTIONS);
}

_models2.default.sequelize.sync().then(function () {
	server.register([{
		register: _inert2.default
	}, {
		register: _vision2.default
	}, {
		register: _hapiSwagger2.default,
		options: {
			info: {
				title: 'Test API Documentation',
				version: '1.0.0'
			}
		}
	}, {
		register: _hapiCors2.default,
		options: {
			origins: ['*'],
			methods: ['POST, GET, OPTIONS', 'PUT', 'DELETE']
		}
	}], function (err) {
		if (!err) {
			server.register(_hapiAuthJwt2.default, function (jwtErr) {
				if (!jwtErr) {
					var jwtKey = _main2.default.JWT_SECRET;
					server.auth.strategy('jwt', 'jwt', {
						key: jwtKey.toString(),
						validateFunc: function validateFunc(decoded, request, callback) {
							if (!decoded) {
								return callback(null, false);
							}

							return callback(null, true);
						},
						verifyOptions: { algorithms: ['HS512'] // pick a strong algorithm
						} });
					server.start(function () {});
					(0, _router2.default)(server, _models2.default);
				}
			});
		}
	});
}).catch(function (err) {
	return console.log(err, 'Something went wrong with the Database Update!');
});

exports.default = {
	server: server,
	options: SERVER_OPTIONS
};