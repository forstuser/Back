'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _insurances = require('../Adaptors/insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _amcs = require('../Adaptors/amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _pucs = require('../Adaptors/pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _reg_certificates = require('../Adaptors/reg_certificates');

var _reg_certificates2 = _interopRequireDefault(_reg_certificates);

var _warranties = require('../Adaptors/warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('../Adaptors/repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _category = require('../Adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _refueling = require('../Adaptors/refueling');

var _refueling2 = _interopRequireDefault(_refueling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let repairAdaptor;
let sellerAdaptor;
let insuranceAdaptor;
let amcAdaptor;
let pucAdaptor;
let warrantyAdaptor;
let categoryAdaptor;
let productAdaptor;
let jobAdaptor;
let modals;
let regCertificateAdaptor;
let fuelAdaptor;

class ProductItemController {
  constructor(modal, socket) {
    modals = modal;
    repairAdaptor = new _repairs2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
    insuranceAdaptor = new _insurances2.default(modal);
    amcAdaptor = new _amcs2.default(modal);
    pucAdaptor = new _pucs2.default(modal);
    warrantyAdaptor = new _warranties2.default(modal);
    categoryAdaptor = new _category2.default(modal);
    productAdaptor = new _product2.default(modal);
    jobAdaptor = new _job2.default(modal, socket);
    regCertificateAdaptor = new _reg_certificates2.default(modal);
    fuelAdaptor = new _refueling2.default(modals);
  }

  static async updateRepair(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const sellerPromise = !request.payload.seller_id && (request.payload.seller_contact || request.payload.seller_name) ? sellerAdaptor.retrieveOrCreateSellers({
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact
        }, {
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact,
          updated_by: user.id || user.ID,
          created_by: user.id || user.ID,
          address: request.payload.seller_address,
          status_type: 11
        }) : '';
        const sellerList = await Promise.all([sellerPromise]);
        const product_id = parseInt(request.params.id);
        const repairId = parseInt(request.params.repairId);
        const newSellerId = sellerList[0] ? sellerList[0].id : undefined;
        const document_date = request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day') : '';

        const values = {
          updated_by: user.id || user.ID,
          status_type: 11,
          product_id,
          seller_id: request.payload.seller_id || newSellerId,
          document_date: document_date ? _moment2.default.utc(document_date).format('YYYY-MM-DD') : document_date === '' && repairId ? undefined : _moment2.default.utc().format('YYYY-MM-DD'),
          repair_for: request.payload.repair_for || undefined,
          repair_cost: request.payload.value || undefined,
          warranty_upto: request.payload.warranty_upto || undefined,
          user_id: user.id || user.ID,
          job_id: request.payload.job_id || undefined
        };
        const repair = repairId ? await repairAdaptor.updateRepairs(repairId, JSON.parse(JSON.stringify(values))) : await repairAdaptor.createRepairs(values);
        if (repair) {
          return reply.response({
            status: true,
            message: 'successfull',
            repair,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'Repair already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create warranty',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteRepair(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await repairAdaptor.deleteRepair(request.params.repairId, user.id || user.ID);
        return reply.response({
          status: true
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete repair',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateInsurance(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        console.log(JSON.stringify({ payload: request.payload }));
        const providerPromise = request.payload.provider_name ? insuranceAdaptor.findCreateInsuranceBrand({
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          type: 1,
          status_type: 11,
          updated_by: user.id || user.ID,
          name: request.payload.provider_name
        }) : undefined;
        const [provider, renewalTypes] = await Promise.all([providerPromise, categoryAdaptor.retrieveRenewalTypes({
          status_type: 1
        })]);
        const product_id = parseInt(request.params.id);
        const insuranceId = parseInt(request.params.insuranceId);
        const providerId = provider ? provider.id : undefined;
        let insuranceRenewalType = renewalTypes.find(item => item.type === 8);
        if (request.payload.renewal_type) {
          insuranceRenewalType = renewalTypes.find(item => item.type === request.payload.renewal_type);
        }
        const productResult = await productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11] });
        const currentItem = productResult ? productResult.insuranceDetails.find(item => item.id === parseInt(insuranceId)) : undefined;
        const insuranceEffectiveDate = productResult ? productResult.insuranceDetails && productResult.insuranceDetails.length > 0 ? currentItem ? _moment2.default.utc(currentItem.effectiveDate, _moment2.default.ISO_8601) : _moment2.default.utc(productResult.insuranceDetails[0].expiryDate, _moment2.default.ISO_8601).add(1, 'days') : productResult.purchaseDate : undefined;
        let effective_date = insuranceEffectiveDate ? request.payload.effective_date || insuranceEffectiveDate : _moment2.default.utc();
        effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
        const expiry_date = insuranceRenewalType ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).add(insuranceRenewalType.effective_months, 'months').subtract(1, 'day').endOf('days') : undefined;
        const insuranceBody = {
          renewal_type: request.payload.renewal_type || 8,
          updated_by: user.id || user.ID,
          job_id: request.payload.job_id || productResult.jobId,
          status_type: 11,
          product_id,
          expiry_date: effective_date && expiry_date ? _moment2.default.utc(expiry_date).format('YYYY-MM-DD') : undefined,
          effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          document_number: request.payload.policy_no,
          provider_id: providerId || request.payload.provider_id,
          amount_insured: request.payload.amount_insured,
          renewal_cost: request.payload.value,
          user_id: user.id || user.ID
        };
        const insurance = insuranceId ? await insuranceAdaptor.updateInsurances(insuranceId, insuranceBody) : await insuranceAdaptor.createInsurances(insuranceBody);

        if (insurance) {
          return reply.response({
            status: true,
            message: 'successful',
            insurance,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'Insurance already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create insurance',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteInsurance(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await insuranceAdaptor.deleteInsurance(request.params.insuranceId, user.id || user.ID);
        return reply.response({
          status: true
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete insurance.',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateAmc(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const sellerPromise = !request.payload.seller_id && (request.payload.seller_contact || request.payload.seller_name) ? sellerAdaptor.retrieveOrCreateSellers({
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact
        }, {
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact,
          updated_by: user.id || user.ID,
          created_by: user.id || user.ID,
          address: request.payload.seller_address,
          status_type: 11
        }) : '';
        const product_id = parseInt(request.params.id);
        const amcId = parseInt(request.params.amcId);
        const [sellerList] = await Promise.all([sellerPromise]);

        const productResult = await productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11] });
        const currentItem = productResult ? productResult.amcDetails.find(item => item.id === parseInt(amcId)) : undefined;
        const amcEffectiveDate = productResult ? currentItem ? _moment2.default.utc(currentItem.effectiveDate, _moment2.default.ISO_8601) : productResult.amcDetails && productResult.amcDetails.length > 0 ? _moment2.default.utc(productResult.amcDetails[0].expiryDate, _moment2.default.ISO_8601).add(1, 'days') : productResult.purchaseDate : undefined;
        let effective_date = amcEffectiveDate ? request.payload.effective_date || amcEffectiveDate : _moment2.default.utc();
        effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
        const expiry_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).add(12, 'months').subtract(1, 'day').endOf('days').format('YYYY-MM-DD');

        const values = {
          renewal_type: 8, updated_by: user.id || user.ID,
          status_type: 11, product_id,
          job_id: request.payload.job_id || productResult.jobId,
          renewal_cost: request.payload.value,
          seller_id: sellerList ? sellerList.id : request.payload.seller_id,
          expiry_date: effective_date ? _moment2.default.utc(expiry_date).format('YYYY-MM-DD') : undefined,
          effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          user_id: user.id || user.ID
        };
        const amc = amcId ? await amcAdaptor.updateAMCs(amcId, values) : await amcAdaptor.createAMCs(values);

        if (amc) {
          return reply.response({
            status: true,
            message: 'successful',
            amc,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'AMC already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create AMC',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteAMC(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await amcAdaptor.deleteAMC(request.params.amcId, user.id || user.ID);
        return reply.response({
          status: true
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete amc',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updatePUC(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const sellerPromise = !request.payload.seller_id && (request.payload.seller_contact || request.payload.seller_name) ? sellerAdaptor.retrieveOrCreateSellers({
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact
        }, {
          seller_name: request.payload.seller_name,
          contact_no: request.payload.seller_contact,
          updated_by: user.id || user.ID,
          created_by: user.id || user.ID,
          address: request.payload.seller_address,
          status_type: 11
        }) : '';
        const product_id = parseInt(request.params.id);
        const pucId = parseInt(request.params.pucId);
        const [sellerList] = await Promise.all([sellerPromise]);
        const productResult = await productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11] });
        const currentItem = productResult ? productResult.pucDetails.find(pucItem => pucItem.id === parseInt(pucId)) : undefined;
        const pucEffectiveDate = productResult ? currentItem ? _moment2.default.utc(currentItem.effectiveDate, _moment2.default.ISO_8601) : productResult.pucDetails && productResult.pucDetails.length > 0 ? _moment2.default.utc(productResult.pucDetails[0].expiryDate, _moment2.default.ISO_8601).add(1, 'days') : productResult.purchaseDate : undefined;
        let effective_date = pucEffectiveDate ? request.payload.effective_date || pucEffectiveDate : _moment2.default.utc();
        effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
        const expiry_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).add(request.payload.expiry_period || 6, 'months').subtract(1, 'day').endOf('days').format('YYYY-MM-DD');
        const values = {
          renewal_type: request.payload.expiry_period || 6,
          updated_by: user.id || user.ID,
          status_type: 11,
          renewal_cost: request.payload.value,
          product_id,
          job_id: request.payload.job_id || productResult.jobId,
          seller_id: sellerList ? sellerList.id : request.payload.seller_id,
          expiry_date: effective_date ? _moment2.default.utc(expiry_date).format('YYYY-MM-DD') : undefined,
          effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          user_id: user.id || user.ID
        };
        const pucPromise = pucId ? pucAdaptor.updatePUCs(pucId, values) : pucAdaptor.createPUCs(values);
        const result = await pucPromise;
        if (result) {
          return reply.response({
            status: true,
            message: 'successful',
            puc: result,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'PUC already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create PUC',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deletePUC(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await pucAdaptor.deletePUCs(request.params.pucId, user.id || user.ID);
        return reply.response({
          status: true
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete PUC',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateWarranty(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const providerPromise = request.payload.provider_name ? insuranceAdaptor.findCreateInsuranceBrand({
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          type: 1,
          status_type: 11,
          updated_by: user.id || user.ID,
          name: request.payload.provider_name
        }) : undefined;
        const product_id = parseInt(request.params.id);
        const warrantyId = parseInt(request.params.warrantyId);
        let warrantyRenewalType;
        let expiry_date;
        let [provider, renewal_types] = await Promise.all([providerPromise, categoryAdaptor.retrieveRenewalTypes({
          status_type: 1
        })]);
        warrantyRenewalType = renewal_types.find(item => item.type === request.payload.renewal_type);
        const productResult = await productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11] });
        const warrantyDetails = productResult ? productResult.warrantyDetails.filter(warrantyItem => request.payload.warranty_type === 3 ? warrantyItem.warranty_type === 3 : warrantyItem.warranty_type === 1 || warrantyItem.warranty_type === 2) : [];

        const currentItem = warrantyDetails.find(warrantyDetail => warrantyDetail.id === parseInt(warrantyId));

        const warrantyEffectiveDate = currentItem ? _moment2.default.utc(currentItem.effectiveDate, _moment2.default.ISO_8601) : warrantyDetails.length > 0 ? _moment2.default.utc(warrantyDetails[0].expiryDate, _moment2.default.ISO_8601).add(1, 'days') : productResult.purchaseDate;
        let effective_date = warrantyEffectiveDate ? request.payload.effective_date || warrantyEffectiveDate : _moment2.default.utc();
        effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
        expiry_date = warrantyRenewalType ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).add(warrantyRenewalType.effective_months, 'months').subtract(1, 'day').endOf('days') : undefined;

        const values = {
          renewal_type: request.payload.renewal_type,
          renewal_cost: request.payload.value,
          updated_by: user.id || user.ID,
          status_type: warrantyRenewalType ? 11 : 8,
          job_id: request.payload.job_id || productResult.jobId,
          product_id,
          expiry_date: effective_date && expiry_date ? _moment2.default.utc(expiry_date).format('YYYY-MM-DD') : undefined,
          effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : _moment2.default.utc().format('YYYY-MM-DD'),
          provider_id: provider ? provider.id : request.payload.provider_id,
          warranty_type: request.payload.warranty_type,
          user_id: user.id || user.ID
        };
        const warrantyItemPromise = warrantyId ? warrantyAdaptor.updateWarranties(warrantyId, values) : warrantyAdaptor.createWarranties(values);
        const result = await warrantyItemPromise;
        if (result) {
          return reply.response({
            status: true,
            message: 'successful',
            warranty: result,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'Warranty already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create warranty',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteWarranty(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await warrantyAdaptor.deleteWarranties(request.params.warrantyId, user.id || user.ID);
        return reply.response({
          status: true
        });
      }
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete warranty',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateRC(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false, message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false, message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        let { renewal_type, effective_date, expiry_date, state_id, job_id, value, document_number } = request.payload;
        const product_id = parseInt(request.params.id);
        const rc_id = parseInt(request.params.rc_id);
        let [productResult, renewal_detail] = await Promise.all([productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11], main_category_id: 3 }), renewal_type ? modals.renewalTypes.findOne({ where: { type: renewal_type } }) : { type: 15, effective_months: 180 }]);
        if (productResult) {
          renewal_detail = renewal_type ? renewal_detail.toJSON() : renewal_detail;
          const currentItem = productResult ? productResult.rc_details.find(item => item.id === parseInt(rc_id)) : undefined;
          const rcEffectiveDate = productResult ? currentItem ? _moment2.default.utc(currentItem.effectiveDate, _moment2.default.ISO_8601) : productResult.rc_details && productResult.rc_details.length > 0 ? _moment2.default.utc(productResult.rc_details[0].expiryDate, _moment2.default.ISO_8601).add(1, 'days') : productResult.purchaseDate : undefined;
          effective_date = rcEffectiveDate ? effective_date || rcEffectiveDate : _moment2.default.utc();
          effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
          expiry_date = expiry_date || _moment2.default.utc(effective_date, _moment2.default.ISO_8601).add(renewal_detail.effective_months, 'months').subtract(1, 'day').endOf('days').format('YYYY-MM-DD');

          const values = {
            renewal_type: renewal_detail.type,
            updated_by: user.id || user.ID,
            status_type: 11, product_id, state_id,
            job_id: job_id || productResult.jobId, renewal_cost: value,
            expiry_date: expiry_date ? _moment2.default.utc(expiry_date).format('YYYY-MM-DD') : undefined,
            document_number, user_id: user.id || user.ID,
            effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
            document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined
          };
          const rc = rc_id ? await regCertificateAdaptor.updateRegCerts(rc_id, values) : await regCertificateAdaptor.createRegCerts(values);

          return rc ? reply.response({
            status: true, message: 'successful', rc,
            forceUpdate: request.pre.forceUpdate
          }) : reply.response({
            status: false,
            message: 'RC already exist.',
            forceUpdate: request.pre.forceUpdate
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid product or product does not exist.',
          forceUpdate: request.pre.forceUpdate
        });
      }

      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create RC',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteRC(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await regCertificateAdaptor.deleteRefueling(request.params.rc_id, user.id || user.ID);
        return reply.response({
          status: true
        });
      }

      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete amc',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateRefueling(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false, message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false, message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        let { effective_date, job_id, value, document_number, fuel_quantity, fuel_type, odometer_reading } = request.payload;
        const product_id = parseInt(request.params.id);
        const fuel_id = parseInt(request.params.fuel_id);
        let productResult = await productAdaptor.retrieveProductById(product_id, { status_type: [5, 8, 11], main_category_id: 3 });
        if (productResult) {
          const prevFuel = productResult.fuel_details.find(item => item.odometer_reading > odometer_reading && _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isAfter(_moment2.default.utc(item.document_date, _moment2.default.ISO_8601), 'day'));
          if (!prevFuel) {
            effective_date = effective_date || _moment2.default.utc();
            effective_date = _moment2.default.utc(effective_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(effective_date, _moment2.default.ISO_8601).startOf('day') : _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
            const values = {
              fuel_quantity, fuel_type, odometer_reading, product_id,
              updated_by: user.id || user.ID, status_type: 11,
              job_id: job_id || productResult.jobId, purchase_cost: value,
              document_number, user_id: user.id || user.ID,
              effective_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined,
              document_date: effective_date ? _moment2.default.utc(effective_date).format('YYYY-MM-DD') : undefined
            };
            const fuel_detail = fuel_id ? await fuelAdaptor.updateRefuelings(fuel_id, values) : await fuelAdaptor.createRefuelings(values);

            return fuel_detail ? reply.response({
              status: true, message: 'successful', fuel_detail,
              forceUpdate: request.pre.forceUpdate
            }) : reply.response({
              status: false,
              message: 'Fuel Detail already exist.',
              forceUpdate: request.pre.forceUpdate
            });
          }

          return reply.response({
            status: false,
            message: `Odometer reading can't be less than the previous one.`,
            forceUpdate: request.pre.forceUpdate
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid product or product does not exist.',
          forceUpdate: request.pre.forceUpdate
        });
      }

      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {

      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to create/update fuel',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async deleteRefueling(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await fuelAdaptor.deleteRefueling(request.params.fuel_id, user.id || user.ID);
        return reply.response({
          status: true
        });
      }

      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_details ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete fuel detail',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }
}

exports.default = ProductItemController;