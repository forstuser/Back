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

  /**
   * This is for getting user login or register for OTP and true caller
   * @param whereObject
   * @param defaultObject
   * @returns {Promise.<Model, created>}
   */


  _createClass(UserAdaptor, [{
    key: 'loginOrRegister',
    value: function loginOrRegister(whereObject, defaultObject) {
      return this.modals.users.findCreateFind({
        where: whereObject,
        defaults: defaultObject,
        attributes: ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret']
      });
    }

    /**
     * Retrieve Single user for requested condition.
     * @param filterObject
     * @returns {User}
     */

  }, {
    key: 'retrieveSingleUser',
    value: function retrieveSingleUser(filterObject) {
      filterObject.attributes = ['id', ['full_name', 'name'], 'mobile_no', 'email', 'email_verified', 'email_secret', [this.modals.sequelize.fn('CONCAT', 'consumer/', this.modals.sequelize.col('id'), '/images'), 'imageUrl']];
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
      return Promise.all([this.modals.users.findById(user.id, {
        attributes: [
          'id',
          [
            'full_name',
            'name'],
          'mobile_no',
          'email',
          'email_verified',
          'email_secret',
          'location',
          'latitude',
          'longitude',
          [
            this.modals.sequelize.fn('CONCAT', '/consumer/',
                this.modals.sequelize.col('id'), '/images'),
            'imageUrl']],
      }), this.retrieveUserAddress({
        where: {
          user_id: user.id
        }
      })]).then(function (result) {
        if (result[0]) {
          var _user = result[0].toJSON();
          _user.addresses = result[1].map(function (item) {
            return item.toJSON();
          });
          return _user;
        }

        return result[0];
      });
    }
  }, {
    key: 'retrieveUserImageNameById',
    value: function retrieveUserImageNameById(user) {
      return this.modals.users.findById(user.id, {
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
        console.log({ API_Logs: err });
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
      var _this = this;

      var payload = request.payload;
      var emailID = null;

      if (payload.email) {
        emailID = validateEmail(payload.email);

        if (emailID === undefined) {
          return reply({ status: false }).code(400);
        }
      }

      var userUpdates = {
        mobile_no: payload.mobile_no,
        full_name: payload.name,
        location: payload.location,
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      var userAddresses = payload.addresses ?
          payload.addresses.map(function(item) {
        item.updated_by = user.id;
        return item;
          }) :
          [];

      var filterOptions = {
        where: {
          id: user.id
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
              return _this.updateUserAddress(item, {
                where: {
                  user_id: user.id,
                  id: existingAddress.id
                }
              });
            } else {
              return _this.createUserAddress(item);
            }
          });
        }

        if (emailID !== null && emailID !== result.email) {
          userUpdates.email = emailID;
          userUpdates.email_secret = _uuid2.default.v4();
          userUpdates.email_verified = false;
        } else {
          userUpdates.email = result.email;
          userUpdates.email_secret = result.secret;
          userUpdates.email_verified = result.email_verified;
        }

        userPromise.push(_this.updateUserDetail(userUpdates, filterOptions));

        return Promise.all(userPromise);
      }).then(function () {
        // console.log("EMAIL: ", payload.email);
        var updatedUser = userUpdates;
        console.log(updatedUser);
        if (!updatedUser.email_verified) {
          _notification2.default.sendVerificationMail(updatedUser.email, updatedUser);
        }

        return reply({
          status: true,
          message: 'User Details Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        }).code(200);
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return reply({
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
      console.log(this.modals.users);

      return this.modals.users.update(updateValues, filterOptions);
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