/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _category = require('../Adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _brands = require('../Adaptors/brands');

var _brands2 = _interopRequireDefault(_brands);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contactModel = void 0;
var modals = void 0;
var categoryAdaptor = void 0;
var brandAdaptor = void 0;
var sellerAdaptor = void 0;
var jobAdaptor = void 0;
var productAdaptor = void 0;
var userAdaptor = void 0;

var GeneralController = function () {
  function GeneralController(modal) {
    _classCallCheck(this, GeneralController);

    contactModel = modal.contactUs;
    categoryAdaptor = new _category2.default(modal);
    brandAdaptor = new _brands2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
    jobAdaptor = new _job2.default(modal);
    productAdaptor = new _product2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
  }

  /**
   * Retrieve Reference Data
   * @param request
   * @param reply
   */


  _createClass(GeneralController, null, [{
    key: 'retrieveReferenceData',
    value: function retrieveReferenceData(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      var isBrandRequest = false;
      return _bluebird2.default.try(function () {
        if (request.query && user) {
          if (request.query.categoryId && request.query.brandId) {
            return brandAdaptor.retrieveBrandDropDowns({
              category_id: request.query.categoryId,
              brand_id: request.query.brandId,
              $or: {
                status_type: 1,
                $and: {
                  status_type: 11,
                  updated_by: user.id || user.ID
                }
              }
            });
          } else if (request.query.categoryId) {
            isBrandRequest = true;
            return Promise.all([categoryAdaptor.retrieveSubCategories({ category_id: request.query.categoryId }, true), categoryAdaptor.retrieveRenewalTypes({
              status_type: 1
            })]);
          } else if (request.query.mainCategoryId) {
            return categoryAdaptor.retrieveCategories({ category_id: request.query.mainCategoryId }, false);
          }
        }

        return categoryAdaptor.retrieveCategories({ category_level: 1 }, false);
      }).then(function (results) {
        return reply({
          status: true,
          dropDowns: request.query.brandId ? results : undefined,
          categories: request.query.brandId ? undefined : isBrandRequest ? results[0] : results,
          renewalTypes: isBrandRequest ? results[1] : undefined,
          contactType: [{
            id: 1,
            name: 'URL'
          }, {
            id: 2,
            name: 'EMAIL'
          }, {
            id: 3,
            name: 'PHONE'
          }]
        });
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

        return reply({
          status: false
        });
      });
    }
  }, {
    key: 'contactUs',
    value: function contactUs(request, reply) {
      _notification2.default.sendLinkOnMessage(request.payload.phone);
      return contactModel.create({
        name: request.payload.name,
        phone: request.payload.phone,
        email: request.payload.email,
        message: request.payload.message
      }).then(function () {
        return reply({ status: true }).code(201);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false }).code(500);
      });
    }
  }, {
    key: 'retrieveFAQs',
    value: function retrieveFAQs(request, reply) {
      return modals.faqs.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        order: [['id']]
      }).then(function (faq) {
        return reply({ status: true, faq: faq }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'retrieveTips',
    value: function retrieveTips(request, reply) {
      return modals.tips.findAll({ order: [['id']] }).then(function (tips) {
        return reply({ status: true, tips: tips }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'intializeUserProduct',
    value: function intializeUserProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return jobAdaptor.createJobs({
            job_id: '' + Math.random().toString(36).substr(2, 9) + (user.id || user.ID).toString(36),
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            uploaded_by: user.id || user.ID,
            user_status: 8,
            admin_status: 2,
            comments: request.query ? request.query.productId ? 'This job is sent for product id ' + request.query.productId : request.query.productName ? 'This job is sent for product name ' + request.query.productName : '' : ''
          });
        }).then(function (jobResult) {
          return Promise.all([productAdaptor.createEmptyProduct({
            job_id: jobResult.id,
            product_name: request.payload.product_name,
            user_id: user.id || user.ID,
            main_category_id: request.payload.main_category_id,
            category_id: request.payload.category_id,
            brand_id: request.payload.brand_id,
            colour_id: request.payload.colour_id,
            purchase_cost: request.payload.purchase_cost,
            taxes: request.payload.taxes,
            updated_by: user.id || user.ID,
            seller_id: request.payload.seller_id,
            status_type: 8,
            document_number: request.payload.document_number,
            document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined,
            brand_name: request.payload.brand_name,
            copies: []
          }), categoryAdaptor.retrieveSubCategories({ category_id: request.payload.category_id }, true), categoryAdaptor.retrieveRenewalTypes({
            status_type: 1
          })]);
        }).then(function (initResult) {
          return reply({
            status: true,
            product: initResult[0],
            categories: initResult[1],
            renewalTypes: initResult[2],
            message: 'Product and Job is initialized.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to initialize product or job.',
            forceUpdate: request.pre.forceUpdate
          }).code(200);
        });
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'serviceCenterAccessed',
    value: function serviceCenterAccessed(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return userAdaptor.updateUserDetail({ service_center_accessed: true }, {
            where: {
              id: user.id || user.ID
            }
          });
        }).then(function () {
          return reply({
            status: true,
            message: 'Status updated successfully.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Failed to update status',
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveRepairableProducts',
    value: function retrieveRepairableProducts(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return productAdaptor.retrieveProducts({
            main_category_id: [1, 2, 3],
            status_type: [5, 11],
            user_id: user.id || user.ID
          });
        }).then(function (productResult) {
          return reply({
            status: true,
            product: productResult,
            message: 'Success.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to fetch product list',
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return GeneralController;
}();

exports.default = GeneralController;