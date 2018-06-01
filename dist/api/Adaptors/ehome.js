/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class EHomeAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
  }

  prepareEHomeResult(user, request) {
    return Promise.all([this.prepareCategoryData(user, request.language), this.retrieveRecentSearch(user), this.modals.mailBox.count({
      where: {
        user_id: user.id || user.ID,
        status_id: 4
      }
    })]).then(result => {

      let OtherCategory = null;

      const categoryList = result[0].map(item => {
        const categoryData = item;
        if (categoryData.id === 9) {
          OtherCategory = categoryData;
        }

        return categoryData;
      });

      let newCategoryData = _lodash2.default.orderBy(categoryList.filter(elem => {
        return elem.id !== 9;
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
        forceUpdate: request.pre.forceUpdate
      };
    }).catch(err => {
      console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
      return {
        status: false,
        message: 'EHome restore failed',
        err,
        forceUpdate: request.pre.forceUpdate
      };
    });
  }

  retrieveUnProcessedBills(user) {
    return this.modals.jobs.findAll({
      attributes: [['created_at', 'uploadedDate'], ['id', 'docId']],
      where: {
        user_id: user.id || user.ID,
        user_status: {
          $notIn: [3, 5, 9]
        },
        admin_status: {
          $notIn: [3, 5, 9] // 3=Delete, 5=Complete, 9=Discard
        },
        $or: [{
          ce_status: {
            $notIn: [5, 7]
          }
        }, {
          ce_status: null
        }]
      },
      include: [{
        model: this.modals.jobCopies,
        as: 'copies',
        attributes: [['id', 'copyId'], 'file_type', [this.modals.sequelize.fn('CONCAT', '/jobs/', this.modals.sequelize.literal('"jobs"."id"'), '/files/', this.modals.sequelize.literal('"copies"."id"')), 'copyUrl']],
        where: {
          status_type: {
            $notIn: [3, 5, 9]
          }
        }
      }],
      order: [['created_at', 'DESC']]
    });
  }

  prepareCategoryData(user, language) {
    const categoryOption = {
      category_level: 1,
      status_type: 1
    };

    const productOptions = {
      status_type: [5, 11],
      user_id: user.id || user.ID,
      product_status_type: 8
    };

    const inProgressProductOption = {};
    _lodash2.default.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;

    return Promise.all([this.categoryAdaptor.retrieveCategories(categoryOption, false, language), this.productAdaptor.retrieveProductCounts(productOptions), this.productAdaptor.retrieveProductCounts(inProgressProductOption)]).then(results => {
      return results[0].map(categoryItem => {
        const category = categoryItem;
        const products = _lodash2.default.chain(results[1]).filter(productItem => productItem.masterCategoryId === category.id);
        const inProgressProduct = _lodash2.default.chain(results[2]).filter(amcItem => amcItem.masterCategoryId === category.id);
        const expenses = _lodash2.default.chain([...products, ...inProgressProduct] || []).sortBy(item => {
          return _moment2.default.utc(item.lastUpdatedAt, _moment2.default.ISO_8601);
        }).reverse().value();
        category.expenses = expenses;
        category.cLastUpdate = expenses && expenses.length > 0 ? expenses[0].lastUpdatedAt : null;
        category.productCounts = parseInt(_shared2.default.sumProps(expenses, 'productCounts'));
        return category;
      });
    });
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.id || user.ID
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue']
    });
  }

  prepareProductDetail(parameters) {
    let { user, masterCategoryId, ctype, brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue, request } = parameters;
    return this.fetchProductDetails({
      user: user,
      masterCategoryId: masterCategoryId,
      subCategoryId: ctype || undefined,
      brandIds: brandIds,
      categoryIds: categoryIds,
      offlineSellerIds: offlineSellerIds,
      onlineSellerIds: onlineSellerIds,
      sortBy: sortBy,
      searchValue: `%${searchValue || ''}%`
    }, request.language).then(result => {
      const productList = result.productList;
      /* const listIndex = (pageNo * 10) - 10; */

      let brands = result.productList.filter(item => item.brand !== null).map(item => {
        const brandItem = item.brand;
        brandItem.id = brandItem.brandId;
        return brandItem;
      });
      brands = _lodash2.default.uniqBy(brands, 'id');

      let offlineSellers = result.productList.filter(item => item.sellers !== null).map(item => {
        const sellerItem = item.sellers;
        sellerItem.name = sellerItem.sellerName;
        return sellerItem;
      });

      offlineSellers = _lodash2.default.uniqBy(offlineSellers, 'id');

      let onlineSellers = result.productList.filter(item => item.bill !== null && item.bill.sellers !== null).map(item => {
        const sellerItem = item.bill.sellers;
        sellerItem.name = sellerItem.sellerName;
        return sellerItem;
      });

      onlineSellers = _lodash2.default.uniqBy(onlineSellers, 'id');
      return {
        status: true,
        productList /* :productList.slice((pageNo * 10) - 10, 10) */
        , filterData: {
          categories: result.subCategories.filter(item => productList.find(productItem => productItem.categoryId === item.id)),
          brands: brands.filter(item => item.id !== 0),
          sellers: {
            offlineSellers: offlineSellers.filter(item => item.id !== 0),
            onlineSellers: onlineSellers.filter(item => item.id !== 0)
          }
        },
        categoryName: result.name,
        forceUpdate: request.pre.forceUpdate
        /* ,
            nextPageUrl: productList.length > listIndex + 10 ?
             `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
             &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
             &offlinesellerids=${offlineSellerIds}&onlinesellerids=
             ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
      };
    }).catch(err => {
      console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
      return {
        status: false,
        err,
        forceUpdate: request.pre.forceUpdate
      };
    });
  }

  fetchProductDetails(parameters, language) {
    let { user, masterCategoryId, subCategoryId, brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue } = parameters;
    const categoryOption = {
      category_level: 1,
      status_type: 1
    };

    const productOptions = {
      status_type: [5, 11],
      user_id: user.id || user.ID
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
        $iLike: searchValue
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
    _lodash2.default.assignIn(inProgressProductOption, productOptions);
    inProgressProductOption.status_type = 8;

    return Promise.all([this.categoryAdaptor.retrieveCategories(categoryOption, false, language, true), this.productAdaptor.retrieveProducts(productOptions, language), this.productAdaptor.retrieveProducts(inProgressProductOption, language)]).then(results => {
      return results[0].map(categoryItem => {
        const category = categoryItem;
        const products = _lodash2.default.chain(results[1]).map(productItem => {
          const product = productItem;
          product.dataIndex = 1;
          return product;
        }).filter(productItem => productItem.masterCategoryId === category.id).value();
        const inProgressProduct = _lodash2.default.chain(results[2]).map(productItem => {
          const product = productItem;
          product.dataIndex = 2;
          return product;
        }).filter(productItem => productItem.masterCategoryId === category.id).value();
        category.productList = _lodash2.default.chain([...products, ...inProgressProduct] || []).sortBy(item => {
          return _moment2.default.utc(item.purchaseDate, _moment2.default.ISO_8601);
        }).reverse().value();

        return category;
      })[0];
    });
  }
}

exports.default = EHomeAdaptor;