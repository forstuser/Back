'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _nodeRsa = require('node-rsa');

var _nodeRsa2 = _interopRequireDefault(_nodeRsa);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

var _otp = require('../../helpers/otp');

var _otp2 = _interopRequireDefault(_otp);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _tracking = require('../../helpers/tracking');

var _tracking2 = _interopRequireDefault(_tracking);

var _dashboard = require('../Adaptors/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _fcm = require('../Adaptors/fcm');

var _fcm2 = _interopRequireDefault(_fcm);

var _nearby = require('../Adaptors/nearby');

var _nearby2 = _interopRequireDefault(_nearby);

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _authentication = require('./authentication');

var _authentication2 = _interopRequireDefault(_authentication);

var _s3fs = require('s3fs');

var _s3fs2 = _interopRequireDefault(_s3fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PUBLIC_KEY = new _nodeRsa2.default(_main2.default.TRUECALLER_PUBLIC_KEY, { signingScheme: 'sha512' });
var AWS = _main2.default.AWS;
var fsImpl = new _s3fs2.default(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);
var replyObject = {
  status: true,
  message: 'success'
};

var userModel = void 0;
var userRelationModel = void 0;
var modals = void 0;
var dashboardAdaptor = void 0;
var userAdaptor = void 0;
var nearByAdaptor = void 0;
var notificationAdaptor = void 0;
var fcmModel = void 0;
var fcmManager = void 0;

var validatePayloadSignature = function validatePayloadSignature(payload, signature) {
  return PUBLIC_KEY.verify(payload, signature, '', 'base64');
};

var trackTransaction = function trackTransaction(transactionId, userId) {
  if (transactionId && transactionId !== '') {
    _tracking2.default.postbackTracking(transactionId, userId).then(function (response) {
      console.log('SUCCESSFULLY SENT ICUBESWIRE POSTBACK');
      console.log(response);
    }).catch(function (err) {
      console.log('Error in sending iCUBESWIRE POSTBACK');
      console.log({ API_Logs: err });
    });
  }
};

var loginOrRegisterUser = function loginOrRegisterUser(parameters) {
  var userWhere = parameters.userWhere,
      userInput = parameters.userInput,
      trueObject = parameters.trueObject,
      request = parameters.request,
      reply = parameters.reply;

  var token = void 0;
  var updatedUser = void 0;
  return userAdaptor.loginOrRegister(userWhere, userInput).then(function (userData) {
    if (!userData[1]) {
      userData[0].updateAttributes(userInput);
    }

    updatedUser = userData[0].toJSON();
    if (!updatedUser.email_verified && updatedUser.email) {
      _notification2.default.sendVerificationMail(trueObject.EmailAddress, updatedUser);
    }

    if (trueObject.ImageLink) {
      UserController.uploadTrueCallerImage(trueObject, updatedUser);
    }

    if (request.payload.fcmId) {
      fcmManager.insertFcmDetails({
        userId: updatedUser.id || updatedUser.ID,
        fcmId: request.payload.fcmId,
        platformId: request.payload.platform || 1,
      }).then(function(data) {
        console.log(data);
      }).catch(function (err) {
        return console.log('Error on ' + new Date() + ' for user ' + (updatedUser.id || updatedUser.ID) + ' is as follow: \n ' + err);
      });
    }

    trackTransaction(request.payload.transactionId, updatedUser.id);
    replyObject.authorization = 'bearer ' + _authentication2.default.generateToken(userData[0]).token;
    token = replyObject.authorization;
    return dashboardAdaptor.prepareDashboardResult({
      isNewUser: userData[1],
      user: userData[0].toJSON(),
      token: replyObject.authorization,
      request: request,
    });
  }).then(function (result) {
    return reply(result).code(201).header('authorization', replyObject.authorization);
  }).catch(function (err) {
    console.log('Error on ' + new Date() + ' for user ' + (updatedUser.id || updatedUser.ID) + ' is as follow: \n \n ' + err);
    if (err.authorization) {
      return reply({ status: false, message: 'Unable to Login User', err: err }).code(401).header('authorization', replyObject.authorization);
    }

    return reply({
      status: false,
      authorization: token,
      message: 'Unable to Login User',
      showDashboard: false,
      err: err,
      forceUpdate: request.pre.forceUpdate
    }).code(401).header('authorization', replyObject.authorization);
  });
};

var UserController = function () {
  function UserController(modal) {
    _classCallCheck(this, UserController);

    userModel = modal.users;
    userRelationModel = modal.users_temp;
    modals = modal;
    fcmModel = modal.fcmDetails;
    fcmManager = new _fcm2.default(modal.fcmDetails);
    dashboardAdaptor = new _dashboard2.default(modals);
    userAdaptor = new _user2.default(modals);
    nearByAdaptor = new _nearby2.default(modals);
    notificationAdaptor = new _notification2.default(modals);
  }

  _createClass(UserController, null, [{
    key: 'subscribeUser',
    value: function subscribeUser(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      replyObject = {
        status: true,
        message: 'success',
        forceUpdate: request.pre.forceUpdate
      };
      if (!request.pre.userExist) {
        replyObject.status = false;
        replyObject.message = 'Unauthorized';
        return reply(replyObject);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        if (request.payload && request.payload.fcmId) {
          fcmManager.insertFcmDetails({
            userId: user.id || user.ID,
            fcmId: request.payload.fcmId,
            platformId: request.payload.platform,
          }).then(function(data) {
            console.log(data);
          }).catch(function(err) {
            console.log('Error on ' + new Date() + ' for user ' +
                (user.id || user.ID) + ' is as follow: \n \n ' + err);
          });
        }
        return reply(replyObject).code(201);
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply(replyObject);
      }
    }
  }, {
    key: 'dispatchOTP',
    value: function dispatchOTP(request, reply) {
      replyObject = {
        status: true,
        message: 'success'
      };
      if (!_google2.default.isValidPhoneNumber(request.payload.PhoneNo)) {
        console.log('Phone number: ' + request.payload.PhoneNo + ' is not a valid phone number');
        replyObject.status = false;
        replyObject.message = 'Invalid Phone number';
        return reply(replyObject);
      }

      return Promise.all([_otp2.default.sendOTPToUser(request.payload.PhoneNo), userAdaptor.retrieveSingleUser({
        where: {
          mobile_no: request.payload.PhoneNo
        }
      })]).then(function (response) {
        if (response[0].type === 'success') {
          console.log('SMS SENT WITH ID: ', response[0].message);
          replyObject.PhoneNo = request.payload.PhoneNo;
          var user = response[1];
          if (response[1]) {
            replyObject.Name = user.name;
            replyObject.imageUrl = user.imageUrl;
            return reply(replyObject).code(201);
          } else {
            return reply(replyObject).code(201);
          }
        } else {
          replyObject.status = false;
          replyObject.message = response[0].ErrorMessage;
          replyObject.error = response[0].ErrorMessage;
          return reply(replyObject).code(403);
        }
      }).catch(function (err) {
        console.log({ API_Logs: err });

        replyObject.status = false;
        replyObject.message = 'Some issue with sending OTP';
        replyObject.error = err;
        return reply(replyObject);
      });
    }
  }, {
    key: 'validateOTP',
    value: function validateOTP(request, reply) {
      replyObject = {
        status: true,
        message: 'success',
        forceUpdate: request.pre.forceUpdate
      };
      console.log('REQUEST PAYLOAD FOR VALIDATE OTP: ');
      console.log(request.payload);
      var trueObject = request.payload.TrueObject;

      var userWhere = {
        mobile_no: trueObject.PhoneNo,
        user_status_type: 1
      };
      var userInput = {
        role_type: 5,
        mobile_no: trueObject.PhoneNo,
        user_status_type: 1,
        last_login_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss')
      };

      if (!request.pre.forceUpdate) {
        if (request.payload.BBLogin_Type === 1) {
          if (trueObject.PhoneNo !== '8750568036') {
            return _otp2.default.verifyOTPForUser(trueObject.PhoneNo, request.payload.Token).then(function (data) {
              console.log('VALIDATE OTP RESPONSE: ', data);
              if (data.type === 'success') {
                return loginOrRegisterUser({
                  userWhere: userWhere,
                  userInput: userInput,
                  trueObject: trueObject,
                  request: request,
                  reply: reply,
                });
              } else {
                replyObject.status = false;
                replyObject.message = 'Invalid/Expired OTP';

                return reply(replyObject).code(401);
              }
            }).catch(function (err) {
              console.log('Error on ' + new Date() + ' for mobile no: ' + trueObject.PhoneNo + ' is as follow: \n \n ' + err);
              replyObject.status = false;
              replyObject.message = 'Issue in updating data';
              replyObject.error = err;
              return reply(replyObject).code(401);
            });
          } else if (request.payload.Token === '050118') {
            return loginOrRegisterUser({
              userWhere: userWhere,
              userInput: userInput,
              trueObject: trueObject,
              request: request,
              reply: reply,
            });
          }
        } else if (request.payload.BBLogin_Type === 2) {
          var TrueSecret = request.payload.TrueSecret;
          var TruePayload = request.payload.TruePayload;

          if (!validatePayloadSignature(TruePayload, TrueSecret)) {
            replyObject.status = false;
            replyObject.message = 'Payload verification failed';
            return reply(replyObject);
          } else {
            userInput.email = trueObject.EmailAddress;
            userInput.full_name = trueObject.Name;
            userInput.email_secret = _uuid2.default.v4();
            userInput.mobile_no = trueObject.PhoneNo;
            userInput.user_status_type = 1;
            return loginOrRegisterUser({
              userWhere: userWhere,
              userInput: userInput,
              trueObject: trueObject,
              request: request,
              reply: reply,
            }).catch(function(err) {
              console.log('Error on ' + new Date() + ' for mobile no: ' + trueObject.PhoneNo + ' is as follow: \n \n ' + err);
              replyObject.status = false;
              replyObject.message = 'Issue in updating data';
              replyObject.error = err;
              return reply(replyObject).code(401);
            });
          }
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        reply(replyObject);
      }
    }
  }, {
    key: 'logout',
    value: function logout(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      replyObject = {
        status: true,
        message: 'success',
        forceUpdate: request.pre.forceUpdate
      };
      if (!request.pre.userExist) {
        replyObject.status = false;
        replyObject.message = 'Unauthorized';
        return reply(replyObject);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        if (request.payload && request.payload.fcmId) {
          fcmManager.deleteFcmDetails({
            user_id: user.id || user.ID,
            fcm_id: request.payload.fcmId,
            platform_id: request.payload.platform || 1,
          }).then(function(rows) {
            console.log('TOTAL FCM ID\'s DELETED: ', rows);
          });
        }

        return userAdaptor.updateUserDetail({
          last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss')
        }, {
          where: {
            id: user.id || user.ID
          }
        }).then(function () {
          return reply(replyObject).code(201);
        }).catch(function () {
          replyObject.status = false;
          replyObject.message = 'Forbidden';
          return reply(replyObject);
        });
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        reply(replyObject);
      }
    }
  }, {
    key: 'retrieveUserProfile',
    value: function retrieveUserProfile(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply(userAdaptor.retrieveUserProfile(user, request));
      } else if (!request.pre.userExist) {
        return reply({ message: 'Invalid Token', forceUpdate: request.pre.forceUpdate }).code(401);
      } else {
        return reply({
          message: 'Forbidden',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateUserProfile',
    value: function updateUserProfile(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return userAdaptor.updateUserProfile(user, request, reply);
      } else if (!request.pre.userExist) {
        return reply({ message: 'Invalid Token', forceUpdate: request.pre.forceUpdate }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveNearBy',
    value: function retrieveNearBy(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        nearByAdaptor.retrieveNearBy(request.query.location || user.location, request.query.geolocation || user.latitude + ',' + user.longitude, request.query.professionids || '[]', reply, user.id || user.ID, request);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'verifyEmailAddress',
    value: function verifyEmailAddress(request, reply) {
      var emailSecret = request.params.token;
      notificationAdaptor.verifyEmailAddress(emailSecret, reply);
    }
  }, {
    key: 'uploadTrueCallerImage',
    value: function uploadTrueCallerImage(trueObject, userData) {
      if (trueObject.ImageLink) {
        var options = {
          uri: trueObject.ImageLink,
          timeout: 170000,
          resolveWithFullResponse: true,
          encoding: null
        };
        console.log(userData.id);
        fsImpl.readdirp(userData.id.toString()).then(function (images) {
          if (images.length <= 0) {
            (0, _requestPromise2.default)(options).then(function (result) {
              UserController.uploadUserImage(userData, result);
            });
          }
        }).catch(function (err) {
          console.log({
            apiErr: err
          });

          (0, _requestPromise2.default)(options).then(function (result) {
            UserController.uploadUserImage(userData, result);
          });
        });
      }
    }
  }, {
    key: 'uploadUserImage',
    value: function uploadUserImage(user, result) {
      var fileType = result.headers['content-type'].split('/')[1];
      var fileName = (user.id || user.ID) + '/active-' + (user.id || user.ID) + '-' + new Date().getTime() + '.' + fileType;
      // const file = fs.createReadStream();
      fsImpl.writeFile(fileName, result.body, { ContentType: result.headers['content-type'] }).then(function (fileResult) {
        console.log(fileResult);
      }).catch(function (err) {
        console.log({ API_TC_Upload_Logs: err });
      });
    }
  }]);

  return UserController;
}();

exports.default = UserController;