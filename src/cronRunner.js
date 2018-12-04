import NotificationAdaptor from './api/adaptors/notification';
import schedule from 'node-schedule';
import models from './api/models';
import moment from 'moment';

export function executeCron() {
  models.sequelize.sync().
      then(() => {
        let rule1 = new schedule.RecurrenceRule();
        rule1.hour = 8;
        rule1.dayOfWeek = new schedule.Range(0, 6);
        const notificationAdaptor = new NotificationAdaptor(models);
        schedule.scheduleJob(rule1, function() {
          console.log('Send Notification of 7 days Start');
          return notificationAdaptor.createNotifications(7).then(() => {
            console.log('success');
          }).catch(console.log);
        });
        let rule2 = new schedule.RecurrenceRule();
        rule2.hour = 9;
        rule2.dayOfWeek = new schedule.Range(0, 6);
        schedule.scheduleJob(rule2, function() {
          console.log('Send Notification of 15 days Start');
          return notificationAdaptor.createNotifications(15).then(() => {
            console.log('success');
          }).catch(console.log);
        });

        let rule3 = new schedule.RecurrenceRule();
        rule3.hour = 7;
        rule3.dayOfWeek = 5;
        schedule.scheduleJob(rule3, function() {
          console.log('Send Notification of Missing Docs Start');
          return notificationAdaptor.createMissingDocNotification(15).
              then(() => {
                console.log('success');
              }).
              catch(console.log);
        });
        let rule4 = new schedule.RecurrenceRule();
        rule4.hour = 6;
        rule4.dayOfWeek = new schedule.Range(0, 6);
        schedule.scheduleJob(rule4, function() {
          console.log('Send Notification of daily expenses Start');
          return notificationAdaptor.createExpenseNotification(1).then(() => {
            console.log('success');
          }).catch(console.log);
        });
        let rule5 = new schedule.RecurrenceRule();
        rule5.hour = 6;
        rule5.dayOfWeek = 0;
        schedule.scheduleJob(rule5, function() {
          console.log('Send Notification of weekly expenses Start');
          return notificationAdaptor.createExpenseNotification(6).then(() => {
            console.log('success');
          }).catch(console.log);
        });
        let rule6 = new schedule.RecurrenceRule();
        rule6.hour = 6;
        rule6.month = moment.utc().endOf('month');
        schedule.scheduleJob(rule6, function() {
          console.log('Send Notification of monthly expenses Start');
          return notificationAdaptor.createExpenseNotification(
              moment.utc().endOf('month').date()).then(() => {
            console.log('success');
          }).catch(console.log);
        });
      }).
      catch(err => console.log(err,
          'Something went wrong with the Database Update! for Cron Job'));
}
