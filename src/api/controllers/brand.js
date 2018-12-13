/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import BrandAdaptor from '../adaptors/brands';
import SellerAdaptor from '../adaptors/sellers';
import moment from 'moment';
import config from '../../config/main';
import Promise from 'bluebird';
import _ from 'lodash';

let modals, brandAdaptor, sellerAdaptor;

class BrandController {
  constructor(modal) {
    modals = modal;
    brandAdaptor = new BrandAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
  }

  static async getBrands(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const isWebMode = (request.params && request.params.mode &&
        request.params.mode.toLowerCase() === 'web');
    try {
      if (!user && !isWebMode) {
        return reply.response({status: false, message: 'Unauthorized'});
      } else if (!request.pre.forceUpdate) {
        let results = [];
        if (request.query.categoryid) {
          let category_id = (request.query.categoryid || '').split(',');

          const options = JSON.parse(JSON.stringify({
            status_type: 1,
            category_id: category_id.length > 0 ? category_id : undefined,
          }));

          results = await modals.brands.findAll({
            where: {
              status_type: 1,
            },
            include: [
              {
                model: modals.brandDetails,
                as: 'details',
                where: options,
                required: true,
              }, {
                model: modals.serviceCenters,
                as: 'centers',
                attributes: [],
                required: true,
              }],
            order: [['brand_name', 'ASC']],
            attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
          });
        } else {
          results = await
              modals.brands.findAll({
                where: {
                  status_type: 1,
                },
                order: [['brand_name', 'ASC']],
                attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
                include: [
                  {
                    model: modals.serviceCenters,
                    as: 'centers',
                    attributes: [],
                    required: true,
                  },
                ],
              });
        }
        return reply.response({
          status: true,
          message: 'Successful',
          brands: results,
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

  static async getBrandASC(request, reply) {
    try {
      const results = await brandAdaptor.retrieveASCBrands(request.query);
      if (results) {
        return reply.response({
          status: true,
          message: 'Successful',
          brands: results,
          forceUpdate: request.pre.forceUpdate,
        });
      }

      return reply.response({
        status: false,
        message: 'No Brand Found',
        forceUpdate: request.pre.forceUpdate,
      }).code(404);

    } catch (err) {

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
        message: 'Something wrong',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveBrandOffers(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, offer_type} = request.params;
        let {page_no} = request.query || {};
        let limit = config.BRAND_OFFER_LIMIT;
        let offset = page_no && page_no !== '0' && page_no !== '1' ?
            parseInt(page_no) * config.BRAND_OFFER_LIMIT : 0;
        let brand_offers = await brandAdaptor.retrieveBrandOffers({
          where: {offer_type, end_date: {$gte: moment().format()}},
          attributes: [
            'id', 'offer_type', 'title', 'description', 'sku_measurement_type',
            'start_date', 'end_date', 'sku_id', 'brand_id', 'brand_mrp',
            'excluded_seller_ids', 'sku_measurement_id', 'offer_value',
            'has_image', [
              modals.sequelize.literal(
                  '(select title from table_sku_global as sku where sku.id = brand_offers.sku_id)'),
              'sku_title'], [
              modals.sequelize.literal(seller_id ?
                  `(select id from table_seller_offers as offer where offer.brand_offer_id = brand_offers.id and offer.seller_id = ${seller_id} and offer.offer_type = brand_offers.offer_type limit 1)` :
                  null), 'seller_offer_id'], [
              modals.sequelize.literal(
                  '(select brand_name from brands as brand where brand.brand_id = brand_offers.brand_id)'),
              'brand_title'], [
              modals.sequelize.literal(
                  `(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'measurement_value'], [
              modals.sequelize.literal(
                  `(select acronym from table_sku_measurement as sku_measure where sku_measure.id = brand_offers.sku_measurement_type)`),
              'measurement_acronym'], [
              modals.sequelize.literal(
                  `(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id limit 1))`),
              'acronym'], [
              modals.sequelize.literal(
                  `(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'mrp'], [
              modals.sequelize.literal(
                  `(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'bar_code']], limit, offset,
          order: [['updated_at', 'desc'], ['created_at', 'desc']],
        });

        brand_offers = brand_offers.map(item => {
          if (item.offer_type === 1) {
            item.discount = (item.brand_mrp || item.mrp) * item.offer_value /
                100;
            item.discounted_value = (item.brand_mrp || item.mrp) -
                item.discount;
          }

          item.has_seller_offer = !!item.seller_offer_id;
          return item;
        });
        return reply.response({
          status: true,
          message: 'Successful',
          result: brand_offers.filter(
              item => !((item.excluded_seller_ids || []).find(
                  excluded_item => excluded_item.toString() ===
                      seller_id.toString()))),
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
        message: 'Unable to retrieve offers for brand for seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async addBrandOfferToSeller(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, offer_type, id} = request.params;
        let brand_offer = await brandAdaptor.retrieveBrandOffer({
          where: {offer_type, end_date: {$gte: moment().format()}, id},
          attributes: [
            'id', 'offer_type', 'title', 'description', 'sku_measurement_type',
            'start_date', 'end_date', 'sku_id', 'brand_id', 'brand_mrp',
            'excluded_seller_ids', 'sku_measurement_id', 'offer_value',
            'has_image', [
              modals.sequelize.literal(
                  '(select title from table_sku_global as sku where sku.id = brand_offers.sku_id)'),
              'sku_title'], [
              modals.sequelize.literal(
                  '(select brand_name from brands as brand where brand.brand_id = brand_offers.brand_id)'),
              'brand_title'], [
              modals.sequelize.literal(
                  `(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'measurement_value'], [
              modals.sequelize.literal(
                  `(select acronym from table_sku_measurement as sku_measure where sku_measure.id = brand_offers.sku_measurement_type)`),
              'measurement_acronym'], [
              modals.sequelize.literal(
                  `(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id limit 1))`),
              'acronym'], [
              modals.sequelize.literal(
                  `(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'mrp'], [
              modals.sequelize.literal(
                  `(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'bar_code']],
          order: [['updated_at', 'desc'], ['created_at', 'desc']],
        });

        const {
          title, description, sku_measurement_type,
          start_date, end_date, sku_id, brand_mrp: seller_mrp,
          sku_measurement_id, offer_value: offer_discount,
        } = brand_offer;
        const [seller_offer] = await Promise.all([
          sellerAdaptor.retrieveOrCreateSellerOffers(
              JSON.parse(
                  JSON.stringify({seller_id, sku_id, sku_measurement_id})),
              JSON.parse(JSON.stringify(
                  {
                    seller_id, start_date, end_date, title, offer_type,
                    sku_id, sku_measurement_id, description, seller_mrp,
                    on_sku: !!(sku_id), offer_discount, sku_measurement_type,
                    brand_offer_id: id,
                  }))), sku_id ? sellerAdaptor.retrieveOrCreateSellerSKU(
              {seller_id, sku_id, sku_measurement_id},
              {seller_id, sku_id, sku_measurement_id}) : undefined]);
        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_offer,
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
        message: 'Unable to add offers with seller',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async unLinkBrandOfferFromSeller(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, offer_type, id} = request.params;
        let brand_offer = await brandAdaptor.retrieveBrandOffer({
          where: {offer_type, end_date: {$gte: moment().format()}, id},
          attributes: [
            'id', 'offer_type', 'title', 'description', 'sku_measurement_type',
            'start_date', 'end_date', 'sku_id', 'brand_id', 'brand_mrp',
            'excluded_seller_ids', 'sku_measurement_id', 'offer_value',
            'has_image', [
              modals.sequelize.literal(
                  '(select title from table_sku_global as sku where sku.id = brand_offers.sku_id)'),
              'sku_title'], [
              modals.sequelize.literal(
                  '(select brand_name from brands as brand where brand.brand_id = brand_offers.brand_id)'),
              'brand_title'], [
              modals.sequelize.literal(
                  `(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'measurement_value'], [
              modals.sequelize.literal(
                  `(select acronym from table_sku_measurement as sku_measure where sku_measure.id = brand_offers.sku_measurement_type)`),
              'measurement_acronym'], [
              modals.sequelize.literal(
                  `(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id limit 1))`),
              'acronym'], [
              modals.sequelize.literal(
                  `(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'mrp'], [
              modals.sequelize.literal(
                  `(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'bar_code']],
          order: [['updated_at', 'desc'], ['created_at', 'desc']],
        });
        brand_offer.excluded_seller_ids = brand_offer.excluded_seller_ids || [];
        brand_offer.excluded_seller_ids.push(seller_id);
        const {sku_id, sku_measurement_id} = brand_offer;
        const [seller_offer] = await Promise.all([
          brandAdaptor.retrieveOrUnlinkBrandOffers(
              {seller_id, sku_id, sku_measurement_id, brand_offer_id: id}),
          brandAdaptor.updateBrandOffer(
              {excluded_seller_ids: _.uniq(brand_offer.excluded_seller_ids)},
              {where: {offer_type, end_date: {$gte: moment().format()}, id}},
          )]);
        return reply.response({
          status: true,
          message: 'Successful',
          result: seller_offer,
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

  static async brandOfferSellerRequest(request, reply) {
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id, offer_type, id} = request.params;
        let brand_offer = await brandAdaptor.retrieveBrandOffer({
          where: {offer_type, end_date: {$gte: moment().format()}, id},
          attributes: [
            'id', 'offer_type', 'title', 'description', 'sku_measurement_type',
            'start_date', 'end_date', 'sku_id', 'brand_id', 'brand_mrp',
            'excluded_seller_ids', 'sku_measurement_id', 'offer_value',
            'has_image', [
              modals.sequelize.literal(
                  '(select title from table_sku_global as sku where sku.id = brand_offers.sku_id)'),
              'sku_title'], [
              modals.sequelize.literal(
                  '(select brand_name from brands as brand where brand.brand_id = brand_offers.brand_id)'),
              'brand_title'], [
              modals.sequelize.literal(
                  `(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'measurement_value'], [
              modals.sequelize.literal(
                  `(select acronym from table_sku_measurement as sku_measure where sku_measure.id = brand_offers.sku_measurement_type)`),
              'measurement_acronym'], [
              modals.sequelize.literal(
                  `(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id limit 1))`),
              'acronym'], [
              modals.sequelize.literal(
                  `(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'mrp'], [
              modals.sequelize.literal(
                  `(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = brand_offers.sku_measurement_id)`),
              'bar_code']],
          order: [['updated_at', 'desc'], ['created_at', 'desc']],
        });
        brand_offer.excluded_seller_ids = brand_offer.excluded_seller_ids || [];
        brand_offer.excluded_seller_ids.push(seller_id);
        const {sku_id, sku_measurement_id, end_date, start_date, brand_mrp: seller_mrp, sku_measurement_type, title} = brand_offer;
        const seller_offer = await brandAdaptor.createBrandOfferRequestForSeller(
            {
              seller_id, sku_id, sku_measurement_id, brand_offer_id: id,
              offer_type, end_date, start_date, seller_mrp,
              sku_measurement_type, title,
            });
        return reply.response({
          status: true, message: 'Successful', result: seller_offer,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false, message: 'Forbidden',
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
}

export default BrandController;
