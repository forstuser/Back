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


  _createClass(GeneralController, null, [
    {
      key: 'retrieveReferenceData',
      value: function retrieveReferenceData(request, reply) {
        return Promise.all([
          categoryAdaptor.retrieveCategories({category_level: 1}),
          brandAdaptor.retrieveBrands({status_type: 1}),
          brandAdaptor.retrieveBrandDetails({status_type: 1}),
          sellerAdaptor.retrieveOfflineSellers({status_type: 1}),
          sellerAdaptor.retrieveOnlineSellers({status_type: 1})]).
            then(function(results) {
              var categories = results[0];
              var brands = results[1].map(function(item) {
                item.details = results[2].filter(function(detailItem) {
                  return detailItem.brandId === item.id;
                });
                return item;
              });

              var offlineSellers = results[3];
              var onlineSellers = results[4];

              return reply({
                status: true,
                categories: categories,
                brands: brands,
                offlineSellers: offlineSellers,
                onlineSellers: onlineSellers,
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
            }).
            catch(function(err) {
              console.log({
                api_err: err,
              });

              return reply({
                status: false,
              });
            });
      },
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
      },
    }, {
      key: 'retrieveFAQs',
      value: function retrieveFAQs(request, reply) {
        modals.faqs.findAll({
          where: {
            status_id: {
              $ne: 3,
            },
          },
        }).then(function(faq) {
          reply({status: true, faq: faq}).code(200);
        }).catch(function(err) {
          console.log({API_Logs: err});
          reply({status: false}).code(200);
        });
      },
    }]);

  return GeneralController;
}();

exports.default = GeneralController;