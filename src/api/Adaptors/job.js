/*jshint esversion: 6 */
'use strict';

import PayTMAdaptor from './payTMAdaptor';
import _ from 'lodash';
import config from '../../config/main';

class JobAdaptor {
  constructor(modals, socket, notificationAdaptor) {
    this.modals = modals;
    if (notificationAdaptor) {
      this.notificationAdaptor = notificationAdaptor;
    }
    this.payTMAdaptor = new PayTMAdaptor(modals);
    if (socket) {
      this.socketAdaptor = socket;
    }
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
    console.log(JSON.stringify(jobDetail));
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

  async retrieveSellerCashBack(options) {
    const seller_cashback = await this.modals.cashback_wallet.findOne(options);
    return seller_cashback ? seller_cashback.toJSON() : seller_cashback;
  }

  async retrieveSellerCashBacks(options) {
    let seller_cash_back = await this.modals.cashback_wallet.findAll(options);
    seller_cash_back = seller_cash_back.map(item => item.toJSON());
    return seller_cash_back;
  }

  async retrieveSellerLoyalties(options) {
    let seller_loyalty = await this.modals.loyalty_wallet.findAll(options);
    seller_loyalty = seller_loyalty.map(item => item.toJSON());
    return seller_loyalty;
  }

  async retrieveUserCashBack(options) {
    const user_wallet = await this.modals.user_wallet.findOne(options);
    return user_wallet ? user_wallet.toJSON() : user_wallet;
  }

  async retrieveUserCashBacks(options) {
    console.log(options);
    let user_cash_back = await this.modals.user_wallet.findAll(options);

    user_cash_back = user_cash_back.map(item => item.toJSON());
    return user_cash_back;
  }

  async approveSellerCashBack(options) {
    const {amount, status_type, job_id, seller_id, id, transaction_type} = options;
    await this.modals.cashback_wallet.update(
        JSON.parse(JSON.stringify(
            {status_type: status_type || 16, amount, transaction_type})),
        {where: JSON.parse(JSON.stringify({job_id, seller_id, id}))});
  }

  async approveUserCashBack(options) {
    const {amount, status_type, job_id, seller_id, id, transaction_type} = options;
    await this.modals.user_wallet.update(
        JSON.parse(JSON.stringify(
            {status_type: status_type || 16, amount, transaction_type})),
        {where: JSON.parse(JSON.stringify({job_id, seller_id, id}))});
  }

  async addUserCashBackRedeemed(options) {
    const {status_type, amount, transaction_type, user_id, is_paytm, paytm_detail} = options;
    return await this.modals.user_wallet.create(
        JSON.parse(JSON.stringify(
            {
              status_type: status_type || 14, is_paytm,
              amount, transaction_type, user_id, paytm_detail,
            })));
  }

  async addSellerCashBackRedeemed(options) {
    const {status_type, amount, transaction_type, seller_id, is_paytm, paytm_detail} = options;
    return await this.modals.seller_wallet.create(
        JSON.parse(JSON.stringify(
            {
              status_type: status_type || 14, is_paytm,
              amount, transaction_type, paytm_detail, seller_id,
            })));
  }

  async approveHomeDeliveryCashback(options) {
    const {status_type, job_id, seller_id} = options;
    await this.modals.seller_wallet.update(
        {status_type: status_type || 16}, {where: {job_id, seller_id}});
  }

  async addCashBackToSeller(options) {
    const {status_type, job_id, seller_id, amount, transaction_type, user_id, cashback_source} = options;
    console.log(JSON.stringify(options));
    let cash_back_details = await this.modals.seller_wallet.create(
        JSON.parse(JSON.stringify(
            {
              status_type: status_type || 16, job_id, cashback_source,
              amount, transaction_type, user_id, seller_id,
            })));

    cash_back_details = cash_back_details.toJSON();
    if (this.socketAdaptor) {
      await this.socketAdaptor.redeem_cash_back_at_seller(
          {user_id, seller_id, cash_back_details, amount});
    }

    return cash_back_details;
  }

  async addLoyaltyToSeller(options) {
    const {status_type, job_id, seller_id, amount, transaction_type, user_id, seller_user_id, user_name} = options;
    await this.modals.loyalty_wallet.create(
        JSON.parse(JSON.stringify(
            {
              status_type: status_type || 14,
              amount, transaction_type, user_id, seller_id,
            })));
    await this.notificationAdaptor.notifyUserCron({
      seller_user_id, payload: {
        title: `Loyalty Points have been redeemed by ${user_name}.`,user_id,
        notification_type: 4,
      },
    });
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
        attributes: ['id', 'online_order'],
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
    jobDetail.online_order = cashback_job_detail.online_order;
    jobDetail.copies = jobResult[2].map((item) => item.toJSON());
    return jobDetail;
  }

  async cashBackApproval(options, seller_name) {
    let {cash_back_month, cash_back_day, verified_seller, amount, digitally_verified, seller_id, home_delivered, job, user_limit_rules, user_default_limit_rules, online_order, seller_user_id, user_name} = options;
    const {user_id, id: job_id} = job;
    let monthly_limit = user_limit_rules.find(item => item.rule_type === 1),
        daily_limit = user_limit_rules.find(item => item.rule_type === 2);
    monthly_limit = monthly_limit ||
        user_default_limit_rules.find(item => item.rule_type === 1);
    daily_limit = daily_limit ||
        user_default_limit_rules.find(item => item.rule_type === 2);
    let home_delivery_limit = user_default_limit_rules.find(
        item => item.rule_type === 7);
    let total_amount = amount;
    total_amount = total_amount < 0 ? 0 : total_amount;
    if (digitally_verified) {
      await Promise.all([
        this.approveSellerCashBack(
            {job_id, amount: total_amount, status_type: 16, seller_id}),
        this.approveUserCashBack(
            {job_id, amount: total_amount, status_type: 16, seller_id}),
        this.updateCashBackJobs({
          id: job_id, seller_status: 16, seller_id,
          jobDetail: {seller_status: 16, seller_id},
        }),
        home_delivered ?
            this.approveHomeDeliveryCashback(
                {job_id, status_type: 16, seller_id}) :
            '']);

      await Promise.all([
        this.notificationAdaptor.notifyUserCron({
          user_id, payload: {
            title: `Hurray! You can redeem your Cashback ₹ ${total_amount} in your next order with Seller ${seller_name ||
            ''}!`,
            description: 'Please click here for more detail.',
            notification_type: 34,
          },
        }),
        home_delivered ?
            this.notificationAdaptor.notifyUserCron({
              seller_user_id, payload: {
                title: `Hurray! You have received Cashback on Home Delivery to ${user_name ||
                ''} in your BB Wallet!`,
                description: 'Please click here for more detail.',
                notification_type: 3,
              },
            }) :
            '']);
      return {approved_amount: total_amount, pending_seller_amount: 0};
    } else if (verified_seller) {
      if (cash_back_day + total_amount <= daily_limit.rule_limit) {
        if (cash_back_month + total_amount <= monthly_limit.rule_limit) {
          await Promise.all([
            this.approveSellerCashBack(
                {job_id, amount: total_amount, status_type: 16, seller_id}),
            this.approveUserCashBack(
                {job_id, amount: total_amount, status_type: 16, seller_id}),
            this.updateCashBackJobs({
              id: job_id, seller_status: 16, seller_id,
              jobDetail: {seller_status: 16, cashback_status: 16, seller_id},
            }),
            home_delivered ?
                this.approveHomeDeliveryCashback(
                    {job_id, status_type: 16, seller_id}) :
                '',
          ]);
          await Promise.all([
            this.notificationAdaptor.notifyUserCron({
              user_id, payload: {
                title: `Your Seller ${seller_name ||
                ''} has verified your transaction for Cashback Redemption.`,
                description: 'Please click here for more detail.',
                notification_type: 34,
              },
            }),
            home_delivered ?
                this.notificationAdaptor.notifyUserCron({
                  seller_user_id, payload: {
                    title: `Hurray! You have received Cashback on Home Delivery to ${user_name ||
                    ''} in your BB Wallet!`,
                    description: 'Please click here for more detail.',
                    notification_type: 3,
                  },
                }) :
                '']);
          return {approved_amount: total_amount};
        } else {
          total_amount = monthly_limit.rule_limit - cash_back_month;
          total_amount = total_amount < 0 ? 0 : total_amount;

          await Promise.all([
            this.approveSellerCashBack(
                {job_id, amount: total_amount, status_type: 16, seller_id}),
            this.approveUserCashBack(
                {job_id, amount: total_amount, status_type: 16, seller_id}),
            this.updateCashBackJobs({
              id: job_id, seller_status: 16, seller_id,
              jobDetail: {seller_status: 16, cashback_status: 16, seller_id},
            }),
            home_delivered ?
                this.approveHomeDeliveryCashback(
                    {job_id, status_type: 16, seller_id}) :
                '']);

          await Promise.all([
            this.notificationAdaptor.notifyUserCron({
              user_id, payload: {
                title: `Your Seller ${seller_name ||
                ''} has verified your transaction for Cashback Redemption.`,
                description: 'Please click here for more detail.',
                notification_type: 34,
              },
            }),
            home_delivered ?
                this.notificationAdaptor.notifyUserCron({
                  seller_user_id, payload: {
                    title: `Hurray! You have received Cashback on Home Delivery to ${user_name ||
                    ''} in your BB Wallet!`,
                    description: 'Please click here for more detail.',
                    notification_type: 3,
                  },
                }) :
                '']);
          return {approved_amount: total_amount};
        }
      } else {
        total_amount = daily_limit.rule_limit - cash_back_day;
        total_amount = total_amount < 0 ? 0 : total_amount;
        await Promise.all([
          this.approveSellerCashBack(
              {job_id, amount: total_amount, status_type: 16, seller_id}),
          this.approveUserCashBack(
              {job_id, amount: total_amount, status_type: 16, seller_id}),
          this.updateCashBackJobs({
            id: job_id, seller_status: 16, seller_id,
            jobDetail: {seller_status: 16, cashback_status: 16, seller_id},
          }),
          home_delivered ?
              this.approveHomeDeliveryCashback(
                  {job_id, status_type: 16, seller_id}) :
              '',
        ]);
        await Promise.all([
          this.notificationAdaptor.notifyUserCron({
            user_id, payload: {
              title: `Your Seller ${seller_name ||
              ''} has verified your transaction for Cashback Redemption.`,
              description: 'Please click here for more detail.',
              notification_type: 34,
            },
          }),
          home_delivered ?
              this.notificationAdaptor.notifyUserCron({
                seller_user_id, payload: {
                  title: `Hurray! You have received Cashback on Home Delivery to ${user_name ||
                  ''} in your BB Wallet!`,
                  description: 'Please click here for more detail.',
                  notification_type: 3,
                },
              }) : '']);

        return {approved_amount: total_amount};
      }
    }
  }

  async cashBackRedemption(options) {
    let {job_id, seller_cashback_id, user_cashback_id, seller_id, transaction_type, user_id, seller_cashback} = options;
    const total_amount = _.sumBy(seller_cashback, 'amount');
    const {seller_user_id, user_name} = (seller_cashback[0] || {});
    return await Promise.all([
      this.approveSellerCashBack(
          {
            job_id, id: seller_cashback_id,
            seller_id, status_type: 14, transaction_type,
          }), this.approveUserCashBack(
          {
            job_id, id: user_cashback_id, seller_id,
            status_type: 14, transaction_type,
          }), this.updateCashBackJobs(
          {
            id: job_id, seller_status: 14, cashback_status: 14, seller_id,
            jobDetail: {seller_status: 14, cashback_status: 14, seller_id},
          }), this.addCashBackToSeller(
          {
            status_type: 16, amount: total_amount, seller_id,
            user_id, transaction_type: 1, cashback_source: 2,
          }), this.notificationAdaptor.notifyUserCron({
        seller_user_id, payload: {
          title: `${user_name ||
          ''} has opted for cashback redemption & it has been credited to your BB Wallet.`,
          description: 'Please click here for more detail.',
          notification_type: 3,
        },
      })]);
  }

  async cashBackRedemptionAtPayTM(options) {
    let {seller_cashback_id, user_cashback_id, transaction_type, amount, user_id, mobile_no, email, job_id} = options;
    const order_id = `${Math.random().toString(36).
        substr(2, 9)}${(user_id).toString(36)}`;
    const pay_TM_response = JSON.parse(
        await this.payTMAdaptor.salesToUserCredit(
            {amount, order_id, mobile_no, email}));
    console.log(JSON.stringify(pay_TM_response));
    if (pay_TM_response && pay_TM_response.status !== 'SUCCESS' &&
        pay_TM_response.status !== 'PENDING' &&
        pay_TM_response.status.toLowerCase() !== 'init') {
      throw Error(config.PAYTM.ERROR[pay_TM_response.statusCode] ||
          'Unable to redeem amount on PayTM for now.');
    }

    const paytm_detail = {my_order_id: order_id, pay_TM_response};
    return await Promise.all([
      this.approveSellerCashBack(
          {job_id, status_type: 14, transaction_type}),
      this.updateCashBackJobs(
          {
            id: job_id, seller_status: 14, cashback_status: 14,
            jobDetail: {seller_status: 14, cashback_status: 14},
          }),
      this.addUserCashBackRedeemed({
        status_type: pay_TM_response.status !== 'PENDING' &&
        pay_TM_response.status.toLowerCase() !== 'init' ? 14 : 13,
        amount, transaction_type, user_id, is_paytm: true, paytm_detail,
      }),
    ]);
  }

  async sellerCashBackRedemptionAtPayTM(options) {
    let {seller_id, transaction_type, amount, user_id, mobile_no, email, job_id} = options;
    const order_id = `${Math.random().toString(36).
        substr(2, 9)}${(user_id).toString(36)}`;
    const pay_TM_response = JSON.parse(
        await this.payTMAdaptor.salesToUserCredit(
            {amount, order_id, mobile_no, email}));
    console.log(JSON.stringify(pay_TM_response));
    if (pay_TM_response && pay_TM_response.status !== 'SUCCESS' &&
        pay_TM_response.status !== 'PENDING' &&
        pay_TM_response.status.toLowerCase() !== 'init') {
      throw Error(config.PAYTM.ERROR[pay_TM_response.statusCode] ||
          'Unable to redeem amount on PayTM for now.');
    }

    const paytm_detail = {my_order_id: order_id, pay_TM_response};
    return await this.addSellerCashBackRedeemed({
      status_type: pay_TM_response.status !== 'PENDING' &&
      pay_TM_response.status.toLowerCase() !== 'init' ? 14 : 13,
      amount, transaction_type, seller_id, is_paytm: true, paytm_detail,
    });
  }
}

export default JobAdaptor;
