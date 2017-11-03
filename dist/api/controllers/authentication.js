/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jwt = require('jsonwebtoken');
var config = require('../../config/main');
var shared = require('../../helpers/shared');

var ROLE_MEMBER = require('../constants').ROLE_MEMBER;
var ROLE_CLIENT = require('../constants').ROLE_CLIENT;
var ROLE_OWNER = require('../constants').ROLE_OWNER;
var ROLE_ADMIN = require('../constants').ROLE_ADMIN;

var getRole = function getRole(checkRole) {
	var role = void 0;

	switch (checkRole) {
		case ROLE_ADMIN:
			role = 4;
			break;
		case ROLE_OWNER:
			role = 3;
			break;
		case ROLE_CLIENT:
			role = 2;
			break;
		case ROLE_MEMBER:
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

var AuthenticationController = function () {
	function AuthenticationController() {
		_classCallCheck(this, AuthenticationController);
	}

	_createClass(AuthenticationController, null, [{
		key: 'validateToken',
		value: function validateToken(expiryTime) {
			return expiryTime > new Date().getTime();
		}
	}, {
		key: 'generateToken',
		value: function generateToken(user) {
			var expiresIn = new Date().getTime() + 647000;
			console.log(config.JWT_SECRET);
			var token = jwt.sign(JSON.parse(JSON.stringify(user.toJSON(), replacer)), config.JWT_SECRET, {
				algorithm: 'HS512',
				expiresIn: expiresIn
			});

			user.updateAttributes({
				token: token,
				expiresIn: expiresIn
			});
			return {
				token: token,
				expiresIn: expiresIn
			};
		}
	}, {
		key: 'expireToken',
		value: function expireToken(user) {
			return jwt.sign(user, config.JWT_SECRET, {
				expiresIn: 0, // in seconds
				algorithm: "HS512"
			});
		}
	}, {
		key: 'roleAuthorization',
		value: function roleAuthorization(User, requiredRole) {
			return function (req, res, next) {
				var user = shared.verifyAuthorization(req.headers);

				User.findById(user.id).then(function (foundUser) {
					// If user is found, check role.
					if (getRole(foundUser.accessLevel) >= getRole(requiredRole)) {
						return next();
					}

					return res.status(401).json({ error: 'You are not authorized to view this content.' });
				}).catch(function (err) {
					console.log({ API_Logs: err });
					res.status(422).json({ error: 'No user was found.' });
					return next(err);
				});
			};
		}
	}]);

	return AuthenticationController;
}();

module.exports = AuthenticationController;