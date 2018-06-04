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
      log: { collect: true },
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
      validate: async (decoded, request) => {
        let userList = await _models2.default.users.findAll({ where: { role_type: 5 } });
        const people = {};
        userList.forEach(item => {
          item = item.toJSON();
          people[item.id] = item;
        });

        if (!people[decoded.id]) {
          return { isValid: false };
        } else {
          return { isValid: true };
        }
      },
      verifyOptions: { algorithms: ['HS512'] } // pick a strong algorithm
    });
    server.events.on({ name: 'request' }, (request, event, tags) => {

      if (tags.error) {
        _models2.default.logs.create({
          api_action: request.method,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify(event)
        });
      }
    });
    (0, _router2.default)(server, _models2.default);
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
    return init().then(server => {});
  }).catch(err => console.log(`Error at start up is as follow: \n \n ${err}`));
};