/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _nodemailerSmtpTransport = require('nodemailer-smtp-transport');

var _nodemailerSmtpTransport2 = _interopRequireDefault(_nodemailerSmtpTransport);

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NotificationAdaptor = function () {
	function NotificationAdaptor(modals) {
		_classCallCheck(this, NotificationAdaptor);

		this.modals = modals;
	}

	_createClass(NotificationAdaptor, [{
		key: 'retrieveNotifications',
		value: function retrieveNotifications(user, request) {
			return Promise.all([this.filterUpcomingService(user), this.prepareNotificationData(user)]).then(function (result) {
				var upcomingServices = result[0].map(function (elem) {
					if (elem.productType === 4) {
						console.log(elem);
						var dueAmountArr = elem.productMetaData.filter(function (e) {
							return e.name.toLowerCase() === "due amount";
						});

						if (dueAmountArr.length > 0) {
							elem.value = dueAmountArr[0].value;
						}
					}

					return elem;
				});
				/* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */

				upcomingServices.sort(function (a, b) {
					var aDate = void 0;
					var bDate = void 0;

					aDate = a.expiryDate;
					bDate = b.expiryDate;

					if (a.productType === 1) {
						aDate = a.dueDate;
					}

					if (b.productType === 1) {
						bDate = b.dueDate;
					}

					if (_moment2.default.utc(aDate, "YYYY-MM-DD").isBefore(_moment2.default.utc(bDate, 'YYYY-MM-DD'))) {
						return -1;
					}

					return 1;
				});

				var notifications = [].concat(_toConsumableArray(upcomingServices), _toConsumableArray(result[1]));
				return {
					status: true,
					message: 'Mailbox restore Successful',
					notifications: notifications,
					forceUpdate: request.pre.forceUpdate
					/* .slice(listIndex, 10), */
					/* nextPageUrl: notifications.length >
     		 listIndex + 10 ? `consumer/mailbox?pageno=${parseInt(pageNo, 10) + 1}` : '' */
				};
			}).catch(function (err) {
				console.log({ API_Logs: err });
				return {
					status: false,
					message: 'Mailbox restore failed',
					err: err,
					forceUpdate: request.pre.forceUpdate
				};
			});
		}
	}, {
		key: 'filterUpcomingService',
		value: function filterUpcomingService(user) {
			var _this = this;

			return new Promise(function (resolve, reject) {
				Promise.all([_this.modals.productBills.findAll({
					attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL'], 'createdAt'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						master_category_id: [6, 8]
					},
					include: [{
						model: _this.modals.consumerBillDetails,
						as: 'consumerBill',
						attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate'], ['created_on', 'createdAt']],
						include: [{
							model: _this.modals.billDetailCopies,
							as: 'billDetailCopies',
							include: [{
								model: _this.modals.billCopies,
								as: 'billCopies',
								attributes: []
							}],
							attributes: [['bill_copy_id', 'billCopyId'], [_this.modals.sequelize.fn('CONCAT', _this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [_this.modals.sequelize.fn('CONCAT', 'bills/', _this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
						}, {
							model: _this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}]
					}, {
						model: _this.modals.productMetaData,
						as: 'productMetaData',
						attributes: [['form_element_value', 'value'], [_this.modals.sequelize.fn('CONCAT', _this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [_this.modals.sequelize.fn('CONCAT', _this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
						include: [{
							model: _this.modals.categoryForm, as: 'categoryForm', attributes: []
						}, {
							model: _this.modals.categoryFormMapping,
							as: 'selectedValue',
							on: {
								$or: [_this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData`.`category_form_id`'), _this.modals.sequelize.col('`productMetaData->categoryForm`.`category_form_id`'))]
							},
							where: {
								$and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData`.`form_element_value`'), _this.modals.sequelize.col('`productMetaData->selectedValue`.`mapping_id`')), _this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`'), 2)]
							},
							attributes: [['dropdown_name', 'value']],
							required: false
						}],
						required: false
					}]
				}), _this.modals.amcBills.findAll({
					attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					},
					include: [{
						model: _this.modals.productBills,
						as: 'amcProduct',
						attributes: [['product_name', 'productName'], [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL']],
						include: [{
							model: _this.modals.consumerBillDetails,
							as: 'consumerBill',
							attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
							include: [{
								model: _this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`amcProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
										user_status: 5,
										admin_status: 5
									}]
								},
								attributes: []
							}]
						}]
					}, {
						model: _this.modals.amcBillCopies,
						as: 'amcCopies',
						attributes: [['bill_copy_id', 'billCopyId'], [_this.modals.sequelize.fn('CONCAT', 'bills/', _this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
					}]
				}), _this.modals.insuranceBills.findAll({
					attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					},
					include: [{
						model: _this.modals.productBills,
						as: 'insuredProduct',
						attributes: [['product_name', 'productName'], [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL']],
						include: [{
							model: _this.modals.consumerBillDetails,
							as: 'consumerBill',
							attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
							include: [{
								model: _this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`insuredProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
										user_status: 5,
										admin_status: 5
									}]
								},
								attributes: []
							}]
						}]
					}, {
						model: _this.modals.insuranceBillCopies,
						as: 'insuranceCopies',
						attributes: [['bill_copy_id', 'billCopyId'], [_this.modals.sequelize.fn('CONCAT', 'bills/', _this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
					}]
				}), _this.modals.warranty.findAll({
					attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL'], 'createdAt'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					},
					include: [{
						model: _this.modals.productBills,
						as: 'warrantyProduct',
						attributes: [['product_name', 'productName'], [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL']],
						include: [{
							model: _this.modals.consumerBillDetails,
							as: 'consumerBill',
							attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
							include: [{
								model: _this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`warrantyProduct->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
										user_status: 5,
										admin_status: 5
									}]
								},
								attributes: []
							}]
						}]
					}, {
						model: _this.modals.warrantyCopies,
						as: 'warrantyCopies',
						attributes: [['bill_copy_id', 'billCopyId'], [_this.modals.sequelize.fn('CONCAT', 'bills/', _this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
					}]
				})]).then(function (result) {
					var products = result[0].map(function (item) {
						var product = item.toJSON();

						product.productMetaData.map(function (metaItem) {
							var metaData = metaItem;
							if (metaData.type === '2' && metaData.selectedValue) {
								metaData.value = metaData.selectedValue.value;
							}

							if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && (0, _moment2.default)(metaData.value).isValid()) {
								var dueDateTime = (0, _moment2.default)(metaData.value);
								product.dueDate = metaData.value;
								product.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
								if (product.masterCatId.toString() === '6') {
									product.productType = 5;
								} else {
									product.title = product.productName + ' Reminder';
									product.description = metaData.name.toLowerCase().includes('address') ? '' + metaData.value : '';
									product.productType = 4;
								}
							}

							if (metaData.name.toLowerCase().includes('address')) {
								product.description = metaData.value;
							}

							return metaData;
						});

						return product;
					});

					products = products.filter(function (item) {
						return item.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});
					var amcs = result[1].map(function (item) {
						var amc = item.toJSON();
						if ((0, _moment2.default)(amc.expiryDate).isValid()) {
							var dueDateTime = (0, _moment2.default)(amc.expiryDate);
							amc.dueDate = amc.expiryDate;
							amc.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
							amc.productType = 3;
							amc.title = 'AMC Renewal Pending';
							amc.description = amc.amcProduct ? amc.amcProduct.productName : '';
						}

						return amc;
					});
					amcs = amcs.filter(function (item) {
						return item.amcProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					var insurances = result[2].map(function (item) {
						var insurance = item.toJSON();
						if ((0, _moment2.default)(insurance.expiryDate).isValid()) {
							var dueDateTime = (0, _moment2.default)(insurance.expiryDate);
							insurance.dueDate = insurance.expiryDate;
							insurance.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
							insurance.productType = 3;
							insurance.title = 'Insurance Renewal Pending';
							insurance.description = insurance.insuredProduct ? insurance.insuredProduct.productName : '';
						}
						return insurance;
					});

					insurances = insurances.filter(function (item) {
						return item.insuredProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					var warranties = result[3].map(function (item) {
						var warranty = item.toJSON();
						if ((0, _moment2.default)(warranty.expiryDate).isValid()) {
							var dueDateTime = (0, _moment2.default)(warranty.expiryDate);

							warranty.dueDate = warranty.expiryDate;
							warranty.dueIn = dueDateTime.diff(_moment2.default.utc(), 'days');
							warranty.productType = 3;
							warranty.title = 'Warranty Renewal Pending';
							warranty.description = warranty.warrantyProduct ? warranty.warrantyProduct.productName : '';
						}

						return warranty;
					});

					warranties = warranties.filter(function (item) {
						return item.warrantyProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					resolve([].concat(_toConsumableArray(products), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs)));
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reject(err);
				});
			});
		}
	}, {
		key: 'prepareNotificationData',
		value: function prepareNotificationData(user) {
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
	}, {
		key: 'updateNotificationStatus',
		value: function updateNotificationStatus(user, notificationIds) {
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
	}, {
		key: 'notifyUser',
		value: function notifyUser(userId, payload, reply) {
			return this.modals.fcmDetails.findAll({
				where: {
					user_id: userId
				}
			}).then(function (result) {
				var options = {
					uri: 'https://fcm.googleapis.com/fcm/send',
					method: 'POST',
					headers: { Authorization: 'key=' + _main2.default.GOOGLE.FCM_KEY },
					json: {
						// note that Sequelize returns token object array, we map it with token value only
						registration_ids: result.map(function (user) {
							return user.fcm_id;
						}),
						// iOS requires priority to be set as 'high' for message to be received in background
						priority: 'high',
						data: payload
					}
				};
				(0, _request2.default)(options, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						// request was success, should early return response to client
						reply({
							status: true
						}).code(200);
					} else {
						reply({
							status: false,
							error: error
						}).code(500);
					}
					// extract invalid registration for removal
					if (body.failure > 0 && Array.isArray(body.results) && body.results.length === result.length) {
						var results = body.results;
						for (var i = 0; i < result.length; i += 1) {
							if (results[i].error === 'InvalidRegistration') {
								result[i].destroy().then(function (rows) {
									console.log("FCM ID's DELETED: ", rows);
								});
							}
						}
					}
				});
			});
		}
	}, {
		key: 'verifyEmailAddress',
		value: function verifyEmailAddress(emailSecret, reply) {
			return this.modals.users.findOne({
				where: {
					user_status_type: {
						$ne: 3
					},
					email_secret: emailSecret
				}
			}).then(function (result) {
				result.updateAttributes({
					email_verified: true
				});

				return reply({ status: true });
			}).catch(function (err) {
				console.log({ API_Logs: err });
				return reply({ status: false });
			});
		}
	}], [{
		key: 'sendVerificationMail',
		value: function sendVerificationMail(email, user) {
			var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
				service: 'gmail',
				auth: {
					user: _main2.default.EMAIL.USER,
					pass: _main2.default.EMAIL.PASSWORD
				},
				secure: true,
				port: 465
			}));

			// setup email data with unicode symbols
			var mailOptions = {
				from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
				to: email, // list of receivers
				subject: 'BinBill Email Verification',
				html: _shared2.default.retrieveMailTemplate(user, 0)
			};

			// send mail with defined transport object
			smtpTransporter.sendMail(mailOptions);
		}
	}, {
		key: 'sendMailOnDifferentSteps',
		value: function sendMailOnDifferentSteps(subject, email, user, stepId) {
			var smtpTransporter = _nodemailer2.default.createTransport((0, _nodemailerSmtpTransport2.default)({
				service: 'gmail',
				auth: {
					user: _main2.default.EMAIL.USER,
					pass: _main2.default.EMAIL.PASSWORD
				},
				secure: true,
				port: 465
			}));

			// setup email data with unicode symbols
			var mailOptions = {
				from: '"BinBill" <' + _main2.default.EMAIL.USER + '>', // sender address
				to: email, // list of receivers
				subject: subject,
				html: _shared2.default.retrieveMailTemplate(user, stepId)
			};

			// send mail with defined transport object
			smtpTransporter.sendMail(mailOptions);
		}
	}, {
		key: 'sendLinkOnMessage',
		value: function sendLinkOnMessage(phoneNo) {
			var options = {
				uri: 'http://api.msg91.com/api/sendhttp.php',
				qs: {
					authkey: _main2.default.SMS.AUTH_KEY,
					sender: 'BINBIL',
					flash: 0,
					mobiles: '91' + phoneNo,
					message: 'Hey there, \nPlease click on the link to download BinBill App and start building your eHome : http://play.google.com/store/apps/details?id=com.bin.binbillcustomer \nWhere there is a Bill,there is BinBill.',
					route: 4,
					country: 91,
					response: 'json'
				},
				timeout: 170000,
				json: true // Automatically parses the JSON string in the response
			};
			(0, _request2.default)(options, function (error, response, body) {
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
	}]);

	return NotificationAdaptor;
}();

exports.default = NotificationAdaptor;