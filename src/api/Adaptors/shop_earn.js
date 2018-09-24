import Promise from 'bluebird';
import ProductAdapter from './product';
import SellerAdapter from './sellers';
import _ from 'lodash';
import config from '../../config/main';

export default class ShopEarnAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new ProductAdapter(modals);
    this.sellerAdapter = new SellerAdapter(modals);
  }

  async retrieveSKUs(options) {
    try {
      const {user_id, location, queryOptions, seller_list} = options;
      let {main_category_id, category_id, brand_ids, sub_category_ids, measurement_values, measurement_types, bar_code, title, limit, offset, id, seller_id} = queryOptions ||
      {};
      let seller, seller_skus = [], seller_categories = [];
      category_id = (category_id || '').trim().
          split(',').filter(item => !!item);
      main_category_id = (main_category_id || '').trim().
          split(',').filter(item => !!item);
      brand_ids = (brand_ids || '').trim().split(',').filter(item => !!item);
      if (seller_id && seller_list && seller_list.length > 0) {
        seller = seller_list.find(
            item => item.id.toString() === seller_id.toString());
        let categories_data;
        if (seller.is_data_manually_added) {
          seller_skus = await this.modals.sku_seller.findAll(
              {where: {seller_id}});
        } else {
          categories_data = await this.modals.seller_provider_type.findAll(
              {
                where: JSON.parse(JSON.stringify({
                  seller_id, provider_type_id: 1,
                  sub_category_id: main_category_id.length > 0 ?
                      main_category_id : undefined,
                  category_brands: category_id.length > 0 ?
                      {
                        $contains: [
                          category_id.map(
                              item => ({
                                'category_4_id': parseInt(item || 0),
                              }))],
                      } :
                      undefined,
                })),
                attributes: [
                  'sub_category_id', 'category_brands',
                  'seller_id', 'provider_type_id',
                  'category_4_id', 'brand_ids'],
              });
          seller_categories = categories_data.map(item => item.toJSON());
        }
      }
      console.log(JSON.stringify({seller_categories}),
      );
      const seller_main_categories = seller_categories.map(
          item => ({
            main_category_id: item.sub_category_id,
            $or: item.category_brands.length > 0 ?
                [
                  item.category_brands.map(cbItem => ({
                    category_id: cbItem.category_4_id,
                    brand_id: cbItem.brand_ids,
                  }))] :
                undefined,
          }));
      const seller_sku_ids = seller_skus.map(item => item.sku_id);
      const seller_sku_measurement_ids = seller_skus.map(
          item => item.sku_measurement_id);
      title = {$iLike: `%${title || ''}%`};
      limit = limit || 50;
      offset = offset || 0;
      sub_category_ids = (sub_category_ids || '').trim().
          split(',').filter(item => !!item);
      measurement_values = (measurement_values || '').trim().
          split(',').filter(item => !!item);
      measurement_types = (measurement_types || '').trim().
          split(',').filter(item => !!item);
      const sku_measurement_attributes = {
        exclude: (location && location.toLowerCase() === 'other') ||
        !location ? [
          'status_type', 'updated_by', 'updated_at',
          'created_at', 'cashback_percent'] : [
          'status_type', 'updated_by', 'updated_at', 'created_at'],
      };
      console.log(location);
      const sku_options = seller_main_categories.length > 0 ? {
        status_type: 1, $or: seller_main_categories,
        brand_id: brand_ids.length > 0 ? brand_ids : undefined,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title,
        id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
            seller_sku_ids : undefined,
      } : {
        status_type: 1,
        main_category_id: main_category_id.length > 0 ?
            main_category_id : undefined,
        category_id: category_id.length > 0 ?
            category_id : undefined,
        brand_id: brand_ids.length > 0 ?
            brand_ids : undefined,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title,
        id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
            seller_sku_ids : undefined,
      };
      const sku_brand_options = seller_main_categories.length > 0 ? {
        status_type: 1, $or: seller_main_categories,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title,
        id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
            seller_sku_ids : undefined,
      } : {
        status_type: 1,
        main_category_id: main_category_id.length > 0 ?
            main_category_id : undefined,
        category_id: category_id.length > 0 ?
            category_id : undefined,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title,
        id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
            seller_sku_ids : undefined,
      };
      const [skuItems, sku_ids] = await Promise.all([
        this.modals.sku.findAll({
          where: JSON.parse(JSON.stringify(sku_options)),
          include: [
            {
              model: this.modals.sku_measurement,
              where: JSON.parse(JSON.stringify({
                status_type: 1,
                id: seller_sku_measurement_ids &&
                seller_sku_measurement_ids.length > 0 ?
                    seller_sku_measurement_ids : undefined,
                measurement_value: measurement_values.length > 0 ?
                    measurement_values : undefined,
                measurement_type: measurement_types.length > 0 ?
                    measurement_types : undefined,
                bar_code,
              })),
              attributes: sku_measurement_attributes,
              required: false,
            }], order: [['id']], attributes: {
            exclude: ['status_type', 'updated_by', 'updated_at', 'created_at'],
          }, limit, offset,
        }), this.modals.sku.findAll({
          where: JSON.parse(JSON.stringify(sku_brand_options)),
          attributes: ['brand_id'],
          order: [['id']],
        })]);

      const brands = await this.modals.brands.findAll({
        order: [['brand_name']], where: {
          brand_id: _.uniq(sku_ids.map(item => {
            item = item.toJSON();
            return item.brand_id;
          })),
        }, attributes: [
          ['brand_id', 'id'], ['brand_name', 'title'], 'category_ids'],
      });

      return {
        sku_items: skuItems.map(item => item.toJSON()).
            filter(
                item => item.sku_measurements && item.sku_measurements.length >
                    0).map(item => {
              item.sku_measurements = _.sortBy(item.sku_measurements, [
                (measureItem) => {
                  switch (measureItem.measurement_type) {
                    case 2:
                      return parseFloat(measureItem.measurement_value || 0) *
                          1000;
                    case 4:
                      return parseFloat(measureItem.measurement_value || 0) *
                          1000;
                    case 11:
                      return parseFloat(measureItem.measurement_value || 0) /
                          1000;
                    default:
                      return parseFloat(measureItem.measurement_value || 0);
                  }
                }]);
              return item;
            }),
        brands: brands.map(item => item.toJSON()),
      };
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUItem(options) {
    try {
      let {bar_code, id} = options;
      const bar_code_filter = bar_code;
      bar_code = bar_code ? {$iLike: bar_code} : bar_code;
      let skuItems = await this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({status_type: 1, id})),
        include: [
          {
            model: this.modals.sku_measurement,
            where: JSON.parse(JSON.stringify({
              status_type: 1,
              bar_code,
            })),
            required: true,
            attributes: [],
          }],
        order: [['id']],
      });

      skuItems = skuItems.map(item => item.toJSON());
      const skuItem = skuItems.length > 0 ? skuItems[0] : undefined;
      if (skuItem) {
        skuItem.sku_measurements = (await this.retrieveSKUMeasurements(
            {status_type: 1, sku_id: skuItem.id})).map(item => {
          item.selected = item.bar_code.toLowerCase() ===
              bar_code_filter.toLowerCase();
          return item;
        });
      }

      return skuItem;
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUMeasurements(options) {
    let skuMeasurements = await this.modals.sku_measurement.findAll({
      where: JSON.parse(JSON.stringify(options)),
      attributes: [
        'measurement_type', 'measurement_value', 'mrp',
        'pack_numbers', 'cashback_percent', 'bar_code',
        'id', 'sku_id', [
          this.modals.sequelize.literal(
              '(Select acronym from table_sku_measurement as measurement where measurement.id =sku_measurement.measurement_type)'),
          'measurement_acronym']],
    });

    return skuMeasurements.map(item => item.toJSON());
  }

  async retrieveReferenceData() {
    try {
      let [main_categories, categories, sub_categories, measurement_types] = await Promise.all(
          [
            this.modals.categories.findAll(
                {
                  where: {
                    category_level: 3, ref_id: config.HOUSEHOLD_CATEGORY_ID,
                    category_id: {$notIn: [17, 18, 19]}, status_type: 1,
                  }, attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.main_category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),
            this.modals.categories.findAll(
                {
                  where: {category_level: 4, status_type: 1}, attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),
            this.modals.categories.findAll(
                {
                  where: {category_level: 5, status_type: 1}, attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.sub_category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),
            this.modals.measurement.findAll({where: {status_type: 1}})]);

      measurement_types = measurement_types.map(item => item.toJSON());
      sub_categories = sub_categories.map(item => item.toJSON()).
          filter(item => item.sku_counts && item.sku_counts > 0);

      categories = categories.map(item => item.toJSON()).
          filter(item => item.sku_counts && item.sku_counts > 0);
      let brands = await Promise.all(categories.map(
          item => this.modals.brands.findAll(
              {
                where: {
                  status_type: 1,
                  category_ids: {
                    $contains: [{'category_id': item.id}],
                  },
                },
              })));
      categories = categories.map((item, index) => {
        item.sub_categories = sub_categories.filter(
            bItem => bItem.ref_id === item.id);
        item.brands = brands[index].map(bItem => bItem.toJSON());
        return item;
      });
      return {
        main_categories: JSON.parse(JSON.stringify(main_categories.map(item => {
          item = item.toJSON();
          item.categories = categories.filter(
              bItem => bItem.ref_id === item.id);
          return item;
        }).filter(item => item.sku_counts && item.sku_counts > 0))),
        measurement_types,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async retrieveSKUWishList(options) {
    try {
      const {user_id} = options;
      const user_sku_data = await this.retrieveUserSKUs({
        where: {user_id},
        attributes: [
          'wishlist_items', 'past_selections', 'my_seller_ids', [
            this.modals.sequelize.literal(
                '(Select location from users as "user" where "user".id = "user_index".user_id)'),
            'location']],
      });
      if (user_sku_data && user_sku_data.past_selections) {
        const sku_id = _.uniq(
            user_sku_data.past_selections.map(item => item.id));
        console.log(sku_id);
        user_sku_data.past_selections = (user_sku_data.past_selections &&
        user_sku_data.past_selections.length > 0 ?
            (await this.retrieveSKUs({
              queryOptions: {id: sku_id, limit: 10000},
              location: user_sku_data.location,
            })).sku_items : []).map(item => {
          item.sku_measurements = _.sortBy(item.sku_measurements, [
            (measureItem) => {
              switch (measureItem.measurement_type) {
                case 2:
                  return parseFloat(measureItem.measurement_value || 0) *
                      1000;
                case 4:
                  return parseFloat(measureItem.measurement_value || 0) *
                      1000;
                case 11:
                  return parseFloat(measureItem.measurement_value || 0) /
                      1000;
                default:
                  return parseFloat(measureItem.measurement_value || 0);
              }
            }]);
          return item;
        });
      }

      console.log(JSON.stringify(user_sku_data));
      return user_sku_data;
    } catch (e) {
      throw e;
    }
  }

  async retrieveWalletDetails(options) {
    try {
      const {user_id} = options;
      const user_wallet_details = await this.modals.user_wallet.findAll({
        where: {
          user_id, $or: {
            status_type: 16,
            $and: {status_type: [14, 13], is_paytm: true},
          },
        }, include: {
          model: this.modals.sellers, as: 'seller',
          attributes: ['seller_name', 'id', 'user_id'],
        },
      });
      return user_wallet_details.map(item => item.toJSON());
    } catch (e) {
      throw e;
    }
  }

  async retrieveCashBackTransactions(options) {
    try {
      const {user_id, seller_id} = options;
      const transaction_detail = await this.modals.cashback_jobs.findAll({
        where: JSON.parse(
            JSON.stringify({seller_id, user_id, admin_status: {$ne: 2}})),
        include: {
          model: this.modals.expense_sku_items,
          include: [
            {
              model: this.modals.sku,
              attributes: ['title', 'hsn_code'],
            }, {
              model: this.modals.sku_measurement,
              include: {
                model: this.modals.measurement,
                attributes: ['acronym'],
              },
              attributes: [
                'measurement_value', 'pack_numbers',
                'cashback_percent', 'bar_code'],
            }],
          attributes: [
            'sku_id', 'sku_measurement_id', 'selling_price',
            'quantity', 'available_cashback'],
        },
        attributes: [
          'id', 'home_delivered', 'cashback_status', 'copies', [
            this.modals.sequelize.literal(
                `(select sum(purchase_cost) from consumer_products as product where product.user_id = "cashback_jobs"."user_id" and product.job_id = "cashback_jobs"."job_id")`),
            'amount_paid'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'total_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and (status_type in (14) or (status_type in (16) and transaction_type = 2)) and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'redeemed_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'total_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and (status_type in (14) or (status_type in (16) and transaction_type = 2)) and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'redeemed_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'total_cashback'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (14) and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'redeemed_cashback'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'pending_cashback'], [
            this.modals.sequelize.literal(
                `(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.job_id = "cashback_jobs"."id" )`),
            'item_counts']],
        order: [['id', 'desc']],
      });
      return transaction_detail.map(item => {
        item = item.toJSON();
        item.total_cashback = item.total_cashback || 0;
        item.pending_cashback = item.pending_cashback || 0;
        item.is_partial = item.pending_cashback > 0 && item.total_cashback > 0;
        item.is_pending = item.pending_cashback > 0 && item.total_cashback ===
            0;
        item.is_rejected = item.pending_cashback === 0 &&
            item.total_cashback === 0 && item.cashback_status === 16;
        item.is_underprogress = item.pending_cashback === 0 &&
            item.total_cashback === 0 && item.cashback_status === 13;
        item.total_credits = (item.total_credits || 0);
        item.total_loyalty = (item.total_loyalty || 0);
        item.total_cashback = (item.total_cashback || 0) +
            (item.redeemed_cashback || 0);
        item.redeemed_credits = (item.redeemed_credits || 0);
        item.redeemed_loyalty = (item.redeemed_loyalty || 0);
        item.pending_cashback = (item.pending_cashback || 0);
        return item;
      });
    } catch (e) {
      throw e;
    }
  }

  async retrieveCashBackTransaction(options) {
    try {
      const {user_id, id, seller_id} = options;
      const transaction_detail = await this.modals.cashback_jobs.findOne({
        where: JSON.parse(JSON.stringify({user_id, id, seller_id})),
        include: {
          model: this.modals.expense_sku_items,
          include: [
            {
              model: this.modals.sku,
              attributes: ['title', 'hsn_code'],
            }, {
              model: this.modals.sku_measurement,
              include: {
                model: this.modals.measurement,
                attributes: ['acronym'],
              },
              attributes: [
                'measurement_value', 'pack_numbers',
                'cashback_percent', 'bar_code'],
            }],
          attributes: [
            'sku_id', 'sku_measurement_id', 'selling_price',
            'quantity', 'available_cashback'],
        },
        attributes: [
          'id', 'home_delivered', 'cashback_status', 'copies', [
            this.modals.sequelize.literal(
                `(select sum(purchase_cost) from consumer_products as product where product.user_id = "cashback_jobs"."user_id" and product.job_id = "cashback_jobs"."job_id")`),
            'amount_paid'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'total_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (14) and transaction_type = 2 and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'redeemed_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'total_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (14) and transaction_type = 2 and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'redeemed_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'total_cashback'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (14) and transaction_type = 2 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'redeemed_cashback'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'pending_cashback'], [
            this.modals.sequelize.literal(
                `(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.job_id = "cashback_jobs"."job_id" )`),
            'item_counts']],
      });
      const item = transaction_detail ?
          transaction_detail.toJSON() :
          transaction_detail;
      item.total_cashback = item.total_cashback || 0;
      item.pending_cashback = item.pending_cashback || 0;
      item.is_partial = item.pending_cashback > 0 && item.total_cashback > 0;
      item.is_pending = item.pending_cashback > 0 && item.total_cashback ===
          0;
      item.is_rejected = item.pending_cashback === 0 &&
          item.total_cashback === 0 && item.cashback_status === 16;
      item.is_underprogress = item.pending_cashback === 0 &&
          item.total_cashback === 0 && item.cashback_status === 13;
      item.total_credit = (item.total_credit || 0) -
          (item.redeemed_credits || 0);
      item.total_loyalty = (item.total_loyalty || 0) -
          (item.redeemed_loyalty || 0);
      item.total_cashback = (item.total_cashback || 0) -
          (item.redeemed_cashback || 0);
      item.pending_cashback = (item.pending_cashback || 0);
      return item;
    } catch (e) {
      throw e;
    }
  }

  async createUserSKUWishList(reply, request, user_id) {
    let {id, sku_measurement} = request.payload;
    let {measurement_type, measurement_value} = sku_measurement || {};
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: {user_id},
        attributes: ['wishlist_items', 'past_selections'],
      });
      let {wishlist_items, past_selections} = (userSKUWishList || {});
      past_selections = past_selections || [];
      let payload_added = false;
      if (id) {
        wishlist_items = (wishlist_items && wishlist_items.length > 0 ?
            wishlist_items.map((item) => {
              let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = item.sku_measurement;

              if (item.id === id && item_measurement_type ===
                  measurement_type && item_measurement_value ===
                  measurement_value) {
                if (request.payload.quantity === 0) {
                  return undefined;
                }
                item = request.payload;
                payload_added = true;
              }

              return item;
            }) :
            [{}].map(item => {
              payload_added = true;
              if (request.payload.quantity === 0) {
                return undefined;
              }
              return request.payload;
            })).filter(item => !!item);
        if (!payload_added) {
          wishlist_items.push(request.payload);
        }
      } else {
        request.payload.status_type = 11;
        request.payload.updated_by = user_id;
        const userSku = await this.addUserSKU(request.payload);
        wishlist_items.push(userSku.toJSON());
      }

      await this.addSKUToWishList(
          {
            wishlist_items, is_new: !userSKUWishList,
            user_id, past_selections,
          });
      return reply.response({
        status: true,
        result: {
          wishlist_items,
          past_selections,
        },
      });
    }

    catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to create wish list.', err,
      });
    }
  }

  async addToPastSelection(reply, request, user_id) {
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: {user_id},
        attributes: ['wishlist_items', 'past_selections'],
      });
      let {past_selections, wishlist_items} = (userSKUWishList || {});
      let wishlists = [request.payload];
      past_selections = past_selections || [];
      wishlists.forEach((item) => {
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = item.sku_measurement;
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = pItem.sku_measurement;
          return item.id === pItem.id && item_measurement_type ===
              measurement_type && item_measurement_value ===
              measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
        }
      });

      console.log('\n\n\n\n\n\n', JSON.stringify({past_selections}));
      await this.addSKUToWishList(
          {past_selections, wishlist_items, user_id});
      return reply.response({
        status: true,
        result: {past_selections},
      });
    } catch (err) {
      console.log('\n\n\n\n\n', err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to update past selection', err,
      });
    }

  }

  async resetUserSKUWishList(reply, request, user_id) {
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: {user_id},
        attributes: ['wishlist_items', 'past_selections'],
      });
      let {wishlist_items, past_selections} = (userSKUWishList || {});
      past_selections = past_selections || [];
      wishlist_items.forEach((item) => {
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = item.sku_measurement;
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = pItem.sku_measurement;
          return item.id === pItem.id && item_measurement_type ===
              measurement_type && item_measurement_value ===
              measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
        }
      });
      await this.addSKUToWishList(
          {
            wishlist_items: [], past_selections,
            is_new: !userSKUWishList, user_id,
          });
      return reply.response({
        status: true,
        result: {wishlist_items: [], past_selections},
      });
    } catch (err) {
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to create transaction.', err,
      });
    }
  }

  async updatePastWishList(user_id) {
    try {
      const userSKUWishList = await this.retrieveUserSKUs({
        where: {user_id},
        attributes: ['wishlist_items', 'past_selections'],
      });
      let {wishlist_items, past_selections} = (userSKUWishList || {});
      past_selections = past_selections || [];
      wishlist_items.forEach((item) => {
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = item.sku_measurement;
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = pItem.sku_measurement;
          return item.id === pItem.id && item_measurement_type ===
              measurement_type && item_measurement_value === measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
        }
      });
      await this.addSKUToWishList(
          {
            past_selections, wishlist_items: [],
            is_new: !userSKUWishList, user_id,
          });
    } catch (err) {
      this.modals.logs.create({
        api_action: 'PUT', api_path: 'updatePastWishList',
        log_type: 2, user_id,
        log_content: JSON.stringify({err}),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Unable to create transaction.', err,
      });
    }
  }

  async retrieveSKUData(parameters) {
    const result = await this.modals.sku.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveUserSKUs(options) {
    const result = await this.modals.user_index.findAll(options);
    return result && result.length > 0 ? result[0].toJSON() : undefined;
  }

  async addSKUToWishList(options) {
    let {wishlist_items, past_selections, is_new, user_id} = options;
    wishlist_items = wishlist_items.filter(item => item.quantity > 0);
    return await is_new ?
        this.modals.user_index.create(JSON.parse(
            JSON.stringify({wishlist_items, past_selections, user_id}))) :
        this.modals.user_index.update(
            JSON.parse(JSON.stringify({wishlist_items, past_selections})),
            {where: {user_id}});
  }

  async addUserSKU(options) {
    return await this.modals.sku.create(options);
  }

  async updateUserSKUExpenses(parameters) {
    let {id, job_id, expense_id, options} = parameters;
    return await this.modals.expense_sku_items.update(options,
        {where: JSON.parse(JSON.stringify({id, job_id, expense_id}))});
  }

  async addUserSKUExpenses(options) {
    return await this.modals.expense_sku_items.bulkCreate(options,
        {returning: true});
  }

  async retrievePendingTransactions(options) {
    try {
      const {seller_id} = options;
      const transaction_detail = await this.modals.cashback_jobs.findAll({
        where: {seller_id, seller_status: 13},
        attributes: [
          'id', 'home_delivered', 'cashback_status', 'copies', 'user_id', [
            this.modals.sequelize.literal(
                `(select sum(purchase_cost) from consumer_products as product where product.user_id = "cashback_jobs"."user_id" and product.job_id = "cashback_jobs"."job_id")`),
            'amount_paid'], 'created_at', [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'total_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_credit as seller_credit where seller_credit.job_id = "cashback_jobs"."id" and (status_type in (14) or (status_type in (16) and transaction_type = 2)) and seller_credit.user_id = "cashback_jobs"."user_id")`),
            'redeemed_credits'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and status_type in (16) and transaction_type = 1 and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'total_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_loyalty as loyalty_wallet where loyalty_wallet.job_id = "cashback_jobs"."id" and (status_type in (14) or (status_type in (16) and transaction_type = 2)) and loyalty_wallet.user_id = "cashback_jobs"."user_id")`),
            'redeemed_loyalty'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'pending_cashback'], [
            this.modals.sequelize.literal(
                `(select id from table_wallet_seller_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'cashback_id'], [
            this.modals.sequelize.literal(
                `(select status_name from statuses where statuses.status_type = "cashback_jobs"."cashback_status")`),
            'status_name'], [
            this.modals.sequelize.literal(
                `(select full_name from users where users.id = "cashback_jobs"."user_id")`),
            'user_name'], [
            this.modals.sequelize.literal(
                `(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.job_id = "cashback_jobs"."id" )`),
            'item_counts']],
      });
      return transaction_detail.map(item => {
        item = item.toJSON();
        item.pending_cashback = item.pending_cashback || 0;
        item.is_pending = item.pending_cashback > 0 && item.total_cashback ===
            0;
        return item;
      });
    } catch (e) {
      throw e;
    }
  }

  async retrievePendingTransaction(options) {
    try {
      const {seller_id, id} = options;
      const transaction_detail = await this.modals.cashback_jobs.findOne({
        where: JSON.parse(JSON.stringify({seller_id, seller_status: 13, id})),
        attributes: [
          'id', 'home_delivered', 'cashback_status', 'copies', 'user_id', [
            this.modals.sequelize.literal(
                `(select sum(purchase_cost) from consumer_products as product where product.user_id = "cashback_jobs"."user_id" and product.job_id = "cashback_jobs"."job_id")`),
            'amount_paid'], [
            this.modals.sequelize.literal(
                `(select sum(amount) from table_wallet_seller_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
            'pending_cashback'], [
            this.modals.sequelize.literal(
                `(select status_name from statuses where statuses.status_type = "cashback_jobs"."cashback_status")`),
            'status_name'], [
            this.modals.sequelize.literal(
                `(select full_name from users where users.id = "cashback_jobs"."user_id")`),
            'user_name'], [
            this.modals.sequelize.literal(
                `(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.job_id = "cashback_jobs"."job_id" )`),
            'item_counts']],
      });
      const item = transaction_detail.toJSON();
      item.pending_cashback = item.pending_cashback || 0;
      item.is_pending = item.pending_cashback > 0 && item.total_cashback ===
          0;
      return item;
    } catch (e) {
      throw e;
    }
  }
}