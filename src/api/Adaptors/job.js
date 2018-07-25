/*jshint esversion: 6 */
'use strict';

class JobAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  async createJobs(jobDetail) {
    const jobResult = await this.modals.jobs.create(jobDetail);
    return jobResult.toJSON();
  }

  async createCashBackJobs(jobDetail) {
    const jobResult = await this.modals.cashback_jobs.create(jobDetail);
    return jobResult.toJSON();
  }

  async updateCashBackJobs(parameters) {
    let {id, job_id, jobDetail} = parameters;
    return await this.modals.cashback_jobs.update(jobDetail,
        {where: JSON.parse(JSON.stringify({id, job_id}))});
  }

  async createJobCopies(copyDetail) {
    const copyResult = await this.modals.jobCopies.create(copyDetail);
    return copyResult.toJSON();
  }

  async retrieveCashBackJobs(parameters) {
    let {id, job_id} = parameters;
    const cashBackJobs = await this.modals.cashback_jobs.findOne(
        {where: JSON.parse(JSON.stringify({id, job_id}))});
    return cashBackJobs ? cashBackJobs.toJSON() : cashBackJobs;
  }

  async retrieveJobDetail(id, isUpload) {
    const jobResult = await Promise.all([
      this.modals.jobs.findById(id),
      this.modals.products.findOne({
        where: {job_id: id, ref_id: null},
        attributes: ['id', 'category_id', 'main_category_id'],
      }),
      this.modals.jobCopies.findAll({where: {job_id: id}}),
      this.modals.cashback_jobs.findOne({
        where: {job_id: id},
        attributes: ['id'],
      })]);
    let jobDetail = jobResult[0] ? jobResult[0].toJSON() : undefined;
    if (jobDetail && jobDetail.admin_status === 8 || isUpload) {
      await jobResult[0].updateAttributes({
        admin_status: 4, ce_status: null, qe_status: null,
        assigned_to_ce: null, assigned_to_qe: null,
      });
    } else if (jobDetail.admin_status === 2) {
      await jobResult[0].updateAttributes({admin_status: 5, user_status: 5});
    }

    jobDetail = jobResult[0].toJSON();
    console.log(jobResult[3]);
    const productDetail = jobResult[1].toJSON();
    const cashback_job_detail = jobResult[3] ? jobResult[3].toJSON() : {};
    jobDetail.productId = productDetail.id;
    jobDetail.category_id = productDetail.category_id;
    jobDetail.main_category_id = productDetail.main_category_id;
    jobDetail.cashback_job_id = cashback_job_detail.id;
    jobDetail.copies = jobResult[2].map((item) => item.toJSON());
    return jobDetail;
  }
}

export default JobAdaptor;
