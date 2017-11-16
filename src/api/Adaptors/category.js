export default class CategoryAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveCategories(options) {
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
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  '/products?subCategoryId=', this.modals.sequelize.literal(
                      '"subCategories"."category_id"')),
              'categoryProductUrl'],
            [
              this.modals.sequelize.fn('CONCAT', 'categories/',
                  this.modals.sequelize.literal('"categories"."category_id"'),
                  '/insights?subCategoryId=', this.modals.sequelize.literal(
                      '"subCategories"."category_id"')),
              'categoryInsightUrl']],
          required: false,
        },
      ],
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
    }).then(result => result.map(item => item.toJSON()));
  }
}