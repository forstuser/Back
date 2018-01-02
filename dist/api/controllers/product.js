/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var productAdaptor = void 0;

var ProductController = function() {
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
          console.log(request.payload);
          var productBody = {
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
            status_type: 11,
            document_number: request.payload.document_number,
            document_date: request.payload.document_date ?
                (0, _moment2.default)(request.payload.document_date,
                    _moment2.default.ISO_8601).isValid() ?
                    (0, _moment2.default)(request.payload.document_date,
                        _moment2.default.ISO_8601).
                        startOf('day').
                        format('YYYY-MM-DD') :
                    (0, _moment2.default)(request.payload.document_date,
                        'DD MMM YY').startOf('day').format('YYYY-MM-DD') :
                undefined,
            brand_name: request.payload.brand_name,
            copies: [],
          };

          console.log(productBody);
          var otherItems = {
            warranty: request.payload.warranty,
            insurance: request.payload.insurance,
            puc: request.payload.puc,
            amc: request.payload.amc,
          };

          var metaDataBody = request.payload.metadata ?
              request.payload.metadata.map(function(item) {
                item.updated_by = user.id || user.ID;

                return item;
              }) :
              [];
          return productAdaptor.createProduct(productBody, metaDataBody,
              otherItems).then(function(result) {
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
      },
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
      },
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
    }, {
      key: 'retrieveCenterProducts',
      value: function retrieveCenterProducts(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (!user) {
          reply({
            status: false,
            message: 'Unauthorized',
            forceUpdate: request.pre.forceUpdate,
          });
        } else if (user && !request.pre.forceUpdate) {
          var brandId = (request.query.brandids || '[]').split('[')[1].split(
              ']')[0].split(',').filter(Boolean);
          var categoryId = (request.query.categoryids || '[]').split(
              '[')[1].split(']')[0].split(',').filter(Boolean);
          var options = {
            main_category_id: [2, 3],
            status_type: [5, 11],
            user_id: user.id || user.ID,
          };

          if (brandId.length > 0) {
            options.brand_id = brandId;
          }

          if (categoryId.length > 0) {
            options.category_id = categoryId;
          }

          return productAdaptor.retrieveProducts(options).
              then(function(result) {
                return reply({
                  status: true,
                  productList: result /* :productList.slice((pageNo * 10) - 10, 10) */
                  , forceUpdate: request.pre.forceUpdate,
                  /* ,
                      nextPageUrl: productList.length > listIndex + 10 ?
                       `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
                       &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
                       &offlinesellerids=${offlineSellerIds}&onlinesellerids=
                       ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
                });
              }).
              catch(function(err) {
                console.log('Error on ' + new Date() + ' for user ' +
                    (user.id || user.ID) + ' is as follow: \n \n ' + err);

                return reply({
                  status: false,
                  message: 'Unable to fetch product list',
                  forceUpdate: request.pre.forceUpdate,
                });
              });
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