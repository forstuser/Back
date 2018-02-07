'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SellerAdaptor = function () {
  function SellerAdaptor(modals) {
    _classCallCheck(this, SellerAdaptor);

    this.modals = modals;
  }

  _createClass(SellerAdaptor, [{
    key: 'retrieveOfflineSellers',
    value: function retrieveOfflineSellers(options) {
      options.status_type = [1, 11];
      return this.modals.offlineSellers.findAll({
        where: options,
        attributes: [['sid', 'id'], ['seller_name', 'name'], ['owner_name', 'ownerName'], 'gstin', ['pan_no', 'panNo'], ['reg_no', 'registrationNo'], ['is_service', 'isService'], ['is_onboarded', 'isOnboarded'], 'address', 'city', 'state', 'pincode', 'latitude', 'longitude', 'url', ['contact_no', 'contact'], 'email']
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveOnlineSellers',
    value: function retrieveOnlineSellers(options) {
      options.status_type = [1, 11];
      return this.modals.onlineSellers.findAll({
        where: options,
        attributes: [
          [
            'sid',
            'id'],
          [
            'seller_name',
            'name'],
          'gstin',
          'url',
          'contact',
          'email'],
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveOrCreateOfflineSellers',
    value: function retrieveOrCreateOfflineSellers(options, defaults) {
      var _this = this;

      return this.modals.offlineSellers.findOne({
        where: options,
      }).then(function (result) {
        if (result) {
          result.updateAttributes(defaults);
          return result;
        }

        return _this.modals.offlineSellers.create(defaults);
      }).then(function(result) {
        return result.toJSON();
      });
    }
  }]);

  return SellerAdaptor;
}();

exports.default = SellerAdaptor;