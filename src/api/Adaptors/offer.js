import moment from 'moment';
import config from '../../config/main';

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

    const offerInclude = {
      model: this.modals.offerProducts,
      as: 'main_offers', where: {
        status_type: 1, date_end: {$gte: moment().format()},
      }, attributes: [], required: true,
    };

    if (queryOptions.ref_id) {
      offerOptions.main_category_id = queryOptions.ref_id;
      offerInclude.as = 'offers';
    }

    const offerCategories = await this.retrieveOffers({
      where: offerOptions,
      attributes: ['category_id', 'main_category_id'],
    });
    const categoryOptions = {
      status_type: 1,
      id: offerCategories.map(item => queryOptions.ref_id ?
          item.category_id :
          item.main_category_id),
    };
    return await this.retrieveOfferCategories({
      where: categoryOptions,
      include: [offerInclude],
      attributes: [
        [
          this.modals.sequelize.literal(`count(${offerInclude.as})`),
          'offer_counts'],
        'id', 'category_level', 'category_name', 'category_image_name'],
      order: [['category_name']],
      group: ['"offerCategories"."id"'],
    });
  }

  async getOfferList(options) {
    const {user_id, queryOptions, paramOptions} = options;
    console.log(queryOptions);
    let {id} = paramOptions;
    let {offset, limit} = queryOptions;
    const offerInclude = {
      model: this.modals.offerProducts, as: 'offers',
      where: {status_type: 1, date_end: {$gte: moment().format()}},
      required: true, attributes: [],
    };
    offset = offset || 0;
    limit = limit || config.LIMITS.OFFER;
    const selected_category = await this.retrieveOfferCategory({
      where: {
        id,
      },
      attributes: [
        'id', 'category_level', 'category_name',
        'category_image_name'],
    });
    console.log(selected_category);
    let offers;
    let category;
    if (selected_category.category_level === 1) {
      const categories = await this.retrieveOfferCategories({
        where: {ref_id: id},
        include: [offerInclude],
        attributes: [
          'id', 'category_level', 'category_name',
          'category_image_name', [
            this.modals.sequelize.literal(`count(${offerInclude.as})`),
            'offer_counts']],
        group: ['"offerCategories"."id"'],
      });

      offers = await Promise.all(
          categories.map(async (item) => {
            const offerOptions = {
              status_type: 1, category_id: item.id,
              date_end: {$gte: moment().format()},
            };
            if (queryOptions.cashback && queryOptions.discount) {
              offerOptions.cashback = {
                $not: null,
              };
              offerOptions.discount = {
                $not: null,
              };
            } else if (queryOptions.cashback) {
              offerOptions.cashback = {
                $not: null,
              };
            } else if (queryOptions.discount) {
              offerOptions.discount = {
                $not: null,
              };
            } else if (queryOptions.other) {
              offerOptions.other = {
                $not: null,
              };
            }
            return await this.retrieveOffers(
                {where: offerOptions, offset, limit});
          }));
      return categories.map((item, index) => {
        item.offers = offers[index];

        return item;
      });
    }
    [category, offers] = await Promise.all([
      this.retrieveOfferCategory({
        where: {
          id,
        },
        attributes: [
          'id', 'category_level', 'category_name',
          'category_image_name'],
      }), this.retrieveOffers({
        where: {
          status_type: 1, category_id: id,
          date_end: {$gte: moment().format()},
        }, offset, limit,
      })]);
    category.offers = offers;

    return category;

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

  async retrieveOffers(options) {
    const result = await this.modals.offerProducts.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveOfferById(id) {
    return await this.modals.offerProducts.findById(id);
  }

  async updateOffer(values, options) {
    return await this.modals.offerProducts.update(values, options);
  }
}