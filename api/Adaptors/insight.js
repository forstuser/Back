/*jshint esversion: 6 */
'use strict';

const moment = require('moment');
const shared = require('../../helpers/shared');
const _ = require('lodash');

function weekAndDay(d) {
	const days = [1, 2, 3, 4, 5, 6, 7];
	const prefixes = [1, 2, 3, 4, 5];

	return {monthWeek: prefixes[Math.round(d.date() / 7)], day: days[d.day()]};
}

const dateFormatString = 'yyyy-mm-dd';
const monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const date = new Date();
const monthStartDay = new Date(date.getFullYear(), date.getMonth(), 1);
const monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
const yearStartDay = new Date(date.getFullYear(), 0, 1);
const yearLastDay = new Date(date.getFullYear() + 1, 0, 0);

function customSortCategories(categoryData) {
	const OtherCategory = categoryData.find((elem) => {
		return elem.cType === 9;
	});

	const categoryDataWithoutOthers = categoryData.filter((elem) => {
		return (elem.cType !== 9);
	});

	const newCategoryData = [];

	let pushed = false;

	categoryDataWithoutOthers.forEach((elem) => {
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

class InsightAdaptor {
	constructor(modals) {
		this.modals = modals;
	}

	prepareInsightData(user, request) {
		const minDate = request.query.mindate;
		const maxDate = request.query.maxdate;
		return this.prepareCategoryData(user, minDate, maxDate)
			.then((result) => {
				const categoryData = !(minDate || maxDate) ? {
					weeklyData: result[0].map((periodItem) => {
						const categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					monthlyData: result[1].map((periodItem) => {
						const categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					}),
					yearlyData: result[2].map((periodItem) => {
						const categoryPeriodItem = periodItem.toJSON();
						categoryPeriodItem.totalAmount = (categoryPeriodItem.totalAmount || 0).toFixed(2);
						categoryPeriodItem.totalTax = (categoryPeriodItem.totalTax || 0).toFixed(2);
						// categoryPeriodItem.totalAmount += categoryPeriodItem.totalTax;
						return categoryPeriodItem;
					})
				} : {
					customDateData: result.map((item) => {
						const categoryItem = item.toJSON();
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

					const totalAmounts = shared.sumProps(categoryData.customDateData, 'totalAmount');
					const totalTaxes = shared.sumProps(categoryData.customDateData, 'totalTax');
					return {
						status: true,
						message: 'Insight restore successful',
						notificationCount: '2',
						categoryData,
						totalSpend: totalAmounts,
						totalTaxes,
						startDate: minDate,
						endDate: maxDate,
						forceUpdate: request.pre.forceUpdate
					};
				}

				categoryData.weeklyData = _.chain(categoryData.weeklyData).map((elem) => {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.monthlyData = _.chain(categoryData.monthlyData).map((elem) => {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.yearlyData = _.chain(categoryData.yearlyData).map((elem) => {
					elem.totalAmount = parseFloat(elem.totalAmount);
					return elem;
				}).orderBy(['totalAmount', 'cName'], ['desc', 'asc']).map((elem) => {
					elem.totalAmount = elem.totalAmount.toString();
					return elem;
				}).value();

				categoryData.weeklyData = customSortCategories(categoryData.weeklyData, 'totalAmount');
				categoryData.monthlyData = customSortCategories(categoryData.monthlyData, 'totalAmount');
				categoryData.yearlyData = customSortCategories(categoryData.yearlyData, 'totalAmount');

				const totalWeeklyAmounts = shared.sumProps(categoryData.weeklyData, 'totalAmount');
				const totalWeeklyTaxes = shared.sumProps(categoryData.weeklyData, 'totalTax');
				const totalYearlyAmounts = shared.sumProps(categoryData.yearlyData, 'totalAmount');
				const totalYearlyTaxes = shared.sumProps(categoryData.yearlyData, 'totalTax');
				const totalMonthlyAmounts = shared.sumProps(categoryData.monthlyData, 'totalAmount');
				const totalMonthlyTaxes = shared.sumProps(categoryData.monthlyData, 'totalTax');
				return {
					status: true,
					message: 'Insight restore successful',
					notificationCount: 0,
					categoryData,
					weekStartDate: shared.formatDate(moment.utc().subtract(6, 'd').startOf('d'), dateFormatString),
					monthStartDate: shared.formatDate(monthStartDay, dateFormatString),
					weekEndDate: shared.formatDate(moment.utc(), dateFormatString),
					monthLastDate: shared.formatDate(monthLastDay, dateFormatString),
					yearStartDate: shared.formatDate(yearStartDay, dateFormatString),
					yearEndDate: shared.formatDate(yearLastDay, dateFormatString),
					totalYearlySpend: totalYearlyAmounts,
					totalWeeklySpend: totalWeeklyAmounts,
					totalWeeklyTaxes,
					totalYearlyTaxes,
					totalMonthlySpend: totalMonthlyAmounts,
					totalMonthlyTaxes,
					forceUpdate: request.pre.forceUpdate
				};
			}).catch(err => {
				console.log(err);
				return ({
					status: false,
					message: 'Insight restore failed',
					err,
					forceUpdate: request.pre.forceUpdate
				});
			});
	}

	prepareCategoryData(user, minDate, maxDate) {
		return !(minDate || maxDate) ? Promise.all([this.modals.categories
			.findAll({
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
										this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
										{
											user_status: 5,
											admin_status: 5
										}
									]
								},
								attributes: []
							}
						],
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
			}), this.modals.categories
			.findAll({
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
						include: [
							{
								model: this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [
										this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
										{
											user_status: 5,
											admin_status: 5
										}
									]
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
			}),
			this.modals.categories.findAll({
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
						include: [
							{
								model: this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [
										this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
										{
											user_status: 5,
											admin_status: 5
										}
									]
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
			})]) : this.modals.categories
			.findAll({
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
								$gte: minDate ? new Date(minDate) : monthStartDay,
								$lte: maxDate ? new Date(maxDate) : monthLastDay
							}
						},
						attributes: [],
						include: [
							{
								model: this.modals.consumerBills,
								as: 'bill',
								where: {
									$and: [
										this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
										{
											user_status: 5,
											admin_status: 5
										}
									]
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

	prepareCategoryInsight(user, request) {
		const masterCategoryId = request.params.id;
		const minDate = request.query.mindate;
		const maxDate = request.query.maxdate;
		const promisedQuery = Promise
			.all([this.fetchProductDetails(user, masterCategoryId, minDate, maxDate),
				this.modals.categories.findOne({
					where: {
						category_id: masterCategoryId
					},
					attributes: [['category_name', 'name']]
				})]);
		return promisedQuery.then((result) => {
			const productList = result[0].map((item) => {
				const product = item.toJSON();
				product.purchaseDate = product.consumerBill.purchaseDate;
				product.productMetaData.map((metaItem) => {
					const metaData = metaItem;
					if (metaData.type === '2' && metaData.selectedValue) {
						metaData.value = metaData.selectedValue.value;
					}

					return metaData;
				});
				return product;
			});
			const distinctInsightWeekly = [];
			const distinctInsightMonthly = [];
			const distinctInsight = [];
			result[0].map((item) => {
				const product = item.toJSON();
				const index = distinctInsight
					.findIndex(distinctItem => (new Date(distinctItem.date)
						.getTime() === new Date(product.consumerBill.purchaseDate).getTime()));
				if (index === -1) {
					distinctInsight.push({
						value: product.value,
						month: monthArray[moment(product.consumerBill.purchaseDate).month()],
						monthId: moment(product.consumerBill.purchaseDate).month() + 1,
						purchaseDate: moment(product.consumerBill.purchaseDate),
						week: weekAndDay(moment(product.consumerBill.purchaseDate)).monthWeek,
						day: weekAndDay(moment(product.consumerBill.purchaseDate)).day,
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

			const distinctInsightTemp = distinctInsight.map((item) => {
				const dayItem = {
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

				const monthItem = {
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
				const monthIndex = distinctInsightMonthly
					.findIndex(distinctItem => (distinctItem.month === item.month));
				const weekIndex = distinctInsightWeekly
					.findIndex(distinctItem => (distinctItem.week === item.week));
				if (weekIndex !== -1 && monthIndex !== -1) {
					const currentWeekInsight = distinctInsightWeekly[weekIndex];
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
					const currentMonthInsight = distinctInsightMonthly[monthIndex];
					currentMonthInsight.value += monthItem.value;
					currentMonthInsight.totalCost += monthItem.totalCost;
					currentMonthInsight.totalTax += monthItem.totalTax;
					currentMonthInsight.tax += monthItem.tax;
				}

				return dayItem;
			});

			productList.sort((a, b) => moment(b
				.purchaseDate) - moment(a
				.purchaseDate));
			const productListWeekly = productList
				.filter(item => moment(item
					.purchaseDate).valueOf() >= moment.utc().startOf('month').valueOf() && moment(item
					.purchaseDate).valueOf() <= moment.utc().valueOf()).slice(0, 10);
			const productListMonthly = productList
				.filter(item => moment(item
					.purchaseDate).valueOf() >= moment(moment.utc().startOf('year').valueOf()) && moment(item
					.purchaseDate).valueOf() <= moment(moment.utc()).valueOf()).slice(0, 10);
			distinctInsightMonthly.sort((a, b) => moment(b.purchaseDate) - moment(a.purchaseDate));
			distinctInsightWeekly.sort((a, b) => moment(b.purchaseDate) - moment(a.purchaseDate));

			const insightData = shared.retrieveDaysInsight(distinctInsightTemp
				.filter(item => moment(item.purchaseDate).valueOf() >= moment.utc().subtract(6, 'd').startOf('d').valueOf() && moment(item.purchaseDate).valueOf() <= moment.utc().valueOf()));
			insightData.sort((a, b) => moment(a.purchaseDate) - moment(b.purchaseDate));

			const insightWeekly = distinctInsightWeekly
				.filter(item => moment(item.purchaseDate).valueOf() >= moment.utc().startOf('month').valueOf() && moment(item.purchaseDate).valueOf() <= moment.utc().valueOf());
			const insightMonthly = distinctInsightMonthly
				.filter(item => moment(item.purchaseDate).valueOf() >= moment.utc().startOf('year').valueOf() && moment(item.purchaseDate).valueOf() <= moment.utc().valueOf());
			return {
				status: true,
				productList: productList
					.filter(item => moment(item.purchaseDate).valueOf() >= moment.utc().subtract(6, 'd').startOf('d').valueOf() && moment(item.purchaseDate).valueOf() <= moment.utc().valueOf()).slice(0, 10),
				productListWeekly,
				productListMonthly,
				insight: distinctInsight && distinctInsight.length > 0 ? {
					categoryName: result[1].name,
					startDate: moment.utc().subtract(6, 'd').startOf('d'),
					endDate: moment.utc(),
					currentMonthId: moment.utc().month() + 1,
					currentWeek: weekAndDay(moment.utc()).monthWeek,
					currentDay: weekAndDay(moment.utc()).day,
					monthStartDate: moment.utc().startOf('month'),
					monthEndDate: moment.utc(),
					yearStartDate: moment.utc().startOf('year'),
					yearEndDate: moment.utc(),
					totalSpend: shared.sumProps(insightData, 'value'),
					totalYearlySpend: shared.sumProps(insightMonthly, 'value'),
					totalMonthlySpend: shared.sumProps(insightWeekly, 'value'),
					totalDays: insightData.length,
					insightData,
					insightWeekly,
					insightMonthly
				} : {
					startDate: moment.utc().subtract(6, 'd').startOf('d'),
					endDate: moment.utc(),
					totalSpend: 0,
					totalDays: 0,
					insightData: distinctInsight,
				},
				categoryName: result[5],
				forceUpdate: request.pre.forceUpdate
			};
		}).catch((err) => {
			console.log(err);
			return {
				status: false,
				err,
				forceUpdate: request.pre.forceUpdate
			};
		});
	}

	fetchProductDetails(user, masterCategoryId) {
		const whereClause = {
			user_id: user.ID,
			status_id: {
				$ne: 3
			},
			master_category_id: masterCategoryId
		};
		const dateWhereClause = {
			$gte: moment.utc().startOf('year'),
			$lte: moment.utc()
		};
		return this.modals.productBills.findAll({
			where: whereClause,
			include: [
				{
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
						},
						{
							model: this.modals.offlineSeller,
							as: 'productOfflineSeller',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
							},
							attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']],
							required: false
						},
						{
							model: this.modals.onlineSeller,
							as: 'productOnlineSeller',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
							},
							attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
							required: false
						}],
					required: true
				},
				{
					model: this.modals.table_brands,
					as: 'brand',
					attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
					required: false
				},
				{
					model: this.modals.table_color,
					as: 'color',
					attributes: [['color_name', 'name'], ['color_id', 'id']],
					required: false
				},
				{
					model: this.modals.amcBills,
					as: 'amcDetails',
					attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
						}
					},
					required: false
				},
				{
					model: this.modals.insuranceBills,
					as: 'insuranceDetails',
					attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
						}
					},
					required: false
				},
				{
					model: this.modals.warranty,
					as: 'warrantyDetails',
					attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
					where: {
						user_id: user.ID,
						status_id: {
							$ne: 3
						},
						expiryDate: {
							$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
						}
					},
					required: false
				},
				{
					model: this.modals.productMetaData,
					as: 'productMetaData',
					attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
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
				}, {
					model: this.modals.categories,
					as: 'masterCategory',
					attributes: []
				}, {
					model: this.modals.categories,
					as: 'category',
					attributes: []
				}],
			attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col(`category.category_id`), '/image/'), 'cImageURL'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
			order: [['bill_product_id', 'DESC']]
		});
	}
}

module.exports = InsightAdaptor;
