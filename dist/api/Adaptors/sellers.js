'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _google = require('../../helpers/google');

var _google2 = _interopRequireDefault(_google);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SellerAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new _category2.default(modals);
    this.userAdaptor = new _user2.default(modals);
  }

  async retrieveOfflineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.sellers.findAll({
      where: options,
      attributes: ['id', ['seller_name', 'name'], ['owner_name', 'ownerName'], 'gstin', ['pan_no', 'panNo'], ['reg_no', 'registrationNo'], ['is_service', 'isService'], ['is_onboarded', 'isOnboarded'], 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', ['contact_no', 'contact'], 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveSellers(options, query_options) {
    const { user_id, seller_offer_ids, latitude, longitude, city, limit, offset } = options;
    const result = await this.modals.sellers.findAll(query_options);
    let sellers = result.map(item => {
      return item.toJSON();
    });
    if (sellers.length > 0) {
      if (latitude && longitude) {
        sellers = await this.orderSellerByLocation(latitude, longitude, city, sellers);
      }
      // sellers = _.slice(sellers, offset, limit);
      let seller_id = sellers.map(item => item.id),
          city_ids = sellers.map(item => item.city_id).filter(item => item),
          state_ids = sellers.map(item => item.state_id).filter(item => item),
          locality_ids = sellers.map(item => item.locality_id).filter(item => item);
      const [seller_categories, seller_cities, seller_states, seller_locations, assisted_services] = await Promise.all([this.retrieveSellerCategories({ seller_id }), city_ids.length > 0 ? this.retrieveSellerCities({ id: city_ids }) : [], state_ids.length > 0 ? this.retrieveSellerStates({ id: state_ids }) : [], locality_ids.length > 0 ? this.retrieveSellerLocations({ id: locality_ids }) : [], this.retrieveSellerAssistedServices({ where: { seller_id } })]);
      sellers = sellers.map(item => {
        item.categories = seller_categories.filter(cItem => cItem.seller_id === item.id);
        item.city = seller_cities.find(cItem => cItem.id === item.city_id);
        item.state = seller_states.find(cItem => cItem.id === item.state_id);
        item.location = seller_locations.find(cItem => cItem.id === item.locality_id);
        item.assisted_services = assisted_services;
        item.cashback_total = (item.cashback_total || 0) - (item.redeemed_cashback || 0);
        item.loyalty_total = (item.loyalty_total || 0) - (item.redeemed_loyalty || 0);
        item.credit_total = (item.credit_total || 0) - (item.redeemed_credits || 0);
        item.offer_count = item.offer_count || 0;
        item.ratings = item.ratings || 0;
        return item;
      });
    }

    return sellers;
  }

  async retrieveCashBackSellers(query_options) {
    const result = await this.modals.sellers.findAll(query_options);
    let sellers = result.map(item => {
      return item.toJSON();
    });
    if (sellers.length > 0) {
      sellers = sellers.map(item => {
        item.cashback_total = item.cashback_total || 0;
        item.cashback_ids = (item.cashback_wallets || []).map(item => item.id);
        item.offer_count = item.offer_count || 0;
        item.ratings = item.ratings || 0;
        return item;
      });
    }

    return sellers;
  }

  async retrieveSellersOnInit(query_options) {
    let result = await this.modals.sellers.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveOrUpdateSellerDetail(query_options, seller_detail, is_create) {
    let result = await this.modals.sellers.findOne(query_options);
    if (!result && is_create) {
      result = await this.modals.sellers.create(seller_detail);
    }

    if (result) {
      (await seller_detail) ? result.updateAttributes(JSON.parse(JSON.stringify(seller_detail))) : seller_detail;
      return result.toJSON();
    }

    return result;
  }

  async retrieveSellerDetail(query_options) {
    const result = await this.modals.sellers.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async retrieveProviderTypes(query_options) {
    const result = await this.modals.provider_types.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveAssistedServiceTypes(query_options) {
    const result = await this.modals.assisted_service_types.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveSellerAssistedServiceUsers(query_options) {
    const result = await this.modals.assisted_service_users.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveSellerAssistedServices(query_options) {
    const result = await this.modals.seller_service_types.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveSellerOffers(query_options) {
    const result = await this.modals.seller_offers.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveSellerOfferDetail(query_options) {
    const result = await this.modals.seller_offers.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async retrieveSellerConsumers(seller_id, mobile_no, offer_id) {
    let productUsers, seller_users, id, user_index_data;
    mobile_no = mobile_no ? { $iLike: `${mobile_no}%` } : undefined;
    [productUsers, seller_users] = await Promise.all([this.modals.products.findAll({
      where: { seller_id, status_type: [5, 11] },
      attributes: ['user_id'],
      group: 'user_id'
    }), this.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['customer_ids', 'latitude', 'longitude', 'address', [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code']]
    })]);
    productUsers = productUsers.map(item => item.toJSON());
    id = seller_users.customer_ids || [];
    const { latitude, longitude, address, city_name: city } = seller_users;
    productUsers.forEach(item => id.push(item.user_id));
    const result = await this.modals.users.findAll({
      where: mobile_no ? JSON.parse(JSON.stringify({ $and: { mobile_no } })) : { id },
      include: {
        model: this.modals.user_addresses,
        as: 'addresses', where: { address_type: 1 },
        attributes: ['address_type', 'address_line_1', 'address_line_2', 'city_id', 'state_id', 'locality_id', 'pin', 'latitude', 'longitude', [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = addresses.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = addresses.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = addresses.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = addresses.locality_id)'), 'pin_code']],
        required: false
      },
      attributes: [['full_name', 'name'], 'image_name', 'email', 'mobile_no', 'location', 'id', 'user_status_type', [this.modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 1 and seller_cashback.user_id = "users"."id" and seller_cashback.seller_id = ${seller_id})`), 'cashback_total'], [this.modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 2 and seller_cashback.user_id = "users"."id" and seller_cashback.seller_id = ${seller_id})`), 'redeemed_cashback'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = "users"."id" and seller_loyalty.seller_id = ${seller_id})`), 'loyalty_total'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 2 and seller_loyalty.user_id = "users"."id" and seller_loyalty.seller_id = ${seller_id})`), 'redeemed_loyalty'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'credit_total'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 2 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'redeemed_credits'], [this.modals.sequelize.literal(`(select count(*) from table_cashback_jobs as cashback_jobs where cashback_jobs.user_id = "users"."id" and cashback_jobs.seller_id = ${seller_id})`), 'transaction_counts'], [this.modals.sequelize.literal(`(select seller_offer_ids from table_user_index as user_index where user_index.user_id = "users"."id")`), 'seller_offer_ids']]
    });

    return await this.orderUserByLocation(latitude, longitude, city, result.map(item => {
      item = item.toJSON();
      const linked_user = (seller_users.customer_ids || []).find(suItem => suItem.toString() === item.id.toString());
      item.linked = !!linked_user;
      item.cashback_total = (item.cashback_total || 0) - (item.redeemed_cashback || 0);
      item.loyalty_total = (item.loyalty_total || 0) - (item.redeemed_loyalty || 0);
      item.credit_total = (item.credit_total || 0) - (item.redeemed_credits || 0);
      item.addresses = item.addresses[0];

      if (item.addresses) {
        const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.addresses || {};
        item.address = `${address_line_1}${address_line_2 ? ` ${address_line_2}` : ''},${locality_name},${city_name},${state_name}-${pin_code}`.split('null', '').join(',').split('undefined', '').join(',').split(',,').join(',');
      }
      if (offer_id) {
        const seller_offer_id = (item.seller_offer_ids || []).find(item => item.toString() === offer_id.toString());
        item.linked_offer = !!seller_offer_id;
      }
      return item;
    }));
  }

  async retrieveSellerCustomerDetail(seller_id, customer_id, mobile_no) {
    let productUsers,
        seller_users,
        id = customer_id;
    mobile_no = mobile_no ? { $ilike: `${mobile_no}%` } : undefined;
    const result = await this.modals.users.findOne({
      where: JSON.parse(JSON.stringify({ id, mobile_no })),

      include: [{
        where: { seller_id, admin_status: 5 },
        model: this.modals.cashback_jobs,
        required: false,
        attributes: ['id', 'home_delivered', [this.modals.sequelize.literal(`(select sum(purchase_cost) from consumer_products as product where product.user_id = "users"."id" and product.job_id = "cashback_jobs"."job_id" and product.seller_id = ${seller_id})`), 'amount_paid'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'total_credits'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 2 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'redeemed_credits'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and loyalty_wallet.user_id = "users"."id" and loyalty_wallet.seller_id = ${seller_id})`), 'total_loyalty'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 2 and loyalty_wallet.user_id = "users"."id" and loyalty_wallet.seller_id = ${seller_id})`), 'redeemed_loyalty'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and user_wallet.user_id = "users"."id" and user_wallet.seller_id = ${seller_id})`), 'total_cashback'], [this.modals.sequelize.literal(`(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "users"."id" and expense_skus.seller_id = ${seller_id} and expense_skus.job_id = "cashback_jobs"."job_id" )`), 'item_counts']]
      }, {
        where: { seller_id }, model: this.modals.credit_wallet, required: false,
        attributes: ['title', 'description', 'transaction_type', 'amount', 'created_at']
      }, {
        where: { seller_id },
        model: this.modals.loyalty_wallet, required: false,
        attributes: ['title', 'description', 'transaction_type', 'amount', 'created_at']
      }],
      attributes: [['full_name', 'name'], 'email', 'mobile_no', 'id']
    });
    const user_detail = result ? result.toJSON() : result;
    user_detail.cashback_jobs = (user_detail.cashback_jobs || []).map(item => {
      item.total_credit = (item.total_credit || 0) - (item.redeemed_credits || 0);
      item.total_loyalty = (item.total_loyalty || 0) - (item.redeemed_loyalty || 0);
      return item;
    });
    return user_detail;
  }

  async retrieveSellerAssistedServiceDetail(query_options) {
    const result = await this.modals.seller_service_types.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async retrieveAssistedServiceUser(query_options) {
    const result = await this.modals.assisted_service_users.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async deleteSellerAssistedServiceUsers(query_options) {
    return await this.modals.assisted_service_users.destroy(query_options);
  }

  async deleteSellerAssistedServiceTypes(query_options) {
    return await this.modals.seller_service_types.destroy(query_options);
  }

  async deleteSellerOffers(query_options) {
    return await this.modals.seller_offers.destroy(query_options);
  }

  async createSellerOnInit(seller_detail) {
    let result = await this.modals.sellers.create(seller_detail);
    result = result ? result.toJSON() : result;
    if (result) {
      await this.retrieveOrCreateSellerLoyaltyRules({ seller_id: result.seller_id }, { seller_id: result.seller_id });
    }
    return result;
  }

  async retrieveSellerById(options, query_options) {
    const { user_id, seller_offer_ids, latitude, longitude, city } = options;
    const result = await this.modals.sellers.findOne(query_options);
    let seller = result ? result.toJSON() : result;
    if (seller) {
      let seller_id = seller.id,
          city_id = seller.city_id,
          state_id = seller.state_id,
          locality_id = seller.locality_id;

      if (latitude && longitude) {
        seller = await this.retrieveSellerByLocation(latitude, longitude, city, seller);
      }
      const [seller_categories, seller_cash_backs, seller_loyalty_points, seller_offers, seller_credits, seller_cities, seller_states, seller_locations, seller_reviews, service_types, assisted_services] = await Promise.all([this.retrieveSellerCategories({ seller_id }), user_id ? this.retrieveSellerCashBack({ seller_id, user_id }) : [], user_id ? this.retrieveSellerLoyaltyPoints({ seller_id, user_id }) : [], seller_offer_ids && seller_offer_ids.length > 0 ? this.retrieveSellerOffersForConsumer({ seller_id, id: seller_offer_ids }) : [], user_id ? this.retrieveSellerCredits({ seller_id, user_id }) : [], city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : [], this.retrieveSellerReviews({ offline_seller_id: seller_id }), this.retrieveAssistedServiceTypes({}), this.retrieveSellerAssistedServiceUsers({
        include: {
          as: 'service_types', where: { seller_id },
          model: this.modals.seller_service_types, required: true,
          attributes: ['service_type_id', 'seller_id', 'price', 'id']
        }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details']
      })]);
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
      seller.assisted_services = assisted_services.map(item => {
        item.rating = _lodash2.default.sumBy(item.reviews || [{ ratings: 0 }], 'ratings') / (item.reviews || [{ ratings: 0 }]).length;
        item.service_types = item.service_types.map(typeItem => {
          const service_type = service_types.find(stItem => stItem.id === typeItem.service_type_id);
          typeItem.service_type = (service_type || {}).title;
          return typeItem;
        });

        return item;
      });
    }

    return seller;
  }

  async retrieveSellerDetails(options, query_options) {
    const { latitude, longitude, city } = options;
    const result = await this.modals.sellers.findOne(query_options);
    let seller = result ? result.toJSON() : result;
    if (seller) {
      let seller_id = seller.id,
          city_id = seller.city_id,
          state_id = seller.state_id,
          locality_id = seller.locality_id;

      if (latitude && longitude) {
        seller = await this.retrieveSellerByLocation(latitude, longitude, city, seller);
      }
      const [seller_categories, seller_cities, seller_states, seller_locations, seller_reviews] = await Promise.all([this.retrieveSellerCategories({ seller_id }), city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : []]);
      seller.categories = seller_categories;
      seller.city = seller_cities[0];
      seller.state = seller_states[0];
      seller.location = seller_locations[0];
      seller.address_detail = `${seller.address},${(seller.location || {}).name},${(seller.city || {}).name},${(seller.state || {}).state_name}-${(seller.location || {}).pin_code}`.replace(',,', ',').replace(',,', ',').replace(',,', ',');
      seller.cashback_total = seller.cashback_total || 0;
      seller.offer_count = seller.offer_count || 0;
      seller.ratings = seller.ratings || 0;
    }

    return seller;
  }

  async retrieveSellerProfile(options, query_options) {
    const { latitude, longitude, city } = options;
    const result = await this.modals.sellers.findOne(query_options);
    let seller = result ? result.toJSON() : result;
    if (seller) {
      let seller_id = seller.id,
          city_id = seller.city_id,
          state_id = seller.state_id,
          locality_id = seller.locality_id;

      if (latitude && longitude) {
        seller = await this.retrieveSellerByLocation(latitude, longitude, city, seller);
      }
      const [seller_cities, seller_states, seller_locations, seller_reviews] = await Promise.all([city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : []]);
      seller.city = seller_cities[0];
      seller.state = seller_states[0];
      seller.location = seller_locations[0];
      seller.address_detail = `${seller.address},${(seller.location || {}).name},${(seller.city || {}).name},${(seller.state || {}).state_name}-${(seller.location || {}).pin_code}`.replace(',,', ',').replace(',,', ',').replace(',,', ',');
      seller.cashback_total = seller.cashback_total || 0;
      seller.offer_count = seller.offer_count || 0;
      seller.ratings = seller.ratings || 0;
    }

    return seller;
  }

  async doesSellerExist(options) {
    const result = await this.modals.sellers.count(options);
    return result > 0;
  }

  async retrieveSellerCategories(options) {
    let seller_categories = await this.modals.seller_provider_type.findAll({
      where: JSON.parse(JSON.stringify(options)),
      attributes: ['sub_category_id', 'category_4_id', 'seller_id', 'provider_type_id', 'brand_ids']
    });
    seller_categories = seller_categories.map(item => item.toJSON());
    if (seller_categories.length > 0) {
      const [sku_categories, provider_types] = await Promise.all([this.categoryAdaptor.retrieveSellerCategories({
        where: {
          category_id: [...seller_categories.map(item => item.sub_category_id), ...seller_categories.map(item => item.category_4_id)]
        }, attributes: ['category_id', 'category_name']
      }), this.retrieveProviderTypes({
        where: { id: seller_categories.map(item => item.provider_type_id) },
        attributes: ['id', 'title']
      })]);
      seller_categories = seller_categories.map(item => {
        const provider_type = provider_types.find(pItem => pItem.id === item.provider_type_id);
        const category_detail = sku_categories.find(cItem => cItem.category_id === item.sub_category_id);
        const category_4_detail = sku_categories.find(cItem => cItem.category_id === item.category_4_id);
        item.category_name = category_detail.category_name;
        item.category_4_name = category_4_detail.category_name;
        item.provider_type = provider_type.title;
        return item;
      });
    }

    return seller_categories;
  }

  async retrieveSellerCashBack(options) {
    let seller_cash_back = await this.modals.cashback_wallet.findAll({ where: JSON.parse(JSON.stringify(options)), order: [['id', 'desc']] });
    seller_cash_back = seller_cash_back.map(item => item.toJSON());
    return seller_cash_back;
  }

  async retrieveSellerTransactions(options) {
    let seller_cash_back = await this.modals.cashback_jobs.findAll(options);
    seller_cash_back = seller_cash_back.map(item => item.toJSON());
    return seller_cash_back;
  }

  async retrieveSellerOffersForConsumer(options) {
    let seller_offers = await this.modals.seller_offers.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_offers = seller_offers.map(item => item.toJSON());
    return seller_offers;
  }

  async retrieveSellerLoyaltyPoints(options) {
    let seller_loyalty_points = await this.modals.loyalty_wallet.findAll({ where: JSON.parse(JSON.stringify(options)), order: [['id', 'desc']] });
    seller_loyalty_points = seller_loyalty_points.map(item => item.toJSON());
    return seller_loyalty_points;
  }

  async retrieveSellerReviews(options) {
    /*options.order_id = options.order_id || null*/
    let seller_reviews = await this.modals.seller_reviews.findAll({
      where: JSON.parse(JSON.stringify(options)), include: {
        model: this.modals.users, required: true,
        attributes: ['image_name', 'id', ['full_name', 'name'], 'mobile_no', 'email']
      }
    });
    seller_reviews = seller_reviews.map(item => item.toJSON());
    return seller_reviews;
  }

  async retrieveSellerCredits(options) {
    let seller_credits = await this.modals.credit_wallet.findAll({ where: JSON.parse(JSON.stringify(options)), order: [['id', 'desc']] });
    seller_credits = seller_credits.map(item => item.toJSON());
    return seller_credits;
  }

  async retrieveSellerCreditsPerUser(options) {
    let seller_credits = await this.modals.credit_wallet.findAll(options);
    const result = [];
    seller_credits.forEach(item => {
      item = item.toJSON();
      result.push(item);
    });
    return result;
  }

  async retrieveSellerLoyaltyPointsPerUser(options) {
    let seller_points = await this.modals.loyalty_wallet.findAll(options);
    const result = [];
    seller_points.forEach(item => {
      item = item.toJSON();
      result.push(item);
    });
    return result;
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
    let seller_locations = await this.modals.locality.findAll({ where: JSON.parse(JSON.stringify(options)) });
    seller_locations = seller_locations.map(item => item.toJSON());
    return seller_locations;
  }

  async retrieveCategories(options) {
    const result = await this.modals.categories.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveOnlineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.onlineSellers.findAll({
      where: JSON.parse(JSON.stringify(options)),
      attributes: ['id', 'url', 'contact', ['seller_name', 'name'], 'gstin', 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveOfflineSellerById(options) {
    options.status_type = [1, 11];

    const result = await this.modals.sellers.findOne({
      where: options,
      attributes: ['id', 'gstin', 'seller_name', 'owner_name', 'email', 'pan_no', 'reg_no', 'seller_type_id', 'is_service', 'is_onboarded', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', 'user_id', 'contact_no']
    });
    return result ? result.toJSON() : result;
  }

  async retrieveOrCreateSellers(options, defaults) {
    let sellerResult = await this.modals.sellers.findOne({
      where: options
    });

    if (sellerResult) {
      const sellerDetail = sellerResult.toJSON();
      defaults.status_type = sellerDetail.status_type;
      await sellerResult.updateAttributes(defaults);
    } else {
      sellerResult = await this.modals.sellers.create(defaults);
    }
    return sellerResult.toJSON();
  }

  async orderUserByLocation(latitude, longitude, city, users) {
    const lat_long = latitude && longitude ? `${latitude}, ${longitude}` : '';
    const origins = [];
    const destinations = [];
    if (lat_long) {
      origins.push(lat_long);
    } else if (city) {
      origins.push(city);
    }
    const user_with_location = [];
    const final_result = [];
    users.forEach(item => {
      const user = item;
      if (user.addresses) {
        user.geo_location = user.addresses.latitude && user.addresses.longitude && user.addresses.latitude.toString() !== '0' && user.addresses.longitude.toString() !== '0' ? `${user.addresses.latitude}, ${user.addresses.longitude}` : '';
        if (user.geo_location) {
          destinations.push(user.geo_location);
        } else if (user.address) {
          destinations.push(user.address);
        }

        if (origins.length > 0 && destinations.length > 0) {
          user_with_location.push(user);
        } else {
          user.distanceMetrics = 'km';
          user.distance = parseFloat(500.001);
          final_result.push(user);
        }
      } else {
        user.distanceMetrics = 'km';
        user.distance = parseFloat(500.001);
        final_result.push(user);
      }
    });

    if (origins.length > 0 && destinations.length > 0) {
      const result = await _google2.default.distanceMatrix(origins, destinations);
      for (let i = 0; i < user_with_location.length; i += 1) {
        if (result.length > 0) {
          const tempMatrix = result[i];
          user_with_location[i].distanceMetrics = 'km';
          user_with_location[i].distance = tempMatrix && tempMatrix.distance ? parseFloat((tempMatrix.distance.value / 1000).toFixed(2)) : null;
        } else {
          user_with_location[i].distanceMetrics = 'km';
          user_with_location[i].distance = parseFloat(500.001);
        }

        final_result.push(user_with_location[i]);
      }
    }

    return _lodash2.default.orderBy(final_result, ['distance'], ['asc']);
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
      } else if (seller.address) {
        destinations.push(seller.address);
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

  async retrieveSellerByLocation(latitude, longitude, city, seller) {
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
    seller.geo_location = seller.latitude && seller.longitude && seller.latitude.toString() !== '0' && seller.longitude.toString() !== '0' ? `${seller.latitude}, ${seller.longitude}` : '';
    if (seller.geo_location) {
      destinations.push(seller.geo_location);
    } else if (seller.address) {
      destinations.push(seller.address);
    }

    if (origins.length > 0 && destinations.length > 0) {
      sellers_with_location.push(seller);
    } else {
      seller.distanceMetrics = 'km';
      seller.distance = parseFloat(500.001);
      final_result.push(seller);
    }

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

      return final_result[0];
    }
  }

  async retrieveOrCreateSellerProviderTypes(options, defaults) {
    let seller_provider_type = await this.modals.seller_provider_type.findOne({
      where: options
    });
    if (seller_provider_type) {
      const seller_provider_type_result = seller_provider_type.toJSON();
      defaults.status_type = seller_provider_type_result.status_type;
      await seller_provider_type.updateAttributes(defaults);
    } else {
      seller_provider_type = await this.modals.seller_provider_type.create(defaults);
    }
    return seller_provider_type.toJSON();
  }

  async retrieveOrCreateSellerAssistedServiceTypes(options, defaults) {
    let seller_service_type = await this.modals.seller_service_types.findOne({
      where: options
    });
    if (seller_service_type && options.id) {
      const seller_service_type_result = seller_service_type.toJSON();
      defaults.status_type = seller_service_type_result.status_type;
      await seller_service_type.updateAttributes(defaults);
    } else {
      seller_service_type = await this.modals.seller_service_types.create(defaults);
    }

    return seller_service_type.toJSON();
  }

  async retrieveOrCreateAssistedServiceUsers(options, defaults, service_types) {
    let assisted_service_user = await this.modals.assisted_service_users.findOne({ where: options });
    if (assisted_service_user) {
      const assisted_service_users_result = assisted_service_user.toJSON();
      const document_details = assisted_service_users_result.document_details || [];
      document_details.push(...(defaults.document_details || []));
      defaults.document_details = _lodash2.default.uniqBy(document_details, 'file_name');
      defaults.status_type = assisted_service_users_result.status_type;
      await assisted_service_user.updateAttributes(defaults);
    } else {
      assisted_service_user = await this.modals.assisted_service_users.create(defaults);
    }
    const assisted_service_user_result = assisted_service_user.toJSON();
    const service_user_id = assisted_service_user_result.id;
    assisted_service_user_result.service_types = service_types ? await Promise.all(service_types.map(item => {
      const { price, service_type_id, seller_id, id } = item;
      return this.retrieveOrCreateSellerAssistedServiceTypes(JSON.parse(JSON.stringify({ service_type_id, seller_id, service_user_id, id })), JSON.parse(JSON.stringify({ service_type_id, seller_id, service_user_id, price })));
    })) : [];
    return assisted_service_user_result;
  }

  async updateAssistedUserReview(options, review) {
    let assisted_service_user = await this.modals.assisted_service_users.findOne({ where: options });
    if (assisted_service_user) {
      const assisted_service_users_result = assisted_service_user.toJSON();
      const reviews = assisted_service_users_result.reviews || [];
      let current_review = assisted_service_users_result.reviews.find(item => item.order_id === review.order_id);
      if (current_review) {
        assisted_service_users_result.reviews.map(item => {
          if (item.order_id === review.order_id) {
            return review;
          }

          return item;
        });
      } else {
        reviews.push(review);
      }
      await assisted_service_user.updateAttributes(assisted_service_users_result);
      const assisted_service_user_result = assisted_service_user.toJSON();
      const service_user_id = assisted_service_user_result.id;
      return assisted_service_user_result;
    }

    return undefined;
  }

  async retrieveOrCreateSellerOffers(options, defaults) {
    let seller_offer = await this.modals.seller_offers.findOne({
      where: options
    });
    if (seller_offer && options.id && seller_offer.id.toString() === options.id.toString()) {
      const seller_offer_result = seller_offer.toJSON();
      defaults.status_type = seller_offer_result.status_type || 1;
      await seller_offer.updateAttributes(defaults);
    } else {
      seller_offer = await this.modals.seller_offers.create(defaults);
    }
    return seller_offer.toJSON();
  }

  async retrieveOrCreateSellerCredits(options, defaults) {
    let credit_wallet = await this.modals.credit_wallet.findOne({
      where: options
    });
    if (credit_wallet && options.id) {
      const credit_wallet_result = credit_wallet.toJSON();
      defaults.status_type = credit_wallet_result.status_type;
      await credit_wallet.updateAttributes(defaults);
    } else if (!options.id) {
      credit_wallet = await this.modals.credit_wallet.create(defaults);
    }

    return credit_wallet ? credit_wallet.toJSON() : credit_wallet;
  }

  async retrieveOrCreateSellerPoints(options, defaults) {
    let loyalty_wallet = await this.modals.loyalty_wallet.findOne({ where: options });
    if (loyalty_wallet && options.id) {
      const loyalty_wallet_result = loyalty_wallet.toJSON();
      defaults.status_type = loyalty_wallet_result.status_type;
      await loyalty_wallet.updateAttributes(defaults);
    } else if (!options.id) {
      loyalty_wallet = await this.modals.loyalty_wallet.create(defaults);
    }
    return loyalty_wallet ? loyalty_wallet.toJSON() : loyalty_wallet;
  }

  async retrieveOrCreateSellerLoyaltyRules(options, defaults) {
    let loyalty_rules = await this.modals.loyalty_rules.findOne({ where: options });
    if (loyalty_rules && options.id) {
      const loyalty_rules_result = loyalty_rules.toJSON();
      defaults.status_type = loyalty_rules_result.status_type;
      await loyalty_rules.updateAttributes(defaults);
    } else if (!options.id) {
      loyalty_rules = await this.modals.loyalty_rules.create(defaults);
    }
    return loyalty_rules ? loyalty_rules.toJSON() : loyalty_rules;
  }

  async retrieveSellerLoyaltyRules(options) {
    let loyalty_rules = await this.modals.loyalty_rules.findAll({ where: options });
    return loyalty_rules.map(item => item.toJSON());
  }

}
exports.default = SellerAdaptor;