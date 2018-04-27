/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _brand = require('../api/controllers/brand');

var _brand2 = _interopRequireDefault(_brand);

var _category = require('../api/controllers/category');

var _category2 = _interopRequireDefault(_category);

var _dashboard = require('../api/controllers/dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _general = require('../api/controllers/general');

var _general2 = _interopRequireDefault(_general);

var _insight = require('../api/controllers/insight');

var _insight2 = _interopRequireDefault(_insight);

var _product = require('../api/controllers/product');

var _product2 = _interopRequireDefault(_product);

var _search = require('../api/controllers/search');

var _search2 = _interopRequireDefault(_search);

var _serviceCenter = require('../api/controllers/serviceCenter');

var _serviceCenter2 = _interopRequireDefault(_serviceCenter);

var _upload = require('../api/controllers/upload');

var _upload2 = _interopRequireDefault(_upload);

var _user = require('../api/controllers/user');

var _user2 = _interopRequireDefault(_user);

var _passport3 = require('../config/passport');

var _passport4 = _interopRequireDefault(_passport3);

var _appVersion = require('../helpers/appVersion');

var _appVersion2 = _interopRequireDefault(_appVersion);

var _productItem = require('../api/controllers/productItem');

var _productItem2 = _interopRequireDefault(_productItem);

var _calendarServices = require('../api/controllers/calendarServices');

var _calendarServices2 = _interopRequireDefault(_calendarServices);

var _whatToServices = require('../api/controllers/whatToServices');

var _whatToServices2 = _interopRequireDefault(_whatToServices);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = void 0;
var appVersionHelper = void 0;

function prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes) {
    if (serviceCenterController) {
        serviceCenterRoutes.push({
            method: 'POST',
            path: '/consumer/servicecenters',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _serviceCenter2.default.retrieveServiceCenters,
                validate: {
                    payload: {
                        location: [_joi2.default.string(), _joi2.default.allow(null)],
                        city: [_joi2.default.string(), _joi2.default.allow(null)],
                        searchValue: [_joi2.default.string(), _joi2.default.allow(null)],
                        longitude: [_joi2.default.string(), _joi2.default.allow(null)],
                        latitude: [_joi2.default.string(), _joi2.default.allow(null)],
                        categoryId: [_joi2.default.number(), _joi2.default.allow(null)],
                        masterCategoryId: [_joi2.default.number(), _joi2.default.allow(null)],
                        brandId: [_joi2.default.number(), _joi2.default.allow(null)],
                        output: 'data',
                        parse: true
                    }
                }
            }
        });

        serviceCenterRoutes.push({
            method: 'GET',
            path: '/consumer/servicecenters',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _serviceCenter2.default.retrieveServiceCenters
            }
        });
        serviceCenterRoutes.push({
            method: 'GET',
            path: '/consumer/servicecenters/filters',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _serviceCenter2.default.retrieveServiceCenterFilters
            }
        });

        serviceCenterRoutes.push({
            method: 'GET',
            path: '/consumer/{mode}/centers',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _serviceCenter2.default.retrieveServiceCenters
            }
        });
        serviceCenterRoutes.push({
            method: 'GET',
            path: '/consumer/web/centers/filters',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _serviceCenter2.default.retrieveServiceCenterFilters
            }
        });
    }
}

function prepareBrandRoutes(brandController, brandRoutes) {
    if (brandController) {
        // Get brands
        brandRoutes.push({
            method: 'GET',
            path: '/brands',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _brand2.default.getBrands
            }
        });

        brandRoutes.push({
            method: 'GET',
            path: '/{mode}/brands',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _brand2.default.getBrands
            }
        });

        brandRoutes.push({
            method: 'GET',
            path: '/brandcenter',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _brand2.default.getBrandASC
            }
        });
    }
}

function prepareCategoryRoutes(categoryController, categoryRoutes) {
    if (categoryController) {
        categoryRoutes.push({
            method: 'GET',
            path: '/categories',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _category2.default.getCategories
            }
        });
        categoryRoutes.push({
            method: 'GET',
            path: '/{mode}/categories',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _category2.default.getCategories
            }
        });
    }
}

function prepareAuthRoutes(userController, authRoutes) {
    //= ========================
    // Auth Routes
    //= ========================

    if (userController) {

        /*Send OTP*/
        authRoutes.push({
            method: 'POST',
            path: '/consumer/getotp',
            config: {
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.hasMultipleAccounts,
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

        /*Update FCM of consumer*/

        /*Update FCM of consumer*/
        authRoutes.push({
            method: 'POST',
            path: '/consumer/subscribe',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
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

        /*Update Consumer Profile*/
        authRoutes.push({
            method: 'PUT',
            path: '/consumer/profile',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _user2.default.updateUserProfile,
                description: 'Update User Profile.',
                validate: {
                    payload: {
                        phoneNo: [_joi2.default.string(), _joi2.default.allow(null)],
                        fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
                        platform: [_joi2.default.number(), _joi2.default.allow(null)],
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

        /*Retrieve Profile of Consumer*/
        authRoutes.push({
            method: 'GET',
            path: '/consumer/profile',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
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
        authRoutes.push({
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
        authRoutes.push({
            method: 'GET',
            path: '/consumer/nearby',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
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
        authRoutes.push({
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

        authRoutes.push({
            method: 'PUT',
            path: '/consumer/validate',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.hasMultipleAccounts,
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

        authRoutes.push({
            method: 'POST',
            path: '/consumer/otp/send',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.verifyUserEmail,
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

        authRoutes.push({
            method: 'POST',
            path: '/consumer/otp/validate',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.verifyUserOTP,
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

        authRoutes.push({
            method: 'POST',
            path: '/consumer/pin',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.verifyUserPIN,
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

        authRoutes.push({
            method: 'DELETE',
            path: '/consumer/pin',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.verifyUserPIN,
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

        authRoutes.push({
            method: 'POST',
            path: '/consumer/pin/reset',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }, {
                    method: appVersionHelper.updateUserPIN,
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
        authRoutes.push({
            method: 'POST',
            path: '/consumer/logout',
            config: {
                handler: _user2.default.logout,
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
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
    }
}

function prepareUploadRoutes(uploadController, uploadFileRoute) {
    if (uploadController) {
        /*Upload User Image*/
        uploadFileRoute.push({
            method: 'POST',
            path: '/consumer/upload/selfie',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                files: {
                    relativeTo: _path2.default.join(__dirname, '../static/src')
                },
                handler: _upload2.default.uploadUserImage,
                payload: {
                    output: 'stream',
                    parse: true,
                    uploads: 'up_files',
                    timeout: 30034,
                    allow: 'multipart/form-data',
                    failAction: 'log',
                    maxBytes: 209715200
                }
            }
        });

        /*Upload Product Image*/
        uploadFileRoute.push({
            method: 'POST',
            path: '/consumer/products/{id}/images',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                files: {
                    relativeTo: _path2.default.join(__dirname, '../static/src')
                },
                handler: _upload2.default.uploadProductImage,
                payload: {
                    output: 'stream',
                    parse: true,
                    uploads: 'up_files',
                    timeout: 30034,
                    allow: 'multipart/form-data',
                    failAction: 'log',
                    maxBytes: 209715200
                }
            }
        });
        /*Upload Wearable Image*/
        uploadFileRoute.push({
            method: 'POST',
            path: '/wearable/{id}/images',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                files: {
                    relativeTo: _path2.default.join(__dirname, '../static/src')
                },
                handler: _upload2.default.uploadWearableImage,
                payload: {
                    output: 'stream',
                    parse: true,
                    uploads: 'up_files',
                    timeout: 30034,
                    allow: 'multipart/form-data',
                    failAction: 'log',
                    maxBytes: 209715200
                }
            }
        });

        /*Retrieve Wearable Image*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/wearable/{id}/images/{image_code}',
            config: {
                handler: _upload2.default.retrieveWearableImage
            }
        });

        /*Retrieve Product Image*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/consumer/products/{id}/images',
            config: {
                handler: _upload2.default.retrieveProductImage
            }
        });

        /*Retrieve Product Image*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/consumer/products/{id}/images/{file_ref}',
            config: {
                handler: _upload2.default.retrieveProductImage
            }
        });
        /*Allow user to upload document*/
        uploadFileRoute.push({
            method: 'POST',
            path: '/consumer/upload',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                files: {
                    relativeTo: _path2.default.join(__dirname, '../static/src')
                },
                handler: _upload2.default.uploadFiles,
                payload: {
                    output: 'stream',
                    parse: true,
                    uploads: 'up_files',
                    timeout: 3003400,
                    allow: 'multipart/form-data',
                    failAction: 'log',
                    maxBytes: 209715200
                },
                timeout: {
                    socket: false
                }
            }
        });

        uploadFileRoute.push({
            method: 'POST',
            path: '/consumer/upload/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                files: {
                    relativeTo: _path2.default.join(__dirname, '../static/src')
                },
                handler: _upload2.default.uploadFiles,
                payload: {
                    output: 'stream',
                    parse: true,
                    uploads: 'up_files',
                    timeout: 3003400,
                    allow: 'multipart/form-data',
                    failAction: 'log',
                    maxBytes: 209715200
                },
                timeout: {
                    socket: false
                }
            }
        });

        /*Retrieve user job copies*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/jobs/{id}/files/{copyid}',
            config: {
                // auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _upload2.default.retrieveFiles
            }
        });

        /*Allow user to delete job files*/
        uploadFileRoute.push({
            method: 'DELETE',
            path: '/jobs/{id}/files/{copyid}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _upload2.default.deleteFile
            }
        });

        /*Retrieve User Image*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/consumer/{id}/images/{image_ref}',
            config: {
                // auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _upload2.default.retrieveUserImage
            }
        });

        /*Retrieve Category images*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/categories/{id}/images/{type}',
            config: {
                handler: _upload2.default.retrieveCategoryImage
            }
        });

        /*Retrieve Calendar Item Image*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/calendarservice/{id}/images',
            config: {
                handler: _upload2.default.retrieveCalendarItemImage
            }
        });

        /*Retrieve Brand images*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/brands/{id}/images',
            config: {
                handler: _upload2.default.retrieveBrandImage
            }
        });

        /*Retrieve Provider images*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/providers/{id}/images',
            config: {
                handler: _upload2.default.retrieveProviderImage
            }
        });

        /*Retrieve Know Item images*/
        uploadFileRoute.push({
            method: 'GET',
            path: '/knowitem/{id}/images',
            config: {
                handler: _upload2.default.retrieveKnowItemImage
            }
        });
    }
}

function prepareDashboardRoutes(dashboardController, dashboardRoutes) {
    if (dashboardController) {

        /*Retrieve dashboard of consumer*/
        dashboardRoutes.push({
            method: 'GET',
            path: '/consumer/dashboard',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.getDashboard
            }
        });

        /*Retrieve E-Home of consumer*/
        dashboardRoutes.push({
            method: 'GET',
            path: '/consumer/ehome',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.getEHome
            }
        });

        /*Retrieve Product list for categories*/
        dashboardRoutes.push({
            method: 'GET',
            path: '/categories/{id}/products',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.getProductsInCategory
            }
        });

        /*Retrieve mails of consumer*/
        dashboardRoutes.push({
            method: 'GET',
            path: '/consumer/mailbox',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.getMailbox
            }
        });

        /*Mark mail of consumer read*/
        dashboardRoutes.push({
            method: 'POST',
            path: '/consumer/mailbox/read',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.updateNotificationStatus,
                validate: {
                    payload: {
                        notificationIds: _joi2.default.array().items(_joi2.default.number()).required().min(0),
                        output: 'data',
                        parse: true
                    }
                }
            }
        });

        /*Send notification to consumer*/
        dashboardRoutes.push({
            method: 'POST',
            path: '/consumer/notify',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _dashboard2.default.notifyUser,
                validate: {
                    payload: _joi2.default.object({
                        userId: [_joi2.default.number(), _joi2.default.allow(null)],
                        data: _joi2.default.object(),
                        output: 'data',
                        parse: true
                    }).allow(null)
                }
            }
        });
    }
}

function prepareProductRoutes(productController, productRoutes) {
    //= ========================
    // Product Routes
    //= ========================

    if (productController) {
        productRoutes.push({
            method: 'PUT',
            path: '/{reviewfor}/{id}/reviews',
            config: {
                handler: _product2.default.updateUserReview,
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                description: 'Update User Review.',
                validate: {
                    payload: {
                        ratings: [_joi2.default.number(), _joi2.default.allow(null)],
                        feedback: [_joi2.default.string(), _joi2.default.allow(null)],
                        comments: [_joi2.default.string(), _joi2.default.allow(null)],
                        output: 'data',
                        parse: true
                    }
                },
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 204, message: 'No Content' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });

        productRoutes.push({
            method: 'GET',
            path: '/products/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _product2.default.retrieveProductDetail,
                description: 'Get Product Details.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });

        productRoutes.push({
            method: 'GET',
            path: '/center/products',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _product2.default.retrieveCenterProducts,
                description: 'Get Center Products.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });

        productRoutes.push({
            method: 'POST',
            path: '/products',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _product2.default.createProduct,
                description: 'Create Product.',
                validate: {
                    payload: {
                        product_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        taxes: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                        document_number: [_joi2.default.string(), _joi2.default.allow(null)],
                        document_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        metadata: [_joi2.default.array().items(_joi2.default.object().keys({
                            category_form_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            form_value: [_joi2.default.string(), _joi2.default.allow(null)],
                            new_drop_down: [_joi2.default.boolean(), _joi2.default.allow(null)]
                        })), _joi2.default.allow(null)],
                        warranty: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            dual_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            accessory_renewal_type: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        insurance: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            amount_insured: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        puc: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        amc: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        repair: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productRoutes.push({
            method: 'PUT',
            path: '/products/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _product2.default.updateProduct,
                description: 'Update Product.',
                validate: {
                    payload: {
                        product_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        sub_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        taxes: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_email: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
                        document_number: [_joi2.default.string(), _joi2.default.allow(null)],
                        document_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        model: [_joi2.default.string(), _joi2.default.allow(null)],
                        isNewModel: [_joi2.default.boolean(), _joi2.default.allow(null)],
                        metadata: [_joi2.default.array().items(_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            category_form_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            form_value: [_joi2.default.string(), _joi2.default.allow(null)]
                        })), _joi2.default.allow(null)],
                        warranty: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            dual_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            dual_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                            extended_effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            accessory_renewal_type: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        insurance: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                            policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
                            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            amount_insured: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        puc: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        amc: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)],
                        repair: [_joi2.default.object().keys({
                            id: [_joi2.default.number(), _joi2.default.allow(null)],
                            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
                            repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                            is_amc_seller: [_joi2.default.string(), _joi2.default.allow(null)],
                            value: [_joi2.default.number(), _joi2.default.allow(null)],
                            warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
                        }), _joi2.default.allow(null)]
                    }
                }
            }
        });
        productRoutes.push({
            method: 'DELETE',
            path: '/products/{id}',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _product2.default.deleteProduct,
                description: 'Delete Product.'
            }
        });
    }
}

function prepareInsightRoutes(insightController, insightRoutes) {
    //= ========================
    // Product Routes
    //= ========================

    if (insightController) {
        insightRoutes.push({
            method: 'GET',
            path: '/insight',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _insight2.default.retrieveCategoryWiseInsight,
                description: 'Get Insight Data.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });
        insightRoutes.push({
            method: 'GET',
            path: '/categories/{id}/insights',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _insight2.default.retrieveInsightForSelectedCategory,
                description: 'Get Insight Data.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });
    }
}

function prepareGeneralRoutes(generalController, generalRoutes) {
    if (generalController) {
        generalRoutes.push({
            method: 'POST',
            path: '/contact-us',
            config: {
                handler: _general2.default.contactUs,
                description: 'Post Contact Us',
                validate: {
                    payload: {
                        name: [_joi2.default.string(), _joi2.default.allow(null)],
                        email: [_joi2.default.string().email(), _joi2.default.allow(null)],
                        phone: _joi2.default.string().required(),
                        message: [_joi2.default.string(), _joi2.default.allow(null)],
                        captcha_response: _joi2.default.string()
                    }
                }
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/faqs',
            config: {
                handler: _general2.default.retrieveFAQs,
                description: 'Retrieve FAQ\'s'
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/tips',
            config: {
                handler: _general2.default.retrieveTips,
                description: 'Retrieve tip\'s'
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/know/items',
            config: {
                handler: _general2.default.retrieveKnowItemUnAuthorized,
                description: 'Retrieve Do You Know Items'
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/know/items/{id}',
            config: {
                handler: _general2.default.retrieveKnowItemsById,
                description: 'Retrieve Do You Know Items'
            }
        });

        generalRoutes.push({
            method: 'POST',
            path: '/know/items',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.retrieveKnowItems,
                description: 'Retrieve Do You Know Items',
                validate: {
                    payload: {
                        tag_id: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
                    }
                }
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/tags',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.retrieveTags,
                description: 'Retrieve Tags for Do You Know Items'
            }
        });

        generalRoutes.push({
            method: 'PUT',
            path: '/know/items/{id}',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.likeKnowItems,
                description: 'Update Like of Know Items for user'
            }
        });

        generalRoutes.push({
            method: 'DELETE',
            path: '/know/items/{id}',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.disLikeKnowItems,
                description: 'Update Like of Know Items for user'
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/referencedata',
            config: {
                handler: _general2.default.retrieveReferenceData,
                description: 'Retrieve Reference data'
            }
        });

        generalRoutes.push({
            method: 'GET',
            path: '/repairs/products',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.retrieveRepairableProducts,
                description: 'Retrieve Repairable Products'
            }
        });

        generalRoutes.push({
            method: 'POST',
            path: '/products/init',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.initializeUserProduct,
                description: 'Create Product.',
                validate: {
                    payload: {
                        product_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        main_category_id: _joi2.default.number(),
                        category_id: _joi2.default.number(),
                        brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        taxes: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        document_number: [_joi2.default.string(), _joi2.default.allow(null)],
                        document_date: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        generalRoutes.push({
            method: 'PUT',
            path: '/service/centers/accessed',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _general2.default.serviceCenterAccessed,
                description: 'Update user service center accessed.'
            }
        });
    }
}

function prepareProductItemRoutes(productItemController, productItemRoutes) {
    //= ========================
    // Repair Routes
    //= ========================

    if (productItemController) {

        productItemRoutes.push({
            method: 'POST',
            path: '/products/{id}/repairs',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateRepair,
                description: 'Update Repair.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        document_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'PUT',
            path: '/products/{id}/repairs/{repairId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateRepair,
                description: 'Update Repair.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        document_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'DELETE',
            path: '/products/{id}/repairs/{repairId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.deleteRepair,
                description: 'Delete Repair.'
            }
        });

        productItemRoutes.push({
            method: 'POST',
            path: '/products/{id}/insurances',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateInsurance,
                description: 'Add Insurance.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        amount_insured: [_joi2.default.number(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'PUT',
            path: '/products/{id}/insurances/{insuranceId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateInsurance,
                description: 'Update Insurance.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        amount_insured: [_joi2.default.number(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'DELETE',
            path: '/products/{id}/insurances/{insuranceId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.deleteInsurance,
                description: 'Delete Insurance.'
            }
        });

        productItemRoutes.push({
            method: 'POST',
            path: '/products/{id}/amcs',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateAmc,
                description: 'Add AMC.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'PUT',
            path: '/products/{id}/amcs/{amcId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateAmc,
                description: 'Update AMC.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'DELETE',
            path: '/products/{id}/amcs/{amcId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.deleteAMC,
                description: 'Delete AMC.'
            }
        });

        productItemRoutes.push({
            method: 'POST',
            path: '/products/{id}/pucs',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updatePUC,
                description: 'Add PUC.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'PUT',
            path: '/products/{id}/pucs/{pucId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updatePUC,
                description: 'Update PUC.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        value: [_joi2.default.number(), _joi2.default.allow(null)],
                        seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'DELETE',
            path: '/products/{id}/pucs/{pucId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.deletePUC,
                description: 'Delete PUC.'
            }
        });

        productItemRoutes.push({
            method: 'POST',
            path: '/products/{id}/warranties',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateWarranty,
                description: 'Add Warranty.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        warranty_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'PUT',
            path: '/products/{id}/warranties/{warrantyId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.updateWarranty,
                description: 'Update Warranty.',
                validate: {
                    payload: {
                        job_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
                        warranty_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        category_id: [_joi2.default.number(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        productItemRoutes.push({
            method: 'DELETE',
            path: '/products/{id}/warranties/{warrantyId}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _productItem2.default.deleteWarranty,
                description: 'Delete AMC.'
            }
        });
    }
}

function prepareCalendarServiceRoutes(calendarController, calendarRoutes) {
    //= ========================
    // Calendar Item Routes
    //= ========================

    if (calendarController) {
        calendarRoutes.push({
            method: 'GET',
            path: '/calendar/referencedata',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.retrieveCalendarServices,
                description: 'Get Calender Service as Reference Data.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'POST',
            path: '/calendar/{service_id}/items',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.createItem,
                description: 'Create Calendar Item.',
                validate: {
                    payload: {
                        product_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_number: [_joi2.default.string(), _joi2.default.allow(null)],
                        wages_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        selected_days: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
                        unit_price: _joi2.default.number().required(),
                        unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        quantity: [_joi2.default.number(), _joi2.default.allow(null)],
                        absent_dates: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
                        effective_date: _joi2.default.string().required()
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'GET',
            path: '/calendar/items',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.retrieveCalendarItemList,
                description: 'Retrieve List of Calendar Items.'
            }
        });

        calendarRoutes.push({
            method: 'GET',
            path: '/calendar/items/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.retrieveCalendarItem,
                description: 'Retrieve Calendar Item by id.'
            }
        });

        calendarRoutes.push({
            method: 'DELETE',
            path: '/calendar/items/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.deleteCalendarItem,
                description: 'Delete Calendar Item by id.'
            }
        });

        calendarRoutes.push({
            method: 'POST',
            path: '/calendar/items/{id}/calc',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.addServiceCalc,
                description: 'Add new calculation detail for calendar services.',
                validate: {
                    payload: {
                        unit_price: _joi2.default.number().required(),
                        unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        quantity: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: _joi2.default.string().required(),
                        selected_days: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{id}/calc/{calc_id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.updateServiceCalc,
                description: 'Update calculation detail for calendar services.',
                validate: {
                    payload: {
                        unit_price: _joi2.default.number().required(),
                        unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
                        quantity: [_joi2.default.number(), _joi2.default.allow(null)],
                        effective_date: _joi2.default.string().required(),
                        selected_days: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{ref_id}/payments/{id}/absent',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.markAbsent,
                description: 'Mark Absent.',
                validate: {
                    payload: {
                        absent_date: _joi2.default.string().required()
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.updateItem,
                description: 'Update Calendar Item.',
                validate: {
                    payload: {
                        product_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
                        provider_number: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{id}/finish',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.finishCalendarItem,
                description: 'Finish Calendar Item.',
                validate: {
                    payload: {
                        end_date: _joi2.default.string().required()
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{id}/paid',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.markPaid,
                description: 'Mark Paid.',
                validate: {
                    payload: {
                        amount_paid: _joi2.default.number().required(),
                        paid_on: _joi2.default.string().required()
                    }
                }
            }
        });

        calendarRoutes.push({
            method: 'PUT',
            path: '/calendar/items/{ref_id}/payments/{id}/present',
            config: {
                auth: 'jwt',
                pre: [{
                    method: appVersionHelper.checkAppVersion,
                    assign: 'forceUpdate'
                }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _calendarServices2.default.markPresent,
                description: 'Mark Present.',
                validate: {
                    payload: {
                        present_date: _joi2.default.string().required()
                    }
                }
            }
        });
    }
}

function prepareWhatToServiceRoutes(whatToServiceController, whatToServiceRoutes) {
    //= ========================
    // What To Service Routes
    //= ========================

    if (whatToServiceController) {
        whatToServiceRoutes.push({
            method: 'GET',
            path: '/states',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveStateReference,
                description: 'Retrieve States.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'GET',
            path: '/states/{state_id}/meals',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveStateMealData,
                description: 'Retrieve Meals available in State.'
            }
        });

        whatToServiceRoutes.push({
            method: 'GET',
            path: '/user/meals',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveUserMealList,
                description: 'Retrieve Meals available in State.'
            }
        });

        whatToServiceRoutes.push({
            method: 'POST',
            path: '/user/meals',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.prepareUserMealList,
                description: 'Create or update user meal list.',
                validate: {
                    payload: {
                        selected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
                        unselected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
                        state_id: [_joi2.default.number(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'POST',
            path: '/user/meals/add',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.addUserMealItem,
                description: 'Create or update user meal list.',
                validate: {
                    payload: {
                        names: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
                        state_id: [_joi2.default.number(), _joi2.default.allow(null)],
                        is_veg: [_joi2.default.boolean(), _joi2.default.allow(null)],
                        current_date: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'PUT',
            path: '/user/meals/{meal_id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.updateMealCurrentDate,
                description: 'Update user meal item current date.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/user/meals/{meal_id}/remove',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.removeMeal,
                description: 'Remove user meal item.'
            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/user/meals/{meal_id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.removeMealCurrentDate,
                description: 'Remove user meal item current date.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'GET',
            path: '/todos',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveToDoListItems,
                description: 'Retrieve To Do List.'
            }
        });

        whatToServiceRoutes.push({
            method: 'GET',
            path: '/user/todos',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveUserToDoList,
                description: 'Retrieve Meals available in State.'
            }
        });

        whatToServiceRoutes.push({
            method: 'POST',
            path: '/user/todos',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.prepareUserToDoList,
                description: 'Create or update user todos list.',
                validate: {
                    payload: {
                        selected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
                        unselected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'POST',
            path: '/user/todos/add',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.addUserToDoList,
                description: 'Create or update user todos list.',
                validate: {
                    payload: {
                        names: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
                        current_date: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'PUT',
            path: '/user/todos/{todo_id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.updateToDoItem,
                description: 'Update user todos.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/user/todos/{todo_id}/remove',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.removeWhatToDos,
                description: 'Remove user todos item.'

            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/user/todos/{todo_id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.removeToDos,
                description: 'Remove user todos item.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'GET',
            path: '/wearables',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.retrieveUserWearables,
                description: 'Retrieve user wearable list.'
            }
        });

        whatToServiceRoutes.push({
            method: 'POST',
            path: '/wearables',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.addUserWearables,
                description: 'Create user wearable list.',
                validate: {
                    payload: {
                        name: [_joi2.default.string(), _joi2.default.allow(null)],
                        current_date: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'PUT',
            path: '/wearables/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.updateUserWearables,
                description: 'Update user wearable list.',
                validate: {
                    payload: {
                        name: [_joi2.default.string(), _joi2.default.allow(null)]
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/wearables/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.destroyUserWearables,
                description: 'DELETE user wearable list.'
            }
        });

        whatToServiceRoutes.push({
            method: 'PUT',
            path: '/user/wearables/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.updateWearableCurrentDate,
                description: 'Update user wearable item current date.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });

        whatToServiceRoutes.push({
            method: 'DELETE',
            path: '/user/wearables/{id}',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _whatToServices2.default.removeWearable,
                description: 'Remove user Wearable item.',
                validate: {
                    payload: {
                        current_date: _joi2.default.string().required()
                    }
                }
            }
        });
    }
}

exports.default = function (app, modals) {
    appVersionHelper = new _appVersion2.default(modals);
    User = modals.users;
    // Middleware to require login/auth
    new _passport4.default(User);
    _passport2.default.authenticate('jwt', { session: false });
    // Initializing route groups
    var authRoutes = [];
    var categoryRoutes = [];
    var brandRoutes = [];
    var sellerRoutes = [];
    var serviceCenterRoutes = [];
    var billManagementRoutes = [];
    var dashboardRoutes = [];
    var productRoutes = [];
    var insightRoutes = [];
    var searchRoutes = [];
    var generalRoutes = [];
    var repairRoutes = [];
    var calendarRoutes = [];
    var uploadFileRoute = [];
    var whatToServiceRoutes = [];
    var userController = new _user2.default(modals);
    var categoryController = new _category2.default(modals);
    var brandController = new _brand2.default(modals);
    var uploadController = new _upload2.default(modals);
    var serviceCenterController = new _serviceCenter2.default(modals);
    var dashboardController = new _dashboard2.default(modals);
    var productController = new _product2.default(modals);
    var insightController = new _insight2.default(modals);
    var searchController = new _search2.default(modals);
    var generalController = new _general2.default(modals);
    var repairController = new _productItem2.default(modals);
    var calendarServiceController = new _calendarServices2.default(modals);
    var whatToServiceController = new _whatToServices2.default(modals);
    prepareAuthRoutes(userController, authRoutes);

    prepareCategoryRoutes(categoryController, categoryRoutes);

    prepareBrandRoutes(brandController, brandRoutes);

    prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes);

    prepareUploadRoutes(uploadController, uploadFileRoute);

    prepareDashboardRoutes(dashboardController, dashboardRoutes);

    prepareProductRoutes(productController, productRoutes);

    prepareInsightRoutes(insightController, insightRoutes);

    prepareGeneralRoutes(generalController, generalRoutes);

    prepareProductItemRoutes(repairController, repairRoutes);

    prepareCalendarServiceRoutes(calendarServiceController, calendarRoutes);

    prepareWhatToServiceRoutes(whatToServiceController, whatToServiceRoutes);

    if (searchController) {
        searchRoutes.push({
            method: 'GET',
            path: '/search',
            config: {
                auth: 'jwt',
                pre: [{ method: appVersionHelper.checkAppVersion, assign: 'forceUpdate' }, {
                    method: appVersionHelper.updateUserActiveStatus,
                    assign: 'userExist'
                }],
                handler: _search2.default.retrieveSearch,
                description: 'Get Search Data.',
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
                    }
                }
            }
        });
    }

    app.route([].concat(authRoutes, categoryRoutes, brandRoutes, sellerRoutes, serviceCenterRoutes, billManagementRoutes, uploadFileRoute, dashboardRoutes, productRoutes, insightRoutes, searchRoutes, generalRoutes, repairRoutes, calendarRoutes, whatToServiceRoutes));
};