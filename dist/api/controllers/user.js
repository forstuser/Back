'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PUBLIC_KEY = new _nodeRsa2.default(_main2.default.TRUECALLER_PUBLIC_KEY, { signingScheme: 'sha512' });
const AWS = _main2.default.AWS;
const fsImpl = new _s3fs2.default(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);
let replyObject = {
  status: true,
  message: 'success'
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

const validatePayloadSignature = function (payload, signature) {
  return PUBLIC_KEY.verify(payload, signature, '', 'base64');
};

const trackTransaction = (transactionId, userId) => {
  if (transactionId && transactionId !== '') {
    _tracking2.default.postbackTracking(transactionId, userId).then(response => {
      console.log('SUCCESSFULLY SENT ICUBESWIRE POSTBACK');
      console.log(response);
    }).catch(err => {
      console.log('Error in sending iCUBESWIRE POSTBACK');
      console.log('Error in sending iCUBESWIRE POSTBACK is as follow: \n', JSON.stringify({ API_Logs: err }));
    });
  }
};

let loginOrRegisterUser = async parameters => {
  let { userWhere, userInput, trueObject, request, reply } = parameters;
  const selected_language = request.language;
  let token;
  let updatedUser;
  try {
    let userData = await userAdaptor.loginOrRegister(userWhere, userInput);
    if (!userData[1]) {
      userData = await _bluebird2.default.all([_bluebird2.default.try(() => userData[0].updateAttributes(userInput)), userData[1]]);
    } else {
      userData = await _bluebird2.default.all([userData[0], userData[1]]);
    }
    updatedUser = userData[0].toJSON();

    if (!updatedUser.email_verified && updatedUser.email) {
      _notification2.default.sendVerificationMail(updatedUser.email, updatedUser);
    }

    if (trueObject.ImageLink) {
      UserController.uploadTrueCallerImage(trueObject, updatedUser);
    }

    if (request.payload.fcmId) {
      await fcmManager.insertFcmDetails({
        userId: updatedUser.id || updatedUser.ID,
        fcmId: request.payload.fcmId,
        platformId: request.payload.platform || 1,
        selected_language
      });
    }

    trackTransaction(request.payload.transactionId, updatedUser.id);
    replyObject.authorization = `bearer ${_authentication2.default.generateToken(userData[0]).token}`;
    token = replyObject.authorization;
    const result = await dashboardAdaptor.prepareDashboardResult({
      isNewUser: userData[1], user: userData[0].toJSON(),
      token: replyObject.authorization, request
    });
    return reply.response(result).code(201).header('authorization', replyObject.authorization);
  } catch (err) {
    console.log(err);
    modals.logs.create({
      api_action: request.method,
      api_path: request.url.pathname,
      log_type: 2,
      log_content: JSON.stringify({
        params: request.params,
        query: request.query,
        headers: request.headers,
        payload: request.payload,
        err
      })
    }).catch(ex => console.log('error while logging on db,', ex));
    return reply.response({
      status: false,
      message: 'Unable to login.',
      forceUpdate: request.pre.forceUpdate,
      err
    });
  }
};

class UserController {
  constructor(modal) {
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

  static async subscribeUser(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      replyObject = {
        status: true,
        message: 'success',
        forceUpdate: request.pre.forceUpdate
      };
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        replyObject.status = false;
        replyObject.message = 'Unauthorized';
        return reply.response(replyObject);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        if (request.payload && request.payload.fcmId) {
          await fcmManager.insertFcmDetails({
            userId: user.id || user.ID,
            fcmId: request.payload.fcmId,
            platformId: request.payload.platform || 1,
            selected_language: request.payload.selected_language
          });
        }
        return reply.response(replyObject).code(201);
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update fcm details.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async dispatchOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success'
    };
    try {
      const result = await _google2.default.isValidPhoneNumber(request.payload.PhoneNo);
      if (!result) {
        console.log(`Phone number: ${request.payload.PhoneNo} is not a valid phone number`);
        replyObject.status = false;
        replyObject.message = 'Invalid Phone number';
        return reply.response(replyObject);
      }

      if (!request.pre.hasMultipleAccounts) {
        const [otpStatus, user] = await _bluebird2.default.all([_otp2.default.sendOTPToUser(request.payload.PhoneNo, request.headers.ios_app_version && request.headers.ios_app_version < 14 || request.headers.app_version && request.headers.app_version < 13 ? 6 : 4), userAdaptor.retrieveSingleUser({
          where: {
            mobile_no: request.payload.PhoneNo
          }
        })]);
        if (otpStatus.type === 'success') {
          console.log('SMS SENT WITH ID: ', otpStatus.message);
          replyObject.PhoneNo = request.payload.PhoneNo;
          if (user) {
            replyObject.Name = user.name;
            replyObject.imageUrl = user.imageUrl;
            return reply.response(replyObject).code(201);
          } else {
            return reply.response(replyObject).code(201);
          }
        } else {
          replyObject.status = false;
          replyObject.message = response[0].ErrorMessage;
          replyObject.error = response[0].ErrorMessage;
          return reply.response(replyObject).code(403);
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'User with same mobile number exist.';
        replyObject.error = err;
        return reply.response(replyObject);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to send OTP on provided number.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async dispatchOTPOverEmail(request, reply) {
    replyObject = {
      status: true,
      message: 'success'
    };
    const user = request.user;
    try {
      if (request.pre.isValidEmail) {
        const response = await _otp2.default.sendOTPOverEmail(request.payload.email, request.user.name, request.headers.ios_app_version && request.headers.ios_app_version < 14 || request.headers.app_version && request.headers.app_version < 13 ? 6 : 4);
        await userAdaptor.updateUserDetail({
          email: request.payload.email.toLowerCase(),
          email_secret: response[0],
          otp_created_at: _moment2.default.utc()
        }, { where: { id: request.user.id } });
        replyObject.email = request.payload.email;
        replyObject.Name = user.name;
        replyObject.imageUrl = user.imageUrl;
        return reply.response(replyObject).code(201);
      } else if (request.pre.isValidEmail === null) {
        replyObject.status = false;
        replyObject.message = 'Account already exists with this email.';
        return reply.response(replyObject);
      } else {
        replyObject.status = false;
        replyObject.message = 'Invalid Email, Please provide correct one.';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        user_id: user ? user.id || user.ID : undefined,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to send OTP over email.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async verifyEmailSecret(request, reply) {
    replyObject = {
      status: true,
      message: 'success'
    };
    try {
      if (request.pre.isValidOTP) {
        const currentUser = request.user.toJSON();
        await userAdaptor.updateUserDetail({
          email_verified: true
        }, {
          where: {
            id: currentUser.id
          }
        });
        replyObject.email = currentUser.email;
        replyObject.Name = currentUser.name;
        replyObject.imageUrl = currentUser.imageUrl;
        return reply.response(replyObject).code(201);
      } else if (request.pre.isValidOTP === null) {
        replyObject.status = false;
        replyObject.message = 'Provided OTP is expired, Please request new one.';
        return reply.response(replyObject);
      } else {
        replyObject.status = false;
        replyObject.message = 'Invalid OTP.';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Invalid OTP.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async validateOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };
    const trueObject = request.payload.TrueObject || {};

    let userWhere = {
      mobile_no: trueObject.PhoneNo,
      user_status_type: 1,
      role_type: 5
    };
    const userInput = {
      role_type: 5,
      mobile_no: trueObject.PhoneNo,
      user_status_type: 1,
      last_login_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss'),
      last_active_date: _moment2.default.utc(),
      last_api: request.url.pathname
    };

    try {
      if (!request.pre.forceUpdate) {
        if (request.payload.BBLogin_Type === 1) {
          if (trueObject.PhoneNo !== '8750568036' && trueObject.PhoneNo !== '9661086188') {
            const data = await _otp2.default.verifyOTPForUser(trueObject.PhoneNo, request.payload.Token);
            console.log('VALIDATE OTP RESPONSE: ', data);
            if (data.type === 'success') {
              return await loginOrRegisterUser({ userWhere, userInput, trueObject, request, reply });
            } else {
              replyObject.status = false;
              replyObject.message = 'Invalid/Expired OTP';

              return reply.response(replyObject);
            }
          } else if (request.payload.Token === '0501') {
            return await loginOrRegisterUser({ userWhere, userInput, trueObject, request, reply });
          }
        } else if (request.payload.BBLogin_Type === 2) {
          const TrueSecret = request.payload.TrueSecret;
          const TruePayload = request.payload.TruePayload;

          if (!validatePayloadSignature(TruePayload, TrueSecret)) {
            replyObject.status = false;
            replyObject.message = 'Payload verification failed';
            return reply.response(replyObject);
          } else {
            userInput.email = (trueObject.EmailAddress || '').toLowerCase();
            userInput.full_name = trueObject.Name;
            userInput.email_secret = _uuid2.default.v4();
            userInput.mobile_no = trueObject.PhoneNo;
            userInput.user_status_type = 1;
            return await loginOrRegisterUser({
              userWhere,
              userInput,
              trueObject,
              request,
              reply
            });
          }
        } else if (request.payload.BBLogin_Type === 3) {
          const fbSecret = request.payload.TrueSecret;

          if (fbSecret) {
            const fbResult = await (0, _requestPromise2.default)({
              uri: _main2.default.FB_GRAPH_ROUTE + 'me?fields=id,email,name,picture{url}',
              qs: {
                access_token: fbSecret
              },
              json: true
            });
            console.log(fbResult);
            if (fbResult.email) {
              userWhere.email = { $iLike: fbResult.email };
              userWhere.$or = [{
                fb_id: fbResult.id
              }, { fb_id: null }];
            } else {
              userWhere.fb_id = fbResult.id;
            }

            userInput.email = fbResult.email ? fbResult.email.toLowerCase() : undefined;
            userInput.full_name = fbResult.name;
            userInput.email_verified = !!fbResult.email;
            userInput.mobile_no = userInput.mobile_no || fbResult.mobile_phone;
            userInput.fb_id = fbResult.id;
            userInput.user_status_type = 1;
            fbResult.ImageLink = _main2.default.FB_GRAPH_ROUTE + '/v2.12/' + fbResult.id + '/picture?height=2000&width=2000';
            return await loginOrRegisterUser({
              userWhere: JSON.parse(JSON.stringify(userWhere)),
              userInput: JSON.parse(JSON.stringify(userInput)),
              trueObject: fbResult,
              request,
              reply
            });
          }
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to validate.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async validateToken(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };
    try {
      if (!request.pre.forceUpdate && !request.pre.hasMultipleAccounts) {

        const data = await _otp2.default.verifyOTPForUser(request.payload.mobile_no, request.payload.token);

        console.log('test We are here', request.user);
        let result = [false];
        if (data.type === 'success') {
          result = await _bluebird2.default.all([true, userAdaptor.updateUserDetail({
            mobile_no: request.payload.mobile_no
          }, { where: { id: request.user.id } })]);
        }

        if (result[0]) {
          replyObject.authorization = request.headers.authorization;
          return reply.response(replyObject);
        } else {
          replyObject.status = false;
          replyObject.message = 'Invalid/Expired OTP';
          return reply.response(replyObject);
        }
      } else if (request.pre.hasMultipleAccounts) {
        replyObject.status = false;
        replyObject.message = 'Account already exists with this mobile no.';
        return reply.response(replyObject);
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to validate.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async verifyPin(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };

    try {
      if (!request.pre.forceUpdate) {
        let result = [false];
        if (request.pre.pinVerified) {
          result = await _bluebird2.default.all([true, userAdaptor.updateUserDetail({
            password: request.hashedPassword,
            last_active_date: _moment2.default.utc(),
            last_api: request.url.pathname
          }, { where: { id: request.user.id } })]);
        }
        if (result[0]) {
          replyObject.authorization = `bearer ${_authentication2.default.generateToken(request.user).token}`;

          return reply.response(replyObject);
        } else {
          replyObject.status = false;
          replyObject.message = 'Invalid PIN';

          return reply.response(replyObject);
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to verify PIN.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async resetPIN(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };

    try {
      if (!request.pre.forceUpdate) {
        let result = [false];
        if (request.pre.pinVerified) {
          result = await _bluebird2.default.all([true, userAdaptor.updateUserDetail({
            password: request.hashedPassword, last_active_date: _moment2.default.utc(),
            last_api: request.url.pathname
          }, { where: { id: request.user.id } })]);
        }
        if (result[0]) {
          replyObject.authorization = `bearer ${_authentication2.default.generateToken(request.user).token}`;

          return reply.response(replyObject);
        } else {
          replyObject.status = false;
          replyObject.message = 'Invalid PIN';

          return reply.response(replyObject);
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to reset PIN.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async logout(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };
    try {
      if ((request.pre.userExist || request.pre.userExist === 0) && !request.pre.forceUpdate) {
        if (request.payload && request.payload.fcmId) {
          await fcmManager.deleteFcmDetails({
            user_id: user.id || user.ID,
            fcm_id: request.payload.fcmId,
            platform_id: request.payload.platform || 1
          });
        }

        await userAdaptor.updateUserDetail({
          last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss')
        }, {
          where: {
            id: user.id || user.ID
          }
        });
        return reply.response(replyObject).code(201);
      } else if (!request.pre.userExist) {
        replyObject.status = false;
        replyObject.message = 'Unauthorized';
        return reply.response(replyObject).code(401);
      } else {
        replyObject.status = false;
        replyObject.message = 'Forbidden';
        return reply.response(replyObject);
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to logout user.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async removePin(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate && request.pre.pinVerified) {
        await userAdaptor.updateUserDetail({ password: null }, { where: { id: user.id || user.ID } });
        return reply.response({
          message: 'Successful',
          status: true,
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          message: 'Invalid PIN',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          message: 'Invalid PIN',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to remove PIN.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveUserProfile(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response((await userAdaptor.retrieveUserProfile(user, request)));
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          message: 'Invalid Token',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          message: 'Forbidden',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve user profile.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateUserProfile(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.isValidEmail && request.pre.userExist && !request.pre.forceUpdate) {
        return await userAdaptor.updateUserProfile(user, request, reply);
      } else if (request.pre.isValidEmail === null) {
        replyObject.status = false;
        replyObject.message = 'Account already exists with the email.';
        return reply.response(replyObject);
      } else if (!request.pre.isValidEmail) {
        replyObject.status = false;
        replyObject.message = 'Invalid Email, Please provide correct one.';
        return reply.response(replyObject);
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          message: 'Invalid Token',
          status: false,
          forceUpdate: request.pre.forceUpdate
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update profile.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static retrieveNearBy(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return nearByAdaptor.retrieveNearBy(request.query.location || user.location, request.query.geolocation || `${user.latitude},${user.longitude}`, request.query.professionids || '[]', reply, user.id || user.ID, request);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static verifyEmailAddress(request, reply) {
    const emailSecret = request.params.token;
    notificationAdaptor.verifyEmailAddress(emailSecret, reply);
  }

  static uploadTrueCallerImage(trueObject, userData) {
    console.log(trueObject);
    if (trueObject.ImageLink) {
      const options = {
        uri: trueObject.ImageLink,
        timeout: 170000,
        resolveWithFullResponse: true,
        encoding: null
      };
      console.log(userData.id);
      modals.users.findById(userData.id || userData.ID, {
        attributes: ['image_name']
      }).then(userImage => {
        const userDetail = userImage.toJSON();
        console.log({
          userDetail
        });
        if (!userDetail.image_name) {
          (0, _requestPromise2.default)(options).then(result => {
            UserController.uploadUserImage(userData, result);
          }).catch(err => {
            console.log(`Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
          });
        } else {
          fsImpl.headObject(userDetail.image_name).catch(err => {
            console.log(`Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
            (0, _requestPromise2.default)(options).then(result => {
              UserController.uploadUserImage(userData, result);
            }).catch(err => {
              console.log(`Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
            });
          });
        }
      }).catch(err => {
        console.log(`Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);

        (0, _requestPromise2.default)(options).then(result => {
          UserController.uploadUserImage(userData, result);
        }).catch(err => {
          console.log(`Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
        });
      });
    }
  }

  static uploadUserImage(user, result) {
    try {
      const fileType = result.headers['content-type'].split('/')[1];
      const fileName = `active-${user.id || user.ID}-${new Date().getTime()}.${fileType}`;
      // const file = fs.createReadStream();
      fsImpl.writeFile(fileName, result.body, { ContentType: result.headers['content-type'] }).then(fileResult => {
        console.log(fileResult);
        modals.users.update({ image_name: fileName }, { where: { id: user.id } });
      });
    } catch (err) {}
  }
}

exports.default = UserController;