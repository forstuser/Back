'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var _warranties = require('../Adaptors/warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('../Adaptors/repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _category = require('../Adaptors/category');

var _category2 = _interopRequireDefault(_category);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var repairAdaptor = void 0;
var sellerAdaptor = void 0;
var insuranceAdaptor = void 0;
var amcAdaptor = void 0;
var pucAdaptor = void 0;
var warrantyAdaptor = void 0;
var categoryAdaptor = void 0;

var ProductItemController = function () {
  function ProductItemController(modal) {
    _classCallCheck(this, ProductItemController);

    repairAdaptor = new _repairs2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
    insuranceAdaptor = new _insurances2.default(modal);
    amcAdaptor = new _amcs2.default(modal);
    pucAdaptor = new _pucs2.default(modal);
    warrantyAdaptor = new _warranties2.default(modal);
    categoryAdaptor = new _category2.default(modal);
  }

  _createClass(ProductItemController, null, [{
    key: 'updateRepair',
    value: function updateRepair(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var sellerPromise = !request.payload.seller_id && (request.payload.seller_contact || request.payload.seller_name) ? sellerAdaptor.retrieveOrCreateOfflineSellers({
          contact_no: request.payload.seller_contact
        }, {
          seller_name: request.payload.seller_name,
          contact_no: request.payload.contact_no,
          updated_by: user.id || user.ID,
          created_by: user.id || user.ID,
          address: request.payload.seller_address,
          status_type: 11
        }) : '';
        return sellerPromise.then(function(sellerList) {
          var productId = request.params.id;
          var repairId = request.params.repairId;
          var newSellerId = sellerList ? sellerList.sid : undefined;
          var document_date = _moment2.default.utc(
              request.payload.document_date, _moment2.default.ISO_8601).
              isValid() ?
              _moment2.default.utc(request.payload.document_date,
                  _moment2.default.ISO_8601).startOf('day') :
              _moment2.default.utc(request.payload.document_date, 'DD MMM YY').
                  startOf('day');
          var values = {
            updated_by: user.id || user.ID,
            status_type: 11,
            product_id: productId,
            seller_id: request.payload.seller_id || newSellerId,
            document_date: document_date ?
                _moment2.default.utc(document_date).format('YYYY-MM-DD') :
                _moment2.default.utc().format('YYYY-MM-DD'),
            repair_for: request.payload.repair_for,
            repair_cost: request.payload.value,
            warranty_upto: request.payload.warranty_upto,
            user_id: user.id || user.ID,
            job_id: request.payload.job_id,
          };
          var repairPromise = repairId ?
              repairAdaptor.updateRepairs(repairId, values) :
              repairAdaptor.createRepairs(values);
          return repairPromise.then(function(result) {
            if (result) {
              return reply({
                status: true,
                message: 'successfull',
                repair: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'Repair already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          });
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err,
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'deleteRepair',
    value: function deleteRepair(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return repairAdaptor.deleteRepair(request.params.repairId, user.id ||
            user.ID);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'updateInsurance',
    value: function updateInsurance(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var providerPromise = request.payload.provider_name ?
            insuranceAdaptor.findCreateInsuranceBrand({
              main_category_id: request.payload.main_category_id,
              category_id: request.payload.category_id,
              type: 1,
              status_type: 11,
              updated_by: user.id || user.ID,
              name: request.payload.provider_name,
            }) :
            undefined;
        return Promise.all([
          providerPromise, categoryAdaptor.retrieveRenewalTypes({
            id: {
              $gte: 7,
            },
          })]).then(function(promiseResult) {
          var provider = promiseResult[0];
          var renewalTypes = promiseResult[1];
          var product_id = request.params.id;
          var insuranceId = request.params.insuranceId;
          var providerId = provider ? provider.id : undefined;
          var insuranceRenewalType = renewalTypes.find(function(item) {
            return item.type === 8;
          });
          if (request.payload.renewal_type) {
            insuranceRenewalType = renewalTypes.find(function(item) {
              return item.type === request.payload.renewal_type;
            });
          }
          var effective_date = request.payload.effective_date ||
              _moment2.default.utc();
          effective_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).isValid() ?
              _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
                  startOf('day') :
              _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
          var expiry_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).
              add(insuranceRenewalType.effective_months, 'months').
              subtract(1, 'day').
              endOf('days');
          var insuranceBody = {
            renewal_type: request.payload.renewal_type || 8,
            updated_by: user.id || user.ID,
            job_id: request.payload.job_id,
            status_type: 11,
            product_id: product_id,
            expiry_date: effective_date ?
                _moment2.default.utc(expiry_date).format('YYYY-MM-DD') :
                undefined,
            effective_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            document_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            document_number: request.payload.policy_no,
            provider_id: provider ? providerId : request.payload.provider_id,
            amount_insured: request.payload.amount_insured,
            renewal_cost: request.payload.value,
            user_id: user.id || user.ID,
          };
          var insurancePromise = insuranceId ?
              insuranceAdaptor.updateInsurances(insuranceId, insuranceBody) :
              insuranceAdaptor.createInsurances(insuranceBody);
          return insurancePromise.then(function(result) {
            if (result) {
              return reply({
                status: true,
                message: 'successful',
                insurance: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'Insurance already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          });
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err,
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'deleteInsurance',
    value: function deleteInsurance(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return insuranceAdaptor.deleteInsurance(
            request.params.insuranceId, user.id || user.ID);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'updateAmc',
    value: function updateAmc(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var sellerPromise = !request.payload.seller_id &&
        (request.payload.seller_contact || request.payload.seller_name) ?
            sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: request.payload.seller_contact,
            }, {
              seller_name: request.payload.seller_name,
              contact_no: request.payload.contact_no,
              updated_by: user.id || user.ID,
              created_by: user.id || user.ID,
              address: request.payload.seller_address,
              status_type: 11,
            }) :
            '';
        return sellerPromise.then(function(sellerList) {
          var productId = request.params.id;
          var amcId = request.params.amcId;
          var effective_date = request.payload.effective_date ||
              _moment2.default.utc();
          effective_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).isValid() ?
              _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
                  startOf('day') :
              _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
          var expiry_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).
              add(12, 'months').
              subtract(1, 'day').
              endOf('days').
              format('YYYY-MM-DD');

          var values = {
            renewal_type: 8,
            updated_by: user.id || user.ID,
            status_type: 11,
            product_id: productId,
            job_id: request.payload.job_id,
            renewal_cost: request.payload.value,
            seller_id: sellerList ? sellerList.sid : request.payload.seller_id,
            expiry_date: effective_date ?
                _moment2.default.utc(expiry_date).format('YYYY-MM-DD') :
                undefined,
            effective_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            document_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            user_id: user.id || user.ID,
          };
          var amcPromise = amcId ?
              amcAdaptor.updateAMCs(amcId, values) :
              amcAdaptor.createAMCs(values);
          return amcPromise.then(function(result) {
            if (result) {
              return reply({
                status: true,
                message: 'successful',
                amc: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'AMC already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          });
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err,
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'deleteAMC',
    value: function deleteAMC(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return amcAdaptor.deleteAMC(request.params.amcId, user.id || user.ID);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'updatePUC',
    value: function updatePUC(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var sellerPromise = !request.payload.seller_id &&
        (request.payload.seller_contact || request.payload.seller_name) ?
            sellerAdaptor.retrieveOrCreateOfflineSellers({
              contact_no: request.payload.seller_contact,
            }, {
              seller_name: request.payload.seller_name,
              contact_no: request.payload.contact_no,
              updated_by: user.id || user.ID,
              created_by: user.id || user.ID,
              address: request.payload.seller_address,
              status_type: 11,
            }) :
            '';
        return sellerPromise.then(function(sellerList) {
          var productId = request.params.id;
          var pucId = request.params.pucId;
          var effective_date = request.payload.effective_date ||
              _moment2.default.utc();
          effective_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).isValid() ?
              _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
                  startOf('day') :
              _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
          var expiry_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).
              add(request.payload.expiry_period || 6, 'months').
              subtract(1, 'day').
              endOf('days').
              format('YYYY-MM-DD');
          var values = {
            renewal_type: request.payload.expiry_period || 6,
            updated_by: user.id || user.ID,
            status_type: 11,
            renewal_cost: request.payload.value,
            product_id: productId,
            job_id: request.payload.job_id,
            seller_id: sellerList ? sellerList.sid : request.payload.seller_id,
            expiry_date: effective_date ?
                _moment2.default.utc(expiry_date).format('YYYY-MM-DD') :
                undefined,
            effective_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            document_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            user_id: user.id || user.ID
          };
          var pucPromise = pucId ?
              pucAdaptor.updatePUCs(pucId, values) :
              pucAdaptor.createPUCs(values);
          return pucPromise.then(function(result) {
            if (result) {
              return reply({
                status: true,
                message: 'successful',
                puc: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'PUC already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          });
        }).catch(function(err) {
          console.log('Error on ' + new Date() + ' for user ' +
              (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err,
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'deletePUC',
    value: function deletePUC(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return insuranceAdaptor.deletePUCs(request.params.pucId, user.id ||
            user.ID);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'updateWarranty',
    value: function updateWarranty(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var providerPromise = request.payload.provider_name ?
            insuranceAdaptor.findCreateInsuranceBrand({
              main_category_id: request.payload.main_category_id,
              category_id: request.payload.category_id,
              type: 1,
              status_type: 11,
              updated_by: user.id || user.ID,
              name: request.payload.provider_name,
            }) :
            undefined;
        return Promise.all([
          providerPromise, categoryAdaptor.retrieveRenewalTypes({
            id: {
              $gte: 7,
            },
          })]).then(function(promiseResult) {
          var productId = request.params.id;
          var warrantyId = request.params.warrantyId;
          var warrantyRenewalType = void 0;
          var expiry_date = void 0;
          var provider = promiseResult[0];
          warrantyRenewalType = promiseResult[1].find(function(item) {
            return item.type === request.payload.renewal_type;
          });
          var effective_date = request.payload.effective_date ||
              _moment2.default.utc();
          effective_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).isValid() ?
              _moment2.default.utc(effective_date, _moment2.default.ISO_8601).
                  startOf('day') :
              _moment2.default.utc(effective_date, 'DD MMM YY').startOf('day');
          expiry_date = _moment2.default.utc(effective_date,
              _moment2.default.ISO_8601).
              add(warrantyRenewalType.effective_months, 'months').
              subtract(1, 'day').
              endOf('days');
          var values = {
            renewal_type: request.payload.renewal_type,
            updated_by: user.id || user.ID,
            status_type: 11,
            job_id: request.payload.job_id,
            product_id: productId,
            expiry_date: effective_date ?
                _moment2.default.utc(expiry_date).format('YYYY-MM-DD') :
                undefined,
            effective_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                undefined,
            document_date: effective_date ?
                _moment2.default.utc(effective_date).format('YYYY-MM-DD') :
                _moment2.default.utc().format('YYYY-MM-DD'),
            provider_id: provider ? provider.id : request.payload.provider_id,
            warranty_type: request.payload.warranty_type,
            user_id: user.id || user.ID
          };
          var warrantyItemPromise = warrantyId ?
              warrantyAdaptor.updateWarranties(warrantyId, values) :
              warrantyAdaptor.createWarranties(values);
          return warrantyItemPromise.then(function(result) {
            if (result) {
              return reply({
                status: true,
                message: 'successful',
                warranty: result,
                forceUpdate: request.pre.forceUpdate
              });
            } else {
              return reply({
                status: false,
                message: 'Warranty already exist.',
                forceUpdate: request.pre.forceUpdate
              });
            }
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
    key: 'deleteWarranty',
    value: function deleteWarranty(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return insuranceAdaptor.deleteWarranties(
            request.params.warrantyId, user.id || user.ID);
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return ProductItemController;
}();

exports.default = ProductItemController;