/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class JobAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  createJobs(jobDetail) {
    return this.modals.jobs.create(jobDetail).then(jobResult => jobResult.toJSON());
  }

  createJobCopies(copyDetail) {
    return this.modals.jobCopies.create(copyDetail).then(copyResult => copyResult.toJSON());
  }

  retrieveJobDetail(id, isUpload) {
    return Promise.all([this.modals.jobs.findById(id), this.modals.products.findOne({ where: { job_id: id }, attributes: ['id'] }), this.modals.jobCopies.findAll({ where: { job_id: id } })]).then(jobResult => {
      let jobDetail = jobResult[0] ? jobResult[0].toJSON() : undefined;
      if (jobDetail && jobDetail.admin_status === 8 || isUpload) {
        jobResult[0].updateAttributes({
          admin_status: 4,
          ce_status: null,
          assigned_to_ce: null,
          qe_status: null,
          assigned_to_qe: null
        });
      } else if (jobDetail.admin_status === 2) {
        jobResult[0].updateAttributes({
          admin_status: 5,
          user_status: 5
        });
      }

      jobDetail = jobResult[0].toJSON();
      const productDetail = jobResult[1].toJSON();
      jobDetail.productId = productDetail.id;
      jobDetail.copies = jobResult[2].map(item => item.toJSON());
      return jobDetail;
    });
  }
}

exports.default = JobAdaptor;