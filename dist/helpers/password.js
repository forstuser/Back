'use strict';

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const scryptParameters = scrypt.paramsSync(0.1);
var saltRounds = 10;
var hashPassword = function hashPassword(plainPassword) {
    return _bcryptjs2.default.genSalt(saltRounds).then(function (bcryptParameter) {
        return _bcryptjs2.default.hash(plainPassword.toString(), bcryptParameter).then(function (hashedPassword) {
            return hashedPassword;
        });
    });
};
// const hashPassword = plainPassword => scrypt.kdfAsync(plainPassword.toString(), scryptParameters).then(hashedPassword => hashedPassword.toString('base64'));
var comparePasswords = function comparePasswords(plainPassword, hashedPassword) {
    return _bcryptjs2.default.compare(plainPassword, hashedPassword);
};
// const comparePasswords = (plainPassword, hashedPassword) => scrypt.verifyKdfAsync(new Buffer(hashedPassword, 'base64'), plainPassword);

module.exports = {
    hashPassword: hashPassword,
    comparePasswords: comparePasswords
};