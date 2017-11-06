/*jshint esversion: 6 */
'use strict';

import uuid from 'uuid';
import validator from 'validator';
import NotificationAdaptor from './notification';

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

  /**
   * This is for getting user login or register for OTP and true caller
   * @param whereObject
   * @param defaultObject
   * @returns {Promise.<Model, created>}
   */
  loginOrRegister(whereObject, defaultObject) {
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
      ],
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
      [
        this.modals.sequelize.fn('CONCAT', 'consumer/',
            this.modals.sequelize.col('id'), '/images'), 'imageUrl'],
    ];
    return this.modals.users.findOne(filterObject).then(item => item ? item.toJSON() : item);
  }

  /**
   * Retrieve User by user ID
   * @param user
   * @returns {User}
   */
  retrieveUserById(user) {
    return Promise.all([
      this.modals.users.findById(user.id, {
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
          [
            this.modals.sequelize.fn('CONCAT', 'consumer/',
                this.modals.sequelize.col('id'), '/images'), 'imageUrl'],
        ],
      }), this.retrieveUserAddress({
        where: {
          user_id: user.id,
        },
      })]).then((result) => {
      if(result[0]) {
          const user = result[0].toJSON();
          user.addresses = result[1].map(item => item.toJSON());
          return user;
      }
      
      return result[0];
    });
  }

  retrieveUserImageNameById(user) {
    return this.modals.users.findById(user.id, {
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
      console.log({API_Logs: err});
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
      mobile_no: payload.phoneNo,
      full_name: payload.name,
    };

    const userAddresses = payload.addresses.map((item) => {
      item.updated_by = user.id;
      return item;
    });

    const filterOptions = {
      where: {
        id: user.id,
      },
    };
    return this.retrieveUserById(user).then((result) => {
      let userPromise;
      if (userAddresses.length > 0) {
        userPromise = userAddresses.map((item) => {
          item.user_id = user.id;
          const existingAddress = result.addresses.find(
              (existingItem) => existingItem.address_type ===
                  item.address_type);
          if (existingAddress) {
            return this.updateUserAddress(item, {
              where: {
                user_id: user.id,
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
      } else {
        userUpdates.email = result.email;
        userUpdates.email_secret = result.secret;
        userUpdates.email_verified = result.email_verified;
      }

      userPromise.push(this.updateUserDetail(userUpdates, filterOptions));

      return Promise.all(userPromise);
    }).then(() => {
      // console.log("EMAIL: ", payload.email);
      const updatedUser = userUpdates;
      console.log(updatedUser);
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
      console.log({API_Logs: err});
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
    console.log(this.modals.users);

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