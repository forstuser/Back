
const dueDays = {
  Yearly: 365, HalfYearly: 180, Quarterly: 90, Monthly: 30, Weekly: 7, Daily: 1
};

class EHomeAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  prepareEHomeResult(user) {
    return Promise.all([
      this.retrieveUnProcessedBills(user),
      this.prepareCategoryData(user),
      this.retrieveRecentSearch(user)
    ]).then((result) => {
      const categoryList = result[1].map((item) => {
        const categoryData = item.toJSON();
        categoryData.cURL += categoryData.subCategories.length > 0 && categoryData.subCategories[0].categoryType > 0 ? categoryData.subCategories[0].categoryId : '';
        return categoryData;
      });
      const recentSearches = result[2].map(item => item.toJSON());

      return {
        status: true,
        message: 'EHome restore successful',
        notificationCount: '2',
        recentSearches: recentSearches.map(item => item.searchValue),
        unProcessedBills: result[0],
        categoryList
      };
    }).catch(err => ({
      status: false,
      message: 'EHome restore failed',
      err
    }));
  }

  retrieveUnProcessedBills(user) {
    return new Promise((resolve, reject) => {
      this.modals.consumerBills.findAll({
        attributes: [['created_on', 'uploadedDate'], ['bill_id', 'docId']],
        where: {
          user_id: user.ID,
          user_status: {
            $notIn: [3, 5]
          },
          admin_status: {
            $notIn: [3, 5]
          }
        },
        include: [{ model: this.modals.billCopies,
          as: 'billCopies',
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']],
          where: {
            status_id: {
              $ne: 3
            }
          } }]
      }).then(resolve).catch(reject);
    });
  }

  prepareCategoryData(user) {
    return new Promise((resolve, reject) => {
      this.modals.categories.findAll({
        where: {
          category_level: 1,
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: this.modals.categories,
          on: {
            $or: [
              this.modals.sequelize.where(this.modals.sequelize.col("`subCategories`.`ref_id`"), this.modals.sequelize.col("`categories`.`category_id`"))
            ]
          },
          where: {
            display_id: 1
          },
          as: 'subCategories',
          attributes:[['display_id', 'categoryType'], ['category_id', 'categoryId'], ['category_name', 'categoryName']],
          order: [['display_id', 'ASC']],
          required: false
        },
          {
          model: this.modals.productBills,
          as: 'products',
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            }
          },
          include: [{
            model: this.modals.consumerBills,
            as: 'productBillMaps',
            where: {
              user_status: 5,
              admin_status: 5
            },
            attributes: []
          }],
          attributes: [],
          required: false
        }],
        attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/products?pageno=1&categoryid='), 'cURL'], [this.modals.sequelize.fn('MAX', this.modals.sequelize.col('`products->productBillMaps`.`updated_on`')), 'cLastUpdate'], [this.modals.sequelize.fn('COUNT', this.modals.sequelize.col('`products`.`product_name`')), 'productCounts']],
        order: ['display_id'],
        group: '`categories`.`category_id`'
      }).then(resolve).catch(reject);
    });
  }

  retrieveRecentSearch(user) {
    return new Promise((resolve, reject) => {
      this.modals.recentSearches.findAll({
        where: {
          user_id: user.ID
        },
        order: [['searchDate', 'DESC']],
        attributes: ['searchValue']
      }).then(resolve).catch(reject);
    });
  }

  prepareProductDetail(user, masterCategoryId, categoryId, pageNo) {
    const promisedQuery = Promise
      .all([this.fetchProductDetails(user, masterCategoryId, categoryId || undefined),
        this.modals.categories.findAll({
          where: {
            ref_id: masterCategoryId,
            status_id: {
              $ne: 3
            }
          },
          include: [{
            model: this.modals.categories,
            on: {
              $or: [
                this.modals.sequelize.where(this.modals.sequelize.col("`subCategories`.`ref_id`"), this.modals.sequelize.col("`categories`.`category_id`"))
              ]
            },
            as: 'subCategories',
            where: {
              status_id: {
                $ne: 3
              }
            },
            attributes: [['category_id', 'id'], ['category_name', 'name']],
            required: false
          }],
          attributes: [['category_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'categories/', masterCategoryId, '/products?pageno=1&categoryid=', this.modals.sequelize.col('`categories`.`category_id`')), 'cURL'], ['display_id', 'cType'], ['category_name', 'name']]
        }), this.modals.table_brands.findAll({
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['brand_id', 'id'], ['brand_name', 'name']]
        }), this.modals.offlineSeller.findAll({
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: ['ID', ['offline_seller_name', 'name']]
        }), this.modals.onlineSeller.findAll({
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: ['ID', ['seller_name', 'name']]
        }), this.retrieveRecentSearch(user), this.modals.categories.findOne({
          where: {
            category_id: masterCategoryId
          },
          attributes: [['category_name', 'name']]
        })]);
    return promisedQuery.then((result) => {
      const productList = result[0].map((item) => {
        let product = item.toJSON();
        product.productMetaData.map((metaData) => {
          if(metaData.type === "2" && metaData.selectedValue){
            metaData.value = metaData.selectedValue.value;
          }

          return metaData;
        });
        return product;
      });
      const listIndex = (pageNo * 10) - 10;
      return {
        status: true,
        productList: productList.slice((pageNo * 10) - 10, 10),
        filterData: {
          categories: result[1],
          brands: result[2],
          sellers: {
            offlineSellers: result[3],
            onlineSellers: result[4]
          }
        },
        recentSearches: result[5],
        categoryName: result[6],
        nextPageUrl: productList.length > listIndex + 10 ? `categories/${masterCategoryId}/products?pageno=${pageNo + 1}&categoryid=${categoryId}` : ''
      };
    }).catch(err => ({
      status: false,
      err
    }));
  }

  fetchProductDetails(user, masterCategoryId, categoryId) {
    return this.modals.productBills.findAll({
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        },
        master_category_id: masterCategoryId,
        category_id: categoryId
      },
      include: [
        {
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['invoice_number', 'invoiceNo'], ['purchase_date', 'purchaseDate']],
          include: [{
            model: this.modals.billDetailCopies,
            as: 'billDetailCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          },
            {
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            },
            {
              model: this.modals.offlineSeller,
              as: 'productOfflineSeller',
              attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']]
            }, {
            model: this.modals.onlineSeller,
            as: 'productOnlineSeller',
            attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']]
          }],
          required: false
        },
        {
          model: this.modals.consumerBills,
          as: 'productBillMaps',
          where: {
            user_status: 5,
            admin_status: 5
          },
          attributes: [],
          required: false
        },
        {
          model: this.modals.table_brands,
          as: 'brand',
          attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
          required: false
        },
        {
          model: this.modals.table_color,
          as: 'color',
          attributes: [['color_name', 'name'], ['color_id', 'id']],
          required: false
        },
        {
          model: this.modals.amcBills,
          as: 'amcDetails',
          attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  (dueDays[this.modals.sequelize.col('premiumType')] -30) : 7) * 24 * 60 * 60 * 1000)),
              $lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
            }
          },
          required: false
        },
        {
          model: this.modals.insuranceBills,
          as: 'insuranceDetails',
          attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  (dueDays[this.modals.sequelize.col('premiumType')] -30) : 7) * 24 * 60 * 60 * 1000)),
              $lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
            }
          },
          required: false
        },
        {
          model: this.modals.warranty,
          as: 'warrantyDetails',
          attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  (dueDays[this.modals.sequelize.col('premiumType')] -30) : 7) * 24 * 60 * 60 * 1000)),
              $lte: new Date(new Date() + ((this.modals.sequelize.col('premiumType') ?  dueDays[this.modals.sequelize.col('premiumType')] : 7) * 24 * 60 * 60 * 1000))
            }
          },
          required: false
        },
        {
          model: this.modals.productMetaData,
          as: 'productMetaData',
          attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('upper', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
          include: [{
            model: this.modals.categoryForm, as: 'categoryForm', attributes: []
          },
            {
              model: this.modals.categoryFormMapping,
              as: 'selectedValue',
              on: {
                $or: [
                  this.modals.sequelize.where(this.modals.sequelize.col("`productMetaData`.`category_form_id`"), this.modals.sequelize.col("`productMetaData->categoryForm`.`category_form_id`"))
                ]
              },
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col("`productMetaData`.`form_element_value`"), this.modals.sequelize.col("`productMetaData->selectedValue`.`mapping_id`")),
                  this.modals.sequelize.where(this.modals.sequelize.col("`productMetaData->categoryForm`.`form_element_type`"), 2)]
              },
              attributes: [['dropdown_name', 'value']],
              required: false
            }],
          required: false
        }, {
        model: this.modals.categories,
        as: 'masterCategory',
        attributes: []
      }, {
        model: this.modals.categories,
        as: 'category',
        attributes: []
      }],
      attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
      order: [['bill_product_id', 'DESC']]
    });
  }
}

module.exports = EHomeAdaptor;
