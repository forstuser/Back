/**
 * Created by arpit on 7/3/2017.
 */
const bCrypt = require('bcrypt-nodejs');
// const fs = require('fs');
const authentication = require('./authentication');
const roles = require('../constants');

const otplib = require('otplib').default;
const totp = require('otplib/totp').default;
const requestPromise = require('request-promise');

let userModel;
let userRelationModel;
let sequelize;

function isValidPassword(userpass, passwordValue) {
  return bCrypt.compareSync(passwordValue, userpass);
}

class UserController {
  constructor(modal) {
    this.User = modal.users;
    userModel = modal.table_users;
    userRelationModel = modal.table_users_temp;
    sequelize = modal.Sequelize;
  }

  static dispatchOTP(request, reply) {
    totp.options = {
      step: 180
    };

    const secret = otplib.authenticator.generateSecret();
    const otp = totp.generate(secret);
    const options = {
      uri: 'http://login.smsgatewayhub.com/api/mt/SendSMS',
      qs: {
        APIKey: 'yoCgEiWDwkChKkOTQh3MDg',
        senderid: 'BinBil',
        channel: 2,
        DCS: 0,
        flashsms: 0,
        number: request.payload.PhoneNo,
        text: `Your verification code is "${otp}". Please enter this code to login your account.`,
        route: 1
      },
      timeout: 170000,
      json: true // Automatically parses the JSON string in the response
    };

    Promise.all([requestPromise(options), userModel.findOne({
      where: {
        PhoneNo: request.payload.PhoneNo
      }
    })]).then((response) => {
      if (response[0].ErrorMessage === 'Success') {
        if (response[1]) {
          response[0].updateAttributes({
            LastLoginOn: sequelize.NOW
          });
          reply({
            Name: response[0].Name
          });
        } else {
          reply({
            PhoneNo: request.payload.PhoneNo
          });
        }
        userRelationModel.findOrCreate({
          where: {
            PhoneNo: request.payload.PhoneNo
          },
          defaults: {
            OTP: otp,
            secret
          }
        }).then((result) => {
          if (!result[1]) {
            result[0].updateAttributes({
              OTP: otp,
              secret
            });
          }
        }).catch(reply);
      } else {
        reply({ Error: response.ErrorMessage }).code(403);
      }
    }).catch(reply);
  }

  static validateOTP(request, reply) {
    const trueObject = request.payload.TrueObject;
    if (request.payload.BBLogin_Type === 1) {
      userRelationModel.findOne({
        where: {
          PhoneNo: trueObject.PhoneNo
        }
      }).then((tokenResult) => {
        if (totp.check(tokenResult.OTP, tokenResult.secret)) {
          userModel.findOrCreate({
            where: {
              PhoneNo: trueObject.PhoneNo
            }
          }).then((userData) => {
            userData.updateAttributes({
              LastLoginOn: sequelize.NOW
            });
            reply({ statusCode: 201 }).header('authorization', `bearer ${authentication.generateToken(userData[0])}`);
          });
        } else {
          reply({ message: 'Invalid OTP' }).code(401);
        }
      });
    } else if (request.payload.BBLogin_Type === 2) {
      const userItem = {
        EmailAddress: trueObject.EmailAddress,
        Name: trueObject.Name,
        Password: bCrypt.hashSync(trueObject.Password, bCrypt.genSaltSync(8), null),
        Location: trueObject.Location,
        Latitude: trueObject.Latitude,
        Longitude: trueObject.Longitude,
        ImageLink: trueObject.ImageLink,
        accessLevel: trueObject.accessLevel ? trueObject.accessLevel : roles.ROLE_MEMBER,
        LastLoginOn: sequelize.NOW
      };

      userModel.findOrCreate({ where: { PhoneNo: trueObject.PhoneNo }, defaults: userItem })
        .then((userData) => {
          if (!userData[1]) {
            userData[1].updateAttributes({
              EmailAddress: trueObject.EmailAddress,
              Name: trueObject.Name,
              ImageLink: trueObject.ImageLink,
              LastLoginOn: sequelize.NOW
            });
          }
          reply({ statusCode: 201 }).header('authorization', `bearer ${authentication.generateToken(userData[0])}`);
        });
    }
  }

  static register(request, reply) {
    const userItem = {
      EmailAddress: request.payload.emailAddress,
      Name: request.payload.fullName,
      Password: bCrypt.hashSync(request.payload.password, bCrypt.genSaltSync(8), null),
      Location: request.payload.location,
      Latitude: request.payload.latitude,
      Longitude: request.payload.longitude,
      ImageLink: request.payload.ImageLink,
      PhoneNo: request.payload.PhoneNo,
      accessLevel: request.payload.accessLevel ? request.payload.accessLevel : roles.ROLE_MEMBER
    };
    userModel.create(userItem).then((newUser) => {
      reply({ statusCode: 201 }).header('authorization', `bearer ${authentication.generateToken(newUser)}`);
    });
  }

  static login(request, reply) {
    const error = new Error();
    userModel.findOne({ where: { emailAddress: request.payload.UserName } }).then((userItem) => {
      if (!userItem) {
        error.statusCode = 404;
        error.message = 'Email does not exist';
        return reply(error);
      }

      if (!isValidPassword(userItem.password, request.payload.Password)) {
        error.statusCode = 401;
        error.message = 'Incorrect password.';
        return reply(error);
      }
      let tokenDetail = userItem;
      if (!authentication.validateToken(userItem.expiresIn)) {
        tokenDetail = authentication.generateToken(userItem);
      }

      return reply({ statusCode: 201 }).header('authorization', `bearer ${tokenDetail.token}`).header('expiresIn', tokenDetail.expiresIn);
    }).catch((err) => {
      error.status = 401;
      error.message = 'Something went wrong, please try again.';
      error.raw = err;
      return reply(error);
    });
  }
}

module.exports = UserController;
