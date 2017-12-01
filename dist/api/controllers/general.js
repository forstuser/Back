/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
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

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contactModel = void 0;
var modals = void 0;
var categoryAdaptor = void 0;
var brandAdaptor = void 0;
var sellerAdaptor = void 0;

var GeneralController = function () {
  function GeneralController(modal) {
    _classCallCheck(this, GeneralController);

    contactModel = modal.contactUs;
    categoryAdaptor = new _category2.default(modal);
    brandAdaptor = new _brands2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
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
      return _bluebird2.default.try(function() {
        if (request.query && user) {
          if (request.query.categoryId && request.query.brandId) {
            return brandAdaptor.retrieveBrandDropDowns({
              category_id: request.query.categoryId,
              brand_id: request.query.brandId,
              $or: {
                status_type: 5,
                $and: {
                  status_type: 11,
                  updated_by: user.id,
                }
              }
            });
          } else if (request.query.categoryId) {
            return categoryAdaptor.retrieveSubCategories(
                {category_id: request.query.categoryId}, true);
          } else if (request.query.mainCategoryId) {
            return categoryAdaptor.retrieveCategories(
                {category_id: request.query.mainCategoryId}, false);
          }
        }

        return categoryAdaptor.retrieveCategories(
            {category_level: 1, category_id: [2, 3]}, true);
      }).then(function(results) {
        return reply({
          status: true,
          dropDowns: request.query.brandId ? results : undefined,
          categories: request.query.brandId ? undefined : results,
          contactType: [
            {
              id: 1,
              name: 'URL',
            }, {
              id: 2,
              name: 'EMAIL',
            }, {
              id: 3,
              name: 'PHONE',
            }],
        });
      }).catch(function(err) {
        console.log({
          api_err: err,
        });

        return reply({
          status: false,
        });
      });
    }
  }, {
    key: 'contactUs',
    value: function contactUs(request, reply) {
      _notification2.default.sendLinkOnMessage(request.payload.phone);
      contactModel.create({
        name: request.payload.name,
        phone: request.payload.phone,
        email: request.payload.email,
        message: request.payload.message,
      }).then(function() {
        reply({status: true}).code(201);
      }).catch(function(err) {
        console.log({API_Logs: err});
        reply({status: false}).code(500);
      });
    }
  }, {
    key: 'retrieveFAQs',
    value: function retrieveFAQs(request, reply) {
      modals.faqs.findAll({
        where: {
          status_id: {
            $ne: 3,
          }
        }
      }).then(function(faq) {
        reply({status: true, faq: faq}).code(200);
      }).catch(function(err) {
        console.log({API_Logs: err});
        reply({status: false}).code(200);
      });
    }
  }]);

  return GeneralController;
}();

exports.default = GeneralController;