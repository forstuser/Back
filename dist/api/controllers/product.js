/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var productAdaptor = void 0;

var ProductController = function () {
  function ProductController(modal) {
    _classCallCheck(this, ProductController);

    productAdaptor = new _product2.default(modal);
  }

  _createClass(ProductController, null, [
    {
    key: 'createProduct',
    value: function createProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!user) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (user && !request.pre.forceUpdate) {
        var productBody = {
          product_name: request.payload.product_name,
          user_id: user.id,
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          brand_id: request.payload.brand_id,
          colour_id: request.payload.colour_id,
          purchase_cost: request.payload.purchase_cost,
          taxes: request.payload.taxes,
          updated_by: user.id,
          seller_id: request.payload.seller_id,
          status_type: 11,
          document_number: request.payload.document_number,
          document_date: request.payload.document_date,
          copies: [],
        };
        var metaDataBody = request.payload.metadata ?
            request.payload.metadata.map(function(item) {
          item.updated_by = user.id;

          return item;
            }) :
            [];
        return productAdaptor.createProduct(productBody, metaDataBody).
            then(function(result) {
              if (result) {
                return reply({
                  status: true,
                  message: 'successfull',
                  product: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'Product already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            }).
            catch(function(err) {
              console.log(err);
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
    key: 'updateUserReview',
    value: function updateUserReview(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!user) {
        reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        });
      } else if (user && !request.pre.forceUpdate) {
        var id = request.params.id;
        if (request.params.reviewfor === 'brands') {
          reply(productAdaptor.updateBrandReview(user, id, request));
        } else if (request.params.reviewfor === 'sellers') {
          reply(productAdaptor.updateSellerReview(user, id,
              request.query.isonlineseller, request));
        } else {
          reply(productAdaptor.updateProductReview(user, id, request));
        }
      } else {
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    }
  }, {
      key: 'retrieveProductDetail',
      value: function retrieveProductDetail(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (!user) {
          reply({
            status: false,
            message: 'Unauthorized',
            forceUpdate: request.pre.forceUpdate,
          });
        } else if (user && !request.pre.forceUpdate) {
          reply(productAdaptor.prepareProductDetail(user, request)).code(200);
        } else {
          reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      },
    }]);

  return ProductController;
}();

exports.default = ProductController;