/*jshint esversion: 6 */
'use strict';

import controller from '../api/controllers/shop_earn';
import joi from 'joi';

//Shop and earn routes
export function prepareShopEarnRoute(modal, route, middleware, socket) {

  const varController = new controller(modal, socket);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/sku/list',
      handler: controller.getSKUs,
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
      path: '/sku/sellers/{seller_id}/categories',
      handler: controller.getSellerCategories,
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
      path: '/sku/{bar_code}/item',
      handler: controller.getSKUItem,
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
      path: '/sku/{id}/detail',
      handler: controller.getSKUItem,
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
      path: '/sku/reference/data',
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
        handler: controller.getReferenceData,
      },
    });

    route.push({
      method: 'GET',
      path: '/sku/wishlist',
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
        handler: controller.getSKUWishList,
      },
    });

    route.push({
      method: 'DELETE',
      path: '/sku/wishlist',
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
        handler: controller.clearSKUWishList,
      },
    });

    route.push({
      method: 'POST',
      path: '/sku/wishlist',
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
        handler: controller.createSKUWishList,
        validate: {
          payload: {
            'id': [joi.number(), joi.allow(null)],
            'brand_id': [joi.number(), joi.allow(null)],
            'main_category_id': [joi.number(), joi.allow(null)],
            'category_id': [joi.number(), joi.allow(null)],
            'sub_category_id': [joi.number(), joi.allow(null)],
            'title': joi.string().required(),
            'hsn_code': [joi.string(), joi.allow(null)],
            'added_date': [joi.string(), joi.allow(null)],
            'mrp': [joi.number(), joi.allow(null)],
            'quantity': joi.number().required(),
            'created_at': [joi.string(), joi.allow(null)],
            'sku_measurement': [
              joi.object().keys({
                'id': [joi.number(), joi.allow(null)],
                'sku_id': [joi.number(), joi.allow(null)],
                'measurement_type': [joi.number(), joi.allow(null)],
                'measurement_value': [joi.number(), joi.allow(null)],
                'pack_numbers': [joi.number(), joi.allow(null)],
                'cashback_percent': [joi.number(), joi.allow(null)],
                'discount_percent': [joi.number(), joi.allow(null)],
                'bar_code': [joi.string(), joi.allow(null)],
                'mrp': [joi.number(), joi.allow(null)],
                'selected': [joi.number(), joi.allow(null)],
                'measurement_acronym': [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/sku/past',
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
        handler: controller.addToPastSelection,
        validate: {
          payload: {
            'id': [joi.number(), joi.allow(null)],
            'brand_id': [joi.number(), joi.allow(null)],
            'main_category_id': [joi.number(), joi.allow(null)],
            'category_id': [joi.number(), joi.allow(null)],
            'sub_category_id': [joi.number(), joi.allow(null)],
            'title': joi.string().required(),
            'hsn_code': [joi.string(), joi.allow(null)],
            'mrp': [joi.number(), joi.allow(null)],
            'quantity': joi.number().required(),
            'added_date': [joi.string(), joi.allow(null)],
            'sku_measurement': [
              joi.object().keys({
                'id': [joi.number(), joi.allow(null)],
                'sku_id': [joi.number(), joi.allow(null)],
                'measurement_type': [joi.number(), joi.allow(null)],
                'measurement_value': [joi.number(), joi.allow(null)],
                'pack_numbers': [joi.number(), joi.allow(null)],
                'cashback_percent': [joi.number(), joi.allow(null)],
                'discount_percent': [joi.number(), joi.allow(null)],
                'bar_code': [joi.string(), joi.allow(null)],
              }), joi.allow(null)],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/expenses/init',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.initializeUserExpenses,
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

    route.push({
      method: 'PUT',
      path: '/expenses/{product_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.updateExpenses,
        description: 'Update Expense.',
        validate: {
          payload: {
            value: [joi.number(), joi.allow(null)],
            taxes: [joi.number(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            document_number: [joi.string(), joi.allow(null)],
            document_date: joi.string().isoDate(),
            digitally_verified: [joi.boolean(), joi.allow(null)],
            home_delivered: [joi.boolean(), joi.allow(null)],
            is_complete: [joi.boolean(), joi.allow(null)],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/expenses/{product_id}/sku',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.updateExpenseSKUs,
        description: 'Update Expense SKU.',
        validate: {
          payload: {
            job_id: joi.number().required(),
            sku_items: joi.array().items(joi.object().keys({
              selling_price: [joi.number(), joi.allow(null)],
              quantity: joi.number().required(),
              sku_measurement_id: [joi.number(), joi.allow(null)],
              sku_id: joi.number().required(),
              cashback_job_id: [joi.number(), joi.allow(null)],
              seller_id: [joi.number(), joi.allow(null)],
              added_date: joi.string().required(),
            })).required(),
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/wallet/details',
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
        handler: controller.getWalletDetail,
      },
    });

    route.push({
      method: 'GET',
      path: '/cashback/details',
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
        handler: controller.getCashBackTransactions,
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/cashbacks/{id}/approve',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
        ],
        handler: controller.cashBackApproval,
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/cashbacks/{id}/reject',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
        ],
        validate: {
          payload: {
            reason_id: joi.number().required(),
          },
        },
        handler: controller.rejectCashBack,
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/cashbacks',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
        ],
        handler: controller.retrieveTransactions,
      },
    });
  }

  route.push({
    method: 'PUT',
    path: '/sellers/{seller_id}/redeem',
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
      handler: controller.redeemCashBackAtSeller,
      validate: {
        payload: {
          cashback_ids: joi.array().required(),
        },
      },
    },
  });

  route.push({
    method: 'PUT',
    path: '/sellers/{seller_id}/loyalty/redeem',
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
      handler: controller.redeemLoyaltyAtSeller,
      validate: {
        payload: {
          amount: joi.number().required(),
        },
      },
    },
  });

  route.push({
    method: 'PUT',
    path: '/cashback/redeem',
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
      handler: controller.redeemCashBackAtPayTM,
    },
  });

  route.push({
    method: 'PUT',
    path: '/sellers/{seller_id}/wallet/redeem',
    config: {
      auth: 'jwt',
      pre: [
        {
          method: middleware.checkAppVersion,
          assign: 'forceUpdate',
        },
      ],
      handler: controller.redeemSellerCashBackAtPayTM,
    },
  });

  route.push({
    method: 'GET',
    path: '/skus/{sku_id}/measurements',
    config: {
      auth: 'jwt',
      pre: [
        {
          method: middleware.checkAppVersion,
          assign: 'forceUpdate',
        }], handler: controller.retrieveSKUMeasurements,
    },
  });
}