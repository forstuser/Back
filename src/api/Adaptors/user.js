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
      const userCount = await this.modals.users.count(
          {where: {id: user.id || user.ID}});
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
      where: whereObject, attributes: [
        'id', ['full_name', 'name'], 'mobile_no', 'email',
        'email_verified', 'email_secret', 'image_name', 'gender', 'fb_id'],
    });

    if (!result || (result && !result.id)) {
      return this.modals.users.findCreateFind({
        where: whereObject, defaults: defaultObject,
        attributes: [
          'id', ['full_name', 'name'], 'mobile_no', 'email',
          'email_verified', 'email_secret', 'image_name', 'gender'],
      });
    }

    return Promise.all([
      Promise.try(() => result.updateAttributes({
        fb_id: defaultObject.fb_id, last_active_date: moment.utc(),
        last_api: defaultObject.last_api,
      })), false]);
  }

  /**
   * This is for getting user login or register for OTP and true caller
   * @param whereObject
   * @param defaultObject
   * @param seller_id
   * @returns {Promise.<Model, created>}
   */
  async createUserForSeller(whereObject, defaultObject, seller_id) {
    if (!whereObject.mobile_no) {
      whereObject = _.omit(whereObject, 'mobile_no');
    }

    let result = await this.modals.users.findOne({
      where: whereObject, attributes: [
        'id', ['full_name', 'name'], 'mobile_no',
        'email', 'email_verified', 'email_secret',
        'image_name', 'gender', 'fb_id', 'user_status_type'],
    });

    if (!result || (result && !result.id)) {
      result = await this.modals.users.create(defaultObject);
    }

    const user_detail = result.toJSON();
    await this.retrieveOrUpdateUserIndexedData(
        {where: {user_id: user_detail.id}, attributes: ['my_seller_ids']},
        {seller_id});

    return user_detail;
  }

  /**
   *
   * @param filterObject
   * @returns {Promise<Model>}
   */
  async retrieveSingleUser(filterObject) {
    filterObject.attributes = [
      'id', ['full_name', 'name'], 'mobile_no',
      'email', 'email_verified', 'email_secret', 'gender', 'user_status_type',
      [
        this.modals.sequelize.fn('CONCAT', 'consumer/',
            this.modals.sequelize.col('id'), '/images'), 'imageUrl'],
    ];
    const item = await this.modals.users.findOne(filterObject);
    return item ? item.toJSON() : item;
  }

  /**
   *
   * @param filterObject
   * @param is_create
   * @param updates
   * @returns {Promise<Model>}
   */
  async retrieveSellerUser(filterObject, is_create, updates) {
    filterObject.attributes = ['id', 'mobile_no', 'email'];
    console.log(filterObject);
    let seller_user = await this.modals.seller_users.findOne(filterObject);
    if (is_create) {
      filterObject.last_active_date = moment();
      if (!seller_user) {
        seller_user = await this.modals.seller_users.create(
            updates || filterObject.where);
      }
    }
    if (seller_user) {
      await seller_user.updateAttributes(updates || filterObject.where);
    }

    return seller_user ? seller_user.toJSON() : seller_user;
  }

  /**
   * Retrieve User by user ID
   * @param user
   * @returns {User}
   */
  async retrieveUserById(user, address_id) {
    const result = await Promise.all([
      this.modals.users.findById(user.id || user.ID, {
        attributes: [
          'id', ['full_name', 'name'], 'mobile_no', 'email',
          'email_verified', 'email_secret', 'location', 'latitude',
          'longitude', 'image_name', 'password', 'gender', [
            this.modals.sequelize.fn('CONCAT', '/consumer/',
                this.modals.sequelize.col('id'), '/images'), 'imageUrl'], [
            this.modals.sequelize.literal(
                `(Select sum(amount) from table_wallet_user_cashback where user_id = ${user.id ||
                user.ID} and status_type in (16) group by user_id)`),
            'wallet_value']],
      }),
      this.retrieveUserAddresses({
        where: JSON.parse(
            JSON.stringify({user_id: user.id || user.ID, id: address_id})),
      })]);
    if (result[0]) {
      let user = result[0].toJSON();
      const imageDiff = user.image_name ?
          user.image_name.split('.')[0].split('-') : '';
      user.imageUrl = user.image_name ?
          `${user.imageUrl}/${imageDiff[imageDiff.length - 1]}` : undefined;
      user.addresses = result[1].map(item => item.toJSON());
      user.hasPin = !!(user.password);
      user = _.omit(user, 'password');
      return JSON.parse(JSON.stringify(user));
    }

    return result[0];
  }

  async retrieveUserImageNameById(user) {
    const result = await this.modals.users.findById(user.id || user.ID,
        {attributes: ['image_name']});
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
        status: true, message: 'User Data retrieved', binBillDetail: {
          callUs: '+91-124-4343177', emailUs: 'support@binbill.com',
          aboutUs: 'http://www.binbill.com/homes/about',
          reportAnErrorOn: 'support@binbill.com',
          faqUrl: 'http://www.binbill.com/faqs',
        }, userProfile: result, forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      const {params, query, headers, payload, method, url} = request;
      this.modals.logs.create({
        api_action: method,
        api_path: url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({params, query, headers, payload, err}),
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
  async updateUserDetail(updateValues, filterOptions) {
    return await this.modals.users.update(updateValues, filterOptions);
  }

  /**
   * Update User Address for given filter and update values
   * @param updateValues
   * @param filterOptions
   */
  async updateUserAddress(updateValues, filterOptions) {
    return await this.modals.user_addresses.update(updateValues, filterOptions);
  }

  /**
   * Create user address
   * @param updateValues
   * @param filterOptions
   */
  async createUserAddress(updateValues, filterOptions) {
    return await this.modals.user_addresses.create(updateValues, filterOptions);
  }

  /**
   * Create user address
   * @param updateValues
   * @param filterOptions
   */
  async deleteUserAddress(updateValues, filterOptions) {
    return await this.modals.user_addresses.destroy(updateValues,
        filterOptions);
  }

  async retrieveUserAddresses(filterOptions) {
    filterOptions.attributes = [
      'address_type', 'address_line_1', 'address_line_2',
      'city_id', 'state_id', 'locality_id', 'pin', 'latitude',
      'longitude', 'id', 'user_id', [
        this.modals.sequelize.literal(
            '(Select state_name from table_states as state where state.id = user_addresses.state_id)'),
        'state_name'], [
        this.modals.sequelize.literal(
            '(Select name from table_cities as city where city.id = user_addresses.city_id)'),
        'city_name'], [
        this.modals.sequelize.literal(
            '(Select name from table_localities as locality where locality.id = user_addresses.locality_id)'),
        'locality_name'], [
        this.modals.sequelize.literal(
            '(Select pin_code from table_localities as locality where locality.id = user_addresses.locality_id)'),
        'pin_code']];
    filterOptions.order = [['address_type']];
    return await this.modals.user_addresses.findAll(filterOptions);
  }

  async retrieveUserAddress(filterOptions) {
    filterOptions.attributes = [
      'address_type', 'address_line_1', 'address_line_2',
      'city_id', 'state_id', 'locality_id', 'pin', 'latitude',
      'longitude', 'id', [
        this.modals.sequelize.literal(
            '(Select state_name from table_states as state where state.id = user_addresses.state_id)'),
        'state_name'], [
        this.modals.sequelize.literal(
            '(Select name from table_cities as city where city.id = user_addresses.city_id)'),
        'city_name'], [
        this.modals.sequelize.literal(
            '(Select name from table_localities as locality where locality.id = user_addresses.locality_id)'),
        'locality_name'], [
        this.modals.sequelize.literal(
            '(Select pin_code from table_localities as locality where locality.id = user_addresses.locality_id)'),
        'pin_code']];
    let address = await this.modals.user_addresses.findOne(filterOptions);

    return address ? address.toJSON() : {};
  }

  async retrieveUserIndexedData(options) {
    const result = await this.modals.user_index.findAll(options);
    return result && result.length > 0 ? result[0].toJSON() : undefined;
  }

  async retrieveUserIndexes(options) {
    const result = await this.modals.user_index.findAll(options);
    return result && result.length > 0 ?
        result.map(item => item.toJSON()) :
        undefined;
  }

  async updateUserIndexedData(updateValues, filterOptions) {
    return await this.modals.user_index.update(updateValues, filterOptions);
  }

  async createUserIndexedData(updateValues, filterOptions) {
    return await this.modals.user_index.create(updateValues, filterOptions);
  }

  async retrieveOrUpdateUserIndexedData(options, defaults) {
    let result = await this.modals.user_index.findOne(options);

    const userIndex = result ? result.toJSON() : {user_id: defaults.user_id};
    if (defaults.credit_id) {
      userIndex.wallet_seller_credit_ids = userIndex.wallet_seller_credit_ids ||
          [];
      userIndex.wallet_seller_credit_ids.push(defaults.credit_id);
    }
    if (defaults.point_id) {
      userIndex.wallet_seller_loyalty_ids = userIndex.wallet_seller_loyalty_ids ||
          [];
      userIndex.wallet_seller_loyalty_ids.push(defaults.point_id);
    }
    if (defaults.seller_id) {
      userIndex.my_seller_ids = userIndex.my_seller_ids || [];
      userIndex.my_seller_ids.push(defaults.seller_id);
      userIndex.my_seller_ids = _.uniq(userIndex.my_seller_ids);
    }
    if (result) {
      await result.updateAttributes(userIndex);
    } else {
      result = await this.createUserIndexedData(userIndex, options);
    }

    return result.toJSON();
  }
}

export default UserAdaptor;
