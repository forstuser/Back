/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import ShopEarnAdaptor from '../Adaptors/shop_earn';
import moment from 'moment/moment';
import Promise from 'bluebird';
import JobAdaptor from '../Adaptors/job';
import ProductAdaptor from '../Adaptors/product';
import SellerAdaptor from '../Adaptors/sellers';
import CategoryAdaptor from '../Adaptors/category';
import _ from 'lodash';

let modals;
let shopEarnAdaptor;
let jobAdaptor;
let productAdaptor;
let sellerAdaptor;
let categoryAdaptor;

class ShopEarnController {
  constructor(modal, socket) {
    shopEarnAdaptor = new ShopEarnAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal, socket);
    productAdaptor = new ProductAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    categoryAdaptor = new CategoryAdaptor(modal);
    modals = modal;
  }

  static async getSKUs(request, reply) {
    let user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const result = await modals.user_index.findOne({
          where: {user_id: (user.id || user.ID)}, attributes: [
            [
              modals.sequelize.literal(
                  '(Select location from users as "user" where "user".id = "user_index".user_id)'),
              'location'], 'my_seller_ids',
            ['user_id', 'id']],
        });
        user = result ? result.toJSON() : user;
        const [sku_result, seller_list] = await Promise.all([
          shopEarnAdaptor.retrieveSKUs({
            location: user.location, user_id: user.id,
            queryOptions: request.query,
          }),
          user.my_seller_ids ?
              sellerAdaptor.retrieveSellersOnInit({
                where: {id: user.my_seller_ids},
                attributes: ['id', 'seller_name', 'seller_type_id', 'address'],
              }) :
              undefined]);
        return reply.response({
          status: true,
          result: sku_result, seller_list,
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
          message: 'Unable to retrieve Cash back details',
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
        const result = await shopEarnAdaptor.retrieveWalletDetails(
            {user_id: (user.id || user.ID)});
        return reply.response({
          status: true,
          total_cashback: _.sumBy(
              result.filter(item => item.transaction_type === 1), 'amount') -
              _.sumBy(result.filter(
                  item => (item.status_type === 14 || item.transaction_type ===
                      2) && item.is_paytm),
                  /*Only amount redeemed on payTM will be subtracted not all*/
                  'amount'),
          result,
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
              purchase_cost: request.payload.value,
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
              {id: product.seller_id});
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

  static async cashBackApproval(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        let {seller_id, id} = request.params;
        const utcOffset = 330;
        const seller_cashback = await jobAdaptor.retrieveSellerCashBack({
          where: {seller_id, id, status_type: 13}, attributes: [
            'job_id', 'id', 'user_id', 'amount', [
              modals.sequelize.literal(
                  `(Select id from table_wallet_user_cashback as user_cashback where user_cashback.user_id = cashback_wallet.user_id and user_cashback.amount = cashback_wallet.amount and user_cashback.job_id = cashback_wallet.job_id)`),
              'user_cashback_id'], 'status_type', 'created_at'],
        });
        if (seller_cashback) {
          const startOfMonth = moment(seller_cashback.created_at).
              startOf('month').utcOffset(utcOffset).format();
          const endOfMonth = moment(seller_cashback.created_at).
              endOf('month').utcOffset(utcOffset).format();
          const startOfDay = moment(seller_cashback.created_at).
              startOf('day').utcOffset(utcOffset).format();
          const endOfDay = moment(seller_cashback.created_at).
              endOf('day').utcOffset(utcOffset).format();
          const [cash_back_job, user_cash_back_month, user_cash_back_day, user_limit_rules, user_default_limit_rules] = await Promise.all(
              [
                jobAdaptor.retrieveCashBackJobs({id: seller_cashback.job_id}),
                jobAdaptor.retrieveUserCashBack({
                  where: {
                    user_id: seller_cashback.user_id,
                    status_type: [16], created_at: {
                      $between: [startOfMonth, endOfMonth],
                    },
                  }, attributes: [
                    [
                      modals.sequelize.literal('sum(amount)'),
                      'total_amount']], group: 'user_id',
                }), jobAdaptor.retrieveUserCashBack({
                where: {
                  user_id: seller_cashback.user_id,
                  status_type: [16], created_at: {
                    $between: [startOfDay, endOfDay],
                  },
                }, attributes: [
                  [
                    modals.sequelize.literal('sum(amount)'),
                    'total_amount']], group: 'user_id',
              }), categoryAdaptor.retrieveLimitRules(
                  {where: {user_id: seller_cashback.user_id}}),
                categoryAdaptor.retrieveLimitRules({where: {user_id: 1}}),
              ]);

          const cash_back_month = user_cash_back_month ?
              user_cash_back_month.total_amount : 0;
          const cash_back_day = user_cash_back_day ?
              user_cash_back_day.total_amount :
              0;
          const {verified_seller, digitally_verified, home_delivered} = cash_back_job;

          return reply.response({
            status: true,
            result: await jobAdaptor.cashBackApproval(
                {
                  cash_back_month,
                  user_limit_rules,
                  user_default_limit_rules,
                  cash_back_day,
                  verified_seller,
                  digitally_verified,
                  seller_id,
                  transaction_type: 1,
                  cashback_source: 1,
                  job_id: seller_cashback.job_id,
                  home_delivered,
                  job: cash_back_job,
                  amount: seller_cashback.amount,
                }),
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.',
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
        message: 'Unable to approve cash back.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async rejectCashBack(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        let {seller_id, id} = request.params;
        const {reason_id} = request.payload;
        const seller_cashback = await jobAdaptor.retrieveSellerCashBack({
          where: {seller_id, id, status_type: 13}, attributes: [
            'job_id', 'id', 'user_id', 'amount', [
              modals.sequelize.literal(
                  `(Select id from table_wallet_user_cashback as user_cashback where user_cashback.user_id = cashback_wallet.user_id and user_cashback.amount = cashback_wallet.amount and user_cashback.job_id = cashback_wallet.job_id)`),
              'user_cashback_id'], 'status_type', 'created_at'],
        });
        if (seller_cashback) {
          const {job_id} = seller_cashback;
          const cash_back_job = await jobAdaptor.retrieveCashBackJobs(
              {id: seller_cashback.job_id});

          const {verified_seller, digitally_verified, home_delivered} = cash_back_job;
          return reply.response({
            status: true,
            result: await Promise.all([
              jobAdaptor.approveSellerCashBack(
                  {job_id, status_type: 18, seller_id}),
              jobAdaptor.approveUserCashBack(
                  {job_id, status_type: 18, seller_id}),
              jobAdaptor.updateCashBackJobs(
                  {id: job_id, seller_status: 18, reason_id, seller_id}),
              home_delivered ?
                  jobAdaptor.approveHomeDeliveryCashback(
                      {job_id, status_type: 18, seller_id}) :
                  '']),
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.',
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
        message: 'Unable to approve cash back.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async redeemCashBackAtSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const {id: user_id, mobile_no, email} = user;
        let {seller_id} = request.params;
        const {cashback_ids: id} = request.payload;
        const seller_cashback = await jobAdaptor.retrieveSellerCashBacks({
          where: {seller_id, id, status_type: 16}, attributes: [
            'job_id', 'id', 'user_id', 'amount', [
              modals.sequelize.literal(
                  `(Select id from table_wallet_user_cashback as user_cashback where user_cashback.seller_id = cashback_wallet.seller_id and user_cashback.user_id = cashback_wallet.user_id and user_cashback.amount = cashback_wallet.amount and user_cashback.job_id = cashback_wallet.job_id)`),
              'user_cashback_id'], 'status_type', 'created_at'],
        });
        if (seller_cashback) {
          return reply.response({
            status: true,
            redeemed_amount: _.sumBy(seller_cashback, 'amount'),
            result: await jobAdaptor.cashBackRedemption(
                JSON.parse(JSON.stringify({
                  seller_id, transaction_type: 2,
                  seller_cashback_id: seller_cashback.map(item => item.id),
                  user_cashback_id: seller_cashback.map(
                      item => item.user_cashback_id),
                  job_id: seller_cashback.map(item => item.job_id),
                  user_id, mobile_no, email, seller_cashback,
                  amount: seller_cashback.map(item => item.amount),
                }))),
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.',
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
        message: 'Unable to approve cash back.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async redeemLoyaltyAtSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const {id: user_id, mobile_no, email} = user;
        let {seller_id} = request.params;
        let {amount} = request.payload;
        let [seller_default_loyalty_rules, seller_loyalty_rules] = await Promise.all(
            [
              modals.loyalty_rules.findOne({where: {seller_id}}),
              modals.loyalty_rules.findOne({where: {seller_id, user_id}})]);
        if (!seller_default_loyalty_rules) {
          return reply.response({
            status: false,
            message: `Seller don't have any rules yet.`,
          });
        }
        const loyalty_rules = seller_loyalty_rules ?
            seller_loyalty_rules.toJSON() :
            seller_default_loyalty_rules.toJSON();
        const seller_loyalties = await jobAdaptor.retrieveSellerLoyalties({
          where: {seller_id, status_type: 16, user_id}, attributes: [
            'job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at'],
        });

        if (seller_loyalties) {
          const total_points = _.sumBy(seller_loyalties, 'amount');
          if (total_points < loyalty_rules.minimum_points) {
            return reply.response({
              status: false,
              message: `You doesn't have efficient loyalty points to redeem at this seller.`,
            });
          }

          if (total_points < amount) {
            return reply.response({
              status: false,
              message: `You have lesser point than you requested.`,
              total_points,
            });
          }

          return reply.response({
            status: true,
            redeemed_amount: amount,
            result: await jobAdaptor.addLoyaltyToSeller(
                JSON.parse(JSON.stringify({
                  seller_id, transaction_type: 2, user_id,
                  amount, status_type: 14,
                }))),
          });
        }

        return reply.response({
          status: false,
          message: 'Loyalty points not available for requested seller.',
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
        message: 'Unable to redeem loyalty points.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async redeemCashBackAtPayTM(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (!request.pre.forceUpdate) {
        const {id: user_id, mobile_no, email} = user;
        const user_cashback = await jobAdaptor.retrieveUserCashBacks({
          where: {
            user_id, $or: {
              status_type: 16,
              $and: {status_type: 14, is_paytm: true},
            },
          }, attributes: [
            'job_id', 'id', 'user_id', 'amount', 'status_type', 'created_at'],
        });
        if (user_cashback) {
          const redeemed_amount = _.sumBy(
              user_cashback.filter(item => item.status_type === 16), 'amount') -
              _.sumBy(user_cashback.filter(item => item.status_type === 14),
                  'amount');
          return reply.response({
            status: true,
            redeemed_amount,
            result: await jobAdaptor.cashBackRedemptionAtPayTM(
                JSON.parse(JSON.stringify({
                  transaction_type: 2,
                  user_cashback_id: user_cashback.map(item => item.id),
                  job_id: user_cashback.map(item => item.job_id),
                  user_id, mobile_no, email, seller_cashback: user_cashback,
                  amount: redeemed_amount,
                }))),
          });
        }

        return reply.response({
          status: false,
          message: 'Cash Back not available for request parameters.',
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
        message: 'Unable to redeem cash back at PayTM.',
        forceUpdate: request.pre.forceUpdate,
        err,
      }).code(200);
    }
  }

  static async retrieveTransactions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      try {
        const {seller_id} = request.params;
        const result = await shopEarnAdaptor.retrievePendingTransactions(
            {seller_id});
        return reply.response({
          status: true,
          reasons: await categoryAdaptor.retrieveRejectReasons({}),
          result: result.filter(
              item => item.pending_cashback && item.cashback_id),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
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
          message: 'Unable to retrieve transactions',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async retrieveSKUMeasurements(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.forceUpdate) {
      try {
        const {sku_id} = request.params;
        return reply.response({
          status: true,
          result: await shopEarnAdaptor.retrieveSKUMeasurements({sku_id}),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
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
          message: 'Unable to retrieve SKU measurement details',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }
}

export default ShopEarnController;
