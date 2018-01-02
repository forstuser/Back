'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var CategoryAdaptor = function() {
  function CategoryAdaptor(modals) {
    _classCallCheck(this, CategoryAdaptor);

    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
  }

  _createClass(CategoryAdaptor, [
    {
      key: 'retrieveCategories',
      value: function retrieveCategories(options, isBrandFormRequired) {
        var _this = this;

        options.status_type = 1;
        var categoryData = void 0;
        return this.modals.categories.findAll({
          where: options,
          attributes: [
            [
              'category_id',
              'id'],
            [
              'category_name',
              'name'],
            [
              'ref_id',
              'refId'],
            [
              'category_level',
              'level'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  '/products'),
              'categoryProductUrl'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  '/insights'),
              'categoryInsightUrl'],
            [
              this.modals.sequelize.fn('CONCAT', '/categories/',
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  '/images/'),
              'categoryImageUrl']],
          order: ['category_id'],
        }).then(function(result) {
          categoryData = result.map(function(item) {
            return item.toJSON();
          });

          return _this.retrieveSubCategories({
            ref_id: categoryData.map(function(item) {
              return item.id;
            }),
            status_type: 1,
          }, isBrandFormRequired);
        }).then(function(subCategories) {
          categoryData = categoryData.map(function(item) {
            item.subCategories = subCategories.filter(function(categoryItem) {
              return categoryItem.refId === item.id;
            });

            return item;
          });
          return categoryData;
        });
      },
    }, {
      key: 'retrieveSubCategories',
      value: function retrieveSubCategories(options, isBrandFormRequired) {
        var _this2 = this;

        var categoryData = void 0;
        options.status_type = 1;
        return this.modals.categories.findAll({
          where: options,
          attributes: [
            [
              'category_id',
              'id'],
            [
              'category_name',
              'name'],
            [
              'ref_id',
              'refId'],
            'dual_warranty_item',
            [
              'category_level',
              'level'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('ref_id'),
                  '/products?subCategoryId=',
                  this.modals.sequelize.literal('category_id')),
              'categoryProductUrl'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('ref_id'),
                  '/insights?subCategoryId=',
                  this.modals.sequelize.literal('category_id')),
              'categoryInsightUrl'],
            [
              this.modals.sequelize.fn('CONCAT', '/categories/',
                  this.modals.sequelize.literal('category_id'), '/images/'),
              'categoryImageUrl']],
          order: ['category_id'],
        }).then(function(result) {
          console.log(result);
          categoryData = result.map(function(item) {
            return item.toJSON();
          });
          if (isBrandFormRequired) {
            return Promise.all([
              _this2.brandAdaptor.retrieveCategoryBrands({
                category_id: categoryData.map(function(item) {
                  return item.id;
                }),
                status_type: 1,
              }), _this2.retrieveCategoryForms({
                category_id: categoryData.map(function(item) {
                  return item.id;
                }),
                status_type: 1,
              }), _this2.modals.insuranceBrands.findAll({
                include: {
                  model: _this2.modals.categories,
                  where: {
                    category_id: options.category_id,
                  },
                  as: 'categories',
                  attributes: [],
                  required: true,
                },
              })]);
          }

          return undefined;
        }).then(function(results) {
          if (results) {
            categoryData = categoryData.map(function(item) {
              item.brands = results[0].filter(function(brandItem) {
                return brandItem.categoryId === item.id;
              });
              item.categoryForms = results[1].filter(function(formItem) {
                return formItem.categoryId === item.id;
              });
              item.insuranceProviders = results[2];
              return item;
            });
          }
          return categoryData;
        }).catch(console.log);
      },
    }, {
      key: 'retrieveCategoryForms',
      value: function retrieveCategoryForms(options) {
        return this.modals.categoryForms.findAll({
          where: options,
          include: [
            {
              model: this.modals.dropDowns,
              as: 'dropDown',
              where: {
                status_type: 1,
              },
              attributes: [
                'id',
                'title',
                [
                  'category_form_id',
                  'categoryFormId'],
                [
                  'status_type',
                  'status']],
              required: false,
            }],
          attributes: [
            [
              'category_id',
              'categoryId'],
            'title',
            [
              'form_type',
              'formType'],
            [
              'status_type',
              'status'],
            'id',
            [
              'display_index',
              'displayIndex']],
          order: ['display_index'],
        }).then(function(formResult) {
          return formResult.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }, {
      key: 'retrieveRenewalTypes',
      value: function retrieveRenewalTypes(options) {
        return this.modals.renewalTypes.findAll({
          where: options,
          order: [['type', 'ASC']],
        }).then(function(renewalTypes) {
          return renewalTypes.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }]);

  return CategoryAdaptor;
}();

exports.default = CategoryAdaptor;