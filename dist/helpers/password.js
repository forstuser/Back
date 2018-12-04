'use strict';

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const scryptParameters = scrypt.paramsSync(0.1);
const saltRounds = 10;
const hashPassword = plainPassword => _bcryptjs2.default.genSalt(saltRounds).then(bcryptParameter => _bcryptjs2.default.hash(plainPassword.toString(), bcryptParameter).then(hashedPassword => hashedPassword));
// const hashPassword = plainPassword => scrypt.kdfAsync(plainPassword.toString(), scryptParameters).then(hashedPassword => hashedPassword.toString('base64'));
const comparePasswords = (plainPassword, hashedPassword) => _bcryptjs2.default.compare(plainPassword, hashedPassword);
// const comparePasswords = (plainPassword, hashedPassword) => scrypt.verifyKdfAsync(new Buffer(hashedPassword, 'base64'), plainPassword);

module.exports = {
    hashPassword,
    comparePasswords
};