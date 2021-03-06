/*jshint esversion: 6 */
'use strict';

import controller from '../api/controllers/accessory';
import joi from 'joi';

//accessoryRoute
export function prepareAccessoryRoute(modal, route, middleware) {

  const varController = new controller(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/accessories/categories',
      handler: controller.getAccessoryCategories,
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
      },
    });

    route.push({
      method: 'GET',
      path: '/accessories',
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
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
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
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.createTransaction,
        validate: {
          payload: {
            'transaction_id': joi.string().required(),
            'status_type': [joi.number(), joi.allow(null)],
            'price': [joi.number(), joi.allow(null)],
            'quantity': [joi.number(), joi.allow(null)],
            'online_seller_id': joi.number().required(),
            'seller_detail': [
              joi.object().keys({
                'name': [joi.string(), joi.allow(null)],
                'address': joi.number(),
                'phone': joi.string(),
              }), joi.allow(null)],
            'delivery_address': [joi.string(), joi.allow(null)],
            'delivery_date': [joi.string(), joi.allow(null)],
            'product_id': joi.number().required(),
            'accessory_product_id': joi.number().required(),
            'payment_mode': [joi.number(), joi.allow(null)],
            'details_url': joi.string().required(),
          },
        },
      },
    });
  }
}