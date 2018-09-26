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

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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
        this._ = _lodash2.default;
    }

    async retrieveSellerDashboard(options, request, seller_type_id) {
        try {
            const { seller_id } = options;
            let [cashback_jobs, seller, orders] = await _bluebird2.default.all([this.modals.cashback_jobs.findAll({ where: { seller_id }, attributes: ['job_id'] }), this.modals.sellers.findOne({ where: { id: seller_id } }), this.modals.order.findAll({ where: { seller_id, status_type: 5 }, attributes: ['expense_id'] })]);

            seller = seller.toJSON();
            const user_id = seller.customer_ids && seller.customer_ids.length > 0 ? seller.customer_ids : undefined;

            let job_id = cashback_jobs.map(item => {
                item = item.toJSON();
                return item.job_id;
            }).filter(item => item),
                id = orders.map(item => {
                item = item.toJSON();
                return item.expense_id;
            }).filter(item => item);
            job_id = job_id.length > 0 ? job_id : undefined;
            id = id.length > 0 ? id : undefined;
            let [total_transactions, credits, debit_credits, loyalty_points, debit_loyalty_points, assisted_count, user_cashback] = await _bluebird2.default.all([this.modals.products.aggregate('purchase_cost', 'sum', {
                where: JSON.parse(JSON.stringify({ seller_id, status_type: [5, 11], job_id, id }))
            }), this.modals.credit_wallet.aggregate('amount', 'sum', {
                where: JSON.parse(JSON.stringify({ seller_id, status_type: 16, user_id }))
            }), this.modals.credit_wallet.aggregate('amount', 'sum', {
                where: JSON.parse(JSON.stringify({ seller_id, status_type: 14, user_id }))
            }), this.modals.loyalty_wallet.aggregate('amount', 'sum', {
                where: JSON.parse(JSON.stringify({ seller_id, transaction_type: 1, user_id }))
            }), this.modals.loyalty_wallet.aggregate('amount', 'sum', {
                where: JSON.parse(JSON.stringify({ seller_id, transaction_type: 2, user_id }))
            }), this.modals.seller_service_types.aggregate('service_user_id', 'count', {
                where: { seller_id, service_type_id: { $not: 0 } }, distinct: true,
                group: ['seller_id']
            }), this.modals.cashback_wallet.aggregate('amount', 'sum', { where: { seller_id, transaction_type: 1, status_type: 16 } })]);
            return {
                status: true,
                message: 'Dashboard restore Successful',
                total_transactions: total_transactions || 0,
                seller_type_id: seller.seller_type_id,
                is_assisted: seller.is_assisted, is_fmcg: seller.is_fmcg,
                rush_hours: seller.rush_hours,
                is_data_manually_added: seller.is_data_manually_added,
                has_pos: seller.has_pos, forceUpdate: request.pre.forceUpdate,
                loyalty_points: (loyalty_points || 0) - (debit_loyalty_points || 0),
                consumer_counts: (seller.customer_ids || []).length,
                credit_pending: (credits || 0) - (debit_credits || 0),
                notification_count: 0,
                assisted_count: assisted_count || 0,
                user_cashback: user_cashback || 0
            };
        } catch (err) {
            console.log(err);
            this.modals.logs.create({
                api_action: request.method,
                api_path: request.url.pathname,
                log_type: 2,
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
        }
    }

    async retrieveDashboardResult(user, request) {
        try {
            let [upcomingServices, recentSearches, notificationCount] = await _bluebird2.default.all([this.filterUpcomingService(user, request), this.retrieveRecentSearch(user), this.modals.mailBox.count({ where: { user_id: user.id || user.ID, status_id: 4 } })]);
            return {
                status: true,
                message: 'Dashboard restore Successful',
                notificationCount,
                recentSearches: await _bluebird2.default.try(() => recentSearches.map(item => {
                    const search = item.toJSON();
                    return search.searchValue;
                }).slice(0, 5)),
                upcomingServices: await this.evaluateUpcomingServices(upcomingServices),
                forceUpdate: request.pre.forceUpdate
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
        }
    }

    async evaluateUpcomingServices(upcomingServices) {
        return await _bluebird2.default.try(() => this._.orderBy(upcomingServices, ['expiryDate'], ['asc']));
    }

    async evaluateDashboardInsight(insightData) {
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

    async prepareDashboardResult(parameters) {
        let { isNewUser, user, token, request } = parameters;
        console.log(isNewUser);
        let user_id = user.id || user.ID;
        if (!isNewUser) {
            try {
                let [productCounts, /*calendarItemCounts, todoCounts, mealCounts,
                                    wearableCounts,*/knowItemCounts] = await _bluebird2.default.all([this.modals.products.count({ where: { user_id, status_type: [5, 11] } }),
                /*this.modals.user_calendar_item.count({where: {user_id}}),
                this.modals.todoUserMap.count({where: {user_id}}),
                this.modals.mealUserMap.count({where: {user_id}}),
                this.modals.wearables.count({where: {created_by: user_id}}),*/
                this.modals.know_user_likes.count({ where: { user_id } })]);
                // calendarItemCounts = parseInt(calendarItemCounts);
                productCounts = parseInt(productCounts);
                return {
                    status: true,
                    message: !isNewUser ? 'Existing User' : 'New User',
                    billCounts: productCounts,
                    showDashboard: productCounts && productCounts > 0,
                    knowItemsLiked: !!(knowItemCounts && knowItemCounts > 0),
                    isExistingUser: !isNewUser,
                    hasProducts: true,
                    authorization: token,
                    userId: user_id,
                    forceUpdate: request.pre.forceUpdate
                };
            } catch (err) {
                console.log(`Error on ${new Date()} for user ${user_id} is as follow: \n \n ${err}`);

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
            }
        }

        if (user.email) {
            _notification2.default.sendMailOnDifferentSteps('Welcome to BinBill', user.email, user, 1);
        }

        // welcome email
        this.notificationAdaptor.notifyUser({
            userId: user_id, payload: {
                title: 'Welcome to BinBill!',
                description: 'Hello User. Greetings from Rohit BinBill CEO. I welcome...',
                big_text: 'Hello User. Greetings from Rohit BinBill CEO. I welcome you to your eHome. We promise to constantly evolve and make managing your eHome ever efficient and smarter. As it is a new home, you may take some time to get accustomed to it. Your Home Manager and I would always welcome your suggestions to improve your eHome. Please reach me at - rohit@binbill.com or eHome@binbill.com'
            }
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
            userId: user_id,
            forceUpdate: request.pre.forceUpdate
        };
    }

    async filterUpcomingService(user, request) {
        return await _bluebird2.default.try(async () => {
            const [amcList, insuranceList, warrantyList, pucList, productServiceScheduleList, productDetails, repairList] = await _bluebird2.default.all([this.amcAdaptor.retrieveAMCs({
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
            })]);
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

            const metaData = productDetails[0];
            let productList = productDetails[1].map(productItem => {
                productItem.productMetaData = metaData.filter(item => item.productId === productItem.id);
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
                    if (metaData.name.toLowerCase().includes('due amount')) {
                        productItem.value = metaData.value;
                    }
                    productItem.expiryDate = productItem.dueDate;
                });

                productItem.productType = 1;
                return productItem;
            });

            return [...productList, ...warranties, ...insurances, ...amcs, ...pucProducts, ...productServiceSchedule, ...repairWarranties].filter(item => item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0);
        });
    }

    async prepareInsightData(user, request) {
        const results = await _bluebird2.default.all([this.productAdaptor.retrieveProducts({
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
        })]);
        return [...results[0], ...results[1], ...results[2], ...results[3], ...results[4], ...results[5]];
    }

    async retrieveRecentSearch(user) {
        return await this.modals.recentSearches.findAll({
            where: {
                user_id: user.id || user.ID,
                searchValue: {
                    $not: null
                }
            },
            order: [['searchDate', 'DESC']],
            attributes: ['searchValue']
        });
    }
}

exports.default = DashboardAdaptor;