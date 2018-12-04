import moment from 'moment';
import config from '../../config/main';
import _ from 'lodash';

export default class OfferAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async getOfferCategories(options) {
    const {queryOptions} = options;
    const offerOptions = {
      status_type: 1, date_end: {
        $gte: moment().format(),
      },
    };

    if (queryOptions.ref_id) {
      offerOptions.main_category_id = queryOptions.ref_id;
    }

    const offerData = await Promise.all([
      this.retrieveOffers(0, {
        where: offerOptions,
        attributes: ['category_id', 'main_category_id', 'adv_campaign_name'],
        distinct: true,
        order: [['main_category_id', 'asc'], ['category_id', 'asc']],
      }), this.retrieveOffers(1, {
        where: offerOptions,
        attributes: ['category_id', 'main_category_id', 'adv_campaign_name'],
        order: [['main_category_id', 'asc'], ['category_id', 'asc']],
        distinct: true,
      }), await this.retrieveOffers(2, {
        where: offerOptions, attributes: [
          'category_id', 'main_category_id', 'adv_campaign_name'],
        order: [['main_category_id', 'asc'], ['category_id', 'asc']],
        distinct: true,
      })]);
    const offerList = _.orderBy(
        [...offerData[0], ...offerData[1], ...offerData[2]],
        ['main_category_id'], ['asc']);
    const id = _.sortedUniq(offerList.filter(
        item => item && item.category_id && item.main_category_id).
        map(item => queryOptions.ref_id ? item.category_id :
            item.main_category_id));
    const categoryOptions = {status_type: 1, id};
    const offerCategories = await this.retrieveOfferCategories({
      where: categoryOptions,
      attributes: [
        'id', 'category_level', 'category_name', 'category_image_name'],
      order: [['priority'], ['id']],
    });

    return offerCategories.map(item => {
      const category_offers = offerList.filter(olItem => queryOptions.ref_id ?
          (olItem.category_id || '').toString() === item.id.toString() :
          (olItem.main_category_id || '').toString() === item.id.toString());
      item.offer_counts = category_offers.length;
      item.filter = {discount: {}, cashback: {}, other: {}};
      item.filter.merchant = _.groupBy(_.sortBy(
          category_offers.filter(cOItem => cOItem.adv_campaign_name).
              map(cOItem => ({
                category_id: cOItem.category_id,
                merchant: cOItem.adv_campaign_name,
              })), ['merchant', 'category_id']), 'category_id');
      item.filter.discount[item.id] = config.OFFERS.DISCOUNTS.split(',');
      item.filter.cashback[item.id] = config.OFFERS.CASHBACKS.split(',');
      item.filter.other[item.id] = [];

      for (let mItem in item.filter.merchant) {
        if (item.filter.merchant.hasOwnProperty(mItem)) {
          item.filter.merchant[mItem] = _.sortedUniqBy(
              item.filter.merchant[mItem], 'merchant').
              map(cOItem => cOItem.merchant);
        }
      }
      return item;
    });
  }

  async getOfferList(options) {
    const {user_id, queryOptions, paramOptions} = options;
    console.log(queryOptions);
    let {id} = paramOptions;
    let {offset, limit, cashback, discount, other, merchant, discount_offer_id, cashback_offer_id, other_offer_id, cashback_sort, discount_sort, other_sort} = queryOptions;

    other = (!!other && other.toLowerCase() === 'true');
    const offerInclude = [
      {
        model: this.modals.offerProductsDiscount,
        as: 'offers', where: JSON.parse(JSON.stringify({
          status_type: 1,
          date_end: {$gte: moment().format()},
          other: other ? {$not: null, $ne: ''} : undefined,
          cashback: cashback ? {$gte: cashback} : undefined,
          discount: discount ? {$gte: discount} : undefined,
          adv_campaign_name: merchant ? {$in: merchant.split(',')} : undefined,
        })), attributes: [/*'discount', 'cashback', 'other'*/], required: false,
      }, {
        model: this.modals.offerProductsCashback,
        as: 'offers_cashback', where: JSON.parse(JSON.stringify({
          status_type: 1,
          date_end: {$gte: moment().format()},
          other: other ? {$not: null, $ne: ''} : undefined,
          cashback: cashback ? {$gte: cashback} : undefined,
          discount: discount ? {$gte: discount} : undefined,
          adv_campaign_name: merchant ? {$in: merchant.split(',')} : undefined,
        })), attributes: [/*'discount', 'cashback', 'other'*/], required: false,
      }, {
        model: this.modals.offerProductsOther,
        as: 'offers_other', where: JSON.parse(JSON.stringify({
          status_type: 1,
          date_end: {$gte: moment().format()},
          other: other ? {$not: null, $ne: ''} : undefined,
          cashback: cashback ? {$gte: cashback} : undefined,
          discount: discount ? {$gte: discount} : undefined,
          adv_campaign_name: merchant ? {$in: merchant.split(',')} : undefined,
        })), attributes: [/*'discount', 'cashback', 'other'*/], required: false,
      }];
    offset = offset || 0;
    limit = limit || config.LIMITS.OFFER;
    const selected_category = await this.retrieveOfferCategory({
      where: {id}, attributes: [
        'id', 'category_level', 'category_name',
        'category_image_name'],
    });
    let offers, category, trending_discount, trending_cashback, trending_others;
    if (selected_category.category_level === 1) {
      const categories = await this.retrieveOfferCategories({
        where: {ref_id: id}, include: offerInclude,
        attributes: [
          'id', 'category_level', 'category_name', 'category_image_name', [
            this.modals.sequelize.literal(
                `(count(distinct ${offerInclude[0].as}) + count(distinct ${offerInclude[1].as}) + count(distinct ${offerInclude[2].as}))`),
            'offer_counts']], group: ['"offerCategories"."id"'],
      });

      offers = await Promise.all(
          categories.map((item) => this.retrieveOfferList({
            category_id: item.id, cashback, discount, discount_offer_id,
            offset, limit, other, cashback_offer_id, other_offer_id,
            merchant, cashback_sort, discount_sort, other_sort,
          })));

      return categories.map((item, index) => {
        item.offers = offers[index];
        item.offer_counts = parseInt(item.offer_counts || 0);
        return item;
      });
    }
    [category, offers] = await Promise.all([
      this.retrieveOfferCategory({
        where: {id}, attributes: [
          'id', 'category_level', 'category_name', 'category_image_name'],
      }),
      this.retrieveOfferList({
        category_id: id, cashback, discount, discount_offer_id,
        limit, offset, other, cashback_offer_id, other_offer_id,
        merchant, cashback_sort, discount_sort, other_sort,
      })]);
    category.offers = offers;

    return category;

  }

  async retrieveOfferList(parameters) {
    let {category_id, cashback, discount, discount_offer_id, offset, limit, other, cashback_offer_id, other_offer_id, merchant, cashback_sort, discount_sort} = parameters;
    discount_sort = discount_sort || 'desc';
    cashback_sort = cashback_sort || 'desc';
    const offerOptions = {
      status_type: 1, category_id,
      date_end: {$gte: moment().format()},
      adv_campaign_name: merchant ? {$in: merchant.split(',')} : undefined,
    };
    const offers = {discount: [], cashback: [], others: []};
    const offer_values = ['discount', 'cashback', 'others'];
    let data_option = (cashback && discount) || discount ?
        0 : cashback ? 1 : 2;
    offerOptions.cashback = cashback ? {$gte: cashback} : undefined;
    offerOptions.discount = discount ? {$gte: discount} : undefined;
    offerOptions.id = discount_offer_id ? {$gt: discount_offer_id} : undefined;
    let discount_offer, cashback_offer, other_offer;
    let offer_list = [];
    if (!cashback && !discount && !other) {
      discount_offer = await this.retrieveOffers(0, {
        where: JSON.parse(JSON.stringify(offerOptions)), offset, limit,
        order: [['discount', discount_sort], ['cashback', cashback_sort]],
      });

      offerOptions.id = cashback_offer_id ?
          {$gt: cashback_offer_id} :
          undefined;
      cashback_offer = await this.retrieveOffers(1, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit, order: [['cashback', cashback_sort]],
      });

      offerOptions.id = other_offer_id ? {$gt: other_offer_id} : undefined;
      other_offer = await this.retrieveOffers(2, {
        where: JSON.parse(JSON.stringify(offerOptions)),
        offset, limit,
      });
    } else {
      /*offerOptions.id = data_option === 1 && cashback_offer_id ?
          {$gt: cashback_offer_id} : data_option === 2 && other_offer_id ?
              {$gt: other_offer_id} :
              data_option === 0 && discount_offer_id ?
                  {$gt: discount_offer_id} : undefined;*/
      offers[offer_values[data_option]] = await this.retrieveOffers(data_option,
          {
            where: JSON.parse(JSON.stringify(offerOptions)),
            order: data_option === 1 ?
                [['cashback', cashback_sort]] :
                [
                  ['discount', discount_sort],
                  ['cashback', cashback_sort]], /* offset, limit,*/
          });
    }

    let lastIndex = 0;
    if (!cashback && !discount && !other) {
      while (offer_list.length < limit) {
        if (discount_offer[lastIndex] || cashback_offer[lastIndex] ||
            other_offer[lastIndex]) {
          offers[offer_values[0]].push(discount_offer[lastIndex]);
          offer_list.push(discount_offer[lastIndex]);
          if (offer_list.indexOf((olItem) => olItem.offer_id.toString() ===
              cashback_offer[lastIndex].offer_id.toString()) === -1 &&
              offer_list.length < limit) {
            offer_list.push(cashback_offer[lastIndex]);
            offers[offer_values[1]].push(cashback_offer[lastIndex]);
          }
          if (offer_list.length < limit) {
            offer_list.push(other_offer[lastIndex]);
            offers[offer_values[2]].push(other_offer[lastIndex]);
          }
          offers[offer_values[0]] = offers[offer_values[0]].filter(
              item => item);
          offers[offer_values[1]] = offers[offer_values[1]].filter(
              item => item);
          offers[offer_values[2]] = offers[offer_values[2]].filter(
              item => item);
          offer_list = offer_list.filter(item => item);
          lastIndex++;
        } else {
          break;
        }
      }
    }
    console.log(JSON.stringify({offer_list, limit}));
    return offers;
  }

  async updateOfferClickCounts(options) {
    const {paramOptions} = options;
    let {id} = paramOptions;
    const offer = await this.retrieveOfferById(id);
    const offerDetail = offer.toJSON();
    return await offer.updateAttributes({
      click_count: offerDetail.click_count + 1,
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
    const result = data_option === 1 ?
        await this.modals.offerProductsCashback.findAll(options) :
        data_option === 2 ?
            await this.modals.offerProductsOther.findAll(options) :
            await this.modals.offerProductsDiscount.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveOfferById(id) {
    return await this.modals.offerProductsDiscount.findById(id);
  }

  async updateOffer(values, options) {
    return await this.modals.offerProductsDiscount.update(values, options);
  }
}
