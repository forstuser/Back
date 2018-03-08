import BrandAdaptor from './brands';

export default class CategoryAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.brandAdaptor = new BrandAdaptor(modals);
  }

  retrieveCategories(options, isBrandFormRequired, language) {
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
          'default_name'],
        [`${language ? `category_name_${language}` : `category_name`}`, 'name'],
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
      categoryData = result.map(item => {
        const categoryItem = item.toJSON();
        categoryItem.name = categoryItem.name || categoryItem.default_name;
        return categoryItem;
      });
      const subCategoryOption = {
        status_type: 1,
        ref_id: categoryData.map(item => item.id),
      };
      const main_category_id = options.category_id;
      const excluded_category_id = main_category_id ? {
        $notIn:
            main_category_id === 1 ?
                [20, 72, 73] :
                main_category_id === 2 ?
                    [327, 162, 530, 581, 491, 541] :
                    main_category_id === 3 ?
                        [139, 138, 154, 150, 153] :
                        [],
      } : undefined;
      if (excluded_category_id) {
        subCategoryOption.category_id = excluded_category_id;
      }

      return this.retrieveSubCategories(subCategoryOption, isBrandFormRequired,
          language);
    }).then((subCategories) => {
      categoryData = categoryData.map((item) => {
        item.subCategories = subCategories.filter(
            (categoryItem) => categoryItem.refId === item.id);

        return item;
      });
      return categoryData;
    });
  }

  retrieveSubCategories(options, isBrandFormRequired, language) {
    let categoryData;
    options.status_type = 1;
    return this.modals.categories.findAll({
      where: options,
      attributes: [
        [
          'category_id',
          'id'],
        [
          'category_name',
          'default_name'],
        [`${language ? `category_name_${language}` : `category_name`}`, 'name'],
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
            $or: [
              {
                $and: {
                  category_id: categoryData.map(item => item.id),
                  title: {
                    $iLike: 'model',
                  },
                },
              }, {
                $and: {
                  main_category_id: categoryData.map(item => item.refId),
                  title: {
                    $iLike: 'IMEI Number',
                  },
                },
              }, {
                $and: {
                  main_category_id: categoryData.map(item => item.refId),
                  title: {
                    $iLike: 'Serial Number',
                  },
                },
              }, {
                $and: {
                  category_id: categoryData.map(item => item.id),
                  title: {
                    $iLike: 'Chasis Number',
                  },
                },
              }, {
                $and: {
                  category_id: categoryData.map(item => item.id),
                  title: {
                    $iLike: 'due date%',
                  },
                },
              }, {
                $and: {
                  category_id: categoryData.map(item => item.id),
                  title: {
                    $iLike: 'due amount%',
                  },
                },
              }, {
                $and: {
                  main_category_id: categoryData.map(item => item.refId),
                  title: {
                    $iLike: 'VIN',
                  },
                },
              }, {
                $and: {
                  main_category_id: categoryData.map(item => item.refId),
                  title: {
                    $iLike: 'Registration Number',
                  },
                },
              }],
            status_type: 1,
          }), this.modals.insuranceBrands.findAll({
            where: {
              type: [1, 3],
              status_type: 1,
            },
            include: {
              model: this.modals.categories,
              where: {
                category_id: options.category_id,
              },
              as: 'categories',
              attributes: [],
              required: true,
            },
            attributes: [
              'id',
              'name',
              [
                this.modals.sequelize.literal('"categories"."category_id"'),
                'category_id']],
          }), this.modals.insuranceBrands.findAll({
            where: {
              type: [2, 3],
              status_type: 1,
            },
            include: {
              model: this.modals.categories,
              where: {
                category_id: options.category_id,
              },
              as: 'categories',
              attributes: [],
              required: true,
            },
            attributes: [
              'id',
              'name',
              [
                this.modals.sequelize.literal('"categories"."category_id"'),
                'category_id']],
          }),
          this.modals.categories.findAll({
            where: {
              status_type: 1,
              ref_id: options.category_id,
              category_level: 3,
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
              'dual_warranty_item',
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
          })]);
      }

      return undefined;
    }).then((results) => {
      if (results) {
        categoryData = categoryData.map((item) => {
          item.brands = results[0].filter(
              (brandItem) => brandItem.categoryId === item.id);
          item.categoryForms = results[1].filter(
              (formItem) => formItem.categoryId === item.id ||
                  formItem.main_category_id === item.refId);
          item.insuranceProviders = results[2];
          item.warrantyProviders = results[3];
          item.subCategories = results[4];
          return item;
        });
      }
      return categoryData;
    }).catch(console.log);
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
        'main_category_id',
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

  retrieveRenewalTypes(options) {
    return this.modals.renewalTypes.findAll({
      where: options,
      order: [['effective_months', 'ASC']],
    }).then((renewalTypes) => renewalTypes.map(item => item.toJSON()));
  }
}