import ControllerObject from '../api/controllers/order';
import joi from 'joi';

export function prepareOrderRoutes(modal, routeObject, middleware, socket) {
  const controllerInit = new ControllerObject(modal, socket);
  if (controllerInit) {

    /*Retrieve Seller Order by id*/
    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.getOrderDetails,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.getOrderList,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders/active',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.getActiveOrders,
      },
    });

    /*Retrieve Consumer Order by id*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/orders/{id}',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getOrderDetails,
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.approveOrder,
        description: 'Approved order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/reject',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.rejectOrderFromConsumer,
        description: 'Reject order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/cancel',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.cancelOrderFromConsumer,
        description: 'Cancel order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/orders',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getOrderList,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/orders/active',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.getActiveOrders,
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/orders/place',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.placeOrder,
        description: 'Place order on behalf of User.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
            order_type: joi.number().required(),
            user_address_id: [joi.number(), joi.allow(null)],
            user_address: [
              joi.object({
                address_line_1: [joi.string(), joi.allow(null)],
                address_line_2: [joi.string(), joi.allow(null)],
                id: [joi.number(), joi.allow(null)],
                city_id: [joi.number(), joi.allow(null)],
                state_id: [joi.number(), joi.allow(null)],
                locality_id: [joi.number(), joi.allow(null)],
                address_type: [joi.number(), joi.allow(null)],
                pin: [joi.string(), joi.allow(null)],
                latitude: [joi.number(), joi.allow(null)],
                longitude: [joi.number(), joi.allow(null)],
                output: 'data',
                parse: true,
              }), joi.allow(null)],
            service_type_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/modify',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.modifyOrder,
        description: 'Modify order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.approveOrder,
        description: 'Approved order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/reject',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.rejectOrderFromSeller,
        description: 'Reject order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/outfordelivery',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        handler: ControllerObject.orderOutForDelivery,
        description: 'Approved order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            delivery_user_id: joi.number().required(),
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });
  }
}