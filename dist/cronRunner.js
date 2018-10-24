'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeCron = executeCron;

var _notification = require('./api/adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _nodeSchedule = require('node-schedule');

var _nodeSchedule2 = _interopRequireDefault(_nodeSchedule);

var _models = require('./api/models');

var _models2 = _interopRequireDefault(_models);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function executeCron() {
  _models2.default.sequelize.sync().then(() => {
    let rule1 = new _nodeSchedule2.default.RecurrenceRule();
    rule1.hour = 8;
    rule1.dayOfWeek = new _nodeSchedule2.default.Range(0, 6);
    const notificationAdaptor = new _notification2.default(_models2.default);
    _nodeSchedule2.default.scheduleJob(rule1, function () {
      console.log('Send Notification of 7 days Start');
      return notificationAdaptor.createNotifications(7).then(() => {
        console.log('success');
      }).catch(console.log);
    });
    let rule2 = new _nodeSchedule2.default.RecurrenceRule();
    rule2.hour = 9;
    rule2.dayOfWeek = new _nodeSchedule2.default.Range(0, 6);
    _nodeSchedule2.default.scheduleJob(rule2, function () {
      console.log('Send Notification of 15 days Start');
      return notificationAdaptor.createNotifications(15).then(() => {
        console.log('success');
      }).catch(console.log);
    });

    let rule3 = new _nodeSchedule2.default.RecurrenceRule();
    rule3.hour = 7;
    rule3.dayOfWeek = 5;
    _nodeSchedule2.default.scheduleJob(rule3, function () {
      console.log('Send Notification of Missing Docs Start');
      return notificationAdaptor.createMissingDocNotification(15).then(() => {
        console.log('success');
      }).catch(console.log);
    });
    let rule4 = new _nodeSchedule2.default.RecurrenceRule();
    rule4.hour = 6;
    rule4.dayOfWeek = new _nodeSchedule2.default.Range(0, 6);
    _nodeSchedule2.default.scheduleJob(rule4, function () {
      console.log('Send Notification of daily expenses Start');
      return notificationAdaptor.createExpenseNotification(1).then(() => {
        console.log('success');
      }).catch(console.log);
    });
    let rule5 = new _nodeSchedule2.default.RecurrenceRule();
    rule5.hour = 6;
    rule5.dayOfWeek = 0;
    _nodeSchedule2.default.scheduleJob(rule5, function () {
      console.log('Send Notification of weekly expenses Start');
      return notificationAdaptor.createExpenseNotification(6).then(() => {
        console.log('success');
      }).catch(console.log);
    });
    let rule6 = new _nodeSchedule2.default.RecurrenceRule();
    rule6.hour = 6;
    rule6.month = _moment2.default.utc().endOf('month');
    _nodeSchedule2.default.scheduleJob(rule6, function () {
      console.log('Send Notification of monthly expenses Start');
      return notificationAdaptor.createExpenseNotification(_moment2.default.utc().endOf('month').date()).then(() => {
        console.log('success');
      }).catch(console.log);
    });
  }).catch(err => console.log(err, 'Something went wrong with the Database Update! for Cron Job'));
}