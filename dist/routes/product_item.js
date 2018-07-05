'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareProductItemRoutes = prepareProductItemRoutes;

var _productItem = require('../api/controllers/productItem');

var _productItem2 = _interopRequireDefault(_productItem);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareProductItemRoutes(modal, routeObject, middleware) {
  //= ========================
  // Repair Routes
  //= ========================
  const controllerInit = new _productItem2.default(modal);
  if (controllerInit) {

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/repairs',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.deleteRepair,
        description: 'Delete Repair.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/insurances',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateInsurance,
        description: 'Add Insurance.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
            policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            amount_insured: [_joi2.default.number(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateInsurance,
        description: 'Update Insurance.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
            policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            amount_insured: [_joi2.default.number(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.deleteInsurance,
        description: 'Delete Insurance.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/amcs',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateAmc,
        description: 'Add AMC.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateAmc,
        description: 'Update AMC.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.deleteAMC,
        description: 'Delete AMC.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/pucs',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updatePUC,
        description: 'Add PUC.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updatePUC,
        description: 'Update PUC.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.deletePUC,
        description: 'Delete PUC.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/warranties',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateWarranty,
        description: 'Add Warranty.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            warranty_type: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.updateWarranty,
        description: 'Update Warranty.',
        validate: {
          payload: {
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
            warranty_type: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _productItem2.default.deleteWarranty,
        description: 'Delete AMC.'
      }
    });
  }
}