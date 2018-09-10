'use strict';
import notificationAdaptor from './notification';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import InsuranceAdaptor from './insurances';
import RepairAdaptor from './repairs';
import WarrantyAdaptor from './warranties';
import CalendarServiceAdaptor from './calendarServices';
import PUCAdaptor from './pucs';
import shared from '../../helpers/shared';
import NotificationAdaptor from '../Adaptors/notification';
import moment from 'moment';
import Promise from 'bluebird';
import {sendSMS} from '../../helpers/sms';
import _ from 'lodash';

class DashboardAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
    this.amcAdaptor = new AMCAdaptor(modals);
    this.insuranceAdaptor = new InsuranceAdaptor(modals);
    this.repairAdaptor = new RepairAdaptor(modals);
    this.warrantyAdaptor = new WarrantyAdaptor(modals);
    this.pucAdaptor = new PUCAdaptor(modals);
    this.calendarServiceAdaptor = new CalendarServiceAdaptor(modals);
    this.notificationAdaptor = new NotificationAdaptor(modals);
    this.date = moment.utc();
    this._ = _;
  }

  async retrieveSellerDashboard(options, request, seller_type_id) {
    try {
      const {seller_id} = options;
      let [total_transactions, credit_pending, loyalty_points, debit_loyalty_points, consumer_counts] = await Promise.all(
          [
            this.modals.products.aggregate('purchase_cost', 'sum',
                {where: {seller_id, status_type: [5, 11]}}),
            this.modals.credit_wallet.aggregate('*', 'count',
                {where: {seller_id, status_type: 16}}),
            this.modals.loyalty_wallet.aggregate('amount', 'sum',
                {where: {seller_id, transaction_type: 1}}),
            this.modals.loyalty_wallet.aggregate('amount', 'sum',
                {where: {seller_id, transaction_type: 2}}),
            this.modals.products.aggregate('user_id', 'count',
                {where: {seller_id, status_type: [5, 11]}, distinct: true})]);
      return {
        status: true,
        message: 'Dashboard restore Successful',
        total_transactions, seller_type_id,
        credit_pending,
        loyalty_points: (loyalty_points || 0) - (debit_loyalty_points || 0),
        consumer_counts,
        notification_count: 0,
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return ({
        status: false,
        message: 'Dashboard restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
        showDashboard: false,
      });
    }
  }

  async retrieveDashboardResult(user, request) {
    try {
      let [upcomingServices, recentSearches, notificationCount] = await Promise.all(
          [
            this.filterUpcomingService(user, request),
            this.retrieveRecentSearch(user),
            this.modals.mailBox.count(
                {where: {user_id: user.id || user.ID, status_id: 4}})]);
      return {
        status: true,
        message: 'Dashboard restore Successful',
        notificationCount,
        recentSearches: await Promise.try(() => recentSearches.map((item) => {
          const search = item.toJSON();
          return search.searchValue;
        }).slice(0, 5)),
        upcomingServices: await this.evaluateUpcomingServices(upcomingServices),
        forceUpdate: request.pre.forceUpdate,
      };
    } catch (err) {
      console.log(err);
      this.modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user.id || user.ID,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return ({
        status: false,
        message: 'Dashboard restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
        showDashboard: false,
      });
    }
  }

  async evaluateUpcomingServices(upcomingServices) {
    return await Promise.try(
        () => this._.orderBy(upcomingServices, ['expiryDate'], ['asc']));
  }

  async evaluateDashboardInsight(insightData) {
    const distinctInsight = [];
    insightData = insightData.map((item) => {
      const insightItem = item;
      const index = distinctInsight.findIndex(
          distinctItem => (moment.utc(distinctItem.purchaseDate,
              moment.ISO_8601).startOf('day').valueOf() ===
              moment.utc(insightItem.purchaseDate, moment.ISO_8601).
                  startOf('day').
                  valueOf()));

      if (index === -1) {
        distinctInsight.push(insightItem);
      } else {
        distinctInsight[index].value += insightItem.value;
      }

      return insightItem;
    });

    return distinctInsight &&
    distinctInsight.length > 0 ?
        {
          startDate: moment.utc().startOf('M'),
          endDate: moment.utc(),
          totalSpend: shared.sumProps(distinctInsight, 'value'),
          totalDays: moment.utc().
              endOf('d').
              diff(moment.utc().startOf('M'), 'days'),
          insightData: distinctInsight,
        } :
        {
          startDate: moment.utc().startOf('M'),
          endDate: moment.utc(),
          totalSpend: 0,
          totalDays: moment.utc().
              endOf('d').
              diff(moment.utc().startOf('M'), 'days'),
          insightData,
        };
  }

  async prepareDashboardResult(parameters) {
    let {isNewUser, user, token, request} = parameters;
    console.log(isNewUser);
    let user_id = user.id || user.ID;
    if (!isNewUser) {
      try {
        let [
          productCounts, /*calendarItemCounts, todoCounts, mealCounts,
          wearableCounts,*/ knowItemCounts] = await Promise.all([
          this.modals.products.count(
              {where: {user_id, status_type: [5, 11]}}),
          /*this.modals.user_calendar_item.count({where: {user_id}}),
          this.modals.todoUserMap.count({where: {user_id}}),
          this.modals.mealUserMap.count({where: {user_id}}),
          this.modals.wearables.count({where: {created_by: user_id}}),*/
          this.modals.know_user_likes.count({where: {user_id}})]);
        // calendarItemCounts = parseInt(calendarItemCounts);
        productCounts = parseInt(productCounts);
        return {
          status: true,
          message: !isNewUser ? 'Existing User' : 'New User',
          billCounts: productCounts,
          showDashboard: (productCounts && productCounts > 0),
          knowItemsLiked: !!(knowItemCounts && knowItemCounts > 0),
          isExistingUser: !isNewUser,
          hasProducts: true,
          authorization: token,
          userId: user_id,
          forceUpdate: request.pre.forceUpdate,
        };
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user_id} is as follow: \n \n ${err}`);

        this.modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return {
          status: false,
          authorization: token,
          message: 'Unable to Login User',
          showDashboard: false,
          err,
          forceUpdate: request.pre.forceUpdate,
        };
      }
    }

    if (user.email) {
      notificationAdaptor.sendMailOnDifferentSteps(
          'Welcome to BinBill',
          user.email, user, 1);
    }

    // welcome email
    this.notificationAdaptor.notifyUser({
      userId: user_id, payload: {
        title: 'Welcome to BinBill!',
        description: 'Hello User. Greetings from Rohit BinBill CEO. I welcome...',
        big_text: 'Hello User. Greetings from Rohit BinBill CEO. I welcome you to your eHome. We promise to constantly evolve and make managing your eHome ever efficient and smarter. As it is a new home, you may take some time to get accustomed to it. Your Home Manager and I would always welcome your suggestions to improve your eHome. Please reach me at - rohit@binbill.com or eHome@binbill.com',
      },
    });

    // welcome sms
    if (user.mobile_no) {
      const message = `${user.name ?
          `Hello ${user.name}` :
          'Hello'}, Glad to have you on board! Now track the entire life cycle of your products with easy access to bills & documents as well as receive timely warranty & insurance alerts - ALL in one place, at one time.
          Start Now : https://www.binbill.com/`;
      sendSMS(message, [user.mobile_no]);
    }

    return {
      status: true,
      message: 'New User',
      authorization: token,
      billCounts: 0,
      showDashboard: false,
      hasEazyDayItems: false,
      knowItemsLiked: false,
      hasProducts: true,
      isExistingUser: false,
      userId: user_id,
      forceUpdate: request.pre.forceUpdate,
    };
  }

  async filterUpcomingService(user, request) {
    return await Promise.try(async () => {
      const [
        amcList, insuranceList, warrantyList, pucList,
        productServiceScheduleList, productDetails, repairList] = await Promise.all(
          [
            this.amcAdaptor.retrieveAMCs({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              expiry_date: {
                $gte: moment.utc().startOf('days'),
                $lte: moment.utc().add(30, 'days').endOf('days'),
              },
            }),
            this.insuranceAdaptor.retrieveInsurances({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              expiry_date: {
                $gte: moment.utc().startOf('days'),
                $lte: moment.utc().add(30, 'days').endOf('days'),
              },
            }),
            this.warrantyAdaptor.retrieveWarranties({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              warranty_type: [1, 2],
              expiry_date: {
                $gte: moment.utc().startOf('days'),
                $lte: moment.utc().add(30, 'days').endOf('days'),
              },
            }),
            this.pucAdaptor.retrievePUCs({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              main_category_id: [3],
              expiry_date: {
                $gte: moment.utc().startOf('days'),
                $lte: moment.utc().add(30, 'days').endOf('days'),
              },
            }),
            this.productAdaptor.retrieveUpcomingProducts({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              main_category_id: [3],
              service_schedule_id: {
                $not: null,
              },
            }, request.language),
            this.productAdaptor.retrieveNotificationProducts({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              main_category_id: [6, 8],
            }),
            this.repairAdaptor.retrieveRepairs({
              user_id: user.id || user.ID,
              status_type: [5, 11],
              warranty_upto: {
                $ne: null,
              },
            })]);
      let amcs = amcList.map((item) => {
        const amc = item;
        if (moment.utc(amc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(amc.expiryDate, moment.ISO_8601).
              endOf('day');
          amc.dueDate = amc.expiryDate;
          amc.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          amc.productType = 4;
        }

        return amc;
      });

      let insurances = insuranceList.map((item) => {
        const insurance = item;
        if (moment.utc(insurance.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(insurance.expiryDate,
              moment.ISO_8601).endOf('day');
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          insurance.productType = 3;
        }
        return insurance;
      });

      let warranties = warrantyList.map((item) => {
        const warranty = item;
        if (moment.utc(warranty.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(warranty.expiryDate,
              moment.ISO_8601).endOf('day');
          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          warranty.productType = 2;
        }
        return warranty;
      });

      let repairWarranties = repairList.map((item) => {
        const warranty = item;
        if (moment.utc(warranty.warranty_upto, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(warranty.warranty_upto,
              moment.ISO_8601).endOf('day');
          warranty.dueDate = warranty.warranty_upto;
          warranty.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          warranty.productType = 7;
        }
        return warranty;
      });

      let pucProducts = pucList.map((item) => {
        const puc = item;
        if (moment.utc(puc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(puc.expiryDate, moment.ISO_8601).
              endOf('day');
          puc.dueDate = puc.expiryDate;
          puc.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          puc.productType = 5;
        }

        return puc;
      });

      let productServiceSchedule = productServiceScheduleList.filter(
          item => item.schedule).map((item) => {
        const scheduledProduct = item;
        const scheduledDate = scheduledProduct.schedule ?
            scheduledProduct.schedule.due_date :
            undefined;
        if (scheduledDate &&
            moment.utc(scheduledDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(scheduledDate,
              moment.ISO_8601).endOf('day');
          scheduledProduct.dueDate = dueDate_time;
          scheduledProduct.dueIn = dueDate_time.diff(moment.utc(),
              'days', true);
          scheduledProduct.productType = 6;
        }

        return scheduledProduct;
      });

      const metaData = productDetails[0];
      let productList = productDetails[1].map((productItem) => {
        productItem.productMetaData = metaData.filter(
            (item) => item.productId === productItem.id);
        productItem.productMetaData.forEach((metaItem) => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') &&
              metaData.name.toLowerCase().includes('date') &&
              metaData.value &&
              (moment.utc(metaData.value, moment.ISO_8601).isValid() ||
                  moment.utc(metaData.value, 'DD MMM YYYY').isValid())) {
            const dueDate_time = moment.utc(metaData.value,
                moment.ISO_8601).isValid() ? moment.utc(metaData.value,
                moment.ISO_8601) : moment.utc(metaData.value,
                'DD MMM YYYY');
            productItem.dueDate = dueDate_time;
            productItem.dueIn = dueDate_time.diff(moment.utc(), 'days',
                true);
          }
          productItem.address = '';
          if (metaData.name.toLowerCase().includes('address')) {
            productItem.address = metaData.value;
          }
          if (metaData.name.toLowerCase().includes('due amount')) {
            productItem.value = metaData.value;
          }
          productItem.expiryDate = productItem.dueDate;
        });

        productItem.productType = 1;
        return productItem;
      });

      return [
        ...productList, ...warranties,
        ...insurances, ...amcs, ...pucProducts,
        ...productServiceSchedule, ...repairWarranties].filter(
          item => item.dueIn !== undefined && item.dueIn !== null &&
              item.dueIn <= 30 && item.dueIn >= 0);
    });
  }

  async prepareInsightData(user, request) {
    const results = await Promise.all([
      this.productAdaptor.retrieveProducts({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      }, request.language),
      this.amcAdaptor.retrieveAMCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      }),
      this.insuranceAdaptor.retrieveInsurances({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      }),
      this.repairAdaptor.retrieveRepairs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      }),
      this.warrantyAdaptor.retrieveWarranties({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      }),
      this.pucAdaptor.retrievePUCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().startOf('M'),
        },
      })]);
    return [
      ...results[0], ...results[1], ...results[2],
      ...results[3], ...results[4], ...results[5]];
  }

  async retrieveRecentSearch(user) {
    return await this.modals.recentSearches.findAll({
      where: {
        user_id: user.id || user.ID,
        searchValue: {
          $not: null,
        },
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue'],
    });
  }
}

export default DashboardAdaptor;
