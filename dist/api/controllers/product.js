/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var productAdaptor = void 0;
var notificationAdaptor = void 0;
var models = void 0;

var ProductController = function () {
  function ProductController(modal) {
    _classCallCheck(this, ProductController);

    productAdaptor = new _product2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    models = modal;
  }

  _createClass(ProductController, null, [{
    key: 'createProduct',
    value: function createProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        var productBody = {
          product_name: request.payload.product_name,
          user_id: user.id || user.ID,
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          brand_id: request.payload.brand_id,
          colour_id: request.payload.colour_id,
          purchase_cost: request.payload.value,
          taxes: request.payload.taxes,
          updated_by: user.id || user.ID,
          seller_id: request.payload.seller_id,
          status_type: 11,
          document_number: request.payload.document_number,
          document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined,
          brand_name: request.payload.brand_name,
          copies: []
        };

        var otherItems = {
          warranty: request.payload.warranty,
          insurance: request.payload.insurance,
          puc: request.payload.puc,
          amc: request.payload.amc,
          repair: request.payload.repair
        };

        var metaDataBody = request.payload.metadata ? request.payload.metadata.map(function (item) {
          item.updated_by = user.id || user.ID;

          return item;
        }) : [];
        return productAdaptor.createProduct(productBody, metaDataBody, otherItems).then(function (result) {
          if (result) {
            return reply.response({
              status: true,
              message: 'successfull',
              product: result,
              forceUpdate: request.pre.forceUpdate
            });
            //todo: after this check if number of products in the db for that user is 1 and if true send him a notification
          } else {
            return reply.response({
              status: false,
              message: 'Product already exist.',
              forceUpdate: request.pre.forceUpdate
            });
          }
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          models.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply.response({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'deleteProduct',
    value: function deleteProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        return productAdaptor.deleteProduct(request.params.id, user.id || user.ID).then(function (deleted) {
          if (deleted) {
            return reply.response({
              status: true,
              message: 'successfull',
              deleted: deleted,
              forceUpdate: request.pre.forceUpdate
            });
          } else {
            return reply.response({
              status: false,
              message: 'Product delete failed',
              forceUpdate: request.pre.forceUpdate
            });
          }
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          models.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify(err)
          });
          models.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply.response({
            status: false,
            message: 'An error occurred in product deletion.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateProduct',
    value: function updateProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        var productBody = {
          product_name: request.payload.product_name,
          user_id: user.id || user.ID,
          main_category_id: request.payload.main_category_id,
          category_id: request.payload.category_id,
          sub_category_id: request.payload.sub_category_id,
          brand_id: request.payload.brand_id,
          colour_id: request.payload.colour_id,
          purchase_cost: request.payload.value,
          taxes: request.payload.taxes,
          updated_by: user.id || user.ID,
          seller_name: request.payload.seller_name,
          seller_contact: request.payload.seller_contact,
          seller_email: request.payload.seller_email,
          seller_address: request.payload.seller_address,
          seller_id: request.payload.seller_id,
          status_type: 11,
          model: request.payload.model || '',
          new_drop_down: request.payload.isNewModel,
          document_number: request.payload.document_number,
          document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined,
          brand_name: request.payload.brand_name
        };

        var otherItems = {
          warranty: request.payload.warranty,
          insurance: request.payload.insurance,
          puc: request.payload.puc,
          amc: request.payload.amc,
          repair: request.payload.repair
        };

        var metaDataBody = request.payload.metadata ? request.payload.metadata.map(function (item) {
          item.updated_by = user.id || user.ID;

          return item;
        }) : [];

        return productAdaptor.updateProductDetails(productBody, metaDataBody, otherItems, request.params.id).then(function (result) {
          if (result) {
            /*if (result.flag) {
              notificationAdaptor.notifyUser(result.user_id, {
                title: 'Your Product Card is created!',
                description: 'Congratulations on your first Product Card! Enjoy the journey to easy life with your Home Manager.',
              }, reply);
               if (!result.copies ||
                  (result.copies && result.copies.length === 0)) {
                notificationAdaptor.notifyUser(result.user_id, {
                  title: 'Your Purchase Bill is a life saver!',
                  description: 'Did you know that it\'s mandatory to have a product\'s purchase or repair bill to avail warranty and also helps in easy resale?',
                }, reply);
              }
            }*/
            return reply.response({
              status: true,
              message: 'successful',
              product: result,
              forceUpdate: request.pre.forceUpdate
            });
          } else if (result === false) {
            return reply.response({
              status: false,
              message: 'Brand/Model can\'t be changed as they are already verified.',
              forceUpdate: request.pre.forceUpdate
            });
          } else {
            return reply.response({
              status: false,
              message: 'Product already exist.',
              forceUpdate: request.pre.forceUpdate
            });
          }
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          models.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply.response({
            status: false,
            message: 'An error occurred in product creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateUserReview',
    value: function updateUserReview(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        var id = request.params.id;
        if (request.params.reviewfor === 'brands') {
          return reply.response(productAdaptor.updateBrandReview(user, id, request));
        } else if (request.params.reviewfor === 'sellers') {
          return reply.response(productAdaptor.updateSellerReview(user, id, request.query.isonlineseller, request));
        } else {
          return reply.response(productAdaptor.updateProductReview(user, id, request));
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveProductDetail',
    value: function retrieveProductDetail(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        return reply.response(productAdaptor.prepareProductDetail({
          user: user,
          request: request
        })).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveCenterProducts',
    value: function retrieveCenterProducts(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        var brandId = (request.query.brandids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        var categoryId = (request.query.categoryids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        var options = {
          main_category_id: [2, 3],
          status_type: [5, 11],
          user_id: user.id || user.ID
        };

        if (brandId.length > 0) {
          options.brand_id = brandId;
        }

        if (categoryId.length > 0) {
          options.category_id = categoryId;
        }

        return productAdaptor.retrieveProducts(options).then(function (result) {
          return reply.response({
            status: true,
            productList: result /* :productList.slice((pageNo * 10) - 10, 10) */
            , forceUpdate: request.pre.forceUpdate
            /* ,
                nextPageUrl: productList.length > listIndex + 10 ?
                 `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
                 &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
                 &offlinesellerids=${offlineSellerIds}&onlinesellerids=
                 ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          models.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply.response({
            status: false,
            message: 'Unable to fetch product list',
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return ProductController;
}();

exports.default = ProductController;