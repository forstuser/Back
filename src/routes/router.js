/*jshint esversion: 6 */
'use strict';

import joi from 'joi';
import passport from 'passport';
import Path from 'path';
import BrandController from '../api/controllers/brand';
import CategoryController from '../api/controllers/category';
import DashboardController from '../api/controllers/dashboard';
import GeneralController from '../api/controllers/general';
import InsightController from '../api/controllers/insight';
import ProductController from '../api/controllers/product';
import SearchController from '../api/controllers/search';
import ServiceCenterController from '../api/controllers/serviceCenter';
import UploadController from '../api/controllers/upload';
import UserController from '../api/controllers/user';
import PassportService from '../config/passport';
import AppVersionHelper from '../helpers/appVersion';

let User;
let appVersionHelper;

function prepareServiceCenterRoutes(
    serviceCenterController, serviceCenterRoutes) {
  if (serviceCenterController) {
    serviceCenterRoutes.push({
      method: 'POST',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ServiceCenterController.retrieveServiceCenters,
        validate: {
          payload: {
            location: [joi.string(), joi.allow(null)],
            city: [joi.string(), joi.allow(null)],
            searchValue: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
            categoryId: [joi.number(), joi.allow(null)],
            masterCategoryId: [joi.number(), joi.allow(null)],
            brandId: [joi.number(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
      },
    });

    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/servicecenters',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ServiceCenterController.retrieveServiceCenters,
      },
    });
    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/servicecenters/filters',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ServiceCenterController.retrieveServiceCenterFilters,
      },
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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: BrandController.getBrands,
      },
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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: CategoryController.getCategories,
      },
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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UserController.dispatchOTP,
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
    authRoutes.push({
      method: 'POST',
      path: '/consumer/subscribe',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UserController.subscribeUser,
        description: 'Update User FCM Server ID.',
        validate: {
          payload: {
            fcmId: [joi.string(), joi.allow(null)],
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
    authRoutes.push({
      method: 'PUT',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UserController.updateUserProfile,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: joi.string(),
            location: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
            osTypeId: [joi.string(), joi.allow(null)],
            fcmId: [joi.string(), joi.allow(null)],
            email: [joi.string(), joi.allow(null, '')],
            oldEmail: [joi.string(), joi.allow(null, '')],
            deviceId: [joi.string(), joi.allow(null)],
            deviceModel: [joi.string(), joi.allow(null)],
            apkVersion: [joi.string(), joi.allow(null)],
            name: [joi.string(), joi.allow(null, '')],
            isEnrolled: [joi.boolean(), joi.allow(null)],
            categoryId: [joi.number(), joi.allow(null)],
            isPhoneAllowed: [joi.boolean(), joi.allow(null)],
            isEmailAllowed: [joi.boolean(), joi.allow(null)],
            description: [joi.string(), joi.allow(null, '')],
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
    authRoutes.push({
      method: 'GET',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UserController.retrieveUserProfile,
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
    authRoutes.push({
      method: 'GET',
      path: '/verify/{token}',
      config: {
        handler: UserController.verifyEmailAddress,
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
    authRoutes.push({
      method: 'GET',
      path: '/consumer/nearby',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UserController.retrieveNearBy,
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
    authRoutes.push({
      method: 'POST',
      path: '/consumer/validate',
      config: {
        handler: UserController.validateOTP,
        description: 'Register User for Consumer Portal.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: {
            Token: joi.string(),
            TrueObject: {
              EmailAddress: joi.string().email(),
              PhoneNo: joi.string().required(),
              Name: joi.string(),
              ImageLink: joi.string(),
            },
            TruePayload: joi.string(),
            fcmId: joi.string(),
            BBLogin_Type: joi.number().required(),
            transactionId: joi.string(),
            TrueSecret: joi.string(),
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
    authRoutes.push({
      method: 'POST',
      path: '/consumer/logout',
      config: {
        handler: UserController.logout,
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        description: 'Logout User.',
        tags: ['api', 'User', 'Authentication'],
        validate: {
          payload: joi.object({
            fcmId: [joi.string()],
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

function prepareUploadRoutes(uploadController, uploadFileRoute) {
  if (uploadController) {
    /*Upload User Image*/
    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/upload/selfie',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: UploadController.uploadUserImage,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
      },
    });

    /*Allow user to upload document*/
    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/upload',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: UploadController.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 30034,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
      },
    });

    /*Retrieve user job copies*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UploadController.retrieveFiles,
      },
    });

    /*Allow user to delete job files*/
    uploadFileRoute.push({
      method: 'DELETE',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UploadController.deleteFile,
      },
    });

    /*Retrieve User Image*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/consumer/{id}/images',
      config: {
        // auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: UploadController.retrieveUserImage,
      },
    });

    /*Retrieve Category images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/categories/{id}/image/{type}',
      config: {
        handler: UploadController.retrieveCategoryImage,
      },
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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.getDashboard,
      },
    });

    /*Retrieve E-Home of consumer*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/ehome',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.getEHome,
      },
    });

    /*Retrieve Product list for categories*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/categories/{id}/products',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.getProductsInCategory,
      },
    });

    /*Retrieve mails of consumer*/
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/mailbox',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.getMailbox,
      },
    });

    /*Mark mail of consumer read*/
    dashboardRoutes.push({
      method: 'POST',
      path: '/consumer/mailbox/read',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.updateNotificationStatus,
        validate: {
          payload: {
            notificationIds: joi.array().items(joi.number()).required().min(0),
            output: 'data',
            parse: true,
          },
        },
      },
    });

    /*Send notification to consumer*/
    dashboardRoutes.push({
      method: 'POST',
      path: '/consumer/notify',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: DashboardController.notifyUser,
        validate: {
          payload: joi.object({
            userId: [joi.number(), joi.allow(null)],
            data: joi.object(),
            output: 'data',
            parse: true,
          }).allow(null),
        },
      },
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
        handler: ProductController.updateUserReview,
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        description: 'Update User Review.',
        validate: {
          payload: {
            ratings: [joi.number(), joi.allow(null)],
            feedback: [joi.string(), joi.allow(null)],
            comments: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 204, message: 'No Content'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    productRoutes.push({
      method: 'GET',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ProductController.retrieveProductDetail,
        description: 'Get Product Details.',
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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: InsightController.retrieveCategorywiseInsight,
        description: 'Get Insight Data.',
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
    insightRoutes.push({
      method: 'GET',
      path: '/categories/{id}/insights',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: InsightController.retrieveInsightForSelectedCategory,
        description: 'Get Insight Data.',
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
  }
}

function prepareGeneralRoutes(generalController, generalRoutes) {
  if (generalController) {
    generalRoutes.push({
      method: 'POST',
      path: '/contact-us',
      config: {
        handler: GeneralController.contactUs,
        description: 'Post Contact Us',
        validate: {
          payload: {
            name: [joi.string(), joi.allow(null)],
            email: [joi.string().email(), joi.allow(null)],
            phone: joi.string().required(),
            message: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/faqs',
      config: {
        handler: GeneralController.retrieveFAQs,
        description: 'Retrieve FAQ\'s',
      },
    });
  }
}

export default (app, modals) => {
  appVersionHelper = new AppVersionHelper(modals);
  User = modals.users;
  // Middleware to require login/auth
  new PassportService(User);
  passport.authenticate('jwt', {session: false});
  // Initializing route groups
  const authRoutes = [];
  const categoryRoutes = [];
  const brandRoutes = [];
  const sellerRoutes = [];
  const serviceCenterRoutes = [];
  const billManagementRoutes = [];
  const referenceDataRoutes = [];
  const dashboardRoutes = [];
  const productRoutes = [];
  const insightRoutes = [];
  const searchRoutes = [];
  const generalRoutes = [];

  const uploadFileRoute = [];
  const userController = new UserController(modals);
  const categoryController = new CategoryController(modals);
  const brandController = new BrandController(modals);
  const uploadController = new UploadController(modals);
  const serviceCenterController = new ServiceCenterController(modals);
  const dashboardController = new DashboardController(modals);
  const productController = new ProductController(modals);
  const insightController = new InsightController(modals);
  const searchController = new SearchController(modals);
  const generalController = new GeneralController(modals);

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
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: SearchController.retrieveSearch,
        description: 'Get Search Data.',
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
  }

  app.route([
    ...authRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...sellerRoutes,
    ...serviceCenterRoutes,
    ...billManagementRoutes,
    ...referenceDataRoutes,
    ...uploadFileRoute,
    ...dashboardRoutes,
    ...productRoutes,
    ...insightRoutes,
    ...searchRoutes,
    ...generalRoutes
  ]);
};
