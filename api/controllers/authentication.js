/*jshint esversion: 6 */
'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config/main');
const shared = require('../../helpers/shared');

const ROLE_MEMBER = require('../constants').ROLE_MEMBER;
const ROLE_CLIENT = require('../constants').ROLE_CLIENT;
const ROLE_OWNER = require('../constants').ROLE_OWNER;
const ROLE_ADMIN = require('../constants').ROLE_ADMIN;

const getRole = (checkRole) => {
	let role;

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
	if (key === 'password') return undefined;
	else if (key === 'expiresIn') return undefined;
	else if (key === 'token') return undefined;
	return value;
}

class AuthenticationController {
	static validateToken(expiryTime) {
		return expiryTime > new Date().getTime();
	}

	static generateToken(user) {
		const expiresIn = new Date().getTime() + 647000;
		const token = jwt.sign(JSON.parse(JSON.stringify(user, replacer)), config.JWT_SECRET,
			{
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

	static expireToken(user) {
		return jwt.sign(user, config.JWT_SECRET, {
			expiresIn: 0, // in seconds
			algorithm: "HS512"
		});
	}

	static roleAuthorization(User, requiredRole) {
		return (req, res, next) => {
			const user = shared.verifyAuthorization(req.headers);

			User.findById(user.id).then((foundUser) => {
				// If user is found, check role.
				if (getRole(foundUser.accessLevel) >= getRole(requiredRole)) {
					return next();
				}

				return res.status(401).json({error: 'You are not authorized to view this content.'});
			}).catch((err) => {
				console.log(err);
				res.status(422).json({error: 'No user was found.'});
				return next(err);
			});
		};
	}
}

module.exports = AuthenticationController;
