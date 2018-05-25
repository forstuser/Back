/*jshint esversion: 6 */
'use strict';

import controller from '../api/controllers/accessory';

//accessoryRoute
export function prepareAccessoryRoute(modal, route, middleware) {

  const varController = new controller(modal);

  if (varController) {

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

    // route.push({
    //   method: 'POST',
    //   path: '/order',
    //   config: {
    //     auth: 'jwt',
    //     pre: [
    //       {
    //         method: middleware.checkAppVersion,
    //         assign: 'forceUpdate',
    //       },
    //       {
    //         method: middleware.updateUserActiveStatus,
    //         assign: 'userExist',
    //       },
    //     ],
    //     handler: controller.getaccessoryDetails,
    //     validation : {
    //       // add all the validation parameters here
    //       // amazon/flipkart product id
    //       // order id
    //       // quantity
    //       // if no product then add a product also
    //     }
    //   },
    // });

  }
}