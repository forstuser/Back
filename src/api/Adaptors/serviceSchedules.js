/*jshint esversion: 6 */
'use strict';

import moment from 'moment';

const sortAmcWarrantyInsuranceRepair = (a, b) => {
  let aDate;
  let bDate;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (moment.utc(aDate).isBefore(moment.utc(bDate))) {
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
      attributes: [
        'id',
        'category_id',
        'brand_id',
        'title',
        'inclusions',
        'exclusions',
        'service_number', 'service_type',
        'distance',
        'due_in_months',
        'due_in_days',
        'updated_at'],
      order: [['due_in_months']],
    });
    return scheduleResults.map((item) => item.toJSON());
  }
}

export default ServiceScheduleAdaptor;
