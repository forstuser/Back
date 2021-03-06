'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareAuthRoutes = prepareAuthRoutes;

var _user = require('../api/controllers/user');

var _user2 = _interopRequireDefault(_user);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareAuthRoutes(modal, routeObject, middleware) {
  //= ========================
  // Auth Routes
  //= ========================
  const controllerInit = new _user2.default(modal);
  if (controllerInit) {

    /*Send OTP*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/getotp',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.hasMultipleAccounts,
          assign: 'hasMultipleAccounts'
        }],
        handler: _user2.default.dispatchOTP,
        description: 'Generate OTP.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            PhoneNo: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Send OTP To seller*/
    routeObject.push({
      method: 'POST',
      path: '/sellers/getotp',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.hasSellerMultipleAccounts,
          assign: 'hasSellerMultipleAccounts'
        }],
        handler: _user2.default.dispatchSellerOTP,
        description: 'Generate OTP.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            mobile_no: _joi2.default.string().required(),
            email: _joi2.default.string(),
            gstin: _joi2.default.string(),
            pan: _joi2.default.string(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Update FCM of consumer*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/subscribe',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.subscribeUser,
        description: 'Update User FCM Server ID.',
        validate: {
          payload: {
            fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            selected_language: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Update FCM of Seller*/
    routeObject.push({
      method: 'POST',
      path: '/sellers/subscribe',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.logSellerAction,
          assign: 'seller_action'
        }],
        handler: _user2.default.subscribeSellerUser,
        description: 'Update Seller User FCM Server ID.',
        validate: {
          payload: {
            fcm_id: [_joi2.default.string(), _joi2.default.allow(null)],
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            selected_language: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Update Consumer Profile*/
    routeObject.push({
      method: 'PUT',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.verifyUserEmail,
          assign: 'isValidEmail'
        }],
        handler: _user2.default.updateUserProfile,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: [_joi2.default.string(), _joi2.default.allow(null)],
            fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            gender: [_joi2.default.number(), _joi2.default.allow(null)],
            email: [_joi2.default.string(), _joi2.default.allow(null, '')],
            oldEmail: [_joi2.default.string(), _joi2.default.allow(null, '')],
            name: [_joi2.default.string(), _joi2.default.allow(null, '')],
            latitude: [_joi2.default.string(), _joi2.default.allow(null, '')],
            longitude: [_joi2.default.string(), _joi2.default.allow(null, '')],
            location: [_joi2.default.string(), _joi2.default.allow(null, '')],
            addresses: _joi2.default.array(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/addresses',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.updateUserAddress,
        description: 'Update User Address.',
        validate: {
          payload: {
            address_line_1: [_joi2.default.string(), _joi2.default.allow(null)],
            address_line_2: [_joi2.default.string(), _joi2.default.allow(null)],
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            city_id: [_joi2.default.number(), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            locality_id: [_joi2.default.number(), _joi2.default.allow(null)],
            address_type: [_joi2.default.number(), _joi2.default.allow(null)],
            pin: [_joi2.default.string(), _joi2.default.allow(null)],
            latitude: [_joi2.default.number(), _joi2.default.allow(null)],
            longitude: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/addresses',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.retrieveUserAddresses,
        description: 'Retrieve User Address List.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/consumer/addresses/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.deleteUserAddress,
        description: 'Delete User Address By Identity.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Retrieve Profile of Consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.retrieveUserProfile,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Verify Email Secret of Consumer*/
    routeObject.push({
      method: 'GET',
      path: '/verify/{token}',
      config: {
        handler: _user2.default.verifyEmailAddress,
        description: 'Verify Email Address.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Retrieve Near By of User*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/nearby',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _user2.default.retrieveNearBy,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Validate Consumer OTP*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/validate',
      config: {
        handler: _user2.default.validateOTP,
        description: 'Register User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            Token: _joi2.default.string().allow(null),
            TrueObject: _joi2.default.object({
              EmailAddress: _joi2.default.string().email(),
              PhoneNo: _joi2.default.string().required(),
              Name: _joi2.default.string(),
              ImageLink: _joi2.default.string()
            }).allow(null),
            TruePayload: _joi2.default.string().allow(null),
            fcmId: _joi2.default.string().allow(null),
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            BBLogin_Type: _joi2.default.number().required(),
            transactionId: _joi2.default.string().allow(null),
            TrueSecret: _joi2.default.string().allow(null),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Validate Seller OTP*/
    routeObject.push({
      method: 'POST',
      path: '/sellers/validate',
      config: {
        handler: _user2.default.validateSellerOTP,
        description: 'Register User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: _joi2.default.string().allow(null),
            fcm_id: _joi2.default.string().allow(null),
            gstin: _joi2.default.string(),
            pan: _joi2.default.string(),
            email: [_joi2.default.string(), _joi2.default.allow(null)],
            mobile_no: _joi2.default.string().required(),
            seller_detail: _joi2.default.object(),
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            login_type: _joi2.default.number(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/validate',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.hasMultipleAccounts,
          assign: 'hasMultipleAccounts'
        }],
        handler: _user2.default.validateToken,
        description: 'Set PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: _joi2.default.string().required(),
            mobile_no: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/otp/send',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.verifyUserEmail,
          assign: 'isValidEmail'
        }],
        handler: _user2.default.dispatchOTPOverEmail,
        description: 'Send OTP over User mail for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            email: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/otp/validate',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.verifyUserOTP,
          assign: 'isValidOTP'
        }],
        handler: _user2.default.verifyEmailSecret,
        description: 'Verify OTP sent over user mail for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/pin',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.verifyUserPIN,
          assign: 'pinVerified'
        }],
        handler: _user2.default.verifyPin,
        description: 'Set PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: _joi2.default.string().allow(null),
            old_pin: _joi2.default.string().allow(null),
            pin: _joi2.default.string().required(),
            mobile_no: _joi2.default.string().allow(null),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/consumer/pin',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.verifyUserPIN,
          assign: 'pinVerified'
        }],
        handler: _user2.default.removePin,
        description: 'Remove PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            pin: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/pin/reset',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }, {
          method: middleware.updateUserPIN,
          assign: 'pinVerified'
        }],
        handler: _user2.default.resetPIN,
        description: 'Reset PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            old_pin: _joi2.default.string().allow(null),
            pin: _joi2.default.string().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Logout Consumer from app*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/logout',
      config: {
        handler: _user2.default.logout,
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        description: 'Logout User.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: _joi2.default.object({
            fcmId: [_joi2.default.string()],
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }).allow(null)
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    /*Logout Seller from app*/
    routeObject.push({
      method: 'POST',
      path: '/sellers/logout',
      config: {
        handler: _user2.default.logoutSeller,
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        description: 'Logout Seller User.',
        tags: ['api', 'seller', 'Authentication'],
        validate: {
          payload: _joi2.default.object({
            fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
            platform: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }).allow(null)
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 202, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
  }
}