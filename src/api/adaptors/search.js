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

  async prepareSearchResult(user, searchValue, language) {
    try {
      let [onlineSellerProductId, offlineSellerProductId, brandProductId] = await Promise.all(
          [
            this.fetchProductDetailOnline(user, `%${searchValue}%`),
            this.fetchProductDetailOffline(user, `%${searchValue}%`),
            this.fetchProductDetailBrand(user, `%${searchValue}%`),
          ]);
      onlineSellerProductId = onlineSellerProductId.map(item => item.id);
      offlineSellerProductId = offlineSellerProductId.map(item => item.id);
      brandProductId = brandProductId.map(item => item.id);
      let [productList, categoryList, recent_search_update, recent_search] = await Promise.all(
          [
            this.fetchProductDetails(user, `%${searchValue}%`,
                [
                  ...onlineSellerProductId.map(item => item.id),
                  ...offlineSellerProductId.map(item => item.id),
                  ...brandProductId.map(item => item.id)], language),
            this.prepareCategoryData(user, `%${searchValue}%`, language),
            this.updateRecentSearch(user, searchValue),
            this.retrieveRecentSearch(user),
          ]);
      const productIds = [];
      productList = productList.map((item) => {
        const product = item;
        productIds.push(product.id);
        return product;
      });

      categoryList = categoryList.map((item) => {
        const category = item;
        category.products = category.products.filter((elem) => {
          return (productIds.indexOf(elem.id) < 0);
        });

        return category;
      });

      productList = uniqueBy([...productList],
          (item1, item2) => item1.id === item2.id);

      await recent_search_update[0].updateAttributes({
        resultCount: productList.length + categoryList.length,
        searchDate: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      });
      recent_search = recent_search.map(item => {
        const searches = item.toJSON();
        return searches.searchValue;
      });
      const recentSearches = [recent_search_update[1], ...recent_search];
      return {
        status: true,
        message: 'Search successful',
        recentSearches,
        productDetails: productList,
        categoryList,
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Search failed',
        err,
      };
    }
  }

  prepareCategoryData(user, searchValue, language) {
    const categoryOption = {
      status_type: 1,
      $and: [{$or: [{category_name: {$iLike: searchValue}}]}],
    };

    const productOptions = {
      status_type: [5, 8, 11],
      user_id: user.id || user.ID,
    };

    let categories;

    return this.categoryAdaptor.retrieveCategories({
      options: categoryOption,
      isSubCategoryRequiredForAll: false,
      isBrandFormRequired: language,
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
    productIds = (productIds || []).filter(item => item);
    return this.productAdaptor.retrieveProducts(JSON.parse(JSON.stringify({
      user_id: user.id || user.ID,
      product_name: {$not: null}, status_type: [5, 11],
      $or: {
        id: productIds.length > 0 ? productIds : undefined,
        $and: [{product_name: {$iLike: searchValue}}],
      },
    })), language);
  }

  fetchProductDetailOnline(user, searchValue) {
    return this.sellerAdaptor.retrieveOnlineSellers({
      $and: [{seller_name: {$iLike: searchValue}}],
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
      $and: [{seller_name: {$iLike: searchValue}}],
    }).then((sellers) => {

      if (sellers && sellers.length > 0) {
        return this.productAdaptor.retrieveProductIds({
          user_id: user.id || user.ID,
          status_type: [5, 8, 11],
          seller_id: sellers.map(item => item.id),
        });
      }

      return [];
    });
  }

  fetchProductDetailBrand(user, searchValue) {
    return this.brandAdaptor.retrieveBrands({
      $and: [{brand_name: {$iLike: searchValue}}],
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
