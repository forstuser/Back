/*jshint esversion: 6 */
'use strict';
import notificationAdaptor from './notification';
import ProductAdaptor from './product';
import AMCAdaptor from './amcs';
import InsuranceAdaptor from './insurances';
import RepairAdaptor from './repairs';
import WarrantyAdaptor from './warranties';
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
          main_category_id: [2, 3],
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
            distinctItem => (moment(distinctItem.purchaseDate, moment.ISO_8601).
                    startOf('day').
                    valueOf() ===
                moment(insightItem.purchaseDate, moment.ISO_8601).
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
        product: !!(result[4] && parseInt(result[4]) > 0) ? product : {},
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

  prepareDashboardResult(isNewUser, user, token, request) {
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
        }), this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: 11,
            main_category_id: [2, 3],
          },
        })]).then((result) => {
        const billCounts = parseInt(result[0]);
        const productCounts = parseInt(result[1]);
        if (billCounts) {
          return {
            status: true,
            message: 'User Exist',
            billCounts,
            hasProducts: !!(productCounts && productCounts > 0),
            showDashboard: !!(billCounts && billCounts > 0) ||
            !!(productCounts && productCounts > 1),
            isExistingUser: !isNewUser,
            authorization: token,
            userId: user.id || user.ID,
            forceUpdate: request.pre.forceUpdate,
          };
        }

        return {
          status: true,
          message: 'Existing User',
          authorization: token,
          hasProducts: !!(productCounts && productCounts > 0),
          billCounts: 0,
          showDashboard: false,
          isExistingUser: !isNewUser,
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

    notificationAdaptor.sendMailOnDifferentSteps('Welcome to BinBill!',
        user.email, user, 1);
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
      this.productAdaptor.retrieveProducts({
        user_id: user.id || user.ID,
        status_type: 5,
        main_category_id: [6, 8],
      }),
      this.amcAdaptor.retrieveAMCs({
        user_id: user.id || user.ID,
        status_type: 5,
      }),
      this.insuranceAdaptor.retrieveInsurances({
        user_id: user.id || user.ID,
        status_type: 5,
      }),
      this.warrantyAdaptor.retrieveWarranties({
        user_id: user.id || user.ID,
        status_type: 5,
      })]).then((result) => {
      let products = result[0].map((item) => {
        const product = item;

        product.productMetaData.map((metaItem) => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') &&
              metaData.name.toLowerCase().includes('date') &&
              metaData.value &&
              moment(metaData.value, moment.ISO_8601).isValid()) {
            const dueDateTime = moment(metaData.value, moment.ISO_8601);
            product.dueDate = metaData.value;
            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
          }

          if (metaData.name.toLowerCase().includes('address')) {
            product.address = metaData.value;
          }

          return metaData;
        });

        product.productType = 1;
        return product;
      });

      products = products.filter(
          item => ((item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <=
              30 && item.dueIn >= 0));

      let amcs = result[1].map((item) => {
        const amc = item;
        if (moment(amc.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment(amc.expiryDate, moment.ISO_8601);
          amc.dueDate = amc.expiryDate;
          amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
          amc.productType = 4;
        }

        return amc;
      });
      amcs = amcs.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let insurances = result[2].map((item) => {
        const insurance = item;
        if (moment(insurance.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment(insurance.expiryDate, moment.ISO_8601);
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
          insurance.productType = 3;
        }
        return insurance;
      });

      insurances = insurances.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      let warranties = result[3].map((item) => {
        const warranty = item;
        if (moment(warranty.expiryDate, moment.ISO_8601).isValid()) {
          const dueDateTime = moment(warranty.expiryDate, moment.ISO_8601);
          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
          warranty.productType = 2;
        }
        return warranty;
      });

      warranties = warranties.filter(
          item => (item.dueIn !== undefined && item.dueIn !== null) &&
              item.dueIn <= 30 && item.dueIn >= 0);

      return [...products, ...warranties, ...insurances, ...amcs];
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
      })]).
        then((results) => [
          ...results[0],
          ...results[1],
          ...results[2],
          ...results[3],
          ...results[4]]);
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
