import Promise from 'bluebird';
import ProductAdapter from './product';
import SellerAdapter from './sellers';
import CategoryAdaptor from './category';
import _ from 'lodash';
import config from '../../config/main';
import moment from 'moment';

export default class ShopEarnAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdapter = new ProductAdapter(modals);
    this.sellerAdapter = new SellerAdapter(modals);
    this.categoryAdapter = new CategoryAdaptor(modals);
  }

  async retrieveSKUs(options) {
    try {
      const {location, queryOptions, seller_list} = options;
      let {main_category_id, category_id, brand_ids, sub_category_ids, measurement_values, measurement_types, bar_code, title, limit, offset, id, seller_id} = queryOptions ||
      {};
      let seller, seller_skus = [], seller_categories = [];
      category_id = !title ?
          (category_id || '').trim().split(',').filter(item => !!item) :
          [];
      main_category_id = !title ?
          (main_category_id || '').trim().split(',').filter(item => !!item) :
          [];
      brand_ids = (brand_ids || '').trim().split(',').filter(item => !!item);
      sub_category_ids = !title ?
          (sub_category_ids || '').trim().split(',').filter(item => !!item) :
          [];
      if (seller_id && seller_list && seller_list.length > 0) {
        seller = seller_list.find(
            item => item.id.toString() === seller_id.toString());
        let categories_data;
        if (seller) {
          if (seller.is_data_manually_added) {
            seller_skus = await this.modals.sku_seller.findAll(
                {
                  where: {seller_id},
                  attributes: ['sku_id', 'sku_measurement_id'],
                });
            seller_skus = seller_skus.map(item => item.toJSON());
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
                        } : undefined,
                  })), attributes: [
                    'sub_category_id', 'category_brands',
                    'seller_id', 'provider_type_id',
                    'category_4_id', 'brand_ids'],
                });
            seller_categories = categories_data.map(item => item.toJSON());
          }
        }
      }
      const sub_category_ref = [];
      const seller_main_categories = seller_categories.length > 0 ?
          seller_categories.map(
              item => {
                if (item.category_brands.length > 0) {
                  item.category_brands.forEach(cbItem => sub_category_ref.push(
                      {ref_id: cbItem.category_4_id}));
                }

                return ({
                  main_category_id: item.sub_category_id,
                  $or: item.category_brands.length > 0 ?
                      item.category_brands.map(cbItem => ({
                        category_id: cbItem.category_4_id,
                        brand_id: cbItem.brand_ids && cbItem.brand_ids.length >
                        0 ?
                            cbItem.brand_ids : undefined,
                      })) : undefined,
                });
              }) : [];
      const seller_sku_ids = seller_skus.map(item => item.sku_id);
      const seller_sku_measurement_ids = seller_skus.map(
          item => item.sku_measurement_id);
      let sub_category_id_list = [], first_title = [],
          second_title = [{$iLike: undefined}],
          third_title = [{$iLike: undefined}],
          forth_title = [{$iLike: `%${title || ''}%`}],
          has_milk_title = false;
      limit = limit || config.SKU_LIMIT;
      offset = offset || 0;
      if (title) {
        has_milk_title = _.includes(title.toLowerCase(), 'milk');
        title = title.split('%');
        first_title = title.join('').split('');
        for (let i = 2; i < first_title.length; i++) {
          first_title[i] += '%';
        }
        if (title.length > 2) {
          for (let i = 1; i < title.length; i++) {
            second_title.push({$iLike: `%${title[i]}`});
            third_title.push({$iLike: `%${title[i]}`});
            for (let j = 0; j < title.length; j++) {
              if (j !== i) {
                second_title[i].$iLike += `%${title[j]}`;
              }
            }
            for (let j = title.length - 1; j >= 0; j--) {
              if (j !== i) {
                third_title[i].$iLike += `%${title[j]}`;
              }
            }
            second_title[i].$iLike += `%`;
            third_title[i].$iLike += `%`;
          }
        } else {
          second_title.push({$iLike: `%${title.reverse().join('%')}%`});
        }
        second_title = second_title.filter((item) => item.$iLike);
        third_title = third_title.filter((item) => item.$iLike);

        first_title = first_title.join('');
        let sub_categories = await this.modals.categories.findAll(
            {
              attributes: [['category_id', 'id']],
              where: JSON.parse(JSON.stringify({
                category_level: 5, status_type: 1,
                category_name: {
                  $or: JSON.parse(JSON.stringify([
                    ...forth_title,
                    {$iLike: first_title},
                    ...second_title,
                    ...third_title])),
                }, $or: sub_category_ref.length > 0 ?
                    _.uniq(sub_category_ref) : undefined,
              })), order: [['priority_index']],
            });
        sub_categories = sub_categories.map(item => item.toJSON());
        sub_category_id_list = sub_categories.length > 0 ?
            sub_categories.filter(item => item.id).map(item => item.id) : [];
        limit = config.SKU_SEARCH_LIMIT || limit;
      }
      const $or = !title ? {
        sub_category_id: sub_category_id_list.length > 0 ?
            sub_category_id_list : undefined,
        title: {$iLike: `%${title || ''}%`},
        id: _.includes(main_category_id, config.MILK_SKU_MAIN_CATEGORY) &&
        category_id.length === 0 && config.MILK_SKU_IDS.length > 0 ?
            config.MILK_SKU_IDS : undefined,
      } : JSON.parse(JSON.stringify({
        sub_category_id: sub_category_id_list.length > 0 ?
            sub_category_id_list : undefined, title: {
          $or: JSON.parse(JSON.stringify(
              [
                ...forth_title, {$iLike: first_title},
                ...second_title, ...third_title])),
        }, id: has_milk_title && config.MILK_SKU_IDS.length > 0 ?
            config.MILK_SKU_IDS : undefined,
      }));
      measurement_values = (measurement_values || '').trim().
          split(',').filter(item => !!item);
      measurement_types = (measurement_types || '').trim().
          split(',').filter(item => !!item);
      const sku_measurement_attributes = (location && location.toLowerCase() ===
          'other') || !location ? [
        'id', 'pack_numbers', 'measurement_type', 'measurement_value', [
          this.modals.sequelize.literal(
              '(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'),
          'measurement_acronym'], 'mrp', 'sku_id', 'bar_code'] : [
        'pack_numbers', 'measurement_type', 'measurement_value', [
          this.modals.sequelize.literal(
              '(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurement".measurement_type)'),
          'measurement_acronym'], 'mrp', 'bar_code',
        'cashback_percent', 'id', 'sku_id'];
      if (seller_id) {
        sku_measurement_attributes.push([
          this.modals.sequelize.literal(
              `(select offer_discount from table_seller_offers as offer where offer.sku_id = "sku_measurement".sku_id and offer.sku_measurement_id = "sku_measurement".id and "offer".seller_id = ${seller_id} and "offer".end_date >= '${moment().
                  format('YYYY-MM-DD')}')`), 'offer_discount'], [
          this.modals.sequelize.literal(
              `(select seller_mrp from table_seller_offers as offer where offer.sku_id = "sku_measurement".sku_id and offer.sku_measurement_id = "sku_measurement".id and "offer".seller_id = ${seller_id})`),
          'seller_mrp']);
      }
      const sku_attributes = [
        [
          this.modals.sequelize.literal(
              '(select category_name from categories as category where category.category_id = sku.sub_category_id)'),
          'sub_category_name'], 'brand_id', 'category_id',
        'sub_category_id', 'main_category_id', 'title', 'id', 'priority_index'];
      const sku_options = JSON.parse(
          JSON.stringify(seller_main_categories.length > 0 && !title ? {
            brand_id: brand_ids.length > 0 ? brand_ids : undefined,
            sub_category_id: sub_category_ids.length > 0 ?
                sub_category_ids : undefined,
            $or: sub_category_id_list.length > 0 ? $or : seller_main_categories,
            id: id ? _.uniq(id) : seller_sku_ids && seller_sku_ids.length > 0 ?
                _.uniq(seller_sku_ids) : undefined, status_type: 1,
            title: sub_category_id_list.length === 0 && title ? {
              $or: JSON.parse(JSON.stringify([
                ...forth_title, {$iLike: first_title},
                ...second_title, ...third_title])),
            } : undefined, has_measurements: !(title) ? true : undefined,
          } : {
            main_category_id: main_category_id.length > 0 ?
                main_category_id : undefined,
            category_id: category_id.length > 0 ?
                category_id : undefined,
            brand_id: brand_ids.length > 0 ?
                brand_ids : undefined,
            has_measurements: !(title) ? true : undefined,
            sub_category_id: sub_category_ids.length > 0 ?
                sub_category_ids : undefined, $or,
            id: !title ? id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
                seller_sku_ids : undefined : undefined, status_type: 1,
          }));
      /*const sku_brand_options = JSON.parse(
          JSON.stringify(seller_main_categories.length > 0 ? {
            status_type: 1,
            $or: sub_category_id_list.length > 0 ? $or : seller_main_categories,
            sub_category_id: sub_category_ids.length > 0 ?
                sub_category_ids : undefined,
            id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
                seller_sku_ids : undefined,
          } : {
            status_type: 1,
            main_category_id: main_category_id.length > 0 ?
                main_category_id : undefined,
            category_id: category_id.length > 0 ?
                category_id : undefined,
            sub_category_id: sub_category_ids.length > 0 ?
                sub_category_ids : undefined,
            $or, id: id ? id : seller_sku_ids && seller_sku_ids.length > 0 ?
                seller_sku_ids : undefined,
          }));
      sku_brand_options.$and = this.modals.sequelize.literal(
          '(select count(id) from table_sku_measurement_detail as measure where measure.sku_id = sku.id and measure.status_type = 1) > 0');*/
      /*sku_options.$and = this.modals.sequelize.literal(
          `(select count(id) from table_sku_measurement_detail as measure where measure.sku_id = sku.id and measure.status_type = 1 ${title ?
              '' : 'and has_images=true'}) > 0`);*/
      console.log('\n\n\n\n\n', has_milk_title, offset.toString() === '0',
          config.MILK_SKU_IDS.length > 0);
      let [skuItems, brands] = await Promise.all([
        this.modals.sku.findAll({
          where: sku_options,
          order: [['priority_index'], ['title']], limit,
          offset, attributes: sku_attributes,
        }) /*this.modals.sku.findAll({
                 where: sku_brand_options, attributes: [
                   [
                     this.modals.sequelize.literal(
                         '(select brand_name from brands as brand where brand.brand_id = sku.brand_id)'),
                     'brand_name'], 'brand_id', [
                     this.modals.sequelize.literal(
                         '(select brand_index from brands as brand where brand.brand_id = sku.brand_id)'),
                     'brand_index']], group: ['brand_id'], distinct: true,
               })*/]);
      skuItems = skuItems.map(item => item.toJSON());
      const sku_measurements = await this.retrieveSKUMeasurements({
        options: {
          where: JSON.parse(JSON.stringify({
            status_type: 1, id: seller_sku_measurement_ids &&
            seller_sku_measurement_ids.length > 0 ?
                _.uniq(seller_sku_measurement_ids) : undefined,
            measurement_value: measurement_values.length > 0 ?
                measurement_values : undefined,
            measurement_type: measurement_types.length > 0 ?
                measurement_types : undefined, bar_code,
            sku_id: skuItems.map(item => item.id),
            has_images: title ? undefined : true,
          })),
          attributes: sku_measurement_attributes,
        },
      });
      return {
        sku_items: skuItems.map(item => {
          item.sku_measurements = sku_measurements.filter(
              measureItem => measureItem.sku_id === item.id).
              map(measureItem => {
                measureItem.offer_discount = measureItem.offer_discount || 0;
                return measureItem;
              });
          return item;
        }).filter(
            item => item.sku_measurements && item.sku_measurements.length >
                0).map(item => {
          item.seller_id = seller_id;
          if (item.category_id.toString() ===
              config.MILK_SKU_CATEGORY.toString()) {
            item.sku_measurements = item.sku_measurements.map(measureItem => {
              measureItem.cashback_percent = parseInt(
                  (config.MILK_SKU_CASH_BACK_PERCENT || 0).toString());
              return measureItem;
            });
          }
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

          item.sku_measurements = item.sku_measurements.map((measureItem) => {
            measureItem.mrp = measureItem.seller_mrp || measureItem.mrp;
            measureItem = _.omit(measureItem, 'seller_mrp');
            return measureItem;
          });
          return item;
        }),
        //brands: _.sortBy(brands.map(item => item.toJSON()), ['brand_index']),
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async retrieveSellerSKUs(options) {
    try {
      const {queryOptions, seller_list} = options;
      let {main_category_id, category_id, brand_ids, sub_category_ids, measurement_values, measurement_types, bar_code, title, limit, offset, id, seller_id, sku_id} = queryOptions ||
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
        if (seller) {
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
                  })), attributes: [
                    'sub_category_id', 'category_brands',
                    'seller_id', 'provider_type_id',
                    'category_4_id', 'brand_ids'],
                });
            seller_categories = categories_data.map(item => item.toJSON());
          }
        }
      }

      const seller_main_categories = seller_categories.map(
          item => ({
            main_category_id: item.sub_category_id,
            $or: item.category_brands.length > 0 ?
                item.category_brands.map(cbItem => ({
                  category_id: cbItem.category_4_id,
                  brand_id: cbItem.brand_ids && cbItem.brand_ids.length > 0 ?
                      cbItem.brand_ids : undefined,
                })) : undefined,
          }));
      const seller_sku_ids = seller_skus.map(item => item.sku_id);
      const seller_sku_measurement_ids = seller_skus.map(
          item => item.sku_measurement_id);
      title = {$iLike: `%${title || ''}%`};
      limit = limit || 100;
      offset = offset || 0;
      sub_category_ids = (sub_category_ids || '').trim().
          split(',').filter(item => !!item);
      measurement_values = (measurement_values || '').trim().
          split(',').filter(item => !!item);
      measurement_types = (measurement_types || '').trim().
          split(',').filter(item => !!item);
      const sku_measurement_attributes = [
        'id', 'pack_numbers', 'measurement_type', 'measurement_value', [
          this.modals.sequelize.literal(
              '(select acronym from table_sku_measurement as measurement where measurement.id = "sku_measurements".measurement_type)'),
          'measurement_acronym'], [
          this.modals.sequelize.literal(
              `(select offer_discount from table_seller_offers as offer where offer.sku_id = "sku_measurements".sku_id and offer.sku_measurement_id = "sku_measurements".id and "offer".seller_id = ${seller_id} and "offer".end_date >= '${moment().
                  format('YYYY-MM-DD')}')`),
          'offer_discount'], [
          this.modals.sequelize.literal(
              `(select seller_mrp from table_seller_offers as offer where offer.sku_id = "sku_measurements".sku_id and offer.sku_measurement_id = "sku_measurements".id and "offer".seller_id = ${seller_id})`),
          'seller_mrp'], 'mrp', 'bar_code', 'cashback_percent'];
      const sku_attributes = [
        [
          this.modals.sequelize.literal(
              '(select category_name from categories as category where category.category_id = sku.sub_category_id)'),
          'sub_category_name'], 'brand_id', 'category_id',
        'sub_category_id', 'main_category_id', 'title', 'id', 'priority_index'];
      const sku_options = seller_main_categories.length > 0 ? {
        status_type: 1, $or: seller_main_categories,
        brand_id: brand_ids.length > 0 ? brand_ids : undefined,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title, id: {
          $and: {
            $in: seller_sku_ids && seller_sku_ids.length > 0 ?
                seller_sku_ids : undefined, $ne: sku_id,
          },
        },
      } : {
        status_type: 1,
        main_category_id: main_category_id.length > 0 ?
            main_category_id : undefined,
        category_id: category_id.length > 0 ?
            category_id : undefined,
        brand_id: brand_ids.length > 0 ?
            brand_ids : undefined,
        sub_category_id: sub_category_ids.length > 0 ?
            sub_category_ids : undefined, title, id: {
          $and: {
            $in: seller_sku_ids && seller_sku_ids.length > 0 ?
                seller_sku_ids : undefined, $ne: sku_id,
          },
        },
      };
      const skuItems = await this.modals.sku.findAll({
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
            required: true,
          }], order: [['title']],
        attributes: sku_attributes,
      });

      return skuItems.map(item => item.toJSON()).filter(
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

        item.sku_measurements = item.sku_measurements.map((measureItem) => {
          measureItem.mrp = measureItem.seller_mrp || measureItem.mrp;
          measureItem = _.omit(measureItem, 'seller_mrp');
          return measureItem;
        });
        return item;
      });
    } catch (e) {
      throw e;
    }
  }

  async retrieveSellerCategories(options) {
    try {
      const {seller} = options;
      let seller_skus = [], seller_categories = [];
      if (seller) {
        let categories_data;
        if (seller) {
          if (seller.is_data_manually_added) {
            seller_skus = await this.modals.sku_seller.findAll(
                {where: {seller_id: seller.id}});
          } else {
            categories_data = await this.modals.seller_provider_type.findAll(
                {
                  where: JSON.parse(JSON.stringify({
                    seller_id: seller.id, provider_type_id: 1,
                  })),
                  attributes: [
                    'sub_category_id', 'category_brands',
                    'seller_id', 'provider_type_id', [
                      this.modals.sequelize.literal(
                          '(Select priority_index from categories as category where category.category_id = seller_provider_type.sub_category_id)'),
                      'priority_index'], 'category_4_id', 'brand_ids'],
                });
            seller_categories = categories_data.map(item => item.toJSON());
          }
        }
      }

      const seller_sku_ids = seller_skus.map(item => item.sku_id);

      seller_categories = seller_categories.length > 0 ?
          seller_categories.map(item => {
            item.main_category_id = item.sub_category_id;
            item.category_brands = item.category_brands.map(cbItem => {
              cbItem.category_id = cbItem.category_4_id;
              return _.omit(cbItem, 'category_4_id');
            });
            return _.omit(item, [
              'sub_category_id', 'category_4_id',
              'brand_ids', 'provider_type_id']);
          }) : [];
      if (seller_categories.length <= 0) {
        const skuItems = await this.modals.sku.findAll({
          where: JSON.parse(JSON.stringify({
            status_type: 1,
            id: seller_sku_ids && seller_sku_ids.length > 0 ?
                _.uniq(seller_sku_ids) : undefined,
          })),
          order: [
            [
              this.modals.sequelize.literal(
                  '(Select priority_index from categories as category where category.category_id = sku.main_category_id)')]],
          attributes: [
            'main_category_id', 'category_id', [
              this.modals.sequelize.literal(
                  '(Select priority_index from categories as category where category.category_id = sku.main_category_id)'),
              'priority_index'], 'brand_id'],
          group: ['brand_id', 'category_id', 'main_category_id'],
        });
        skuItems.forEach(item => {
          const main_category_exist = seller_categories.find(
              scItem => scItem.main_category_id === item.main_category_id);
          if (main_category_exist) {
            const category_exist = main_category_exist.category_brands.find(
                mcItem => mcItem.category_id === item.category_id);
            if (category_exist) {
              category_exist.brand_ids.push(item.brand_id);
              category_exist.brand_ids = _.uniq(category_exist.brand_ids);
            } else {
              main_category_exist.category_brands.push({
                category_id: item.category_id,
                brand_ids: [item.brand_id],
              });
            }
          } else {
            seller_categories.push({
              main_category_id: item.main_category_id, category_brands: [
                {
                  category_id: item.category_id,
                  brand_ids: [item.brand_id],
                }], priority_index: item.priority_index,
            });
          }
        });
      }
      return _.orderBy(seller_categories, ['priority_index']);
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUItem(options, seller_id) {
    try {
      let {bar_code, id, location, is_seller} = options;
      const bar_code_filter = bar_code;
      bar_code = bar_code ? {$iLike: bar_code} : bar_code;
      let skuItems = await this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({status_type: 1, id})),
        include: [
          {
            model: this.modals.sku_measurement,
            where: JSON.parse(JSON.stringify({status_type: 1, bar_code})),
            required: true, attributes: [],
          }], attributes: {
          exclude:
              [
                'status_type', 'updated_by',
                'updated_at', 'created_at',
                'image_code', 'image_name'],
        }, order: [['id']],
      });

      skuItems = skuItems.map(item => item.toJSON());
      const skuItem = skuItems.length > 0 ? skuItems[0] : undefined;
      if (skuItem) {
        skuItem.sku_measurements = (await this.retrieveSKUMeasurements(
            {
              options: {status_type: 1, sku_id: skuItem.id},
              location, is_seller, seller_id,
            })).map(
            item => {
              item.selected = bar_code_filter && item.bar_code.toLowerCase() ===
                  bar_code_filter.toLowerCase();
              return item;
            });
      }

      return skuItem;
    } catch (e) {
      throw e;
    }
  }

  async retrieveSKUDetail(options) {
    try {
      let {bar_code, id, location, is_seller} = options;
      const bar_code_filter = bar_code;
      bar_code = bar_code ? {$iLike: bar_code} : bar_code;
      let skuItems = await this.modals.sku.findAll({
        where: JSON.parse(JSON.stringify({status_type: 1, id})),
        include: [
          {
            model: this.modals.sku_measurement,
            where: JSON.parse(JSON.stringify({status_type: 1, bar_code})),
            required: true, attributes: [],
          }], attributes: {
          exclude:
              ['status_type', 'updated_by', 'updated_at', 'created_at'],
        }, order: [['id']],
      });

      skuItems = skuItems.map(item => item.toJSON());
      const skuItem = skuItems.length > 0 ? skuItems[0] : undefined;
      if (skuItem) {
        skuItem.sku_measurements = (await this.retrieveSKUMeasurements(
            {
              options: {status_type: 1, sku_id: skuItem.id},
              location: location,
              is_seller: is_seller,
            })).map(
            item => {
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

  async retrieveSKUMeasurements(parameters) {
    let {options, location, is_seller, seller_id} = parameters;
    const sku_measurement_attributes = options.attributes ?
        options.attributes :
        (location && location.toLowerCase() !==
            'other') || is_seller ? [
          'measurement_type', 'measurement_value', 'mrp',
          'pack_numbers', 'cashback_percent', 'bar_code',
          'id', 'sku_id', [
            this.modals.sequelize.literal(
                '(Select acronym from table_sku_measurement as measurement where measurement.id =sku_measurement.measurement_type)'),
            'measurement_acronym'], 'tax'] : [
          'measurement_type', 'measurement_value', 'mrp',
          'pack_numbers', 'bar_code', 'id', 'sku_id', [
            this.modals.sequelize.literal(
                '(Select acronym from table_sku_measurement as measurement where measurement.id =sku_measurement.measurement_type)'),
            'measurement_acronym'], 'tax'];
    if (seller_id) {
      sku_measurement_attributes.push([
        this.modals.sequelize.literal(
            `(select offer_discount from table_seller_offers as offer where offer.sku_id = "sku_measurement".sku_id and offer.sku_measurement_id = "sku_measurement".id and "offer".seller_id = ${seller_id} and "offer".end_date >= '${moment().
                format('YYYY-MM-DD')}' order by created_at desc limit 1)`),
        'offer_discount'], [
        this.modals.sequelize.literal(
            `(select seller_mrp from table_seller_offers as offer where offer.sku_id = "sku_measurement".sku_id and offer.sku_measurement_id = "sku_measurement".id and "offer".seller_id = ${seller_id} order by created_at desc limit 1)`),
        'seller_mrp']);
    }

    let skuMeasurements = await this.modals.sku_measurement.findAll(
        options.where ? options : {
          where: JSON.parse(JSON.stringify(options)),
          attributes: sku_measurement_attributes,
        });

    return skuMeasurements.map(item => {
      item = item.toJSON();
      item.mrp = item.seller_mrp || item.mrp;
      return _.omit(item, 'seller_mrp');
    });
  }

  async retrieveSKUMeasurement(options) {
    let skuMeasurements = await this.modals.sku_measurement.findOne(options);
    return skuMeasurements ? skuMeasurements.toJSON() : undefined;
  }

  async retrieveReferenceData() {
    try {
      let [main_categories, categories, /*sub_categories,*/ measurement_types] = await Promise.all(
          [
            this.modals.categories.findAll(
                {
                  where: {
                    category_level: 3, ref_id: config.HOUSEHOLD_CATEGORY_ID,
                    category_id: {$notIn: [17, 18, 19]}, status_type: 1,
                  }, order: [['priority_index']], attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', 'priority_index', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.main_category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),
            this.modals.categories.findAll(
                {
                  where: {category_level: 4, status_type: 1},
                  order: [['priority_index']], attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', 'priority_index', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),
            /*this.modals.categories.findAll(
                {
                  where: {category_level: 5, status_type: 1},
                  order: [['priority_index']], attributes: [
                    ['category_id', 'id'], ['category_name', 'title'],
                    'ref_id', [
                      this.modals.sequelize.literal(
                          '(select count(*) from table_sku_global as sku where sku.sub_category_id = "categories".category_id)'),
                      'sku_counts'], ['category_level', 'level']],
                }),*/
            this.modals.measurement.findAll({where: {status_type: 1}})]);

      measurement_types = measurement_types.map(item => item.toJSON());
      /*  sub_categories = sub_categories.map(item => item.toJSON()).
            filter(item => item.sku_counts && item.sku_counts > 0);*/

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
                }, order: [['brand_index'], ['brand_name']],
                attributes: [
                  'brand_id', 'brand_name',
                  'brand_index', 'status_type'],
              })));
      categories = categories.map((item, index) => {
        /* item.sub_categories = sub_categories.filter(
             bItem => bItem.ref_id === item.id);*/
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
          user_id, $or: [
            {status_type: 16},
            {$and: {status_type: [14, 13], is_paytm: true}},
            {$and: {status_type: [14], is_paytm: false}}],
        }, include: {
          model: this.modals.sellers, as: 'seller',
          attributes: ['seller_name', 'id', 'user_id'],
        },
        order: [['id', 'desc'], ['updated_at', 'desc']],
      });
      return user_wallet_details.map(item => item.toJSON());
    } catch (e) {
      throw e;
    }
  }

  async retrieveCashBackTransactions(options) {
    try {
      const {user_id, seller_id} = options;
      const [reasons, transaction_detail] = await Promise.all([
        this.categoryAdapter.retrieveReasons(
            {where: {query_type: [1, 3]}, order: [['id']]}),
        this.modals.cashback_jobs.findAll({
          where: JSON.parse(
              JSON.stringify({
                seller_id, user_id, $or: [
                  {admin_status: {$notIn: [2, 9]}},
                  {$and: {admin_status: {$eq: 9}, reason_id: {$not: null}}}],
              })),
          include: [
            {
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
                'quantity', 'available_cashback', 'timely_added'],
            },
            {
              model: this.modals.user_wallet,
              attributes: [
                'seller_id', 'amount', 'transaction_type',
                'cashback_source', 'is_paytm', 'status_type'],
            }],
          attributes: [
            'id', 'admin_status', 'ce_status', 'home_delivered',
            'cashback_status', 'seller_status', 'copies', 'limit_rule_id', [
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
                  `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (14) and is_paytm = true and user_wallet.user_id = "cashback_jobs"."user_id")`),
              'redeemed_cashback'], [
              this.modals.sequelize.literal(
                  `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (13) and transaction_type = 1 and user_wallet.user_id = "cashback_jobs"."user_id")`),
              'pending_cashback'], [
              this.modals.sequelize.literal(
                  `(select count(*) from table_expense_sku as expense_skus where expense_skus.user_id = "cashback_jobs"."user_id" and expense_skus.job_id = "cashback_jobs"."id" )`),
              'item_counts'], 'created_at', 'updated_at',
            'reason_id', 'verified_seller', 'digitally_verified'],
          order: [['updated_at', 'desc'], ['id', 'desc']],
        })]);
      return transaction_detail.map(item => {
        item = item.toJSON();
        item.total_cashback = item.total_cashback || 0;
        item.pending_cashback = item.pending_cashback || 0;
        item.is_partial = (item.pending_cashback > 0 && item.total_cashback >
            0 && (item.admin_status !== 9 && item.ce_status !== 9)) ||
            (item.admin_status === 8 && item.ce_status === 5);
        item.is_pending = item.pending_cashback > 0 && item.total_cashback ===
            0 &&
            (item.admin_status !== 9 && item.ce_status !== 9);
        item.is_rejected = (item.pending_cashback === 0 &&
            item.total_cashback === 0 && item.cashback_status === 16 &&
            (item.admin_status !== 9 && item.ce_status !== 9)) &&
            item.seller_status === 18;
        item.is_underprogress = item.pending_cashback === 0 &&
            item.total_cashback === 0 && item.cashback_status === 13 &&
            (item.admin_status !== 9 && item.ce_status !== 9);
        item.is_discarded = item.admin_status === 9 || item.ce_status === 9;
        item.total_credits = (item.total_credits || 0);
        item.total_loyalty = (item.total_loyalty || 0);
        item.total_cashback = (item.total_cashback || 0) +
            (item.redeemed_cashback || 0);
        item.redeemed_credits = (item.redeemed_credits || 0);
        item.redeemed_loyalty = (item.redeemed_loyalty || 0);
        item.pending_cashback = (item.pending_cashback || 0);
        if (item.user_wallet && item.user_wallet.length > 0) {
          item.fixed_cashback = item.user_wallet.find(item => !item.seller_id);
        }

        if (item.user_wallet && item.user_wallet.length > 0) {
          item.seller_cashback = item.user_wallet.find(item => item.seller_id);
        }

        if (!item.verified_seller && !item.digitally_verified) {
          item.expense_sku_items = item.expense_sku_items.filter(
              esItem => esItem.timely_added);
        }

        const {admin_status, ce_status, cashback_status, limit_rule_id, seller_status, total_cashback, verified_seller, pending_cashback, digitally_verified} = item;
        switch (admin_status) {
          case 4:
            item.status_message = 'Thank you for submitting your Bill.\n' +
                'You will receive notification once the verification process is complete for CashBack Claim\n';
            break;
          case 8:
            switch (ce_status) {
              case 9:
                const reason = reasons.find(
                    rItem => rItem.id === item.reason_id);
                item.status_message = reason.description;
                break;
              case 5:
                item.status_message = 'Your CashBack has been Approved. Your CashBack amount will be credited in your Wallet shortly.';
                break;
              default:
                item.status_message = 'Your Bill has been accepted and our team is calculating cashback for the same.';
                break;

            }
            break;
          case 9:
            const reason = reasons.find(rItem => rItem.id === item.reason_id);
            item.status_message = reason.description;
            break;
          case 5:
            switch (cashback_status) {
              case 16:
                if (verified_seller || digitally_verified) {
                  item.status_message = limit_rule_id ?
                      `We have credited only "₹${total_cashback}" in your Wallet as you have reached your CashBack limit below bifurcation could vary as they depend on items you mentioned and fixed CashBack.` :
                      `You have Received CashBack "₹${total_cashback}" `;
                } else {
                  item.status_message = `You have received "₹${total_cashback}" cashback on your bill. To avail CashBack on FMCG items, please complete your Bill Verification Process through either of the following steps: \n\n\t\t 1) Add Your Seller in the BinBill Network so he can verify your Bills.\n\t\t2) Create your Shopping List in our Shop & Earn section before uploading your Shopping Bills.\n\t\t3) Make a Digital Bill Payments.`;
                }
                break;
              default:
                switch (seller_status) {
                  case 13:
                    item.status_message = `We have credited "₹${total_cashback}". We are awaiting your Seller's Approval for disbursing remaining cashback. Request your Seller to verify your Bill.`;
                    break;
                  case 16:
                  case 14:
                    item.status_message = limit_rule_id ?
                        `We have credited only "₹${total_cashback}" in your Wallet as you have reached your CashBack limit below bifurcation could vary as they depend on items you mentioned and fixed CashBack.` :
                        `You have Received CashBack "₹${total_cashback}" `;
                    break;
                  case 18:
                    item.status_message = `Your claim for cashback has been rejected by the seller. You have received "₹${(item.fixed_cashback ||
                        {amount: 0}).amount}" the fixed BinBill CashBack.`;
                    break;
                  default:
                    item.status_message = `Your claim for cashback has been cancelled as your seller hasn't taken any action.`;
                    break;

                }
                break;
            }
            break;
        }
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
                `(select sum(amount) from table_wallet_user_cashback as user_wallet where user_wallet.job_id = "cashback_jobs"."id" and status_type in (14) and is_paytm = true and transaction_type = 2 and user_wallet.user_id = "cashback_jobs"."user_id")`),
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
    let {id, sku_measurement, seller_id} = request.payload;
    let {measurement_type, measurement_value, id: sku_measurement_id} = sku_measurement ||
    {};
    try {
      const [userSKUWishList, seller_sku] = await Promise.all([
        this.retrieveUserSKUs({
          where: {user_id},
          attributes: ['wishlist_items', 'past_selections'],
        }), seller_id && id && sku_measurement_id ?
            this.sellerAdapter.retrieveSellerOffer({
              where: {
                seller_id, on_sku: true, sku_id: id, sku_measurement_id,
                end_date: {$gte: moment().format()},
              },
              attributes: ['sku_id', 'sku_measurement_id', 'offer_discount'],
            }) : undefined]);
      let {wishlist_items, past_selections} = (userSKUWishList || {});
      past_selections = past_selections || [];
      wishlist_items = wishlist_items || [];
      let payload_added = false;
      if (id) {
        wishlist_items = (wishlist_items && wishlist_items.length > 0 ?
            wishlist_items.map((item) => {
              let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = (item.sku_measurement ||
                  {});

              if (item.id === id && item_measurement_type ===
                  measurement_type && item_measurement_value ===
                  measurement_value) {
                item.offer_discount = (seller_sku || {}).offer_discount || 0;
                item.seller_id = seller_id;
                if (request.payload.quantity === 0) {
                  return undefined;
                }
                item = request.payload;
                payload_added = true;
              }
              return item;
            }) : [{}].map(item => {
              item = request.payload;
              payload_added = true;
              item.seller_id = seller_id;
              if (item.quantity === 0) {
                return undefined;
              }
              item.offer_discount = (seller_sku || {}).offer_discount || 0;
              return item;
            })).filter(item => !!item);
        if (!payload_added) {
          request.payload.offer_discount = (seller_sku || {}).offer_discount ||
              0;
          wishlist_items.push(JSON.parse(JSON.stringify(_.omit(request.payload,
              ['status_type', 'updated_by', 'created_at', 'updated_at']))));
        }
      } else {
        request.payload.status_type = 11;
        request.payload.updated_by = user_id;
        let userSku = await this.addUserSKU(request.payload);
        userSku = userSku.toJSON();
        userSku.added_date = request.payload.added_date;
        userSku.quantity = request.payload.quantity;
        wishlist_items.push(JSON.parse(JSON.stringify(_.omit(userSku,
            ['status_type', 'updated_by', 'created_at', 'updated_at']))));
      }
      if (seller_id) {
        wishlist_items = wishlist_items.filter(
            item => item.seller_id === seller_id);
      }

      console.log(JSON.stringify({wishlist_items, payload: request.payload}));
      await this.addSKUToWishList(
          {
            wishlist_items, is_new: !userSKUWishList, user_id, past_selections,
          });
      return reply.response({
        status: true,
        result: {wishlist_items, past_selections},
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
      wishlist_items = wishlist_items || [];
      wishlists.forEach((item) => {
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = (item.sku_measurement ||
            {});
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = (pItem.sku_measurement ||
              {});
          return item.id === pItem.id && item_measurement_type ===
              measurement_type && item_measurement_value ===
              measurement_value;
        });

        if (!alreadySelected) {
          item.count = 1;
          item.offer_discount = undefined;
          item.seller_id = undefined;
          past_selections.push(item);
        } else {
          alreadySelected.count += 1;
          alreadySelected.added_date = item.added_date;
          alreadySelected.offer_discount = undefined;
          alreadySelected.seller_id = undefined;
        }
      });
      past_selections = JSON.parse(JSON.stringify(past_selections));
      console.log('\n\n\n\n\n\n', JSON.stringify({past_selections}));
      await this.addSKUToWishList({past_selections, wishlist_items, user_id});
      return reply.response({
        status: true,
        result: {past_selections},
      });
    } catch (err) {
      console.log('\n\n\n\n\n', err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2, user_id, log_content: JSON.stringify({
          params: request.params, query: request.query,
          headers: request.headers, payload: request.payload, err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false, message: 'Something went wrong.', err,
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
      wishlist_items = wishlist_items || [];
      past_selections = past_selections || [];
      wishlist_items.forEach((item) => {
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = (item.sku_measurement ||
            {});
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = (pItem.sku_measurement ||
              {});
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
        status: false, message: 'Something went wrong.', err,
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
        let {measurement_type: item_measurement_type, measurement_value: item_measurement_value} = (item.sku_measurement ||
            {});
        const alreadySelected = past_selections.find((pItem) => {
          let {measurement_type, measurement_value} = (pItem.sku_measurement ||
              {});
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
      console.log(err);
      this.modals.logs.create({
        api_action: 'PUT', api_path: 'updatePastWishList',
        log_type: 2, user_id,
        log_content: JSON.stringify({err}),
      }).catch((ex) => console.log('error while logging on db,', ex));
      throw err;
    }
  }

  async retrieveSKUData(options) {
    const result = await this.modals.sku.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveSKU(options) {
    const result = await this.modals.sku.findOne(options);
    return result ? result.toJSON() : undefined;
  }

  async retrieveUserSKUs(options) {
    const result = await this.modals.user_index.findAll(options);
    return result && result.length > 0 ? result[0].toJSON() : undefined;
  }

  async addSKUToWishList(options) {
    let {wishlist_items, past_selections, is_new, user_id} = options;
    wishlist_items = (wishlist_items || []).filter(item => item.quantity > 0);
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
        where: {seller_id, seller_status: 13, admin_status: 5},
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
        item.is_pending = item.total_cashback === 0;
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
      item.is_pending = item.total_cashback === 0;
      return item;
    } catch (e) {
      throw e;
    }
  }

  async retrieveUserSKUExpenses(options) {
    const sku_expenses = await this.modals.expense_sku_items.findAll(options);
    return sku_expenses.map(item => item.toJSON());
  }
}
