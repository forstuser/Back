'use strict';

import bcrypt from 'bcryptjs';

// const scryptParameters = scrypt.paramsSync(0.1);
const saltRounds = 10;
const hashPassword = plainPassword => bcrypt.genSalt(saltRounds).
    then((bcryptParameter) => bcrypt.hash(plainPassword.toString(),
        bcryptParameter).then(hashedPassword => hashedPassword));
// const hashPassword = plainPassword => scrypt.kdfAsync(plainPassword.toString(), scryptParameters).then(hashedPassword => hashedPassword.toString('base64'));
const comparePasswords = (plainPassword, hashedPassword) => bcrypt.compare(
    plainPassword, hashedPassword);
// const comparePasswords = (plainPassword, hashedPassword) => scrypt.verifyKdfAsync(new Buffer(hashedPassword, 'base64'), plainPassword);

module.exports = {
  hashPassword,
  comparePasswords,
};