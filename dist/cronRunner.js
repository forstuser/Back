'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.executeCron = executeCron;

var _notification = require('./api/Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _nodeSchedule = require('node-schedule');

var _nodeSchedule2 = _interopRequireDefault(_nodeSchedule);

var _models = require('./api/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function executeCron() {
  _models2.default.sequelize.sync().then(function() {
    var rule1 = new _nodeSchedule2.default.RecurrenceRule();
    rule1.hour = 8;
    rule1.dayOfWeek = new _nodeSchedule2.default.Range(0, 6);
    var notificationAdaptor = new _notification2.default(_models2.default);
    _nodeSchedule2.default.scheduleJob(rule1, function() {
      console.log('Send Notification of 7 days Start');
      return notificationAdaptor.createNotifications(7).then(function() {
        console.log('success');
      }).catch(console.log);
    });
    var rule2 = new _nodeSchedule2.default.RecurrenceRule();
    rule2.hour = 9;
    rule2.dayOfWeek = new _nodeSchedule2.default.Range(0, 6);
    _nodeSchedule2.default.scheduleJob(rule2, function() {
      console.log('Send Notification of 15 days Start');
      return notificationAdaptor.createNotifications(15).then(function() {
        console.log('success');
      }).catch(console.log);
    });

    var rule3 = new _nodeSchedule2.default.RecurrenceRule();
    rule3.hour = 7;
    rule3.dayOfWeek = 5;
    _nodeSchedule2.default.scheduleJob(rule3, function() {
      console.log('Send Notification of Missing Docs Start');
      return notificationAdaptor.createMissingDocNotification(15).
          then(function() {
            console.log('success');
          }).
          catch(console.log);
    });
  }).catch(function(err) {
    return console.log(err,
        'Something went wrong with the Database Update! for Cron Job');
  });
}