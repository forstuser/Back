/*jshint esversion: 6 */
'use strict';
import notificationAdaptor from './notification';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import InsuranceAdaptor from './insurances';
import RepairAdaptor from './repairs';
import WarrantyAdaptor from './warranties';
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
    this.date = moment.utc();
  }

  retrieveDashboardResult(user, request) {
    return Promise.all([
      this.filterUpcomingService(user),
      this.prepareInsightData(user),
      this.retrieveRecentSearch(user),
      this.modals.mailBox.count(
          {where: {user_id: user.id || user.ID, status_id: 4}}),
      this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: [5, 8],
          main_category_id: {
            $notIn: [9, 10],
          },
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
          main_category_id: [1, 2, 3],
        },
      }),
      this.productAdaptor.retrieveUsersLastProduct({
        user_id: user.id || user.ID,
        status_type: [5, 8, 11],
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
      const insightItems = shared.retrieveDaysInsight(distinctInsight);

      const insightResult = insightItems && insightItems.length > 0 ? {
        startDate: moment.utc().subtract(6, 'd').startOf('d'),
        endDate: moment.utc(),
        totalSpend: shared.sumProps(insightItems, 'value'),
        totalDays: 7,
        insightData: insightItems,
      } : {
        startDate: moment.utc().subtract(6, 'd').startOf('d'),
        endDate: moment.utc(),
        totalSpend: 0,
        totalDays: 7,
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
        !!(result[5] && parseInt(result[5]) > 1),
        hasProducts: !!(result[5] && parseInt(result[5]) > 0),
        product,
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
            main_category_id: {
              $notIn: [9, 10],
            },
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
            main_category_id: [1, 2, 3],
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
          !!(productCounts && productCounts > 1),
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

    if (user.email) {
      notificationAdaptor.sendMailOnDifferentSteps('Welcome to BinBill!',
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

  filterUpcomingService(user) {
    return Promise.all([
      this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.pucAdaptor.retrievePUCs({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        expiry_date: {
          $gte: moment.utc().startOf('days'),
          $lte: moment.utc().endOf('months'),
        },
      }),
      this.productAdaptor.retrieveUpcomingProducts({
        user_id: user.id || user.ID,
        status_type: [5, 11],
        main_category_id: [3],
        service_schedule_id: {
          $not: null,
        },
      }),
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
          amc.dueIn = dueDate_time.diff(moment.utc(), 'days');
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
          insurance.dueIn = dueDate_time.diff(moment.utc(), 'days');
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
          warranty.dueIn = dueDate_time.diff(moment.utc(), 'days');
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
          puc.dueIn = dueDate_time.diff(moment.utc(), 'days');
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
              scheduledProduct.dueIn = dueDate_time.diff(moment.utc(), 'days');
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
            productItem.dueIn = dueDate_time.diff(moment.utc(), 'days');
          }
          productItem.address = '';
          if (metaData.name.toLowerCase().includes('address')) {
            productItem.address = metaData.value;
          }
        });

        productItem.productType = 1;
        return productItem;
      });
      console.log(`\n\n\n\n\n\n\n${JSON.stringify(productList)}`);

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

  prepareInsightData(user) {
    return Promise.all([
      this.productAdaptor.retrieveProducts({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
        },
      }),
      this.amcAdaptor.retrieveAMCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
        },
      }),
      this.insuranceAdaptor.retrieveInsurances({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
        },
      }),
      this.repairAdaptor.retrieveRepairs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
        },
      }),
      this.warrantyAdaptor.retrieveWarranties({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
        },
      }),
      this.pucAdaptor.retrievePUCs({
        status_type: [5, 11],
        user_id: user.id || user.ID,
        document_date: {
          $lte: moment.utc(),
          $gte: moment.utc().subtract(6, 'd').startOf('d'),
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
