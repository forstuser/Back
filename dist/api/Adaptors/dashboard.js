/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var moment = require('moment');
var shared = require('../../helpers/shared');
var notificationAdaptor = require('./notification');

var DashboardAdaptor = function () {
	function DashboardAdaptor(modals) {
		_classCallCheck(this, DashboardAdaptor);

		this.modals = modals;
		this.date = new Date();
	}

	_createClass(DashboardAdaptor, [{
		key: 'retrieveDashboardResult',
		value: function retrieveDashboardResult(user, request) {
			return Promise.all([this.filterUpcomingService(user), this.prepareInsightData(user), this.retrieveRecentSearch(user), this.modals.mailBox.count({ where: { user_id: user.ID, status_id: 4 } }), this.modals.productBills.count({
				where: {
					user_id: user.ID,
					status_id: {
						$ne: 3
					},
					master_category_id: {
						$notIn: [9, 10]
					}
				},
				include: [{
					model: this.modals.consumerBillDetails,
					as: 'consumerBill',
					where: {
						status_id: {
							$ne: 3
						}
					},
					attributes: [],
					include: [{
						model: this.modals.consumerBills,
						as: 'bill',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
								user_status: 5,
								admin_status: 5
							}]
						},
						attributes: []
					}],
					required: true
				}]
			})]).then(function (result) {
				// console.log(require('util').inspect(result[0], false, null));

				var upcomingServices = result[0].map(function (elem) {
					if (elem.productType === 1) {
						console.log("found 1");
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

				var distinctInsight = [];
				var insightData = result[1].map(function (item) {
					var insightItem = item.toJSON();
					var index = distinctInsight.findIndex(function (distinctItem) {
						return new Date(distinctItem.purchaseDate).getTime() === new Date(insightItem.purchaseDate).getTime();
					});

					if (index === -1) {
						distinctInsight.push(insightItem);
					} else {
						distinctInsight[index].value += insightItem.value;
					}

					return insightItem;
				});

				var insightItems = shared.retrieveDaysInsight(distinctInsight);

				var insightResult = insightItems && insightItems.length > 0 ? {
					startDate: moment.utc().subtract(6, 'd').startOf('d'),
					endDate: moment.utc(),
					totalSpend: shared.sumProps(insightItems, 'value'),
					totalDays: 7,
					insightData: insightItems
				} : {
					startDate: moment.utc().subtract(6, 'd').startOf('d'),
					endDate: moment.utc(),
					totalSpend: 0,
					totalDays: 7,
					insightData: insightData
				};

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

					if (moment.utc(aDate, "YYYY-MM-DD").isBefore(moment.utc(bDate, 'YYYY-MM-DD'))) {
						return -1;
					}

					return 1;
				});

				return {
					status: true,
					message: 'Dashboard restore Successful',
					notificationCount: result[3],
					recentSearches: result[2].map(function (item) {
						var search = item.toJSON();
						return search.searchValue;
					}).slice(0, 5),
					upcomingServices: upcomingServices,
					insight: insightResult,
					forceUpdate: request.pre.forceUpdate,
					showDashboard: !!(result[4] && result[4] > 0)
				};
			}).catch(function (err) {
				return {
					status: false,
					message: 'Dashboard restore failed',
					err: err,
					forceUpdate: request.pre.forceUpdate,
					showDashboard: false
				};
			});
		}
	}, {
		key: 'prepareDashboardResult',
		value: function prepareDashboardResult(isNewUser, user, token, request) {
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
					include: [{
						model: this.modals.consumerBillDetails,
						as: 'consumerBill',
						where: {
							status_id: {
								$ne: 3
							}
						},
						attributes: [],
						include: [{
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}],
						required: true
					}]
				}).then(function (billCounts) {
					if (billCounts) {
						return {
							status: true,
							message: 'User Exist',
							billCounts: billCounts,
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
				}).catch(function (err) {
					console.log({ API_Logs: err });
					return {
						status: false,
						authorization: token,
						message: 'Unable to Login User',
						err: err,
						forceUpdate: request.pre.forceUpdate
					};
				});
			}

			notificationAdaptor.sendMailOnDifferentSteps('Welcome to BinBill!', user.email || user.email_id, user, 1);
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
	}, {
		key: 'filterUpcomingService',
		value: function filterUpcomingService(user) {
			var _this = this;

			return new Promise(function (resolve, reject) {
				Promise.all([_this.modals.productBills.findAll({
					attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
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
						attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
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
					attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL'], 'expiryDate'],
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
					attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL'], 'plan'],
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
					attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL'], 'expiryDate'],
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

							if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date') && moment(metaData.value).isValid()) {
								var dueDateTime = moment(metaData.value);
								product.dueDate = metaData.value;
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

					products = products.filter(function (item) {
						return item.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					var amcs = result[1].map(function (item) {
						var amc = item.toJSON();
						if (moment(amc.expiryDate).isValid()) {
							var dueDateTime = moment(amc.expiryDate);
							amc.dueDate = amc.expiryDate;
							amc.dueIn = dueDateTime.diff(moment.utc(), 'days');
							amc.productType = 4;
						}

						return amc;
					});
					amcs = amcs.filter(function (item) {
						return item.amcProduct && item.amcProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					var insurances = result[2].map(function (item) {
						var insurance = item.toJSON();
						if (moment(insurance.expiryDate).isValid()) {
							var dueDateTime = moment(insurance.expiryDate);
							insurance.dueDate = insurance.expiryDate;
							insurance.dueIn = dueDateTime.diff(moment.utc(), 'days');
							insurance.productType = 3;
						}
						return insurance;
					});

					insurances = insurances.filter(function (item) {
						return item.insuredProduct && item.insuredProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					var warranties = result[3].map(function (item) {
						var warranty = item.toJSON();
						if (moment(warranty.expiryDate).isValid()) {
							var dueDateTime = moment(warranty.expiryDate);
							warranty.dueDate = warranty.expiryDate;
							warranty.dueIn = dueDateTime.diff(moment.utc(), 'days');
							warranty.productType = 2;
						}
						return warranty;
					});

					warranties = warranties.filter(function (item) {
						return item.warrantyProduct && item.warrantyProduct.consumerBill && item.dueIn !== undefined && item.dueIn !== null && item.dueIn <= 30 && item.dueIn >= 0;
					});

					resolve([].concat(_toConsumableArray(products), _toConsumableArray(warranties), _toConsumableArray(insurances), _toConsumableArray(amcs)));
				}).catch(function (err) {
					console.log({ API_Logs: err });
					reject(err);
				});
			});
		}
	}, {
		key: 'prepareInsightData',
		value: function prepareInsightData(user) {
			return this.modals.productBills.findAll({
				where: {
					master_category_id: {
						$ne: 10
					},
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
					include: [{
						model: this.modals.consumerBills,
						as: 'bill',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.literal('`bill_ref_type`'), 1), {
								user_status: 5,
								admin_status: 5
							}]
						},
						attributes: []
					}]
				}],
				attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.literal('`purchase_date`'), 'purchaseDate']],
				order: [[this.modals.sequelize.literal('`purchase_date`'), 'ASC']]
			});
		}
	}, {
		key: 'retrieveRecentSearch',
		value: function retrieveRecentSearch(user) {
			return this.modals.recentSearches.findAll({
				where: {
					user_id: user.ID
				},
				order: [['searchDate', 'DESC']],
				attributes: ['searchValue']
			});
		}
	}]);

	return DashboardAdaptor;
}();

module.exports = DashboardAdaptor;