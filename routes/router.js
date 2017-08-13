const joi = require('joi');
const passport = require('passport');
const Path = require('path');

const PassportService = require('../config/passport');

const UserController = require('../api/controllers/user');
const CategoryController = require('../api/controllers/category');
const BrandController = require('../api/controllers/brand');
const UploadController = require('../api/controllers/upload');

let User;
module.exports = (app, models) => {
  User = models.users;
  // Middleware to require login/auth

  PassportService(User);
  passport.authenticate('jwt', { session: false });
  // Initializing route groups
  const authRoutes = [];
  const categoryRoutes = [];
  const brandRoutes = [];
  const userController = new UserController(models);
  const categoryController = new CategoryController(models);
  const brandController = new BrandController(models);
  const uploadController = new UploadController(models);

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

  let uploadFileRoute;

   if(uploadController) {
     uploadFileRoute= {
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
           maxBytes: 3000000
         }
       }
     };
   }
  app.route([...authRoutes, ...categoryRoutes, ...brandRoutes, uploadFileRoute]);
};
