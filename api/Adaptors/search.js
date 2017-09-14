/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

const dueDays = {
	Yearly: 365, HalfYearly: 180, Quarterly: 90, Monthly: 30, Weekly: 7, Daily: 1
};

class SearchAdaptor {
	constructor(modals) {
		this.modals = modals;
	}

	prepareSearchResult(user, searchValue) {
		return Promise.all([
			this.fetchProductDetails(user, `%${searchValue}%`),
			this.prepareCategoryData(user, `%${searchValue}%`),
			this.updateRecentSearch(user, searchValue),
			this.retrieveRecentSearch(user)
		]).then((result) => {
			const productIds = [];
			const productList = result[0].map((item) => {
				const product = item.toJSON();
				productIds.push(product.id);
				product.productMetaData.map((metaItem) => {
					const metaData = metaItem;
					if (metaData.type === '2' && metaData.selectedValue) {
						metaData.value = metaData.selectedValue.value;
					}

					return metaData;
				});
				return product;
			});
			const categoryList = result[1].map((item) => {
				const category = item.toJSON();
				category.products = category.products.filter((elem) => {
					return (productIds.indexOf(elem.id) < 0);
				});

				category.products.map((productItem) => {
					productItem.productMetaData.map((metaItem) => {
						const metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});

					return productItem;
				});
				return category;
			});


			result[2][0].updateAttributes({
				resultCount: productList.length + categoryList.length,
				searchDate: shared.formatDate(new Date(), 'yyyy-mm-dd HH:MM:ss')
			});
			const recentSearches = result[3].map(item => item.toJSON());
			return {
				status: true,
				message: 'Search successful',
				notificationCount: 0,
				recentSearches: recentSearches.map(item => item.searchValue),
				productDetails: productList,
				categoryList
			};
		}).catch(err => ({
			status: false,
			message: 'EHome restore failed',
			err
		}));
	}

	prepareCategoryData(user, searchValue) {
		return this.modals.categories.findAll({
			where: {
				$and: [
					{
						status_id: {
							$ne: 3
						}
					},
					this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('categories.category_name')), {$like: this.modals.sequelize.fn('lower', searchValue)})]
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
				on: {
					$or: {
						category_id: this.modals.sequelize.where(this.modals.sequelize.col('categories.category_id'), '=', this.modals.sequelize.col('products.category_id'))
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
						attributes: [['invoice_number', 'invoiceNo'], ['purchase_date', 'purchaseDate']],
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
										this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
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
									$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
								},
								attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']],
								required: false
							},
							{
								model: this.modals.onlineSeller,
								as: 'productOnlineSeller',
								where: {
									$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
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
								$gt: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? (dueDays[this.modals.sequelize.col('premiumType')] - 30) : 7) * 24 * 60 * 60 * 1000)),
								$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
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
								$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
								$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
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
								$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
								$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
							}
						},
						required: false
					},
					{
						model: this.modals.productMetaData,
						as: 'productMetaData',
						attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('concat', this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('concat', this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_name`')), 'name']],
						include: [{
							model: this.modals.categoryForm, as: 'categoryForm', attributes: []
						},
							{
								model: this.modals.categoryFormMapping,
								as: 'selectedValue',
								on: {
									$or: [
										this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData`.`category_form_id`'), this.modals.sequelize.col('`products->productMetaData->categoryForm`.`category_form_id`'))
									]
								},
								where: {
									$and: [
										this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData`.`form_element_value`'), this.modals.sequelize.col('`products->productMetaData->selectedValue`.`mapping_id`')),
										this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_type`'), 2)]
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
				attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`products`.`bill_product_id`')), 'productURL'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`products`.`category_id`'), '/image/'), 'cImageURL']],
				order: [['bill_product_id', 'DESC']],
				required: false
			}],
			attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/image/'), 'cImageURL']],
			order: ['display_id']
		});
	}

	updateRecentSearch(user, searchValue) {
		return this.modals.recentSearches.findOrCreate({
			where: {
				user_id: user.ID,
				searchValue
			},
			default: {
				user_id: user.ID,
				searchValue,
				resultCount: 0,
				searchDate: shared.formatDate(new Date(), 'yyyy-mm-dd HH:MM:ss')
			}
		});
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

	fetchProductDetails(user, searchValue) {
		return this.modals.productBills.findAll({
			where: {
				$and: [
					{
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					},
					this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('product_name')), {$like: this.modals.sequelize.fn('lower', searchValue)})]
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
					attributes: [['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
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
							$gt: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? (dueDays[this.modals.sequelize.col('premiumType')] - 30) : 7) * 24 * 60 * 60 * 1000)),
							$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
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
							$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
							$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
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
							$gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000)),
							$lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ? dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
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
			attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`productBills`.`category_id`'), '/image/'), 'cImageURL']],
			order: [['bill_product_id', 'DESC']]
		});
	}
}

module.exports = SearchAdaptor;
