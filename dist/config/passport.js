/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportJwt = require('passport-jwt');

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

// Importing Passport, strategies, and config
var User = void 0;

exports.default = function(user) {
  User = user;
};

// Setting JWT strategy options

var jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeader(),
  // Telling Passport where to find the secret
  secretOrKey: _main2.default.JWT_SECRET,

  // TO-DO: Add issuer and audience checks
};

// Setting up JWT login strategy
var jwtLogin = new _passportJwt.Strategy(jwtOptions, function(payload, done) {
  User.findById(payload._id).then(function(user) {
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  }).catch(function(err) {
    return done(err, false);
  });
});

_passport2.default.use(jwtLogin);