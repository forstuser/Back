'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initModel = undefined;

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _hapiAuthJwt = require('hapi-auth-jwt2');

var _hapiAuthJwt2 = _interopRequireDefault(_hapiAuthJwt);

var _hapiSwagger = require('hapi-swagger');

var _hapiSwagger2 = _interopRequireDefault(_hapiSwagger);

var _inert = require('inert');

var _inert2 = _interopRequireDefault(_inert);

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

const PORT = _main2.default.APP.PORT || 8443;

const init = async () => {
  const server = new _hapi2.default.Server({
    port: PORT,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Content-Type', 'Authorization', 'language']
      }
    }
  });
  try {
    await server.register({
      plugin: _inert2.default
    });
    await server.register({
      plugin: _vision2.default
    });
    await server.register({
      plugin: _hapiSwagger2.default,
      options: {
        info: {
          title: 'Consumer API Documentation',
          version: '1.0.0'
        }
      }
    });
    await server.register(_hapiAuthJwt2.default);
    const jwtKey = _main2.default.JWT_SECRET;
    server.auth.strategy('jwt', 'jwt', {
      key: jwtKey.toString(),
      validate: (decoded, request, callback) => {
        if (!decoded) {
          return callback(null, false);
        }

        return callback(null, true);
      },
      verifyOptions: { algorithms: ['HS512'] } // pick a strong algorithm
    });

    await server.start();
  } catch (e) {
    throw e;
  }
  return server;
};

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
/*if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const TLS_OPTIONS = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/key.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.crt')),
    ca: fs.readFileSync(path.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
  };

  server.options.tls = TLS_OPTIONS;
}*/

const initModel = exports.initModel = () => {
  _models2.default.sequelize.sync().then(() => {
    init().then(server => {
      (0, _router2.default)(server, _models2.default);
      process.on('unhandledRejection', err => {
        console.log(err);
        _models2.default.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({ err })
        }).catch(ex => console.log('error while logging on db,', ex));

        process.exit(1);
      });
      process.on('UnhandledPromiseRejectionWarning', err => {
        console.log(err);
        _models2.default.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({ err })
        }).catch(ex => console.log('error while logging on db,', ex));
        process.exit(1);
      });
    });
  }).catch(err => console.log(`Error at start up is as follow: \n \n ${err}`));
};