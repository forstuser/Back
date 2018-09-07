/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
    let { id, job_id, jobDetail } = parameters;
    return await this.modals.cashback_jobs.update(jobDetail, { where: JSON.parse(JSON.stringify({ id, job_id })) });
  }

  async createJobCopies(copyDetail) {
    const copyResult = await this.modals.jobCopies.create(copyDetail);
    return copyResult.toJSON();
  }

  async retrieveCashBackJobs(parameters) {
    let { id, job_id } = parameters;
    const cashBackJobs = await this.modals.cashback_jobs.findOne({ where: JSON.parse(JSON.stringify({ id, job_id })) });
    return cashBackJobs ? cashBackJobs.toJSON() : cashBackJobs;
  }

  async retrieveSellerCashBack(options) {
    const seller_cashback = await this.modals.cashback_wallet.findOne(options);
    return seller_cashback ? seller_cashback.toJSON() : seller_cashback;
  }

  async retrieveUserCashBack(options) {
    const user_wallet = await this.modals.user_wallet.findOne(options);
    return user_wallet ? user_wallet.toJSON() : user_wallet;
  }

  async approveSellerCashBack(options) {
    const { amount, status_type, job_id, seller_id, id, transaction_type } = options;
    await this.modals.cashback_wallet.update(JSON.parse(JSON.stringify({ status_type: status_type || 16, amount, transaction_type })), { where: JSON.parse(JSON.stringify({ job_id, seller_id, id })) });
  }

  async approveUserCashBack(options) {
    const { amount, status_type, job_id, seller_id, id, transaction_type } = options;
    await this.modals.user_wallet.update(JSON.parse(JSON.stringify({ status_type: status_type || 16, amount, transaction_type })), { where: JSON.parse(JSON.stringify({ job_id, seller_id, id })) });
  }

  async approveHomeDeliveryCashback(options) {
    const { status_type, job_id, seller_id } = options;
    await this.modals.seller_wallet.update({ status_type: status_type || 16 }, { job_id, seller_id });
  }

  async addCashBackToSeller(options) {
    const { status_type, job_id, seller_id, amount, transaction_type, user_id } = options;
    await this.modals.seller_wallet.create(JSON.parse(JSON.stringify({ status_type: status_type || 16, job_id, amount, transaction_type, user_id, seller_id })));
  }

  async retrieveJobDetail(id, isUpload) {
    const jobResult = await Promise.all([this.modals.jobs.findById(id), this.modals.products.findOne({
      where: { job_id: id, ref_id: null },
      attributes: ['id', 'category_id', 'main_category_id']
    }), this.modals.jobCopies.findAll({ where: { job_id: id } }), this.modals.cashback_jobs.findOne({
      where: { job_id: id },
      attributes: ['id', 'online_order']
    })]);
    let jobDetail = jobResult[0] ? jobResult[0].toJSON() : undefined;
    if (jobDetail && jobDetail.admin_status === 8 || isUpload) {
      await jobResult[0].updateAttributes({
        admin_status: 4, ce_status: null, qe_status: null,
        assigned_to_ce: null, assigned_to_qe: null
      });
    } else if (jobDetail.admin_status === 2) {
      await jobResult[0].updateAttributes({ admin_status: 5, user_status: 5 });
    }

    jobDetail = jobResult[0].toJSON();
    console.log(jobResult[3]);
    const productDetail = jobResult[1].toJSON();
    const cashback_job_detail = jobResult[3] ? jobResult[3].toJSON() : {};
    jobDetail.productId = productDetail.id;
    jobDetail.category_id = productDetail.category_id;
    jobDetail.main_category_id = productDetail.main_category_id;
    jobDetail.cashback_job_id = cashback_job_detail.id;
    jobDetail.online_order = cashback_job_detail.online_order;
    jobDetail.copies = jobResult[2].map(item => item.toJSON());
    return jobDetail;
  }

  async cashBackApproval(options) {
    let { cash_back_month, cash_back_day, verified_seller, amount, digitally_verified, seller_id, home_delivered, job, cashback_source, transaction_type, user_limit_rules, user_default_limit_rules } = options;
    const { user_id, id: job_id } = job;
    let monthly_limit = user_limit_rules.find(item => item.rule_type === 1),
        daily_limit = user_limit_rules.find(item => item.rule_type === 2);
    monthly_limit = monthly_limit || user_default_limit_rules.find(item => item.rule_type === 1);
    daily_limit = daily_limit || user_default_limit_rules.find(item => item.rule_type === 2);
    let home_delivery_limit = user_default_limit_rules.find(item => item.rule_type === 7);
    let total_amount = amount;
    total_amount = total_amount < 0 ? 0 : total_amount;
    if (digitally_verified) {
      await Promise.all([this.approveSellerCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.approveUserCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.updateCashBackJobs({ id: job_id, seller_status: 16, seller_id }), home_delivered ? this.approveHomeDeliveryCashback({ job_id, status_type: 16, seller_id }) : '']);

      return { approved_amount: total_amount, pending_seller_amount: 0 };
    } else if (verified_seller) {
      if (cash_back_day + total_amount <= daily_limit.rule_limit) {
        if (cash_back_month + total_amount <= monthly_limit.rule_limit) {
          await Promise.all([this.approveSellerCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.approveUserCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.updateCashBackJobs({ id: job_id, seller_status: 16, seller_id }), home_delivered ? this.approveHomeDeliveryCashback({ job_id, status_type: 16, seller_id }) : '']);

          return { approved_amount: total_amount };
        } else {
          total_amount = monthly_limit.rule_limit - cash_back_month;
          total_amount = total_amount < 0 ? 0 : total_amount;

          await Promise.all([this.approveSellerCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.approveUserCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.updateCashBackJobs({ id: job_id, seller_status: 16, seller_id }), home_delivered ? this.approveHomeDeliveryCashback({ job_id, status_type: 16, seller_id }) : '']);

          return { approved_amount: total_amount };
        }
      } else {
        total_amount = daily_limit.rule_limit - cash_back_day;
        total_amount = total_amount < 0 ? 0 : total_amount;
        await Promise.all([this.approveSellerCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.approveUserCashBack({ job_id, amount: total_amount, status_type: 16, seller_id }), this.updateCashBackJobs({ id: job_id, seller_status: 16, seller_id }), home_delivered ? this.approveHomeDeliveryCashback({ job_id, status_type: 16, seller_id }) : '']);

        return { approved_amount, pending_seller_amount };
      }
    }
  }

  async cashBackRedemption(options) {
    let { job, seller_cashback_id, user_cashback_id, seller_id, transaction_type, cashback_amount } = options;
    const { user_id, id: job_id } = job;
    await Promise.all([this.approveSellerCashBack({ job_id, id: seller_cashback_id, seller_id, status_type: 14, transaction_type }), this.approveUserCashBack({ job_id, id: user_cashback_id, seller_id, status_type: 14, transaction_type }), this.updateCashBackJobs({ id: job_id, seller_status: 16, cashback_status: 14, seller_id }), this.approveHomeDeliveryCashback({ job_id, status_type: 16, amount: cashback_amount, seller_id, user_id, transaction_type: 1 })]);
  }
}

exports.default = JobAdaptor;