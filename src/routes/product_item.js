import ControllerObject from '../api/controllers/productItem';
import joi from 'joi';

export function prepareProductItemRoutes(modal, routeObject, middleware) {
  //= ========================
  // Repair Routes
  //= ========================
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/repairs',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            repair_for: [joi.string(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_address: [joi.string(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            warranty_upto: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateRepair,
        description: 'Update Repair.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            document_date: [joi.string(), joi.allow(null)],
            repair_for: [joi.string(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
            seller_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            warranty_upto: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/repairs/{repairId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteRepair,
        description: 'Delete Repair.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/insurances',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateInsurance,
        description: 'Add Insurance.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            policy_no: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            amount_insured: [joi.number(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateInsurance,
        description: 'Update Insurance.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            policy_no: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            amount_insured: [joi.number(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/insurances/{insuranceId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteInsurance,
        description: 'Delete Insurance.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/amcs',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateAmc,
        description: 'Add AMC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateAmc,
        description: 'Update AMC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/amcs/{amcId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteAMC,
        description: 'Delete AMC.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/pucs',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updatePUC,
        description: 'Add PUC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updatePUC,
        description: 'Update PUC.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            expiry_period: [joi.number(), joi.allow(null)],
            seller_name: [joi.string(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
            seller_contact: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/pucs/{pucId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deletePUC,
        description: 'Delete PUC.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{id}/warranties',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateWarranty,
        description: 'Add Warranty.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            warranty_type: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateWarranty,
        description: 'Update Warranty.',
        validate: {
          payload: {
            job_id: [joi.number(), joi.allow(null)],
            provider_id: [joi.number(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            renewal_type: [joi.number(), joi.allow(null)],
            effective_date: [joi.string(), joi.allow(null)],
            warranty_type: [joi.number(), joi.allow(null)],
            main_category_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            value: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}/warranties/{warrantyId}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteWarranty,
        description: 'Delete AMC.',
      },
    });
  }
}