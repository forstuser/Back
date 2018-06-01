import ControllerObject from '../api/controllers/general';
import joi from 'joi';

export function prepareGeneralRoutes(modal, routeObject, middleware) {
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    routeObject.push({
      method : 'GET',
      path : '/version/detail',
      config : {
        handler : ControllerObject.checkForAppUpdate,
        description : 'Get app latest version details',
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/contact-us',
      config: {
        handler: ControllerObject.contactUs,
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

    routeObject.push({
      method: 'GET',
      path: '/faqs',
      config: {
        handler: ControllerObject.retrieveFAQs,
        description: 'Retrieve FAQ\'s',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/tips',
      config: {
        handler: ControllerObject.retrieveTips,
        description: 'Retrieve tip\'s',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/know/items',
      config: {
        handler: ControllerObject.retrieveKnowItemUnAuthorized,
        description: 'Retrieve Do You Know Items',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/know/items/{id}',
      config: {
        handler: ControllerObject.retrieveKnowItemsById,
        description: 'Retrieve Do You Know Items',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/know/items',
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
        ],
        handler: ControllerObject.retrieveKnowItems,
        description: 'Retrieve Do You Know Items',
        validate: {
          payload: {
            tag_id: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/tags',
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
        ],
        handler: ControllerObject.retrieveTags,
        description: 'Retrieve Tags for Do You Know Items',
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/know/items/{id}',
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
        ],
        handler: ControllerObject.likeKnowItems,
        description: 'Update Like of Know Items for user',
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/know/items/{id}',
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
        ],
        handler: ControllerObject.disLikeKnowItems,
        description: 'Update Like of Know Items for user',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/referencedata',
      config: {
        handler: ControllerObject.retrieveReferenceData,
        description: 'Retrieve Reference data',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/repairs/products',
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
        ],
        handler: ControllerObject.retrieveRepairableProducts,
        description: 'Retrieve Repairable Products',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/products/init',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.initializeUserProduct,
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

    routeObject.push({
      method: 'PUT',
      path: '/service/centers/accessed',
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
        ],
        handler: ControllerObject.serviceCenterAccessed,
        description: 'Update user service center accessed.',
      },
    });
  }
}