const joi = require('joi');
const passport = require('passport');
const PassportService = require('../config/passport');

const UserController = require('../api/controllers/user');
const CategoryController = require('../api/controllers/category');

let User;
module.exports = (app, models) => {
  User = models.users;
  // Middleware to require login/auth

  PassportService(User);
  passport.authenticate('jwt', { session: false });
  // Initializing route groups
  const authRoutes = [];
  const categoryRoutes = [];
  const userController = new UserController(models);
  const categoryController = new CategoryController(models);

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

  app.route([...authRoutes, ...categoryRoutes]);
};
