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

  prepareEHomeResult(user, request) {
    return Promise.all([
      this.retrieveUnProcessedBills(user),
      this.prepareCategoryData(user, {}),
      this.retrieveRecentSearch(user),
      this.modals.mailBox.count({
        where: {
          user_id: user.id,
          status_id: 4,
        },
      }),
    ]).then((result) => {

      let OtherCategory = null;

      const categoryList = result[1].map((item) => {
        const categoryData = item;
        if (categoryData.id === 9) {
          OtherCategory = categoryData;
        }

        return categoryData;
      });

      const categoryDataWithoutOthers = _.orderBy(
          categoryList.filter((elem) => {
            return (elem.id !== 9);
          }), ['productCounts'], ['desc']);

      let newCategoryData = categoryDataWithoutOthers;

      let pushed = false;

      if (OtherCategory) {
        newCategoryData = [];
        categoryDataWithoutOthers.forEach((elem) => {
          if (OtherCategory.productCounts > elem.productCounts && !pushed) {
            newCategoryData.push(OtherCategory);
            pushed = true;
          }
          newCategoryData.push(elem);
        });

        if (!pushed) {
          newCategoryData.push(OtherCategory);
        }
      }

      const recentSearches = result[2].map(item => {
        const searches = item.toJSON();
        return searches.searchValue;
      }).slice(0, 5);

      return {
        status: true,
        message: 'EHome restore successful',
        notificationCount: result[3],
        // categories: result[3],
        recentSearches,
        unProcessedBills: result[0],
        categoryList: newCategoryData,
        forceUpdate: request.pre.forceUpdate,
      };
    }).catch((err) => {
      console.log({API_Logs: err});
      return {
        status: false,
        message: 'EHome restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  retrieveUnProcessedBills(user) {
    return this.modals.jobs.findAll({
      attributes: [['created_at', 'uploadedDate'], ['id', 'docId']],
      where: {
        user_id: user.id,
        user_status: {
          $notIn: [3, 5, 9],
        },
        admin_status: {
          $notIn: [3, 5, 9] // 3=Delete, 5=Complete, 9=Discard
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

  prepareCategoryData(user, options) {
    const categoryOption = {
      category_level: 1,
      status_type: 1,
    };

    const productOptions = {
      status_type: [5, 11],
      user_id: user.id,
      product_status_type: 8,
    };

    const inProgressProductOption = {};
    _.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;

    return Promise.all([
      this.categoryAdaptor.retrieveCategories(categoryOption, false),
      this.productAdaptor.retrieveProductCounts(productOptions),
      this.productAdaptor.retrieveProductCounts(inProgressProductOption)]).
        then((results) => {
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
              return moment(item.lastUpdatedAt);
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
        });
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.id,
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue'],
    });
  }

  prepareProductDetail(user, masterCategoryId, ctype, /* pageNo, */ brandIds,
                       categoryIds, offlineSellerIds, onlineSellerIds, sortBy,
                       searchValue, request) {
    return this.fetchProductDetails(user, masterCategoryId, ctype || undefined,
        brandIds.split('[')[1].split(']')[0].split(',').filter(Boolean),
        categoryIds.split('[')[1].split(']')[0].split(',').filter(Boolean),
        offlineSellerIds.split('[')[1].split(']')[0].split(',').
            filter(Boolean),
        onlineSellerIds.split('[')[1].split(']')[0].split(',').
            filter(Boolean),
        sortBy, `%${searchValue || ''}%`).then((result) => {
      const productList = result.productList;
      /* const listIndex = (pageNo * 10) - 10; */

      let brands = result.productList.filter((item) => item.brand !== null).
          map((item) => item.brand);
      brands = _.uniqBy(brands, 'brandId');

      let offlineSellers = result.productList.filter(
          (item) => item.sellers !== null).map((item) => {
        const sellerItem = item.sellers;
        sellerItem.name = sellerItem.sellerName;
        return sellerItem;
      });

      offlineSellers = _.uniqBy(offlineSellers, 'id');

      let onlineSellers = result.productList.filter(
          item => item.bill !== null && item.bill.sellers !== null).
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
          categories: result.subCategories,
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
    }).catch((err) => {
      console.log({API_Logs: err});
      return {
        status: false,
        err,
        forceUpdate: request.pre.forceUpdate,
      };
    });
  }

  fetchProductDetails(user,
                      masterCategoryId, subCategoryId, brandIds, categoryIds,
                      offlineSellerIds, onlineSellerIds, sortBy, searchValue) {
    const categoryOption = {
      category_level: 1,
      status_type: 1,
    };

    const productOptions = {
      status_type: [5, 11],
      user_id: user.id,
    };

    if (masterCategoryId) {
      categoryOption.category_id = masterCategoryId;
      productOptions.main_category_id = masterCategoryId;
    }

    if (subCategoryId) {
      productOptions.category_id = subCategoryId;
    }

    if (categoryIds && categoryIds.length > 0) {
      productOptions.category_id = categoryIds;
    }

    if (searchValue && searchValue !== '%%') {
      productOptions.product_name = {
        $iLike: searchValue,
      };
    }

    if (brandIds && brandIds.length > 0) {
      productOptions.brand_id = brandIds;
    }

    if (offlineSellerIds && offlineSellerIds.length > 0) {
      productOptions.seller_id = offlineSellerIds;
    }

    if (onlineSellerIds && onlineSellerIds.length > 0) {
      productOptions.online_seller_id = onlineSellerIds;
    }

    const inProgressProductOption = {};
    _.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;
    console.log({
      productOptions
      , inProgressProductOption,
    });

    return Promise.all([
      this.categoryAdaptor.retrieveCategories(categoryOption),
      this.productAdaptor.retrieveProducts(productOptions),
      this.productAdaptor.retrieveProducts(inProgressProductOption),]).
        then((results) => {
          console.log({
            results,
          });
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
                filter((productItem) => productItem.masterCategoryId ===
                    category.id).value();
            category.productList = _.chain([
              ...products,
              ...inProgressProduct] || []).sortBy((item) => {
              return moment(item.lastUpdatedAt);
            }).reverse().value();

            return category;
          })[0];
        });
  }
}

export default EHomeAdaptor;
