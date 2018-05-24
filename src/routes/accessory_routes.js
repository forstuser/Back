/*jshint esversion: 6 */
'use strict';
import joi from 'joi';

//accessoryRoute
export function prepareAccessoryRoute(
    varController, controller, route, appVersionHelper) {

  if (varController) {

    route.push({
      method: 'GET',
      path: '/accessories',
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
        handler: controller.getAccessories,
      },
    });

    route.push({
      method: 'GET',
      path: '/order/history',
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
        handler: controller.getOrderHistory,
      },
    });

    route.push({
      method: 'POST',
      path: '/order',
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
        handler: controller.createTransaction,
        validate: {
          payload: {
            'transaction_id': joi.string().required(),
            'status_type': joi.number().required(),
            'price': joi.number().required(),
            'quantity': joi.number().required(),
            'online_seller_id': joi.number().required(),
            'seller_detail': joi.array().items(joi.object().keys({
              'name': [joi.string(), joi.allow(null)],
              'address': joi.number().required(),
              'phone': joi.string().required(),
            })),
            'delivery_address': joi.string().required(),
            'delivery_date': joi.string().required(),
            'product_id': joi.string().required(),
            'accessory_product_id': joi.string().required(),
            'payment_mode': joi.number().required(),
            'details_url': joi.string().required(),
          },
        },
      },
    });
  }
}