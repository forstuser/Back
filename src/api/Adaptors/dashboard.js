/*jshint esversion: 6 */
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
import moment from 'moment';

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
    this.date = moment.utc();
  }

  retrieveDashboardResult(user, request) {
    return Promise.all([
      this.filterUpcomingService(user, request),
      this.prepareInsightData(user, request),
      this.retrieveRecentSearch(user),
      this.modals.mailBox.count(
          {where: {user_id: user.id || user.ID, status_id: 4}}),
      this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: [5, 8],
        },
        include: [
          {
            model: this.modals.bills,
            where: {
              status_type: 5,
            },
            required: true,
          }],
      }),
      this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: 11,
        },
      }),
      this.productAdaptor.retrieveUsersLastProduct({
        user_id: user.id || user.ID,
        status_type: [5, 11],
      }, request.language),
      this.modals.user_calendar_item.count({
        where: {
          user_id: user.id || user.ID,
        },
      }),
      this.modals.user_calendar_item.findOne({
        where: {
          user_id: user.id || user.ID,
        },
        order: [['updated_at', 'desc']],
      }),
      this.modals.service_calculation.findOne({
        where: {
          updated_by: user.id || user.ID,
        },
        order: [['updated_at', 'desc']],
      }),
      this.calendarServiceAdaptor.retrieveCalendarItemList(
          {user_id: user.id || user.ID}, request.language, 4),
      this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          main_category_id: [2, 3],
          status_type: [5, 11],
        },
      }),
      this.modals.knowItems.count({
        where: {
          id: {$gt: request.query.lastfact || 0},
        },
      }),
    ]).then((result) => {
      const upcomingServices = result[0].map((elem) => {
        if (elem.productType === 1) {
          const dueAmountArr = elem.productMetaData.filter((e) => {
            return e.name.toLowerCase() === 'due amount';
          });

          if (dueAmountArr.length > 0) {
            elem.value = dueAmountArr[0].value;
          }
        }

        return elem;
      });

      const distinctInsight = [];
      const insightData = result[1].map((item) => {
        const insightItem = item;
        const index = distinctInsight.findIndex(
            distinctItem => (moment.utc(distinctItem.purchaseDate,
                moment.ISO_8601).
                    startOf('day').
                    valueOf() ===
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

      const insightResult = distinctInsight && distinctInsight.length > 0 ? {
        startDate: moment.utc().startOf('M'),
        endDate: moment.utc(),
        totalSpend: shared.sumProps(distinctInsight, 'value'),
        totalDays: moment.utc().
            endOf('d').
            diff(moment.utc().startOf('M'), 'days'),
        insightData: distinctInsight,
      } : {
        startDate: moment.utc().startOf('M'),
        endDate: moment.utc(),
        totalSpend: 0,
        totalDays: moment.utc().
            endOf('d').
            diff(moment.utc().startOf('M'), 'days'),
        insightData,
      };

      upcomingServices.sort((a, b) => {
        let aDate;
        let bDate;

        aDate = a.expiryDate;
        bDate = b.expiryDate;

        if (a.productType === 1) {
          aDate = a.dueDate;
        }

        if (b.productType === 1) {
          bDate = b.dueDate;
        }

        if (moment.utc(aDate, 'YYYY-MM-DD').
                isBefore(moment.utc(bDate, 'YYYY-MM-DD'))) {
          return -1;
        }

        return 1;
      });
      let product = result[6];
      const latestCalendarItem = result[8] ? result[8].toJSON() : {};
      const latestCalendarCalc = result[9] ? result[9].toJSON() : {};
      const calendar_item_updated_at = latestCalendarItem &&
      moment(latestCalendarItem.updated_at, moment.ISO_8601).
          diff(moment(latestCalendarCalc.updated_at, moment.ISO_8601),
              'days') < 0 ?
          latestCalendarCalc.updated_at : latestCalendarItem ?
              latestCalendarItem.updated_at : moment();
      return {
        status: true,
        message: 'Dashboard restore Successful',
        notificationCount: result[3],
        recentSearches: result[2].map((item) => {
          const search = item.toJSON();
          return search.searchValue;
        }).slice(0, 5),
        upcomingServices: upcomingServices,
        insight: insightResult,
        forceUpdate: request.pre.forceUpdate,
        showDashboard: !!(result[4] && parseInt(result[4]) > 0) ||
        !!(result[5] && parseInt(result[5]) > 0),
        hasProducts: !!(result[5] && parseInt(result[5]) > 0),
        total_calendar_item: result[7] || 0,
        calendar_item_updated_at,
        recent_calendar_item: result[10],
        recent_products: product.slice(0, 4),
        product: product[0],
        service_center_products: result[11],
        know_item_count: result[12],
      };
    }).catch(err => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return ({
        status: false,
        message: 'Dashboard restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
        showDashboard: false,
      });
    });
  }

  prepareDashboardResult(parameters) {
    let {isNewUser, user, token, request} = parameters;
    if (!isNewUser) {
      return Promise.all([
        this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: [5, 8, 11],
          },
          include: [
            {
              model: this.modals.bills,
              where: {
                status_type: 5,
              },
              required: true,
            }],
        }),
        this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: 11,
          },
        })]).then((result) => {
        const billCounts = parseInt(result[0]);
        const productCounts = parseInt(result[1]);
        return {
          status: true,
          message: !isNewUser ? 'Existing User' : 'New User',
          billCounts,
          hasProducts: !!(productCounts && productCounts > 0),
          showDashboard: !!(billCounts && billCounts > 0) ||
          !!(productCounts && productCounts > 0),
          isExistingUser: !isNewUser,
          authorization: token,
          userId: user.id || user.ID,
          forceUpdate: request.pre.forceUpdate,
        };
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return {
          status: false,
          authorization: token,
          message: 'Unable to Login User',
          showDashboard: false,
          err,
          forceUpdate: request.pre.forceUpdate,
        };
      });
    }

    if (user.email && !user.email_verified) {
      notificationAdaptor.sendMailOnDifferentSteps(
          'Welcome to BinBill - Your eHome',
          user.email, user, 1);
    }

    return {
      status: true,
      message: 'New User',
      authorization: token,
      billCounts: 0,
      showDashboard: false,
      isExistingUser: false,
      userId: user.id || user.ID,
      forceUpdate: request.pre.forceUpdate,
    };
  }

  filterUpcomingService(user, request) {
    return Promise.all([
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
      })]).then((result) => {
      let amcs = result[0].map((item) => {
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
      amcs = amcs.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let insurances = result[1].map((item) => {
        const insurance = item;
        if (moment.utc(insurance.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(insurance.expiryDate,
              moment.ISO_8601).
              endOf('day');
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          insurance.productType = 3;
        }
        return insurance;
      });

      insurances = insurances.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let warranties = result[2].map((item) => {
        const warranty = item;
        if (moment.utc(warranty.expiryDate, moment.ISO_8601).isValid()) {
          const dueDate_time = moment.utc(warranty.expiryDate,
              moment.ISO_8601).
              endOf('day');
          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          warranty.productType = 2;
        }
        return warranty;
      });

      warranties = warranties.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let pucProducts = result[3].map((item) => {
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

      pucProducts = pucProducts.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0));

      let productServiceSchedule = result[4].filter(item => item.schedule).
          map((item) => {
            const scheduledProduct = item;
            const scheduledDate = scheduledProduct.schedule ?
                scheduledProduct.schedule.due_date :
                undefined;
            if (scheduledDate &&
                moment.utc(scheduledDate, moment.ISO_8601).isValid()) {
              const dueDate_time = moment.utc(scheduledDate, moment.ISO_8601).
                  endOf('day');
              scheduledProduct.dueDate = dueDate_time;
              scheduledProduct.dueIn = dueDate_time.diff(moment.utc(), 'days',
                  true);
              scheduledProduct.productType = 6;
            }

            return scheduledProduct;
          });

      productServiceSchedule = productServiceSchedule.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 7 && item.dueIn >= 0));
      const metaData = result[5][0];
      let productList = result[5][1].map((productItem) => {
        productItem.productMetaData = metaData.filter(
            (item) => item.productId === productItem.id);

        return productItem;
      });

      productList = productList.map((item) => {
        const productItem = item;
        productItem.productMetaData.forEach((metaItem) => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') &&
              metaData.name.toLowerCase().includes('date') &&
              metaData.value &&
              (moment.utc(metaData.value, moment.ISO_8601).isValid() ||
                  moment.utc(metaData.value, 'DD MMM YYYY').isValid())) {
            const dueDate_time = moment.utc(metaData.value, moment.ISO_8601).
                isValid() ? moment.utc(metaData.value,
                moment.ISO_8601) : moment.utc(metaData.value, 'DD MMM YYYY');
            productItem.dueDate = dueDate_time;
            productItem.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
          }
          productItem.address = '';
          if (metaData.name.toLowerCase().includes('address')) {
            productItem.address = metaData.value;
          }
        });

        productItem.productType = 1;
        return productItem;
      });

      productList = productList.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <=
              30 && item.dueIn >= 0));

      return [
        ...productList,
        ...warranties,
        ...insurances,
        ...amcs,
        ...pucProducts,
        ...productServiceSchedule];
    });
  }

  prepareInsightData(user, request) {
    return Promise.all([
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
      })]).
        then((results) => [
          ...results[0],
          ...results[1],
          ...results[2],
          ...results[3],
          ...results[4],
          ...results[5]]);
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.id || user.ID,
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue'],
    });
  }
}

export default DashboardAdaptor;
