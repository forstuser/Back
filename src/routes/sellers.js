/*jshint esversion: 6 */
'use strict';

import controller from '../api/controllers/sellers';
import joi from 'joi';

//Shop and earn routes
export function prepareSellerRoutes(modal, route, middleware) {

  const varController = new controller(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/mysellers',
      handler: controller.getMySellers,
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
      path: '/sellers',
      handler: controller.getSellers,
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
      path: '/sellers/{sid}',
      handler: controller.getSellerById,
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
      method: 'DELETE',
      path: '/sellers/{id}/link',
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
        handler: controller.unLinkSellerWithUser,
        description: 'UnLink Seller with User.',
      },
    });
    route.push({
      method: 'PUT',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.linkSellerWithUser,
        description: 'Link Seller with User.',
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/invite',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.addInviteSeller,
        description: 'Add Seller to database and invite him on be half of User.',
        validate: {
          payload: {
            seller_name: [joi.string(), joi.allow(null)],
            contact_no: joi.string().required(),
            email: [joi.string(), joi.allow(null)],
            address: [joi.string(), joi.allow(null)],
            city_id: [joi.number(), joi.allow(null)],
            state_id: [joi.number(), joi.allow(null)],
            location_id: [joi.number(), joi.allow(null)],
            gstin: [joi.string(), joi.allow(null)],
            pan_no: [joi.string(), joi.allow(null)],
            reg_no: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
          },
        },
      },
    });
  }
}