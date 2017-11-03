/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var shared = require('../../helpers/shared');
var moment = require('moment');

function sumProps(arrayItem, prop) {
	var total = 0;
	for (var i = 0; i < arrayItem.length; i += 1) {
		total += arrayItem[i][prop] || 0;
	}
	return total;
}

function weekAndDay(d) {
	var days = [1, 2, 3, 4, 5, 6, 7];
	var prefixes = [1, 2, 3, 4, 5];

	return { monthWeek: prefixes[Math.round(d.getDate() / 7)], day: days[d.getDay()] };
}

var monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var InsightAdaptor = function () {
	function InsightAdaptor(modals) {
		_classCallCheck(this, InsightAdaptor);

		this.modals = modals;
	}

	_createClass(InsightAdaptor, [{
		key: 'prepareInsightData',
		value: function prepareInsightData(user, request) {
			var minDate = request.query.mindate;
			var maxDate = request.query.maxdate;
			return this.prepareCategoryData(user, minDate, maxDate).then(function (result) {
				var categoryData = !(minDate || maxDate) ? {
					weeklyData: result[0].map(function (periodItem) {
						var categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
						categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					monthlyData: result[1].map(function (periodItem) {
						var categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
						categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					yearlyData: result[2].map(function (periodItem) {
						var categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
						categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					})
				} : {
					customDateData: result.map(function (item) {
						var categoryItem = item.toJSON();
						categoryItem.totalAmount = categoryItem.totalAmount || 0;
						categoryItem.totalTax = categoryItem.totalTax || 0;
						// categoryItem.totalAmount += categoryItem.totalTax;
						return categoryItem;
					})
				};

				if (minDate || maxDate) {
					categoryData.customDateData.sort(function (a, b) {
						return b.totalAmount - a.totalAmount;
					});

					var totalAmounts = sumProps(categoryData.customDateData, 'totalAmount');
					var totalTaxes = sumProps(categoryData.customDateData, 'totalTax');
					return {
						status: true,
						message: 'Insight restore successful',
						notificationCount: '2',
						categoryData: categoryData,
						totalSpend: totalAmounts,
						totalTaxes: totalTaxes,
						startDate: minDate,
						endDate: maxDate,
						forceUpdate: request.pre.forceUpdate
					};
				}

				categoryData.weeklyData.sort(function (a, b) {
					return b.totalAmount - a.totalAmount;
				});

				categoryData.monthlyData.sort(function (a, b) {
					return b.totalAmount - a.totalAmount;
				});

				categoryData.yearlyData.sort(function (a, b) {
					return b.totalAmount - a.totalAmount;
				});

				var totalWeeklyAmounts = sumProps(categoryData.weeklyData, 'totalAmount');
				var totalWeeklyTaxes = sumProps(categoryData.weeklyData, 'totalTax');
				var totalYearlyAmounts = sumProps(categoryData.yearlyData, 'totalAmount');
				var totalYearlyTaxes = sumProps(categoryData.yearlyData, 'totalTax');
				var totalMonthlyAmounts = sumProps(categoryData.monthlyData, 'totalAmount');
				var totalMonthlyTaxes = sumProps(categoryData.monthlyData, 'totalTax');
				return {
					status: true,
					message: 'Insight restore successful',
					notificationCount: 0,
					categoryData: categoryData,
					weekStartDate: moment.utc().startOf('week').startOf('week').format('YYYY-MM-DD'),
					monthStartDate: moment.utc().startOf('week').startOf('month').format('YYYY-MM-DD'),
					weekEndDate: moment.utc().startOf('week').endOf('week').format('YYYY-MM-DD'),
					monthLastDate: moment.utc().startOf('week').endOf('month').format('YYYY-MM-DD'),
					yearStartDate: moment.utc().startOf('week').startOf('year').format('YYYY-MM-DD'),
					yearEndDate: moment.utc().startOf('week').endOf('year').format('YYYY-MM-DD'),
					totalYearlySpend: totalYearlyAmounts,
					totalWeeklySpend: totalWeeklyAmounts,
					totalWeeklyTaxes: totalWeeklyTaxes,
					totalYearlyTaxes: totalYearlyTaxes,
					totalMonthlySpend: totalMonthlyAmounts,
					totalMonthlyTaxes: totalMonthlyTaxes,
					forceUpdate: request.pre.forceUpdate
				};
			}).catch(function (err) {
				console.log({ API_Logs: err });
				return {
					status: false,
					message: 'Insight restore failed',
					err: err,
					forceUpdate: request.pre.forceUpdate
				};
			});
		}
	}, {
		key: 'prepareCategoryData',
		value: function prepareCategoryData(user, minDate, maxDate) {
			return !(minDate || maxDate) ? Promise.all([this.modals.categories.findAll({
				where: {
					category_level: 1,
					status_id: {
						$ne: 3
					}
				},
				include: [{
					model: this.modals.productBills,
					as: 'products',
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
								$gte: moment.utc().startOf('week').startOf('week'),
								$lte: moment.utc().startOf('week').endOf('week')
							}
						},
						include: [{
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}],
						attributes: [],
						required: true
					}],
					attributes: [],
					required: false,
					group: '`products`.`master_category_id`'
				}],
				attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights?pageno=1'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
				group: '`categories`.`category_id`',
				order: ['display_id']
			}), this.modals.categories.findAll({
				where: {
					category_level: 1,
					status_id: {
						$ne: 3
					}
				},
				include: [{
					model: this.modals.productBills,
					as: 'products',
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
								$gte: moment.utc().startOf('week').startOf('month'),
								$lte: moment.utc().startOf('week').endOf('month')
							}
						},
						include: [{
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}],
						attributes: [],
						required: true
					}],
					attributes: [],
					required: false,
					group: '`products`.`master_category_id`'
				}],
				attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights?pageno=1'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
				group: '`categories`.`category_id`',
				order: ['display_id']
			}), this.modals.categories.findAll({
				where: {
					category_level: 1,
					status_id: {
						$ne: 3
					}
				},
				include: [{
					model: this.modals.productBills,
					as: 'products',
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
								$gte: moment.utc().startOf('week').startOf('year'),
								$lte: moment.utc().startOf('week').endOf('year')
							}
						},
						attributes: [],
						include: [{
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}],
						required: true
					}],
					attributes: [],
					required: false,
					group: '`products`.`master_category_id`'
				}],
				attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
				group: '`categories`.`category_id`',
				order: ['display_id']
			})]) : this.modals.categories.findAll({
				where: {
					category_level: 1,
					status_id: {
						$ne: 3
					}
				},
				include: [{
					model: this.modals.productBills,
					as: 'products',
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
								$gte: minDate ? moment(minDate).utc().startOf('day') : moment.utc().startOf('week').startOf('month'),
								$lte: maxDate ? moment(maxDate).utc().endOf('day') : moment.utc().startOf('week').endOf('month')
							}
						},
						attributes: [],
						include: [{
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}],
						required: true
					}],
					attributes: [],
					required: false,
					group: '`products`.`master_category_id`'
				}],
				attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
				group: '`categories`.`category_id`',
				order: ['display_id']
			});
		}
	}, {
		key: 'prepareCategoryInsight',
		value: function prepareCategoryInsight(user, request) {
			var masterCategoryId = request.params.id;
			var minDate = request.query.mindate;
			var maxDate = request.query.maxdate;
			var promisedQuery = Promise.all([this.fetchProductDetails(user, masterCategoryId, minDate, maxDate), this.modals.categories.findOne({
				where: {
					category_id: masterCategoryId
				},
				attributes: [['category_name', 'name'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('category_id'), '/image/'), 'cImageURL']]
			})]);
			return promisedQuery.then(function (result) {
				var productList = result[0].map(function (item) {
					var product = item.toJSON();
					product.productMetaData.map(function (metaItem) {
						var metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});
					return product;
				});

				var distinctInsightWeekly = [];
				var distinctInsightMonthly = [];
				var distinctInsight = [];
				result[0].map(function (item) {
					var product = item.toJSON();
					var index = distinctInsight.findIndex(function (distinctItem) {
						return moment(distinctItem.date).valueOf() === moment(product.consumerBill.purchaseDate).utc().endOf('day').valueOf();
					});
					if (index === -1) {
						distinctInsight.push({
							value: product.value,
							month: monthArray[moment(product.consumerBill.purchaseDate).utc().month()],
							monthId: moment(product.consumerBill.purchaseDate).utc().month() + 1,
							date: moment(product.consumerBill.purchaseDate).utc().endOf('day'),
							week: weekAndDay(moment(product.consumerBill.purchaseDate).utc().endOf('day')).monthWeek,
							day: weekAndDay(moment(product.consumerBill.purchaseDate).utc().endOf('day')).day,
							totalCost: product.consumerBill.totalCost,
							totalTax: product.consumerBill.taxes,
							tax: product.taxes
						});
					} else {
						distinctInsight[index].value += product.value;
						distinctInsight[index].totalCost += product.consumerBill.totalCost;
						distinctInsight[index].totalTax += product.consumerBill.taxes;
						distinctInsight[index].tax += product.taxes;
					}

					return product;
				});

				var distinctInsightTemp = distinctInsight.map(function (item) {
					var dayItem = {
						value: item.value,
						month: item.month,
						monthId: item.monthId,
						date: item.date,
						week: item.week,
						day: item.day,
						totalCost: item.totalCost,
						totalTax: item.totalTax,
						tax: item.tax
					};
					var monthIndex = distinctInsightMonthly.findIndex(function (distinctItem) {
						return distinctItem.month === item.month;
					});
					var weekIndex = distinctInsightWeekly.findIndex(function (distinctItem) {
						return distinctItem.week === item.week;
					});
					if (weekIndex !== -1 && monthIndex !== -1) {
						var currentWeekInsight = distinctInsightWeekly[weekIndex];
						currentWeekInsight.value += item.value;
						currentWeekInsight.totalCost += item.totalCost;
						currentWeekInsight.totalTax += item.totalTax;
						currentWeekInsight.tax += item.tax;
					} else {
						distinctInsightWeekly.push(item);
					}

					if (monthIndex === -1) {
						distinctInsightMonthly.push(item);
					} else {
						var currentMonthInsight = distinctInsightMonthly[monthIndex];
						currentMonthInsight.value += item.value;
						currentMonthInsight.totalCost += item.totalCost;
						currentMonthInsight.totalTax += item.totalTax;
						currentMonthInsight.tax += item.tax;
					}

					return dayItem;
				});

				productList.sort(function (a, b) {
					return new Date(b.consumerBill.purchaseDate) - new Date(a.consumerBill.purchaseDate);
				});
				var productListWeekly = productList.filter(function (item) {
					return moment(item.consumerBill.purchaseDate).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('month').valueOf() && moment(item.consumerBill.purchaseDate).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('month').valueOf();
				}).slice(0, 10);
				var productListMonthly = productList.filter(function (item) {
					return moment(item.consumerBill.purchaseDate).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('year').valueOf() && moment(item.consumerBill.purchaseDate).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('year').valueOf();
				}).slice(0, 10);
				distinctInsightMonthly.sort(function (a, b) {
					return new Date(b.date) - new Date(a.date);
				});
				distinctInsightWeekly.sort(function (a, b) {
					return new Date(b.date) - new Date(a.date);
				});

				var insightData = distinctInsightTemp.filter(function (item) {
					return moment(item.consumerBill.purchaseDate).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('week').valueOf() && moment(item.consumerBill.purchaseDate).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('week').valueOf();
				});
				insightData.sort(function (a, b) {
					return new Date(b.date) - new Date(a.date);
				});

				var insightWeekly = distinctInsightWeekly.filter(function (item) {
					return moment(item.date).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('month').valueOf() && moment(item.date).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('month').valueOf();
				});
				var insightMonthly = distinctInsightMonthly.filter(function (item) {
					return moment(item.date).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('year').valueOf() && moment(item.date).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('year').valueOf();
				});
				return {
					status: true,
					productList: productList.filter(function (item) {
						return moment(item.consumerBill.purchaseDate).endOf('day').valueOf() >= moment.utc().startOf('week').startOf('week').valueOf() && moment(item.consumerBill.purchaseDate).endOf('day').valueOf() <= moment.utc().startOf('week').endOf('week').valueOf();
					}).slice(0, 10),
					productListWeekly: productListWeekly,
					productListMonthly: productListMonthly,
					insight: distinctInsight && distinctInsight.length > 0 ? {
						categoryName: result[1].name,
						startDate: moment.utc().startOf('week').startOf('week'),
						endDate: moment.utc().startOf('week').endOf('week'),
						currentMonthId: new Date().getMonth() + 1,
						currentWeek: weekAndDay(new Date()).monthWeek,
						currentDay: weekAndDay(new Date()).day,
						monthStartDate: moment.utc().startOf('week').startOf('month'),
						monthEndDate: moment.utc().startOf('week').endOf('month'),
						yearStartDate: moment.utc().startOf('week').startOf('year'),
						yearEndDate: moment.utc().startOf('week').endOf('year'),
						totalSpend: sumProps(insightData, 'value'),
						totalYearlySpend: sumProps(insightMonthly, 'value'),
						totalMonthlySpend: sumProps(insightWeekly, 'value'),
						totalDays: insightData.length,
						insightData: insightData,
						insightWeekly: insightWeekly,
						insightMonthly: insightMonthly
					} : {
						startDate: moment.utc().startOf('week').startOf('day'),
						endDate: moment.endOf('day'),
						totalSpend: 0,
						totalDays: 0,
						insightData: distinctInsight
					},
					categoryName: result[5],
					forceUpdate: request.pre.forceUpdate
				};
			}).catch(function (err) {
				console.log({ API_Logs: err });
				return {
					status: false,
					err: err,
					forceUpdate: request.pre.forceUpdate
				};
			});
		}
	}, {
		key: 'fetchProductDetails',
		value: function fetchProductDetails(user, masterCategoryId) {
			var whereClause = {
				user_id: user.ID,
				status_id: {
					$ne: 3
				},
				master_category_id: masterCategoryId
			};
			var dateWhereClause = {
				$gte: moment.utc().startOf('week').startOf('year'),
				$lte: moment.utc().startOf('week').endOf('year')
			};
			return this.modals.productBills.findAll({
				where: whereClause,
				include: [{
					model: this.modals.consumerBillDetails,
					as: 'consumerBill',
					where: {
						status_id: {
							$ne: 3
						},
						purchase_date: dateWhereClause
					},
					attributes: [['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
					include: [{
						model: this.modals.billDetailCopies,
						as: 'billDetailCopies',
						include: [{
							model: this.modals.billCopies,
							as: 'billCopies',
							attributes: []
						}],
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', '`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`'), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
					}, {
						model: this.modals.consumerBills,
						as: 'bill',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
								user_status: 5,
								admin_status: 5
							}]
						},
						attributes: []
					}, {
						model: this.modals.offlineSeller,
						as: 'productOfflineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
						},
						attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']],
						required: false
					}, {
						model: this.modals.onlineSeller,
						as: 'productOnlineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
						},
						attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
						required: false
					}],
					required: true
				}, {
					model: this.modals.table_brands,
					as: 'brand',
					attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
					required: false
				}, {
					model: this.modals.table_color,
					as: 'color',
					attributes: [['color_name', 'name'], ['color_id', 'id']],
					required: false
				}, {
					model: this.modals.amcBills,
					as: 'amcDetails',
					attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + 7 * 24 * 60 * 60 * 1000)
						}
					},
					required: false
				}, {
					model: this.modals.insuranceBills,
					as: 'insuranceDetails',
					attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + 7 * 24 * 60 * 60 * 1000)
						}
					},
					required: false
				}, {
					model: this.modals.warranty,
					as: 'warrantyDetails',
					attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + 7 * 24 * 60 * 60 * 1000)
						}
					},
					required: false
				}, {
					model: this.modals.productMetaData,
					as: 'productMetaData',
					attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
					include: [{
						model: this.modals.categoryForm, as: 'categoryForm', attributes: []
					}, {
						model: this.modals.categoryFormMapping,
						as: 'selectedValue',
						on: {
							$or: [this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`category_form_id`'), this.modals.sequelize.col('`productMetaData->categoryForm`.`category_form_id`'))]
						},
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`form_element_value`'), this.modals.sequelize.col('`productMetaData->selectedValue`.`mapping_id`')), this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`'), 2)]
						},
						attributes: [['dropdown_name', 'value']],
						required: false
					}],
					required: false
				}, {
					model: this.modals.categories,
					as: 'masterCategory',
					attributes: []
				}, {
					model: this.modals.categories,
					as: 'category',
					attributes: []
				}],
				attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}]);

	return InsightAdaptor;
}();

module.exports = InsightAdaptor;