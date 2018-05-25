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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Create a server with a host and port

var PORT = _main2.default.APP.PORT || 8443;

var init = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var server, jwtKey;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            server = new _hapi2.default.Server({
              port: PORT,
              routes: {
                cors: {
                  origin: ['*'],
                  headers: ['Accept', 'Content-Type', 'Authorization', 'language']
                }
              }
            });
            _context.next = 3;
            return server.register({
              plugin: _inert2.default
            });

          case 3:
            _context.next = 5;
            return server.register({
              plugin: _vision2.default
            });

          case 5:
            _context.next = 7;
            return server.register({
              plugin: _hapiSwagger2.default,
              options: {
                info: {
                  title: 'Consumer API Documentation',
                  version: '1.0.0'
                }
              }
            });

          case 7:
            _context.next = 9;
            return server.register(_hapiAuthJwt2.default);

          case 9:
            jwtKey = _main2.default.JWT_SECRET;

            server.auth.strategy('jwt', 'jwt', {
              key: jwtKey.toString(),
              validate: function validate(decoded, request, callback) {
                if (!decoded) {
                  return callback(null, false);
                }

                return callback(null, true);
              },
              verifyOptions: { algorithms: ['HS512'] } // pick a strong algorithm
            });

            _context.next = 13;
            return server.start();

          case 13:
            return _context.abrupt('return', server);

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function init() {
    return _ref.apply(this, arguments);
  };
}();

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
/*if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const TLS_OPTIONS = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/key.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.crt')),
    ca: fs.readFileSync(path.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
  };

  server.options.tls = TLS_OPTIONS;
}*/

var initModel = exports.initModel = function initModel() {
  _models2.default.sequelize.sync().then(function () {
    init().then(function (server) {
      (0, _router2.default)(server, _models2.default);
      process.on('unhandledRejection', function (err) {
        console.log(err);
        _models2.default.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({ err: err })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });

        process.exit(1);
      });
      process.on('UnhandledPromiseRejectionWarning', function (err) {
        console.log(err);
        _models2.default.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({ err: err })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
        process.exit(1);
      });
    });
  }).catch(function (err) {
    return console.log('Error at start up is as follow: \n \n ' + err);
  });
};