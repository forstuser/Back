'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

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

    const offerCategories = await this.retrieveOffers({
      where: offerOptions,
      attributes: ['category_id', 'main_category_id']
    });
    const categoryOptions = {
      status_type: 1,
      id: offerCategories.map(item => queryOptions.ref_id ? item.category_id : item.main_category_id)
    };
    return await this.retrieveOfferCategories({
      where: categoryOptions,
      order: [['category_name']]
    });
  }

  async getOfferList(options) {
    const { user_id, queryOptions, paramOptions } = options;
    console.log(queryOptions);
    let { id } = paramOptions;
    const selected_category = await this.retrieveOfferCategory({
      where: {
        id
      }
    });
    console.log(selected_category);
    let offers = [];
    let categories = [];
    if (selected_category.category_level === 1) {
      const offerCategories = await this.retrieveOffers({
        where: {
          status_type: 1, main_category_id: id, date_end: {
            $gte: (0, _moment2.default)().format()
          }
        },
        attributes: ['category_id', 'main_category_id']
      });
      [categories, offers] = await Promise.all([this.retrieveOfferCategories({
        where: {
          ref_id: id,
          id: offerCategories.map(item => item.category_id)
        }
      }), await this.retrieveOffers({
        where: {
          status_type: 1, main_category_id: id, date_end: {
            $gte: (0, _moment2.default)().format()
          }
        }
      })]);
    } else {
      offers = await this.retrieveOffers({
        where: {
          status_type: 1, category_id: id, date_end: {
            $gte: (0, _moment2.default)().format()
          }
        }
      });
    }

    return categories.length > 0 ? categories.map(item => {
      item.offers = offers.filter(offerItem => offerItem.category_id === item.id);
      return item;
    }) : offers;
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
    result.map(item => item.toJSON());
  }
}
exports.default = OfferAdaptor;