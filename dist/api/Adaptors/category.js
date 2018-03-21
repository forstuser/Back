'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _brands = require('./brands');

var _brands2 = _interopRequireDefault(_brands);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CategoryAdaptor = function () {
  function CategoryAdaptor(modals) {
    _classCallCheck(this, CategoryAdaptor);

    this.modals = modals;
    this.brandAdaptor = new _brands2.default(modals);
  }

  _createClass(CategoryAdaptor, [{
    key: 'retrieveCategories',
    value: function retrieveCategories(options, isBrandFormRequired, language) {
      var _this = this;

      options.status_type = 1;
      var categoryData = void 0;
      return this.modals.categories.findAll({
        where: options,
        attributes: [['category_id', 'id'], ['category_name', 'default_name'], ['' + (language ? 'category_name_' + language : 'category_name'), 'name'], ['ref_id', 'refId'], ['category_level', 'level'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('"categories"."category_id"'), '/products'), 'categoryProductUrl'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('"categories"."category_id"'), '/insights'), 'categoryInsightUrl'], [this.modals.sequelize.fn('CONCAT', '/categories/', this.modals.sequelize.literal('"categories"."category_id"'), '/images/'), 'categoryImageUrl']],
        order: ['category_id']
      }).then(function (result) {
        categoryData = result.map(function (item) {
          var categoryItem = item.toJSON();
          categoryItem.name = categoryItem.name || categoryItem.default_name;
          return categoryItem;
        });
        var subCategoryOption = {
          status_type: 1,
          ref_id: categoryData.map(function (item) {
            return item.id;
          })
        };
        var main_category_id = options.category_id;
        var excluded_category_id = main_category_id ? {
          $notIn: main_category_id === '1' ? _main2.default.CATEGORIES.FURNITURE : main_category_id === '2' ? _main2.default.CATEGORIES.ELECTRONIC : main_category_id === '3' ? _main2.default.CATEGORIES.AUTOMOBILE : []
        } : undefined;
        if (excluded_category_id) {
          subCategoryOption.category_id = excluded_category_id;
        }

        return _this.retrieveSubCategories(subCategoryOption, isBrandFormRequired, language);
      }).then(function (subCategories) {
        categoryData = categoryData.map(function (item) {
          item.subCategories = subCategories.filter(function (categoryItem) {
            return categoryItem.refId === item.id;
          });

          return item;
        });
        return categoryData;
      });
    }
  }, {
    key: 'retrieveSubCategories',
    value: function retrieveSubCategories(options, isBrandFormRequired, language) {
      var _this2 = this;

      var categoryData = void 0;
      options.status_type = 1;
      return this.modals.categories.findAll({
        where: options,
        attributes: [['category_id', 'id'], ['category_name', 'default_name'], ['' + (language ? 'category_name_' + language : 'category_name'), 'name'], ['ref_id', 'refId'], 'dual_warranty_item', ['category_level', 'level'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('ref_id'), '/products?subCategoryId=', this.modals.sequelize.literal('category_id')), 'categoryProductUrl'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.literal('ref_id'), '/insights?subCategoryId=', this.modals.sequelize.literal('category_id')), 'categoryInsightUrl'], [this.modals.sequelize.fn('CONCAT', '/categories/', this.modals.sequelize.literal('category_id'), '/images/'), 'categoryImageUrl']],
        order: ['category_id']
      }).then(function (result) {
        categoryData = result.map(function (item) {
          return item.toJSON();
        });
        if (isBrandFormRequired) {
          return Promise.all([_this2.brandAdaptor.retrieveCategoryBrands({
            category_id: categoryData.map(function (item) {
              return item.id;
            }),
            status_type: 1
          }), _this2.retrieveCategoryForms({
            $or: [{
              $and: {
                category_id: categoryData.map(function (item) {
                  return item.id;
                }),
                title: {
                  $iLike: 'model'
                }
              }
            }, {
              $and: {
                main_category_id: categoryData.map(function (item) {
                  return item.refId;
                }),
                title: {
                  $iLike: 'IMEI Number'
                }
              }
            }, {
              $and: {
                main_category_id: categoryData.map(function (item) {
                  return item.refId;
                }),
                title: {
                  $iLike: 'Serial Number'
                }
              }
            }, {
              $and: {
                category_id: categoryData.map(function (item) {
                  return item.id;
                }),
                title: {
                  $iLike: 'Chasis Number'
                }
              }
            }, {
              $and: {
                category_id: categoryData.map(function (item) {
                  return item.id;
                }),
                title: {
                  $iLike: 'due date%'
                }
              }
            }, {
              $and: {
                category_id: categoryData.map(function (item) {
                  return item.id;
                }),
                title: {
                  $iLike: 'due amount%'
                }
              }
            }, {
              $and: {
                main_category_id: categoryData.map(function (item) {
                  return item.refId;
                }),
                title: {
                  $iLike: 'VIN'
                }
              }
            }, {
              $and: {
                main_category_id: categoryData.map(function (item) {
                  return item.refId;
                }),
                title: {
                  $iLike: 'Registration Number'
                }
              }
            }],
            status_type: 1
          }), _this2.modals.insuranceBrands.findAll({
            where: {
              type: [1, 3],
              status_type: 1
            },
            include: {
              model: _this2.modals.categories,
              where: {
                category_id: options.category_id
              },
              as: 'categories',
              attributes: [],
              required: true
            },
            attributes: ['id', 'name', [_this2.modals.sequelize.literal('"categories"."category_id"'), 'category_id']]
          }), _this2.modals.insuranceBrands.findAll({
            where: {
              type: [2, 3],
              status_type: 1
            },
            include: {
              model: _this2.modals.categories,
              where: {
                category_id: options.category_id
              },
              as: 'categories',
              attributes: [],
              required: true
            },
            attributes: ['id', 'name', [_this2.modals.sequelize.literal('"categories"."category_id"'), 'category_id']]
          }), _this2.modals.categories.findAll({
            where: {
              status_type: 1,
              ref_id: options.category_id,
              category_level: 3
            },
            attributes: [['category_id', 'id'], ['category_name', 'name'], ['ref_id', 'refId'], 'dual_warranty_item', ['category_level', 'level'], [_this2.modals.sequelize.fn('CONCAT', 'categories/', _this2.modals.sequelize.literal('ref_id'), '/products?subCategoryId=', _this2.modals.sequelize.literal('category_id')), 'categoryProductUrl'], [_this2.modals.sequelize.fn('CONCAT', 'categories/', _this2.modals.sequelize.literal('ref_id'), '/insights?subCategoryId=', _this2.modals.sequelize.literal('category_id')), 'categoryInsightUrl'], [_this2.modals.sequelize.fn('CONCAT', '/categories/', _this2.modals.sequelize.literal('category_id'), '/images/'), 'categoryImageUrl']],
            order: ['category_id']
          })]);
        }

        return undefined;
      }).then(function (results) {
        if (results) {
          categoryData = categoryData.map(function (item) {
            item.brands = results[0].filter(function (brandItem) {
              return brandItem.categoryId === item.id;
            });
            item.categoryForms = results[1].filter(function (formItem) {
              return formItem.categoryId === item.id || formItem.main_category_id === item.refId;
            });
            item.insuranceProviders = results[2];
            item.warrantyProviders = results[3];
            item.subCategories = results[4];
            return item;
          });
        }
        return categoryData;
      }).catch(console.log);
    }
  }, {
    key: 'retrieveCategoryForms',
    value: function retrieveCategoryForms(options) {
      return this.modals.categoryForms.findAll({
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
        order: ['display_index']
      }).then(function (formResult) {
        return formResult.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveRenewalTypes',
    value: function retrieveRenewalTypes(options) {
      return this.modals.renewalTypes.findAll({
        where: options,
        order: [['effective_months', 'ASC']]
      }).then(function (renewalTypes) {
        return renewalTypes.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return CategoryAdaptor;
}();

exports.default = CategoryAdaptor;