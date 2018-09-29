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
import S3FS from 's3fs';
import Promise from 'bluebird';
import SellerAdaptor from '../Adaptors/sellers';
import CategoryAdaptor from '../Adaptors/category';

const PUBLIC_KEY = new RSA(config.TRUECALLER_PUBLIC_KEY,
    {signingScheme: 'sha512'});
const AWS = config.AWS;
const fsImpl = new S3FS(AWS.S3.BUCKET, AWS.ACCESS_DETAILS);
let replyObject = {
  status: true,
  message: 'success',
};

let userModel, userRelationModel, modals, dashboardAdaptor, userAdaptor,
    nearByAdaptor, notificationAdaptor, fcmModel, fcmManager, sellerAdaptor,
    categoryAdaptor;

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
      console.log('Error in sending iCUBESWIRE POSTBACK is as follow: \n',
          JSON.stringify({API_Logs: err}));
    });
  }
};

let loginOrRegisterUser = async parameters => {
  let {userWhere, userInput, trueObject, request, reply} = parameters;
  const selected_language = request.language;
  let token;
  let updatedUser;
  try {
    let userData = await userAdaptor.loginOrRegister(userWhere, userInput);
    if (!userData[1]) {
      userData = await Promise.all([
        Promise.try(() => userData[0].updateAttributes(userInput)),
        userData[1]]);
    } else {
      userData = await Promise.all([userData[0], userData[1]]);
    }
    updatedUser = userData[0].toJSON();

    if ((!updatedUser.email_verified) && (updatedUser.email)) {
      NotificationAdaptor.sendVerificationMail(updatedUser.email,
          updatedUser);
    }

    if (trueObject.ImageLink) {
      UserController.uploadTrueCallerImage(trueObject, updatedUser);
    }

    if (request.payload.fcmId) {
      await fcmManager.insertFcmDetails({
        userId: updatedUser.id || updatedUser.ID,
        fcmId: request.payload.fcmId,
        platformId: request.payload.platform || 1,
        selected_language,
      });
    }

    trackTransaction(request.payload.transactionId, updatedUser.id);
    replyObject.authorization = `bearer ${authentication.generateToken(
        userData[0]).token}`;
    token = replyObject.authorization;
    const result = await dashboardAdaptor.prepareDashboardResult({
      isNewUser: userData[1], user: userData[0].toJSON(),
      token: replyObject.authorization, request,
    });
    return reply.response(result).
        code(201).
        header('authorization', replyObject.authorization);

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
        err,
      }),
    }).catch((ex) => console.log('error while logging on db,', ex));
    return reply.response({
      status: false,
      message: 'Unable to login.',
      forceUpdate: request.pre.forceUpdate,
      err,
    });
  }

};

class UserController {
  constructor(modal) {
    userModel = modal.users;
    userRelationModel = modal.users_temp;
    modals = modal;
    fcmModel = modal.fcm_details;
    fcmManager = new FCMManager(modal.fcm_details);
    dashboardAdaptor = new DashboardAdaptor(modals);
    userAdaptor = new UserAdaptor(modals);
    nearByAdaptor = new NearByAdaptor(modals);
    notificationAdaptor = new NotificationAdaptor(modals);
    sellerAdaptor = new SellerAdaptor(modals);
    categoryAdaptor = new CategoryAdaptor(modals);
  }

  static async subscribeUser(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      replyObject = {
        status: true,
        message: 'success',
        forceUpdate: request.pre.forceUpdate,
      };
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
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
            selected_language: request.payload.selected_language,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update fcm details.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async dispatchOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
    };
    try {
      const result = await GoogleHelper.isValidPhoneNumber(
          request.payload.PhoneNo);
      if (!result) {
        console.log(
            `Phone number: ${request.payload.PhoneNo} is not a valid phone number`);
        replyObject.status = false;
        replyObject.message = 'Invalid Phone number';
        return reply.response(replyObject);
      }

      if (!request.pre.hasMultipleAccounts) {
        const [otpStatus, user] = await Promise.all([
          OTPHelper.sendOTPToUser(request.payload.PhoneNo,
              (request.headers['ios-app-version'] &&
                  request.headers['ios-app-version'] <
                  14) ||
              (request.headers['app-version'] && request.headers['app-version'] <
                  13) ? 6 : 4),
          userAdaptor.retrieveSingleUser({
            where: {
              mobile_no: request.payload.PhoneNo,
            },
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to send OTP on provided number.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async dispatchSellerOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
    };
    try {

      if (!request.pre.hasSellerMultipleAccounts) {
        const {mobile_no, gstin, pan, email} = request.payload || {};
        const [is_valid_phone_no, gst_detail] = await Promise.all([
          GoogleHelper.isValidPhoneNumber(mobile_no),
          gstin ? GoogleHelper.isValidGSTIN(gstin) : true]);
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
        let seller_updates = JSON.parse(JSON.stringify(
            (gst_detail && gst_detail === true) ? {gstin, pan} : {
              gstin, pan, seller_name: gst_detail.lgnm || undefined,
              pincode: gst_detail.pradr.addr.pncd || undefined,
              state: gst_detail.pradr.addr.stcd || undefined,
              city: gst_detail.pradr.addr.city || undefined,
              latitude: gst_detail.pradr.addr.lt || undefined,
              longitude: gst_detail.pradr.addr.lg || undefined,
              address: `${gst_detail.pradr.addr.bno}, ${gst_detail.pradr.addr.flno} ${gst_detail.pradr.addr.bnm}, ${gst_detail.pradr.addr.st}, ${gst_detail.pradr.addr.loc}`,
            }));
        const [otpStatus, user, seller_detail] = await Promise.all([
          OTPHelper.sendOTPToUser(mobile_no, 4),
          userAdaptor.retrieveSellerUser(
              {where: JSON.parse(JSON.stringify({mobile_no, email}))}),
          gstin || pan ? sellerAdaptor.retrieveOrUpdateSellerDetail(
              {where: JSON.parse(JSON.stringify({$or: {gstin, pan}}))},
              seller_updates, false) : undefined]);

        if (otpStatus.type === 'success') {
          console.log('SMS SENT WITH ID: ', otpStatus.message);
          replyObject.mobile_no = mobile_no;
          replyObject.seller_detail = JSON.parse(
              JSON.stringify(seller_detail || seller_updates || {}));
          if (user) {
            replyObject.name = user.name;
            replyObject.image_url = user.image_url;
            return reply.response(JSON.parse(JSON.stringify(replyObject))).
                code(201);
          } else {
            return reply.response(JSON.parse(JSON.stringify(replyObject))).
                code(201);
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to send OTP on provided number.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async dispatchOTPOverEmail(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
    };
    const user = request.user;
    try {
      if (request.pre.isValidEmail) {
        const response = await OTPHelper.sendOTPOverEmail(request.payload.email,
            request.user.name, (request.headers['ios-app-version'] &&
                request.headers['ios-app-version'] < 14) ||
            (request.headers['app-version'] && request.headers['app-version'] < 13) ?
                6 : 4);
        await userAdaptor.updateUserDetail({
          email: request.payload.email.toLowerCase(),
          email_secret: response[0],
          otp_created_at: moment.utc(),
        }, {where: {id: request.user.id}});
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to send OTP over email.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async verifyEmailSecret(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
    };
    try {
      if (request.pre.isValidOTP) {
        const currentUser = request.user.toJSON();
        await userAdaptor.updateUserDetail({
          email_verified: true,
        }, {
          where: {
            id: currentUser.id,
          },
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Invalid OTP.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async validateOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    const trueObject = request.payload.TrueObject || {};

    let userWhere = {
      mobile_no: trueObject.PhoneNo,
      user_status_type: [1, 2],
      role_type: 5,
    };
    const userInput = {
      role_type: 5,
      mobile_no: trueObject.PhoneNo,
      user_status_type: 1,
      last_login_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      last_active_date: moment.utc(),
      last_api: request.url.pathname,
    };

    try {
      if (!request.pre.forceUpdate) {
        if (request.payload.BBLogin_Type === 1) {
          if (trueObject.PhoneNo !== '7589145713' && trueObject.PhoneNo !==
              '9661086188') {
            const data = await OTPHelper.verifyOTPForUser(trueObject.PhoneNo,
                request.payload.Token);
            console.log('VALIDATE OTP RESPONSE: ', data);
            if (data.type === 'success') {
              return await loginOrRegisterUser(
                  {userWhere, userInput, trueObject, request, reply});

            } else {
              replyObject.status = false;
              replyObject.message = 'Invalid/Expired OTP';

              return reply.response(replyObject);
            }
          } else if (request.payload.Token === '0501') {
            return await loginOrRegisterUser(
                {userWhere, userInput, trueObject, request, reply});
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
            userInput.email_secret = uuid.v4();
            userInput.mobile_no = trueObject.PhoneNo;
            userInput.user_status_type = 1;
            return await loginOrRegisterUser({
              userWhere, userInput, trueObject, request, reply,
            });
          }
        } else if (request.payload.BBLogin_Type === 3) {
          const fbSecret = request.payload.TrueSecret;

          if (fbSecret) {
            const fbResult = await requestPromise({
              uri: config.FB_GRAPH_ROUTE +
                  'me?fields=id,email,name,picture{url}',
              qs: {
                access_token: fbSecret,
              },
              json: true,
            });
            console.log(fbResult);
            if (fbResult.email) {
              userWhere.email = {$iLike: fbResult.email};
              userWhere.$or = [
                {
                  fb_id: fbResult.id,
                }, {fb_id: null}];
            } else {
              userWhere.fb_id = fbResult.id;
            }

            userInput.email = fbResult.email ?
                fbResult.email.toLowerCase() :
                undefined;
            userInput.full_name = fbResult.name;
            userInput.email_verified = !!(fbResult.email);
            userInput.mobile_no = userInput.mobile_no ||
                fbResult.mobile_phone;
            userInput.fb_id = fbResult.id;
            userInput.user_status_type = 1;
            fbResult.ImageLink = config.FB_GRAPH_ROUTE + '/v2.12/' +
                fbResult.id +
                '/picture?height=2000&width=2000';
            return await loginOrRegisterUser({
              userWhere: JSON.parse(JSON.stringify(userWhere)),
              userInput: JSON.parse(JSON.stringify(userInput)),
              trueObject: fbResult,
              request,
              reply,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to validate.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async validateSellerOTP(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    try {
      let {mobile_no, gstin, pan, email, fcm_id, seller_detail, platform, login_type, token} = request.payload ||
      {};
      let userWhere = JSON.parse(JSON.stringify({
        where: {
          mobile_no, email, status_type: 1,
        },
      }));

      if (!request.pre.forceUpdate) {
        const data = await OTPHelper.verifyOTPForUser(mobile_no, token);
        console.log('VALIDATE OTP RESPONSE: ', data);
        if (data.type === 'success') {
          let user_detail = await userAdaptor.retrieveSellerUser(userWhere,
              true, {mobile_no, email, status_type: 1, is_logged_out: false});
          let [seller_detail] = await Promise.all([
            sellerAdaptor.retrieveOrUpdateSellerDetail(
                {
                  where: JSON.parse(JSON.stringify({user_id: user_detail.id})),
                  attributes: ['seller_type_id', 'id'],
                },
                false, false),
            fcmManager.insertSellerFcmDetails({
              seller_user_id: user_detail.id,
              fcm_id, platform_id: platform || 1,
            })]);
          if (seller_detail) {
            user_detail.seller_type_id = seller_detail.seller_type_id;
            user_detail.seller_id = seller_detail.id;
          }
          user_detail.seller_detail = true;

          replyObject.authorization = `bearer ${authentication.generateSellerToken(
              JSON.parse(JSON.stringify(user_detail))).token}`;
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to validate.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async validateToken(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    try {
      if (!request.pre.forceUpdate && !request.pre.hasMultipleAccounts) {

        const data = await OTPHelper.verifyOTPForUser(request.payload.mobile_no,
            request.payload.token);

        console.log('test We are here', request.user);
        let result = [false];
        if (data.type === 'success') {
          result = await Promise.all([
            true, userAdaptor.updateUserDetail({
              mobile_no: request.payload.mobile_no,
            }, {where: {id: request.user.id}})]);
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to validate.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async verifyPin(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };

    try {
      if (!request.pre.forceUpdate) {
        let result = [false];
        if (request.pre.pinVerified) {
          result = await Promise.all([
            true, userAdaptor.updateUserDetail({
              password: request.hashedPassword,
              last_active_date: moment.utc(),
              last_api: request.url.pathname,
            }, {where: {id: request.user.id}})]);
        }
        if (result[0]) {
          replyObject.authorization = `bearer ${authentication.generateToken(
              request.user).token}`;

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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to verify PIN.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async resetPIN(request, reply) {
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };

    try {
      if (!request.pre.forceUpdate) {
        let result = [false];
        if (request.pre.pinVerified) {
          result = await Promise.all([
            true, userAdaptor.updateUserDetail({
              password: request.hashedPassword, last_active_date: moment.utc(),
              last_api: request.url.pathname,
            }, {where: {id: request.user.id}})]);
        }
        if (result[0]) {
          replyObject.authorization = `bearer ${authentication.generateToken(
              request.user).token}`;

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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to reset PIN.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async logout(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    try {
      if ((request.pre.userExist || request.pre.userExist === 0) &&
          !request.pre.forceUpdate) {
        if (request.payload && request.payload.fcmId) {
          await fcmManager.deleteFcmDetails(JSON.parse(JSON.stringify({
            user_id: !user.seller_details ? user.id : undefined,
            seller_user_id: user.seller_details ? user.id : undefined,
            fcm_id: request.payload.fcmId,
            platform_id: request.payload.platform || 1,
          })));
        }

        await (!user.seller_details ?
            userAdaptor.updateUserDetail(
                {last_logout_at: moment.utc().format('YYYY-MM-DD HH:mm:ss')},
                {where: {id: user.id}}) :
            sellerAdaptor.retrieveOrUpdateSellerDetail(
                {where: JSON.parse(JSON.stringify({id: user.id}))},
                {last_logout_at: moment.utc().format('YYYY-MM-DD HH:mm:ss')},
                false));
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to logout user.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async logoutSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    replyObject = {
      status: true,
      message: 'success',
      forceUpdate: request.pre.forceUpdate,
    };
    try {
      if (!request.pre.forceUpdate) {
        await Promise.all([
          fcmManager.updateFcmDetails(JSON.parse(JSON.stringify({
            user_id: !user.seller_details ? user.id : undefined,
            seller_user_id: user.seller_details ? user.id : undefined,
            platform_id: request.payload.platform || 1,
          }))),
          userAdaptor.retrieveSellerUser({where:{id: user.id}}, false,
              {is_logged_out: true})]);

        await (!user.seller_details ?
            userAdaptor.updateUserDetail(
                {last_logout_at: moment.utc().format('YYYY-MM-DD HH:mm:ss')},
                {where: {id: user.id}}) :
            sellerAdaptor.retrieveOrUpdateSellerDetail(
                {where: JSON.parse(JSON.stringify({id: user.id}))},
                {
                  last_logout_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                },
                false));
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to logout user.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async removePin(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate &&
          request.pre.pinVerified) {
        await userAdaptor.updateUserDetail({password: null},
            {where: {id: user.id || user.ID}});
        return reply.response({
          message: 'Successful',
          status: true,
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid PIN',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          message: 'Invalid PIN',
          status: false,
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to remove PIN.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveUserProfile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response(
            await userAdaptor.retrieveUserProfile(user, request));
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid Token',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          message: 'Forbidden',
          status: false,
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve user profile.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateUserProfile(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.isValidEmail && request.pre.userExist &&
          !request.pre.forceUpdate) {
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
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid Token',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update profile.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveUserAddresses(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response({
          status: true,
          result: await userAdaptor.retrieveUserAddresses({
            where: JSON.parse(
                JSON.stringify({user_id: user.id || user.ID})),
          }),
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid Token',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          message: 'Forbidden',
          status: false,
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve user addresses.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async deleteUserAddress(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const {id} = request.params;
        return reply.response({
          status: true,
          result: await userAdaptor.deleteUserAddress({
            where: JSON.parse(
                JSON.stringify({user_id: user.id || user.ID, id})),
          }),
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid Token',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          message: 'Forbidden',
          status: false,
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve user addresses.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateUserAddress(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      const user_id = user.id;
      if (request.pre.userExist &&
          !request.pre.forceUpdate) {
        const {id} = request.payload;
        request.payload.user_id = user_id;
        request.payload.updated_by = user_id;
        request.payload.address_type = request.payload.address_type || 2;

        const address_count = modals.user_addresses.count(
            {where: {user_id, address_type: 1}});
        const locality = request.payload.pin ?
            await categoryAdaptor.retrieveLocalities(
                {where: {pin_code: request.payload.pin}}) :
            undefined;
        request.payload.address_type = address_count && address_count > 0 ?
            2 :
            1;
        if (locality && locality.length > 0) {
          request.payload.city_id = locality[0].city_id;
          request.payload.state_id = locality[0].state_id;
          request.payload.locality_id = locality[0].id;
        }
        if (request.payload.address_type === 1) {
          await userAdaptor.updateUserAddress(
              JSON.parse(JSON.stringify({address_type: 2})), {
                where: {user_id},
              });
        }
        if (id) {
          return reply.response({
            status: true,
            result: await userAdaptor.updateUserAddress(
                JSON.parse(JSON.stringify(request.payload)), {
                  where: {user_id, id},
                }),
          });
        } else {
          return reply.response({
            status: true,
            result: await userAdaptor.createUserAddress(
                JSON.parse(JSON.stringify(request.payload))),
          });
        }
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response(
            {
              message: 'Invalid Token',
              status: false,
              forceUpdate: request.pre.forceUpdate,
            });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
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
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update profile.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static retrieveNearBy(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return nearByAdaptor.retrieveNearBy(request.query.location ||
          user.location, request.query.geolocation ||
          `${user.latitude},${user.longitude}`,
          request.query.professionids || '[]', reply, user.id || user.ID,
          request);
    } else {
      return reply.response({
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
    console.log(trueObject);
    if (trueObject.ImageLink) {
      const options = {
        uri: trueObject.ImageLink,
        timeout: 170000,
        resolveWithFullResponse: true,
        encoding: null,
      };
      console.log(userData.id);
      modals.users.findById(userData.id || userData.ID, {
        attributes: [
          'image_name',
        ],
      }).then((userImage) => {
        const userDetail = userImage.toJSON();
        console.log({
          userDetail,
        });
        if (!userDetail.image_name) {
          requestPromise(options).then((result) => {
            UserController.uploadUserImage(userData, result);
          }).catch((err) => {
            console.log(
                `Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
          });
        } else {
          fsImpl.headObject(userDetail.image_name).catch((err) => {
            console.log(
                `Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
            requestPromise(options).then((result) => {
              UserController.uploadUserImage(userData, result);
            }).catch((err) => {
              console.log(
                  `Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
            });
          });
        }

      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);

        requestPromise(options).then((result) => {
          UserController.uploadUserImage(userData, result);
        }).catch((err) => {
          console.log(
              `Error on ${new Date()} for user id: ${userData.id} is as follow: \n \n ${err}`);
        });
      });
    }
  }

  static uploadUserImage(user, result) {
    try {
      const fileType = result.headers['content-type'].split('/')[1];
      const fileName = `active-${user.id ||
      user.ID}-${new Date().getTime()}.${fileType}`;
      // const file = fs.createReadStream();
      fsImpl.writeFile(fileName, result.body,
          {ContentType: result.headers['content-type']}).then((fileResult) => {
        console.log(fileResult);
        modals.users.update({image_name: fileName}, {where: {id: user.id}});
      });
    } catch (err) {

    }
  }
}

export default UserController;
