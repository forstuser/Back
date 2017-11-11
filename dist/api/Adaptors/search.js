/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function uniqueBy(a, cond) {
	return a.filter(function (e, i) {
		return a.findIndex(function (e2) {
			return cond(e, e2);
		}) === i;
	});
}

var SearchAdaptor = function () {
	function SearchAdaptor(modals) {
		_classCallCheck(this, SearchAdaptor);

		this.modals = modals;
	}

	_createClass(SearchAdaptor, [{
		key: 'prepareSearchResult',
		value: function prepareSearchResult(user, searchValue) {
			return Promise.all([this.fetchProductDetails(user, '%' + searchValue + '%'), this.prepareCategoryData(user, '%' + searchValue + '%'), this.updateRecentSearch(user, searchValue), this.retrieveRecentSearch(user), this.fetchProductDetailOnline(user, '%' + searchValue + '%'), this.fetchProductDetailOffline(user, '%' + searchValue + '%'), this.fetchProductDetailBrand(user, '%' + searchValue + '%')]).then(function (result) {
				var productIds = [];
				var productList = result[0].map(function (item) {
					var product = item.toJSON();
					productIds.push(product.id);
					product.productMetaData.map(function (metaItem) {
						var metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});
					return product;
				});

				var productListOnline = result[4].map(function (item) {
					var product = item.toJSON();
					productIds.push(product.id);
					product.productMetaData.map(function (metaItem) {
						var metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});
					return product;
				});
				var productListOffline = result[5].map(function (item) {
					var product = item.toJSON();
					productIds.push(product.id);
					product.productMetaData.map(function (metaItem) {
						var metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});
					return product;
				});
				var productListBrand = result[6].map(function (item) {
					var product = item.toJSON();
					productIds.push(product.id);
					product.productMetaData.map(function (metaItem) {
						var metaData = metaItem;
						if (metaData.type === '2' && metaData.selectedValue) {
							metaData.value = metaData.selectedValue.value;
						}

						return metaData;
					});
					return product;
				});
				var categoryList = result[1].map(function (item) {
					var category = item.toJSON();
					category.products = category.products.filter(function (elem) {
						return productIds.indexOf(elem.id) < 0;
					});

					category.products.map(function (productItem) {
						productItem.productMetaData.map(function (metaItem) {
							var metaData = metaItem;
							if (metaData.type === '2' && metaData.selectedValue) {
								metaData.value = metaData.selectedValue.value;
							}

							return metaData;
						});

						return productItem;
					});
					return category;
				});

				productList = uniqueBy([].concat(_toConsumableArray(productList), _toConsumableArray(productListOnline), _toConsumableArray(productListOffline), _toConsumableArray(productListBrand)), function (item1, item2) {
					return item1.id === item2.id;
				});

				result[2][0].updateAttributes({
					resultCount: productList.length + categoryList.length,
					searchDate: _shared2.default.formatDate(new Date(), 'yyyy-mm-dd HH:MM:ss')
				});
				var recentSearches = result[3].map(function (item) {
					return item.toJSON();
				});
				return {
					status: true,
					message: 'Search successful',
					notificationCount: 0,
					recentSearches: recentSearches.map(function (item) {
						return item.searchValue;
					}),
					productDetails: productList,
					categoryList: categoryList
				};
			}).catch(function (err) {
				console.log({ API_Logs: err });
				return {
					status: false,
					message: 'EHome restore failed',
					err: err
				};
			});
		}
	}, {
		key: 'prepareCategoryData',
		value: function prepareCategoryData(user, searchValue) {
			return this.modals.categories.findAll({
				where: {
					$and: [{
						status_id: {
							$ne: 3
						}
					}, this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('categories.category_name')), { $like: this.modals.sequelize.fn('lower', searchValue) })]
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
					include: [{
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
							include: [{
								model: this.modals.billCopies,
								as: 'billCopies',
								attributes: []
							}],
							attributes: [[this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`products->consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], ['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`products->consumerBill->billDetailCopies`.bill_copy_id'), '/files'), 'fileUrl']]
						}, {
							model: this.modals.consumerBills,
							as: 'bill',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
									user_status: 5,
									admin_status: 5
								}]
							},
							attributes: []
						}, {
							model: this.modals.offlineSeller,
							as: 'productOfflineSeller',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
							},
							attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
							include: [{
								model: this.modals.offlineSellerDetails,
								as: 'sellerDetails',
								where: {
									status_id: {
										$ne: 3
									}
								},
								attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
								required: false
							}],
							required: false
						}, {
							model: this.modals.onlineSeller,
							as: 'productOnlineSeller',
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
							},
							attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
							include: [{
								model: this.modals.onlineSellerDetails,
								as: 'sellerDetails',
								where: {
									status_id: {
										$ne: 3
									}
								},
								attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
								required: false
							}],
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
							}
						},
						required: false
					}, {
						model: this.modals.productMetaData,
						as: 'productMetaData',
						attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('concat', this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('concat', this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_name`')), 'name']],
						include: [{
							model: this.modals.categoryForm, as: 'categoryForm', attributes: []
						}, {
							model: this.modals.categoryFormMapping,
							as: 'selectedValue',
							on: {
								$or: [this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData`.`category_form_id`'), this.modals.sequelize.col('`products->productMetaData->categoryForm`.`category_form_id`'))]
							},
							where: {
								$and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData`.`form_element_value`'), this.modals.sequelize.col('`products->productMetaData->selectedValue`.`mapping_id`')), this.modals.sequelize.where(this.modals.sequelize.col('`products->productMetaData->categoryForm`.`form_element_type`'), 2)]
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
          attributes: [
            [
              'bill_product_id',
              'id'],
            [
              'product_name',
              'productName'],
            [
              'value_of_purchase',
              'value'],
            'taxes',
            [
              'category_id',
              'categoryId'],
            [
              'main_category_id',
              'masterCategoryId'],
            [
              'brand_id',
              'brandId'],
            [
              'color_id',
              'colorId'],
            [
              this.modals.sequelize.fn('CONCAT', 'products/',
                  this.modals.sequelize.col('`products`.`bill_product_id`')),
              'productURL'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.col('`products`.`category_id`'),
                  '/image/'),
              'cImageURL']],
					order: [['bill_product_id', 'DESC']],
					required: false
				}],
				attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/image/'), 'cImageURL']],
				order: ['display_id']
			});
		}
	}, {
		key: 'updateRecentSearch',
		value: function updateRecentSearch(user, searchValue) {
			return this.modals.recentSearches.findOrCreate({
				where: {
					user_id: user.ID,
					searchValue: searchValue
				},
				default: {
					user_id: user.ID,
					searchValue: searchValue,
					resultCount: 0,
					searchDate: _shared2.default.formatDate(new Date(), 'yyyy-mm-dd HH:MM:ss')
				}
			});
		}
	}, {
		key: 'retrieveRecentSearch',
		value: function retrieveRecentSearch(user) {
			return this.modals.recentSearches.findAll({
				where: {
          user_id: user.id,
				},
				order: [['searchDate', 'DESC']],
				attributes: ['searchValue']
			});
		}
	}, {
		key: 'fetchProductDetails',
		value: function fetchProductDetails(user, searchValue) {
			return this.modals.productBills.findAll({
				where: {
					$and: [{
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					}, this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('product_name')), { $like: this.modals.sequelize.fn('lower', searchValue) })]
				},
				include: [{
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
						include: [{
							model: this.modals.billCopies,
							as: 'billCopies',
							attributes: []
						}],
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies`.bill_copy_id'), '/files'), 'fileUrl']]
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
						attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
						include: [{
							model: this.modals.offlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: false
					}, {
						model: this.modals.onlineSeller,
						as: 'productOnlineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
						},
						attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
						include: [{
							model: this.modals.onlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
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
        attributes: [
          [
            'bill_product_id',
            'id'],
          [
            'product_name',
            'productName'],
          [
            'value_of_purchase',
            'value'],
          'taxes',
          [
            'category_id',
            'categoryId'],
          [
            this.modals.sequelize.col('`masterCategory`.`category_name`'),
            'masterCategoryName'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.col('`category`.`category_name`'),
            'categoryName'],
          [
            'brand_id',
            'brandId'],
          [
            'color_id',
            'colorId'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.col('`productBills`.`bill_product_id`')),
            'productURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('`productBills`.`category_id`'),
                '/image/'),
            'cImageURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}, {
		key: 'fetchProductDetailOnline',
		value: function fetchProductDetailOnline(user, searchValue) {
			return this.modals.productBills.findAll({
				where: {
					$and: [{
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					}]
				},
				include: [{
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
						include: [{
							model: this.modals.billCopies,
							as: 'billCopies',
							attributes: []
						}],
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies`.bill_copy_id'), '/files'), 'fileUrl']]
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
						attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
						include: [{
							model: this.modals.offlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: false
					}, {
						model: this.modals.onlineSeller,
						as: 'productOnlineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1), this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.literal('`consumerBill->productOnlineSeller`.`seller_name`')), { $like: this.modals.sequelize.fn('lower', searchValue) })]
						},
						attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
						include: [{
							model: this.modals.onlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: true
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
        attributes: [
          [
            'bill_product_id',
            'id'],
          [
            'product_name',
            'productName'],
          [
            'value_of_purchase',
            'value'],
          'taxes',
          [
            'category_id',
            'categoryId'],
          [
            this.modals.sequelize.col('`masterCategory`.`category_name`'),
            'masterCategoryName'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.col('`category`.`category_name`'),
            'categoryName'],
          [
            'brand_id',
            'brandId'],
          [
            'color_id',
            'colorId'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.col('`productBills`.`bill_product_id`')),
            'productURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('`productBills`.`category_id`'),
                '/image/'),
            'cImageURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}, {
		key: 'fetchProductDetailOffline',
		value: function fetchProductDetailOffline(user, searchValue) {
			return this.modals.productBills.findAll({
				where: {
					$and: [{
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					}]
				},
				include: [{
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
						include: [{
							model: this.modals.billCopies,
							as: 'billCopies',
							attributes: []
						}],
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies`.bill_copy_id'), '/files'), 'fileUrl']]
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
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2), this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('`consumerBill->productOfflineSeller`.`offline_seller_name`')), { $like: this.modals.sequelize.fn('lower', searchValue) })]
						},
						attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
						include: [{
							model: this.modals.offlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: true
					}, {
						model: this.modals.onlineSeller,
						as: 'productOnlineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
						},
						attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
						include: [{
							model: this.modals.onlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
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
        attributes: [
          [
            'bill_product_id',
            'id'],
          [
            'product_name',
            'productName'],
          [
            'value_of_purchase',
            'value'],
          'taxes',
          [
            'category_id',
            'categoryId'],
          [
            this.modals.sequelize.col('`masterCategory`.`category_name`'),
            'masterCategoryName'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.col('`category`.`category_name`'),
            'categoryName'],
          [
            'brand_id',
            'brandId'],
          [
            'color_id',
            'colorId'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.col('`productBills`.`bill_product_id`')),
            'productURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('`productBills`.`category_id`'),
                '/image/'),
            'cImageURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}, {
		key: 'fetchProductDetailBrand',
		value: function fetchProductDetailBrand(user, searchValue) {
			return this.modals.productBills.findAll({
				where: {
					$and: [{
						user_id: user.ID,
						status_id: {
							$ne: 3
						}
					}]
				},
				include: [{
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
						include: [{
							model: this.modals.billCopies,
							as: 'billCopies',
							attributes: []
						}],
						attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies`.bill_copy_id'), '/files'), 'fileUrl']]
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
						attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
						include: [{
							model: this.modals.offlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: false
					}, {
						model: this.modals.onlineSeller,
						as: 'productOnlineSeller',
						where: {
							$and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
						},
						attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
						include: [{
							model: this.modals.onlineSellerDetails,
							as: 'sellerDetails',
							where: {
								status_id: {
									$ne: 3
								}
							},
							attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
							required: false
						}],
						required: false
					}],
					required: true
				}, {
					model: this.modals.table_brands,
					as: 'brand',
					where: {
						$and: [this.modals.sequelize.where(this.modals.sequelize.fn('lower', this.modals.sequelize.col('brand_name')), { $like: this.modals.sequelize.fn('lower', searchValue) })]
					},
					attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
					required: true
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
        attributes: [
          [
            'bill_product_id',
            'id'],
          [
            'product_name',
            'productName'],
          [
            'value_of_purchase',
            'value'],
          'taxes',
          [
            'category_id',
            'categoryId'],
          [
            this.modals.sequelize.col('`masterCategory`.`category_name`'),
            'masterCategoryName'],
          [
            'main_category_id',
            'masterCategoryId'],
          [
            this.modals.sequelize.col('`category`.`category_name`'),
            'categoryName'],
          [
            'brand_id',
            'brandId'],
          [
            'color_id',
            'colorId'],
          [
            this.modals.sequelize.fn('CONCAT', 'products/',
                this.modals.sequelize.col('`productBills`.`bill_product_id`')),
            'productURL'],
          [
            this.modals.sequelize.fn('CONCAT', 'categories/',
                this.modals.sequelize.col('`productBills`.`category_id`'),
                '/image/'),
            'cImageURL']],
				order: [['bill_product_id', 'DESC']]
			});
		}
	}]);

	return SearchAdaptor;
}();

exports.default = SearchAdaptor;