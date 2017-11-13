/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _sellers = require('./sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function uniqueBy(a, cond) {
  return a.filter(function(e, i) {
    return a.findIndex(function(e2) {
      return cond(e, e2);
    }) === i;
  });
}

var SearchAdaptor = function () {
  function SearchAdaptor(modals) {
    _classCallCheck(this, SearchAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
    this.sellerAdaptor = new _sellers2.default(modals);
    this.brandAdaptor = new _brands2.default(modals);
  }

  _createClass(SearchAdaptor, [
    {
      key: 'prepareSearchResult',
      value: function prepareSearchResult(user, searchValue) {
        var _this = this;

        return Promise.all([
          this.fetchProductDetailOnline(user, '%' + searchValue + '%'),
          this.fetchProductDetailOffline(user, '%' + searchValue + '%'),
          this.fetchProductDetailBrand(user, '%' + searchValue + '%')]).
            then(function(results) {
              return Promise.all([
                _this.fetchProductDetails(user, '%' + searchValue + '%',
                    [].concat(_toConsumableArray(results[0]),
                        _toConsumableArray(results[1]),
                        _toConsumableArray(results[2]))),
                _this.prepareCategoryData(user, '%' + searchValue + '%'),
                _this.updateRecentSearch(user, searchValue),
                _this.retrieveRecentSearch(user)]);
            }).
            then(function(result) {
              var productIds = [];
              var productList = result[0].map(function(item) {
                var product = item;
                productIds.push(product.id);
                return product;
              });

              var categoryList = result[1].map(function(item) {
                var category = item;
                category.products = category.products.filter(function(elem) {
                  return productIds.indexOf(elem.id) < 0;
                });

                return category;
              });

              productList = uniqueBy([].concat(_toConsumableArray(productList)),
                  function(item1, item2) {
                    return item1.id === item2.id;
                  });

              result[2][0].updateAttributes({
                resultCount: productList.length + categoryList.length,
                searchDate: (0, _moment2.default)().
                    format('YYYY-MM-DD HH:mm:ss'),
              });
              var recentSearches = result[3].map(function(item) {
                var searches = item.toJSON();
                return searches.searchValue;
              });
              return {
                status: true,
                message: 'Search successful',
                notificationCount: 0,
                recentSearches: recentSearches,
                productDetails: productList,
                categoryList: categoryList,
              };
            }).
            catch(function(err) {
              console.log({API_Logs: err});
              return {
                status: false,
                message: 'Search failed',
                err: err,
              };
            });
      },
    }, {
      key: 'prepareCategoryData',
      value: function prepareCategoryData(user, searchValue) {
        var _this2 = this;

        var categoryOption = {
          category_level: 1,
          status_type: 1,
          $and: [
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col('categories.category_name')),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
        };

        var productOptions = {
          status_type: [5, 8],
          user_id: user.id,
        };

        var categories = void 0;

        return this.categoryAdaptor.retrieveCategories(categoryOption).
            then(function(results) {
              categories = results;

              productOptions.$or = {
                category_id: categories.map(function(item) {
                  return item.id;
                }),
                main_category_id: categories.map(function(item) {
                  return item.id;
                }),
              };
              return _this2.productAdaptor.retrieveProducts(productOptions);
            }).
            then(function(productResult) {
              return categories.map(function(categoryItem) {
                var category = categoryItem;
                var products = _lodash2.default.chain(productResult).
                    filter(function(productItem) {
                      return productItem.masterCategoryId === category.id ||
                          productItem.categoryId === category.id;
                    });
                category.products = _lodash2.default.chain(products).
                    sortBy(function(item) {
                      return (0, _moment2.default)(item.lastUpdatedAt);
                    }).
                    reverse().
                    value();
                return category;
              });
            });
      },
    }, {
      key: 'updateRecentSearch',
      value: function updateRecentSearch(user, searchValue) {
        return this.modals.recentSearches.findOrCreate({
          where: {
            user_id: user.id,
            searchValue: searchValue,
          },
          default: {
            user_id: user.id,
            searchValue: searchValue,
            resultCount: 0,
            searchDate: (0, _moment2.default)().format('YYYY-MM-DD HH:mm:ss'),
          },
        });
      },
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
      },
    }, {
      key: 'fetchProductDetails',
      value: function fetchProductDetails(user, searchValue, productIds) {
        return this.productAdaptor.retrieveProducts({
          user_id: user.id,
          status_type: [5, 8],
          $or: {
            id: productIds,
            $and: [
              this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                  this.modals.sequelize.col('product_name')),
                  {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
          },
        });
      },
    }, {
      key: 'fetchProductDetailOnline',
      value: function fetchProductDetailOnline(user, searchValue) {
        var _this3 = this;

        return this.sellerAdaptor.retrieveOnlineSellers({
          $and: [
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col('seller_name')),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
        }).then(function(onlineSellers) {
          return _this3.productAdaptor.retrieveProductIds({
            user_id: user.id,
            status_type: [5, 8],
            online_seller_id: onlineSellers.map(function(item) {
              return item.id;
            }),
          });
        });
      },
    }, {
      key: 'fetchProductDetailOffline',
      value: function fetchProductDetailOffline(user, searchValue) {
        var _this4 = this;

        return this.sellerAdaptor.retrieveOfflineSellers({
          $and: [
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col('seller_name')),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
        }).then(function(offlineSellers) {
          return _this4.productAdaptor.retrieveProductIds({
            user_id: user.id,
            status_type: [5, 8],
            seller_id: offlineSellers.map(function(item) {
              return item.id;
            }),
          });
        });
      },
    }, {
      key: 'fetchProductDetailBrand',
      value: function fetchProductDetailBrand(user, searchValue) {
        var _this5 = this;

        return this.brandAdaptor.retrieveBrands({
          $and: [
            this.modals.sequelize.where(this.modals.sequelize.fn('lower',
                this.modals.sequelize.col('brand_name')),
                {$iLike: this.modals.sequelize.fn('lower', searchValue)})],
        }).then(function(brands) {
          return _this5.productAdaptor.retrieveProductIds({
            user_id: user.id,
            status_type: [5, 8],
            brand_id: brands.map(function(item) {
              return item.id;
            }),
          });
        });
      },
    }]);

  return SearchAdaptor;
}();

exports.default = SearchAdaptor;