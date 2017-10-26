/*jshint esversion: 6 */
'use strict';

import joi from 'joi';
import passport from 'passport';
import Path from 'path';
import BrandController from '../api/controllers/brand';
import CategoryController from '../api/controllers/category';
import BillManagementController from '../api/controllers/consumerBillManagement';
import DashboardController from '../api/controllers/dashboard';
import ExclusionInclusionController from '../api/controllers/exclusionInclusion';
import GeneralController from '../api/controllers/general';
import InsightController from '../api/controllers/insight';
import ProductController from '../api/controllers/product';
import ReferenceDataController from '../api/controllers/referenceData';
import SearchController from '../api/controllers/search';
import SellerController from '../api/controllers/seller';
import ServiceCenterController from '../api/controllers/serviceCenter';
import UploadController from '../api/controllers/upload';
import UserController from '../api/controllers/user';
import UserManagementController from '../api/controllers/userManagement';
import PassportService from '../config/passport';
import AppVersionHelper from '../helpers/appVersion';

let User;
let appVersionHelper;

// NO APP VERSION CHECK
function prepareSellerRoutes (sellerController, sellerRoutes) {
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

function prepareServiceCenterRoutes (serviceCenterController, serviceCenterRoutes) {
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

function prepareBrandRoutes (brandController, brandRoutes) {
	if (brandController) {
		// Get brands
		brandRoutes.push({
			method: 'GET',
			path: '/brands',
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
function prepareCategoryRoutes (categoryController, categoryRoutes) {
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
		});
	}
}

// NO APP VERSION CHECK
function prepareUserManagementRoutes (userManagementController, authRoutes) {
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
function prepareBillManagementRoutes (billManagementController, billManagementRoutes) {
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
function prepareExclusionInclusionRoutes (exclusionInclusionController, categoryRoutes) {
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
function prepareReferenceData (referenceDataController, referenceDataRoutes) {
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

function prepareAuthRoutes (userController, authRoutes) {
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
			method: 'POST',
			path: '/consumer/subscribe',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UserController.subscribeUser,
				description: 'Update User FCM Server ID.',
				validate: {
					payload: {
						fcmId: [joi.string(), joi.allow(null)],
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
						fcmId: [joi.string(), joi.allow(null)],
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
						Token: joi.string(),
						TrueObject: {
							EmailAddress: joi.string().email(),
							PhoneNo: joi.string().required(),
							Name: joi.string(),
							ImageLink: joi.string()
						},
						TruePayload: joi.string(),
						fcmId: joi.string(),
						BBLogin_Type: joi.number().required(),
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

function prepareUploadRoutes (uploadController, uploadFileRoute) {
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
			path: '/jobs/{id}/files/{copyid}',
			config: {
				auth: 'jwt',
				pre: [
					{method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'}
				],
				handler: UploadController.retrieveFiles
			}
		});
		uploadFileRoute.push({
			method: 'DELETE',
			path: '/jobs/{id}/files/{copyid}',
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

function prepareDashboardRoutes (dashboardController, dashboardRoutes) {
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

function prepareProductRoutes (productController, productRoutes) {
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

function prepareInsightRoutes (insightController, insightRoutes) {
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

function prepareGeneralRoutes (generalController, generalRoutes) {
	if (generalController) {
		generalRoutes.push({
			method: 'POST',
			path: '/contact-us',
			config: {
				handler: GeneralController.contactUs,
				description: 'Post Contact Us',
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

		generalRoutes.push({
			method: 'GET',
			path: '/faqs',
			config: {
				handler: GeneralController.retrieveFAQs,
				description: 'Retrieve FAQ\'s'
			}
		});
	}
}

export default (app, modals) => {
	appVersionHelper = new AppVersionHelper(modals);
	User = modals.users;
	// Middleware to require login/auth
	new PassportService(User);
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
