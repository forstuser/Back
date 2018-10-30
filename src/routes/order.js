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
          {method: middleware.logSellerAction, assign: 'seller_action'},
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.getActiveOrders,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/assisted/past',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.getAssistedServiceList,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/assisted/active',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.getActiveAssistedServices,
      },
    });

    /*Retrieve Consumer Order by id*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/orders/{id}',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.getOrderDetails,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/orders',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.getActiveOrders,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/assisted/past',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.getAssistedServiceList,
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/assisted/active',
      config: {
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.getActiveAssistedServices,
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
      path: '/consumer/assisted/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
      path: '/consumer/assisted/{order_id}/start',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.startOrder,
        description: 'Start order on behalf of Consumer.',
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
      path: '/consumer/assisted/{order_id}/end',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.endOrder,
        description: 'End order on behalf of Consumer.',
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
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
      method: 'PUT',
      path: '/consumer/orders/{order_id}/reorder',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.reOrderOrderFromConsumer,
        description: 'Re-order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/paid',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.completeOrder,
        description: 'Complete order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
            payment_mode: [joi.number(), joi.allow(null)]
          },
        },
      },
    });


    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/delete/{sku_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        handler: ControllerObject.deleteSKUFromOrderDetail,
        description: 'Delete SKU Item on behalf of Consumer from order.',
        validate: {
          payload: {
            seller_id: joi.number().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/orders/place',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
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
            service_name: [joi.string(), joi.allow(null)],
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.modifyOrder,
        description: 'Modify order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            delivery_user_id: [joi.number(), joi.allow(null)],
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/assisted/{order_id}/modify',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.modifyOrder,
        description: 'Modify order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            delivery_user_id: [joi.number(), joi.allow(null)],
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
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
          {method: middleware.logSellerAction, assign: 'seller_action'},
        ],
        handler: ControllerObject.orderOutForDelivery,
        description: 'Approved order on behalf of Seller.',
        validate: {
          payload: {
            user_id: joi.number().required(),
            delivery_user_id: [joi.number(), joi.allow(null)],
            total_amount: [joi.number(), joi.allow(null)],
            order_details: [joi.array().items(joi.object()), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/payments/signature',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {method: middleware.updateUserActiveStatus, assign: 'userExist'},
        ],
        validate: {
          payload: {
            appId: joi.string().required(),
            orderId: joi.string().required(),
            orderAmount: joi.string().required(),
            orderCurrency: [joi.string(), joi.allow(null)],
            orderNote: [joi.string(), joi.allow(null)],
            customerName: joi.string().required(),
            customerPhone: joi.string().required(),
            customerEmail: joi.string().required(),
            returnUrl: [joi.string(), joi.allow(null)],
            notifyUrl: [joi.string(), joi.allow(null)],
            paymentModes: [joi.string(), joi.allow(null)],
            pc: [joi.string(), joi.allow(null)],
          },
        },
        handler: ControllerObject.generateSignature,
        description: 'Generate Signature for Consumer Payment Using Cash Free.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/payments',
      config: {
        handler: ControllerObject.paymentPostBackUrl,
        description: 'Payment STATUS POST BACK URL for Cash Free.',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/payments/{order_id}',
      config: {
        handler: ControllerObject.retrievePaymentStatus,
        description: 'Retrieve Payment Status.',
      },
    });
  }
}