/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _notification = require('./notification');

var _notification2 = _interopRequireDefault(_notification);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This is being used to validate email address.
 * @param email
 * @returns {*}
 */
var validateEmail = function validateEmail(email) {
  if (_validator2.default.isEmail(email) || email === '') {
    return email;
  }

  return undefined;
};

var UserAdaptor = function () {
  function UserAdaptor(modals) {
    _classCallCheck(this, UserAdaptor);

    this.modals = modals;
  }

  _createClass(UserAdaptor, [{
    key: 'isUserValid',
    value: function isUserValid(user) {
      return this.modals.users.count({
        where: {
          id: user.id || user.ID
        }
      }).then(function (userCount) {
        if (userCount && userCount > 0) {
          return true;
        }

        console.log('Error on ' + new Date() + ' for user ' + (user.mobile_no || user.mobile_no) + ' is as follow: \n \n User does not exist');
        return false;
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.mobile_no || user.mobile_no) + ' is as follow: \n \n ' + err);
        return false;
      });
    }

    /**
     * This is for getting user login or register for OTP and true caller
     * @param whereObject
     * @param defaultObject
     * @returns {Promise.<Model, created>}
     */

  }, {
    key: 'loginOrRegister',
    value: function loginOrRegister(whereObject, defaultObject) {
      var _this = this;

      if (!whereObject.mobile_no) {
        whereObject = _lodash2.default.omit(whereObject, 'mobile_no');
      }

      return this.modals.users.findOne({
        where: whereObject,
        attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'image_name', 'gender', 'fb_id']
      }).then(function (result) {

        console.log(result);
        if (!result || result && !result.id) {
          console.log('User is getting created.');
          return _this.modals.users.findCreateFind({
            where: whereObject,
            defaults: defaultObject,
            attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'image_name', 'gender']
          });
        }

        console.log('User is getting updated.');
        return _bluebird2.default.all([_bluebird2.default.try(function () {
          return result.updateAttributes({
            fb_id: defaultObject.fb_id,
            last_active_date: _moment2.default.utc(),
            last_api: defaultObject.last_api
          });
        }), false]);
      });
    }

    /**
     *
     * @param filterObject
     * @returns {Promise<Model>}
     */

  }, {
    key: 'retrieveSingleUser',
    value: function retrieveSingleUser(filterObject) {
      filterObject.attributes = ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'gender', [this.modals.sequelize.fn('CONCAT', 'consumer/', this.modals.sequelize.col('id'), '/images'), 'imageUrl']];
      return this.modals.users.findOne(filterObject).then(function (item) {
        return item ? item.toJSON() : item;
      });
    }

    /**
     * Retrieve User by user ID
     * @param user
     * @returns {User}
     */

  }, {
    key: 'retrieveUserById',
    value: function retrieveUserById(user) {
      return _bluebird2.default.all([this.modals.users.findById(user.id || user.ID, {
        attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', 'location', 'latitude', 'longitude', 'image_name', 'password', 'gender', [this.modals.sequelize.fn('CONCAT', '/consumer/', this.modals.sequelize.col('id'), '/images'), 'imageUrl']]
      }), this.retrieveUserAddress({
        where: {
          user_id: user.id || user.ID
        }
      })]).then(function (result) {
        if (result[0]) {
          var _user = result[0].toJSON();
          var imageDiff = _user.image_name ? _user.image_name.split('.')[0].split('-') : '';
          _user.imageUrl = _user.image_name ? _user.imageUrl + '/' + imageDiff[imageDiff.length - 1] : undefined;
          _user.addresses = result[1].map(function (item) {
            return item.toJSON();
          });
          _user.hasPin = !!_user.password;
          _user = _lodash2.default.omit(_user, 'password');
          return JSON.parse(JSON.stringify(_user));
        }

        return result[0];
      }).catch(function (err) {
        return console.log(err);
      });
    }
  }, {
    key: 'retrieveUserImageNameById',
    value: function retrieveUserImageNameById(user) {
      return this.modals.users.findById(user.id || user.ID, {
        attributes: ['image_name']
      }).then(function (result) {
        return result.toJSON();
      });
    }

    /**
     * Retrieve User Profile.
     * @param user
     * @param request
     * @returns {Object}
     */

  }, {
    key: 'retrieveUserProfile',
    value: function retrieveUserProfile(user, request) {
      return this.retrieveUserById(user).then(function (result) {
        result.email_secret = undefined;
        return {
          status: true,
          message: 'User Data retrieved',
          binBillDetail: {
            callUs: '+91-124-4343177',
            emailUs: 'support@binbill.com',
            aboutUs: 'http://www.binbill.com/homes/about',
            reportAnErrorOn: 'support@binbill.com',
            faqUrl: 'http://www.binbill.com/faqs'
          },
          userProfile: result,
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return {
          status: false,
          message: 'User Data Retrieval Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }

    /**
     * Update User Profile
     * @param user
     * @param request
     * @param reply
     * @returns {Promise.<T>}
     */

  }, {
    key: 'updateUserProfile',
    value: function updateUserProfile(user, request, reply) {
      var _this2 = this;

      var payload = request.payload;
      var emailID = null;

      if (payload.email) {
        emailID = validateEmail(payload.email);

        if (emailID === undefined) {
          return reply.response({ status: false }).code(400);
        }
      }

      var userUpdates = {
        mobile_no: payload.mobile_no,
        full_name: payload.name,
        location: payload.location,
        latitude: payload.latitude,
        longitude: payload.longitude,
        gender: payload.gender
      };

      var userAddresses = payload.addresses ? payload.addresses.map(function (item) {
        item.updated_by = user.id;
        return item;
      }) : [];

      var filterOptions = {
        where: {
          id: user.id || user.ID
        }
      };
      return this.retrieveUserById(user).then(function (result) {
        var userPromise = [];
        if (userAddresses && userAddresses.length > 0) {
          userPromise = userAddresses.map(function (item) {
            item.user_id = user.id;
            var existingAddress = result.addresses.find(function (existingItem) {
              return existingItem.address_type === item.address_type;
            });
            if (existingAddress) {
              return _this2.updateUserAddress(item, {
                where: {
                  user_id: user.id || user.ID,
                  id: existingAddress.id
                }
              });
            } else {
              return _this2.createUserAddress(item);
            }
          });
        }

        if (emailID !== null && emailID !== result.email) {
          userUpdates.email = emailID;
          userUpdates.email_secret = _uuid2.default.v4();
          userUpdates.email_verified = false;
        } else if (emailID !== null) {
          userUpdates.email = result.email;
          userUpdates.email_secret = result.secret || _uuid2.default.v4();
          userUpdates.email_verified = result.email_verified || false;
        }

        userPromise.push(_this2.updateUserDetail(userUpdates, filterOptions));

        return _bluebird2.default.all(userPromise);
      }).then(function () {
        var updatedUser = userUpdates;
        if (!updatedUser.email_verified) {
          _notification2.default.sendVerificationMail(updatedUser.email, updatedUser);
        }

        return reply.response({
          status: true,
          message: 'User Details Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        if (err && err.errors && err.errors.findIndex(function (item) {
          return item.message === 'email must be unique';
        }) !== -1) {
          return reply.response({
            status: false,
            message: 'The email mentioned is already linked with other account',
            err: err,
            forceUpdate: request.pre.forceUpdate
          });
        }
        return reply.response({
          status: false,
          message: 'User Detail Update failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        });
      });
    }

    /**
     * Update User Detail for given filter Object and Update Object
     * @param updateValues
     * @param filterOptions
     */

  }, {
    key: 'updateUserDetail',
    value: function updateUserDetail(updateValues, filterOptions) {
      return this.modals.users.update(updateValues, filterOptions).catch(console.log);
    }

    /**
     * Update User Address for given filter and update values
     * @param updateValues
     * @param filterOptions
     */

  }, {
    key: 'updateUserAddress',
    value: function updateUserAddress(updateValues, filterOptions) {
      return this.modals.userAddress.update(updateValues, filterOptions);
    }

    /**
     * Create user address
     * @param updateValues
     * @param filterOptions
     */

  }, {
    key: 'createUserAddress',
    value: function createUserAddress(updateValues, filterOptions) {
      return this.modals.userAddress.create(updateValues, filterOptions);
    }
  }, {
    key: 'retrieveUserAddress',
    value: function retrieveUserAddress(filterOptions) {
      filterOptions.attributes = ['address_type', 'address_line_1', 'address_line_2', 'city', 'state', 'pin', 'latitude', 'longitude'];
      return this.modals.userAddress.findAll(filterOptions);
    }
  }]);

  return UserAdaptor;
}();

exports.default = UserAdaptor;