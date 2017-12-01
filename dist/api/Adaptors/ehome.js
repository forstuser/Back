/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EHomeAdaptor = function () {
  function EHomeAdaptor(modals) {
    _classCallCheck(this, EHomeAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
  }

  _createClass(EHomeAdaptor, [{
    key: 'prepareEHomeResult',
    value: function prepareEHomeResult(user, request) {
      return Promise.all([this.retrieveUnProcessedBills(user), this.prepareCategoryData(user, {}), this.retrieveRecentSearch(user), this.modals.mailBox.count({
        where: {
          user_id: user.id,
          status_id: 4
        }
      })]).then(function (result) {

        var OtherCategory = null;

        var categoryList = result[1].map(function (item) {
          var categoryData = item;
          if (categoryData.id === 9) {
            OtherCategory = categoryData;
          }

          return categoryData;
        });

        var categoryDataWithoutOthers = _lodash2.default.orderBy(categoryList.filter(function (elem) {
          return elem.id !== 9;
        }), ['productCounts'], ['desc']);

        var newCategoryData = categoryDataWithoutOthers;

        var pushed = false;

        if (OtherCategory) {
          newCategoryData = [];
          categoryDataWithoutOthers.forEach(function (elem) {
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

        var recentSearches = result[2].map(function (item) {
          var searches = item.toJSON();
          return searches.searchValue;
        }).slice(0, 5);

        return {
          status: true,
          message: 'EHome restore successful',
          notificationCount: result[3],
          // categories: result[3],
          recentSearches: recentSearches,
          unProcessedBills: result[0],
          categoryList: newCategoryData,
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          message: 'EHome restore failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'retrieveUnProcessedBills',
    value: function retrieveUnProcessedBills(user) {
      return this.modals.jobs.findAll({
        attributes: [['created_at', 'uploadedDate'], ['id', 'docId']],
        where: {
          user_id: user.id,
          user_status: {
            $notIn: [3, 5, 9]
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
            }],
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
  }, {
    key: 'prepareCategoryData',
    value: function prepareCategoryData(user, options) {
      var categoryOption = {
        category_level: 1,
        status_type: 1
      };

      var productOptions = {
        status_type: [5, 11],
        user_id: user.id,
        product_status_type: 8
      };

      var inProgressProductOption = {};
      _lodash2.default.assignIn(inProgressProductOption, productOptions);
      inProgressProductOption.status_type = 8;

      return Promise.all([
        this.categoryAdaptor.retrieveCategories(categoryOption, false),
        this.productAdaptor.retrieveProductCounts(productOptions),
        this.productAdaptor.retrieveProductCounts(inProgressProductOption)]).
          then(function(results) {
            return results[0].map(function(categoryItem) {
              var category = categoryItem;
              var products = _lodash2.default.chain(results[1]).
                  filter(function(productItem) {
                    return productItem.masterCategoryId === category.id;
                  });
              var inProgressProduct = _lodash2.default.chain(results[2]).
                  filter(function(amcItem) {
                    return amcItem.masterCategoryId === category.id;
                  });
              var expenses = _lodash2.default.chain([].concat(
                  _toConsumableArray(products),
                  _toConsumableArray(inProgressProduct)) || []).
                  sortBy(function(item) {
                    return (0, _moment2.default)(item.lastUpdatedAt);
                  }).
                  reverse().
                  value();
              category.expenses = expenses;
              category.cLastUpdate = expenses && expenses.length > 0 ?
                  expenses[0].lastUpdatedAt :
                  null;
              category.productCounts = parseInt(
                  _shared2.default.sumProps(expenses, 'productCounts'));
              return category;
            });
          });
    }
  }, {
    key: 'retrieveRecentSearch',
    value: function retrieveRecentSearch(user) {
      return this.modals.recentSearches.findAll({
        where: {
          user_id: user.id,
        },
        order: [['searchDate', 'DESC']],
        attributes: ['searchValue'],
      });
    }
  }, {
    key: 'prepareProductDetail',
    value: function prepareProductDetail(
        user, masterCategoryId, ctype, /* pageNo, */brandIds, categoryIds,
        offlineSellerIds, onlineSellerIds, sortBy, searchValue, request) {
      return this.fetchProductDetails(user, masterCategoryId, ctype ||
          undefined,
          brandIds.split('[')[1].split(']')[0].split(',').filter(Boolean),
          categoryIds.split('[')[1].split(']')[0].split(',').filter(Boolean),
          offlineSellerIds.split('[')[1].split(']')[0].split(',').
              filter(Boolean),
          onlineSellerIds.split('[')[1].split(']')[0].split(',').
              filter(Boolean), sortBy, '%' + (searchValue || '') + '%').
          then(function(result) {
            var productList = result.productList;
            /* const listIndex = (pageNo * 10) - 10; */

        var brands = result.productList.filter(function (item) {
          return item.brand !== null;
        }).map(function (item) {
          return item.brand;
        });
            brands = _lodash2.default.uniqBy(brands, 'brandId');

        var offlineSellers = result.productList.filter(function (item) {
          return item.sellers !== null;
        }).map(function (item) {
          var sellerItem = item.sellers;
          sellerItem.name = sellerItem.sellerName;
          return sellerItem;
        });

            offlineSellers = _lodash2.default.uniqBy(offlineSellers, 'id');

        var onlineSellers = result.productList.filter(function (item) {
          return item.bill !== null && item.bill.sellers !== null;
        }).map(function (item) {
          var sellerItem = item.bill.sellers;
          sellerItem.name = sellerItem.sellerName;
          return sellerItem;
        });

            onlineSellers = _lodash2.default.uniqBy(onlineSellers, 'id');
        return {
          status: true,
          productList: productList /* :productList.slice((pageNo * 10) - 10, 10) */
          , filterData: {
            categories: result.subCategories,
            brands: brands.filter(function (item) {
              return item.id !== 0;
            }),
            sellers: {
              offlineSellers: offlineSellers.filter(function (item) {
                return item.id !== 0;
              }),
              onlineSellers: onlineSellers.filter(function (item) {
                return item.id !== 0;
              })
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
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'fetchProductDetails',
    value: function fetchProductDetails(user, masterCategoryId, subCategoryId, brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue) {
      var categoryOption = {
        category_level: 1,
        status_type: 1
      };

      var productOptions = {
        status_type: [5, 11],
        user_id: user.id
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

      var inProgressProductOption = {};
      _lodash2.default.assignIn(inProgressProductOption, productOptions);
      inProgressProductOption.status_type = 8;
      console.log({
        productOptions: productOptions,
        inProgressProductOption: inProgressProductOption
      });

      return Promise.all([this.categoryAdaptor.retrieveCategories(categoryOption), this.productAdaptor.retrieveProducts(productOptions), this.productAdaptor.retrieveProducts(inProgressProductOption)]).then(function (results) {
        console.log({
          results: results
        });
        return results[0].map(function (categoryItem) {
          var category = categoryItem;
          var products = _lodash2.default.chain(results[1]).map(function (productItem) {
            var product = productItem;
            product.dataIndex = 1;
            return product;
          }).filter(function (productItem) {
            return productItem.masterCategoryId === category.id;
          }).value();
          var inProgressProduct = _lodash2.default.chain(results[2]).map(function (productItem) {
            var product = productItem;
            product.dataIndex = 2;
            return product;
          }).filter(function (productItem) {
            return productItem.masterCategoryId === category.id;
          }).value();
          category.productList = _lodash2.default.chain([].concat(_toConsumableArray(products), _toConsumableArray(inProgressProduct)) || []).sortBy(function (item) {
            return (0, _moment2.default)(item.updatedDate);
          }).reverse().value();

          return category;
        })[0];
      });
    }
  }]);

  return EHomeAdaptor;
}();

exports.default = EHomeAdaptor;