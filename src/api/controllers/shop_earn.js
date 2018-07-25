/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import ShopEarnAdaptor from '../Adaptors/shop_earn';
import moment from 'moment/moment';
import Promise from 'bluebird';
import JobAdaptor from '../Adaptors/job';
import ProductAdaptor from '../Adaptors/product';
import SellerAdaptor from '../Adaptors/sellers';

let modals;
let shopEarnAdaptor;
let jobAdaptor;
let productAdaptor;
let sellerAdaptor;

class ShopEarnController {
  constructor(modal) {
    shopEarnAdaptor = new ShopEarnAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal);
    productAdaptor = new ProductAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    modals = modal;
  }

  static async getSKUs(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveSKUs({
            user_id: (user.id || user.ID),
            queryOptions: request.query,
          }),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getSKUItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const sku_item = await shopEarnAdaptor.retrieveSKUItem({
          bar_code: (request.params || {}).bar_code,
          id: (request.params || {}).id,
        });
        if ((request.params || {}).bar_code && sku_item) {
          sku_item.sku_measurement = sku_item.sku_measurements.find(
              item => item.bar_code.toLowerCase() ===
                  (request.params || {}).bar_code.toLowerCase());
        }
        return reply.response({
          status: true,
          result: sku_item,
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve SKU Item',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getReferenceData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveReferenceData(),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: `Unable to retrieve reference data for SKU's`,
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getSKUWishList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        const result = await shopEarnAdaptor.retrieveSKUWishList(
            {user_id: (user.id || user.ID)});
        if (result && ((result.wishlist_items && result.wishlist_items.length >
            0) ||
            (result.past_selections && result.past_selections.length > 0))) {
          return reply.response({
            status: true,
            result,
          });
        }

        return reply.response(
            {
              status: true,
              result: {wishlist_items: [], past_selections: []},
              message: 'No Wish List please create one.',
            });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve wish list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getCashBackTransactions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveCashBackTransactions(
              {user_id: (user.id || user.ID)}),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve wish list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getWalletDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveWalletDetails(
              {user_id: (user.id || user.ID)}),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve wish list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async createSKUWishList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        request.payload.added_date = moment().format();
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.createUserSKUWishList(reply, request,
            user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to create or update wish list.',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async addToPastSelection(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        request.payload.added_date = moment().format();
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.addToPastSelection(reply, request,
            user_id);
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to create or update wish list.',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async clearSKUWishList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        const user_id = user.id || user.ID;
        return await shopEarnAdaptor.resetUserSKUWishList(reply, request,
            user_id);

      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to reset wish list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async initializeUserExpenses(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const jobResult = await jobAdaptor.createJobs({
          job_id: `${Math.random().
              toString(36).substr(2, 9)}${(user.id ||
              user.ID).toString(36)}`,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          uploaded_by: user.id || user.ID,
          user_status: 8,
          admin_status: 2,
          comments: `This job is sent for cashback expense`,
        });
        const [product, cashback_jobs, wishListData] = await Promise.all([
          productAdaptor.createEmptyProduct({
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
            document_date: request.payload.document_date ?
                moment.utc(request.payload.document_date,
                    moment.ISO_8601).
                    isValid() ?
                    moment.utc(request.payload.document_date,
                        moment.ISO_8601).
                        startOf('day').
                        format('YYYY-MM-DD') :
                    moment.utc(request.payload.document_date, 'DD MMM YY').
                        startOf('day').
                        format('YYYY-MM-DD') :
                undefined,
            brand_name: request.payload.brand_name,
            copies: [],
          }), jobAdaptor.createCashBackJobs({
            job_id: jobResult.id,
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            uploaded_by: user.id || user.ID,
            user_status: 8, admin_status: 2,
            cashback_status: 13,
            seller_status: 13,
          }), shopEarnAdaptor.retrieveSKUWishList(
              {user_id: (user.id || user.ID)})]);
        const {wishlist_items, past_selections} = wishListData || {};
        return reply.response({
          status: true,
          product, cashback_jobs, wishlist_items, past_selections,
          message: 'Product, Cashback Job and Job are initialized.',
        });
      } else {
        return shared.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to initialize product or job.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async updateExpenses(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const product = await productAdaptor.updateProduct(
            request.params.product_id, JSON.parse(JSON.stringify({
              purchase_cost: request.payload.purchase_cost,
              taxes: request.payload.taxes,
              updated_by: user.id || user.ID,
              seller_id: request.payload.seller_id,
              status_type: 11,
              document_number: request.payload.document_number,
              document_date: request.payload.document_date ?
                  moment.utc(request.payload.document_date,
                      moment.ISO_8601).isValid() ?
                      moment.utc(request.payload.document_date,
                          moment.ISO_8601).
                          startOf('day').format() :
                      moment.utc(request.payload.document_date, 'DD MMM YY').
                          startOf('day').format() : undefined,
            })));

        if (product && product.seller_id) {
          const seller = await sellerAdaptor.retrieveOfflineSellerById(
              {sid: product.seller_id});
          await Promise.all([
            jobAdaptor.updateCashBackJobs({
              job_id: product.job_id, jobDetail: JSON.parse(JSON.stringify({
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
                seller_id: product.seller_id,
                cashback_status: 13,
                seller_status: 13,
                admin_status: request.payload.is_complete ? 4 : 2,
                digitally_verified: request.payload.digitally_verified,
                home_delivered: request.payload.home_delivered,
                verified_seller: seller && seller.seller_type_id === 1,
                non_verified_seller: seller && seller.seller_type_id === 2,
                online_seller: seller && seller.seller_type_id === 3,
                non_binbill_seller: seller && seller.seller_type_id === 4,
              })),
            }), shopEarnAdaptor.updateUserSKUExpenses({
              expense_id: product.id, options: JSON.parse(JSON.stringify({
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
                seller_id: product.seller_id,
              })),
            })]);
        } else {
          await Promise.all([
            jobAdaptor.updateCashBackJobs({
              job_id: product.job_id, jobDetail: JSON.parse(JSON.stringify({
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
                cashback_status: 13,
                seller_status: 13,
                admin_status: request.payload.is_complete ? 4 : 2,
                digitally_verified: request.payload.digitally_verified,
                home_delivered: request.payload.home_delivered,
              })),
            }), shopEarnAdaptor.updateUserSKUExpenses({
              expense_id: product.id, options: JSON.parse(JSON.stringify({
                user_id: user.id || user.ID,
                updated_by: user.id || user.ID,
              })),
            })]);
        }

        return reply.response({
          status: true, product,
          message: 'Product updated successfully.',
        });
      } else {
        return shared.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update product or job.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async updateExpenseSKUs(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        let {job_id, sku_items} = request.payload;
        const cashback_job = await jobAdaptor.retrieveCashBackJobs({job_id});
        if (cashback_job) {
          sku_items = sku_items.map(item => {
            item.job_id = cashback_job.id;
            item.expense_id = request.params.product_id;
            item.user_id = user.id || user.ID;
            item.updated_by = user.id || user.ID;
            item.status_type = 11;
            return item;
          });

          return reply.response({
            status: true,
            sku_expenses: await shopEarnAdaptor.addUserSKUExpenses(sku_items),
          });
        }

        return reply.response({
          status: false,
          message: 'No Cash back Job found for current operation.',
        });
      } else {
        return shared.preValidation(request.pre, reply);
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update link sku with expense.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }
}

export default ShopEarnController;
