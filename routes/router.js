/*jshint esversion: 6 */
'use strict';

const joi = require('joi');
const passport = require('passport');
const Path = require('path');

const PassportService = require('../config/passport');

const UserController = require('../api/controllers/user');
const CategoryController = require('../api/controllers/category');
const BrandController = require('../api/controllers/brand');
const UploadController = require('../api/controllers/upload');
const SellerController = require('../api/controllers/seller');
const ServiceCenterController = require('../api/controllers/serviceCenter');
const BillManagementController = require('../api/controllers/consumerBillManagement');
const ExclusionInclusionController = require('../api/controllers/exclusionInclusion');
const ReferenceDataController = require('../api/controllers/referenceData');
const UserManagementController = require('../api/controllers/userManagement');
const DashboardController = require('../api/controllers/dashboard');
const ProductController = require('../api/controllers/product');
const InsightController = require('../api/controllers/insight');
const SearchController = require('../api/controllers/search');
const GeneralController = require('../api/controllers/general');
const AppVersionHelper = require('../helpers/appVersion');

let User;
let appVersionHelper;

function associateModals(modals) {
	modals.brandDetails.belongsTo(modals.table_brands, {foreignKey: 'brand_id', as: 'brand'});
	modals.categories.hasMany(modals.brandDetails, {foreignKey: 'category_id', as: 'details'});
	modals.table_brands.hasMany(modals.brandDetails, {foreignKey: 'brand_id', as: 'details'});

	modals.authorizedServiceCenter.belongsTo(modals.table_brands, {foreignKey: 'brand_id', as: 'brand'});
	modals.table_brands.hasMany(modals.authorizedServiceCenter, {foreignKey: 'brand_id', as: 'center'});

	modals.authorizeServiceCenterDetail.belongsTo(modals.authorizedServiceCenter, {
		foreignKey: 'center_id',
		as: 'center'
	});
	modals.authorizedServiceCenter.hasMany(modals.authorizeServiceCenterDetail, {
		foreignKey: 'center_id',
		as: 'centerDetails'
	});

	modals.productMetaData.hasOne(modals.categoryFormMapping, {as: 'selectedValue', foreignKey: 'category_form_id'});
	modals.offlineSeller.hasMany(modals.offlineSellerDetails, {as: 'sellerDetails', foreignKey: 'offline_seller_id'});
	modals.onlineSeller.hasMany(modals.onlineSellerDetails, {as: 'sellerDetails', foreignKey: 'seller_id'});
	modals.table_brands.hasOne(modals.brandReviews, {as: 'brandReviews', foreignKey: 'brand_id'});
	modals.productBills.hasOne(modals.productReviews, {as: 'productReviews', foreignKey: 'bill_product_id'});
	modals.offlineSeller.hasOne(modals.sellerReviews, {as: 'sellerReviews', foreignKey: 'offline_seller_id'});
	modals.onlineSeller.hasOne(modals.sellerReviews, {as: 'sellerReviews', foreignKey: 'seller_id'});
	modals.categories.hasMany(modals.categories, {as: 'subCategories', foreignKey: 'ref_id', otherKey: 'category_id'});
	modals.categories.hasMany(modals.productBills, {
		foreignKey: 'master_category_id', as: 'products'
	});
	modals.productBills.belongsTo(modals.categories, {
		foreignKey: 'master_category_id', as: 'masterCategory'
	});
	modals.productBills.belongsTo(modals.categories, {
		foreignKey: 'category_id', as: 'category'
	});
	modals.productBills.belongsTo(modals.table_brands, {
		foreignKey: 'brand_id', as: 'brand'
	});
	modals.productBills.belongsTo(modals.table_color, {
		foreignKey: 'color_id', as: 'color'
	});
	modals.productBills.belongsToMany(modals.consumerBills, {
		foreignKey: 'ref_id', as: 'productBillMaps', through: modals.billMapping, where: {bill_ref_type: 2}
	});
	modals.consumerBills.belongsToMany(modals.productBills, {
		foreignKey: 'bill_id', as: 'billProductMaps', through: modals.billMapping, where: {bill_ref_type: 2}
	});
	modals.userImages.belongsTo(modals.table_users, {foreignKey: 'user_id', as: 'user'});
	modals.table_users.hasMany(modals.userImages, {foreignKey: 'user_id', as: 'userImages'});
	modals.consumerBills.belongsTo(modals.table_users, {foreignKey: 'user_id', as: 'consumer'});
	modals.table_users.hasMany(modals.consumerBills);
	modals.consumerBills.belongsToMany(modals.consumerBillDetails, {
		foreignKey: 'bill_id',
		through: modals.billMapping,
		otherKey: 'ref_id',
		as: 'billDetails'
	});
	modals.consumerBillDetails.belongsToMany(modals.consumerBills, {
		foreignKey: 'ref_id',
		as: 'bill',
		through: modals.billMapping,
		where: {bill_ref_type: 1},
		otherKey: 'bill_id'
	});
	modals.consumerBillDetails.belongsToMany(modals.offlineSeller, {
		through: modals.billSellerMapping,
		foreignKey: 'bill_detail_id',
		as: 'productOfflineSeller',
		otherKey: 'seller_ref_id',
		where: {
			ref_type: 2
		}
	});
	modals.consumerBillDetails.belongsToMany(modals.onlineSeller, {
		through: modals.billSellerMapping,
		foreignKey: 'bill_detail_id',
		as: 'productOnlineSeller',
		otherKey: 'seller_ref_id',
		where: {
			ref_type: 1
		}
	});
	modals.consumerBillDetails.hasMany(modals.productBills, {foreignKey: 'bill_detail_id', as: 'products'});
	modals.productBills.belongsTo(modals.consumerBillDetails, {foreignKey: 'bill_detail_id', as: 'consumerBill'});
	modals.productBills.hasMany(modals.productMetaData, {foreignKey: 'bill_product_id', as: 'productMetaData'});
	modals.productMetaData.belongsTo(modals.categoryForm, {foreignKey: 'category_form_id', as: 'categoryForm'});
	modals.productBills.hasMany(modals.amcBills, {foreignKey: 'bill_product_id', as: 'amcDetails'});
	modals.amcBills.belongsTo(modals.productBills, {foreignKey: 'bill_product_id', as: 'amcProduct'});
	modals.productBills.hasMany(modals.insuranceBills, {
		foreignKey: 'bill_product_id',
		as: 'insuranceDetails'
	});
	modals.insuranceBills.belongsTo(modals.productBills, {
		foreignKey: 'bill_product_id',
		as: 'insuredProduct'
	});

	modals.table_brands.hasMany(modals.insuranceBills, {
		foreignKey: 'seller_id',
		as: 'insuranceBills'
	});
	modals.insuranceBills.belongsTo(modals.table_brands, {
		foreignKey: 'seller_id',
		as: 'brand'
	});

	modals.offlineSeller.hasMany(modals.insuranceBills, {
		foreignKey: 'seller_id',
		as: 'insuranceBills'
	});
	modals.insuranceBills.belongsTo(modals.offlineSeller, {
		foreignKey: 'seller_id',
		as: 'offlineSeller'
	});

	modals.productBills.hasMany(modals.mailBox, {
		foreignKey: 'bill_product_id',
		as: 'mails'
	});
	modals.mailBox.belongsTo(modals.productBills, {
		foreignKey: 'bill_product_id',
		as: 'product'
	});
	modals.mailBox.belongsToMany(modals.billCopies, {
		foreignKey: 'notification_id',
		through: modals.mailboxCopies,
		as: 'copies',
		otherKey: 'bill_copy_id'
	});


	modals.productBills.hasMany(modals.repairBills, {
		foreignKey: 'bill_product_id',
		as: 'repairBills'
	});
	modals.repairBills.belongsTo(modals.productBills, {
		foreignKey: 'bill_product_id',
		as: 'repairBills'
	});

	modals.table_brands.hasMany(modals.repairBills, {
		foreignKey: 'seller_id',
		as: 'repairBills'
	});
	modals.repairBills.belongsTo(modals.table_brands, {
		foreignKey: 'seller_id',
		as: 'brand'
	});

	modals.offlineSeller.hasMany(modals.repairBills, {
		foreignKey: 'seller_id',
		as: 'repairBills'
	});
	modals.repairBills.belongsTo(modals.offlineSeller, {
		foreignKey: 'seller_id',
		as: 'offlineSeller'
	});

	modals.repairBillCopies.belongsTo(modals.billCopies, {foreignKey: 'bill_copy_id', as: 'billCopies'});
	modals.repairBills.hasMany(modals.repairBillCopies, {foreignKey: 'bill_repair_id', as: 'copies'});

	modals.productBills.hasMany(modals.warranty, {foreignKey: 'bill_product_id', as: 'warrantyDetails'});

	modals.exclusions.belongsTo(modals.categories, {foreignKey: 'category_id', as: 'categories'});
	modals.inclusions.belongsTo(modals.categories, {foreignKey: 'category_id', as: 'categories'});

	modals.table_brands.hasMany(modals.amcBills, {
		foreignKey: 'seller_id',
		as: 'amcBills'
	});
	modals.amcBills.belongsTo(modals.table_brands, {
		foreignKey: 'seller_id',
		as: 'brand'
	});

	modals.offlineSeller.hasMany(modals.amcBills, {
		foreignKey: 'seller_id',
		as: 'amcBills'
	});
	modals.amcBills.belongsTo(modals.offlineSeller, {
		foreignKey: 'seller_id',
		as: 'offlineSeller'
	});

	modals.amcBills.belongsToMany(modals.exclusions, {
		foreignKey: 'bill_amc_id',
		through: modals.amcExclusion,
		as: 'exclusions',
		otherKey: 'exclusions_id'
	});
	modals.amcBills.belongsToMany(modals.inclusions, {
		foreignKey: 'bill_amc_id',
		through: modals.amcInclusion,
		as: 'inclusions',
		otherKey: 'inclusions_id'
	});

	modals.insuranceBills.belongsToMany(modals.exclusions, {
		foreignKey: 'bill_insurance_id',
		through: modals.insuranceExclusion,
		as: 'exclusions',
		otherKey: 'exclusions_id'
	});
	modals.insuranceBills.belongsToMany(modals.inclusions, {
		foreignKey: 'bill_insurance_id',
		through: modals.insuranceInclusion,
		as: 'inclusions',
		otherKey: 'inclusions_id'
	});

	modals.warranty.belongsToMany(modals.exclusions, {
		foreignKey: 'bill_warranty_id',
		through: modals.warrantyExclusion,
		as: 'exclusions',
		otherKey: 'exclusions_id'
	});
	modals.warranty.belongsToMany(modals.inclusions, {
		foreignKey: 'bill_warranty_id',
		through: modals.warrantyInclusion,
		as: 'inclusions',
		otherKey: 'inclusions_id'
	});

	modals.table_brands.hasMany(modals.warranty, {
		foreignKey: 'seller_id',
		as: 'warranty'
	});
	modals.warranty.belongsTo(modals.table_brands, {
		foreignKey: 'seller_id',
		as: 'brand'
	});

	modals.offlineSeller.hasMany(modals.warranty, {
		foreignKey: 'seller_id',
		as: 'warranty'
	});
	modals.warranty.belongsTo(modals.offlineSeller, {
		foreignKey: 'seller_id',
		as: 'offlineSeller'
	});

	modals.warranty.belongsTo(modals.productBills, {foreignKey: 'bill_product_id', as: 'warrantyProduct'});
	modals.warrantyCopies.belongsTo(modals.billCopies, {foreignKey: 'bill_copy_id', as: 'billCopies'});
	modals.amcBillCopies.belongsTo(modals.billCopies, {foreignKey: 'bill_copy_id', as: 'billCopies'});
	modals.insuranceBillCopies.belongsTo(modals.billCopies, {foreignKey: 'bill_copy_id', as: 'billCopies'});
	modals.billDetailCopies.belongsTo(modals.billCopies, {foreignKey: 'bill_copy_id', as: 'billCopies'});
	modals.warranty.hasMany(modals.warrantyCopies, {foreignKey: 'bill_warranty_id', as: 'warrantyCopies'});
	modals.amcBills.hasMany(modals.amcBillCopies, {foreignKey: 'bill_amc_id', as: 'amcCopies'});
	modals.insuranceBills.hasMany(modals.insuranceBillCopies, {
		foreignKey: 'bill_insurance_id',
		as: 'insuranceCopies'
	});
	modals.consumerBillDetails.hasMany(modals.billDetailCopies, {
		foreignKey: 'bill_detail_id',
		as: 'billDetailCopies'
	});
	modals.consumerBills.hasMany(modals.billCopies, {
		foreignKey: 'bill_id',
		as: 'billCopies'
	});
}

// NO APP VERSION CHECK
function prepareSellerRoutes(sellerController, sellerRoutes) {
	if (sellerController) {
		// Add Online Seller
		sellerRoutes.push({
			method: 'POST',
			path: '/admin/sellers',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.addSeller,
				validate: {
					payload: {
						TokenNo: joi.string().required(),
						Name: joi.string().required(),
						URL: joi.allow(null),
						GstinNo: joi.allow(null),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		sellerRoutes.push({
			method: 'POST',
			path: '/admin/sellers/{id}/details',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.addSellerDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Edit Seller
		sellerRoutes.push({
			method: 'PUT',
			path: '/admin/sellers/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.updateSeller,
				validate: {
					payload: {
						Name: joi.string().required(),
						Description: joi.string(),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		sellerRoutes.push({
			method: 'PUT',
			path: '/admin/sellers/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.updateSellerDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Delete Seller
		sellerRoutes.push({
			method: 'DELETE',
			path: '/admin/sellers/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.deleteSeller
			}
		});

		// Delete Seller Detail
		sellerRoutes.push({
			method: 'DELETE',
			path: '/admin/sellers/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.deleteSellerDetail
			}
		});

		// Get Seller List
		sellerRoutes.push({
			method: 'GET',
			path: '/admin/sellers',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.retrieveSeller
			}
		});

		sellerRoutes.push({
			method: 'GET',
			path: '/admin/sellers/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.retrieveSellerById
			}
		});

		// Add Offline Seller
		sellerRoutes.push({
			method: 'POST',
			path: '/admin/sellers/offline',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.addOfflineSeller,
				validate: {
					payload: {
						TokenNo: joi.string().required(),
						Name: joi.string().required(),
						OwnerName: [joi.string(), joi.allow(null)],
						GstinNo: [joi.string(), joi.allow(null)],
						PanNo: [joi.string(), joi.allow(null)],
						RegNo: [joi.string(), joi.allow(null)],
						ServiceProvider: [joi.number().integer(), joi.allow(null)],
						Onboarded: [joi.number().integer(), joi.allow(null)],
						HouseNo: [joi.string(), joi.allow(null)],
						Block: [joi.string(), joi.allow(null)],
						Street: [joi.string(), joi.allow(null)],
						Sector: [joi.string(), joi.allow(null)],
						City: joi.string().required(),
						State: joi.string().required(),
						PinCode: [joi.number().integer(), joi.allow(null)],
						NearBy: [joi.string(), joi.allow(null)],
						Latitude: [joi.string(), joi.allow(null)],
						Longitude: [joi.string(), joi.allow(null)],
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		sellerRoutes.push({
			method: 'POST',
			path: '/admin/sellers/offline/{id}/details',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.addOfflineSellerDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Edit Offline Seller
		sellerRoutes.push({
			method: 'PUT',
			path: '/admin/sellers/offline',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.updateOfflineSeller,
				validate: {
					payload: {
						TokenNo: joi.string().required(),
						ID: joi.number().integer().required(),
						Name: joi.string().required(),
						OwnerName: [joi.string(), joi.allow(null)],
						GstinNo: [joi.string(), joi.allow(null)],
						PanNo: [joi.string(), joi.allow(null)],
						RegNo: [joi.string(), joi.allow(null)],
						ServiceProvider: [joi.number().integer(), joi.allow(null)],
						Onboarded: [joi.number().integer(), joi.allow(null)],
						HouseNo: [joi.string(), joi.allow(null)],
						Block: [joi.string(), joi.allow(null)],
						Street: [joi.string(), joi.allow(null)],
						Sector: [joi.string(), joi.allow(null)],
						City: joi.string().required(),
						State: joi.string().required(),
						PinCode: [joi.number().integer(), joi.allow(null)],
						NearBy: [joi.string(), joi.allow(null)],
						Latitude: [joi.string(), joi.allow(null)],
						Longitude: [joi.string(), joi.allow(null)],
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		sellerRoutes.push({
			method: 'PUT',
			path: '/admin/sellers/offline/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.updateOfflineSellerDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Delete Offline Seller
		sellerRoutes.push({
			method: 'DELETE',
			path: '/admin/sellers/offline/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.deleteOfflineSeller
			}
		});

		sellerRoutes.push({
			method: 'DELETE',
			path: '/admin/sellers/offline/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.deleteOfflineSellerDetail
			}
		});

		// Get Offline Seller List
		sellerRoutes.push({
			method: 'GET',
			path: '/admin/sellers/offline',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.retrieveOfflineSeller
			}
		});

		sellerRoutes.push({
			method: 'GET',
			path: '/admin/sellers/offline/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SellerController.retrieveOfflineSellerById
			}
		});
	}
}

function prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes) {
	if (serviceCenterController) {
		// Add Authorized Service Center
		serviceCenterRoutes.push({
			method: 'POST',
			path: '/admin/servicecenters',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.addServiceCenter,
				validate: {
					payload: {
						BrandID: joi.number().integer().required(),
						Name: joi.string().required(),
						HouseNo: joi.allow(null),
						Block: joi.allow(null),
						Street: joi.allow(null),
						Sector: joi.allow(null),
						City: joi.string().required(),
						State: joi.string().required(),
						PinCode: joi.allow(null),
						NearBy: joi.allow(null),
						Latitude: joi.allow(null),
						Longitude: joi.allow(null),
						OpenDays: joi.string(),
						Timings: joi.string(),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		serviceCenterRoutes.push({
			method: 'POST',
			path: '/admin/servicecenters/{id}/details',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.addServiceCenterDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Edit Authorized Service Center
		serviceCenterRoutes.push({
			method: 'PUT',
			path: '/admin/servicecenters/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.updateServiceCenter,
				validate: {
					payload: {
						BrandID: joi.number().integer().required(),
						Name: joi.string().required(),
						HouseNo: joi.allow(null),
						Block: joi.allow(null),
						Street: joi.allow(null),
						Sector: joi.allow(null),
						City: joi.string().required(),
						State: joi.string().required(),
						PinCode: joi.allow(null),
						NearBy: joi.allow(null),
						Latitude: joi.allow(null),
						Longitude: joi.allow(null),
						OpenDays: joi.string(),
						Timings: joi.string(),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		serviceCenterRoutes.push({
			method: 'PUT',
			path: '/admin/servicecenters/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.updateServiceCenterDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Delete Authorized Service Center
		serviceCenterRoutes.push({
			method: 'DELETE',
			path: '/admin/servicecenters/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.deleteServiceCenter
			}
		});

		// Delete Authorized Service Center Detail
		serviceCenterRoutes.push({
			method: 'DELETE',
			path: '/admin/servicecenters/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.deleteServiceCenterDetail
			}
		});
		// Get Authorized Service Center List
		serviceCenterRoutes.push({
			method: 'GET',
			path: '/admin/servicecenters',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.retrieveServiceCenters
			}
		});

		serviceCenterRoutes.push({
			method: 'POST',
			path: '/consumer/servicecenters',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.retrieveServiceCenters,
				validate: {
					payload: {
						location: [joi.string(), joi.allow(null)],
						city: [joi.string(), joi.allow(null)],
						searchValue: [joi.string(), joi.allow(null)],
						longitude: [joi.string(), joi.allow(null)],
						latitude: [joi.string(), joi.allow(null)],
						categoryId: [joi.number(), joi.allow(null)],
						masterCategoryId: [joi.number(), joi.allow(null)],
						brandId: [joi.number(), joi.allow(null)],
						output: 'data',
						parse: true
					}
				}
			}
		});

		serviceCenterRoutes.push({
			method: 'GET',
			path: '/consumer/servicecenters',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.retrieveServiceCenters
			}
		});
		serviceCenterRoutes.push({
			method: 'GET',
			path: '/consumer/servicecenters/filters',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.retrieveServiceCenterFilters
			}
		});

		// Get Authorized Service Center By ID
		serviceCenterRoutes.push({
			method: 'GET',
			path: '/admin/servicecenters/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ServiceCenterController.retrieveServiceCenterById
			}
		});
	}
}

function prepareBrandRoutes(brandController, brandRoutes) {
	if (brandController) {
		// Get brands
		brandRoutes.push({
			method: "GET",
			path: "/brands",
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.getBrands,
			}
		});

		// Add Brand
		brandRoutes.push({
			method: 'POST',
			path: '/admin/brands',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.addBrand,
				validate: {
					payload: {
						Name: joi.string().required(),
						Description: joi.string(),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		brandRoutes.push({
			method: 'POST',
			path: '/admin/brands/{id}/details',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.addBrandDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Edit Brand
		brandRoutes.push({
			method: 'PUT',
			path: '/admin/brands/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.updateBrand,
				validate: {
					payload: {
						Name: joi.string().required(),
						Description: joi.string(),
						Details: joi.array(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		brandRoutes.push({
			method: 'PUT',
			path: '/admin/brands/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.updateBrandDetail,
				validate: {
					payload: {
						DetailTypeID: joi.number().integer().required(),
						DisplayName: joi.string().required(),
						Details: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});
		// Delete Brand
		brandRoutes.push({
			method: 'DELETE',
			path: '/admin/brands/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.deleteBrand
			}
		});

		// Delete Brand Detail
		brandRoutes.push({
			method: 'DELETE',
			path: '/admin/brands/{id}/details/{detailid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.deleteBrandDetail
			}
		});

		// Get Brand List
		brandRoutes.push({
			method: 'GET',
			path: '/admin/brands',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.retrieveBrand
			}
		});

		brandRoutes.push({
			method: 'GET',
			path: '/admin/brands/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BrandController.retrieveBrandById
			}
		});
	}
}

// NO APP VERSION CHECK
function prepareCategoryRoutes(categoryController, categoryRoutes) {
	if (categoryController) {
		// Add Category
		categoryRoutes.push({
			method: 'POST',
			path: '/admin/categories',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: CategoryController.addCategory,
				validate: {
					payload: {
						Name: joi.string().required(),
						Level: joi.number().integer().required(),
						RefID: [joi.number().integer(), joi.allow(null)],
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 201, message: 'Created'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		// Edit Category
		categoryRoutes.push({
			method: 'PUT',
			path: '/admin/categories/{id}',
			config: {
				handler: CategoryController.updateCategory,
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				validate: {
					params: {
						id: joi.number().integer().required()
					},
					payload: {
						Name: joi.string().required(),
						RefID: [joi.number().integer(), joi.allow(null)],
						Level: joi.number().integer(),
						output: 'data',
						parse: true
					}
				}
			}
		});
		// Delete Category
		categoryRoutes.push({
			method: 'DELETE',
			path: '/admin/categories/{id}',
			config: {
				handler: CategoryController.deleteCategory,
				auth: 'jwt'
			}
		});
		// Category List
		categoryRoutes.push({
			method: 'GET',
			path: '/admin/categories',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: CategoryController.retrieveCategory
			}
		});
		// Category By Id
		categoryRoutes.push({
			method: 'GET',
			path: '/admin/categories/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: CategoryController.retrieveCategoryById
			}
		});

		categoryRoutes.push({
			method: 'GET',
			path: '/categories',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: CategoryController.getCategories
			}
		})
	}
}

// NO APP VERSION CHECK
function prepareUserManagementRoutes(userManagementController, authRoutes) {
	if (userManagementController) {
		// Add Category
		authRoutes.push({
			method: 'POST',
			path: '/admin/user/management',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserManagementController.addUser,
				validate: {
					payload: {
						UserTypeID: joi.number().integer().required(),
						Name: joi.string().required(),
						GoogleAuthKey: joi.string(),
						FacebookAuthKey: joi.string(),
						EmailAddress: joi.string().required(),
						PhoneNo: joi.string(),
						Password: joi.string(),
						OTP: joi.string(),
						Location: joi.string(),
						Latitude: joi.string(),
						Longitude: joi.string(),
						ImageLink: joi.string(),
						OSTypeId: joi.string(),
						accessLevel: joi.string(),
						GCMId: joi.string(),
						passwordResetToken: joi.string(),
						token: joi.string(),
						expiresIn: joi.number(),
						deviceId: joi.string(),
						deviceModel: joi.string(),
						apkVersion: joi.string(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 201, message: 'Created'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		// Edit Category
		authRoutes.push({
			method: 'PUT',
			path: '/admin/user/management/{id}',
			config: {
				handler: UserManagementController.updateUsers,
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				validate: {
					params: {
						id: joi.number().integer().required()
					},
					payload: {
						UserTypeID: joi.number().integer().required(),
						Name: joi.string().required(),
						GoogleAuthKey: joi.string(),
						FacebookAuthKey: joi.string(),
						EmailAddress: joi.string().required(),
						PhoneNo: joi.string(),
						Password: joi.string(),
						OTP: joi.string(),
						Location: joi.string(),
						Latitude: joi.string(),
						Longitude: joi.string(),
						ImageLink: joi.string(),
						OSTypeId: joi.string(),
						accessLevel: joi.string(),
						GCMId: joi.string(),
						passwordResetToken: joi.string(),
						token: joi.string(),
						expiresIn: joi.number(),
						deviceId: joi.string(),
						deviceModel: joi.string(),
						apkVersion: joi.string(),
						output: 'data',
						parse: true
					}
				}
			}
		});
		// Delete Category
		authRoutes.push({
			method: 'DELETE',
			path: '/admin/user/management/{id}',
			config: {
				handler: UserManagementController.deleteUsers,
				auth: 'jwt'
			}
		});
		// Category List
		authRoutes.push({
			method: 'GET',
			path: '/admin/user/management',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserManagementController.retrieveUsers
			}
		});
		// Category By Id
		authRoutes.push({
			method: 'GET',
			path: '/admin/user/management/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserManagementController.retrieveUserByID
			}
		});
	}
}

// NO APP VERSION CHECK
function prepareBillManagementRoutes(billManagementController, billManagementRoutes) {
	if (billManagementController) {
		billManagementRoutes.push({
			method: 'POST',
			path: '/admin/billtoce',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.assignTaskTOCE,
				validate: {
					payload: {
						UserID: joi.number().integer().required(),
						BillID: joi.number().integer().required(),
						Comments: joi.string(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 201, message: 'Created'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		billManagementRoutes.push({
			method: 'POST',
			path: '/admin/billtoqe',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.assignTaskTOQE,
				validate: {
					payload: {
						UserID: joi.number().integer().required(),
						BillID: joi.number().integer().required(),
						Comments: joi.string(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 201, message: 'Created'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		billManagementRoutes.push({
			method: 'POST',
			path: '/qe/billtoce',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.qeAssignTaskTOCE,
				validate: {
					payload: {
						UserID: joi.number().integer().required(),
						BillID: joi.number().integer().required(),
						Comments: joi.string(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 204, message: 'Updated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		billManagementRoutes.push({
			method: 'GET',
			path: '/admin/bills',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.retrieveAdminConsumerBillList
			}
		});

		billManagementRoutes.push({
			method: 'GET',
			path: '/ce/bills',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.retrieveCEBills
			}
		});

		billManagementRoutes.push({
			method: 'GET',
			path: '/qe/bills',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: BillManagementController.retrieveQEBills
			}
		});
	}
}

// NO APP VERSION CHECK
function prepareExclusionInclusionRoutes(exclusionInclusionController, categoryRoutes) {
	if (exclusionInclusionController) {
		// Add Exclusions
		categoryRoutes.push({
			method: 'POST',
			path: '/admin/exclusions',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.addExclusions,
				validate: {
					payload: {
						Name: joi.string().required(),
						CatID: joi.number().integer().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		categoryRoutes.push({
			method: 'POST',
			path: '/admin/inclusions',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.addInclusions,
				validate: {
					payload: {
						Name: joi.string().required(),
						CatID: joi.number().integer().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		// Edit Exclusions
		categoryRoutes.push({
			method: 'PUT',
			path: '/admin/exclusions/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.updateExclusions,
				validate: {
					payload: {
						Name: joi.string().required(),
						CatID: joi.number().integer().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		categoryRoutes.push({
			method: 'PUT',
			path: '/admin/inclusions/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.updateInclusions,
				validate: {
					payload: {
						Name: joi.string().required(),
						CatID: joi.number().integer().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});
		// Delete Exclusions
		categoryRoutes.push({
			method: 'DELETE',
			path: '/admin/exclusions/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.deleteExclusions
			}
		});

		// Delete Inclusions
		categoryRoutes.push({
			method: 'DELETE',
			path: '/admin/inclusions/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.deleteInclusions
			}
		});

		categoryRoutes.push({
			method: 'GET',
			path: '/admin/exclusions',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.retrieveExclusions
			}
		});

		categoryRoutes.push({
			method: 'GET',
			path: '/admin/inclusions',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ExclusionInclusionController.retrieveInclusions
			}
		});
	}
}

// NO APP VERSION CHECK
function prepareReferenceData(referenceDataController, referenceDataRoutes) {
	if (referenceDataController) {
		referenceDataRoutes.push({
			method: 'POST',
			path: '/admin/colors',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.addColors,
				validate: {
					payload: {
						Name: joi.string().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		referenceDataRoutes.push({
			method: 'PUT',
			path: '/admin/colors/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.updateColors,
				validate: {
					payload: {
						Name: joi.string().required(),
						output: 'data',
						parse: true
					}
				}
			}
		});

		referenceDataRoutes.push({
			method: 'DELETE',
			path: '/admin/colors/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.deleteColors
			}
		});

		referenceDataRoutes.push({
			method: 'GET',
			path: '/admin/colors',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.retrieveColors
			}
		});

		referenceDataRoutes.push({
			method: 'GET',
			path: '/admin/colors/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.retrieveColorsById
			}
		});

		referenceDataRoutes.push({
			method: 'GET',
			path: '/admin/usertypes',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ReferenceDataController.retrieveUserTypes
			}
		});
	}
}

function prepareAuthRoutes(userController, authRoutes) {
//= ========================
	// Auth Routes
	//= ========================

	if (userController) {
		// Registration route
		authRoutes.push({
			method: 'POST',
			path: '/admin/register',
			config: {
				handler: UserController.register,
				auth: null,
				description: 'Register User for Admin Portal.',
				tags: ['api', 'User', 'Authentication'],
				validate: {
					payload: {
						emailAddress: joi.string().email().required(),
						password: joi.string().required(),
						fullName: joi.string().required(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'POST',
			path: '/consumer/getotp',
			config: {
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserController.dispatchOTP,
				description: 'Generate OTP.',
				tags: ['api', 'User', 'Authentication'],
				validate: {
					payload: {
						PhoneNo: joi.string().required(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'PUT',
			path: '/consumer/profile',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserController.updateUserProfile,
				description: 'Update User Profile.',
				validate: {
					payload: {
						phoneNo: joi.string(),
						location: [joi.string(), joi.allow(null)],
						longitude: [joi.string(), joi.allow(null)],
						latitude: [joi.string(), joi.allow(null)],
						osTypeId: [joi.string(), joi.allow(null)],
						gcmId: [joi.string(), joi.allow(null)],
						email: [joi.string(), joi.allow(null, '')],
						oldEmail: [joi.string(), joi.allow(null, '')],
						deviceId: [joi.string(), joi.allow(null)],
						deviceModel: [joi.string(), joi.allow(null)],
						apkVersion: [joi.string(), joi.allow(null)],
						name: [joi.string(), joi.allow(null, '')],
						isEnrolled: [joi.boolean(), joi.allow(null)],
						categoryId: [joi.number(), joi.allow(null)],
						isPhoneAllowed: [joi.boolean(), joi.allow(null)],
						isEmailAllowed: [joi.boolean(), joi.allow(null)],
						description: [joi.string(), joi.allow(null, '')],
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 202, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'GET',
			path: '/consumer/profile',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserController.retrieveUserProfile,
				description: 'Get User Profile.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'GET',
			path: '/verify/{token}',
			config: {
				handler: UserController.verifyEmailAddress,
				description: 'Verify Email Address.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'GET',
			path: '/consumer/nearby',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserController.retrieveNearBy,
				description: 'Get User Profile.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});
		// Login route
		authRoutes.push({
			method: 'POST',
			path: '/consumer/validate',
			config: {
				handler: UserController.validateOTP,
				description: 'Register User for Consumer Portal.',
				tags: ['api', 'User', 'Authentication'],
				validate: {
					payload: {
						Token: joi.number(),
						TrueObject: {
							EmailAddress: joi.string().email(),
							PhoneNo: joi.string().required(),
							Name: joi.string(),
							ImageLink: joi.string()
						},
						TruePayload: joi.string(),
						fcmId: joi.string(),
						BBLogin_Type: joi.number().required(),
						advSub: joi.string(),
						transactionId: joi.string(),
						TrueSecret: joi.string(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		// Login route
		authRoutes.push({
			method: 'POST',
			path: '/admin/login',
			config: {
				handler: UserController.login,
				auth: false,
				description: 'Login User.',
				tags: ['api', 'User', 'Authentication'],
				validate: {
					payload: {
						UserName: joi.string().required(),
						Password: joi.string().required(),
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 202, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		authRoutes.push({
			method: 'POST',
			path: '/consumer/logout',
			config: {
				handler: UserController.logout,
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				description: 'Logout User.',
				tags: ['api', 'User', 'Authentication'],
				validate: {
					payload: joi.object({
						fcmId: [joi.string()],
						output: 'data',
						parse: true
					}).allow(null)
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 202, message: 'Authenticated'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		// authRoutes.push({
		// 	method: 'POST',
		// 	path: '/test',
		// 	config: {
		// 		pre: [
		// 			{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
		// 		],
		// 		handler: function (request, reply) {
		// 			console.log(request.pre);
		// 			return reply({status: true});
		// 		}
		// 	}
		// });
	}
}

function prepareUploadRoutes(uploadController, uploadFileRoute) {
	if (uploadController) {
		uploadFileRoute.push({
			method: 'POST',
			path: '/consumer/upload/selfie',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				files: {
					relativeTo: Path.join(__dirname, '../static/src')
				},
				handler: UploadController.uploadUserImage,
				payload: {
					output: 'stream',
					parse: true,
					uploads: 'up_files',
					timeout: 30034,
					allow: 'multipart/form-data',
					failAction: 'log',
					maxBytes: 209715200
				}
			}
		});
		uploadFileRoute.push({
			method: 'POST',
			path: '/consumer/upload',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				files: {
					relativeTo: Path.join(__dirname, '../static/src')
				},
				handler: UploadController.uploadFiles,
				payload: {
					output: 'stream',
					parse: true,
					uploads: 'up_files',
					timeout: 30034,
					allow: 'multipart/form-data',
					failAction: 'log',
					maxBytes: 209715200
				}
			}
		});
		uploadFileRoute.push({
			method: 'GET',
			path: '/bills/{id}/files',
			config: {
				// auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UploadController.retrieveFiles
			}
		});
		uploadFileRoute.push({
			method: 'DELETE',
			path: '/bills/{id}/files',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UploadController.deleteFile
			}
		});
		uploadFileRoute.push({
			method: 'GET',
			path: '/consumer/{id}/images',
			config: {
				// auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UploadController.retrieveUserImage
			}
		});
		uploadFileRoute.push({
			method: 'GET',
			path: '/categories/{id}/image/{type}',
			config: {
				handler: UploadController.retrieveCategoryImage
			}
		});
	}
}

function prepareDashboardRoutes(dashboardController, dashboardRoutes) {
	if (dashboardController) {
		dashboardRoutes.push({
			method: 'GET',
			path: '/consumer/dashboard',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.getDashboard
			}
		});
		dashboardRoutes.push({
			method: 'GET',
			path: '/consumer/ehome',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.getEHome
			}
		});
		dashboardRoutes.push({
			method: 'GET',
			path: '/categories/{id}/products',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.getProductsInCategory
			}
		});
		dashboardRoutes.push({
			method: 'GET',
			path: '/consumer/mailbox',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.getMailbox
			}
		});

		dashboardRoutes.push({
			method: 'POST',
			path: '/consumer/mailbox/read',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.updateNotificationStatus,
				validate: {
					payload: {
						notificationIds: joi.array().items(joi.number()).required().min(0),
						output: 'data',
						parse: true
					}
				}
			}
		});

		dashboardRoutes.push({
			method: 'POST',
			path: '/consumer/notify',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: DashboardController.notifyUser,
				validate: {
					payload: joi.object({
						userId: [joi.number(), joi.allow(null)],
						data: joi.object(),
						output: 'data',
						parse: true
					}).allow(null)
				}
			}
		});
	}
}

function prepareProductRoutes(productController, productRoutes) {
//= ========================
	// Product Routes
	//= ========================

	if (productController) {
		productRoutes.push({
			method: 'PUT',
			path: '/{reviewfor}/{id}/reviews',
			config: {
				handler: ProductController.updateUserReview,
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				description: 'Update User Review.',
				validate: {
					payload: {
						ratings: [joi.number(), joi.allow(null)],
						feedback: [joi.string(), joi.allow(null)],
						comments: [joi.string(), joi.allow(null)],
						output: 'data',
						parse: true
					}
				},
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 204, message: 'No Content'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});

		productRoutes.push({
			method: 'GET',
			path: '/products/{id}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: ProductController.retrieveProductDetail,
				description: 'Get Product Details.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});
	}
}

function prepareInsightRoutes(insightController, insightRoutes) {
//= ========================
	// Product Routes
	//= ========================

	if (insightController) {
		insightRoutes.push({
			method: 'GET',
			path: '/insight',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: InsightController.retrieveCategorywiseInsight,
				description: 'Get Insight Data.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});
		insightRoutes.push({
			method: 'GET',
			path: '/categories/{id}/insights',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: InsightController.retrieveInsightForSelectedCategory,
				description: 'Get Insight Data.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});
	}
}

function prepareGeneralRoutes(generalController, generalRoutes) {
	if (generalController) {
		generalRoutes.push({
			method: "POST",
			path: "/contact-us",
			config: {
				handler: GeneralController.contactUs,
				description: "Post Contact Us",
				validate: {
					payload: {
						name: [joi.string(), joi.allow(null)],
						email: [joi.string().email(), joi.allow(null)],
						phone: joi.string().required(),
						message: [joi.string(), joi.allow(null)]
					}
				}
			}
		});
	}
}

module.exports = (app, modals) => {
	appVersionHelper = AppVersionHelper(modals)
	User = modals.users;
	// Middleware to require login/auth
	associateModals(modals);
	PassportService(User);
	passport.authenticate('jwt', {session: false});
	// Initializing route groups
	const authRoutes = [];
	const categoryRoutes = [];
	const brandRoutes = [];
	const sellerRoutes = [];
	const serviceCenterRoutes = [];
	const billManagementRoutes = [];
	const referenceDataRoutes = [];
	const dashboardRoutes = [];
	const productRoutes = [];
	const insightRoutes = [];
	const searchRoutes = [];
	const generalRoutes = [];
	const userController = new UserController(modals);
	const categoryController = new CategoryController(modals);
	const brandController = new BrandController(modals);
	const uploadController = new UploadController(modals);
	const sellerController = new SellerController(modals);
	const serviceCenterController = new ServiceCenterController(modals);
	const billManagementController = new BillManagementController(modals);
	const exclusionInclusionController = new ExclusionInclusionController(modals);
	const referenceDataController = new ReferenceDataController(modals);
	const dashboardController = new DashboardController(modals);
	const productController = new ProductController(modals);
	const insightController = new InsightController(modals);
	const userManagementController = new UserManagementController(modals);
	const searchController = new SearchController(modals);
	const generalController = new GeneralController(modals);

	prepareAuthRoutes(userController, authRoutes);

	prepareCategoryRoutes(categoryController, categoryRoutes);

	prepareBrandRoutes(brandController, brandRoutes);

	prepareSellerRoutes(sellerController, sellerRoutes);

	prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes);

	prepareBillManagementRoutes(billManagementController, billManagementRoutes);

	prepareExclusionInclusionRoutes(exclusionInclusionController, categoryRoutes);

	prepareReferenceData(referenceDataController, referenceDataRoutes);

	prepareUserManagementRoutes(userManagementController, authRoutes);

	const uploadFileRoute = [];

	prepareUploadRoutes(uploadController, uploadFileRoute);

	prepareDashboardRoutes(dashboardController, dashboardRoutes);

	prepareProductRoutes(productController, productRoutes);

	prepareInsightRoutes(insightController, insightRoutes);
	prepareGeneralRoutes(generalController, generalRoutes);

	if (searchController) {
		searchRoutes.push({
			method: 'GET',
			path: '/search',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: SearchController.retrieveSearch,
				description: 'Get Search Data.',
				plugins: {
					'hapi-swagger': {
						responseMessages: [
							{code: 200, message: 'Successful'},
							{code: 400, message: 'Bad Request'},
							{code: 401, message: 'Invalid Credentials'},
							{code: 404, message: 'Not Found'},
							{code: 500, message: 'Internal Server Error'}
						]
					}
				}
			}
		});
	}

	app.route([
		...authRoutes,
		...categoryRoutes,
		...brandRoutes,
		...sellerRoutes,
		...serviceCenterRoutes,
		...billManagementRoutes,
		...referenceDataRoutes,
		...uploadFileRoute,
		...dashboardRoutes,
		...productRoutes,
		...insightRoutes,
		...searchRoutes,
		...generalRoutes
	]);
};
