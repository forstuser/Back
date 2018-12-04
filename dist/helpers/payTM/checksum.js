'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genCheckSumByString = genCheckSumByString;

var _crypt = require('./crypt');

var _crypt2 = _interopRequireDefault(_crypt);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//mandatory flag: when it set, only mandatory parameters are added to checksum

function paramsToString(params, mandatoryflag) {
  let data = '';
  let flag = !!params.refund;
  delete params.refund;
  const tempKeys = Object.keys(params);
  if (!flag) tempKeys.sort();
  tempKeys.forEach(key => {
    if (key !== 'CHECKSUMHASH') {
      if (params[key] === 'null') params[key] = '';
      if (!mandatoryflag || mandatoryParams.indexOf(key) !== -1) {
        data += params[key] + '|';
      }
    }
  });
  return data;
}

function genchecksum(params, key, cb) {
  const flag = !!params.refund;
  const data = paramsToString(params);

  _crypt2.default.gen_salt(4, (err, salt) => {
    const sha256 = _crypto2.default.createHash('sha256').update(data + salt).digest('hex');
    const check_sum = sha256 + salt;
    const encrypted = _crypt2.default.encrypt(check_sum, key);
    if (flag) {
      params.CHECKSUM = encodeURIComponent(encrypted);
      params.CHECKSUM = encrypted;
    } else {
      params.CHECKSUMHASH = encodeURIComponent(encrypted);
      params.CHECKSUMHASH = encrypted;
    }
    cb(undefined, params);
  });
}

async function genCheckSumByString(params, key) {
  try {
    const salt = await _crypt2.default.gen_salt(4);
    const sha256 = _crypto2.default.createHash('sha256').update(params + '|' + salt).digest('hex');
    const check_sum = sha256 + salt;
    const encrypted = _crypt2.default.encrypt(check_sum, key);

    let CHECKSUMHASH = encodeURIComponent(encrypted);
    CHECKSUMHASH = encrypted;
    return CHECKSUMHASH;
  } catch (e) {
    throw e;
  }
}

function verifychecksum(params, key) {
  const data = paramsToString(params, false);
  //TODO: after PG fix on thier side remove below two lines
  if (params.CHECKSUMHASH) {
    params.CHECKSUMHASH = params.CHECKSUMHASH.replace('\n', '');
    params.CHECKSUMHASH = params.CHECKSUMHASH.replace('\r', '');

    const temp = decodeURIComponent(params.CHECKSUMHASH);
    const checksum = _crypt2.default.decrypt(temp, key);
    const salt = checksum.substr(checksum.length - 4);
    const sha256 = checksum.substr(0, checksum.length - 4);
    const hash = _crypto2.default.createHash('sha256').update(data + salt).digest('hex');
    if (hash === sha256) {
      return true;
    } else {
      _util2.default.log('checksum is wrong');
      return false;
    }
  } else {
    _util2.default.log('checksum not found');
    return false;
  }
}

function verifychecksumbystring(params, key, checksumhash) {

  const checksum = _crypt2.default.decrypt(checksumhash, key);
  const salt = checksum.substr(checksum.length - 4);
  const sha256 = checksum.substr(0, checksum.length - 4);
  const hash = _crypto2.default.createHash('sha256').update(params + '|' + salt).digest('hex');
  if (hash === sha256) {
    return true;
  } else {
    _util2.default.log('checksum is wrong');
    return false;
  }
}