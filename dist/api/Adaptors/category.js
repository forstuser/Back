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

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var CategoryAdaptor = function() {
  function CategoryAdaptor(modals) {
    _classCallCheck(this, CategoryAdaptor);

    this.modals = modals;
  }

  _createClass(CategoryAdaptor, [
    {
      key: 'retrieveCategories',
      value: function retrieveCategories(options) {
        options.status_type = 1;
        return this.modals.categories.findAll({
          where: options,
          include: [
            {
              model: this.modals.categories,
              as: 'subCategories',
              where: {
                status_type: 1,
              },
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
                      this.modals.sequelize.literal(
                          '"categories"."category_id"'),
                      '/products?subCategoryId=', this.modals.sequelize.literal(
                          '"subCategories"."category_id"')),
                  'categoryProductUrl'],
                [
                  this.modals.sequelize.fn('CONCAT', 'categories/',
                      this.modals.sequelize.literal(
                          '"categories"."category_id"'),
                      '/insights?subCategoryId=', this.modals.sequelize.literal(
                          '"subCategories"."category_id"')),
                  'categoryInsightUrl']],
              required: false,
            }],
          attributes: [
            [
              'category_id',
              'id'],
            [
              'category_name',
              'name'],
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
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  'images'),
              'categoryImageUrl']],
        }).then(function(result) {
          return result.map(function(item) {
            return item.toJSON();
          });
        });
      },
    }]);

  return CategoryAdaptor;
}();

exports.default = CategoryAdaptor;