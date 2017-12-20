/*jshint esversion: 6 */
'use strict';
import passport from 'passport';
// Importing Passport, strategies, and config
import {ExtractJwt, Strategy as JwtStrategy} from 'passport-jwt';
import config from './main';

let User;
export default (user) => {
	User = user;
};

// Setting JWT strategy options
const jwtOptions = {
	// Telling Passport to check authorization headers for JWT
	jwtFromRequest: ExtractJwt.fromAuthHeader(),
	// Telling Passport where to find the secret
	secretOrKey: config.JWT_SECRET

	// TO-DO: Add issuer and audience checks
};

// Setting up JWT login strategy
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
	User.findById(payload._id).then((user) => {
		if (user) {
			done(null, user);
		} else {
			done(null, false);
		}
	}).catch(err => done(err, false));
});

passport.use(jwtLogin);
