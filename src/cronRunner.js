import NotificationAdaptor from './api/Adaptors/notification';
import schedule from 'node-schedule';
import models from './api/models';

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
      }).
      catch(err => console.log(err,
          'Something went wrong with the Database Update! for Cron Job'));
}
