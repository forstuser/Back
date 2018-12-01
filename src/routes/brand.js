import ControllerObject from '../api/controllers/brand';

export function prepareBrandRoutes(modal, routeObject, middleware) {
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    // Get brands
    routeObject.push({
      method: 'GET',
      path: '/brands',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrands,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/{mode}/brands',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrands,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/brandcenter',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getBrandASC,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/brands/{offer_type}/offers',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'}],
        auth: 'jwt', handler: ControllerObject.retrieveBrandOffers,
        description: 'Get Brand offers available for sellers',
        tags: ['api', 'Seller', 'Offer', 'List'],
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
      path: '/sellers/{seller_id}/brands/{offer_type}/offers/{id}',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'}],
        auth: 'jwt', handler: ControllerObject.addBrandOfferToSeller,
        description: 'Add Brand Offers to Seller.',
        tags: ['api', 'Seller', 'Brand', 'Offer', 'List'],
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
      path: '/sellers/{seller_id}/brands/{offer_type}/offers/{id}',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'}],
        auth: 'jwt', handler: ControllerObject.unLinkBrandOfferFromSeller,
        description: 'Un Select Offers from Seller.',
        tags: ['api', 'Seller', 'Brand', 'Offer', 'List'],
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
      path: '/sellers/{seller_id}/brands/{offer_type}/offers/{id}/request',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'}],
        auth: 'jwt', handler: ControllerObject.brandOfferSellerRequest,
        description: 'Creating request for brand offer from seller.',
        tags: ['api', 'Seller', 'Brand', 'Offer', 'List'],
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
  }
}