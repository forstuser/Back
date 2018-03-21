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
import ProductItemController from '../api/controllers/productItem';
import CalendarServiceController from '../api/controllers/calendarServices';

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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ServiceCenterController.retrieveServiceCenterFilters,
      },
    });

    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/{mode}/centers',
      config: {
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ServiceCenterController.retrieveServiceCenters,
      },
    });
    serviceCenterRoutes.push({
      method: 'GET',
      path: '/consumer/web/centers/filters',
      config: {
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: BrandController.getBrands,
      },
    });

    brandRoutes.push({
      method: 'GET',
      path: '/{mode}/brands',
      config: {
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: BrandController.getBrands,
      },
    });

    brandRoutes.push({
      method: 'GET',
      path: '/brandcenter',
      config: {
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: BrandController.getBrandASC,
      },
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
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CategoryController.getCategories,
      },
    });
    categoryRoutes.push({
      method: 'GET',
      path: '/{mode}/categories',
      config: {
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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

    /*Update FCM of consumer*/
    authRoutes.push({
      method: 'POST',
      path: '/consumer/subscribe',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: UserController.subscribeUser,
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
    authRoutes.push({
      method: 'PUT',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: UserController.updateUserProfile,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: [joi.string(), joi.allow(null)],
            fcmId: [joi.string(), joi.allow(null)],
            platform: [joi.number(), joi.allow(null)],
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
    authRoutes.push({
      method: 'GET',
      path: '/consumer/profile',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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

    /*Logout Consumer from app*/
    authRoutes.push({
      method: 'POST',
      path: '/consumer/logout',
      config: {
        handler: UserController.logout,
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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

    /*Upload Product Image*/
    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/products/{id}/images',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: UploadController.uploadProductImage,
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

    /*Retrieve Product Image*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/consumer/products/{id}/images',
      config: {
        handler: UploadController.retrieveProductImage,
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: UploadController.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/upload/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        files: {
          relativeTo: Path.join(__dirname, '../static/src'),
        },
        handler: UploadController.uploadFiles,
        payload: {
          output: 'stream',
          parse: true,
          uploads: 'up_files',
          timeout: 3003400,
          allow: 'multipart/form-data',
          failAction: 'log',
          maxBytes: 209715200,
        },
        timeout: {
          socket: false,
        },
      },
    });

    /*Retrieve user job copies*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/jobs/{id}/files/{copyid}',
      config: {
        // auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: UploadController.retrieveUserImage,
      },
    });

    /*Retrieve Category images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/categories/{id}/images/{type}',
      config: {
        handler: UploadController.retrieveCategoryImage,
      },
    });

    /*Retrieve Calendar Item Image*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/calendarservice/{id}/images',
      config: {
        handler: UploadController.retrieveCalendarItemImage,
      },
    });

    /*Retrieve Brand images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/brands/{id}/images',
      config: {
        handler: UploadController.retrieveBrandImage,
      },
    });

    /*Retrieve Provider images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/providers/{id}/images',
      config: {
        handler: UploadController.retrieveProviderImage,
      },
    });

    /*Retrieve Know Item images*/
    uploadFileRoute.push({
      method: 'GET',
      path: '/knowitem/{id}/images',
      config: {
        handler: UploadController.retrieveKnowItemImage,
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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

    productRoutes.push({
      method: 'GET',
      path: '/center/products',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductController.retrieveCenterProducts,
        description: 'Get Center Products.',
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

    productRoutes.push({
      method: 'POST',
      path: '/products',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductController.createProduct,
        description: 'Create Product.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            brand_name: [joi.string(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            brand_id: [joi.number(), joi.allow(null)],
            colour_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            metadata: [
              joi.array().items(joi.object().keys({
                category_form_id: [joi.number(), joi.allow(null)],
                form_value: [joi.string(), joi.allow(null)],
                new_drop_down: [joi.boolean(), joi.allow(null)],
              })), joi.allow(null)],
            warranty: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                renewal_type: [joi.number(), joi.allow(null)],
                dual_renewal_type: [joi.number(), joi.allow(null)],
                extended_renewal_type: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                accessory_renewal_type: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
            insurance: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                provider_id: [joi.number(), joi.allow(null)],
                policy_no: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                amount_insured: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
              }), joi.allow(null)],
            puc: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
              }), joi.allow(null)],
            amc: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
              }), joi.allow(null)],
            repair: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                repair_for: [joi.string(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                warranty_upto: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
          },
        },
      },
    });

    productRoutes.push({
      method: 'PUT',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductController.updateProduct,
        description: 'Update Product.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            brand_name: [joi.string(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            sub_category_id: [joi.number(), joi.allow(null)],
            brand_id: [joi.number(), joi.allow(null)],
            colour_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_email: [joi.string(), joi.allow(null)],
            seller_address: [joi.string(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            model: [joi.string(), joi.allow(null)],
            isNewModel: [joi.boolean(), joi.allow(null)],
            metadata: [
              joi.array().items(joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                category_form_id: [joi.number(), joi.allow(null)],
                form_value: [joi.string(), joi.allow(null)],
              })), joi.allow(null)],
            warranty: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                dual_id: [joi.number(), joi.allow(null)],
                extended_id: [joi.number(), joi.allow(null)],
                extended_provider_id: [joi.number(), joi.allow(null)],
                extended_provider_name: [joi.string(), joi.allow(null)],
                renewal_type: [joi.number(), joi.allow(null)],
                dual_renewal_type: [joi.number(), joi.allow(null)],
                extended_renewal_type: [joi.number(), joi.allow(null)],
                extended_effective_date: [joi.string(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                accessory_renewal_type: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
            insurance: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                provider_id: [joi.number(), joi.allow(null)],
                policy_no: [joi.string(), joi.allow(null)],
                provider_name: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                amount_insured: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
              }), joi.allow(null)],
            puc: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
            amc: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                effective_date: [joi.string(), joi.allow(null)],
                expiry_period: [joi.number(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
            repair: [
              joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                document_date: [joi.string(), joi.allow(null)],
                repair_for: [joi.string(), joi.allow(null)],
                seller_name: [joi.string(), joi.allow(null)],
                seller_contact: [joi.string(), joi.allow(null)],
                is_amc_seller: [joi.string(), joi.allow(null)],
                value: [joi.number(), joi.allow(null)],
                warranty_upto: [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
          },
        },
      },
    });
    productRoutes.push({
      method: 'DELETE',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductController.deleteProduct,
        description: 'Delete Product.',
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: InsightController.retrieveCategoryWiseInsight,
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
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
            captcha_response: joi.string(),
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

    generalRoutes.push({
      method: 'GET',
      path: '/tips',
      config: {
        handler: GeneralController.retrieveTips,
        description: 'Retrieve tip\'s',
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/know/items',
      config: {
        handler: GeneralController.retrieveKnowItemUnAuthorized,
        description: 'Retrieve Do You Know Items',
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/know/items/{id}',
      config: {
        handler: GeneralController.retrieveKnowItemsById,
        description: 'Retrieve Do You Know Items',
      },
    });

    generalRoutes.push({
      method: 'POST',
      path: '/know/items',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.retrieveKnowItems,
        description: 'Retrieve Do You Know Items',
        validate: {
          payload: {
            tag_id: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/tags',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.retrieveTags,
        description: 'Retrieve Tags for Do You Know Items',
      },
    });

    generalRoutes.push({
      method: 'PUT',
      path: '/know/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.likeKnowItems,
        description: 'Update Like of Know Items for user',
      },
    });

    generalRoutes.push({
      method: 'DELETE',
      path: '/know/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.disLikeKnowItems,
        description: 'Update Like of Know Items for user',
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/referencedata',
      config: {
        handler: GeneralController.retrieveReferenceData,
        description: 'Retrieve Reference data',
      },
    });

    generalRoutes.push({
      method: 'GET',
      path: '/repairs/products',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.retrieveRepairableProducts,
        description: 'Retrieve Repairable Products',
      },
    });

    generalRoutes.push({
      method: 'POST',
      path: '/products/init',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.intializeUserProduct,
        description: 'Create Product.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            brand_name: [joi.string(), joi.allow(null)],
            main_category_id: joi.number(),
            category_id: joi.number(),
            brand_id: [joi.number(), joi.allow(null)],
            colour_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    generalRoutes.push({
      method: 'PUT',
      path: '/service/centers/accessed',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: GeneralController.serviceCenterAccessed,
        description: 'Update user service center accessed.',
      },
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
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            repair_for: [joi.string(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_address: [joi.string(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            warranty_upto: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'PUT',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            repair_for: [joi.string(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            warranty_upto: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'DELETE',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.deleteRepair,
        description: 'Delete Repair.',
      },
    });

    productItemRoutes.push({
      method: 'POST',
      path: '/products/{id}/insurances',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateInsurance,
        description: 'Add Insurance.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            policy_no: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            amount_insured: [joi.number(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'PUT',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateInsurance,
        description: 'Update Insurance.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            policy_no: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            amount_insured: [joi.number(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'DELETE',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.deleteInsurance,
        description: 'Delete Insurance.',
      },
    });

    productItemRoutes.push({
      method: 'POST',
      path: '/products/{id}/amcs',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateAmc,
        description: 'Add AMC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'PUT',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateAmc,
        description: 'Update AMC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'DELETE',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.deleteAMC,
        description: 'Delete AMC.',
      },
    });

    productItemRoutes.push({
      method: 'POST',
      path: '/products/{id}/pucs',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updatePUC,
        description: 'Add PUC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'PUT',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updatePUC,
        description: 'Update PUC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'DELETE',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.deletePUC,
        description: 'Delete PUC.',
      },
    });

    productItemRoutes.push({
      method: 'POST',
      path: '/products/{id}/warranties',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateWarranty,
        description: 'Add Warranty.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            warranty_type: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'PUT',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.updateWarranty,
        description: 'Update Warranty.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            warranty_type: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    productItemRoutes.push({
      method: 'DELETE',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ProductItemController.deleteWarranty,
        description: 'Delete AMC.',
      },
    });
  }
}

function prepareCalendarServiceRoutes(calendarController, calendarRoutes) {
//= ========================
  // Product Routes
  //= ========================

  if (calendarController) {
    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/referencedata',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.retrieveCalendarServices,
        description: 'Get Calender Service as Reference Data.',
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

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/{service_id}/items',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.createItem,
        description: 'Create Calendar Item.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            wages_type: [joi.number(), joi.allow(null)],
            selected_days: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            absent_dates: [
              joi.array().items(joi.string()).required().min(0),
              joi.allow(null)],
            effective_date: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.retrieveCalendarItemList,
        description: 'Retrieve List of Calendar Items.',
      },
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.retrieveCalendarItem,
        description: 'Retrieve Calendar Item by id.',
      },
    });

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/items/{id}/calc',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.addServiceCalc,
        description: 'Add new calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            effective_date: joi.string().required(),
            selected_days: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/calc/{calc_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.updateServiceCalc,
        description: 'Update calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            effective_date: joi.string().required(),
            selected_days: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/absent',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.markAbsent,
        description: 'Mark Absent.',
        validate: {
          payload: {
            absent_date: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.updateItem,
        description: 'Update Calendar Item.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/paid',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.markPaid,
        description: 'Mark Paid.',
        validate: {
          payload: {
            amount_paid: joi.number().required(),
            paid_on: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/present',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: CalendarServiceController.markPresent,
        description: 'Mark Present.',
        validate: {
          payload: {
            present_date: joi.string().required(),
          },
        },
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
  const dashboardRoutes = [];
  const productRoutes = [];
  const insightRoutes = [];
  const searchRoutes = [];
  const generalRoutes = [];
  const repairRoutes = [];
  const calendarRoutes = [];
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
  const repairController = new ProductItemController(modals);
  const calendarServiceController = new CalendarServiceController(modals);

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

  if (searchController) {
    searchRoutes.push({
      method: 'GET',
      path: '/search',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
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
    ...uploadFileRoute,
    ...dashboardRoutes,
    ...productRoutes,
    ...insightRoutes,
    ...searchRoutes,
    ...generalRoutes,
    ...repairRoutes,
    ...calendarRoutes,
  ]);
};
