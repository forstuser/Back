'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SellerAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveOfflineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.offlineSellers.findAll({
      where: options,
      attributes: [['sid', 'id'], ['seller_name', 'name'], ['owner_name', 'ownerName'], 'gstin', ['pan_no', 'panNo'], ['reg_no', 'registrationNo'], ['is_service', 'isService'], ['is_onboarded', 'isOnboarded'], 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', ['contact_no', 'contact'], 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveSellers(options, query_options) {
    const { user_id, seller_offer_ids, latitude, longitude, city, limit, offset } = options;
    const result = await this.modals.offlineSellers.findAll(query_options);
    let sellers = result.map(item => item.toJSON());
    if (sellers.length > 0) {
      if (latitude && longitude) {
        sellers = await this.orderSellerByLocation(latitude, longitude, city, sellers);
      }
      // sellers = _.slice(sellers, offset, limit);
      let seller_id = sellers.map(item => item.id),
          city_ids = sellers.map(item => item.city_id).filter(item => item),
          state_ids = sellers.map(item => item.state_id).filter(item => item),
          location_ids = sellers.map(item => item.location_id).filter(item => item);
      const [seller_categories, seller_cities, seller_states, seller_locations] = await Promise.all([this.retrieveSellerCategories({ seller_id }), city_ids.length > 0 ? this.retrieveSellerCities({ id: city_ids }) : [], state_ids.length > 0 ? this.retrieveSellerStates({ id: state_ids }) : [], location_ids.length > 0 ? this.retrieveSellerLocations({ id: location_ids }) : []]);
      sellers = sellers.map(item => {
        item.categories = seller_categories.filter(cItem => cItem.seller_id === item.id);
        item.city = seller_cities.find(cItem => cItem.id === item.city_id);
        item.state = seller_states.find(cItem => cItem.id === item.state_id);
        item.location = seller_locations.find(cItem => cItem.id === item.location_id);
        item.cashback_total = item.cashback_total || 0;
        item.loyalty_total = item.loyalty_total || 0;
        item.credit_total = item.credit_total || 0;
        item.offer_count = item.offer_count || 0;
        return item;
      });
    }

    return sellers;
  }

  async retrieveSellerById(options, query_options) {
    const { user_id, seller_offer_ids } = options;
    const result = await this.modals.offlineSellers.findOne(query_options);
    let seller = result ? result.toJSON() : result;
    if (seller) {
      let seller_id = seller.id,
          city_id = seller.city_id,
          state_id = seller.state_id,
          location_id = seller.location_id;
      const [seller_categories, seller_cash_backs, seller_loyalty_points, seller_offers, seller_credits, seller_cities, seller_states, seller_locations, seller_reviews] = await Promise.all([this.retrieveSellerCategories({ seller_id }), user_id ? this.retrieveSellerCashBack({ seller_id, user_id }) : [], user_id ? this.retrieveSellerLoyaltyPoints({ seller_id, user_id }) : [], seller_offer_ids && seller_offer_ids.length > 0 ? this.retrieveSellerOffers({ seller_id, id: seller_offer_ids }) : [], user_id ? this.retrieveSellerCredits({ seller_id, user_id }) : [], city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], location_id ? this.retrieveSellerLocations({ id: location_id }) : [], this.retrieveSellerReviews({ offline_seller_id: seller_id })]);
      seller.categories = seller_categories;
      seller.seller_cash_backs = seller_cash_backs;
      seller.seller_loyalty_points = seller_loyalty_points;
      seller.seller_offers = seller_offers;
      seller.seller_credits = seller_credits;
      seller.city = seller_cities[0];
      seller.state = seller_states[0];
      seller.location = seller_locations[0];
      seller.reviews = seller_reviews;
      seller.cashback_total = seller.cashback_total || 0;
      seller.loyalty_total = seller.loyalty_total || 0;
      seller.credit_total = seller.credit_total || 0;
      seller.offer_count = seller.offer_count || 0;
      seller.ratings = seller.ratings || 0;
    }

    return seller;
  }

  async doesSellerExist(options) {
    const result = await this.modals.offlineSellers.count(options);
    return result > 0;
  }

  async retrieveSellerCategories(options) {
    let seller_categories = await this.modals.seller_categories.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_categories = seller_categories.map(item => item.toJSON());
    if (seller_categories.length > 0) {
      const sku_categories = await this.retrieveSKUCategories({ id: seller_categories.map(item => item.category_id) });
      seller_categories = seller_categories.map(item => {
        const category_detail = sku_categories.find(cItem => cItem.id === item.category_id);
        item.category_name = category_detail.title;
        return item;
      });
    }

    return seller_categories;
  }

  async retrieveSellerCashBack(options) {
    let seller_cash_back = await this.modals.cashback_wallet.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_cash_back = seller_cash_back.map(item => item.toJSON());
    return seller_cash_back;
  }

  async retrieveSellerOffers(options) {
    let seller_offers = await this.modals.seller_offers.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_offers = seller_offers.map(item => item.toJSON());
    return seller_offers;
  }

  async retrieveSellerLoyaltyPoints(options) {
    let seller_loyalty_points = await this.modals.loyalty_wallet.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_loyalty_points = seller_loyalty_points.map(item => item.toJSON());
    return seller_loyalty_points;
  }

  async retrieveSellerReviews(options) {
    let seller_reviews = await this.modals.sellerReviews.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_reviews = seller_reviews.map(item => item.toJSON());
    return seller_reviews;
  }

  async retrieveSellerCredits(options) {
    let seller_credits = await this.modals.credit_wallet.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_credits = seller_credits.map(item => item.toJSON());
    return seller_credits;
  }

  async retrieveSellerCities(options) {
    let seller_cities = await this.modals.cities.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_cities = seller_cities.map(item => item.toJSON());
    return seller_cities;
  }

  async retrieveSellerStates(options) {
    let seller_states = await this.modals.states.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_states = seller_states.map(item => item.toJSON());
    return seller_states;
  }

  async retrieveSellerLocations(options) {
    let seller_locations = await this.modals.locations.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_locations = seller_locations.map(item => item.toJSON());
    return seller_locations;
  }

  async retrieveSKUCategories(options) {
    const result = await this.modals.sku_categories.findAll({ where: JSON.parse(JSON.stringify(options)) });
    return result.map(item => item.toJSON());
  }

  async retrieveOnlineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.onlineSellers.findAll({
      where: JSON.parse(JSON.stringify(options)),
      attributes: [['sid', 'id'], 'url', 'contact', ['seller_name', 'name'], 'gstin', 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveOfflineSellerById(options) {
    options.status_type = [1, 11];

    const result = await this.modals.offlineSellers.findOne({
      where: options,
      attributes: [['sid', 'id'], 'gstin', 'seller_name', 'owner_name', 'email', 'pan_no', 'reg_no', 'seller_type_id', 'is_service', 'is_onboarded', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', 'user_id', 'contact_no']
    });
    return result ? result.toJSON() : result;
  }

  async retrieveOrCreateSellers(options, defaults) {
    let sellerResult = await this.modals.offlineSellers.findOne({
      where: options
    });
    if (sellerResult) {
      const sellerDetail = sellerResult.toJSON();
      defaults.status_type = sellerDetail.status_type;
      await sellerResult.updateAttributes(defaults);
    } else {
      sellerResult = await this.modals.offlineSellers.create(defaults);
    }
    return sellerResult.toJSON();
  }

  async orderSellerByLocation(latitude, longitude, city, sellers) {
    const lat_long = latitude && longitude ? `${latitude}, ${longitude}` : '';
    const origins = [];
    const destinations = [];
    if (lat_long) {
      origins.push(lat_long);
    } else if (city) {
      origins.push(city);
    }
    const sellers_with_location = [];
    const final_result = [];
    sellers.forEach(item => {
      const seller = item;
      seller.geo_location = seller.latitude && seller.longitude && seller.latitude.toString() !== '0' && seller.longitude.toString() !== '0' ? `${seller.latitude}, ${seller.longitude}` : '';
      if (seller.geo_location) {
        destinations.push(seller.geo_location);
      }

      if (origins.length > 0 && destinations.length > 0) {
        sellers_with_location.push(seller);
      } else {
        seller.distanceMetrics = 'km';
        seller.distance = parseFloat(500.001);
        final_result.push(seller);
      }
    });

    if (origins.length > 0 && destinations.length > 0) {
      const result = await _google2.default.distanceMatrix(origins, destinations);
      for (let i = 0; i < sellers_with_location.length; i += 1) {
        if (result.length > 0) {
          const tempMatrix = result[i];
          sellers_with_location[i].distanceMetrics = 'km';
          sellers_with_location[i].distance = tempMatrix && tempMatrix.distance ? parseFloat((tempMatrix.distance.value / 1000).toFixed(2)) : null;
        } else {
          sellers_with_location[i].distanceMetrics = 'km';
          sellers_with_location[i].distance = parseFloat(500.001);
        }

        final_result.push(sellers_with_location[i]);
      }

      return _lodash2.default.orderBy(final_result.filter(elem => !!elem.distance && parseFloat(elem.distance) <= 40), ['distance'], ['asc']);
    }
  }
}
exports.default = SellerAdaptor;