import ControllerObject from '../api/controllers/user';
import joi from 'joi';

export function prepareAuthRoutes(modal, routeObject, middleware) {
  //= ========================
  // Auth Routes
  //= ========================
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {

    /*Send OTP*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/getotp',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.hasMultipleAccounts,
            assign: 'hasMultipleAccounts',
          },
        ],
        handler: ControllerObject.dispatchOTP,
        description: 'Generate OTP.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            PhoneNo: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Update FCM of consumer*/

    /*Update FCM of consumer*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/subscribe',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.subscribeUser,
        description: 'Update User FCM Server ID.',
        validate: {
          payload: {
            fcmId: [joi.string(), joi.allow(null)],
            platform: [joi.number(), joi.allow(null)],
            selected_language: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 202, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Update Consumer Profile*/
    routeObject.push({
      method: 'PUT',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateUserProfile,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: [joi.string(), joi.allow(null)],
            fcmId: [joi.string(), joi.allow(null)],
            platform: [joi.number(), joi.allow(null)],
            gender: [joi.number(), joi.allow(null)],
            email: [joi.string(), joi.allow(null, '')],
            oldEmail: [joi.string(), joi.allow(null, '')],
            name: [joi.string(), joi.allow(null, '')],
            latitude: [joi.string(), joi.allow(null, '')],
            longitude: [joi.string(), joi.allow(null, '')],
            location: [joi.string(), joi.allow(null, '')],
            addresses: joi.array(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 202, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Retrieve Profile of Consumer*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserProfile,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Successful'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Verify Email Secret of Consumer*/
    routeObject.push({
      method: 'GET',
      path: '/verify/{token}',
      config: {
        handler: ControllerObject.verifyEmailAddress,
        description: 'Verify Email Address.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Successful'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Retrieve Near By of User*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/nearby',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveNearBy,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Successful'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Validate Consumer OTP*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/validate',
      config: {
        handler: ControllerObject.validateOTP,
        description: 'Register User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            Token: joi.string().allow(null),
            TrueObject: joi.object({
              EmailAddress: joi.string().email(),
              PhoneNo: joi.string().required(),
              Name: joi.string(),
              ImageLink: joi.string(),
            }).allow(null),
            TruePayload: joi.string().allow(null),
            fcmId: joi.string().allow(null),
            platform: [joi.number(), joi.allow(null)],
            BBLogin_Type: joi.number().required(),
            transactionId: joi.string().allow(null),
            TrueSecret: joi.string().allow(null),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/validate',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.hasMultipleAccounts,
            assign: 'hasMultipleAccounts',
          },
        ],
        handler: ControllerObject.validateToken,
        description: 'Set PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: joi.string().required(),
            mobile_no: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/otp/send',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.verifyUserEmail,
            assign: 'isValidEmail',
          },
        ],
        handler: ControllerObject.dispatchOTPOverEmail,
        description: 'Send OTP over User mail for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            email: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/otp/validate',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.verifyUserOTP,
            assign: 'isValidOTP',
          },
        ],
        handler: ControllerObject.verifyEmailSecret,
        description: 'Verify OTP sent over user mail for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/pin',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.verifyUserPIN,
            assign: 'pinVerified',
          },
        ],
        handler: ControllerObject.verifyPin,
        description: 'Set PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            token: joi.string().allow(null),
            old_pin: joi.string().allow(null),
            pin: joi.string().required(),
            mobile_no: joi.string().allow(null),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/consumer/pin',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.verifyUserPIN,
            assign: 'pinVerified',
          },
        ],
        handler: ControllerObject.removePin,
        description: 'Remove PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            pin: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/pin/reset',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
          {
            method: middleware.updateUserPIN,
            assign: 'pinVerified',
          },
        ],
        handler: ControllerObject.resetPIN,
        description: 'Reset PIN of User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            old_pin: joi.string().allow(null),
            pin: joi.string().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    /*Logout Consumer from app*/
    routeObject.push({
      method: 'POST',
      path: '/consumer/logout',
      config: {
        handler: ControllerObject.logout,
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        description: 'Logout User.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: joi.object({
            fcmId: [joi.string()],
            platform: [joi.number(), joi.allow(null)],
            output: 'data',
            parse: true,
          }).allow(null),
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 202, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });
  }
}