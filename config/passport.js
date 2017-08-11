// Importing Passport, strategies, and config
const passport = require('passport');
const config = require('./main');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

let User;
module.exports = (user) => {
  User = user;
};

// Setting JWT strategy options
const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  // Telling Passport where to find the secret
  secretOrKey: config.secret

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
