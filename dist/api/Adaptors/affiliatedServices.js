'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _category = require('category');

var _category2 = _interopRequireDefault(_category);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AffiliatedServiceAdaptor = function () {
  function AffiliatedServiceAdaptor(modals) {
    _classCallCheck(this, AffiliatedServiceAdaptor);

    this.modals = modals;
    this.categoryAdaptor = new _category2.default(modals);
  }

  _createClass(AffiliatedServiceAdaptor, [{
    key: 'getCities',
    value: function getCities(options) {
      return this.modals.table_cities.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'getAllCategory',
    value: function getAllCategory(options) {
      var _this = this;

      return this.getAllProviderCities({
        where: { city_id: options.city_id }
      }).then(function (cityResults) {
        return _this.getAllProviderCategories({
          where: { provider_city_id: cityResults.map(function (item) {
              return item.id;
            }) }
        });
      }).then(function (providerCategories) {
        return _this.categoryAdaptor.retrieveCategories({ category_id: providerCategories.map(function (item) {
            return item.category_id;
          }) });
      });
    }
  }, {
    key: 'getAllProviderCities',
    value: function getAllProviderCities(options) {
      var _this2 = this;

      return Promise.try(function () {
        return _this2.modals.table_cities.findAll(options);
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'getAllProviderCategories',
    value: function getAllProviderCategories(options) {
      var _this3 = this;

      return Promise.try(function () {
        return _this3.modals.table_provider_categories.findAll(options);
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return AffiliatedServiceAdaptor;
}();

exports.default = AffiliatedServiceAdaptor;