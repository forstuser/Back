'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//var config = require('./pg').paytmnew;

const crypt = {
  iv: '@@@@&&&&####$$$$',

  encrypt: function (data, custom_key) {
    const iv = this.iv;
    const key = custom_key;
    let algo = '256';
    switch (key.length) {
      case 16:
        algo = '128';
        break;
      case 24:
        algo = '192';
        break;
      case 32:
        algo = '256';
        break;

    }
    const cipher = _crypto2.default.createCipheriv('AES-' + algo + '-CBC', key, iv);
    //var cipher = crypto.createCipher('aes256',key);
    let encrypted = cipher.update(data, 'binary', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  },

  decrypt: function (data, custom_key) {
    const iv = this.iv;
    const key = custom_key;
    let algo = '256';
    switch (key.length) {
      case 16:
        algo = '128';
        break;
      case 24:
        algo = '192';
        break;
      case 32:
        algo = '256';
        break;
    }
    const decipher = _crypto2.default.createDecipheriv('AES-' + algo + '-CBC', key, iv);
    let decrypted = decipher.update(data, 'base64', 'binary');
    try {
      decrypted += decipher.final('binary');
    } catch (e) {
      _util2.default.log(_util2.default.inspect(e));
    }
    return decrypted;
  },

  gen_salt: length => {
    return new Promise((resolve, reject) => _crypto2.default.randomBytes(length * 3.0 / 4.0, (err, buf) => {
      let salt;
      if (!err) {
        salt = buf.toString('base64');
        return resolve(salt);
      }

      return reject(err);
      //salt=Math.floor(Math.random()*8999)+1000;
    }));
  },

  /* one way md5 hash with salt */
  md5sum: function (salt, data) {
    return _crypto2.default.createHash('md5').update(salt + data).digest('hex');
  },
  sha256sum: function (salt, data) {
    return _crypto2.default.createHash('sha256').update(data + salt).digest('hex');
  }
};

exports.default = crypt;


(() => {
  let i;

  function logsalt(err, salt) {
    if (!err) {
      console.log('salt is ' + salt);
    }
  }

  if (require.main === module) {
    const enc = crypt.encrypt('One97');
    console.log('encrypted - ' + enc);
    console.log('decrypted - ' + crypt.decrypt(enc));

    for (i = 0; i < 5; i++) {
      crypt.gen_salt(4, logsalt);
    }
  }
})();