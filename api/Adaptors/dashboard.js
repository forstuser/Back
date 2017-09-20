/*jshint esversion: 6 */
'use strict';

const moment = require('moment');

const shared = require('../../helpers/shared');

const date = new Date();

const first = date.getDate() - 6;
// First day is the day of the month - the day of the week
const last = first + 7;// last day is the first day + 6
const lastDate = new Date(date.setDate(last));
const firstDate = new Date(date.setDate(first));


const firstDay = firstDate;
const lastDay = date.getDate() > lastDate.getDate() ? new Date(date
    .getFullYear(), date.getMonth() + 1, lastDate.getDate()) : lastDate;

firstDay.setHours(0, 0, 0, 0);
lastDay.setHours(0, 0, 0, 0);

function sumProps(arrayItem, prop) {
    let total = 0;
    for (let i = 0; i < arrayItem.length; i += 1) {
        total += arrayItem[i][prop];
    }
    return total;
}

const dueDays = {
    Yearly: 365, HalfYearly: 180, Quarterly: 90, Monthly: 30, Weekly: 7, Daily: 1
};

class DashboardAdaptor {
    constructor(modals) {
        this.modals = modals;
        this.date = new Date();
        this.cFirstDay = moment.utc().subtract(6, 'd').startOf('d');
        this.cLastDay = moment.utc();
    }

    getAllDays() {

        let s = moment(this.cFirstDay).utc();
        const e = moment(this.cLastDay).utc();
        const a = [];
        while (s.unix() < e.unix()) {
            a.push({
                value: 0,
                purchaseDate: moment(s).utc()
            });
            s = moment(s).utc().add(1, 'd').startOf('d');
        }

        return a;
    }

    retrieveDashboardResult(user, request) {
        return Promise.all([
            this.filterUpcomingService(user),
            this.prepareInsightData(user),
            this.retrieveRecentSearch(user),
            this.modals.mailBox.count({where: {user_id: user.ID, status_id: 4}}),
            this.modals.productBills.count({
                where: {
                    user_id: user.ID,
                    status_id: {
                        $ne: 3
                    },
                    master_category_id: {
                        $notIn: [9, 10]
                    }
                },
                include: [
                    {
                        model: this.modals.consumerBillDetails,
                        as: 'consumerBill',
                        where: {
                            status_id: {
                                $ne: 3
                            }
                        },
                        attributes: [],
                        include: [
                            {
                                model: this.modals.consumerBills,
                                as: 'bill',
                                where: {
                                    $and: [
                                        this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                        {
                                            user_status: 5,
                                            admin_status: 5
                                        }
                                    ]
                                },
                                attributes: []
                            }],
                        required: true
                    }]
            })
        ]).then((result) => {
            const distinctInsight = [];
            const insightData = result[1].map((item) => {
                const insightItem = item.toJSON();
                const index = distinctInsight
                    .findIndex(distinctItem => (new Date(distinctItem.purchaseDate)
                        .getTime() === new Date(insightItem.purchaseDate)
                        .getTime()));

                if (index === -1) {
                    distinctInsight.push(insightItem);
                } else {
                    distinctInsight[index].value += insightItem.value;
                }

                return insightItem;
            });

            const insightItems = this.retrieveDaysInsight(distinctInsight);

            const insightResult = insightItems && insightItems.length > 0 ? {
                startDate: moment.utc().subtract(6, 'd').startOf('d'),
                endDate: moment.utc(),
                totalSpend: sumProps(insightItems, 'value'),
                totalDays: 7,
                insightData: insightItems
            } : {
                startDate: moment.utc().subtract(6, 'd').startOf('d'),
                endDate: moment.utc(),
                totalSpend: 0,
                totalDays: 7,
                insightData
            };
            result[0].sort((a, b) => a.dueIn - b.dueIn);
            return {
                status: true,
                message: 'Dashboard restore Successful',
                notificationCount: result[3],
                recentSearches: result[2].map((item) => {
                    const search = item.toJSON();
                    return search.searchValue;
                }).slice(0, 5),
                upcomingServices: result[0],
                insight: insightResult,
                forceUpdate: request.pre.forceUpdate,
                showDashboard: !!(result[4] && result[4] > 0)
            };
        }).catch(err => ({
            status: false,
            message: 'Dashboard restore failed',
            err,
            forceUpdate: request.pre.forceUpdate,
            showDashboard: false
        }));
    }

    prepareDashboardResult(isNewUser, user, token, request) {
        if (!isNewUser) {
            return this.modals.productBills.count({
                where: {
                    user_id: user.ID,
                    status_id: {
                        $ne: 3
                    },
                    master_category_id: {
                        $notIn: [9, 10]
                    }
                },
                include: [
                    {
                        model: this.modals.consumerBillDetails,
                        as: 'consumerBill',
                        where: {
                            status_id: {
                                $ne: 3
                            }
                        },
                        attributes: [],
                        include: [
                            {
                                model: this.modals.consumerBills,
                                as: 'bill',
                                where: {
                                    $and: [
                                        this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                        {
                                            user_status: 5,
                                            admin_status: 5
                                        }
                                    ]
                                },
                                attributes: []
                            }],
                        required: true
                    }]
            }).then((billCounts) => {
                if (billCounts) {
                    return {
                        status: true,
                        message: 'User Exist',
                        billCounts,
                        showDashboard: billCounts > 0,
                        isExistingUser: !isNewUser,
                        authorization: token,
                        userId: user.ID,
                        forceUpdate: request.pre.forceUpdate
                    };
                }

                return {
                    status: true,
                    message: 'Existing User',
                    authorization: token,
                    billCounts: 0,
                    showDashboard: false,
                    isExistingUser: !isNewUser,
                    userId: user.ID,
                    forceUpdate: request.pre.forceUpdate
                };
            }).catch(err => ({
                status: false,
                authorization: token,
                message: 'Unable to Login User',
                err,
                forceUpdate: request.pre.forceUpdate
            }));
        }

        return {
            status: true,
            message: 'New User',
            authorization: token,
            billCounts: 0,
            showDashboard: false,
            isExistingUser: !isNewUser,
            userId: user.ID,
            forceUpdate: request.pre.forceUpdate
        };
    }

    filterUpcomingService(user) {
        return new Promise((resolve, reject) => {
            Promise.all([this.modals.productBills.findAll({
                attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
                where: {
                    user_id: user.ID,
                    status_id: {
                        $ne: 3
                    },
                    master_category_id: [6, 8]
                },
                include: [{
                    model: this.modals.consumerBillDetails,
                    as: 'consumerBill',
                    attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
                    include: [{
                        model: this.modals.billDetailCopies,
                        as: 'billDetailCopies',
                        attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
                    },
                        {
                            model: this.modals.consumerBills,
                            as: 'bill',
                            where: {
                                $and: [
                                    this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                    {
                                        user_status: 5,
                                        admin_status: 5
                                    }
                                ]
                            },
                            attributes: []
                        }
                    ]
                },
                    {
                        model: this.modals.productMetaData,
                        as: 'productMetaData',
                        attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
                        include: [{
                            model: this.modals.categoryForm, as: 'categoryForm', attributes: []
                        },
                            {
                                model: this.modals.categoryFormMapping,
                                as: 'selectedValue',
                                on: {
                                    $or: [
                                        this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`category_form_id`'), this.modals.sequelize.col('`productMetaData->categoryForm`.`category_form_id`'))
                                    ]
                                },
                                where: {
                                    $and: [
                                        this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`form_element_value`'), this.modals.sequelize.col('`productMetaData->selectedValue`.`mapping_id`')),
                                        this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`'), 2)]
                                },
                                attributes: [['dropdown_name', 'value']],
                                required: false
                            }],
                        required: false
                    }]
            }),
                this.modals.amcBills.findAll({
                    attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL'], 'expiryDate'],
                    where: {
                        user_id: user.ID,
                        status_id: {
                            $ne: 3
                        }
                    },
                    include: [{
                        model: this.modals.productBills,
                        as: 'amcProduct',
                        attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL']],
                        include: [{
                            model: this.modals.consumerBillDetails,
                            as: 'consumerBill',
                            attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
                            include: [
                                {
                                    model: this.modals.consumerBills,
                                    as: 'bill',
                                    where: {
                                        $and: [
                                            this.modals.sequelize.where(this.modals.sequelize.col('`amcProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                            {
                                                user_status: 5,
                                                admin_status: 5
                                            }
                                        ]
                                    },
                                    attributes: []
                                }
                            ]
                        }]
                    }, {
                        model: this.modals.amcBillCopies,
                        as: 'amcCopies',
                        attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
                    }]
                }),
                this.modals.insuranceBills.findAll({
                    attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL'], 'plan'],
                    where: {
                        user_id: user.ID,
                        status_id: {
                            $ne: 3
                        }
                    },
                    include: [{
                        model: this.modals.productBills,
                        as: 'insuredProduct',
                        attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL']],
                        include: [{
                            model: this.modals.consumerBillDetails,
                            as: 'consumerBill',
                            attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
                            include: [
                                {
                                    model: this.modals.consumerBills,
                                    as: 'bill',
                                    where: {
                                        $and: [
                                            this.modals.sequelize.where(this.modals.sequelize.col('`insuredProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                            {
                                                user_status: 5,
                                                admin_status: 5
                                            }
                                        ]
                                    },
                                    attributes: []
                                }
                            ]
                        }]
                    }, {
                        model: this.modals.insuranceBillCopies,
                        as: 'insuranceCopies',
                        attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
                    }]
                }),
                this.modals.warranty.findAll({
                    attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL'], 'expiryDate'],
                    where: {
                        user_id: user.ID,
                        status_id: {
                            $ne: 3
                        }
                    },
                    include: [{
                        model: this.modals.productBills,
                        as: 'warrantyProduct',
                        attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL']],
                        include: [{
                            model: this.modals.consumerBillDetails,
                            as: 'consumerBill',
                            attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
                            include: [
                                {
                                    model: this.modals.consumerBills,
                                    as: 'bill',
                                    where: {
                                        $and: [
                                            this.modals.sequelize.where(this.modals.sequelize.col('`warrantyProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                                            {
                                                user_status: 5,
                                                admin_status: 5
                                            }
                                        ]
                                    },
                                    attributes: []
                                }
                            ]
                        }]
                    }, {
                        model: this.modals.warrantyCopies,
                        as: 'warrantyCopies',
                        attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
                    }]
                })]).then((result) => {
                let products = result[0].map((item) => {
                    const product = item.toJSON();

                    product.productMetaData.map((metaItem) => {
                        const metaData = metaItem;
                        if (metaData.type === '2' && metaData.selectedValue) {
                            metaData.value = metaData.selectedValue.value;
                        }

                        if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && moment(metaData.value).isValid()) {
                            const dueDateTime = moment(metaData.value);
                            product.dueDate = shared.formatDate(metaData.value, 'dd mmm');
                            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
                            if (product.masterCatId.toString() === '6') {
                                product.productType = 5;
                            } else {
                                product.productType = 1;
                            }
                        }

                        if (metaData.name.toLowerCase().includes('address')) {
                            product.address = metaData.value;
                        }

                        return metaData;
                    });

                    return product;
                });

                products = products.filter(item => (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                let amcs = result[1].map((item) => {
                    const amc = item.toJSON();
                    if (moment(amc.expiryDate).isValid()) {
                        const dueDateTime = moment(amc.expiryDate);
                        amc.dueDate = shared.formatDate(amc.expiryDate, 'dd mmm');
                        amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        amc.productType = 4;
                    }

                    return amc;
                });
                amcs = amcs.filter(item => item.amcProduct.consumerBill && (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                let insurances = result[2].map((item) => {
                    const insurance = item.toJSON();
                    if (moment(insurance.expiryDate).isValid()) {
                        const dueDateTime = moment(insurance.expiryDate);
                        insurance.dueDate = shared.formatDate(insurance.expiryDate, 'dd mmm');
                        insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        insurance.productType = 3;
                    }
                    return insurance;
                });

                insurances = insurances.filter(item => item.insuredProduct.consumerBill && (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                let warranties = result[3].map((item) => {
                    const warranty = item.toJSON();
                    if (moment(warranty.expiryDate).isValid()) {
                        const dueDateTime = moment(warranty.expiryDate);
                        warranty.dueDate = shared.formatDate(warranty.expiryDate, 'dd mmm');
                        warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        warranty.productType = 2;
                    }
                    return warranty;
                });

                warranties = warranties.filter(item => item.warrantyProduct.consumerBill && (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                resolve([...products, ...warranties, ...insurances, ...amcs]);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    prepareInsightData(user) {
        return this.modals.productBills.findAll({
            where: {
                user_id: user.ID,
                status_id: {
                    $ne: 3
                }
            },
            include: [{
                model: this.modals.consumerBillDetails,
                as: 'consumerBill',
                where: {
                    status_id: {
                        $ne: 3
                    },
                    purchase_date: {
                        $lte: moment.utc(),
                        $gte: moment.utc().subtract(6, 'd').startOf('d')
                    }
                },
                include: [
                    {
                        model: this.modals.consumerBills,
                        as: 'bill',
                        where: {
                            $and: [
                                this.modals.sequelize.where(this.modals.sequelize.literal('`bill_ref_type`'), 1),
                                {
                                    user_status: 5,
                                    admin_status: 5
                                }
                            ]
                        },
                        attributes: []
                    }
                ]
            }],
            attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.literal('`purchase_date`'), 'purchaseDate']],
            order: [[this.modals.sequelize.literal('`purchase_date`'), 'ASC']]
        });
    }

    retrieveDaysInsight(distinctInsight) {
        const allDaysInWeek = this.getAllDays();
        distinctInsight.map((item) => {
            const currentDate = moment(item.purchaseDate);
            for (let i = 0; i < allDaysInWeek.length; i += 1) {
                const weekData = allDaysInWeek[i];
                if (weekData.purchaseDate.unix() === currentDate.unix()) {
                    weekData.value = item.value;
                    weekData.purchaseDate = moment(weekData.purchaseDate);
                    break;
                }
            }

            return item;
        });

        return allDaysInWeek.map(weekItem => ({
            value: weekItem.value,
            purchaseDate: moment(weekItem.purchaseDate)
        }));
    }

    retrieveRecentSearch(user) {
        return this.modals.recentSearches.findAll({
            where: {
                user_id: user.ID
            },
            order: [['searchDate', 'DESC']],
            attributes: ['searchValue']
        });
    }
}

module.exports = DashboardAdaptor;
