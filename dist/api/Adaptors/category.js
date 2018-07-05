'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CategoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
  }

  async retrieveCategories(parameters) {
    let { options, isBrandFormRequired, isSubCategoryRequiredForAll, language, isFilterRequest, user } = parameters;
    options.status_type = 1;
    let categoryData;
    const result = await this.modals.categories.findAll({
      where: options, attributes: [['category_id', 'id'], ['category_name', 'default_name'], [`${language ? `category_name_${language}` : `category_name`}`, 'name'], [this.modals.sequelize.fn('CONCAT', '/categories/', this.modals.sequelize.literal('"categories"."category_id"'), '/images/1'), 'categoryImageUrl']], order: ['category_id']
    });
    categoryData = result.map(item => {
      const categoryItem = item.toJSON();
      categoryItem.name = categoryItem.name || categoryItem.default_name;
      return categoryItem;
    });
    const ref_id = !isSubCategoryRequiredForAll ? categoryData.filter(item => item.id !== 2 && item.id !== 3).map(item => item.id) : categoryData.map(item => item.id);
    const subCategoryOption = {
      status_type: 1,
      ref_id
    };
    const main_category_id = options.category_id;
    const excluded_category_id = main_category_id ? {
      $notIn: main_category_id === '1' && !isFilterRequest ? _main2.default.CATEGORIES.FURNITURE : main_category_id === '2' && !isFilterRequest ? _main2.default.CATEGORIES.ELECTRONIC : main_category_id === '3' && !isFilterRequest ? _main2.default.CATEGORIES.AUTOMOBILE : []
    } : undefined;
    if (excluded_category_id) {
      subCategoryOption.category_id = excluded_category_id;
    }

    const subCategories = await this.retrieveSubCategories(subCategoryOption, isBrandFormRequired, language, user);
    categoryData = categoryData.map(item => {
      item.subCategories = subCategories.filter(categoryItem => categoryItem.refId === item.id);

      return item;
    });
    return categoryData;
  }

  async retrieveSubCategories(options, isBrandFormRequired, language, user) {
    let categoryData;
    options.status_type = 1;
    const result = await this.modals.categories.findAll({
      where: options, attributes: [['category_id', 'id'], ['category_name', 'default_name'], [`${language ? `category_name_${language}` : `category_name`}`, 'name'], ['ref_id', 'refId'], [this.modals.sequelize.fn('CONCAT', '/categories/', this.modals.sequelize.literal('category_id'), '/images/1/thumbnail'), 'categoryImageUrl']],
      order: ['category_id']
    });
    categoryData = result.map(item => {
      const categoryItem = item.toJSON();
      categoryItem.name = categoryItem.name || categoryItem.default_name;
      return categoryItem;
    });
    let results;
    if (isBrandFormRequired) {
      results = await Promise.all([this.brandAdaptor.retrieveCategoryBrands({
        category_id: categoryData.map(item => item.id),
        status_type: [1, 11]
      }), this.retrieveCategoryForms({
        $or: [{
          $and: {
            category_id: categoryData.map(item => item.id),
            title: {
              $iLike: 'model'
            }
          }
        }, {
          $and: {
            main_category_id: categoryData.map(item => item.refId),
            title: {
              $iLike: 'IMEI Number'
            }
          }
        }, {
          $and: {
            main_category_id: categoryData.map(item => item.refId),
            title: {
              $iLike: 'Serial Number'
            }
          }
        }, {
          $and: {
            category_id: categoryData.map(item => item.id),
            title: {
              $iLike: 'Chasis Number'
            }
          }
        }, {
          $and: {
            category_id: categoryData.map(item => item.id),
            title: {
              $iLike: 'due date%'
            }
          }
        }, {
          $and: {
            category_id: categoryData.map(item => item.id),
            title: {
              $iLike: 'due amount%'
            }
          }
        }, {
          $and: {
            main_category_id: categoryData.map(item => item.refId),
            title: {
              $iLike: 'VIN'
            }
          }
        }, {
          $and: {
            main_category_id: categoryData.map(item => item.refId),
            title: {
              $iLike: 'Registration Number'
            }
          }
        }],
        status_type: 1
      }), this.modals.insuranceBrands.findAll({
        where: {
          type: [1, 3],
          status_type: 1
        },
        include: {
          model: this.modals.categories,
          where: {
            category_id: options.category_id
          },
          as: 'categories',
          attributes: [],
          required: true
        },
        attributes: ['id', 'name', [this.modals.sequelize.literal('"categories"."category_id"'), 'category_id']]
      }), this.modals.insuranceBrands.findAll({
        where: {
          type: [2, 3],
          status_type: 1
        },
        include: {
          model: this.modals.categories,
          where: {
            category_id: options.category_id
          },
          as: 'categories',
          attributes: [],
          required: true
        },
        attributes: ['id', 'name', [this.modals.sequelize.literal('"categories"."category_id"'), 'category_id']]
      }), this.modals.categories.findAll({
        where: {
          status_type: 1,
          ref_id: options.category_id,
          category_level: 3
        },
        attributes: [['category_id', 'id'], ['category_name', 'name'], ['ref_id', 'refId'], 'dual_warranty_item', ['category_level', 'level'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('ref_id'), '/products?subCategoryId=', this.modals.sequelize.literal('category_id')), 'categoryProductUrl'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('ref_id'), '/insights?subCategoryId=', this.modals.sequelize.literal('category_id')), 'categoryInsightUrl'], [this.modals.sequelize.fn('CONCAT', '/categories/', this.modals.sequelize.literal('category_id'), '/images/1/thumbnail'), 'categoryImageUrl']],
        order: ['category_id']
      })]);
    }

    if (results) {
      categoryData = categoryData.map(item => {
        item.name = item.name || item.default_name;
        item.brands = user ? results[0].filter(brandItem => brandItem.categoryId === item.id && (brandItem.status_type === 1 || brandItem.status_type === 11 && (brandItem.created_by === (user.ID || user.id) || brandItem.updated_by === (user.ID || user.id)))) : results[0].filter(brandItem => brandItem.categoryId === item.id && brandItem.status_type === 1);
        item.categoryForms = results[1].filter(formItem => formItem.categoryId === item.id || formItem.main_category_id === item.refId);
        item.insuranceProviders = results[2];
        item.warrantyProviders = results[3];
        item.subCategories = results[4].map(categoryItem => {
          categoryItem.name = categoryItem.name || categoryItem.default_name;
          return categoryItem;
        });
        return item;
      });
    }
    return categoryData;
  }

  async retrieveCategoryForms(options) {
    const formResult = await this.modals.categoryForms.findAll({
      where: options,
      include: [{
        model: this.modals.dropDowns,
        as: 'dropDown',
        where: {
          status_type: 1
        },
        attributes: ['id', 'title', ['category_form_id', 'categoryFormId'], ['status_type', 'status']],
        required: false
      }],
      attributes: [['category_id', 'categoryId'], 'title', 'main_category_id', ['form_type', 'formType'], ['status_type', 'status'], 'id', ['display_index', 'displayIndex']],
      order: ['display_index', 'title']
    });
    return formResult.map(item => item.toJSON());
  }

  async retrieveRenewalTypes(options) {
    const renewalTypes = await this.modals.renewalTypes.findAll({
      where: options,
      order: [['effective_months', 'ASC']]
    });
    return renewalTypes.map(item => item.toJSON());
  }
}
exports.default = CategoryAdaptor;