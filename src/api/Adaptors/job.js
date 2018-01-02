/*jshint esversion: 6 */
'use strict';

class JobAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  createJobs(jobDetail) {
    return this.modals.jobs.create(jobDetail).
        then((jobResult) => jobResult.toJSON());
  }

  createJobCopies(copyDetail) {
    return this.modals.jobCopies.create(copyDetail).
        then((copyResult) => copyResult.toJSON());
  }

  retrieveJobDetail(id) {
    return Promise.all([
      this.modals.jobs.findById(id),
      this.modals.products.findOne({where: {job_id: id}, attributes: ['id']})]).
        then((jobResult) => {
          jobResult[0].updateAttributes({
            admin_status: 4,
          });
          const jobDetail = jobResult[0].toJSON();
          const productDetail = jobResult[1].toJSON();
          jobDetail.productId = productDetail.id;
          return jobDetail;
        });
  }
}

export default JobAdaptor;
