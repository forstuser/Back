/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constants = require('../constants');

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getRole = checkRole => {
  let role;

  switch (checkRole) {
    case _constants.ROLE_ADMIN:
      role = 4;
      break;
    case _constants.ROLE_OWNER:
      role = 3;
      break;
    case _constants.ROLE_CLIENT:
      role = 2;
      break;
    case _constants.ROLE_MEMBER:
      role = 1;
      break;
    default:
      role = 1;
  }

  return role;
};

function replacer(key, value) {
  if (key === 'password') return undefined;else if (key === 'expiresIn') return undefined;else if (key === 'token') return undefined;
  return value;
}

class AuthenticationController {
  static validateToken(expiryTime) {
    return expiryTime > new Date().getTime();
  }

  static generateToken(user) {
    const expiresIn = new Date().getTime() + 647000;
    const token = _jsonwebtoken2.default.sign(JSON.parse(JSON.stringify(user.toJSON(), replacer)), _main2.default.JWT_SECRET, {
      algorithm: 'HS512',
      expiresIn
    });

    user.updateAttributes({
      token,
      expiresIn
    });
    return {
      token,
      expiresIn
    };
  }

  static generateSellerToken(user) {
    const expiresIn = new Date().getTime() + 647000;
    const token = _jsonwebtoken2.default.sign(JSON.parse(JSON.stringify(user, replacer)), _main2.default.JWT_SECRET, { algorithm: 'HS512', expiresIn });
    return { token, expiresIn };
  }

  static expireToken(user) {
    return _jsonwebtoken2.default.sign(user, _main2.default.JWT_SECRET, {
      expiresIn: 0, // in seconds
      algorithm: 'HS512'
    });
  }

  static roleAuthorization(User, requiredRole) {
    return (req, res, next) => {
      const user = _shared2.default.verifyAuthorization(req.headers);

      User.findById(user.id || user.ID).then(foundUser => {
        // If user is found, check role.
        if (getRole(foundUser.accessLevel) >= getRole(requiredRole)) {
          return next();
        }

        return res.status(401).json({ error: 'You are not authorized to view this content.' });
      }).catch(err => {
        console.log(`Error on ${new Date()} is as follow: \n \n ${err}`);
        res.status(422).json({ error: 'No user was found.' });
        return next(err);
      });
    };
  }
}

exports.default = AuthenticationController;