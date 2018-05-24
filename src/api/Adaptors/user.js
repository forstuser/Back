/*jshint esversion: 6 */
'use strict';

import uuid from 'uuid';
import validator from 'validator';
import NotificationAdaptor from './notification';
import _ from 'lodash';
import moment from 'moment/moment';
import Promise from 'bluebird';

/**
 * This is being used to validate email address.
 * @param email
 * @returns {*}
 */
const validateEmail = email => {
  if (validator.isEmail(email) || email === '') {
    return email;
  }

  return undefined;
};

class UserAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  isUserValid(user) {
    return this.modals.users.count({
      where: {
        id: user.id || user.ID,
      },
    }).then((userCount) => {
      if (userCount && userCount > 0) {
        return true;
      }

      console.log(
          `Error on ${new Date()} for user ${user.mobile_no ||
          user.mobile_no} is as follow: \n \n User does not exist`);
      return false;
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.mobile_no ||
          user.mobile_no} is as follow: \n \n ${err}`);
      return false;
    });
  }

  /**
   * This is for getting user login or register for OTP and true caller
   * @param whereObject
   * @param defaultObject
   * @returns {Promise.<Model, created>}
   */
  loginOrRegister(whereObject, defaultObject) {
    if (!whereObject.mobile_no) {
      whereObject = _.omit(whereObject, 'mobile_no');
    }

    return this.modals.users.findOne({
      where: whereObject,
      attributes: [
        'id',
        [
          'full_name',
          'name',
        ],
        'mobile_no',
        'email',
        'email_verified',
        'email_secret',
        'image_name',
          'gender',
        'fb_id',
      ],
    }).then((result) => {

      console.log(result);
      if (!result || (result && !result.id)) {
        console.log('User is getting created.');
        return this.modals.users.findCreateFind({
          where: whereObject,
          defaults: defaultObject,
          attributes: [
            'id',
            [
              'full_name',
              'name',
            ],
            'mobile_no',
            'email',
            'email_verified',
            'email_secret',
            'image_name',
            'gender',
          ],
        });
      }

      console.log('User is getting updated.');
      return Promise.all([
        Promise.try(() => result.updateAttributes({
          fb_id: defaultObject.fb_id,
          last_active_date: moment.utc(),
          last_api: defaultObject.last_api,
        })), false]);
    });
  }

  /**
   * Retrieve Single user for requested condition.
   * @param filterObject
   * @returns {User}
   */
  retrieveSingleUser(filterObject) {
    filterObject.attributes = [
      'id',
      [
        'full_name',
        'name',
      ],
      'mobile_no',
      'email',
      'email_verified',
      'email_secret',
      'gender',
      [
        this.modals.sequelize.fn('CONCAT', 'consumer/',
            this.modals.sequelize.col('id'), '/images'), 'imageUrl'],
    ];
    return this.modals.users.findOne(filterObject).
        then(item => item ? item.toJSON() : item);
  }

  /**
   * Retrieve User by user ID
   * @param user
   * @returns {User}
   */
  retrieveUserById(user) {
    return Promise.all([
      this.modals.users.findById(user.id || user.ID, {
        attributes: [
          'id',
          [
            'full_name',
            'name',
          ],
          'mobile_no',
          'email',
          'email_verified',
          'email_secret',
          'location',
          'latitude',
          'longitude',
          'image_name',
          'password',
          'gender',
          [
            this.modals.sequelize.fn('CONCAT', '/consumer/',
                this.modals.sequelize.col('id'), '/images'), 'imageUrl'],
        ],
      }), this.retrieveUserAddress({
        where: {
          user_id: user.id || user.ID,
        },
      })]).then((result) => {
      if (result[0]) {
        let user = result[0].toJSON();
        const imageDiff = user.image_name ?
            user.image_name.split('.')[0].split('-') :
            '';
        user.imageUrl = user.image_name ?
            `${user.imageUrl}/${imageDiff[imageDiff.length - 1]}` :
            undefined;
        user.addresses = result[1].map(item => item.toJSON());
        user.hasPin = !!(user.password);
        user = _.omit(user, 'password');
        return JSON.parse(JSON.stringify(user));
      }

      return result[0];
    }).catch((err) => console.log(err));
  }

  retrieveUserImageNameById(user) {
    return this.modals.users.findById(user.id || user.ID, {
      attributes: [
        'image_name',
      ],
    }).then((result) => {
      return result.toJSON();
    });
  }

  /**
   * Retrieve User Profile.
   * @param user
   * @param request
   * @returns {Object}
   */
  retrieveUserProfile(user, request) {
    return this.retrieveUserById(user).then((result) => {
      result.email_secret = undefined;
      return {
        status: true,
        message: 'User Data retrieved',
        binBillDetail: {
          callUs: '+91-124-4343177',
          emailUs: 'support@binbill.com',
          aboutUs: 'http://www.binbill.com/homes/about',
          reportAnErrorOn: 'support@binbill.com',
          faqUrl: 'http://www.binbill.com/faqs',
        },
        userProfile: result,
        forceUpdate: request.pre.forceUpdate,
      };
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return {
        status: false,
        message: 'User Data Retrieval Failed',
        err,
        forceUpdate: request.pre.forceUpdate,
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
  updateUserProfile(user, request, reply) {
    const payload = request.payload;
    let emailID = null;

    if (payload.email) {
      emailID = validateEmail(payload.email);

      if (emailID === undefined) {
        return reply({status: false}).code(400);
      }
    }

    const userUpdates = {
      mobile_no: payload.mobile_no,
      full_name: payload.name,
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      gender: payload.gender,
    };

    const userAddresses = payload.addresses ? payload.addresses.map((item) => {
      item.updated_by = user.id;
      return item;
    }) : [];

    const filterOptions = {
      where: {
        id: user.id || user.ID,
      },
    };
    return this.retrieveUserById(user).then((result) => {
      let userPromise = [];
      if (userAddresses && userAddresses.length > 0) {
        userPromise = userAddresses.map((item) => {
          item.user_id = user.id;
          const existingAddress = result.addresses.find(
              (existingItem) => existingItem.address_type ===
                  item.address_type);
          if (existingAddress) {
            return this.updateUserAddress(item, {
              where: {
                user_id: user.id || user.ID,
                id: existingAddress.id,
              },
            });
          } else {
            return this.createUserAddress(item);
          }
        });
      }

      if (emailID !== null && emailID !== result.email) {
        userUpdates.email = emailID;
        userUpdates.email_secret = uuid.v4();
        userUpdates.email_verified = false;
      } else if (emailID !== null) {
        userUpdates.email = result.email;
        userUpdates.email_secret = result.secret || uuid.v4();
        userUpdates.email_verified = result.email_verified || false;
      }

      userPromise.push(this.updateUserDetail(userUpdates, filterOptions));

      return Promise.all(userPromise);
    }).then(() => {
      const updatedUser = userUpdates;
      if (!updatedUser.email_verified) {
        NotificationAdaptor.sendVerificationMail(updatedUser.email,
            updatedUser);
      }

      return reply({
        status: true,
        message: 'User Details Updated Successfully',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      if (err && err.errors && err.errors.findIndex(
          (item) => item.message === 'email must be unique') !== -1) {
        return reply({
          status: false,
          message: 'The email mentioned is already linked with other account',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
      return reply({
        status: false,
        message: 'User Detail Update failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      });
    });
  }

  /**
   * Update User Detail for given filter Object and Update Object
   * @param updateValues
   * @param filterOptions
   */
  updateUserDetail(updateValues, filterOptions) {
    return this.modals.users.update(updateValues, filterOptions).
        catch(console.log);
  }

  /**
   * Update User Address for given filter and update values
   * @param updateValues
   * @param filterOptions
   */
  updateUserAddress(updateValues, filterOptions) {
    return this.modals.userAddress.update(updateValues, filterOptions);
  }

  /**
   * Create user address
   * @param updateValues
   * @param filterOptions
   */
  createUserAddress(updateValues, filterOptions) {
    return this.modals.userAddress.create(updateValues, filterOptions);
  }

  retrieveUserAddress(filterOptions) {
    filterOptions.attributes = [
      'address_type',
      'address_line_1',
      'address_line_2',
      'city',
      'state',
      'pin',
      'latitude',
      'longitude'];
    return this.modals.userAddress.findAll(filterOptions);
  }
}

export default UserAdaptor;
