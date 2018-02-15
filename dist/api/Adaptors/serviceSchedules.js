/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sortAmcWarrantyInsuranceRepair = function sortAmcWarrantyInsuranceRepair(a, b) {
  var aDate = void 0;
  var bDate = void 0;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

var ServiceScheduleAdaptor = function () {
  function ServiceScheduleAdaptor(modals) {
    _classCallCheck(this, ServiceScheduleAdaptor);

    this.modals = modals;
  }

  _createClass(ServiceScheduleAdaptor, [{
    key: 'retrieveServiceSchedules',
    value: function retrieveServiceSchedules(options) {
      return this.modals.serviceSchedules.findAll({
        where: options,
        attributes: ['id', 'category_id', 'brand_id', 'title', 'inclusions', 'exclusions', 'service_number', 'service_type', 'distance', 'due_in_months', 'due_in_days', 'updated_at'],
        order: [['due_in_months']]
      }).then(function (scheduleResults) {
        return scheduleResults.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return ServiceScheduleAdaptor;
}();

exports.default = ServiceScheduleAdaptor;