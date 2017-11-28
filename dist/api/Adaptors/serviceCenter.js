/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServiceCenterAdaptor = function () {
  function ServiceCenterAdaptor(modals) {
    _classCallCheck(this, ServiceCenterAdaptor);

    this.modals = modals;
  }

  _createClass(ServiceCenterAdaptor, [{
    key: 'retrieveServiceCenters',
    value: function retrieveServiceCenters(options) {
      options.status_type = 1;
      var categoryId = options.category_id;
      var brand_id = options.brand_id;
      options = _lodash2.default.omit(options, 'category_id');
      options = _lodash2.default.omit(options, 'brand_id');
      return this.modals.serviceCenters.findAll({
        where: options,
        include: [{
          model: this.modals.brands,
          as: 'brands',
          where: {
            brand_id: brand_id
          },
          attributes: [['brand_id', 'id'], ['brand_name', 'name'], ['brand_description', 'description']],
          required: true
        }, {
          model: this.modals.centerDetails,
          where: {
            category_id: categoryId
          },
          include: [{
            model: this.modals.detailTypes,
            attributes: []
          }],
          attributes: [
            [
              this.modals.sequelize.literal(
                  '"centerDetails->detailType"."type"'),
              'type'],
            [
              this.modals.sequelize.literal(
                  '"centerDetails->detailType"."title"'),
              'name'],
            [
              'value',
              'details'],
            [
              'category_id',
              'categoryId']],
          required: true,
          as: 'centerDetails'
        }],
        attributes: [
          [
            'center_name',
            'centerName'],
          [
            'center_city',
            'city'],
          [
            'center_state',
            'state'],
          [
            'center_country',
            'country'],
          [
            'center_pin',
            'pinCode'],
          [
            'center_latitude',
            'latitude'],
          [
            'center_longitude',
            'longitude'],
          [
            'center_timings',
            'timings'],
          [
            'center_days',
            'openingDays'],
          [
            this.modals.sequelize.fn('CONCAT', 'categories/', categoryId,
                '/images/'),
            'cImageURL'],
          [
            'center_address',
            'address']],
        order: [['center_name', 'ASC']]
      }).then(function (results) {
        return results.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return ServiceCenterAdaptor;
}();

exports.default = ServiceCenterAdaptor;