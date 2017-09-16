/*jshint esversion: 6 */
'use strict';

const moment = require('moment');
const request = require('request');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('../../config/main');

class NotificationAdaptor {
    constructor(modals) {
        this.modals = modals;
    }

    retrieveNotifications(user, request) {
        return Promise.all([
            this.filterUpcomingService(user),
            this.prepareNotificationData(user)
        ]).then((result) => {
            /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */
            result[0].sort((a, b) => a.dueIn - b.dueIn);
            const notifications = [...result[0], ...result[1]];
            return {
                status: true,
                message: 'Mailbox restore Successful',
                notifications,
                forceUpdate: request.pre.forceUpdate
                /* .slice(listIndex, 10), */
                /* nextPageUrl: notifications.length >
                         listIndex + 10 ? `consumer/mailbox?pageno=${parseInt(pageNo, 10) + 1}` : '' */
            };
        }).catch(err => ({
            status: false,
            message: 'Mailbox restore failed',
            err,
            forceUpdate: request.pre.forceUpdate
        }));
    }

    filterUpcomingService(user) {
        return new Promise((resolve, reject) => {
            Promise.all([this.modals.productBills.findAll({
                attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL'], 'createdAt'],
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
                    attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate'], ['created_on', 'createdAt']],
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
                        }]
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
                    attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
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
                    attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
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
                    attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
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
                            product.dueDate = metaData.value;
                            product.dueIn = dueDateTime.diff(moment.utc(), 'days');
                            if (product.masterCatId.toString() === '6') {
                                product.productType = 5;
                            } else {
                                product.title = `${product.productName} Reminder`;
                                product.description = product.description && metaData.name.toLowerCase().includes('address') ? `For ${metaData.value}` : '';
                                product.productType = 4;
                            }
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
                        amc.dueDate = amc.expiryDate;
                        amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        amc.productType = 3;
                        amc.title = 'AMC Renewal Pending';
                        amc.description = amc.amcProduct ? amc.amcProduct.productName : '';
                    }

                    return amc;
                });
                amcs = amcs.filter(item => (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                let insurances = result[2].map((item) => {
                    const insurance = item.toJSON();
                    if (moment(insurance.expiryDate).isValid()) {
                        const dueDateTime = moment(insurance.expiryDate);
                        insurance.dueDate = insurance.expiryDate;
                        insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        insurance.productType = 3;
                        insurance.title = 'Insurance Renewal Pending';
                        insurance.description = insurance.insuredProduct ? insurance.insuredProduct.productName : '';
                    }
                    return insurance;
                });

                insurances = insurances.filter(item => (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                let warranties = result[3].map((item) => {
                    const warranty = item.toJSON();
                    if (moment(warranty.expiryDate).isValid()) {
                        const dueDateTime = moment(warranty.expiryDate);

                        warranty.dueDate = warranty.expiryDate;
                        warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
                        warranty.productType = 3;
                        warranty.title = 'Warranty Renewal Pending';
                        warranty.description = warranty.warrantyProduct ? warranty.warrantyProduct.productName : '';
                    }

                    return warranty;
                });

                warranties = warranties.filter(item => (item.dueIn !== undefined && item.dueIn !== null) && item.dueIn <= 30 && item.dueIn >= 0);

                resolve([...products, ...warranties, ...insurances, ...amcs]);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    prepareNotificationData(user) {
        return this.modals.mailBox.findAll({
            where: {
                user_id: user.ID,
                status_id: {
                    $ne: 3
                }
            },
            include: [{
                model: this.modals.productBills,
                as: 'product',
                attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`product`.`bill_product_id`')), 'productURL']],
                required: false
            }, {
                model: this.modals.billCopies,
                as: 'copies',
                attributes: [['bill_copy_id', 'billCopyId'], ['bill_copy_type', 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`copies`.`bill_copy_id`'), '/files'), 'fileUrl']],
                required: false
            }],
            order: [['createdAt', 'DESC']],
            attributes: [['notification_id', 'id'], ['due_amount', 'dueAmount'], ['due_date', 'dueDate'], 'taxes', ['total_amount', 'totalAmount'], ['notification_type', 'productType'], 'title', 'description', ['status_id', 'statusId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`product`.`bill_product_id`')), 'productURL'], 'createdAt']
        });
    }

    updateNotificationStatus(user, notificationIds) {
        return this.modals.mailBox.update({
            status_id: 9
        }, {
            where: {
                user_id: user.ID,
                status_id: {
                    $ne: 3
                },
                notification_id: notificationIds
            }
        });
    }

    notifyUser(userId, payload, reply) {
        return this.modals.fcmDetails.findAll({
            where: {
                user_id: userId
            }
        }).then((result) => {
            const options = {
                uri: 'https://fcm.googleapis.com/fcm/send',
                method: 'POST',
                headers: {Authorization: 'key=AAAAx4_n95E:APA91bE8ZnA83WXrHVdiB31D87eqCGedieYmvfzabLTMyyPdXdWIf3ZWko1EWd1dPwqtlTgxr0YF4tX1ksdsd4LxUnXMyOLF3u9szv3u_yMTWvwOTf64SPnvszmnK5IU8Tc_4apGf78x'},
                json: {
                    // note that Sequelize returns token object array, we map it with token value only
                    registration_ids: result.map(user => user.fcm_id),
                    // iOS requires priority to be set as 'high' for message to be received in background
                    priority: 'high',
                    data: payload
                }
            };
            request(options, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    // request was success, should early return response to client
                    reply({
                        status: true
                    }).code(200);
                } else {
                    reply({
                        status: false,
                        error
                    }).code(500);
                }
                // extract invalid registration for removal
                if (body.failure > 0 && Array.isArray(body.results) && body
                        .results.length === result.length) {
                    const results = body.results;
                    for (let i = 0; i < result.length; i += 1) {
                        if (results[i].error === 'InvalidRegistration') {
                            result[i].destroy().then(rows => {
                                console.log("FCM ID's DELETED: ", rows);
                            });
                        }
                    }
                }
            });
        });
    }

    verifyEmailAddress(emailSecret) {
        return this.modals.table_users.findOne({
            where: {
                status_id: {
                    $ne: 3
                },
                email_secret: emailSecret
            },
            attributes: {
                exclude: ['UserTypeID']
            }
        }).then((result) => {
            result.updateAttributes({
                email_verified: 1
            });

            return 'Thanks for registering with BinBill.';
        }).catch(() => '');
    }

    static sendVerificationMail(email, user) {
        const smtpTransporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            auth: {
                user: config.EMAIL.USER,
                pass: config.EMAIL.PASSWORD
            },
            secure: true,
            port: 465
        }));


        // setup email data with unicode symbols
        const mailOptions = {
            from: '"BinBill" <noreply@binbill.com>', // sender address
            to: email, // list of receivers
            subject: 'SAFER Email Verification',
            html: `Hi ${user.fullname},<br /><br /> <a href='${config.SERVER_HOST}/verify/${user.email_secret}' >Click here</a> to verify your email account -<br /><a href='${config.SERVER_HOST}/verify/${user.email_secret}' >${config.SERVER_HOST}/verify/${user.email_secret}</a><br /> Welcome to the safe and connected world!<br /><br />Regards,<br />BinBill`
        };

        // send mail with defined transport object
        smtpTransporter.sendMail(mailOptions);
    }

    static sendLinkOnMessage(phoneNo) {
        const options = {
            uri: 'http://api.msg91.com/api/sendhttp.php',
            qs: {
                authkey: config.SMS.AUTH_KEY,
                sender: 'BINBIL',
                flash: 0,
                mobiles: `91${phoneNo}`,
                message: `Hi User, \n Thanks for visiting. Please follow link to download our app http://play.google.com/store/apps/details?id=com.bin.binbillcustomer.`,
                route: 4,
                country: 91,
                response: 'json'
            },
            timeout: 170000,
            json: true // Automatically parses the JSON string in the response
        };
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                // request was success, should early return response to client
                return {
                    status: true
                };
            } else {
                console.log(error);
            }
        });
    }
}

module.exports = NotificationAdaptor;
