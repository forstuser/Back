/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import ShopEarnAdaptor from '../Adaptors/shop_earn';
import JobAdaptor from '../Adaptors/job';
import UserAdaptor from '../Adaptors/user';
import SellerAdaptor from '../Adaptors/sellers';
import GoogleHelper from '../../helpers/google';
import GeneralAdaptor from '../Adaptors/category';
import Promise from 'bluebird';
import config from '../../config/main';
import _ from 'lodash';
import {sendSMS} from '../../helpers/sms';

let modals, shopEarnAdaptor, jobAdaptor, userAdaptor, sellerAdaptor,
    generalAdaptor;

class SellerController {
  constructor(modal) {
    shopEarnAdaptor = new ShopEarnAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    generalAdaptor = new GeneralAdaptor(modal);
    modals = modal;
  }

  static async getMySellers(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: {user_id},
          attributes: [
            'my_seller_ids', 'seller_offer_ids', 'wallet_seller_cashback_ids',
            'wallet_seller_credit_ids', 'wallet_seller_loyalty_ids'],
        });

        let {search_value, limit, offset, latitude, longitude, city} = request.query ||
        {};
        const {seller_offer_ids, my_seller_ids: id, wallet_seller_cashback_ids, wallet_seller_credit_ids, wallet_seller_loyalty_ids} = user_index_data ||
        {};
        search_value = search_value || '';
        let contact_no, seller_name = {
          $or: {},
        };
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await GoogleHelper.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellers(
              {
                user_id, seller_offer_ids, limit, offset,
                latitude, longitude, city,
              }, {
                where: JSON.parse(JSON.stringify({
                  id, $or: {seller_name, contact_no},
                })),
                attributes: [
                  'id',
                  ['seller_name', 'name'],
                  'owner_name',
                  'seller_details',
                  'gstin',
                  'pan_no',
                  'reg_no',
                  'is_service',
                  'is_onboarded',
                  'address',
                  'city_id',
                  'state_id',
                  'locality_id',
                  'latitude',
                  'longitude',
                  'url',
                  'contact_no',
                  'email',
                  'seller_type_id',
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_cashback_ids &&
                        wallet_seller_cashback_ids.length > 0 ?
                            `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where seller_cashback.id in (${(wallet_seller_cashback_ids ||
                                []).join(
                                ',')}) status_type in (16) and transaction_type = 1 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")` :
                            0}`),
                    'cashback_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_cashback_ids &&
                        wallet_seller_cashback_ids.length > 0 ?
                            `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where seller_cashback.id in (${(wallet_seller_cashback_ids ||
                                []).join(
                                ',')}) status_type in (16) and transaction_type = 2 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")` :
                            0}`),
                    'redeemed_cashback'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_loyalty_ids &&
                        wallet_seller_loyalty_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where seller_loyalty.id in (${(wallet_seller_loyalty_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")` :
                            0}`), 'loyalty_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_loyalty_ids &&
                        wallet_seller_loyalty_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where seller_loyalty.id in (${(wallet_seller_loyalty_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 2 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")` :
                            0}`), 'redeemed_loyalty'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_credit_ids &&
                        wallet_seller_credit_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.id in (${(wallet_seller_credit_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")` :
                            0}`), 'credit_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_credit_ids &&
                        wallet_seller_credit_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.id in (${(wallet_seller_credit_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")` :
                            0}`), 'redeemed_credits'],
                  [
                    modals.sequelize.literal(
                        `${seller_offer_ids && seller_offer_ids.length > 0 ?
                            `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids ||
                                []).join(
                                ',')}) and seller_offers.seller_id = "sellers"."id")` :
                            0}`), 'offer_count'],
                  [
                    modals.sequelize.literal(
                        `(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`),
                    'ratings']],
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
          message: 'Unable to retrieve seller list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getSellers(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: {user_id, status_type: [1, 11]},
          attributes: [
            'my_seller_ids', 'seller_offer_ids', 'wallet_seller_cashback_ids',
            'wallet_seller_credit_ids', 'wallet_seller_loyalty_ids'],
        });
        let {my_seller_ids, seller_offer_ids, wallet_seller_cashback_ids, wallet_seller_credit_ids, wallet_seller_loyalty_ids} = user_index_data ||
        {};
        let {search_value, limit, offset, latitude, longitude, city} = request.query ||
        {};
        search_value = search_value || '';
        let contact_no, seller_name = {$or: {}};
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await GoogleHelper.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;

        return reply.response({
          status: true,
          result: await sellerAdaptor.retrieveSellers(
              {
                user_id, seller_offer_ids, latitude, longitude,
                limit, city, offset,
              }, {
                where: JSON.parse(JSON.stringify({
                  $or: {seller_name, contact_no},
                  status_type: [1, 11],
                })),
                attributes: [
                  'id',
                  ['seller_name', 'name'],
                  'owner_name',
                  'seller_details',
                  'gstin',
                  'pan_no',
                  'reg_no',
                  'is_service',
                  'is_onboarded',
                  'address',
                  'city_id',
                  'state_id',
                  'locality_id',
                  'latitude',
                  'longitude',
                  'url',
                  'contact_no',
                  'email',
                  'seller_type_id',
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_cashback_ids &&
                        wallet_seller_cashback_ids.length > 0 ?
                            `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where seller_cashback.id in (${(wallet_seller_cashback_ids ||
                                []).join(
                                ',')}) status_type in (16) and transaction_type = 1 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")` :
                            0}`),
                    'cashback_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_cashback_ids &&
                        wallet_seller_cashback_ids.length > 0 ?
                            `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where seller_cashback.id in (${(wallet_seller_cashback_ids ||
                                []).join(
                                ',')}) status_type in (16) and transaction_type = 2 and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")` :
                            0}`),
                    'redeemed_cashback'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_loyalty_ids &&
                        wallet_seller_loyalty_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where seller_loyalty.id in (${(wallet_seller_loyalty_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")` :
                            0}`), 'loyalty_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_loyalty_ids &&
                        wallet_seller_loyalty_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where seller_loyalty.id in (${(wallet_seller_loyalty_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 2 and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")` :
                            0}`), 'redeemed_loyalty'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_credit_ids &&
                        wallet_seller_credit_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.id in (${(wallet_seller_credit_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 1 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")` :
                            0}`), 'credit_total'],
                  [
                    modals.sequelize.literal(
                        `${wallet_seller_credit_ids &&
                        wallet_seller_credit_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.id in (${(wallet_seller_credit_ids ||
                                []).join(
                                ',')}) and status_type in (16) and transaction_type = 2 and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")` :
                            0}`), 'redeemed_credits'],
                  [
                    modals.sequelize.literal(
                        `${seller_offer_ids && seller_offer_ids.length > 0 ?
                            `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids ||
                                []).join(
                                ',')}) and seller_offers.seller_id = "sellers"."id")` :
                            0}`), 'offer_count'],
                  [
                    modals.sequelize.literal(
                        `(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`),
                    'ratings']],
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
          message: 'Unable to fetch seller list',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getSellerById(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const user_index_data = await userAdaptor.retrieveUserIndexedData({
          where: {user_id},
          attributes: [
            'my_seller_ids', 'seller_offer_ids', 'wallet_seller_credit_ids',
            'wallet_seller_loyalty_ids', 'wallet_seller_cashback_ids'],
        });

        let {search_value, limit, offset, latitude, longitude, city} = request.query ||
        {};
        const {seller_offer_ids, wallet_seller_loyalty_ids, wallet_seller_credit_ids, wallet_seller_cashback_ids} = user_index_data ||
        {};
        const {id} = request.params;
        search_value = search_value || '';
        let contact_no, seller_name = {
          $or: {},
        };
        const reg = /^\d+$/;
        if (reg.test(search_value)) {
          const result = await GoogleHelper.isValidPhoneNumber(search_value);
          if (result) {
            contact_no = search_value;
          } else {
            seller_name.$or.$eq = search_value;
          }
        }
        seller_name.$or.$iLike = `%${search_value}%`;

        let seller_payment_modes = (config.SELLER_PAYMENT_MODES || '').split(
            ',');
        return reply.response({
          status: true,
          payment_modes: seller_payment_modes.map(item => {
            item = item.split('|');
            return {id: item[1], title: item[0].split('_').join(' ')};
          }),
          result: await sellerAdaptor.retrieveSellerById(
              {user_id, seller_offer_ids, latitude, longitude, city}, {
                where: JSON.parse(JSON.stringify({
                  id, $or: {seller_name, contact_no},
                })),
                attributes: [
                  'id', ['seller_name', 'name'], 'owner_name',
                  'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded',
                  'address', 'city_id', 'state_id', 'locality_id', 'latitude',
                  'longitude', 'url', 'contact_no', 'email', 'seller_type_id',
                  'seller_details', [
                    modals.sequelize.literal(
                        `${wallet_seller_cashback_ids &&
                        wallet_seller_cashback_ids.length > 0 ?
                            `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where seller_cashback.id in (${(wallet_seller_cashback_ids ||
                                []).join(
                                ',')}) status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id")` :
                            0}`),
                    'cashback_total'], [
                    modals.sequelize.literal(
                        `${wallet_seller_loyalty_ids &&
                        wallet_seller_loyalty_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where seller_loyalty.id in (${(wallet_seller_loyalty_ids ||
                                []).join(
                                ',')}) and status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id")` :
                            0}`), 'loyalty_total'], [
                    modals.sequelize.literal(
                        `${wallet_seller_credit_ids &&
                        wallet_seller_credit_ids.length > 0 ?
                            `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.id in (${(wallet_seller_credit_ids ||
                                []).join(
                                ',')}) and status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id")` :
                            0}`), 'credit_total'], [
                    modals.sequelize.literal(
                        `${seller_offer_ids && seller_offer_ids.length > 0 ?
                            `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids ||
                                []).join(
                                ',')}) and seller_offers.seller_id = "sellers"."id")` :
                            0}`), 'offer_count'],
                  [
                    modals.sequelize.literal(
                        `(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = "sellers"."id")`),
                    'ratings']],
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
          message: 'Unable to retrieve seller.',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async linkSellerWithUser(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_index_data, seller_exist] = await Promise.all([
          userAdaptor.retrieveUserIndexedData({
            where: {user_id, status_type: [1, 11]},
            attributes: ['my_seller_ids', 'seller_offer_ids'],
          }), sellerAdaptor.doesSellerExist({id: request.params.id})]);
        if (seller_exist) {
          let {seller_offer_ids, my_seller_ids} = user_index_data || {};

          my_seller_ids = (my_seller_ids || []);
          const already_in_list = my_seller_ids.includes(
              parseInt(request.params.id));
          if (!user_index_data) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.createUserIndexedData({my_seller_ids, user_id},
                {where: {user_id}});

          } else if (!already_in_list) {
            my_seller_ids.push(parseInt(request.params.id));
            await userAdaptor.updateUserIndexedData({my_seller_ids},
                {where: {user_id}});
          } else {

            return reply.response({
              status: false,
              message: 'Seller already in your list.',
            });
          }

          return reply.response({
            status: true,
            result: (await sellerAdaptor.retrieveSellers(
                {user_id, seller_offer_ids}, {
                  where: JSON.parse(JSON.stringify({id: request.params.id})),
                  attributes: [
                    'id', ['seller_name', 'name'], 'owner_name',
                    'gstin', 'pan_no', 'reg_no', 'is_service', 'is_onboarded',
                    'address', 'city_id', 'state_id', 'locality_id', 'latitude',
                    'longitude', 'url', 'contact_no', 'email', 'seller_type_id',
                    modals.sequelize.literal(
                        `(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and seller_cashback.user_id = ${user_id} and seller_cashback.seller_id = "sellers"."id") as cashback_total,(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and seller_loyalty.user_id = ${user_id} and seller_loyalty.seller_id = "sellers"."id") as loyalty_total,(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and seller_credit.user_id = ${user_id} and seller_credit.seller_id = "sellers"."id") as credit_total, ${seller_offer_ids &&
                        seller_offer_ids.length > 0 ?
                            `(select count(*) from table_seller_offers as seller_offers where status_type in (1) and seller_offers.id in (${(seller_offer_ids ||
                                []).join(
                                ',')}) and seller_offers.seller_id = "sellers"."id")` :
                            0} as offer_count,(select AVG(seller_reviews.review_ratings) from table_seller_reviews as seller_reviews where seller_reviews.offline_seller_id = id) as ratings`)],
                }))[0],
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid Seller selected.',
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
          message: `Unable to link seller`,
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async unLinkSellerWithUser(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        const [user_index_data] = await Promise.all([
          userAdaptor.retrieveUserIndexedData({
            where: {user_id, status_type: [1, 11]},
            attributes: ['my_seller_ids', 'seller_offer_ids'],
          })]);

        let {seller_offer_ids, my_seller_ids} = user_index_data || {};
        my_seller_ids = (my_seller_ids || []).filter(
            item => item !== parseInt(request.params.id));
        await userAdaptor.updateUserIndexedData({my_seller_ids},
            {where: {user_id}});

        return reply.response({
          status: true,
          message: 'Seller removed from my seller list.',
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
          message: `Unable to un link seller`,
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async addInviteSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const user_id = user.id || user.ID;
        let {
          seller_name, contact_no, email, address, city_id, state_id, locality_id, gstin,
          pan_no, reg_no, longitude, latitude,
        } = request.payload || {};
        const seller_options = {
          $or: {$and: {seller_name: {$iLike: seller_name || ''}}},
        };
        if (contact_no && contact_no.trim()) {
          seller_options.$or.$and.contact_no = contact_no.trim();
        }

        if (email && email.trim()) {
          seller_options.$or.$and.email = {
            $iLike: email.trim(),
          };
        }
        const message = `Hello Seller, We are glad to invite you to get on board on BinBill and maintain a healthy relationship with your user.`;
        const [user_index_data, seller] = await Promise.all([
          userAdaptor.retrieveUserIndexedData({
            where: {user_id, status_type: [1, 11]},
            attributes: ['my_seller_ids', 'seller_offer_ids'],
          }), sellerAdaptor.retrieveOrCreateSellers(
              seller_options, JSON.parse(JSON.stringify({
                seller_name, contact_no, email, address, city_id,
                status_type: 11, state_id, locality_id, gstin,
                updated_by: user_id, created_by: user_id, pan_no,
                reg_no, longitude, latitude, seller_type_id: 4,
              }))), sendSMS(message, [contact_no])]);

        let {seller_offer_ids, my_seller_ids} = user_index_data || {};

        my_seller_ids = (my_seller_ids || []);
        const already_in_list = my_seller_ids.includes(
            parseInt(seller.id));
        if (!user_index_data) {
          my_seller_ids.push(parseInt(seller.id));
          await userAdaptor.createUserIndexedData({my_seller_ids, user_id},
              {where: {user_id}});

        } else if (!already_in_list) {
          my_seller_ids.push(parseInt(seller.id));
          await userAdaptor.updateUserIndexedData({my_seller_ids},
              {where: {user_id}});
        } else {
          return reply.response({
            status: false,
            message: 'Seller already in your list.',
          });
        }

        return reply.response({
          status: true,
          result: seller,
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
          message: `Unable to link seller`,
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async initializeSeller(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      let {gstin, pan: pan_no, email} = request.payload || {};
      let {id, mobile_no} = token_user;

      let seller_updates = JSON.parse(JSON.stringify({
        gstin, pan_no, contact_no: mobile_no, email, seller_type_id: 2
        , status_type: 1, created_by: 1, updated_by: 1, user_id: id,
      }));
      let [user, seller_detail] = await Promise.all([
        userAdaptor.retrieveSellerUser(
            {where: JSON.parse(JSON.stringify({id, mobile_no, email}))}),
        sellerAdaptor.retrieveSellersOnInit(
            {
              where: JSON.parse(
                  JSON.stringify(
                      {$or: {gstin, pan_no, contact_no: mobile_no, email}})),
            })]);
      if (!seller_detail || seller_detail.length === 0) {
        const gst_detail = await (gstin ?
            GoogleHelper.isValidGSTIN(gstin) : true);

        if (!gst_detail) {
          console.log(`GSTIN number ${gstin} is not a valid`);
          replyObject.status = false;
          replyObject.message = 'Invalid GST number.';
          return reply.response(replyObject);
        }
        seller_detail = await sellerAdaptor.retrieveOrUpdateSellerDetail(
            {
              where: JSON.parse(
                  JSON.stringify(
                      {$or: {gstin, pan_no, contact_no: mobile_no, email}})),
            },
            seller_updates, true);
      }
      replyObject.mobile_no = mobile_no;
      replyObject.seller_detail = JSON.parse(
          JSON.stringify(seller_detail || seller_updates || {}));
      if (user) {
        replyObject.name = user.name;
        replyObject.image_url = user.image_url;
        return reply.response(JSON.parse(JSON.stringify(replyObject))).
            code(201);
      } else {
        return reply.response(JSON.parse(JSON.stringify(replyObject))).
            code(201);
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
        message: 'Unable to initialize seller.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async createLinkSeller(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      let {gstin, pan} = request.payload || {};
      let {id, mobile_no, email} = token_user;

      let seller_updates = JSON.parse(JSON.stringify(
          {gstin, pan, user_id: id, contact_no: mobile_no, email}));

      let seller_detail = await sellerAdaptor.createSellerOnInit(
          seller_updates);
      replyObject.mobile_no = mobile_no;
      replyObject.seller_detail = JSON.parse(
          JSON.stringify(seller_detail || seller_updates || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to create or link seller with user.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateLinkSeller(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      let {gstin, pan, id} = request.payload || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;

      let seller_updates = JSON.parse(
          JSON.stringify({gstin, pan, user_id, contact_no, email}));

      let seller_detail = await sellerAdaptor.retrieveOrUpdateSellerDetail(
          {where: JSON.parse(JSON.stringify({$or: {gstin, pan}, id}))},
          seller_updates, true);
      replyObject.mobile_no = mobile_no;
      replyObject.seller_detail = JSON.parse(
          JSON.stringify(seller_detail || seller_updates || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to link seller with user.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveReferenceData(request, reply) {
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      let {data_required} = request.query;
      console.log(data_required);
      data_required = !(!!data_required && data_required.toLowerCase() ===
          'false');
      let [states, provider_types, seller_data, assisted_service_types] = await Promise.all(
          [
            generalAdaptor.retrieveStates(
                {
                  where: {id: {$notIn: [0]}},
                  attributes: ['id', 'state_name'],
                }), sellerAdaptor.retrieveProviderTypes(
              {attributes: ['id', 'title', 'description']}),
            token_user ? sellerAdaptor.retrieveSellerDetail({
              where: {user_id: token_user.id},
              attributes: [
                'id', 'seller_details', 'is_onboarded',
                'gstin', 'pan_no'],
            }) : {},
            data_required ? sellerAdaptor.retrieveAssistedServiceTypes(
                {attributes: ['id', 'title', 'description']}) : []]);
      const {is_onboarded, seller_details, gstin, pan_no, id} = seller_data ||
      {is_onboarded: false};
      const {basic_details, business_details} = seller_details || {};
      const image_type_ref = (config.SELLER_BUSINESS_IMAGE_TYPES || '').split(
          ',').map(item => {
        item = item.split('|');
        return {id: item[1], title: item[0].split('_').join(' ')};
      });
      const image_map_ref = config.SELLER_BUSINESS_IMAGE_MAP.split(',').
          map(item => {
            item = item.split('-');
            const image_type_ids = item[1].split('|') || [1];
            return {
              id: item[0], image_types: image_type_ids.map(imageItem => {
                return image_type_ref.find(itItem => itItem.id === imageItem);
              }),
            };
          });
      let categories;
      if (basic_details && basic_details.category_id && business_details) {
        categories = await generalAdaptor.retrieveCategories({
          options: {ref_id: basic_details.category_id},
          isSubCategoryRequiredForAll: true,
        });
      }
      let seller_categories = (config.SELLER_CATEGORIES || '').split(',');
      let seller_payment_modes = (config.SELLER_PAYMENT_MODES || '').split(',');
      let seller_business_types = (config.SELLER_BUSINESS_TYPES || '').split(
          ',');
      return reply.response(JSON.parse(JSON.stringify({
        status: true,
        is_onboarded,
        seller_id: id,
        next_step: (!gstin && !pan_no) ? 'fresh_seller' :
            !basic_details || (basic_details && !basic_details.is_complete) ?
                'basic_details' : !business_details ?
                'business_details' : 'dashboard',
        categories: data_required || !is_onboarded ? categories : undefined,
        main_category_id: (basic_details || {}).category_id,
        data: data_required || !is_onboarded ? {
          provider_types, states, categories: seller_categories.map(item => {
            item = item.split('|');
            return {id: item[1], title: item[0].split('_').join(' ')};
          }), payment_modes: seller_payment_modes.map(item => {
            item = item.split('|');
            return {id: item[1], title: item[0].split('_').join(' ')};
          }), business_types: seller_business_types.map(item => {
            item = item.split('|');
            item = {id: item[1], title: item[0].split('_').join(' ')};
            const image_maps = (image_map_ref.find(
                imageItem => item.id === imageItem.id));
            return {
              id: item.id, title: item.title.split('_').join(' '),
              image_types: (image_maps || {}).image_types,
            };
          }), assisted_service_types,
        } : undefined,
      })));
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
        message: 'Unable to retrieve reference data.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateSellerBasicDetail(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      let {seller_name, address, pincode, locality_id, city_id, state_id, business_name, category_id, shop_open_day, shop_open_timings, home_delivery, home_delivery_remarks, payment_modes} = request.payload ||
      {};
      const {id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      let seller_data = await sellerAdaptor.retrieveSellerDetail(
          {where: {id, user_id}});
      seller_name = seller_name || seller_data.seller_name;
      address = address || seller_data.address;
      pincode = pincode || seller_data.pincode;
      locality_id = locality_id || seller_data.locality_id;
      city_id = city_id || seller_data.city_id;
      state_id = state_id || seller_data.state_id;
      const seller_details = (seller_data.seller_details ||
          {basic_details: {documents: []}});
      const basic_details = seller_details.basic_details || {documents: []};
      basic_details.documents = basic_details.documents || [];
      basic_details.business_name = business_name ||
          basic_details.business_name;
      basic_details.category_id = category_id || basic_details.category_id;
      basic_details.shop_open_day = shop_open_day ||
          basic_details.shop_open_day;
      basic_details.shop_open_timings = shop_open_timings ||
          basic_details.shop_open_timings;
      basic_details.home_delivery = home_delivery ||
          basic_details.home_delivery;
      basic_details.home_delivery_remarks = home_delivery_remarks ||
          basic_details.home_delivery_remarks;
      basic_details.payment_modes = payment_modes ||
          basic_details.payment_modes;
      basic_details.is_complete = true;
      seller_details.basic_details = basic_details;
      let seller_updates = JSON.parse(JSON.stringify({
        seller_name, address, pincode, seller_details,
        locality_id, city_id, state_id,
      }));

      replyObject.seller_detail = JSON.parse(
          JSON.stringify(await sellerAdaptor.retrieveOrUpdateSellerDetail(
              {where: JSON.parse(JSON.stringify({id}))}, seller_updates,
              true) || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async linkCustomers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {seller_id, customer_id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      let seller_data = await sellerAdaptor.retrieveSellerDetail(
          {
            where: {id: seller_id, user_id},
            attributes: ['customer_ids', 'id'],
          });
      seller_data.customer_ids = (seller_data.customer_ids || []);
      seller_data.customer_ids.push(parseInt(customer_id));
      seller_data.customer_ids = _.uniq(seller_data.customer_ids);
      replyObject.seller_detail = JSON.parse(
          JSON.stringify(await sellerAdaptor.retrieveOrUpdateSellerDetail(
              {where: JSON.parse(JSON.stringify({id: seller_id}))}, seller_data,
              true) || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async inviteCustomers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {mobile_no, full_name, email} = request.payload || {};
      const {seller_id} = request.params || {};
      let {id: user_id} = token_user;
      let [seller_data, user_data] = await Promise.all([
        sellerAdaptor.retrieveSellerDetail(
            {
              where: {id: seller_id, user_id},
              attributes: ['customer_ids', 'id'],
            }), userAdaptor.createUserForSeller(
            JSON.parse(JSON.stringify({mobile_no})), JSON.parse(
                JSON.stringify(
                    {
                      mobile_no, full_name, email,
                      user_status_type: 2, role_type: 5,
                    })))]);
      seller_data.customer_ids = (seller_data.customer_ids || []);
      seller_data.customer_ids.push(user_data.id);
      seller_data.customer_ids = _.uniq(seller_data.customer_ids);
      replyObject.seller_detail = JSON.parse(
          JSON.stringify(await sellerAdaptor.retrieveOrUpdateSellerDetail(
              {where: JSON.parse(JSON.stringify({id: seller_id}))}, seller_data,
              true) || {}));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller basic details.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateSellerProviderTypes(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: seller_id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      const seller_provider_types = await Promise.all(
          request.payload.provider_type_detail.map((item) => {
            const {provider_type_id, sub_category_id, category_4_id, brand_ids} = item;
            return sellerAdaptor.retrieveOrCreateSellerProviderTypes(JSON.parse(
                JSON.stringify(
                    {
                      provider_type_id, seller_id,
                      sub_category_id, category_4_id,
                    })),
                JSON.parse(JSON.stringify({
                  provider_type_id, seller_id, sub_category_id,
                  category_4_id, brand_ids,
                })));
          }));

      const seller = await sellerAdaptor.retrieveOrUpdateSellerDetail(
          {where: {id: seller_id}}, {is_onboarded: true}, false);
      replyObject.seller_provider_types = JSON.parse(
          JSON.stringify(seller_provider_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller provider types.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateAssistedServiceUsers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: seller_id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      let {name, mobile_no, id, document_details, service_type_detail, profile_image_detail} = request.payload;
      service_type_detail = (service_type_detail || [{}]).map(item => {
        item.seller_id = seller_id;
        return item;
      });
      const seller_service_types = await sellerAdaptor.retrieveOrCreateAssistedServiceUsers(
          JSON.parse(JSON.stringify({name, id, mobile_no})),
          JSON.parse(JSON.stringify({
            name, mobile_no, document_details, profile_image_detail,
            seller_id,
          })), JSON.parse(JSON.stringify(service_type_detail)));

      replyObject.seller_service_types = JSON.parse(
          JSON.stringify(seller_service_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateAssistedServiceTypes(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: service_user_id, seller_id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      let {service_type_id, price, id} = request.payload;
      const seller_service_types = await sellerAdaptor.retrieveOrCreateSellerAssistedServiceTypes(
          JSON.parse(JSON.stringify({id, service_user_id, seller_id})),
          JSON.parse(JSON.stringify({
            service_type_id, price, seller_id, service_user_id,
          })));

      replyObject.seller_service_types = JSON.parse(
          JSON.stringify(seller_service_types));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateAssistedUserReview(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {seller_id, id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      request.payload.updated_by = user_id;
      const seller_service_types = await sellerAdaptor.updateAssistedUserReview(
          JSON.parse(JSON.stringify({id, seller_id})), request.payload);
      if (seller_service_types) {
        replyObject.seller_service_types = JSON.parse(
            JSON.stringify(seller_service_types));
        return reply.response(JSON.parse(JSON.stringify(replyObject))).
            code(201);
      }
      return reply.response({
        status: false,
        message: 'Assisted service user is not available.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
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
        message: 'Unable to update seller assisted services.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateSellerOffers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: seller_id} = request.params || {};
      let {id: user_id, mobile_no: contact_no, email} = token_user;
      const {start_date, end_date, title, description, id, document_details} = request.payload;
      const seller_offer = await sellerAdaptor.retrieveOrCreateSellerOffers(
          JSON.parse(JSON.stringify({id, seller_id})),
          JSON.parse(JSON.stringify(
              {
                seller_id, start_date, end_date, title,
                description, document_details,
              })));

      replyObject.seller_offer = JSON.parse(JSON.stringify(seller_offer));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller offers.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateSellerCredits(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: seller_id} = request.params || {};
      const {id, amount, transaction_type, consumer_id, description} = request.payload;
      const seller_credits = await sellerAdaptor.retrieveOrCreateSellerCredits(
          JSON.parse(
              JSON.stringify({id, user_id: consumer_id, seller_id})),
          JSON.parse(JSON.stringify(
              {
                id, amount, transaction_type, description,
                user_id: consumer_id, status_type: 16, seller_id,
              })));
      await userAdaptor.retrieveOrUpdateUserIndexedData({user_id: consumer_id},
          {credit_id: seller_credits.id, user_id: consumer_id});
      replyObject.seller_credits = JSON.parse(
          JSON.stringify(seller_credits));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller credits.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateSellerPoints(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {id: seller_id} = request.params || {};
      const {id, amount, transaction_type, consumer_id, description} = request.payload;
      const seller_points = await sellerAdaptor.retrieveOrCreateSellerPoints(
          JSON.parse(
              JSON.stringify({id, user_id: consumer_id, seller_id})),
          JSON.parse(JSON.stringify(
              {
                id, amount, transaction_type, description,
                user_id: consumer_id, status_type: 16, seller_id,
              })));

      await userAdaptor.retrieveOrUpdateUserIndexedData({user_id: consumer_id},
          {point_id: seller_points.id, user_id: consumer_id});
      replyObject.seller_points = JSON.parse(
          JSON.stringify(seller_points));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller points.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async publishSellerOffersToUsers(request, reply) {
    let replyObject = {
      status: true,
      message: 'success',
    };
    try {
      let token_user = shared.verifyAuthorization(request.headers);
      const {seller_id, id} = request.params || {};
      let user_indexes = await userAdaptor.retrieveUserIndexes({
        where: {user_id: request.payload.user_ids || []},
        attributes: ['seller_offer_ids', 'user_id', 'id'],
      });

      user_indexes = user_indexes || request.payload.user_ids.map(item => ({
        user_id: item, seller_offer_ids: [parseInt(id)],
        my_seller_ids: [seller_id],
      }));
      await Promise.all(user_indexes.map(item => {
        if (item.id) {
          item.seller_offer_ids = item.seller_offer_ids || [];
          item.seller_offer_ids.push(parseInt(id));
          item.seller_offer_ids = _.uniq(item.seller_offer_ids);
          return userAdaptor.updateUserIndexedData(item,
              {where: {user_id: item.user_id, id: item.id}});
        }

        return userAdaptor.createUserIndexedData(item,
            {where: {user_id: item.user_id}});
      }));
      replyObject.user_indexes = JSON.parse(
          JSON.stringify(await userAdaptor.retrieveUserIndexedData(
              {where: {user_id: request.payload.user_ids || []}})));
      return reply.response(JSON.parse(JSON.stringify(replyObject))).code(201);
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
        message: 'Unable to update seller offers.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async getCategoriesForSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const seller_data = await sellerAdaptor.retrieveSellerDetail({
          where: {user_id: user.id},
          attributes: [
            'id', 'seller_details', 'is_onboarded',
            'gstin', 'pan_no'],
        });

        const {seller_details} = seller_data || {};

        const {basic_details, business_details} = seller_details || {};
        let categories;
        if (basic_details && basic_details.category_id && business_details) {
          categories = await generalAdaptor.retrieveCategories({
            options: {ref_id: basic_details.category_id},
            isSubCategoryRequiredForAll: true,
          });

          return reply.response({
            status: true,
            message: 'Successful',
            categories,
            forceUpdate: request.pre.forceUpdate,
          });
        } else {
          return reply.response({
            status: false,
            message: 'Please select category.',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getAssistedServicesForSeller(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        const [service_types, seller_service_users] = await Promise.all([
          sellerAdaptor.retrieveAssistedServiceTypes({}),
          sellerAdaptor.retrieveSellerAssistedServiceUsers({
            include: {
              as: 'service_types', where: {seller_id},
              model: modals.seller_service_types, required: true,
              attributes: ['service_type_id', 'seller_id', 'price', 'id'],
            }, attributes: [
              'id', 'name', 'mobile_no', 'reviews',
              'document_details', 'profile_image_detail'],
          })]);

        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_service_users.map(item => {
            item.rating = (_.sumBy(item.reviews || [{rating: 0}], 'rating')) /
                (item.reviews || [{rating: 0}]).length;
            item.service_types = item.service_types.map(typeItem => {
              const service_type = service_types.find(
                  stItem => stItem.id === typeItem.service_type_id);
              typeItem.service_type = (service_type || {}).title;
              return typeItem;
            });

            return item;
          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to retrieve assisted services for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerOffers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerOffers({
            where: {seller_id},
            attributes: [
              'id', 'seller_id', 'title',
              'description', 'start_date', 'end_date', 'document_details'],
          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerCreditsPerUser({
            where: {seller_id}, include: {
              model: modals.users, as: 'user', attributes: [
                'id', ['full_name', 'name'], 'image_name',
                'mobile_no', 'email'], required: true,
            }, order: [['user_id'], ['transaction_type']], group: [
              'user_id', modals.sequelize.literal('"user"."id"'),
              'transaction_type'], attributes: [
              'user_id', 'transaction_type',
              [modals.sequelize.literal('sum(amount)'), 'total_credit']],

          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerLoyaltyPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerLoyaltyPointsPerUser({
            where: {seller_id}, include: {
              model: modals.users, as: 'user', attributes: [
                'id', ['full_name', 'name'], 'image_name',
                'mobile_no', 'email'], required: true,
            }, order: [['user_id'], ['transaction_type']], group: [
              'user_id', modals.sequelize.literal('"user"."id"'),
              'transaction_type'], attributes: [
              'user_id', 'transaction_type',
              [modals.sequelize.literal('sum(amount)'), 'total_points']],

          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerConsumers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        const {mobile_no, offer_id, is_linked_offers, linked_only} = request.query ||
        {};
        const seller_customers = await sellerAdaptor.retrieveSellerConsumers(
            seller_id, mobile_no, offer_id);
        return reply.response({
          status: true,
          message: 'Successful',
          result: offer_id ?
              is_linked_offers && is_linked_offers === 'false' ?
                  seller_customers.filter(item => !item.linked_offer) :
                  seller_customers.filter(item => item.linked_offer) :
              mobile_no || !linked_only ? seller_customers :
                  seller_customers.filter(item => item.linked),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerConsumerDetails(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, customer_id} = request.params;
        const {mobile_no} = request.query || {};
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerCustomerDetail(seller_id,
              customer_id, mobile_no),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to retrieve users for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerConsumerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, customer_id} = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerCreditsPerUser({
            where: {seller_id, user_id: customer_id},
            attributes: [
              'title',
              'description',
              'transaction_type',
              'amount',
              'created_at'],
            order: [['created_at', 'desc']],
          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async updateSellerConsumerCredits(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, customer_id, credit_id, job_id} = request.params;
        const {description} = request.payload;
        const credit_wallet = await sellerAdaptor.retrieveOrCreateSellerCredits(
            {seller_id, id: credit_id, user_id: customer_id},
            {job_id, description});
        if (credit_wallet) {
          return reply.response({
            status: true,
            message: 'Successful',
            result: credit_wallet,
            forceUpdate: request.pre.forceUpdate,
          });
        }

        return reply.response({
          status: false,
          message: 'Unable to link credit with job.',
          forceUpdate: request.pre.forceUpdate,
        });
      }
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });

    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to link credit with job.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async updateSellerConsumerPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, customer_id, point_id, job_id} = request.params;
        const {description} = request.payload;
        const loyalty_wallet = await sellerAdaptor.retrieveOrCreateSellerPoints(
            {seller_id, id: point_id, user_id: customer_id},
            {job_id, description});
        if (loyalty_wallet) {
          return reply.response({
            status: true,
            message: 'Successful',
            result: loyalty_wallet,
            forceUpdate: request.pre.forceUpdate,
          });
        }

        return reply.response({
          status: false,
          message: 'Invalid identity of seller, customer and loyalty.',
          forceUpdate: request.pre.forceUpdate,
        });
      }
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });

    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to link loyalty points with job.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveSellerConsumerPoints(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, customer_id} = request.params;
        return reply.response({
          status: true,
          message: 'Successful',
          result: await sellerAdaptor.retrieveSellerLoyaltyPointsPerUser({
            where: {seller_id, user_id: customer_id},
            attributes: [
              'title',
              'description',
              'transaction_type',
              'amount',
              'created_at'],
            order: [['created_at', 'desc']],
          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: 1,
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
        message: 'Unable to retrieve offers for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async deleteAssistedServiceUsers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, id} = request.params;
        await sellerAdaptor.deleteSellerAssistedServiceUsers(
            {where: {seller_id, id}});

        return reply.response({
          status: true,
          message: 'Successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async deleteAssistedServiceTypes(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, service_user_id, id} = request.params;
        await sellerAdaptor.deleteSellerAssistedServiceTypes(
            {where: {seller_id, service_user_id, id}});

        return reply.response({
          status: true,
          message: 'Successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async deleteOffer(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, id} = request.params;
        await sellerAdaptor.deleteSellerOffers({where: {seller_id, id}});

        return reply.response({
          status: true,
          message: 'Successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Unable to delete selected assisted service.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getBrandsForSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        let category_id = (request.query.category_id || '').split(',');
        category_id = category_id.length > 0 ? category_id : undefined;
        const options = {
          status_type: 1, category_id,
        };
        const brand_id = await modals.sequelize.query(
            `Select distinct(brand_id) from brand_details where status_type = 1 and category_id in (${category_id.join(
                ',')})`);
        let result = await modals.brands.findAll({
          where: JSON.parse(JSON.stringify({
            status_type: 1,
            $or: [
              {
                category_ids: {
                  $contains: JSON.stringify(
                      category_id.map(
                          item => ({main_category_id: parseInt(item || 0)}))),
                },
              }, {
                category_ids: {
                  $contains: JSON.stringify(
                      category_id.map(
                          item => ({category_id: parseInt(item || 0)}))),
                },
              }, {
                category_ids: {
                  $contains: JSON.stringify(
                      category_id.map(
                          item => ({sub_category_id: parseInt(item || 0)}))),
                },
              }, {
                brand_id: brand_id[0].map(item => item.brand_id),
              }],
          })), include: [
            {
              model: modals.brandDetails,
              where: JSON.parse(JSON.stringify(options)),
              as: 'details',
              attributes: ['category_id'],
              required: false,
            },
          ], order: [['brand_name', 'ASC']],
          attributes: [
            ['brand_name', 'brandName'],
            ['brand_id', 'id'], 'category_ids'],
        });
        const brands = result.map(
            bItem => {
              bItem = bItem.toJSON();
              bItem.brand_categories = [];
              console.log(bItem);
              const category_ids = (bItem.category_ids ||
                  bItem.details);
              category_ids.forEach((cItem) => {
                if (cItem.main_category_id) {
                  bItem.brand_categories.push(
                      cItem.main_category_id.toString());
                }
                if (cItem.category_id) {
                  bItem.brand_categories.push(cItem.category_id.toString());
                }
                if (cItem.sub_category_id) {
                  bItem.brand_categories.push(cItem.sub_category_id.toString());
                }
              });
              bItem = _.omit(bItem, 'category_ids');
              bItem = _.omit(bItem, 'details');
              return bItem;
            });
        return reply.response({
          status: true,
          message: 'Successful',
          result: category_id.map(item => {
            return {
              category_id: item,
              brands: brands.filter(
                  bItem => {
                    const category_ids = bItem.brand_categories;
                    return category_ids.includes(item);
                  }),
            };
          }),
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
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
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveCities(request, reply) {
    try {
      const {state_id} = request.params;
      return reply.response(JSON.parse(JSON.stringify({
        status: true, cities: await generalAdaptor.retrieveCities(
            {where: {state_id}, attributes: ['id', 'name', 'state_id']}),
      })));
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
        message: 'Unable to retrieve cities.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveLocalities(request, reply) {
    try {
      const {state_id, city_id} = request.params;
      return reply.response(JSON.parse(JSON.stringify({
        status: true, localities: await generalAdaptor.retrieveLocalities({
          where: {city_id, state_id},
          attributes: ['id', 'name', 'pin_code', 'city_id', 'state_id'],
        }),
      })));
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
        message: 'Unable to retrieve localities.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }
}

export default SellerController;
