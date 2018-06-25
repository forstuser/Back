'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _notification = require('./notification');

var _notification2 = _interopRequireDefault(_notification);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _calendarServices = require('./calendarServices');

var _calendarServices2 = _interopRequireDefault(_calendarServices);

var _pucs = require('./pucs');

var _pucs2 = _interopRequireDefault(_pucs);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _notification3 = require('../Adaptors/notification');

var _notification4 = _interopRequireDefault(_notification3);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sms = require('../../helpers/sms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DashboardAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.pucAdaptor = new _pucs2.default(modals);
    this.calendarServiceAdaptor = new _calendarServices2.default(modals);
    this.notificationAdaptor = new _notification4.default(modals);
    this.date = _moment2.default.utc();
  }

  retrieveDashboardResult(user, request) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.filterUpcomingService(user, request),
    // this.prepareInsightData(user, request),
    this.retrieveRecentSearch(user), this.modals.mailBox.count({ where: { user_id: user.id || user.ID, status_id: 4 } }), this.modals.products.count({
      where: {
        user_id: user.id || user.ID,
        status_type: [5, 11]
      }
    }),
    /* this.productAdaptor.retrieveUsersLastProduct({
       user_id: user.id || user.ID,
       status_type: [5, 11],
     }, request.language),*/
    this.modals.user_calendar_item.count({
      where: {
        user_id: user.id || user.ID
      }
    }),
    /*this.modals.user_calendar_item.findOne({
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
        {user_id: user.id || user.ID}, request.language, 4),*/
    this.modals.products.count({
      where: {
        user_id: user.id || user.ID,
        main_category_id: [2, 3],
        status_type: [5, 11]
      }
    }), this.modals.knowItems.count({
      where: {
        id: { $gt: request.query.lastfact || 0 }
      }
    }), this.modals.todoUserMap.count({
      where: {
        user_id: user.id || user.ID
      }
    }), this.modals.mealUserMap.count({
      where: {
        user_id: user.id || user.ID
      }
    }), this.modals.wearables.count({
      where: {
        created_by: user.id || user.ID
      }
    }), this.modals.know_user_likes.count({
      where: {
        user_id: user.id || user.ID
      }
    })])).spread(parameters => {
      let {
        upcomingServices, recentSearches, notificationCount, productCount,
        /*product,*/calendarItemCount, /*latestCalendarItem, latestCalendarCalc,
                                       recent_calendar_item,*/service_center_products, know_item_count, todoCounts,
        mealCounts, wearableCounts, knowItemCounts
      } = parameters;
      /*latestCalendarItem = latestCalendarItem ?
          latestCalendarItem.toJSON() :
          {};
      latestCalendarCalc = latestCalendarCalc ?
          latestCalendarCalc.toJSON() :
          {};
      const calendar_item_updated_at = latestCalendarItem &&
      moment(latestCalendarItem.updated_at, moment.ISO_8601).
          diff(moment(latestCalendarCalc.updated_at, moment.ISO_8601),
              'days') < 0 ?
          latestCalendarCalc.updated_at : latestCalendarItem ?
              latestCalendarItem.updated_at : moment();*/
      return {
        status: true,
        message: 'Dashboard restore Successful',
        notificationCount: notificationCount,
        recentSearches: recentSearches.map(item => {
          const search = item.toJSON();
          return search.searchValue;
        }).slice(0, 5),
        upcomingServices: this.evaluateUpcomingServices(upcomingServices),
        // insight: this.evaluateDashboardInsight(insightData),
        forceUpdate: request.pre.forceUpdate,
        showDashboard: !!(productCount && parseInt(productCount) > 0) || !!(calendarItemCount && parseInt(calendarItemCount) > 0),
        hasEazyDayItems: !!(todoCounts && todoCounts > 0) || !!(mealCounts && mealCounts > 0) || !!(wearableCounts && wearableCounts > 0),
        knowItemsLiked: !!(knowItemCounts && knowItemCounts > 0),
        total_calendar_item: calendarItemCount || 0,
        /*calendar_item_updated_at,
        recent_calendar_item,*/
        /*recent_products: product.slice(0, 4),
        product: product[0],*/
        service_center_products,
        know_item_count,
        hasProducts: true
      };
    }).catch(err => {

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
          err
        })
      }).catch(ex => console.log('error while logging on db,', ex));
      return {
        status: false,
        message: 'Dashboard restore failed',
        err,
        forceUpdate: request.pre.forceUpdate,
        showDashboard: false
      };
    });
  }

  evaluateUpcomingServices(upcomingServices) {
    upcomingServices = upcomingServices.map(elem => {
      if (elem.productType === 1) {
        const dueAmountArr = elem.productMetaData.filter(e => {
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

      if (_moment2.default.utc(aDate, 'YYYY-MM-DD').isBefore(_moment2.default.utc(bDate, 'YYYY-MM-DD'))) {
        return -1;
      }

      return 1;
    });
    return upcomingServices;
  }

  evaluateDashboardInsight(insightData) {
    const distinctInsight = [];
    insightData = insightData.map(item => {
      const insightItem = item;
      const index = distinctInsight.findIndex(distinctItem => _moment2.default.utc(distinctItem.purchaseDate, _moment2.default.ISO_8601).startOf('day').valueOf() === _moment2.default.utc(insightItem.purchaseDate, _moment2.default.ISO_8601).startOf('day').valueOf());

      if (index === -1) {
        distinctInsight.push(insightItem);
      } else {
        distinctInsight[index].value += insightItem.value;
      }

      return insightItem;
    });

    return distinctInsight && distinctInsight.length > 0 ? {
      startDate: _moment2.default.utc().startOf('M'),
      endDate: _moment2.default.utc(),
      totalSpend: _shared2.default.sumProps(distinctInsight, 'value'),
      totalDays: _moment2.default.utc().endOf('d').diff(_moment2.default.utc().startOf('M'), 'days'),
      insightData: distinctInsight
    } : {
      startDate: _moment2.default.utc().startOf('M'),
      endDate: _moment2.default.utc(),
      totalSpend: 0,
      totalDays: _moment2.default.utc().endOf('d').diff(_moment2.default.utc().startOf('M'), 'days'),
      insightData
    };
  }

  prepareDashboardResult(parameters) {
    let { isNewUser, user, token, request } = parameters;
    console.log(isNewUser);
    if (!isNewUser) {
      return _bluebird2.default.all([this.modals.products.count({
        where: {
          user_id: user.id || user.ID,
          status_type: [5, 11]
        }
      }), this.modals.user_calendar_item.count({
        where: {
          user_id: user.id || user.ID
        }
      }), this.modals.todoUserMap.count({
        where: {
          user_id: user.id || user.ID
        }
      }), this.modals.mealUserMap.count({
        where: {
          user_id: user.id || user.ID
        }
      }), this.modals.wearables.count({
        where: {
          created_by: user.id || user.ID
        }
      }), this.modals.know_user_likes.count({
        where: {
          user_id: user.id || user.ID
        }
      })]).spread((productCounts, calendarItemCounts, todoCounts, mealCounts, wearableCounts, knowItemCounts) => {
        calendarItemCounts = parseInt(calendarItemCounts);
        productCounts = parseInt(productCounts);
        return {
          status: true,
          message: !isNewUser ? 'Existing User' : 'New User',
          billCounts: productCounts,
          showDashboard: !!(productCounts && productCounts > 0) || !!(calendarItemCounts && calendarItemCounts > 0),
          hasEazyDayItems: !!(todoCounts && todoCounts > 0) || !!(mealCounts && mealCounts > 0) || !!(wearableCounts && wearableCounts > 0),
          knowItemsLiked: !!(knowItemCounts && knowItemCounts > 0),
          isExistingUser: !isNewUser,
          hasProducts: true,
          authorization: token,
          userId: user.id || user.ID,
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);

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
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return {
          status: false,
          authorization: token,
          message: 'Unable to Login User',
          showDashboard: false,
          err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }

    if (user.email) {
      _notification2.default.sendMailOnDifferentSteps('Welcome to BinBill', user.email, user, 1);
    }

    // welcome email
    this.notificationAdaptor.notifyUser(user.id || user.ID, {
      title: 'Welcome to BinBill!',
      description: 'Hello User. Greetings from Rohit BinBill CEO. I welcome...',
      big_text: 'Hello User. Greetings from Rohit BinBill CEO. I welcome you to your eHome. We promise to constantly evolve and make managing your eHome ever efficient and smarter. As it is a new home, you may take some time to get accustomed to it. Your Home Manager and I would always welcome your suggestions to improve your eHome. Please reach me at - rohit@binbill.com or eHome@binbill.com'
    });

    // welcome sms
    if (user.mobile_no) {
      const message = `${user.name ? `Hello ${user.name}` : 'Hello'}, Glad to have you on board! Now track the entire life cycle of your products with easy access to bills & documents as well as receive timely warranty & insurance alerts - ALL in one place, at one time.
          Start Now : https://www.binbill.com/`;
      (0, _sms.sendSMS)(message, [user.mobile_no]);
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
      userId: user.id || user.ID,
      forceUpdate: request.pre.forceUpdate
    };
  }

  filterUpcomingService(user, request) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.amcAdaptor.retrieveAMCs({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      expiry_date: {
        $gte: _moment2.default.utc().startOf('days'),
        $lte: _moment2.default.utc().add(30, 'days').endOf('days')
      }
    }), this.insuranceAdaptor.retrieveInsurances({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      expiry_date: {
        $gte: _moment2.default.utc().startOf('days'),
        $lte: _moment2.default.utc().add(30, 'days').endOf('days')
      }
    }), this.warrantyAdaptor.retrieveWarranties({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      warranty_type: [1, 2],
      expiry_date: {
        $gte: _moment2.default.utc().startOf('days'),
        $lte: _moment2.default.utc().add(30, 'days').endOf('days')
      }
    }), this.pucAdaptor.retrievePUCs({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      main_category_id: [3],
      expiry_date: {
        $gte: _moment2.default.utc().startOf('days'),
        $lte: _moment2.default.utc().add(30, 'days').endOf('days')
      }
    }), this.productAdaptor.retrieveUpcomingProducts({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      main_category_id: [3],
      service_schedule_id: {
        $not: null
      }
    }, request.language), this.productAdaptor.retrieveNotificationProducts({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      main_category_id: [6, 8]
    }), this.repairAdaptor.retrieveRepairs({
      user_id: user.id || user.ID,
      status_type: [5, 11],
      warranty_upto: {
        $ne: null
      }
    })])).spread((amcList, insuranceList, warrantyList, pucList, productServiceScheduleList, productDetails, repairList) => {
      let amcs = amcList.map(item => {
        const amc = item;
        if (_moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(amc.expiryDate, _moment2.default.ISO_8601).endOf('day');
          amc.dueDate = amc.expiryDate;
          amc.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          amc.productType = 4;
        }

        return amc;
      });
      amcs = amcs.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      let insurances = insuranceList.map(item => {
        const insurance = item;
        if (_moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(insurance.expiryDate, _moment2.default.ISO_8601).endOf('day');
          insurance.dueDate = insurance.expiryDate;
          insurance.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          insurance.productType = 3;
        }
        return insurance;
      });

      insurances = insurances.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      let warranties = warrantyList.map(item => {
        const warranty = item;
        if (_moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(warranty.expiryDate, _moment2.default.ISO_8601).endOf('day');
          warranty.dueDate = warranty.expiryDate;
          warranty.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          warranty.productType = 2;
        }
        return warranty;
      });

      warranties = warranties.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      let repairWarranties = repairList.map(item => {
        const warranty = item;
        if (_moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(warranty.warranty_upto, _moment2.default.ISO_8601).endOf('day');
          warranty.dueDate = warranty.warranty_upto;
          warranty.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          warranty.productType = 7;
        }
        return warranty;
      });

      repairWarranties = repairWarranties.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      let pucProducts = pucList.map(item => {
        const puc = item;
        if (_moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(puc.expiryDate, _moment2.default.ISO_8601).endOf('day');
          puc.dueDate = puc.expiryDate;
          puc.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          puc.productType = 5;
        }

        return puc;
      });

      pucProducts = pucProducts.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      let productServiceSchedule = productServiceScheduleList.filter(item => item.schedule).map(item => {
        const scheduledProduct = item;
        const scheduledDate = scheduledProduct.schedule ? scheduledProduct.schedule.due_date : undefined;
        if (scheduledDate && _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).isValid()) {
          const dueDate_time = _moment2.default.utc(scheduledDate, _moment2.default.ISO_8601).endOf('day');
          scheduledProduct.dueDate = dueDate_time;
          scheduledProduct.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          scheduledProduct.productType = 6;
        }

        return scheduledProduct;
      });

      productServiceSchedule = productServiceSchedule.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 7 && item.dueIn >= 0);
      const metaData = productDetails[0];
      let productList = productDetails[1].map(productItem => {
        productItem.productMetaData = metaData.filter(item => item.productId === productItem.id);

        return productItem;
      });

      productList = productList.map(item => {
        const productItem = item;
        productItem.productMetaData.forEach(metaItem => {
          const metaData = metaItem;
          if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && metaData.value && (_moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() || _moment2.default.utc(metaData.value, 'DD MMM YYYY').isValid())) {
            const dueDate_time = _moment2.default.utc(metaData.value, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(metaData.value, _moment2.default.ISO_8601) : _moment2.default.utc(metaData.value, 'DD MMM YYYY');
            productItem.dueDate = dueDate_time;
            productItem.dueIn = dueDate_time.diff(_moment2.default.utc(), 'days', true);
          }
          productItem.address = '';
          if (metaData.name.toLowerCase().includes('address')) {
            productItem.address = metaData.value;
          }
        });

        productItem.productType = 1;
        return productItem;
      });

      productList = productList.filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);

      return [...productList, ...warranties, ...insurances, ...amcs, ...pucProducts, ...productServiceSchedule, ...repairWarranties];
    });
  }

  prepareInsightData(user, request) {
    return _bluebird2.default.all([this.productAdaptor.retrieveProducts({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    }, request.language), this.amcAdaptor.retrieveAMCs({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    }), this.insuranceAdaptor.retrieveInsurances({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    }), this.repairAdaptor.retrieveRepairs({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    }), this.warrantyAdaptor.retrieveWarranties({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    }), this.pucAdaptor.retrievePUCs({
      status_type: [5, 11],
      user_id: user.id || user.ID,
      document_date: {
        $lte: _moment2.default.utc(),
        $gte: _moment2.default.utc().startOf('M')
      }
    })]).then(results => _bluebird2.default.all([...results[0], ...results[1], ...results[2], ...results[3], ...results[4], ...results[5]]));
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.id || user.ID
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue']
    });
  }
}

exports.default = DashboardAdaptor;