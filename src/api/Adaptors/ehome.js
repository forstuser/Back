/*jshint esversion: 6 */
'use strict';

import ProductAdaptor from './product';
import CategoryAdaptor from './category';
import InsuranceAdaptor from './insurances';
import AMCAdaptor from './amcs';
import WarrantyAdaptor from './warranties';
import RepairAdaptor from './repairs';
import _ from 'lodash';
import shared from '../../helpers/shared';
import moment from 'moment';

class EHomeAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
  }

  async prepareEHomeResult(user, request) {
    try {
      const result = await Promise.all([
        this.prepareCategoryData(user, request.language),
        this.retrieveRecentSearch(user),
        this.modals.mailBox.count({
          where: {
            user_id: user.id || user.ID,
            status_id: 4,
          },
        }),
      ]);

      let OtherCategory = null;

      const categoryList = result[0].map((item) => {
        const categoryData = item;
        if (categoryData.id === 9) {
          OtherCategory = categoryData;
        }

        return categoryData;
      });

      let newCategoryData = _.orderBy(
          categoryList.filter((elem) => {
            return (elem.id !== 9);
          }), ['name'], ['asc']);
      newCategoryData.push(OtherCategory);
      const recentSearches = result[1].map(item => {
        const searches = item.toJSON();
        return searches.searchValue;
      }).slice(0, 5);

      return {
        status: true,
        message: 'EHome restore successful',
        notificationCount: result[2],
        // categories: result[3],
        recentSearches,
        categoryList: newCategoryData,
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));

      return {
        status: false,
        message: 'EHome restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async retrieveUnProcessedBills(user) {
    return this.modals.jobs.findAll({
      attributes: [['created_at', 'uploadedDate'], ['id', 'docId']],
      where: {
        user_id: user.id || user.ID,
        user_status: {
          $notIn: [3, 5, 9],
        },
        admin_status: {
          $notIn: [3, 5, 9], // 3=Delete, 5=Complete, 9=Discard
        },
        $or: [
          {
            ce_status: {
              $notIn: [5, 7],
            },
          }, {
            ce_status: null,
          },
        ],
      },
      include: [
        {
          model: this.modals.jobCopies,
          as: 'copies',
          attributes: [
            [
              'id',
              'copyId'],
            'file_type',
            [
              this.modals.sequelize.fn('CONCAT', '/jobs/',
                  this.modals.sequelize.literal('"jobs"."id"'), '/files/',
                  this.modals.sequelize.literal('"copies"."id"')),
              'copyUrl']],
          where: {
            status_type: {
              $notIn: [3, 5, 9],
            },
          },
        }],
      order: [
        ['created_at', 'DESC'],
      ],
    });
  }

  async prepareCategoryData(user, language) {
    const categoryOption = {
      category_level: 1,
      status_type: 1,
    };

    const productOptions = {
      status_type: [5, 11],
      user_id: user.id || user.ID,
      product_status_type: 8,
      accessory_part_id: null,
      accessory_id: null,
    };

    const inProgressProductOption = {};
    _.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;

    const results = await Promise.all([
      this.categoryAdaptor.retrieveCategories({
        options: categoryOption,
        isBrandFormRequired: false,
        isSubCategoryRequiredForAll: true,
        language,
      }),
      this.productAdaptor.retrieveProductCounts(productOptions),
      this.productAdaptor.retrieveProductCounts(inProgressProductOption)]);
    return results[0].map((categoryItem) => {
      const category = categoryItem;

      const products = _.chain(results[1]).
          filter(
              (productItem) => productItem.masterCategoryId ===
                  category.id);
      const inProgressProduct = _.chain(results[2]).
          filter((amcItem) => amcItem.masterCategoryId === category.id);
      const expenses = _.chain([
        ...products,
        ...inProgressProduct,
      ] || []).sortBy((item) => {
        return moment.utc(item.lastUpdatedAt, moment.ISO_8601);
      }).reverse().value();
      category.expenses = expenses;
      category.cLastUpdate = expenses &&
      expenses.length > 0 ?
          expenses[0].lastUpdatedAt :
          null;
      category.productCounts = parseInt(shared.sumProps(expenses,
          'productCounts'));
      return category;
    });
  }

  async retrieveRecentSearch(user) {
    return await this.modals.recentSearches.findAll({
      where: {user_id: user.id || user.ID, searchValue: {$not: null}},
      order: [['searchDate', 'DESC']], attributes: ['searchValue'],
    });
  }

  async retrieveEHomeProducts(parameters) {
    let {user, type, brand_id, category_id, offline_seller_id, online_seller_id, sort_by, search_value, request, limit, offset} = parameters;
    const main_category_id = type === 1 ? [1, 2, 3, 7] :
        type === 2 ? [4, 5, 6, 8] : [9, 10];
    try {
      let [categoryData, recent_searches] = await Promise.all([
        this.fetchEHomeProducts({
          user, main_category_id, brand_id, category_id,
          offline_seller_id, online_seller_id, sort_by,
          search_value: `%${search_value || ''}%`, limit, offset,
        }, request.language), this.retrieveRecentSearch(user)]);
      let brands, productList = [], offlineSellers, onlineSellers;
      categoryData = categoryData.map((result) => {
        productList.push(...result.productList);
        /* const listIndex = (pageNo * 10) - 10; */
        result.brands = _.uniqBy(
            result.productList.filter((item) => item.brand).
                map((item) => {
                  const brandItem = item.brand;
                  brandItem.id = brandItem.brandId;
                  return brandItem;
                }), 'id');

        result.offlineSellers = _.uniqBy(result.productList.filter(
            (item) => item.sellers).map((item) => {
          const sellerItem = item.sellers;
          sellerItem.name = sellerItem.sellerName;
          return sellerItem;
        }), 'id');

        result.onlineSellers = _.uniqBy(result.productList.filter(
            item => item.bill && item.bill.sellers).
            map((item) => {
              const sellerItem = item.bill.sellers;
              sellerItem.name = sellerItem.sellerName;
              return sellerItem;
            }), 'id');
        result.subCategories = _.uniqBy(
            result.subCategories.filter(scItem => scItem.products.length > 0),
            'id');
        result = _.omit(result, 'productList');
        return result;
      });
      return {
        status: true,
        productList /* :productList.slice((pageNo * 10) - 10, 10) */,
        recentSearches: recent_searches.map(item => {
          const searches = item.toJSON();
          return searches.searchValue;
        }).slice(0, 5),
        filterData: categoryData,
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {

      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: false,
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async fetchEHomeProducts(parameters, language) {
    let {user, main_category_id, subCategoryId, brand_id, category_id, offline_seller_id, online_seller_id, sort_by, search_value, limit, offset} = parameters;
    const categoryOption = {category_level: 1, status_type: 1};

    const productOptions = {
      user_id: user.id || user.ID, accessory_part_id: null,
      accessory_id: null, $or: [
        {
          $and: {
            status_type: 8, bill_id: {
              $in: this.modals.sequelize.literal(
                  `(Select id from consumer_bills where status_type = 5)`),
            },
          },
        }, {status_type: [5, 11]}],
    };

    if (main_category_id) {
      categoryOption.category_id = main_category_id;
      productOptions.main_category_id = main_category_id;
    }

    if (subCategoryId) {
      productOptions.category_id = subCategoryId;
    }

    if (category_id && category_id.length > 0) {
      productOptions.category_id = category_id;
    }

    if (search_value && search_value !== '%%') {
      productOptions.product_name = {
        $iLike: search_value,
      };
    }

    if (brand_id && brand_id.length > 0) {
      productOptions.brand_id = brand_id;
    }

    if (offline_seller_id && offline_seller_id.length > 0) {
      productOptions.seller_id = offline_seller_id;
    }

    if (online_seller_id && online_seller_id.length > 0) {
      productOptions.online_seller_id = online_seller_id;
    }

    console.log({offset});
    const [categories, productList] = await Promise.all([
      this.categoryAdaptor.retrieveCategories({
        options: categoryOption,
        isBrandFormRequired: false, isFilterRequest: true,
        isSubCategoryRequiredForAll: true, language, user,
      }),
      this.productAdaptor.retrieveEHomeProducts(productOptions, language, limit,
          offset, sort_by)]);
    return categories.map((categoryItem) => {
      const category = categoryItem;
      const products = _.chain(productList).
          map((productItem) => {
            const product = productItem;
            product.dataIndex = 1;
            return product;
          }).
          filter((productItem) => productItem.masterCategoryId === category.id).
          value();
      category.productList = _.chain([...products] || []).
          sortBy((item) => moment.utc(item.purchaseDate, moment.ISO_8601)).
          reverse().value();

      return category;
    });
  }

  async prepareProductDetail(parameters) {
    let {user, masterCategoryId, ctype, brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue, request} = parameters;
    try {
      const result = await this.fetchProductDetails({
        main_category_id: masterCategoryId, subCategoryId: ctype || undefined,
        brand_id: brandIds, category_id: categoryIds, sort_by: sortBy,
        offline_seller_id: offlineSellerIds, online_seller_id: onlineSellerIds,
        search_value: `%${searchValue || ''}%`, user,
      }, request.language);
      const productList = result.productList;
      /* const listIndex = (pageNo * 10) - 10; */

      let brands = result.productList.filter((item) => item.brand).
          map((item) => {
            const brandItem = item.brand;
            brandItem.id = brandItem.brandId;
            return brandItem;
          });
      brands = _.uniqBy(brands, 'id');

      let offlineSellers = result.productList.filter(
          (item) => item.sellers).map((item) => {
        const sellerItem = item.sellers;
        sellerItem.name = sellerItem.sellerName;
        return sellerItem;
      });

      offlineSellers = _.uniqBy(offlineSellers, 'id');

      let onlineSellers = result.productList.filter(
          item => item.bill && item.bill.sellers).
          map((item) => {
            const sellerItem = item.bill.sellers;
            sellerItem.name = sellerItem.sellerName;
            return sellerItem;
          });

      onlineSellers = _.uniqBy(onlineSellers, 'id');
      return {
        status: true,
        productList /* :productList.slice((pageNo * 10) - 10, 10) */,
        filterData: {
          categories: result.subCategories.filter((item) => productList.find(
              (productItem) => productItem.categoryId === item.id)),
          brands: brands.filter(item => item.id !== 0),
          sellers: {
            offlineSellers: offlineSellers.filter(item => item.id !== 0),
            onlineSellers: onlineSellers.filter(item => item.id !== 0),
          },
        },
        categoryName: result.name,
        forceUpdate: request.pre.forceUpdate,
        /* ,
            nextPageUrl: productList.length > listIndex + 10 ?
             `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
             &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
             &offlinesellerids=${offlineSellerIds}&onlinesellerids=
             ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
      };
    } catch (err) {

      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return {
        status: false,
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    }
  }

  async fetchProductDetails(parameters, language) {
    let {user, main_category_id, subCategoryId, brand_id, category_id, offline_seller_id, online_seller_id, sort_by, search_value, limit, offset} = parameters;
    const categoryOption = {category_level: 1, status_type: 1};

    const productOptions = {
      status_type: [5, 11], user_id: user.id || user.ID,
      accessory_part_id: null, accessory_id: null,
    };

    if (main_category_id) {
      categoryOption.category_id = main_category_id;
      productOptions.main_category_id = main_category_id;
    }

    if (subCategoryId) {
      productOptions.category_id = subCategoryId;
    }

    if (category_id && category_id.length > 0) {
      productOptions.category_id = category_id;
    }

    if (search_value && search_value !== '%%') {
      productOptions.product_name = {
        $iLike: search_value,
      };
    }

    if (brand_id && brand_id.length > 0) {
      productOptions.brand_id = brand_id;
    }

    if (offline_seller_id && offline_seller_id.length > 0) {
      productOptions.seller_id = offline_seller_id;
    }

    if (online_seller_id && online_seller_id.length > 0) {
      productOptions.online_seller_id = online_seller_id;
    }

    const inProgressProductOption = {};
    _.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;
    inProgressProductOption.bill_id = {
      $in: this.modals.sequelize.literal(
          `(Select id from consumer_bills where status_type = 5)`),
    };

    const results = await Promise.all([
      this.categoryAdaptor.retrieveCategories({
        options: categoryOption,
        isBrandFormRequired: false,
        isSubCategoryRequiredForAll: true, language,
        isFilterRequest: true,
      }),
      this.productAdaptor.retrieveProducts(productOptions, language, limit,
          offset, sort_by),
      this.productAdaptor.retrieveProducts(inProgressProductOption,
          language,
          limit, offset, sort_by)]);
    return results[0].map((categoryItem) => {
      const category = categoryItem;
      const products = _.chain(results[1]).
          map((productItem) => {
            const product = productItem;
            product.dataIndex = 1;
            return product;
          }).
          filter(
              (productItem) => productItem.masterCategoryId ===
                  category.id).value();
      const inProgressProduct = _.chain(results[2]).
          map((productItem) => {
            const product = productItem;
            product.dataIndex = 2;
            return product;
          }).
          filter((productItem) => productItem.masterCategoryId === category.id).
          value();
      category.productList = _.chain([
        ...products,
        ...inProgressProduct] || []).sortBy((item) => {
        return moment.utc(item.purchaseDate, moment.ISO_8601);
      }).reverse().value();

      return category;
    })[0];
  }
}

export default EHomeAdaptor;
