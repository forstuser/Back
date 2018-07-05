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

  async isUserValid(user) {
    try {
      const userCount = await this.modals.users.count({
        where: {
          id: user.id || user.ID,
        },
      });
      return !!(userCount && userCount > 0);
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user ${user.mobile_no ||
          user.mobile_no} is as follow: \n \n ${err}`);
      return false;
    }
  }

  /**
   * This is for getting user login or register for OTP and true caller
   * @param whereObject
   * @param defaultObject
   * @returns {Promise.<Model, created>}
   */
  async loginOrRegister(whereObject, defaultObject) {
    if (!whereObject.mobile_no) {
      whereObject = _.omit(whereObject, 'mobile_no');
    }

    const result = await this.modals.users.findOne({
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
    });

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
  }

  /**
   *
   * @param filterObject
   * @returns {Promise<Model>}
   */
  async retrieveSingleUser(filterObject) {
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
    const item = await this.modals.users.findOne(filterObject);
    return item ? item.toJSON() : item;
  }

  /**
   * Retrieve User by user ID
   * @param user
   * @returns {User}
   */
  async retrieveUserById(user) {
    const result = await Promise.all([
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
      })]);
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
  }

  async retrieveUserImageNameById(user) {
    const result = await this.modals.users.findById(user.id || user.ID, {
      attributes: [
        'image_name',
      ],
    });
    return result.toJSON();
  }

  /**
   * Retrieve User Profile.
   * @param user
   * @param request
   * @returns {Object}
   */
  async retrieveUserProfile(user, request) {
    try {
      const result = await this.retrieveUserById(user);
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
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: false,
        message: 'User Data Retrieval Failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  /**
   * Update User Profile
   * @param user
   * @param request
   * @param reply
   * @returns {Promise.<T>}
   */
  async updateUserProfile(user, request, reply) {
    try {
      const payload = request.payload;
      let emailID = null;

      if (payload.email) {
        emailID = validateEmail(payload.email);

        if (emailID === undefined) {
          return reply.response({status: false}).code(400);
        }
      }

      const {mobile_no, name, location, latitude, longitude, gender, addresses} = payload;

      const userUpdates = {
        mobile_no, full_name: name,
        location, latitude, longitude, gender,
      };

      const user_id = user.id || user.ID;
      const userAddresses = addresses ? addresses.map((item) => {
        item.updated_by = user.id;
        return item;
      }) : [];

      const filterOptions = {where: {id: user.id || user.ID}};
      const result = await this.retrieveUserById(user);
      let userPromise = [];
      if (userAddresses && userAddresses.length > 0) {
        userPromise = userAddresses.map((item) => {
          item.user_id = user_id;
          const existingAddress = result.addresses.find(
              (existingItem) => existingItem.address_type ===
                  item.address_type);
          if (existingAddress) {
            return this.updateUserAddress(item, {
              where: {user_id, id: existingAddress.id},
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

      await Promise.all(userPromise);

      const updatedUser = userUpdates;
      if (!updatedUser.email_verified) {
        NotificationAdaptor.sendVerificationMail(updatedUser.email,
            updatedUser);
      }

      return reply.response({
        status: true,
        message: 'User Details Updated Successfully',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));

      if (err && err.errors && err.errors.findIndex(
          (item) => item.message === 'email must be unique') !== -1) {
        return reply.response({
          status: false,
          message: 'The email mentioned is already linked with other account',
          err,
          forceUpdate: request.pre.forceUpdate,
        });
      }
      return reply.response({
        status: false,
        message: 'User Detail Update failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  /**
   * Update User Detail for given filter Object and Update Object
   * @param updateValues
   * @param filterOptions
   */
  updateUserDetail(updateValues, filterOptions) {
    return this.modals.users.update(updateValues, filterOptions);
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
      'address_type', 'address_line_1', 'address_line_2',
      'city', 'state', 'pin', 'latitude', 'longitude'];
    return this.modals.userAddress.findAll(filterOptions);
  }
}

export default UserAdaptor;
