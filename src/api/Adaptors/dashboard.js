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
import NotificationAdaptor from '../Adaptors/notification';
import moment from 'moment';
import Promise from 'bluebird';

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
  }

  retrieveDashboardResult(user, request) {
    return Promise.try(() => Promise.all([
      this.filterUpcomingService(user, request),
      this.prepareInsightData(user, request),
      this.retrieveRecentSearch(user),
      this.modals.mailBox.count(
          {where: {user_id: user.id || user.ID, status_id: 4}}),
      this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: [5, 11],
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
      this.modals.todoUserMap.count({
        where: {
          user_id: user.id || user.ID,
        },
      }),
      this.modals.mealUserMap.count({
        where: {
          user_id: user.id || user.ID,
        },
      }),
      this.modals.wearables.count({
        where: {
          created_by: user.id || user.ID,
        },
      }),
      this.modals.know_user_likes.count({
        where: {
          created_by: user.id || user.ID,
        },
      }),
    ])).
        spread(
            (upcomingServices, insightData, recentSearches, notificationCount,
             productCount, product, calendarItemCount, latestCalendarItem,
             latestCalendarCalc, recent_calendar_item, service_center_products,
             know_item_count, todoCounts, mealCounts,
             wearableCounts, knowItemCounts) => {
              latestCalendarItem = latestCalendarItem
                  ? latestCalendarItem.toJSON()
                  : {};
              latestCalendarCalc = latestCalendarCalc
                  ? latestCalendarCalc.toJSON()
                  : {};
              const calendar_item_updated_at = latestCalendarItem &&
              moment(latestCalendarItem.updated_at, moment.ISO_8601).
                  diff(moment(latestCalendarCalc.updated_at, moment.ISO_8601),
                      'days') < 0 ?
                  latestCalendarCalc.updated_at : latestCalendarItem ?
                      latestCalendarItem.updated_at : moment();
              return {
                status: true,
                message: 'Dashboard restore Successful',
                notificationCount: notificationCount,
                recentSearches: recentSearches.map((item) => {
                  const search = item.toJSON();
                  return search.searchValue;
                }).slice(0, 5),
                upcomingServices: this.evaluateUpcomingServices(
                    upcomingServices),
                insight: this.evaluateDashboardInsight(insightData),
                forceUpdate: request.pre.forceUpdate,
                showDashboard: !!(productCount && parseInt(productCount) > 0) ||
                !!(calendarItemCount && parseInt(calendarItemCount) > 0),
                showEazyDay: !!(todoCounts && todoCounts > 0) ||
                !!(mealCounts && mealCounts > 0) ||
                !!(wearableCounts && wearableCounts > 0),
                showKnowItems: !!(knowItemCounts && knowItemCounts > 0),
                total_calendar_item: calendarItemCount || 0,
                calendar_item_updated_at,
                recent_calendar_item,
                recent_products: product.slice(0, 4),
                product: product[0],
                service_center_products,
                know_item_count,
              };
            }).
        catch(err => {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n \n ${err}`);

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
        });
  }

  evaluateUpcomingServices(upcomingServices) {
    upcomingServices = upcomingServices.map((elem) => {
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
    return upcomingServices;
  }

  evaluateDashboardInsight(insightData) {
    const distinctInsight = [];
    insightData = insightData.map((item) => {
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

  prepareDashboardResult(parameters) {
    let {isNewUser, user, token, request} = parameters;
    console.log(isNewUser);
    if (!isNewUser) {
      console.log('We are here', isNewUser);
      return Promise.all([
        this.modals.products.count({
          where: {
            user_id: user.id || user.ID,
            status_type: [5, 11],
          },
        }),
        this.modals.user_calendar_item.count({
          where: {
            user_id: user.id || user.ID,
          },
        }), this.modals.todoUserMap.count({
          where: {
            user_id: user.id || user.ID,
          },
        }), this.modals.mealUserMap.count({
          where: {
            user_id: user.id || user.ID,
          },
        }), this.modals.wearables.count({
          where: {
            created_by: user.id || user.ID,
          },
        }), this.modals.know_user_likes.count({
          where: {
            created_by: user.id || user.ID,
          },
        })]).
          spread((productCounts, calendarItemCounts, todoCounts, mealCounts,
                  wearableCounts, knowItemCounts) => {
            calendarItemCounts = parseInt(calendarItemCounts);
            productCounts = parseInt(productCounts);
            return {
              status: true,
              message: !isNewUser ? 'Existing User' : 'New User',
              billCounts: 0,
              showDashboard: !!(productCounts && productCounts > 0) ||
              !!(calendarItemCounts && calendarItemCounts > 0),
              showEazyDay: !!(todoCounts && todoCounts > 0) ||
              !!(mealCounts && mealCounts > 0) ||
              !!(wearableCounts && wearableCounts > 0),
              showKnowItems: !!(knowItemCounts && knowItemCounts > 0),
              isExistingUser: !isNewUser,
              authorization: token,
              userId: user.id || user.ID,
              forceUpdate: request.pre.forceUpdate,
            };
          }).
          catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);

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
          'Welcome to BinBill',
          user.email, user, 1);

      this.notificationAdaptor.notifyUser(user.id || user.ID,
          {
            title: 'Welcome to BinBill!',
            description: 'Hello User. Greetings from Rohit BinBill CEO. I welcome you to your eHome. We promise to constantly evolve and make managing your eHome ever efficient and smarter. As it is a new home, you may take some time to get accustomed to it. Your Home Manager and I would always welcome your suggestions to improve your eHome. Please reach me at - rohit@binbill.com or eHome@binbill.com',
          },
          reply);
    }
    return {
      status: true,
      message: 'New User',
      authorization: token,
      billCounts: 0,
      showDashboard: false,
      showEazyDay: false,
      showKnowItems: false,
      isExistingUser: false,
      userId: user.id || user.ID,
      forceUpdate: request.pre.forceUpdate,
    };
  }

  filterUpcomingService(user, request) {
    return Promise.try(() => Promise.all([
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
      })])).
        spread((amcList, insuranceList, warrantyList, pucList,
                productServiceScheduleList, productDetails, repairList) => {
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
          amcs = amcs.filter(
              item => (item.dueIn !== undefined && item.dueIn !== null) &&
                  item.dueIn <= 30 && item.dueIn >= 0);

          let insurances = insuranceList.map((item) => {
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

          let warranties = warrantyList.map((item) => {
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

          let repairWarranties = repairList.map((item) => {
            const warranty = item;
            if (moment.utc(warranty.warranty_upto, moment.ISO_8601).isValid()) {
              const dueDate_time = moment.utc(warranty.warranty_upto,
                  moment.ISO_8601).
                  endOf('day');
              warranty.dueDate = warranty.warranty_upto;
              warranty.dueIn = dueDate_time.diff(moment.utc(), 'days', true);
              warranty.productType = 7;
            }
            return warranty;
          });

          repairWarranties = repairWarranties.filter(
              item => (item.dueIn !== undefined && item.dueIn !== null) &&
                  item.dueIn <= 30 && item.dueIn >= 0);

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

          pucProducts = pucProducts.filter(
              item => ((item.dueIn !== undefined && item.dueIn !== null) &&
                  item.dueIn <= 30 && item.dueIn >= 0));

          let productServiceSchedule = productServiceScheduleList.filter(
              item => item.schedule).
              map((item) => {
                const scheduledProduct = item;
                const scheduledDate = scheduledProduct.schedule ?
                    scheduledProduct.schedule.due_date :
                    undefined;
                if (scheduledDate &&
                    moment.utc(scheduledDate, moment.ISO_8601).isValid()) {
                  const dueDate_time = moment.utc(scheduledDate,
                      moment.ISO_8601).
                      endOf('day');
                  scheduledProduct.dueDate = dueDate_time;
                  scheduledProduct.dueIn = dueDate_time.diff(moment.utc(),
                      'days',
                      true);
                  scheduledProduct.productType = 6;
                }

                return scheduledProduct;
              });

          productServiceSchedule = productServiceSchedule.filter(
              item => ((item.dueIn !== undefined && item.dueIn !== null) &&
                  item.dueIn <= 7 && item.dueIn >= 0));
          const metaData = productDetails[0];
          let productList = productDetails[1].map((productItem) => {
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
                const dueDate_time = moment.utc(metaData.value,
                    moment.ISO_8601).
                    isValid() ? moment.utc(metaData.value,
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
            ...productServiceSchedule,
            ...repairWarranties];
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
        then((results) => Promise.all([
          ...results[0],
          ...results[1],
          ...results[2],
          ...results[3],
          ...results[4],
          ...results[5]]));
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
