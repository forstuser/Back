/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ServiceCenterAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveServiceCenters(options) {
    options.status_type = 1;
    const categoryId = options.category_id;
    const brand_id = options.brand_id;
    options = _lodash2.default.omit(options, 'category_id');
    options = _lodash2.default.omit(options, 'brand_id');
    return this.modals.serviceCenters.findAll({
      where: options,
      include: [{
        model: this.modals.brands,
        as: 'brands',
        where: {
          brand_id
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
        attributes: [[this.modals.sequelize.literal('"centerDetails->detailType"."type"'), 'type'], [this.modals.sequelize.literal('"centerDetails->detailType"."title"'), 'name'], ['value', 'details'], ['category_id', 'categoryId']],
        required: true,
        as: 'centerDetails'
      }],
      attributes: [['center_name', 'centerName'], ['center_city', 'city'], ['center_state', 'state'], ['center_country', 'country'], ['center_pin', 'pinCode'], ['center_latitude', 'latitude'], ['center_longitude', 'longitude'], ['center_timings', 'timings'], ['center_days', 'openingDays'], [this.modals.sequelize.fn('CONCAT', '/categories/', categoryId, '/images/0'), 'cImageURL'], ['center_address', 'address']],
      order: [['center_name', 'ASC']]
    }).then(results => results.map(item => item.toJSON()));
  }
}

exports.default = ServiceCenterAdaptor;