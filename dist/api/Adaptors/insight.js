/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function weekAndDay(d) {
	var days = [1, 2, 3, 4, 5, 6, 7];
	var prefixes = [1, 2, 3, 4, 5];

	return { monthWeek: prefixes[Math.round(d.date() / 7)], day: days[d.day()] };
}

var dateFormatString = 'yyyy-mm-dd';
var monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var date = new Date();
var monthStartDay = new Date(date.getFullYear(), date.getMonth(), 1);
var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
var yearStartDay = new Date(date.getFullYear(), 0, 1);
var yearLastDay = new Date(date.getFullYear() + 1, 0, 0);

function customSortCategories(categoryData) {
	var OtherCategory = categoryData.find(function (elem) {
		return elem.cType === 9;
	});

	var categoryDataWithoutOthers = categoryData.filter(function (elem) {
		return elem.cType !== 9;
	});

	var newCategoryData = [];

	var pushed = false;

	categoryDataWithoutOthers.forEach(function (elem) {
		if (parseFloat(OtherCategory.totalAmount) > parseFloat(elem.totalAmount) && !pushed) {
			newCategoryData.push(OtherCategory);
			pushed = true;
		}
		newCategoryData.push(elem);
	});

	if (!pushed) {
		newCategoryData.push(OtherCategory);
	}

	return newCategoryData;
}

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
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					monthlyData: result[1].map(function (periodItem) {
						var categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					yearlyData: result[2].map(function (periodItem) {
						var categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					})
				} : {
					customDateData: result.map(function (item) {
						var categoryItem = item.toJSON();
						categoryItem.totalAmount = (categoryItem.totalAmount || 0).toFixed(2);
						categoryItem.totalTax = (categoryItem.totalTax || 0).toFixed(2);
						// categoryItem.totalAmount += categoryItem.totalTax;
						return categoryItem;
					})
				};

				if (minDate || maxDate) {
					categoryData.customDateData.sort(function (a, b) {
						return b.totalAmount - a.totalAmount || a.cName < b.cName;
					});

					var totalAmounts = _shared2.default.sumProps(categoryData.customDateData, 'totalAmount');
					var totalTaxes = _shared2.default.sumProps(categoryData.customDateData, 'totalTax');
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

				categoryData.weeklyData = _lodash2.default.chain(categoryData.weeklyData).map(function (elem) {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.monthlyData = _lodash2.default.chain(categoryData.monthlyData).map(function (elem) {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.yearlyData = _lodash2.default.chain(categoryData.yearlyData).map(function (elem) {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map(function (elem) {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.weeklyData = customSortCategories(categoryData.weeklyData, 'totalAmount');
				categoryData.monthlyData = customSortCategories(categoryData.monthlyData, 'totalAmount');
				categoryData.yearlyData = customSortCategories(categoryData.yearlyData, 'totalAmount');

				var totalWeeklyAmounts = _shared2.default.sumProps(categoryData.weeklyData, 'totalAmount');
				var totalWeeklyTaxes = _shared2.default.sumProps(categoryData.weeklyData, 'totalTax');
				var totalYearlyAmounts = _shared2.default.sumProps(categoryData.yearlyData, 'totalAmount');
				var totalYearlyTaxes = _shared2.default.sumProps(categoryData.yearlyData, 'totalTax');
				var totalMonthlyAmounts = _shared2.default.sumProps(categoryData.monthlyData, 'totalAmount');
				var totalMonthlyTaxes = _shared2.default.sumProps(categoryData.monthlyData, 'totalTax');
				return {
					status: true,
					message: 'Insight restore successful',
					notificationCount: 0,
					categoryData: categoryData,
					weekStartDate: _shared2.default.formatDate(_moment2.default.utc().subtract(6, 'd').startOf('d'), dateFormatString),
					monthStartDate: _shared2.default.formatDate(monthStartDay, dateFormatString),
					weekEndDate: _shared2.default.formatDate(_moment2.default.utc(), dateFormatString),
					monthLastDate: _shared2.default.formatDate(monthLastDay, dateFormatString),
					yearStartDate: _shared2.default.formatDate(yearStartDay, dateFormatString),
					yearEndDate: _shared2.default.formatDate(yearLastDay, dateFormatString),
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
					},
					category_id: {
						$ne: 10
					},
					display_id: {
						$ne: 10
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
								$lte: _moment2.default.utc(),
								$gte: _moment2.default.utc().subtract(6, 'd').startOf('d')
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
					},
					category_id: {
						$ne: 10
					},
					display_id: {
						$ne: 10
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
								$gte: new Date(monthStartDay),
								$lte: new Date(monthLastDay)
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
					},
					category_id: {
						$ne: 10
					},
					display_id: {
						$ne: 10
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
								$gte: new Date(yearStartDay),
								$lte: new Date(yearLastDay)
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
					},
					category_id: {
						$ne: 10
					},
					display_id: {
						$ne: 10
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
								$gte: minDate ? _moment2.default.utc(minDate, "YYYY-MM-DD").format() : monthStartDay,
								$lte: maxDate ? _moment2.default.utc(maxDate, "YYYY-MM-DD").format() : monthLastDay
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
				attributes: [['category_name', 'name']]
			})]);
			return promisedQuery.then(function (result) {
				var productList = result[0].map(function (item) {
					var product = item.toJSON();
					product.purchaseDate = product.consumerBill.purchaseDate;
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
						return new Date(distinctItem.date).getTime() === new Date(product.consumerBill.purchaseDate).getTime();
					});
					if (index === -1) {
						distinctInsight.push({
							value: product.value,
							month: monthArray[(0, _moment2.default)(product.consumerBill.purchaseDate).month()],
							monthId: (0, _moment2.default)(product.consumerBill.purchaseDate).month() + 1,
							purchaseDate: (0, _moment2.default)(product.consumerBill.purchaseDate),
							week: weekAndDay((0, _moment2.default)(product.consumerBill.purchaseDate)).monthWeek,
							day: weekAndDay((0, _moment2.default)(product.consumerBill.purchaseDate)).day,
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
						purchaseDate: item.purchaseDate,
						week: item.week,
						day: item.day,
						totalCost: item.totalCost,
						totalTax: item.totalTax,
						tax: item.tax
					};

					var monthItem = {
						value: item.value,
						month: item.month,
						monthId: item.monthId,
						purchaseDate: item.purchaseDate,
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
						distinctInsightMonthly.push(monthItem);
					} else {
						var currentMonthInsight = distinctInsightMonthly[monthIndex];
						currentMonthInsight.value += monthItem.value;
						currentMonthInsight.totalCost += monthItem.totalCost;
						currentMonthInsight.totalTax += monthItem.totalTax;
						currentMonthInsight.tax += monthItem.tax;
					}

					return dayItem;
				});

				productList.sort(function (a, b) {
					return (0, _moment2.default)(b.purchaseDate) - (0, _moment2.default)(a.purchaseDate);
				});
				var productListWeekly = productList.filter(function (item) {
					return (0, _moment2.default)(item.purchaseDate).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && (0, _moment2.default)(item.purchaseDate).valueOf() <= _moment2.default.utc().valueOf();
				}).slice(0, 10);
				var productListMonthly = productList.filter(function (item) {
					return (0, _moment2.default)(item.purchaseDate).valueOf() >= (0, _moment2.default)(_moment2.default.utc().startOf('year').valueOf()) && (0, _moment2.default)(item.purchaseDate).valueOf() <= (0, _moment2.default)(_moment2.default.utc()).valueOf();
				}).slice(0, 10);
				distinctInsightMonthly.sort(function (a, b) {
					return (0, _moment2.default)(b.purchaseDate) - (0, _moment2.default)(a.purchaseDate);
				});
				distinctInsightWeekly.sort(function (a, b) {
					return (0, _moment2.default)(b.purchaseDate) - (0, _moment2.default)(a.purchaseDate);
				});

				var insightData = _shared2.default.retrieveDaysInsight(distinctInsightTemp.filter(function (item) {
					return (0, _moment2.default)(item.purchaseDate).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('d').valueOf() && (0, _moment2.default)(item.purchaseDate).valueOf() <= _moment2.default.utc().valueOf();
				}));
				insightData.sort(function (a, b) {
					return (0, _moment2.default)(a.purchaseDate) - (0, _moment2.default)(b.purchaseDate);
				});

				var insightWeekly = distinctInsightWeekly.filter(function (item) {
					return (0, _moment2.default)(item.purchaseDate).valueOf() >= _moment2.default.utc().startOf('month').valueOf() && (0, _moment2.default)(item.purchaseDate).valueOf() <= _moment2.default.utc().valueOf();
				});
				var insightMonthly = distinctInsightMonthly.filter(function (item) {
					return (0, _moment2.default)(item.purchaseDate).valueOf() >= _moment2.default.utc().startOf('year').valueOf() && (0, _moment2.default)(item.purchaseDate).valueOf() <= _moment2.default.utc().valueOf();
				});
				return {
					status: true,
					productList: productList.filter(function (item) {
						return (0, _moment2.default)(item.purchaseDate).valueOf() >= _moment2.default.utc().subtract(6, 'd').startOf('d').valueOf() && (0, _moment2.default)(item.purchaseDate).valueOf() <= _moment2.default.utc().valueOf();
					}).slice(0, 10),
					productListWeekly: productListWeekly,
					productListMonthly: productListMonthly,
					insight: distinctInsight && distinctInsight.length > 0 ? {
						categoryName: result[1].name,
						startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
						endDate: _moment2.default.utc(),
						currentMonthId: _moment2.default.utc().month() + 1,
						currentWeek: weekAndDay(_moment2.default.utc()).monthWeek,
						currentDay: weekAndDay(_moment2.default.utc()).day,
						monthStartDate: _moment2.default.utc().startOf('month'),
						monthEndDate: _moment2.default.utc(),
						yearStartDate: _moment2.default.utc().startOf('year'),
						yearEndDate: _moment2.default.utc(),
						totalSpend: _shared2.default.sumProps(insightData, 'value'),
						totalYearlySpend: _shared2.default.sumProps(insightMonthly, 'value'),
						totalMonthlySpend: _shared2.default.sumProps(insightWeekly, 'value'),
						totalDays: insightData.length,
						insightData: insightData,
						insightWeekly: insightWeekly,
						insightMonthly: insightMonthly
					} : {
						startDate: _moment2.default.utc().subtract(6, 'd').startOf('d'),
						endDate: _moment2.default.utc(),
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
				$gte: _moment2.default.utc().startOf('year'),
				$lte: _moment2.default.utc()
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
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.literal('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`'), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
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
				attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('category.category_id'), '/image/'), 'cImageURL'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}]);

	return InsightAdaptor;
}();

exports.default = InsightAdaptor;