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
      const categoryList = result[1];
      return {
        status: true,
        message: 'EHome restore successful',
        notificationCount: '2',
        recentSearches: result[2],
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
          attributes: [['product_name', 'name']],
          required: false
        }],
        attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/products'), 'cURL']]
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

  prepareProductDetail(user, categoryId) {
    return Promise.all([this.modals.productBills.findAll({
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        },
        master_category_id: categoryId
      },
      include: [{
        model: this.modals.consumerBillDetails,
        as: 'consumerBill',
        where: {
          status_id: {
            $ne: 3
          }
        },
        attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
        include: [{
          model: this.modals.billDetailCopies,
          as: 'billDetailCopies',
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
        }, {
          model: this.modals.offlineSeller,
          as: 'productOfflineSeller',
          attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']]
        }, {
          model: this.modals.onlineSeller,
          as: 'productOnlineSeller',
          attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']]
        }],
        required: false
      }, {
        model: this.modals.consumerBills,
        as: 'productBillMaps',
        where: {
          user_status: 5,
          admin_status: 5
        },
        attributes: []
      }, {
        model: this.modals.table_brands,
        as: 'brand',
        attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
        required: false
      }, {
        model: this.modals.table_color,
        as: 'color',
        attributes: [['color_name', 'name'], ['color_id', 'id']],
        required: false
      }, {
        model: this.modals.amcBills,
        as: 'amcDetails',
        attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.insuranceBills,
        as: 'insuranceDetails',
        attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.warranty,
        as: 'warrantyDetails',
        attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.productMetaData,
        as: 'productMetaData',
        attributes: [['form_element_value', 'value']],
        include: [{
          model: this.modals.categoryForm, as: 'categoryForm', attributes: [['form_element_name', 'name']]
        }],
        required: false
      }],
      attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'categories/', categoryId, '/products', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']]
    }), this.modals.categories.findAll({
      where: {
        ref_id: categoryId,
        status_id: {
          $ne: 3
        }
      },
      include: [{
        model: this.modals.categories,
        as: 'subCategories',
        where: {
          status_id: {
            $ne: 3
          }
        },
        attributes: [['category_id', 'id'], ['category_name', 'name']]
      }],
      attributes: [['category_id', 'id'], ['category_name', 'name']]
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
    }), this.retrieveRecentSearch(user)]).then(result => ({
      status: true,
      productList: result[0],
      filterData: {
        categories: result[1],
        brands: result[2],
        sellers: {
          offlineSellers: result[3],
          onlineSellers: result[4]
        }
      },
      recentSearches: result[5]
    })).catch(err => ({
      status: false,
      err
    }));
  }
}

module.exports = EHomeAdaptor;