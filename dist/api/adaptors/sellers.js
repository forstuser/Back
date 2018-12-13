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

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _sms = require('../../helpers/sms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SellerAdaptor {
  constructor(modals, notificationAdaptor) {
    this.modals = modals;
    this.categoryAdaptor = new _category2.default(modals);
    this.userAdaptor = new _user2.default(modals);
    if (notificationAdaptor) {
      this.notificationAdaptor = notificationAdaptor;
    }
  }

  async retrieveOfflineSellers(options) {
    options.status_type = [1, 11];
    const result = await this.modals.sellers.findAll({
      where: options,
      attributes: ['id', ['seller_name', 'name'], ['owner_name', 'ownerName'], 'gstin', ['pan_no', 'panNo'], ['reg_no', 'registrationNo'], ['is_service', 'isService'], ['is_onboarded', 'isOnboarded'], 'address', [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code'], 'latitude', 'longitude', 'url', ['contact_no', 'contact'], 'email']
    });
    return result.map(item => item.toJSON());
  }

  async retrieveSellers(options, query_options) {
    const { latitude, longitude, city, limit, offset, distance_filter_required } = options;
    const result = await this.modals.sellers.findAll(query_options);
    let sellers = result.map(item => item.toJSON());
    if (sellers.length > 0) {
      if (latitude && longitude) {
        sellers = await this.orderSellerByLocation({
          latitude, longitude, city, sellers,
          distance_filter_required
        });
      }
      // sellers = _.slice(sellers, offset, limit);
      let seller_id = sellers.map(item => item.id),
          city_ids = sellers.map(item => item.city_id).filter(item => item),
          state_ids = sellers.map(item => item.state_id).filter(item => item),
          locality_ids = sellers.map(item => item.locality_id).filter(item => item);
      const [seller_categories, seller_cities, seller_states, seller_locations, assisted_services] = await _bluebird2.default.all([this.retrieveSellerCategories({ seller_id }), city_ids.length > 0 ? this.retrieveSellerCities({ id: city_ids }) : [], state_ids.length > 0 ? this.retrieveSellerStates({ id: state_ids }) : [], locality_ids.length > 0 ? this.retrieveSellerLocations({ id: locality_ids }) : [], this.retrieveSellerAssistedServices({
        where: { seller_id },
        include: {
          model: this.modals.assisted_service_users,
          attributes: ['is_verified']
        }
      })]);
      sellers = sellers.map(item => {
        item.categories = seller_categories.filter(cItem => cItem.seller_id === item.id);
        item.city = seller_cities.find(cItem => cItem.id === item.city_id);
        item.state = seller_states.find(cItem => cItem.id === item.state_id);
        item.location = seller_locations.find(cItem => cItem.id === item.locality_id);
        item.assisted_services = assisted_services.filter(asItem => asItem.assisted_service_user.is_verified && asItem.seller_id === item.id);
        item.cashback_total = (item.cashback_total || 0) - (item.redeemed_cashback || 0);
        item.loyalty_total = (item.loyalty_total || 0) - (item.redeemed_loyalty || 0);
        item.credit_total = (item.credit_total || 0) - (item.redeemed_credits || 0);
        item.offer_count = item.offer_count || 0;
        item.ratings = item.ratings || 0;
        item.order_counts = parseInt(item.order_counts || 0);
        item.transaction_counts = parseInt(item.transaction_counts || 0);

        if (item.seller_details) {
          item.seller_details = _lodash2.default.omit(item.seller_details, ['offers', 'assisted_type_images']);
        }
        return item;
      });
    }

    return sellers;
  }

  async retrieveOfferSellers(options, query_options) {
    const { latitude, longitude, city } = options;
    const result = await this.modals.sellers.findAll(query_options);
    let sellers = result.map(item => item.toJSON()).filter(item => !item.is_logged_out);
    if (sellers.length > 0) {
      if (latitude && longitude) {
        sellers = await this.orderSellerByLocation({
          latitude, longitude, city, sellers,
          distance_filter_required: false
        });
      }

      let seller_id = sellers.map(item => item.id);
      const seller_offers = await this.retrieveSellerOfferBrandsCategories({ seller_id, on_sku: true, offer_discount: { $gt: 0 } }, seller_id);

      sellers = sellers.map(item => {
        item.offer_count = parseInt((item.offer_count || 0).toString());
        item.sku_offer_count = parseInt((item.sku_offer_count || 0).toString());
        item.ratings = item.ratings || 0;
        const offers = seller_offers.filter(offerItem => item.id === offerItem.seller_id);
        const seller_brands = [];
        const seller_categories = [];
        offers.forEach(offer_item => {
          const { brand_id, brand_name, sub_category_id, sub_category_name } = offer_item;
          seller_brands.push({ id: brand_id, name: brand_name });
          seller_categories.push({ id: sub_category_id, name: sub_category_name });
        });
        item.max_page = Math.ceil(offers.length / _main2.default.SKU_LIMIT);
        item.brands = _lodash2.default.sortedUniqBy(_lodash2.default.uniqBy(seller_brands, 'id'), 'name');
        item.categories = _lodash2.default.sortedUniqBy(_lodash2.default.uniqBy(seller_categories, 'id'), 'name');
        return item;
      });
    }

    console.log(JSON.stringify({ sellers }));
    return sellers.filter(item => item.offer_count > 0 || item.sku_offer_count > 0);
  }

  async retrieveSellerOfferBrandsCategories(options) {
    options.end_date = { $gte: _moment2.default.utc() };
    let seller_offers = await this.modals.seller_offers.findAll({
      where: JSON.parse(JSON.stringify(options)), attributes: [[this.modals.sequelize.literal('(select category_name from categories as cat where cat.category_id in (Select sub_category_id from table_sku_global as sku where sku.id = seller_offers.sku_id))'), 'sub_category_name'], [this.modals.sequelize.literal('(Select sub_category_id from table_sku_global as sku where sku.id = seller_offers.sku_id)'), 'sub_category_id'], [this.modals.sequelize.literal('(select brand_id from table_sku_global as sku where sku.id = seller_offers.sku_id)'), 'brand_id'], [this.modals.sequelize.literal('(select brand_name from brands as brand where brand.brand_id in (Select brand_id from table_sku_global as sku where sku.id = seller_offers.sku_id))'), 'brand_name'], 'seller_id']
    });
    seller_offers = seller_offers.map(item => item.toJSON());
    return seller_offers;
  }

  async retrieveSellerOfferSKUs(where, seller_offers) {
    const sku_details = await this.retrieveSellerSKUs({
      where, attributes: ['id', 'sku_id', 'sku_measurement_id', 'offer_discount', 'offer_id', [this.modals.sequelize.literal('(select title from table_sku_global as sku where sku.id = sku_seller.sku_id)'), 'sku_title'], [this.modals.sequelize.literal('(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id)'), 'measurement_value'], [this.modals.sequelize.literal('(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id)'), 'bar_code'], [this.modals.sequelize.literal('(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id limit 1))'), 'acronym'], [this.modals.sequelize.literal('(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id)'), 'mrp']]
    });
    return seller_offers.map(item => {
      if (item.on_sku) {
        item.sku = sku_details.find(skuItem => skuItem.offer_id === item.id);
      }
      return item;
    });
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

  async retrieveOrUpdateSellerDetail(parameters) {
    let { query_options, seller_detail, is_create, user } = parameters;
    let result = await this.modals.sellers.findOne(query_options);
    if (!result && is_create) {
      result = await this.modals.sellers.create(seller_detail);
    }

    if (result) {
      (await seller_detail) ? result.updateAttributes(JSON.parse(JSON.stringify(seller_detail))) : seller_detail;
      return result.toJSON();
    }
    if (user && user.user_status_type === 1) {
      await this.notificationAdaptor.notifyUserCron({
        user_id: user.id, payload: {
          title: `You have been added as a customer by your Seller ${seller_detail.seller_name || ''} to experience multiple benefits.`,
          description: 'Please click here for more detail.',
          notification_type: 35
        }
      });
    }
    return result;
  }

  async retrieveOrUpdateInvitedSellerDetail(query_options, seller_detail, is_create) {
    let result = await this.modals.invited_sellers.findOne(query_options);
    if (!result && is_create) {
      result = await this.modals.invited_sellers.create(seller_detail);
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

  async retrieveSellerDetailNonJSON(query_options) {
    return await this.modals.sellers.findOne(query_options);
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

  async retrieveSellerOffer(query_options) {
    const result = await this.modals.seller_offers.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async retrieveSellerWalletDetail(query_options) {
    const result = await this.modals.seller_wallet.findAll(query_options);
    return result ? result.map(item => item.toJSON()) : result;
  }

  async retrieveSellerOfferDetail(query_options) {
    const result = await this.modals.seller_offers.findOne(query_options);
    return result ? result.toJSON() : result;
  }

  async retrieveSellerConsumers(parameters) {
    let { seller_id, mobile_no, offer_id, user_status_type, page_no } = parameters;
    let seller_users, id, user_index_data;
    user_status_type = user_status_type || 1;
    mobile_no = mobile_no ? { $iLike: `${mobile_no}%` } : undefined;
    seller_users = await this.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['customer_ids', 'latitude', 'longitude', 'address', [this.modals.sequelize.literal('(Select minimum_points from table_loyalty_rules as loyalty_rule where loyalty_rule.seller_id = sellers.id limit 1)'), 'minimum_points'], [this.modals.sequelize.literal('(Select item_value from table_loyalty_rules as loyalty_rule where loyalty_rule.seller_id = sellers.id limit 1)'), 'item_value'], [this.modals.sequelize.literal('(Select points_per_item from table_loyalty_rules as loyalty_rule where loyalty_rule.seller_id = sellers.id limit 1)'), 'points_per_item'], [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code']]
    });
    id = (seller_users.customer_ids || []).map(item => item.customer_id || item);
    const { minimum_points, item_value, points_per_item } = seller_users;
    const { latitude, longitude, address, city_name: city } = seller_users;
    const order = user_status_type && user_status_type === 2 ? [['created_at', 'desc'], ['full_name', 'asc']] : [['full_name', 'asc']];
    const result = await _bluebird2.default.all([this.modals.users.findAll({
      where: JSON.parse(JSON.stringify(mobile_no ? { mobile_no } : { id, user_status_type })),
      limit: !page_no ? 100 : _main2.default.CONSUMER_LIMIT, offset: !page_no || page_no && (page_no.toString() === '0' || isNaN(page_no)) ? 0 : _main2.default.CONSUMER_LIMIT * parseInt(page_no), attributes: [['full_name', 'name'], 'image_name', 'email', 'created_at', 'mobile_no', 'location', 'id', 'user_status_type', [this.modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16) and transaction_type = 1 and seller_cashback.user_id = "users"."id" and seller_cashback.seller_id = ${seller_id})`), 'cashback_total'], [this.modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_seller_cashback as seller_cashback where status_type in (16,14) and transaction_type = 2 and seller_cashback.user_id = "users"."id" and seller_cashback.seller_id = ${seller_id})`), 'redeemed_cashback'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16) and transaction_type = 1 and seller_loyalty.user_id = "users"."id" and seller_loyalty.seller_id = ${seller_id})`), 'loyalty_total'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_loyalty as seller_loyalty where status_type in (16,14) and transaction_type = 2 and seller_loyalty.user_id = "users"."id" and seller_loyalty.seller_id = ${seller_id})`), 'redeemed_loyalty'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16) and transaction_type = 1 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'credit_total'], [this.modals.sequelize.literal(`(select sum(amount) from table_wallet_seller_credit as seller_credit where status_type in (16,14) and transaction_type = 2 and seller_credit.user_id = "users"."id" and seller_credit.seller_id = ${seller_id})`), 'redeemed_credits'], [this.modals.sequelize.literal(`(select count(*) from table_cashback_jobs as cashback_jobs where cashback_jobs.user_id = "users"."id" and cashback_jobs.admin_status <> 2 and cashback_jobs.seller_id = ${seller_id})`), 'transaction_counts'], [this.modals.sequelize.literal(`(select count(*) from table_orders as order_detail where order_detail.user_id = "users"."id" and order_detail.seller_id = ${seller_id} and order_detail.job_id is null and order_detail.status_type = 5)`), 'order_counts'], [this.modals.sequelize.literal(`(select seller_offer_ids from table_user_index as user_index where user_index.user_id = "users"."id")`), 'seller_offer_ids']], order
    }), this.modals.users.count({
      where: JSON.parse(JSON.stringify(mobile_no ? { mobile_no } : { id, user_status_type }))
    })]);
    seller_users.customer_ids = (seller_users.customer_ids || []).map(cId => cId.customer_id ? cId : { customer_id: cId, is_credit_allowed: false, credit_limit: 0 });
    let user_list = result[0].map(item => {
      item = item.toJSON();
      const seller_customer = (seller_users.customer_ids || []).find(cId => cId.customer_id && cId.customer_id.toString() === item.id.toString());
      item.is_credit_allowed = false;
      item.credit_limit = 0;
      if (seller_customer) {
        item.is_credit_allowed = seller_customer.is_credit_allowed || false;
        item.credit_limit = seller_customer.credit_limit || 0;
      }
      return item;
    });
    const addresses = (await this.userAdaptor.retrieveUserAddresses({
      where: {
        address_type: 1,
        user_id: (user_list || []).map(item => item.id).filter(item => item)
      }
    })).map(item => item.toJSON());
    user_list = user_list.map(item => {
      const linked_user = (seller_users.customer_ids || []).find(suItem => suItem.customer_id && suItem.customer_id.toString() === item.id.toString());
      item.linked = !!linked_user;
      item.cashback_total = parseInt(item.cashback_total || 0);
      item.redeemed_cashback = parseInt(item.redeemed_cashback || 0);
      item.loyalty_total = parseInt(item.loyalty_total || 0) - parseInt(item.redeemed_loyalty || 0);
      item.credit_total = parseInt(item.credit_total || 0) - parseInt(item.redeemed_credits || 0);
      item.addresses = (addresses || []).find(aItem => aItem.user_id === item.id) || {};
      item.transaction_counts = parseInt(item.transaction_counts || 0);
      item.order_counts = parseInt(item.order_counts || 0);
      if (item.addresses) {
        const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.addresses || {};
        item.address = `${address_line_2 ? `${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
      }
      if (offer_id) {
        const seller_offer_id = (item.seller_offer_ids || []).find(item => item.toString() === offer_id.toString());
        item.linked_offer = !!seller_offer_id;
      }
      return item;
    });
    return {
      seller_customers: user_status_type && user_status_type === 2 ? user_list : await this.orderUserByLocation(latitude, longitude, city, user_list),
      customer_count: result[1], last_page: result[1] > _main2.default.CONSUMER_LIMIT ? Math.ceil(result[1] / _main2.default.CONSUMER_LIMIT) - 1 : 0, loyalty_rule: { item_value, minimum_points, points_per_item }
    };
  }

  async retrieveSellerConsumerCashBack(seller_id, mobile_no) {
    let seller_users, id, user_index_data;
    seller_users = await this.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['customer_ids']
    });
    id = (seller_users.customer_ids || []).map(item => item.customer_id || item);
    const result = await this.modals.users.findAll({
      where: mobile_no ? JSON.parse(JSON.stringify({ $and: { mobile_no } })) : { id },
      attributes: [['full_name', 'name'], 'image_name', 'email', 'mobile_no', 'location', 'id', 'user_status_type', [this.modals.sequelize.literal(`(select sum(seller_cashback.amount) from table_wallet_user_cashback as seller_cashback where status_type in (16,14) and transaction_type in (1,2) and seller_cashback.user_id = "users"."id" and seller_cashback.seller_id = ${seller_id})`), 'cashback_total']]
    });
    const user_list = result.map(item => item.toJSON()).filter(item => item.cashback_total > 0);
    const addresses = (await this.userAdaptor.retrieveUserAddresses({
      where: {
        address_type: 1,
        user_id: (user_list || []).map(item => item.id).filter(item => item)
      }
    })).map(item => item.toJSON());
    return user_list.map(item => {
      const linked_user = (seller_users.customer_ids || []).find(suItem => suItem.toString() === item.id.toString());
      item.linked = !!linked_user;
      item.cashback_total = item.cashback_total || 0;
      item.addresses = addresses.find(aItem => item.id === aItem.user_id) || {};
      if (item.addresses) {
        const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.addresses || {};
        item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
        item.user_address_detail = item.user_address_detail.trim();
      }
      return item;
    });
  }

  async retrieveSellerConsumerTransactions(seller_id) {
    let id, job_id, expense_id;
    let [cashback_jobs, orders, seller_users] = await _bluebird2.default.all([this.modals.cashback_jobs.findAll({
      where: { seller_id, admin_status: { $ne: 2 } },
      attributes: ['job_id', 'user_id']
    }), this.modals.order.findAll({
      where: { seller_id, status_type: 5 },
      attributes: ['expense_id', 'user_id']
    }), this.retrieveSellerDetail({
      where: { id: seller_id }, attributes: ['customer_ids']
    })]);
    id = _lodash2.default.uniq([...cashback_jobs.map(item => {
      item = item.toJSON();
      return item.user_id;
    }), ...orders.map(item => {
      item = item.toJSON();
      return item.user_id;
    }), ...seller_users.customer_ids.map(item => item.customer_id ? item.customer_id : item)]).filter(item => item);
    job_id = cashback_jobs.map(item => {
      item = item.toJSON();
      return item.job_id;
    }).filter(item => item);
    expense_id = orders.map(item => {
      item = item.toJSON();
      return item.expense_id;
    }).filter(item => item);
    const result = await this.modals.users.findAll({
      where: { id },
      attributes: [['full_name', 'name'], 'image_name', 'email', 'mobile_no', 'location', 'id', 'user_status_type', [this.modals.sequelize.literal(`(select sum(products.purchase_cost) from consumer_products as products where  products.user_id = "users"."id" and products.seller_id = ${seller_id} and status_type in (5,11) and (${job_id.length > 0 && expense_id.length > 0 ? `"products"."job_id" in (${job_id.join(',')}) or "products"."id" in (${expense_id.join(',')})` : `${job_id.length > 0 ? `"products"."job_id" in (${job_id.join(',')})` : ''} ${expense_id.length > 0 ? `"products"."id" in (${expense_id.join(',')})` : ''}`}))`), 'total_transactions']]
    });
    const user_list = result.map(item => item.toJSON());
    const addresses = (await this.userAdaptor.retrieveUserAddresses({
      where: {
        address_type: 1,
        user_id: (user_list || []).map(item => item.id).filter(item => item)
      }
    })).map(item => item.toJSON());
    seller_users.customer_ids = (seller_users.customer_ids || []).map(item => item.customer_id ? item : { customer_id: item, is_credit_allowed: false, credit_limit: 0 });
    return user_list.map(item => {
      const linked_user = (seller_users.customer_ids || []).find(suItem => suItem.customer_id && suItem.customer_id.toString() === item.id.toString());
      item.linked = !!linked_user;
      item.total_transactions = item.total_transactions || 0;
      item.addresses = addresses.find(aItem => aItem.user_id === item.id) || {};
      if (item.addresses) {
        const { address_line_1, address_line_2, city_name, state_name, locality_name, pin_code } = item.addresses || {};
        item.user_address_detail = `${address_line_1 ? address_line_1 : ''}${address_line_2 ? ` ${address_line_2}` : ''}${locality_name || city_name || state_name ? ',' : pin_code ? '-' : ''}${locality_name ? locality_name : ''}${city_name || state_name ? ',' : pin_code ? '-' : ''}${city_name ? city_name : ''}${state_name ? ',' : pin_code ? '-' : ''}${state_name ? state_name : ''}${pin_code ? '- ' : ''}${pin_code ? pin_code : ''}`.split('null').join(',').split('undefined').join(',').split(',,').join(',').split(',-,').join(',').split(',,').join(',').split(',,').join(',');
        item.user_address_detail = item.user_address_detail.trim();
      }

      return item;
    });
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
    const { seller_id, id } = query_options;
    return await _bluebird2.default.all([this.modals.assisted_service_users.update({ seller_id: null }, { where: query_options }), this.modals.seller_service_types.update({ seller_id: null }, { where: { seller_id, service_user_id: id } })]);
  }

  async deleteSellerAssistedServiceTypes(query_options) {
    const { seller_id, service_user_id, id } = query_options;
    return await _bluebird2.default.all([this.modals.seller_service_types.update({ seller_id: null }, { where: query_options })]);
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
      const $or = seller_offer_ids && seller_offer_ids.length > 0 ? { id: seller_offer_ids, on_sku: true } : { on_sku: true };
      const [seller_categories, seller_cash_backs, seller_loyalty_points, seller_credits, seller_cities, seller_states, seller_locations, seller_reviews, service_types, assisted_services] = await _bluebird2.default.all([this.retrieveSellerCategories({ seller_id }), user_id ? this.retrieveSellerCashBack({ seller_id, user_id }) : [], user_id ? this.retrieveSellerLoyaltyPoints({ seller_id, user_id }) : [], user_id ? this.retrieveSellerCredits({ seller_id, user_id }) : [], city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : [], this.retrieveSellerReviews({ offline_seller_id: seller_id }), this.retrieveAssistedServiceTypes({}), this.retrieveSellerAssistedServiceUsers({
        include: {
          as: 'service_types', where: { seller_id },
          model: this.modals.seller_service_types, required: true,
          attributes: ['service_type_id', 'seller_id', 'price', 'id']
        }, attributes: ['id', 'name', 'mobile_no', 'reviews', 'document_details']
      })]);
      seller.categories = seller_categories;
      seller.seller_cash_backs = seller_cash_backs;
      seller.seller_loyalty_points = seller_loyalty_points;
      seller.seller_credits = seller_credits;
      seller.city = seller_cities[0];
      seller.state = seller_states[0];
      seller.location = seller_locations[0];
      seller.reviews = seller_reviews;
      seller.cashback_total = seller.cashback_total || 0;
      seller.loyalty_redeemed = seller.loyalty_redeemed || 0;
      seller.credit_redeemed = seller.credit_redeemed || 0;
      seller.loyalty_total = (seller.loyalty_total || 0) - seller.loyalty_redeemed;
      seller.credit_total = (seller.credit_total || 0) - seller.credit_redeemed;
      seller.offer_count = seller.offer_count || 0;
      seller.ratings = seller.ratings || 0;
      seller.transaction_counts = parseInt(seller.transaction_counts || 0);
      seller.order_counts = parseInt(seller.order_counts || 0);

      if (seller.seller_details) {
        seller.seller_details = _lodash2.default.omit(seller.seller_details, ['offers', 'assisted_type_images']);
      }
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

  async retrieveSellerAddressDifference(address_query_options, query_options) {
    let [seller, user_address] = await _bluebird2.default.all([this.modals.sellers.findOne(query_options), this.userAdaptor.retrieveUserAddress(address_query_options)]);
    seller = seller ? seller.toJSON() : seller;

    if (seller && user_address) {

      let { latitude, longitude, address_line_1, address_line_2, state_name, city_name, locality_name, pin_code } = user_address;

      if (latitude && longitude) {
        seller = await this.retrieveSellerByLocation(latitude, longitude, city_name, seller);
      }
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
      const [seller_categories, seller_cities, seller_states, seller_locations, seller_reviews] = await _bluebird2.default.all([this.retrieveSellerCategories({ seller_id }), city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : []]);
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
      const [seller_cities, seller_states, seller_locations, seller_reviews] = await _bluebird2.default.all([city_id ? this.retrieveSellerCities({ id: city_id }) : [], state_id ? this.retrieveSellerStates({ id: state_id }) : [], locality_id ? this.retrieveSellerLocations({ id: locality_id }) : []]);
      seller.city = seller_cities[0];
      seller.state = seller_states[0];
      seller.location = seller_locations[0];
      seller.address_detail = `${seller.address},${(seller.location || {}).name},${(seller.city || {}).name},${(seller.state || {}).state_name}-${(seller.location || {}).pin_code}`.replace(',,', ',').replace(',,', ',').replace(',,', ',');
      seller.cashback_total = seller.cashback_total || 0;
      seller.cashback_redeemed = seller.cashback_redeemed || 0;
      seller.cashback_total = _lodash2.default.round(seller.cashback_total - seller.cashback_redeemed, 2);
      seller.offer_count = seller.offer_count || 0;
      seller.ratings = _lodash2.default.round(seller.ratings || 0, 2);
      if (seller.seller_details) {
        seller.seller_details = _lodash2.default.omit(seller.seller_details, ['offers', 'assisted_type_images']);
      }
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
      attributes: ['sub_category_id', 'category_brands', 'seller_id', 'provider_type_id', 'category_4_id', 'brand_ids']
    });
    seller_categories = seller_categories.map(item => item.toJSON());
    let categories_data = [];
    seller_categories.forEach(item => {
      item.category_brands = item.category_brands || [{}];
      categories_data.push(...item.category_brands.map(cbItem => {
        cbItem.seller_id = item.seller_id;
        cbItem.sub_category_id = item.sub_category_id;
        cbItem.provider_type_id = item.provider_type_id;
        cbItem.category_4_id = cbItem.category_4_id || item.category_4_id;
        cbItem.brand_ids = cbItem.brand_ids || item.brand_ids;

        return cbItem;
      }));
    });

    if (categories_data.length > 0) {
      const [sku_categories, provider_types] = await _bluebird2.default.all([this.categoryAdaptor.retrieveSellerCategories({
        where: {
          category_id: _lodash2.default.uniq([...categories_data.map(item => item.sub_category_id), ...categories_data.map(item => item.category_4_id)])
        }, attributes: ['category_id', 'category_name']
      }), this.retrieveProviderTypes({
        where: {
          id: _lodash2.default.uniq(categories_data.map(item => item.provider_type_id))
        },
        attributes: ['id', 'title']
      })]);
      categories_data = categories_data.map(item => {
        const provider_type = provider_types.find(pItem => pItem.id === item.provider_type_id);
        const category_detail = sku_categories.find(cItem => cItem.category_id === item.sub_category_id);
        const category_4_detail = sku_categories.find(cItem => cItem.category_id === item.category_4_id);
        console.log(JSON.stringify({ category_detail, category_4_detail }));
        item.category_name = (category_detail || {}).category_name;
        item.category_4_name = (category_4_detail || {}).category_name;
        item.provider_type = (provider_type || {}).title;
        return item;
      });
    }

    return categories_data;
  }

  async retrieveSellerCashBack(options) {
    let seller_cash_back = await this.modals.cashback_wallet.findAll({ where: JSON.parse(JSON.stringify(options)), order: [['id', 'desc']] });
    seller_cash_back = seller_cash_back.map(item => item.toJSON());
    return seller_cash_back;
  }

  async retrieveSellerTransactions(options) {
    let seller_cash_back = await this.modals.cashback_jobs.findAll(options);
    seller_cash_back = seller_cash_back.map(item => {
      item = item.toJSON();
      item.total_cashback = item.total_cashback || 0;
      item.total_credits = (item.total_credits || 0) - (item.redeemed_credits || 0);
      item.total_loyalty = (item.total_loyalty || 0) - (item.redeemed_loyalty || 0);
      item.amount_paid = item.amount_paid || 0;
      return item;
    });
    return seller_cash_back;
  }

  async retrieveSellerOffersForConsumer(options, limit, offset) {
    options.end_date = { $gte: _moment2.default.utc() };
    const $and = options.$and;
    options = JSON.parse(JSON.stringify(_lodash2.default.omit(options, '$and')));
    if ($and) options.$and = $and;
    let seller_offers = await this.modals.seller_offers.findAll({
      where: options, attributes: ['id', 'seller_id', 'title', 'description', 'on_sku', 'offer_type', 'start_date', 'end_date', 'document_details', 'sku_id', 'sku_measurement_id', 'offer_discount', 'seller_mrp', [this.modals.sequelize.literal('(select category_name from categories as cat where cat.category_id in (Select sub_category_id from table_sku_global as sku where sku.id = seller_offers.sku_id))'), 'sub_category_name'], 'brand_offer_id', [this.modals.sequelize.literal('(Select sub_category_id from table_sku_global as sku where sku.id = seller_offers.sku_id)'), 'sub_category_id'], [this.modals.sequelize.literal('(select title from table_sku_global as sku where sku.id = seller_offers.sku_id)'), 'sku_title'], [this.modals.sequelize.literal(`(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = seller_offers.sku_measurement_id)`), 'measurement_value'], [this.modals.sequelize.literal(`(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = seller_offers.sku_measurement_id limit 1))`), 'acronym'], [this.modals.sequelize.literal(`(Select title from table_brand_offers as brand_offer where brand_offer.id = seller_offers.brand_offer_id limit 1)`), 'brand_offer_title'], [this.modals.sequelize.literal(`(Select acronym from table_sku_measurement as measure where measure.id = seller_offers.sku_measurement_type)`), 'offer_acronym'], [this.modals.sequelize.literal(`(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = seller_offers.sku_measurement_id)`), 'mrp'], [this.modals.sequelize.literal(`(select bar_code from table_sku_measurement_detail as sku_measure where sku_measure.id = seller_offers.sku_measurement_id)`), 'bar_code']], order: [['updated_at', 'desc']], limit, offset
    });
    seller_offers = seller_offers.map(item => {
      item = item.toJSON();
      item.mrp = item.seller_mrp || item.mrp;
      item.title = item.title || item.brand_offer_title;
      return item;
    });
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
      }, attributes: ['review_feedback', 'review_ratings', 'order_id', 'user_id', ['review_feedback', 'feedback'], ['review_ratings', 'ratings'], ['user_id', 'updated_by'], 'offline_seller_id', [this.modals.sequelize.literal('(Select full_name from users where users.id = user_id)'), 'user_name']]
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
    const addresses = (await this.userAdaptor.retrieveUserAddresses({
      where: {
        address_type: 1,
        user_id: seller_credits.map(item => item.user_id).filter(item => item)
      }
    })).map(item => item.toJSON());
    seller_credits.forEach(item => {
      item = item.toJSON();
      item.address = addresses.find(aItem => aItem.user_id === item.user_id) || {};
      result.push(item);
    });
    return result;
  }

  async retrieveSellerLoyaltyPointsPerUser(options) {
    let seller_points = await this.modals.loyalty_wallet.findAll(options);
    const result = [];
    const addresses = (await this.userAdaptor.retrieveUserAddresses({
      where: {
        address_type: 1,
        user_id: seller_points.map(item => item.user_id).filter(item => item)
      }
    })).map(item => item.toJSON());
    seller_points.forEach(item => {
      item = item.toJSON();
      item.address = addresses.find(aItem => aItem.user_id === item.user_id) || {};
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

  async retrieveSellerSKUs(options) {
    const result = await this.modals.sku_seller.findAll(options);
    return result.map(item => item.toJSON());
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
      attributes: ['id', 'gstin', 'seller_name', 'owner_name', 'email', 'pan_no', 'reg_no', 'seller_type_id', 'is_service', 'is_onboarded', 'address', [this.modals.sequelize.literal('(Select state_name from table_states as state where state.id = sellers.state_id)'), 'state_name'], [this.modals.sequelize.literal('(Select name from table_cities as city where city.id = sellers.city_id)'), 'city_name'], [this.modals.sequelize.literal('(Select name from table_localities as locality where locality.id = sellers.locality_id)'), 'locality_name'], [this.modals.sequelize.literal('(Select pin_code from table_localities as locality where locality.id = sellers.locality_id)'), 'pin_code'], 'latitude', 'longitude', 'url', 'user_id', 'contact_no']
    });
    return result ? result.toJSON() : result;
  }

  async retrieveOrCreateSellers(options, defaults) {
    let sellerResult = await this.modals.sellers.findOne({
      where: options
    });

    if (sellerResult) {
      const sellerDetail = sellerResult.toJSON();
      defaults.seller_name = defaults.seller_name && defaults.seller_name !== '' ? defaults.seller_name : sellerDetail.seller_name ? sellerDetail.seller_name : '';
      defaults.status_type = sellerDetail.status_type;
      await sellerResult.updateAttributes(JSON.parse(JSON.stringify(defaults)));
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
          final_result.push(user);
        }
      } else {
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
        }

        final_result.push(user_with_location[i]);
      }
    }

    return _lodash2.default.orderBy(final_result, ['distance', 'created_at'], ['asc', 'desc']);
  }

  async orderSellerByLocation(parameters) {
    let { latitude, longitude, city, sellers, distance_filter_required } = parameters;
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
    try {
      if (_main2.default.ALLOW_GEO_FILTER && _main2.default.ALLOW_GEO_FILTER.toString().toLowerCase() === 'true') {
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

          console.log(JSON.stringify(final_result));
          return distance_filter_required ? _lodash2.default.orderBy(final_result.filter(elem => !!elem.distance && parseFloat(elem.distance) <= _main2.default.SELLER_FILTER_DISTANCE), ['distance'], ['asc']) : _lodash2.default.orderBy(final_result, ['distance'], ['asc']);
        }
      }

      return sellers;
    } catch (e) {
      await this.modals.logs.create({
        api_action: 'google.distanceMatrix',
        api_path: 'Distance Matrix', log_type: 1,
        log_content: JSON.stringify({ latitude, longitude, city, e })
      });
      return sellers;
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
    } else {
      seller.distanceMetrics = 'km';
      seller.distance = parseFloat(500.001);
      return seller;
    }
  }

  async retrieveOrCreateSellerProviderTypes(options, defaults, category_4_id) {
    let seller_provider_type = await this.modals.seller_provider_type.findOne({ where: options });
    category_4_id = category_4_id.map(item => parseInt(item));
    if (seller_provider_type) {
      const seller_provider_type_result = seller_provider_type.toJSON();
      if (!defaults.category_brands && category_4_id && category_4_id.length > 0) {
        const category_brands = seller_provider_type_result.category_brands;
        defaults.category_brands = (category_brands && category_brands.length > 0 ? category_brands : category_4_id.map(item => ({ category_4_id: parseInt(item || 0) }))).filter(item => _lodash2.default.includes(category_4_id, item.category_4_id));
      }

      defaults.status_type = seller_provider_type_result.status_type;
      await seller_provider_type.updateAttributes(defaults);
    } else {
      if (!defaults.category_brands && category_4_id && category_4_id.length > 0) {
        defaults.category_brands = category_4_id.map(item => ({ category_4_id: parseInt(item || 0) })).filter(item => _lodash2.default.includes(category_4_id, item.category_4_id));
      }
      seller_provider_type = await this.modals.seller_provider_type.create(defaults);
    }
    return seller_provider_type.toJSON();
  }

  async retrieveOrCreateSellerProviderBrands(options, defaults, category_4_id, brand_ids) {
    let seller_provider_type = await this.modals.seller_provider_type.findOne({ where: options });
    brand_ids = brand_ids.map(item => parseInt(item || 0));
    if (seller_provider_type) {
      const seller_provider_type_result = seller_provider_type.toJSON();
      defaults.category_brands = (seller_provider_type_result.category_brands || [{ category_4_id: parseInt(category_4_id || 0), brand_ids }]).map(item => {
        item.brand_ids = parseInt(item.category_4_id || 0) === parseInt(category_4_id || 0) || brand_ids.length === 0 ? brand_ids : item.brand_ids || [];
        item.category_4_id = parseInt(item.category_4_id || 0);
        return item;
      });
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
    assisted_service_user_result.service_types = service_types ? await _bluebird2.default.all(service_types.map(item => {
      const { price, service_type_id, seller_id, id } = item;
      return this.retrieveOrCreateSellerAssistedServiceTypes(JSON.parse(JSON.stringify({ service_type_id, seller_id, service_user_id, id })), JSON.parse(JSON.stringify({ service_type_id, seller_id, service_user_id, price })));
    })) : [];
    return assisted_service_user_result;
  }

  async updateAssistedUserReview(options, review) {
    let assisted_service_user = await this.modals.assisted_service_users.findOne({ where: options });
    if (assisted_service_user) {
      const assisted_service_users_result = assisted_service_user.toJSON();
      assisted_service_users_result.reviews = assisted_service_users_result.reviews || [];
      console.log(JSON.stringify({ review, options }));
      let current_review = assisted_service_users_result.reviews.find(item => item.order_id.toString() === review.order_id.toString());
      if (current_review) {
        assisted_service_users_result.reviews = assisted_service_users_result.reviews.map(item => {
          if (item.order_id.toString() === review.order_id.toString()) {
            return review;
          }

          return item;
        });
      } else {
        assisted_service_users_result.reviews.push(review);
      }
      await assisted_service_user.updateAttributes(assisted_service_users_result);
      return assisted_service_user.toJSON();
    }

    return undefined;
  }

  async retrieveOrCreateSellerOffers(options, defaults) {
    let seller_offer = await this.modals.seller_offers.findOne({
      where: options
    });
    if (seller_offer && (options.id && seller_offer.id.toString() === options.id.toString() || options.sku_id && seller_offer.sku_id.toString() === options.sku_id.toString() && options.sku_measurement_id && seller_offer.sku_measurement_id.toString() === options.sku_measurement_id.toString())) {
      const seller_offer_result = seller_offer.toJSON();
      defaults.status_type = seller_offer_result.status_type || 1;
      await seller_offer.updateAttributes(defaults);
    } else {
      seller_offer = await this.modals.seller_offers.create(defaults);
    }
    return seller_offer.toJSON();
  }

  async retrieveOrCreateSellerSKU(options, defaults) {
    let sku_seller;
    if (defaults) {
      sku_seller = await this.modals.sku_seller.findOne({
        where: options
      });
      if (sku_seller) {
        const sku_seller_result = sku_seller.toJSON();
        defaults.status_type = sku_seller_result.status_type || 1;
        await sku_seller.updateAttributes(defaults);
      } else {
        await this.modals.sku_seller.create(defaults);
      }
    }

    sku_seller = await this.modals.sku_seller.findOne({
      where: options,
      attributes: ['id', 'sku_id', 'sku_measurement_id', 'offer_discount', 'offer_id', [this.modals.sequelize.literal('(select title from table_sku_global as sku where sku.id = sku_seller.sku_id)'), 'sku_title'], [this.modals.sequelize.literal('(select measurement_value from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id)'), 'measurement_value'], [this.modals.sequelize.literal('(Select acronym from table_sku_measurement as measure where measure.id = (select measurement_type from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id limit 1))'), 'acronym'], [this.modals.sequelize.literal('(select mrp from table_sku_measurement_detail as sku_measure where sku_measure.id = sku_seller.sku_measurement_id)'), 'mrp']]
    });

    return sku_seller.toJSON();
  }

  async retrieveOrCreateSellerCredits(options, defaults, seller_name, seller_id) {
    let credit_wallet = await this.modals.credit_wallet.findOne({
      where: options
    });
    if (credit_wallet && options.id) {
      const credit_wallet_result = credit_wallet.toJSON();
      defaults.status_type = credit_wallet_result.status_type;
      await credit_wallet.updateAttributes(defaults);
    } else if (!options.id) {
      credit_wallet = await this.modals.credit_wallet.create(defaults);
      if (defaults.status_type === 16) {
        await this.notificationAdaptor.notifyUserCron({
          user_id: defaults.user_id, payload: {
            title: `₹${defaults.amount} has been added as Credit by your Seller ${seller_name || ''}!`,
            description: 'Please click here for more detail.',
            notification_type: 33, seller_id
          }
        });
      } else {
        await this.notificationAdaptor.notifyUserCron({
          user_id: defaults.user_id, payload: {
            title: `₹${defaults.amount} has been settled against Credit by your Seller ${seller_name || ''}!`,
            description: 'Please click here for more detail.',
            notification_type: 33, seller_id
          }
        });
      }
    }

    return credit_wallet ? credit_wallet.toJSON() : credit_wallet;
  }

  async retrieveOrCreateSellerPoints(options, defaults, seller_name, seller_id) {
    let loyalty_wallet = await this.modals.loyalty_wallet.findOne({ where: options });
    if (loyalty_wallet && options.id) {
      const loyalty_wallet_result = loyalty_wallet.toJSON();
      defaults.status_type = loyalty_wallet_result.status_type;
      await loyalty_wallet.updateAttributes(defaults);
    } else if (!options.id) {
      loyalty_wallet = await this.modals.loyalty_wallet.create(defaults);
      if (loyalty_wallet) {
        const loyalty_wallet_data = loyalty_wallet.toJSON();
        let [user_detail, loyalty_rules] = await _bluebird2.default.all([this.modals.users.findOne({
          where: { id: loyalty_wallet_data.user_id },
          attributes: ['user_status_type', 'mobile_no']
        }), this.retrieveSellerLoyaltyRules(JSON.parse(JSON.stringify({ seller_id: loyalty_wallet_data.seller_id })))]);
        user_detail = user_detail ? user_detail.toJSON() : {};
        if (loyalty_wallet_data.status_type === 16) {
          await _bluebird2.default.all([this.notificationAdaptor.notifyUserCron({
            user_id: defaults.user_id, payload: {
              title: `Yay! You have received ${defaults.amount} Loyalty Points from your Seller ${seller_name || ''}!`,
              description: 'Please click here for more detail.',
              notification_type: 32, seller_id
            }
          }), (0, _sms.sendSMS)(`Hurray! ${seller_name || 'BinBill partner'} has credited ${loyalty_wallet_data.amount} Loyalty Points equivalent to ₹${loyalty_wallet_data.amount / loyalty_rules.points_per_item * loyalty_rules.item_value}/- in your Wallet.${user_detail.user_status_type === 1 ? '' : 'Download BinBill App Now to redeem your reward! http://bit.ly/binbill'}`, [user_detail.mobile_no])]);
        }
      }
    }
    return loyalty_wallet ? loyalty_wallet.toJSON() : loyalty_wallet;
  }

  async retrieveOrCreateSellerLoyaltyRules(options, defaults) {
    let loyalty_rules = await this.modals.loyalty_rules.findOne({ where: options });
    if (loyalty_rules) {
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
    return loyalty_rules.map(item => item.toJSON())[0];
  }

  async retrieveSellersToLink(options, query_options) {
    const { latitude, longitude, city } = options;
    const result = await this.modals.sellers.findAll(query_options);
    let sellers = result.map(item => item.toJSON());
    if (sellers.length > 0) {
      if (latitude && longitude) {
        sellers = await this.orderSellerByLocation({
          latitude, longitude, city, sellers,
          distance_filter_required: true
        });
      }
    }

    return sellers;
  }
}
exports.default = SellerAdaptor;