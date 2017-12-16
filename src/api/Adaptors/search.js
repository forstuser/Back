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

  prepareSearchResult(user, searchValue) {
    return Promise.all([
      this.fetchProductDetailOnline(user, `%${searchValue}%`),
      this.fetchProductDetailOffline(user, `%${searchValue}%`),
      this.fetchProductDetailBrand(user, `%${searchValue}%`),
    ]).then((results) => {
      const onlineSellerProductId = results[0].map(item => item.id);
      const offlineSellerProductId = results[1].map(item => item.id);
      const brandProductId = results[2].map(item => item.id);
      console.log({
        onlineSellerProductId,
        offlineSellerProductId,
        brandProductId,
      });
      return Promise.all([
        this.fetchProductDetails(user, `%${searchValue}%`,
            [
              ...onlineSellerProductId,
              ...offlineSellerProductId,
              ...brandProductId]),
        this.prepareCategoryData(user, `%${searchValue}%`),
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
        searchDate: moment().format('YYYY-MM-DD HH:mm:ss'),
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
      console.log({API_Logs: err});
      return {
        status: false,
        message: 'Search failed',
        err,
      };
    });
  }

  prepareCategoryData(user, searchValue) {
    const categoryOption = {
      status_type: 1,
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('categories.category_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    };

    const productOptions = {
      status_type: [5, 8],
      user_id: user.id || user.ID,
    };

    let categories;

    return this.categoryAdaptor.retrieveCategories(categoryOption).
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
              undefined;
          return this.productAdaptor.retrieveProducts(productOptions);
        }).then((productResult) => {
          return categories.map((categoryItem) => {
            const category = categoryItem;
            const products = _.chain(productResult).
                filter(
                    (productItem) => productItem.masterCategoryId ===
                        category.id || productItem.categoryId === category.id);
            category.products = _.chain(products).sortBy((item) => {
              return moment(item.lastUpdatedAt);
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
        searchDate: moment().format('YYYY-MM-DD HH:mm:ss'),
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

  fetchProductDetails(user, searchValue, productIds) {
    return this.productAdaptor.retrieveProducts({
      user_id: user.id || user.ID,
      status_type: [5, 8, 11],
      $or: {
        id: productIds,
        $and: [
          this.modals.sequelize.where(this.modals.sequelize.fn('lower',
              this.modals.sequelize.col('product_name')),
              {$iLike: this.modals.sequelize.fn('lower', searchValue)}),
        ],
      },
    });
  }

  fetchProductDetailOnline(user, searchValue) {
    return this.sellerAdaptor.retrieveOnlineSellers({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('seller_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((onlineSellers) => {
      return this.productAdaptor.retrieveProductIds({
        user_id: user.id || user.ID,
        status_type: [5, 8],
        online_seller_id: onlineSellers.map(item => item.id),
      });
    });
  }

  fetchProductDetailOffline(user, searchValue) {
    return this.sellerAdaptor.retrieveOfflineSellers({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('seller_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((offlineSellers) => {
      return this.productAdaptor.retrieveProductIds({
        user_id: user.id || user.ID,
        status_type: [5, 8],
        seller_id: offlineSellers.map(item => item.id),
      });
    });
  }

  fetchProductDetailBrand(user, searchValue) {
    return this.brandAdaptor.retrieveBrands({
      $and: [
        this.modals.sequelize.where(this.modals.sequelize.fn('lower',
            this.modals.sequelize.col('brand_name')),
            {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
    }).then((brands) => {
      return this.productAdaptor.retrieveProductIds({
        user_id: user.id || user.ID,
        status_type: [5, 8],
        brand_id: brands.map(item => item.id),
      });
    });
  }
}

export default SearchAdaptor;
