/*jshint esversion: 6 */
'use strict';

import _ from 'lodash';
import moment from 'moment';
import ProductAdaptor from './product';
import CategoryAdaptor from './category';
import SellerAdaptor from './sellers';
import BrandAdaptor from './brands';

function uniqueBy(a, cond) {
  return a.filter((e, i) => a.findIndex(e2 => cond(e, e2)) === i);
}

class SearchAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.sellerAdaptor = new SellerAdaptor(modals);
    this.brandAdaptor = new BrandAdaptor(modals);
  }

  prepareSearchResult(user, searchValue, language) {
    return Promise.all([
      this.fetchProductDetailOnline(user, `%${searchValue}%`),
      this.fetchProductDetailOffline(user, `%${searchValue}%`),
      this.fetchProductDetailBrand(user, `%${searchValue}%`),
    ]).then((results) => {
      const onlineSellerProductId = results[0].map(item => item.id);
      const offlineSellerProductId = results[1].map(item => item.id);
      const brandProductId = results[2].map(item => item.id);
      return Promise.all([
        this.fetchProductDetails(user, `%${searchValue}%`,
            [
              ...onlineSellerProductId,
              ...offlineSellerProductId,
              ...brandProductId], language),
        this.prepareCategoryData(user, `%${searchValue}%`, language),
        this.updateRecentSearch(user, searchValue),
        this.retrieveRecentSearch(user),
      ]);
    }).then((result) => {
      const productIds = [];
      let productList = result[0].map((item) => {
        const product = item;
        productIds.push(product.id);
        return product;
      });

      const categoryList = result[1].map((item) => {
        const category = item;
        category.products = category.products.filter((elem) => {
          return (productIds.indexOf(elem.id) < 0);
        });

        return category;
      });

      productList = uniqueBy([
        ...productList], (item1, item2) => item1.id === item2.id);

      result[2][0].updateAttributes({
        resultCount: productList.length + categoryList.length,
        searchDate: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      });
      const recentSearches = result[3].map(item => {
        const searches = item.toJSON();
        return searches.searchValue;
      });
      return {
        status: true,
        message: 'Search successful',
        notificationCount: 0,
        recentSearches,
        productDetails: productList,
        categoryList,
      };
    }).catch((err) => {

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
        message: 'Search failed',
        err,
      };
    });
  }

  prepareCategoryData(user, searchValue, language) {
    const categoryOption = {
      status_type: 1,
      $and: [
        {
          $or: [
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col('categories.category_name')),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)}),
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col(`${language ?
                    `"categories"."category_name_${language}"` :
                    `"categories"."category_name"`}`)),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)}),
          ],
        }],
    };

    const productOptions = {
      status_type: [5, 8, 11],
      user_id: user.id || user.ID,
    };

    let categories;

    return this.categoryAdaptor.retrieveCategories({
      options: categoryOption,
      isSubCategoryRequiredForAll: false,
      isBrandFormRequired: language
    }).
        then((results) => {
          categories = results;
          const categoryIds = categories.filter(item => item.level === 2);
          const mainCategoryIds = categories.filter(
              item => item.level === 1);
          productOptions.category_id = categoryIds.length > 0 ?
              categoryIds.map(item => item.id) :
              undefined;
          productOptions.main_category_id = mainCategoryIds.length > 0 ?
              mainCategoryIds.map(item => item.id) :
              categoryIds.length > 0 ?
                  categoryIds.map(item => item.refId) :
                  undefined;
          return this.productAdaptor.retrieveProducts(productOptions, language);
        }).then((productResult) => {
          return categories.map((categoryItem) => {
            const category = categoryItem;
            const products = _.chain(productResult).
                filter(
                    (productItem) => productItem.masterCategoryId ===
                        category.id || productItem.categoryId === category.id);
            category.products = _.chain(products).sortBy((item) => {
              return moment.utc(item.lastUpdatedAt, moment.ISO_8601);
            }).reverse().value();
            return category;
          });
        });
  }

  updateRecentSearch(user, searchValue) {
    return this.modals.recentSearches.findCreateFind({
      where: {
        user_id: user.id || user.ID,
        searchValue,
      },
      default: {
        user_id: user.id || user.ID,
        searchValue,
        resultCount: 0,
        searchDate: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      },
    });
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.id || user.ID,
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue'],
    });
  }

  fetchProductDetails(user, searchValue, productIds, language) {
    return this.productAdaptor.retrieveProducts({
      user_id: user.id || user.ID,
      product_name: {
        $not: null,
      },
      status_type: [5, 11],
      $or: {
        id: productIds,
        $and: [
          this.modals.sequelize.where(this.modals.sequelize.fn('lower',
              this.modals.sequelize.col('product_name')),
              {$iLike: this.modals.sequelize.fn('lower', searchValue)}),
        ],
      },
    }, language);
  }

  fetchProductDetailOnline(user, searchValue) {
    return this.sellerAdaptor.retrieveOnlineSellers({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('seller_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((onlineSellers) => {
      if (onlineSellers && onlineSellers.length > 0) {
        return this.productAdaptor.retrieveProductIds({
          user_id: user.id || user.ID,
          status_type: [5, 8, 11],
          online_seller_id: onlineSellers.map(item => item.id),
        });
      }

      return [];
    });
  }

  fetchProductDetailOffline(user, searchValue) {
    return this.sellerAdaptor.retrieveOfflineSellers({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('seller_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((offlineSellers) => {

      if (offlineSellers && offlineSellers.length > 0) {
        return this.productAdaptor.retrieveProductIds({
          user_id: user.id || user.ID,
          status_type: [5, 8, 11],
          seller_id: offlineSellers.map(item => item.id),
        });
      }

      return [];
    });
  }

  fetchProductDetailBrand(user, searchValue) {
    return this.brandAdaptor.retrieveBrands({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('brand_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((brands) => {

      if (brands && brands.length > 0) {
        return this.productAdaptor.retrieveProductIds({
          user_id: user.id || user.ID,
          status_type: [5, 8, 11],
          brand_id: brands.map(item => item.id),
        });
      }

      return [];
    });
  }
}

export default SearchAdaptor;
