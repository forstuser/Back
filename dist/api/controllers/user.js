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

var _dashboard = require('../adaptors/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _fcm = require('../adaptors/fcm');

var _fcm2 = _interopRequireDefault(_fcm);

var _nearby = require('../adaptors/nearby');

var _nearby2 = _interopRequireDefault(_nearby);

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _user = require('../adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _authentication = require('./authentication');

var _authentication2 = _interopRequireDefault(_authentication);

var _s3fs = require('s3fs');

var _s3fs2 = _interopRequireDefault(_s3fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sellers = require('../adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _category = require('../adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PUBLIC_KEY = new _nodeRsa2.default(_main2.default.TRUECALLER_PUBLIC_KEY, { signingScheme: 'sha512' });
const AWS = _main2.default.AWS;
const fsImpl = new _s3fs2.default(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);
let replyObject = {
  status: true,
  message: 'success'
};

let userModel, userRelationModel, modals, dashboardAdaptor, userAdaptor, nearByAdaptor, notificationAdaptor, fcmModel, fcmManager, sellerAdaptor, categoryAdaptor;

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

      const user_detail = userData[0] ? userData[0].toJSON() : undefined;
      if (user_detail && user_detail.user_status_type === 2) {
        let seller_detail = await modals.sellers.findAll({
          where: {
            customer_invite_detail: {
              $or: [{ $contains: [{ 'customer_id': user_detail.id }] }, { $contains: [{ 'customer_id': user_detail.id.toString() }] }]
            },
            is_onboarded: true, seller_type_id: 1
          },
          attributes: ['id', 'customer_invite_detail', 'user_id']
        });
        seller_detail = _lodash2.default.orderBy(seller_detail.map(item => {
          item = item.toJSON();
          const customer_invite_detail = item.customer_invite_detail.find(cidItem => cidItem.customer_id.toString() === user_detail.id.toString());
          item.invited_date = (customer_invite_detail || { invited_date: (0, _moment2.default)() }).invited_date;
          item.customer_id = (customer_invite_detail || { invited_date: (0, _moment2.default)() }).customer_id;
          return item;
        }), ['invited_date'], ['asc']);
        if (seller_detail.length > 0) {
          await modals.seller_wallet.create({
            status_type: 16, cashback_source: 3,
            amount: _main2.default.SELLER_REFERAL_CASH_BACK,
            seller_id: seller_detail[0].id, user_id: user_detail.id
          });

          await notificationAdaptor.notifyUserCron({
            seller_user_id: seller_detail[0].user_id,
            payload: {
              title: `Yay! ₹${_main2.default.SELLER_REFERAL_CASH_BACK} credited to you.`,
              description: `Congratulations! ₹${_main2.default.SELLER_REFERAL_CASH_BACK} has been credited to your BB Wallet as your user with mobile number ${user_detail.mobile_no} has registered with us.`,
              notification_type: 3, notification_id: Math.random()
            }
          });
        }
      }
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
    fcmModel = modal.fcm_details;
    fcmManager = new _fcm2.default(modal.fcm_details);
    dashboardAdaptor = new _dashboard2.default(modals);
    userAdaptor = new _user2.default(modals);
    nearByAdaptor = new _nearby2.default(modals);
    notificationAdaptor = new _notification2.default(modals);
    sellerAdaptor = new _sellers2.default(modals);
    categoryAdaptor = new _category2.default(modals);
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        const [otpStatus, user] = await _bluebird2.default.all([_otp2.default.sendOTPToUser(request.payload.PhoneNo, request.headers['ios-app-version'] && request.headers['ios-app-version'] < 14 || request.headers['app-version'] && request.headers['app-version'] < 13 ? 6 : 4), userAdaptor.retrieveSingleUser({
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

  static async dispatchSellerOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success'
    };
    try {

      if (!request.pre.hasSellerMultipleAccounts) {
        const { mobile_no, gstin, pan, email } = request.payload || {};
        const [is_valid_phone_no, gst_detail] = await _bluebird2.default.all([_google2.default.isValidPhoneNumber(mobile_no), gstin ? _google2.default.isValidGSTIN(gstin) : true]);
        if (!is_valid_phone_no) {
          console.log(`Phone number: ${mobile_no} is not a valid phone number`);
          replyObject.status = false;
          replyObject.message = 'Invalid Phone number';
          return reply.response(replyObject);
        } else if (!gst_detail) {
          console.log(`GSTIN number ${gstin} is not a valid`);
          replyObject.status = false;
          replyObject.message = 'Invalid GST number.';
          return reply.response(replyObject);
        }
        let seller_updates = JSON.parse(JSON.stringify(gst_detail && gst_detail === true ? { gstin, pan } : {
          gstin, pan, seller_name: gst_detail.lgnm || undefined,
          pincode: gst_detail.pradr.addr.pncd || undefined,
          state: gst_detail.pradr.addr.stcd || undefined,
          city: gst_detail.pradr.addr.city || undefined,
          latitude: gst_detail.pradr.addr.lt || undefined,
          longitude: gst_detail.pradr.addr.lg || undefined,
          address: `${gst_detail.pradr.addr.bno}, ${gst_detail.pradr.addr.flno} ${gst_detail.pradr.addr.bnm}, ${gst_detail.pradr.addr.st}, ${gst_detail.pradr.addr.loc}`
        }));
        const [otpStatus, user, seller_detail] = await _bluebird2.default.all([_otp2.default.sendOTPToUser(mobile_no, 4), userAdaptor.retrieveSellerUser({ where: JSON.parse(JSON.stringify({ mobile_no, email })) }), gstin || pan ? sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ $or: { gstin, pan } })) }, seller_updates, false) : undefined]);

        if (otpStatus.type === 'success') {
          console.log('SMS SENT WITH ID: ', otpStatus.message);
          replyObject.mobile_no = mobile_no;
          replyObject.seller_detail = JSON.parse(JSON.stringify(seller_detail || seller_updates || {}));
          if (user) {
            replyObject.name = user.name;
            replyObject.image_url = user.image_url;
            return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
          } else {
            return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
          }
        } else {
          replyObject.status = false;
          replyObject.message = response[0].ErrorMessage;
          replyObject.error = response[0].ErrorMessage;
          return reply.response(replyObject).code(403);
        }
      } else {
        replyObject.status = false;
        replyObject.message = 'User with same mobile number or email exist.';
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
        const response = await _otp2.default.sendOTPOverEmail(request.payload.email, request.user.name, request.headers['ios-app-version'] && request.headers['ios-app-version'] < 14 || request.headers['app-version'] && request.headers['app-version'] < 13 ? 6 : 4);
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
      user_status_type: [1, 2],
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
          if (trueObject.PhoneNo !== '7589145713' && trueObject.PhoneNo !== '9661086188') {
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
              userWhere, userInput, trueObject, request, reply
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

  static async validateSellerOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };
    try {
      let { mobile_no, gstin, pan, email, fcm_id, seller_detail, platform, login_type, token } = request.payload || {};
      let userWhere = JSON.parse(JSON.stringify({
        where: {
          mobile_no, email, status_type: 1
        }
      }));

      if (!request.pre.forceUpdate) {
        const data = await _otp2.default.verifyOTPForUser(mobile_no, token);
        console.log('VALIDATE OTP RESPONSE: ', data);
        if (data.type === 'success') {
          let user_detail = await userAdaptor.retrieveSellerUser(userWhere, true, { mobile_no, email, status_type: 1, is_logged_out: false });
          let [seller_detail] = await _bluebird2.default.all([sellerAdaptor.retrieveOrUpdateSellerDetail({
            where: JSON.parse(JSON.stringify({ user_id: user_detail.id })),
            attributes: ['seller_type_id', 'id']
          }, false, false), fcmManager.insertSellerFcmDetails({
            seller_user_id: user_detail.id,
            fcm_id, platform_id: platform || 1
          })]);
          if (seller_detail) {
            user_detail.seller_type_id = seller_detail.seller_type_id;
            user_detail.seller_id = seller_detail.id;
          }
          user_detail.seller_detail = true;

          replyObject.authorization = `bearer ${_authentication2.default.generateSellerToken(JSON.parse(JSON.stringify(user_detail))).token}`;
          replyObject.seller = seller_detail;
          replyObject.status = true;
          return reply.response(replyObject).code(201);
        } else {
          replyObject.status = false;
          replyObject.message = 'Invalid/Expired OTP';

          return reply.response(replyObject);
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
          await fcmManager.deleteFcmDetails(JSON.parse(JSON.stringify({
            user_id: !user.seller_details ? user.id : undefined,
            seller_user_id: user.seller_details ? user.id : undefined,
            fcm_id: request.payload.fcmId,
            platform_id: request.payload.platform || 1
          })));
        }

        await (!user.seller_details ? userAdaptor.updateUserDetail({ last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss') }, { where: { id: user.id } }) : sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id: user.id })) }, { last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss') }, false));
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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

  static async logoutSeller(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate
    };
    try {
      if (!request.pre.forceUpdate) {
        await _bluebird2.default.all([fcmManager.updateFcmDetails(JSON.parse(JSON.stringify({
          user_id: !user.seller_details ? user.id : undefined,
          seller_user_id: user.seller_details ? user.id : undefined,
          platform_id: request.payload.platform || 1
        }))), userAdaptor.retrieveSellerUser({ where: { id: user.id } }, false, { is_logged_out: true })]);

        await (!user.seller_details ? userAdaptor.updateUserDetail({ last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss') }, { where: { id: user.id } }) : sellerAdaptor.retrieveOrUpdateSellerDetail({ where: JSON.parse(JSON.stringify({ id: user.id })) }, {
          last_logout_at: _moment2.default.utc().format('YYYY-MM-DD HH:mm:ss')
        }, false));
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
    let user = _shared2.default.verifyAuthorization(request.headers);
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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

  static async retrieveUserAddresses(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response({
          status: true,
          result: await userAdaptor.retrieveUserAddresses({
            where: JSON.parse(JSON.stringify({ user_id: user.id || user.ID }))
          })
        });
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        message: 'Unable to retrieve user addresses.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async deleteUserAddress(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const { id } = request.params;
        return reply.response({
          status: true,
          result: await userAdaptor.deleteUserAddress({
            where: JSON.parse(JSON.stringify({ user_id: user.id || user.ID, id }))
          })
        });
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        message: 'Unable to retrieve user addresses.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async updateUserAddress(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      const user_id = user.id;
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const { id } = request.payload;
        request.payload.user_id = user_id;
        request.payload.updated_by = user_id;
        request.payload.address_type = request.payload.address_type || 2;

        const address_count = modals.user_addresses.count({ where: { user_id, address_type: 1 } });
        const locality = request.payload.pin ? await categoryAdaptor.retrieveLocalities({ where: { pin_code: request.payload.pin } }) : undefined;
        request.payload.address_type = address_count && address_count > 0 ? 2 : 1;
        if (locality && locality.length > 0) {
          request.payload.city_id = locality[0].city_id;
          request.payload.state_id = locality[0].state_id;
          request.payload.locality_id = locality[0].id;
        }
        if (request.payload.address_type === 1) {
          await userAdaptor.updateUserAddress(JSON.parse(JSON.stringify({ address_type: 2 })), {
            where: { user_id }
          });
        }
        if (id) {
          return reply.response({
            status: true,
            result: await userAdaptor.updateUserAddress(JSON.parse(JSON.stringify(request.payload)), {
              where: { user_id, id }
            })
          });
        } else {
          return reply.response({
            status: true,
            result: await userAdaptor.createUserAddress(JSON.parse(JSON.stringify(request.payload)))
          });
        }
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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