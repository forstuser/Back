/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
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

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

var User = void 0;
var appVersionHelper = void 0;

function prepareServiceCenterRoutes(
    serviceCenterController, serviceCenterRoutes) {
  if (serviceCenterController) {
    serviceCenterRoutes.push({
      method: 'POST',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
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
            masterCategoryId: [
              _joi2.default.number(),
              _joi2.default.allow(null)],
            brandId: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true,
          }
        }
      }
    });

    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _serviceCenter2.default.retrieveServiceCenters,
      }
    });
    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/servicecenters/filters',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _serviceCenter2.default.retrieveServiceCenterFilters,
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _brand2.default.getBrands,
      }
    });

    brandRoutes.push({
      method: 'GET',
      path: '/brandcenter',
      config: {
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _brand2.default.getBrandASC,
      }
    });
  }
}

// NO APP VERSION CHECK
function prepareCategoryRoutes(categoryController, categoryRoutes) {
  if (categoryController) {
    categoryRoutes.push({
      method: 'GET',
      path: '/categories',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _category2.default.getCategories,
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _user2.default.dispatchOTP,
        description: 'Generate OTP.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            PhoneNo: _joi2.default.string().required(),
            output: 'data',
            parse: true,
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Authenticated',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });

    /*Update FCM of consumer*/
    authRoutes.push({
      method: 'POST',
      path: '/consumer/subscribe',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _user2.default.subscribeUser,
        description: 'Update User FCM Server ID.',
        validate: {
          payload: {
            fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true,
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 202,
                message: 'Authenticated',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _user2.default.updateUserProfile,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: [_joi2.default.string(), _joi2.default.allow(null)],
            fcmId: [_joi2.default.string(), _joi2.default.allow(null)],
            email: [_joi2.default.string(), _joi2.default.allow(null, '')],
            oldEmail: [_joi2.default.string(), _joi2.default.allow(null, '')],
            name: [_joi2.default.string(), _joi2.default.allow(null, '')],
            latitude: [_joi2.default.string(), _joi2.default.allow(null, '')],
            longitude: [_joi2.default.string(), _joi2.default.allow(null, '')],
            location: [_joi2.default.string(), _joi2.default.allow(null, '')],
            addresses: _joi2.default.array(),
            output: 'data',
            parse: true,
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 202,
                message: 'Authenticated',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _user2.default.retrieveUserProfile,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _user2.default.retrieveNearBy,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
            Token: _joi2.default.string(),
            TrueObject: {
              EmailAddress: _joi2.default.string().email(),
              PhoneNo: _joi2.default.string().required(),
              Name: _joi2.default.string(),
              ImageLink: _joi2.default.string(),
            },
            TruePayload: _joi2.default.string(),
            fcmId: _joi2.default.string(),
            BBLogin_Type: _joi2.default.number().required(),
            transactionId: _joi2.default.string(),
            TrueSecret: _joi2.default.string(),
            output: 'data',
            parse: true,
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Authenticated',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        description: 'Logout User.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: _joi2.default.object({
            fcmId: [_joi2.default.string()],
            output: 'data',
            parse: true,
          }).allow(null)
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 202,
                message: 'Authenticated',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src'),
        },
        handler: _upload2.default.uploadUserImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        }
      }
    });

    /*Allow user to upload document*/
    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/upload',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        files: {
          relativeTo: _path2.default.join(__dirname, '../static/src'),
        },
        handler: _upload2.default.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        }
      }
    });

    /*Retrieve user job copies*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        // auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _upload2.default.retrieveFiles,
      }
    });

    /*Allow user to delete job files*/
    uploadFileRoute.push({
      method: 'DELETE',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _upload2.default.deleteFile,
      }
    });

    /*Retrieve User Image*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/consumer/{id}/images',
      config: {
        // auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _upload2.default.retrieveUserImage,
      }
    });

    /*Retrieve Category images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}',
      config: {
        handler: _upload2.default.retrieveCategoryImage,
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.getDashboard,
      }
    });

    /*Retrieve E-Home of consumer*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/ehome',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.getEHome,
      }
    });

    /*Retrieve Product list for categories*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/categories/{id}/products',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.getProductsInCategory,
      }
    });

    /*Retrieve mails of consumer*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/mailbox',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.getMailbox,
      }
    });

    /*Mark mail of consumer read*/
    dashboardRoutes.push({
      method: 'POST',
      path: '/consumer/mailbox/read',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.updateNotificationStatus,
        validate: {
          payload: {
            notificationIds: _joi2.default.array().
                items(_joi2.default.number()).
                required().
                min(0),
            output: 'data',
            parse: true,
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _dashboard2.default.notifyUser,
        validate: {
          payload: _joi2.default.object({
            userId: [_joi2.default.number(), _joi2.default.allow(null)],
            data: _joi2.default.object(),
            output: 'data',
            parse: true,
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        description: 'Update User Review.',
        validate: {
          payload: {
            ratings: [_joi2.default.number(), _joi2.default.allow(null)],
            feedback: [_joi2.default.string(), _joi2.default.allow(null)],
            comments: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true,
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 204,
                message: 'No Content',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });

    productRoutes.push({
      method: 'GET',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _product2.default.retrieveProductDetail,
        description: 'Get Product Details.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });

    productRoutes.push({
      method: 'GET',
      path: '/center/products',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _product2.default.retrieveCenterProducts,
        description: 'Get Center Products.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });

    productRoutes.push({
      method: 'POST',
      path: '/products',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _product2.default.createProduct,
        description: 'Create Product.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
            main_category_id: [
              _joi2.default.number(),
              _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
            colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
            purchase_cost: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            document_number: [
              _joi2.default.string(),
              _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            metadata: [_joi2.default.array(), _joi2.default.allow(null)],
          }
        }
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
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _insight2.default.retrieveCategorywiseInsight,
        description: 'Get Insight Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });
    insightRoutes.push({
      method: 'GET',
      path: '/categories/{id}/insights',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _insight2.default.retrieveInsightForSelectedCategory,
        description: 'Get Insight Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
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
          }
        }
      }
    });

    generalRoutes.push({
      method: 'GET',
      path: '/faqs',
      config: {
        handler: _general2.default.retrieveFAQs,
        description: 'Retrieve FAQ\'s',
      }
    });

    generalRoutes.push({
      method: 'GET',
      path: '/referencedata',
      config: {
        handler: _general2.default.retrieveReferenceData,
        description: 'Retrieve Reference data',
      }
    });
  }
}

exports.default = function(app, modals) {
  appVersionHelper = new _appVersion2.default(modals);
  User = modals.users;
  // Middleware to require login/auth
  new _passport4.default(User);
  _passport2.default.authenticate('jwt', {session: false});
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

  var uploadFileRoute = [];
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

  prepareAuthRoutes(userController, authRoutes);

  prepareCategoryRoutes(categoryController, categoryRoutes);

  prepareBrandRoutes(brandController, brandRoutes);

  prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes);

  prepareUploadRoutes(uploadController, uploadFileRoute);

  prepareDashboardRoutes(dashboardController, dashboardRoutes);

  prepareProductRoutes(productController, productRoutes);

  prepareInsightRoutes(insightController, insightRoutes);
  prepareGeneralRoutes(generalController, generalRoutes);

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          }],
        handler: _search2.default.retrieveSearch,
        description: 'Get Search Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {
                code: 200,
                message: 'Successful',
              },
              {
                code: 400,
                message: 'Bad Request',
              },
              {
                code: 401,
                message: 'Invalid Credentials',
              },
              {
                code: 404,
                message: 'Not Found',
              },
              {
                code: 500,
                message: 'Internal Server Error',
              }],
          }
        }
      }
    });
  }

  app.route([].concat(authRoutes, categoryRoutes, brandRoutes, sellerRoutes,
      serviceCenterRoutes, billManagementRoutes, uploadFileRoute,
      dashboardRoutes, productRoutes, insightRoutes, searchRoutes,
      generalRoutes));
};