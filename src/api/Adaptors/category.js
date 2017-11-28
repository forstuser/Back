import BrandAdaptor from './brands';

export default class CategoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new BrandAdaptor(modals);
  }

  retrieveCategories(options, isBrandFormRequired) {
    options.status_type = 1;
    let categoryData;
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
    }).then((result) => {
      categoryData = result.map(item => item.toJSON());

      return this.retrieveSubCategories({
        ref_id: categoryData.map(item => item.id),
        status_type: 1,
      }, isBrandFormRequired);
    }).then((subCategories) => {
      categoryData = categoryData.map((item) => {
        item.subCategories = subCategories.filter(
            (categoryItem) => categoryItem.refId === item.id);

        return item;
      });
      return categoryData;
    });
  }

  retrieveSubCategories(options, isBrandFormRequired) {
    let categoryData;
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
              this.modals.sequelize.literal('ref_id'),
              '/products?subCategoryId=', this.modals.sequelize.literal(
                  'category_id')),
          'categoryProductUrl'],
        [
          this.modals.sequelize.fn('CONCAT', 'categories/',
              this.modals.sequelize.literal('ref_id'),
              '/insights?subCategoryId=', this.modals.sequelize.literal(
                  'category_id')),
          'categoryInsightUrl'],
        [
          this.modals.sequelize.fn('CONCAT', '/categories/',
              this.modals.sequelize.literal('category_id'),
              '/images/'),
          'categoryImageUrl']],
      order: ['category_id'],
    }).then((result) => {
      categoryData = result.map(item => item.toJSON());
      if (isBrandFormRequired) {
        return Promise.all([
          this.brandAdaptor.retrieveCategoryBrands({
            category_id: categoryData.map(item => item.id),
            status_type: 1,
          }), this.retrieveCategoryForms({
            category_id: categoryData.map(item => item.id),
            status_type: 1,
          })]);
      }

      return undefined;
    }).then((results) => {
      if (results) {
        categoryData = categoryData.map((item) => {
          item.brands = results[0].filter(
              (brandItem) => brandItem.categoryId === item.id);
          item.categoryForms = results[1].filter(
              (formItem) => formItem.categoryId === item.id);
          return item;
        });
      }
      return categoryData;
    });
  }

  retrieveCategoryForms(options) {
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
              'status'],
          ],
          required: false,
        },
      ],
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
        ['display_index', 'displayIndex'],
      ],
      order: ['display_index'],
    }).then((formResult) => formResult.map(item => item.toJSON()));
  }
}