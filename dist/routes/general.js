'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareGeneralRoutes = prepareGeneralRoutes;

var _general = require('../api/controllers/general');

var _general2 = _interopRequireDefault(_general);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareGeneralRoutes(modal, routeObject, middleware) {
  const controllerInit = new _general2.default(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'GET',
      path: '/version/detail',
      config: {
        handler: _general2.default.checkForAppUpdate,
        description: 'Get app latest version details'
      }
    });

    routeObject.push({
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

    routeObject.push({
      method: 'GET',
      path: '/faqs',
      config: {
        handler: _general2.default.retrieveFAQs,
        description: 'Retrieve FAQ\'s'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/tips',
      config: {
        handler: _general2.default.retrieveTips,
        description: 'Retrieve tip\'s'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/know/items',
      config: {
        handler: _general2.default.retrieveKnowItemUnAuthorized,
        description: 'Retrieve Do You Know Items'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/know/items/{id}',
      config: {
        handler: _general2.default.retrieveKnowItemsById,
        description: 'Retrieve Do You Know Items'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/know/items',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
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

    routeObject.push({
      method: 'GET',
      path: '/tags',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _general2.default.retrieveTags,
        description: 'Retrieve Tags for Do You Know Items'
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/know/items/{id}',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _general2.default.likeKnowItems,
        description: 'Update Like of Know Items for user'
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/know/items/{id}',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _general2.default.disLikeKnowItems,
        description: 'Update Like of Know Items for user'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/referencedata',
      config: {
        handler: _general2.default.retrieveReferenceData,
        description: 'Retrieve Reference data'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/repairs/products',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _general2.default.retrieveRepairableProducts,
        description: 'Retrieve Repairable Products'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/init',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
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

    routeObject.push({
      method: 'PUT',
      path: '/service/centers/accessed',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _general2.default.serviceCenterAccessed,
        description: 'Update user service center accessed.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/ses-bounce',
      config: {
        handler: _general2.default.sesBounceHandler,
        description: 'Handling Bounces from SES.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/ses-complaints',
      config: {
        handler: _general2.default.sesComplaintHandler,
        description: 'Handling Complaints from SES.'
      }
    });
  }
}