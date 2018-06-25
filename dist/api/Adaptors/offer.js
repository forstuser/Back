'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OfferAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async getOfferCategories(options) {
    const { queryOptions } = options;
    const offerOptions = {
      status_type: 1, date_end: {
        $gte: (0, _moment2.default)().format()
      }
    };

    if (queryOptions.ref_id) {
      offerOptions.main_category_id = queryOptions.ref_id;
    }

    const offerList = await Promise.all([...(await this.retrieveOffers(0, {
      where: offerOptions,
      attributes: ['category_id', 'main_category_id', 'discount', 'cashback', 'other', 'adv_campaign_name']
    })), ...(await this.retrieveOffers(1, {
      where: offerOptions,
      attributes: ['category_id', 'main_category_id', 'discount', 'cashback', 'other', 'adv_campaign_name']
    })), ...(await this.retrieveOffers(2, {
      where: offerOptions,
      attributes: ['category_id', 'main_category_id', 'discount', 'cashback', 'other', 'adv_campaign_name']
    }))]);
    const categoryOptions = {
      status_type: 1,
      id: offerList.map(item => queryOptions.ref_id ? item.category_id : item.main_category_id)
    };
    const offerCategories = await this.retrieveOfferCategories({
      where: categoryOptions,
      attributes: ['id', 'category_level', 'category_name', 'category_image_name'],
      order: [['category_name']]
    });

    return offerCategories.map(item => {
      const category_offers = offerList.filter(olItem => queryOptions.ref_id ? olItem.category_id.toString() === item.id.toString() : olItem.main_category_id.toString() === item.id.toString());
      item.offer_counts = offerList.filter(olItem => queryOptions.ref_id ? olItem.category_id.toString() === item.id.toString() : olItem.main_category_id.toString() === item.id.toString()).length;
      item.filter = {};
      item.filter.discount = _lodash2.default.groupBy(_lodash2.default.sortBy(category_offers.filter(cOItem => cOItem.discount).map(cOItem => ({
        category_id: cOItem.category_id,
        discount: cOItem.discount
      })), ['discount', 'category_id']), 'category_id');
      item.filter.cashback = _lodash2.default.groupBy(_lodash2.default.sortBy(category_offers.filter(cOItem => cOItem.cashback).map(cOItem => ({
        category_id: cOItem.category_id,
        cashback: cOItem.cashback
      })), ['cashback', 'category_id']), 'category_id');
      item.filter.merchant = _lodash2.default.groupBy(_lodash2.default.sortBy(category_offers.filter(cOItem => cOItem.adv_campaign_name).map(cOItem => ({
        category_id: cOItem.category_id,
        merchant: cOItem.adv_campaign_name
      })), ['adv_campaign_name', 'category_id']), 'category_id');
      item.filter.other = _lodash2.default.groupBy(_lodash2.default.sortBy(category_offers.filter(cOItem => cOItem.other).map(cOItem => ({
        category_id: cOItem.category_id,
        other: cOItem.other
      })), ['other', 'category_id']), 'category_id');
      for (let dItem in item.filter.discount) {
        if (item.filter.discount.hasOwnProperty(dItem)) {
          item.filter.discount[dItem] = _lodash2.default.sortedUniqBy(item.filter.discount[dItem], 'discount').map(cOItem => cOItem.discount);
        }
      }

      for (let cItem in item.filter.cashback) {
        if (item.filter.cashback.hasOwnProperty(cItem)) {
          item.filter.cashback[cItem] = _lodash2.default.sortedUniqBy(item.filter.cashback[cItem], 'cashback').map(cOItem => cOItem.cashback);
        }
      }

      for (let oItem in item.filter.other) {
        if (item.filter.other.hasOwnProperty(oItem)) {
          item.filter.other[oItem] = _lodash2.default.sortedUniqBy(item.filter.other[oItem], 'cashback').map(cOItem => cOItem.other);
        }
      }

      for (let mItem in item.filter.merchant) {
        if (item.filter.merchant.hasOwnProperty(mItem)) {
          item.filter.merchant[mItem] = _lodash2.default.sortedUniqBy(item.filter.merchant[mItem], 'cashback').map(cOItem => cOItem.merchant);
        }
      }
      return item;
    });
  }

  async getOfferList(options) {
    const { user_id, queryOptions, paramOptions } = options;
    console.log(queryOptions);
    let { id } = paramOptions;
    let { offset, limit, cashback, discount, other, merchant, discount_offer_id, cashback_offer_id, other_offer_id } = queryOptions;

    other = !!other && other.toLowerCase() === 'true';
    const offerInclude = [{
      model: this.modals.offerProductsDiscount,
      as: 'offers', where: JSON.parse(JSON.stringify({
        status_type: 1,
        date_end: { $gte: (0, _moment2.default)().format() },
        cashback: cashback ? { $gte: cashback } : undefined,
        discount: discount ? { $gte: discount } : undefined,
        adv_campaign_name: merchant ? { $in: merchant.split(',') } : undefined
      })), attributes: [/*'discount', 'cashback', 'other'*/], required: false
    }, {
      model: this.modals.offerProductsCashback,
      as: 'offers_cashback', where: JSON.parse(JSON.stringify({
        status_type: 1,
        date_end: { $gte: (0, _moment2.default)().format() },
        cashback: cashback ? { $gte: cashback } : undefined,
        discount: discount ? { $gte: discount } : undefined,
        adv_campaign_name: merchant ? { $in: merchant.split(',') } : undefined
      })), attributes: [/*'discount', 'cashback', 'other'*/], required: false
    }, {
      model: this.modals.offerProductsOther,
      as: 'offers_other', where: JSON.parse(JSON.stringify({
        status_type: 1,
        date_end: { $gte: (0, _moment2.default)().format() },
        other: other ? { $not: null, $ilike: other } : undefined,
        adv_campaign_name: merchant ? { $in: merchant.split(',') } : undefined
      })), attributes: [/*'discount', 'cashback', 'other'*/], required: false
    }];
    offset = offset || 0;
    limit = limit || _main2.default.LIMITS.OFFER;
    const selected_category = await this.retrieveOfferCategory({
      where: {
        id
      },
      attributes: ['id', 'category_level', 'category_name', 'category_image_name']
    });
    console.log(selected_category);
    let offers;
    let category;
    if (selected_category.category_level === 1) {
      const categories = await this.retrieveOfferCategories({
        where: { ref_id: id },
        include: offerInclude,
        attributes: ['id', 'category_level', 'category_name', 'category_image_name', [this.modals.sequelize.literal(`count(${offerInclude[0].as})`), 'offer_counts'], [this.modals.sequelize.literal(`count(${offerInclude[1].as})`), 'offer_cashback_counts'], [this.modals.sequelize.literal(`count(${offerInclude[2].as})`), 'offer_other_counts']],
        group: ['"offerCategories"."id"']
      });

      offers = await Promise.all(categories.map(async item => await this.retrieveOfferList({
        category_id: item.id, cashback, discount,
        discount_offer_id, offset, limit, other,
        cashback_offer_id, other_offer_id, merchant
      })));

      console.log('\n\n\n\n\n\n', JSON.stringify(offers));
      return categories.map((item, index) => {
        item.offers = offers[index];
        item.offer_counts = discount && cashback ? parseInt(item.offer_counts || 0) : parseInt(item.offer_counts || 0) + parseInt(item.offer_cashback_counts || 0) + parseInt(item.offer_other_counts || 0);
        return item;
      });
    }
    [category, offers] = await Promise.all([this.retrieveOfferCategory({
      where: {
        id
      },
      attributes: ['id', 'category_level', 'category_name', 'category_image_name']
    }), this.retrieveOfferList({
      category_id: id, cashback, discount, discount_offer_id, limit,
      offset, other, cashback_offer_id, other_offer_id, merchant
    })]);
    category.offers = offers;

    return category;
  }

  async retrieveOfferList(parameters) {
    let { category_id, cashback, discount, discount_offer_id, offset, limit, other, cashback_offer_id, other_offer_id, merchant } = parameters;
    const offerOptions = {
      status_type: 1, category_id,
      date_end: { $gte: (0, _moment2.default)().format() },
      adv_campaign_name: merchant ? { $in: merchant.split(',') } : undefined
    };
    const offers = {
      discount: [],
      cashback: [],
      others: []
    };
    const offer_values = ['discount', 'cashback', 'others'];
    let data_option = cashback && discount || discount ? 0 : cashback ? 1 : 2;
    offerOptions.cashback = cashback ? { $gte: cashback } : undefined;
    offerOptions.discount = discount ? { $gte: discount } : undefined;
    offerOptions.id = discount_offer_id ? { $gt: discount_offer_id } : undefined;
    let discount_offer, cashback_offer, other_offer;
    let offer_list = [];
    if (!cashback && !discount && !other) {
      discount_offer = await this.retrieveOffers(0, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit
      });

      offerOptions.id = cashback_offer_id ? { $gt: cashback_offer_id } : undefined;
      cashback_offer = await this.retrieveOffers(1, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit
      });

      offerOptions.id = other_offer_id ? { $gt: other_offer_id } : undefined;
      other_offer = await this.retrieveOffers(2, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit
      });
    } else {
      offerOptions.id = data_option === 1 && cashback_offer_id ? { $gt: cashback_offer_id } : data_option === 2 && other_offer_id ? { $gt: other_offer_id } : discount_offer_id ? { $gt: discount_offer_id } : undefined;
      offers[offer_values[data_option]] = await this.retrieveOffers(data_option, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit
      });
    }

    let lastIndex = 0;
    if (!cashback && !discount && !other) {
      while (offer_list.length < limit) {
        if (discount_offer[lastIndex] || cashback_offer[lastIndex] || other_offer[lastIndex]) {
          offers[offer_values[0]].push(discount_offer[lastIndex]);
          offer_list.push(discount_offer[lastIndex]);
          if (offer_list.indexOf(olItem => olItem.offer_id.toString() === cashback_offer[lastIndex].offer_id.toString()) === -1 && offer_list.length < limit) {
            offer_list.push(cashback_offer[lastIndex]);
            offers[offer_values[1]].push(cashback_offer[lastIndex]);
          }
          if (offer_list.length < limit) {
            offer_list.push(other_offer[lastIndex]);
            offers[offer_values[2]].push(other_offer[lastIndex]);
          }
          offers[offer_values[0]] = offers[offer_values[0]].filter(item => item);
          offers[offer_values[1]] = offers[offer_values[1]].filter(item => item);
          offers[offer_values[2]] = offers[offer_values[2]].filter(item => item);
          offer_list = offer_list.filter(item => item);
          lastIndex++;
        } else {
          break;
        }
      }
    }
    return offers;
  }

  async updateOfferClickCounts(options) {
    const { paramOptions } = options;
    let { id } = paramOptions;
    const offer = await this.retrieveOfferById(id);
    const offerDetail = offer.toJSON();
    return await offer.updateAttributes({
      click_count: offerDetail.click_count + 1
    });
  }

  async retrieveOfferCategories(options) {
    const result = await this.modals.offerCategories.findAll(options);
    return result.map(item => {
      item = item.toJSON();
      item.image_url = `/offer/categories/${item.id}/images/thumbnail`;
      return item;
    });
  }

  async retrieveOfferCategory(options) {
    let result = await this.modals.offerCategories.findOne(options);
    result = result.toJSON();
    result.image_url = `/offer/categories/${result.id}/images/thumbnail`;
    return result;
  }

  async retrieveOffers(data_option, options) {
    options.order = data_option === 1 ? [['cashback', 'desc']] : [['discount', 'desc'], ['cashback', 'desc']];
    const result = data_option === 1 ? await this.modals.offerProductsCashback.findAll(options) : data_option === 2 ? await this.modals.offerProductsOther.findAll(options) : await this.modals.offerProductsDiscount.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveOfferById(id) {
    return await this.modals.offerProductsDiscount.findById(id);
  }

  async updateOffer(values, options) {
    return await this.modals.offerProductsDiscount.update(values, options);
  }
}
exports.default = OfferAdaptor;