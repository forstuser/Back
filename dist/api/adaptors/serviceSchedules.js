/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sortAmcWarrantyInsuranceRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

class ServiceScheduleAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async retrieveServiceSchedules(options) {
    const scheduleResults = await this.modals.serviceSchedules.findAll({
      where: options,
      attributes: ['id', 'category_id', 'brand_id', 'title', 'inclusions', 'exclusions', 'service_number', 'service_type', 'distance', 'due_in_months', 'due_in_days', 'updated_at'],
      order: [['due_in_months']]
    });
    return scheduleResults.map(item => item.toJSON());
  }
}

exports.default = ServiceScheduleAdaptor;