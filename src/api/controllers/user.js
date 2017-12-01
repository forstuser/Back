'use strict';
import moment from 'moment';
import RSA from 'node-rsa';
import requestPromise from 'request-promise';
import uuid from 'uuid';
import config from '../../config/main';
import GoogleHelper from '../../helpers/google';
import OTPHelper from '../../helpers/otp';
import shared from '../../helpers/shared';
import trackingHelper from '../../helpers/tracking';
import DashboardAdaptor from '../Adaptors/dashboard';
import FCMManager from '../Adaptors/fcm';
import NearByAdaptor from '../Adaptors/nearby';
import NotificationAdaptor from '../Adaptors/notification';
import UserAdaptor from '../Adaptors/user';
import authentication from './authentication';

const PUBLIC_KEY = new RSA(config.TRUECALLER_PUBLIC_KEY,
    {signingScheme: 'sha512'});
const AWS = config.AWS;
let replyObject = {
  status: true,
  message: 'success',
};

let userModel;
let userRelationModel;
let modals;
let dashboardAdaptor;
let userAdaptor;
let nearByAdaptor;
let notificationAdaptor;
let fcmModel;
let fcmManager;

const validatePayloadSignature = function(payload, signature) {
  return PUBLIC_KEY.verify(payload, signature, '', 'base64');
};

const trackTransaction = (transactionId, userId) => {
  if (transactionId &&
      transactionId !== '') {
    trackingHelper.postbackTracking(transactionId,
        userId).then((response) => {
      console.log('SUCCESSFULLY SENT ICUBESWIRE POSTBACK');
      console.log(response);
    }).catch((err) => {
      console.log('Error in sending iCUBESWIRE POSTBACK');
      console.log({API_Logs: err});
    });
  }
};

let loginOrRegisterUser = function(
    userWhere, userInput, trueObject, request, reply) {
  let token;
  return userAdaptor.loginOrRegister(userWhere,
      userInput).then((userData) => {
    if (!userData[1]) {
      userData[0].updateAttributes(userInput);
    }

    const updatedUser = userData[0].toJSON();
    if ((!updatedUser.email_verified) && (updatedUser.email)) {
      NotificationAdaptor.sendVerificationMail(trueObject.EmailAddress,
          updatedUser);
    }

    if (trueObject.ImageLink) {
      UserController.uploadTrueCallerImage(trueObject, updatedUser);
    }

    if (request.payload.fcmId) {
      fcmManager.insertFcmDetails(updatedUser.id, request.payload.fcmId).
          then((data) => {
            console.log(data);
          }).
          catch((err) => console.log({API_Logs: err}));
    }

    trackTransaction(request.payload.transactionId, updatedUser.id);
    replyObject.authorization = `bearer ${authentication.generateToken(
        userData[0]).token}`;
    token = replyObject.authorization;
    return dashboardAdaptor.prepareDashboardResult(userData[1],
        userData[0].toJSON(), replyObject.authorization, request);
  }).then((result) => {
    return reply(result).
        code(201).
        header('authorization', replyObject.authorization);
  }).catch((err) => {
    if (err.authorization) {
      return reply(err).
          code(401).
          header('authorization', replyObject.authorization);
    }

    return reply({
      status: false,
      authorization: token,
      message: 'Unable to Login User',
      showDashboard: false,
      err,
      forceUpdate: request.pre.forceUpdate,
    }).
        code(401).
        header('authorization', replyObject.authorization);
  });
};

class UserController {
  constructor(modal) {
    userModel = modal.users;
    userRelationModel = modal.users_temp;
    modals = modal;
    fcmModel = modal.fcmDetails;
    fcmManager = new FCMManager(modal.fcmDetails);
    dashboardAdaptor = new DashboardAdaptor(modals);
    userAdaptor = new UserAdaptor(modals);
    nearByAdaptor = new NearByAdaptor(modals);
    notificationAdaptor = new NotificationAdaptor(modals);
  }

  static subscribeUser(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    if (!user) {
      replyObject.status = false;
      replyObject.message = 'Unauthorized';
      reply(replyObject);
    } else if (user && !request.pre.forceUpdate) {
      if (request.payload && request.payload.fcmId) {
        fcmManager.insertFcmDetails(user.id, request.payload.fcmId).
            then((data) => {
              console.log(data);
            }).
            catch((err) => {
              console.log({API_Logs: err});
            });
      }

      reply(replyObject).code(201);
    } else {
      replyObject.status = false;
      replyObject.message = 'Forbidden';
      reply(replyObject);
    }
  }

  static dispatchOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
    };
    if (!GoogleHelper.isValidPhoneNumber(request.payload.PhoneNo)) {
      console.log(
          `Phone number: ${request.payload.PhoneNo} is not a valid phone number`);
      replyObject.status = false;
      replyObject.message = 'Invalid Phone number';
      return reply(replyObject);
    }

    return Promise.all([
      OTPHelper.sendOTPToUser(request.payload.PhoneNo),
      userAdaptor.retrieveSingleUser({
        where: {
          mobile_no: request.payload.PhoneNo,
        },
      })]).then((response) => {
      if (response[0].type === 'success') {
        console.log('SMS SENT WITH ID: ', response[0].message);
        replyObject.PhoneNo = request.payload.PhoneNo;
        const user = response[1];
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
    }).catch((err) => {
      console.log({API_Logs: err});

      replyObject.status = false;
      replyObject.message = 'Some issue with sending OTP';
      replyObject.error = err;
      return reply(replyObject);
    });
  }

  static validateOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    console.log('REQUEST PAYLOAD FOR VALIDATE OTP: ');
    console.log(request.payload);
    const trueObject = request.payload.TrueObject;

    const userWhere = {
      mobile_no: trueObject.PhoneNo,
      user_status_type: 1,
    };
    const userInput = {
      role_type: 5,
      mobile_no: trueObject.PhoneNo,
      user_status_type: 1,
      last_login_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
    };

    if (!request.pre.forceUpdate) {
      if (request.payload.BBLogin_Type === 1) {
        return OTPHelper.verifyOTPForUser(trueObject.PhoneNo,
            request.payload.Token).then((data) => {
          console.log('VALIDATE OTP RESPONSE: ', data);
          if (data.type === 'success') {
            return loginOrRegisterUser(userWhere, userInput, trueObject,
                request, reply);
          } else {
            replyObject.status = false;
            replyObject.message = 'Invalid/Expired OTP';

            return reply(replyObject).code(401);
          }
        }).catch((err) => {
          console.log({API_Logs: err});
          replyObject.status = false;
          replyObject.message = 'Issue in updating data';
          replyObject.error = err;
          return reply(replyObject).code(401);
        });
      } else if (request.payload.BBLogin_Type === 2) {
        const TrueSecret = request.payload.TrueSecret;
        const TruePayload = request.payload.TruePayload;

        if (!validatePayloadSignature(TruePayload, TrueSecret)) {
          replyObject.status = false;
          replyObject.message = 'Payload verification failed';
          return reply(replyObject);
        } else {
          userInput.email = trueObject.EmailAddress;
          userInput.full_name = trueObject.Name;
          userInput.email_secret = uuid.v4();
          userInput.mobile_no = trueObject.PhoneNo;
          userInput.user_status_type = 1;
          return loginOrRegisterUser(userWhere, userInput, trueObject, request,
              reply).catch((err) => {
            console.log({API_Logs: err});
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

  static logout(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    if (!user) {
      replyObject.status = false;
      replyObject.message = 'Unauthorized';
      return reply(replyObject);
    } else if (user && !request.pre.forceUpdate) {
      if (request.payload && request.payload.fcmId) {
        fcmManager.deleteFcmDetails(user.id, request.payload.fcmId).
            then((rows) => {
              console.log('TOTAL FCM ID\'s DELETED: ', rows);
            });
      }

      return userAdaptor.updateUserDetail({
        last_logout_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      }, {
        where: {
          id,
        },
      }).then(() => {
        return reply(replyObject).code(201);
      }).catch(() => {
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

  static retrieveUserProfile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user && !request.pre.forceUpdate) {
      return reply(userAdaptor.retrieveUserProfile(user, request));
    } else if (!user) {
      return reply(
          {message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).
          code(401);
    } else {
      return reply({
        message: 'Forbidden',
        status: false,
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateUserProfile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user && !request.pre.forceUpdate) {
      return userAdaptor.updateUserProfile(user, request, reply);
    } else if (!user) {
      return reply(
          {message: 'Invalid Token', forceUpdate: request.pre.forceUpdate}).
          code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveNearBy(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      nearByAdaptor.retrieveNearBy(request.query.location ||
          user.location, request.query.geolocation ||
          `${user.latitude},${user.longitude}`,
          request.query.professionids || '[]', reply, user.id, request);
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static verifyEmailAddress(request, reply) {
    const emailSecret = request.params.token;
    notificationAdaptor.verifyEmailAddress(emailSecret, reply);
  }

  static uploadTrueCallerImage(trueObject, userData) {
    if (trueObject.ImageLink) {
      const options = {
        uri: trueObject.ImageLink,
        timeout: 170000,
        resolveWithFullResponse: true,
        encoding: null,
      };
      fsImpl.readdirp(userData.id).then((images) => {
        if (images.length <= 0) {
          requestPromise(options).then((result) => {
            UserController.uploadUserImage(userData, result);
          });
        }
      });
    }
  }

  static uploadUserImage(user, result) {
    const fileType = result.headers['content-type'].split('/')[1];
    const fileName = `${user.id}/active-${user.id}-${new Date().getTime()}.${fileType}`;
    // const file = fs.createReadStream();
    fsImpl.writeFile(fileName, result.body,
        {ContentType: result.headers['content-type']}).then((fileResult) => {
      console.log(fileResult);
      reply({
        status: true,
        message: 'Uploaded Successfully',
        // forceUpdate: request.pre.forceUpdate
      });
    }).catch((err) => {
      console.log({API_Logs: err});
      reply({
        status: false,
        message: 'Upload Failed',
        err,
        // forceUpdate: request.pre.forceUpdate
      });
    });
  }
}

export default UserController;
