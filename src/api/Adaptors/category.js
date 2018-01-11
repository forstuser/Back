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
      return this.retrieveSubCategories({
        ref_id: categoryData.map(item => item.id),
        category_id: excluded_category_id,
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
      console.log(result);
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
                  category_id: categoryData.map(item => item.id),
                  title: {
                    $iLike: 'IMEI Number',
                  },
                },
              }, {
                $and: {
                  category_id: categoryData.map(item => item.id),
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
                  main_category_id: categoryData.map(item => item.refId),
                  title: {
                    $iLike: 'Vehicle Number',
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
          }), this.modals.insuranceBrands.findAll({
            where: {
              type: [2, 3],
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
          item.insuranceProviders = results[2];
          item.warrantyProviders = results[3];
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
      order: [['type', 'ASC']],
    }).then((renewalTypes) => renewalTypes.map(item => item.toJSON()));
  }
}