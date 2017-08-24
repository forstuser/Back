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

let User;

function associateModals(modals) {
  modals.categories.hasMany(modals.productBills, {
    foreignKey: 'master_category_id', as: 'products'
  });
  modals.productBills.belongsTo(modals.categories, {
    foreignKey: 'master_category_id', as: 'category'
  });
  modals.userImages.belongsTo(modals.table_users, { foreignKey: 'user_id', as: 'user' });
  modals.table_users.hasMany(modals.userImages, { foreignKey: 'user_id', as: 'userImages' });
  modals.consumerBills.belongsTo(modals.table_users, { foreignKey: 'user_id', as: 'consumer' });
  modals.table_users.hasMany(modals.consumerBills);
  modals.consumerBills.hasMany(modals.consumerBillDetails, { foreignKey: 'bill_id', as: 'billDetails' });
  modals.consumerBillDetails.belongsTo(modals.consumerBills, { foreignKey: 'bill_id', as: 'bill' });
  modals.consumerBillDetails.hasMany(modals.productBills, { foreignKey: 'bill_detail_id', as: 'products' });
  modals.productBills.belongsTo(modals.consumerBillDetails, { foreignKey: 'bill_detail_id', as: 'consumerBill' });
  modals.productBills.hasMany(modals.amcBills, { foreignKey: 'bill_product_id', as: 'amcDetails' });
  modals.amcBills.belongsTo(modals.productBills, { foreignKey: 'bill_product_id', as: 'amcProduct' });
  modals.productBills.hasMany(modals.insuranceBills, {
    foreignKey: 'bill_product_id',
    as: 'insuranceDetails'
  });
  modals.insuranceBills.belongsTo(modals.productBills, {
    foreignKey: 'bill_product_id',
    as: 'insuredProduct'
  });
  modals.productBills.hasMany(modals.warranty, { foreignKey: 'bill_product_id', as: 'warrantyDetails' });
  modals.warranty.belongsTo(modals.productBills, { foreignKey: 'bill_product_id', as: 'warrantyProduct' });
  modals.warranty.hasMany(modals.warrantyCopies, { foreignKey: 'bill_warranty_id', as: 'warrantyCopies' });
  modals.amcBills.hasMany(modals.amcBillCopies, { foreignKey: 'bill_amc_id', as: 'amcCopies' });
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

function prepareSellerRoutes(sellerController, sellerRoutes) {
  if (sellerController) {
    // Add Online Seller
    sellerRoutes.push({
      method: 'POST',
      path: '/admin/sellers',
      config: {
        auth: 'jwt',
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
        handler: SellerController.deleteSeller
      }
    });

    // Delete Seller Detail
    sellerRoutes.push({
      method: 'DELETE',
      path: '/admin/sellers/{id}/details/{detailid}',
      config: {
        auth: 'jwt',
        handler: SellerController.deleteSellerDetail
      }
    });

    // Get Seller List
    sellerRoutes.push({
      method: 'GET',
      path: '/admin/sellers',
      config: {
        auth: 'jwt',
        handler: SellerController.retrieveSeller
      }
    });

    sellerRoutes.push({
      method: 'GET',
      path: '/admin/sellers/{id}',
      config: {
        auth: 'jwt',
        handler: SellerController.retrieveSellerById
      }
    });

    // Add Offline Seller
    sellerRoutes.push({
      method: 'POST',
      path: '/admin/sellers/offline',
      config: {
        auth: 'jwt',
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
        handler: SellerController.deleteOfflineSeller
      }
    });

    sellerRoutes.push({
      method: 'DELETE',
      path: '/admin/sellers/offline/{id}/details/{detailid}',
      config: {
        auth: 'jwt',
        handler: SellerController.deleteOfflineSellerDetail
      }
    });

    // Get Offline Seller List
    sellerRoutes.push({
      method: 'GET',
      path: '/admin/sellers/offline',
      config: {
        auth: 'jwt',
        handler: SellerController.retrieveOfflineSeller
      }
    });

    sellerRoutes.push({
      method: 'GET',
      path: '/admin/sellers/offline/{id}',
      config: {
        auth: 'jwt',
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
        handler: ServiceCenterController.deleteServiceCenter
      }
    });

    // Delete Authorized Service Center Detail
    serviceCenterRoutes.push({
      method: 'DELETE',
      path: '/admin/servicecenters/{id}/details/{detailid}',
      config: {
        auth: 'jwt',
        handler: ServiceCenterController.deleteServiceCenterDetail
      }
    });
    // Get Authorized Service Center List
    serviceCenterRoutes.push({
      method: 'GET',
      path: '/admin/servicecenters',
      config: {
        auth: 'jwt',
        handler: ServiceCenterController.retrieveServiceCenters
      }
    });
    // Get Authorized Service Center By ID
    serviceCenterRoutes.push({
      method: 'GET',
      path: '/admin/servicecenters/{id}',
      config: {
        auth: 'jwt',
        handler: ServiceCenterController.retrieveServiceCenterById
      }
    });
  }
}

function prepareBrandRoutes(brandController, brandRoutes) {
  if (brandController) {
    // Add Brand
    brandRoutes.push({
      method: 'POST',
      path: '/admin/brands',
      config: {
        auth: 'jwt',
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
        handler: BrandController.deleteBrand
      }
    });

    // Delete Brand Detail
    brandRoutes.push({
      method: 'DELETE',
      path: '/admin/brands/{id}/details/{detailid}',
      config: {
        auth: 'jwt',
        handler: BrandController.deleteBrandDetail
      }
    });

    // Get Brand List
    brandRoutes.push({
      method: 'GET',
      path: '/admin/brands',
      config: {
        auth: 'jwt',
        handler: BrandController.retrieveBrand
      }
    });

    brandRoutes.push({
      method: 'GET',
      path: '/admin/brands/{id}',
      config: {
        auth: 'jwt',
        handler: BrandController.retrieveBrandById
      }
    });
  }
}

function prepareCategoryRoutes(categoryController, categoryRoutes) {
  if (categoryController) {
    // Add Category
    categoryRoutes.push({
      method: 'POST',
      path: '/admin/categories',
      config: {
        auth: 'jwt',
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
              { code: 201, message: 'Created' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
        handler: CategoryController.retrieveCategory
      }
    });
    // Category By Id
    categoryRoutes.push({
      method: 'GET',
      path: '/admin/categories/{id}',
      config: {
        auth: 'jwt',
        handler: CategoryController.retrieveCategoryById
      }
    });
  }
}

function prepareUserManagementRoutes(userManagementController, authRoutes) {
  if (userManagementController) {
    // Add Category
    authRoutes.push({
      method: 'POST',
      path: '/admin/user/management',
      config: {
        auth: 'jwt',
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
              { code: 201, message: 'Created' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
        handler: UserManagementController.retrieveUsers
      }
    });
    // Category By Id
    authRoutes.push({
      method: 'GET',
      path: '/admin/user/management/{id}',
      config: {
        auth: 'jwt',
        handler: UserManagementController.retrieveUserByID
      }
    });
  }
}

function prepareBillManagementRoutes(billManagementController, billManagementRoutes) {
  if (billManagementController) {
    billManagementRoutes.push({
      method: 'POST',
      path: '/admin/billtoce',
      config: {
        auth: 'jwt',
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
              { code: 201, message: 'Created' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
              { code: 201, message: 'Created' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
              { code: 204, message: 'Updated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
        handler: BillManagementController.retrieveAdminConsumerBillList
      }
    });

    billManagementRoutes.push({
      method: 'GET',
      path: '/ce/bills',
      config: {
        auth: 'jwt',
        handler: BillManagementController.retrieveCEBills
      }
    });

    billManagementRoutes.push({
      method: 'GET',
      path: '/qe/bills',
      config: {
        auth: 'jwt',
        handler: BillManagementController.retrieveQEBills
      }
    });
  }
}

function prepareExclusionInclusionRoutes(exclusionInclusionController, categoryRoutes) {
  if (exclusionInclusionController) {
    // Add Exclusions
    categoryRoutes.push({
      method: 'POST',
      path: '/admin/exclusions',
      config: {
        auth: 'jwt',
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
        handler: ExclusionInclusionController.deleteExclusions
      }
    });

    // Delete Inclusions
    categoryRoutes.push({
      method: 'DELETE',
      path: '/admin/inclusions/{id}',
      config: {
        auth: 'jwt',
        handler: ExclusionInclusionController.deleteInclusions
      }
    });

    categoryRoutes.push({
      method: 'GET',
      path: '/admin/exclusions',
      config: {
        auth: 'jwt',
        handler: ExclusionInclusionController.retrieveExclusions
      }
    });

    categoryRoutes.push({
      method: 'GET',
      path: '/admin/inclusions',
      config: {
        auth: 'jwt',
        handler: ExclusionInclusionController.retrieveInclusions
      }
    });
  }
}

function prepareReferenceData(referenceDataController, referenceDataRoutes) {
  if (referenceDataController) {
    referenceDataRoutes.push({
      method: 'POST',
      path: '/admin/colors',
      config: {
        auth: 'jwt',
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
        handler: ReferenceDataController.deleteColors
      }
    });

    referenceDataRoutes.push({
      method: 'GET',
      path: '/admin/colors',
      config: {
        auth: 'jwt',
        handler: ReferenceDataController.retrieveColors
      }
    });

    referenceDataRoutes.push({
      method: 'GET',
      path: '/admin/colors/{id}',
      config: {
        auth: 'jwt',
        handler: ReferenceDataController.retrieveColorsById
      }
    });

    referenceDataRoutes.push({
      method: 'GET',
      path: '/admin/usertypes',
      config: {
        auth: 'jwt',
        handler: ReferenceDataController.retrieveUserTypes
      }
    });
  }
}

module.exports = (app, modals) => {
  User = modals.users;
  // Middleware to require login/auth
  associateModals(modals);
  PassportService(User);
  passport.authenticate('jwt', { session: false });
  // Initializing route groups
  const authRoutes = [];
  const categoryRoutes = [];
  const brandRoutes = [];
  const sellerRoutes = [];
  const serviceCenterRoutes = [];
  const billManagementRoutes = [];
  const referenceDataRoutes = [];
  const dashboardRoutes = [];
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

  const userManagementController = new UserManagementController(modals);
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
              { code: 200, message: 'Authenticated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });

    authRoutes.push({
      method: 'POST',
      path: '/consumer/getotp',
      config: {
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
              { code: 200, message: 'Authenticated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });

    authRoutes.push({
      method: 'PUT',
      path: '/consumer/profile',
      config: {
        handler: UserController.updateUserProfile,
        auth: false,
        description: 'Update User Profile.',
        validate: {
          payload: {
            phoneNo: joi.string(),
            location: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
            osTypeId: [joi.string(), joi.allow(null)],
            gcmId: [joi.string(), joi.allow(null)],
            email: [joi.string(), joi.allow(null)],
            deviceId: [joi.string(), joi.allow(null)],
            deviceModel: [joi.string(), joi.allow(null)],
            apkVersion: [joi.string(), joi.allow(null)],
            name: [joi.string(), joi.allow(null)],
            isEnrolled: [joi.boolean(), joi.allow(null)],
            categoryId: [joi.number(), joi.allow(null)],
            isPhoneAllowed: [joi.boolean(), joi.allow(null)],
            isEmailAllowed: [joi.boolean(), joi.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 202, message: 'Authenticated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });

    authRoutes.push({
      method: 'GET',
      path: '/consumer/profile',
      config: {
        handler: UserController.retrieveUserProfile,
        description: 'Get User Profile.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 200, message: 'Successful' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
            BBLogin_Type: joi.number().required(),
            TrueSecret: joi.string(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 200, message: 'Authenticated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
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
              { code: 202, message: 'Authenticated' },
              { code: 400, message: 'Bad Request' },
              { code: 401, message: 'Invalid Credentials' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });
  }

  prepareCategoryRoutes(categoryController, categoryRoutes);

  prepareBrandRoutes(brandController, brandRoutes);

  prepareSellerRoutes(sellerController, sellerRoutes);

  prepareServiceCenterRoutes(serviceCenterController, serviceCenterRoutes);

  prepareBillManagementRoutes(billManagementController, billManagementRoutes);

  prepareExclusionInclusionRoutes(exclusionInclusionController, categoryRoutes);

  prepareReferenceData(referenceDataController, referenceDataRoutes);

  prepareUserManagementRoutes(userManagementController, authRoutes);

  const uploadFileRoute = [];

  if (uploadController) {
    uploadFileRoute.push({
      method: 'POST',
      path: '/consumer/upload/selfie',
      config: {
        auth: 'jwt',
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
        handler: UploadController.retrieveFiles
      }
    });
    uploadFileRoute.push({
      method: 'GET',
      path: '/consumer/{id}/images',
      config: {
        handler: UploadController.retrieveUserImage
      }
    });
  }

  if (dashboardController) {
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/dashboard',
      config: {
        auth: 'jwt',
        handler: DashboardController.getDashboard
      }
    });
    dashboardRoutes.push({
      method: 'GET',
      path: '/consumer/ehome',
      config: {
        auth: 'jwt',
        handler: DashboardController.getEHome
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
    ...dashboardRoutes
  ]);
};
