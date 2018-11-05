/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _product = require('../adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _notification = require('../adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let productAdaptor;
let notificationAdaptor;
let modals;

class ProductController {
  constructor(modal) {
    productAdaptor = new _product2.default(modal);
    notificationAdaptor = new _notification2.default(modal);
    modals = modal;
  }

  static async deleteProduct(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
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
      try {
        const deleted = await productAdaptor.deleteProduct(request.params.id, user.id || user.ID);
        if (deleted) {
          return reply.response({
            status: true,
            message: 'successful',
            deleted,
            forceUpdate: request.pre.forceUpdate
          });
        } else {
          return reply.response({
            status: false,
            message: 'Product delete failed',
            forceUpdate: request.pre.forceUpdate
          });
        }
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'An error occurred in product deletion.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      }
    } else {
      reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateProduct(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
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
      try {
        const {
          product_name, main_category_id, category_id, sub_category_id, brand_id, colour_id, value,
          taxes, seller_name, seller_contact, seller_email, seller_address, seller_id, model, metadata,
          isNewModel, brand_name, document_number, document_date, warranty, insurance, puc, amc, repair, ref_id, accessory_part_id
        } = request.payload;
        const user_id = user.id || user.ID;
        const productBody = {
          user_id, product_name, main_category_id, category_id,
          sub_category_id, brand_id, colour_id,
          purchase_cost: value, taxes, updated_by: user_id,
          seller_name, seller_contact, seller_email, seller_address,
          seller_id, status_type: 11, model: model || '',
          new_drop_down: isNewModel, ref_id, document_number,
          accessory_part_id, document_date: document_date ? _moment2.default.utc(document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined, brand_name
        };

        const otherItems = { warranty, insurance, puc, amc, repair };

        const metaDataBody = metadata ? metadata.map(item => {
          item.updated_by = user_id;
          return item;
        }) : [];

        const product = await productAdaptor.updateProductDetails({
          user, productBody, metaDataBody, otherItems, id: request.params.id
        });
        if (product) {
          return reply.response({
            status: true,
            message: 'successful',
            product,
            forceUpdate: request.pre.forceUpdate
          });
        } else if (product === false) {
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
      } catch (err) {
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'An error occurred in product creation.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      }
    } else {
      reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateAccessoryProduct(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
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
      try {
        const {
          product_name, main_category_id, category_id, sub_category_id, brand_id, accessory_part_name, value,
          taxes, seller_name, seller_contact, seller_email, seller_address, seller_id, document_number, document_date, warranty, accessory_part_id
        } = request.payload;
        const { ref_id, id } = request.params;
        const user_id = user.id || user.ID;
        const productBody = {
          user_id, product_name, main_category_id, category_id, sub_category_id,
          brand_id, purchase_cost: value, taxes, updated_by: user_id,
          seller_name, seller_contact, seller_email, seller_address, seller_id,
          status_type: 11, ref_id, document_number, accessory_part_id,
          document_date: document_date ? _moment2.default.utc(document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined, accessory_part_name
        };

        const otherItems = { warranty };

        const product = await productAdaptor.updateAccessoryProduct({ user, productBody, otherItems, id, ref_id });
        return product ? reply.response({
          status: true, message: 'successful', product,
          forceUpdate: request.pre.forceUpdate
        }) : reply.response({
          status: false, message: 'Product already exist.',
          forceUpdate: request.pre.forceUpdate
        });
      } catch (err) {
        console.log(err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
          message: 'An error occurred in product creation.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      }
    } else {
      reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async updateUserReview(request, reply) {
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
        const id = request.params.id;
        if (request.params.reviewfor === 'brands') {
          return reply.response((await productAdaptor.updateBrandReview(user, id, request)));
        } else if (request.params.reviewfor === 'sellers') {
          return reply.response((await productAdaptor.updateSellerReview(user, id, request.query.isonlineseller, request)));
        } else {
          return reply.response((await productAdaptor.updateProductReview(user, id, request)));
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        message: 'Unable to add/update review now.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveProductDetail(request, reply) {
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
        return reply.response((await productAdaptor.prepareProductDetail({ user, request }))).code(200);
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        message: 'Unable to retrieve product.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }

  static async retrieveCenterProducts(request, reply) {
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
        const brandId = (request.query.brandids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        const categoryId = (request.query.categoryids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        const options = {
          main_category_id: [2, 3],
          status_type: [5, 11],
          user_id: user.id || user.ID,
          brand_id: {
            $in: modals.sequelize.literal('(Select brand_id from center_brand_mapping)')
          },
          category_id: {
            $in: modals.sequelize.literal('(Select category_id from service_center_details)')
          }
        };

        if (brandId.length > 0) {
          options.brand_id = brandId;
        }

        if (categoryId.length > 0) {
          options.category_id = categoryId;
        }

        return reply.response({
          status: true,
          productList: await productAdaptor.retrieveProducts(options),
          forceUpdate: request.pre.forceUpdate
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
        user_id: user && !user.seller_detail ? user.id || user.ID : undefined,
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
        message: 'Unable to fetch product.',
        forceUpdate: request.pre.forceUpdate,
        err
      });
    }
  }
}

exports.default = ProductController;