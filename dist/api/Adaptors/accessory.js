'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import ProductAdapter from './product';

var AccessoryAdaptor = function () {
  function AccessoryAdaptor(modals) {
    _classCallCheck(this, AccessoryAdaptor);

    this.modals = modals;
    // this.productAdapter = ProductAdapter(modals);
  }

  _createClass(AccessoryAdaptor, [{
    key: 'getAccessoriesList',
    value: function getAccessoriesList(options) {
      var _this = this;

      var user_id = options.user_id,
          queryOptions = options.queryOptions;

      console.log(queryOptions);
      return _bluebird2.default.try(function () {
        return _this.retrieveProducts({
          where: {
            user_id: user_id,
            status_type: [5, 11]
          },
          attributes: ['brand_id', 'main_category_id', 'category_id', 'product_name', 'id']
        });
      }).then(function (products) {
        //get the category IDs
        var categoryIds = products.map(function (item) {
          return item.category_id;
        });

        var accessoryOptions = {
          category_id: categoryIds
        };

        var categoryNameOptions = {
          category_id: categoryIds
        };

        if (queryOptions.categoryid) {
          accessoryOptions.category_id = queryOptions.categoryid;
          categoryNameOptions.category_id = queryOptions.categoryid;
        } else {
          accessoryOptions.priority = {
            $between: [1, 6]
          };
        }

        return _bluebird2.default.all([_this.retrieveAccessoryCategories({
          where: accessoryOptions,
          attributes: ['id', 'title', 'category_id'],
          order: [['priority']]
        }), _this.retrieveCategoryNames({
          where: categoryNameOptions,
          attributes: ['category_id', 'category_name']
        })]);
      }).spread(function (accessoryCategories, categoryNames) {
        console.log(JSON.stringify({ accessoryCategories: accessoryCategories, categoryNames: categoryNames }));
        var productOptions = {
          accessory_id: accessoryCategories.map(function (item) {
            return item.id;
          })
        };

        if (!queryOptions.bbclass) {
          productOptions.bb_class = 2;
        } else {
          productOptions.bb_class = queryOptions.bbclass;
        }

        return _bluebird2.default.all([accessoryCategories, _this.retrieveAccessoryProducts({
          where: productOptions
        }), categoryNames]);
      }).spread(function (accessoryCategories, accessoryProducts, categoryNames) {

        accessoryCategories = accessoryCategories.map(function (item) {
          item.accessory_items = accessoryProducts.filter(function (apItem) {
            return apItem.accessory_id === item.id;
          });
          return item;
        });

        return categoryNames.map(function (item) {
          item.accessories = accessoryCategories.filter(function (acItem) {
            return acItem.category_id === item.category_id;
          });
          return item;
        }).filter(function (item) {
          return item.accessories.length > 0;
        });
      });
    }
  }, {
    key: 'getOrderHistory',
    value: function getOrderHistory(options) {
      var _this2 = this;

      return _bluebird2.default.try(function () {
        return _this2.retrieveTransactions({
          where: {
            created_by: options.user_id
          },
          order: [['updated_at', 'desc']]
        });
      }).then(function (transactions) {
        var accessory_product_ids = transactions.map(function (transaction) {
          return transaction.accessory_product_id;
        });
        var product_ids = transactions.map(function (transaction) {
          return transaction.product_id;
        });
        var payment_mode_ids = transactions.map(function (transaction) {
          return transaction.payment_mode_id;
        });
        return _bluebird2.default.all([
        // these transactions have the accessory product id
        // get the accessory products using that
        _this2.retrieveAccessoryProducts({
          where: {
            id: accessory_product_ids
          }
        }),
        // they also have product id
        // get the consumer product using that
        _this2.retrieveProducts({
          where: {
            id: product_ids
          }
        }),
        // payment mode is also there.
        // add the payment mode in the result of each transactions well.
        _this2.retrievePaymentMode({
          where: {
            id: payment_mode_ids
          }
        }), transactions]);
      }).spread(function (accessoryProducts, products, paymentModes, transactions) {
        return transactions.map(function (item) {
          item.accessory_product = accessoryProducts.find(function (pmItem) {
            return pmItem.id === item.accessory_product_id;
          });
          item.product = products.find(function (pmItem) {
            return pmItem.id === item.product_id;
          });
          item.payment_mode = paymentModes.find(function (pmItem) {
            return pmItem.id === item.payment_mode_id;
          });
          return item;
        });
      });
    }
  }, {
    key: 'retrieveProducts',
    value: function retrieveProducts(options) {
      return this.modals.products.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveAccessoryCategories',
    value: function retrieveAccessoryCategories(options) {
      return this.modals.table_accessory_categories.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveCategoryNames',
    value: function retrieveCategoryNames(options) {
      return this.modals.categories.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveAccessoryProducts',
    value: function retrieveAccessoryProducts(options) {
      return this.modals.table_accessory_products.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveTransactions',
    value: function retrieveTransactions(options) {
      return this.modals.table_transaction.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrievePaymentMode',
    value: function retrievePaymentMode(options) {
      return this.modals.table_payment_mode.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return AccessoryAdaptor;
}();

exports.default = AccessoryAdaptor;