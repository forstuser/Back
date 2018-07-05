import ControllerObject from '../api/controllers/product';
import joi from 'joi';

export function prepareProductRoutes(modal, routeObject, middleware) {
  //= ========================
  // Product Routes
  //= ========================

  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'PUT',
      path: '/{reviewfor}/{id}/reviews',
      config: {
        handler: ControllerObject.updateUserReview,
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
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

    routeObject.push({
      method: 'GET',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveProductDetail,
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

    routeObject.push({
      method: 'GET',
      path: '/center/products',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveCenterProducts,
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

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateProduct,
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
            ref_id: [joi.number(), joi.allow(null)],
            accessory_part_id: [joi.number(), joi.allow(null)],
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

    routeObject.push({
      method: 'POST',
      path: '/products/{ref_id}/accessories',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateAccessoryProduct,
        description: 'Create Accessory Product.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            accessory_part_name: [joi.string(), joi.allow(null)],
            job_id: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            sub_category_id: [joi.number(), joi.allow(null)],
            brand_id: [joi.number(), joi.allow(null)],
            accessory_part_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_email: [joi.string(), joi.allow(null)],
            seller_address: [joi.string(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            warranty: joi.object().keys({
              id: [joi.number(), joi.allow(null)],
              renewal_type: [joi.number(), joi.allow(null)],
              effective_date: [joi.string(), joi.allow(null)],
            }).allow(null),
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{ref_id}/accessories/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateAccessoryProduct,
        description: 'Update Accessory Product.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            accessory_part_name: [joi.string(), joi.allow(null)],
            job_id: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            sub_category_id: [joi.number(), joi.allow(null)],
            brand_id: [joi.number(), joi.allow(null)],
            accessory_part_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_email: [joi.string(), joi.allow(null)],
            seller_address: [joi.string(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            warranty: joi.object().keys({
              id: [joi.number(), joi.allow(null)],
              renewal_type: [joi.number(), joi.allow(null)],
              effective_date: [joi.string(), joi.allow(null)],
            }).allow(null),
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}',
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
        handler: ControllerObject.deleteProduct,
        description: 'Delete Product.',
      },
    });
  }
}