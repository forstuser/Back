function sumProps(arrayItem, prop) {
  let total = 0;
  for (let i = 0; i < arrayItem.length; i += 1) {
    total += arrayItem[i][prop] || 0;
  }
  return total;
}

class InsightAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  prepareInsightData(user, minDate, maxDate) {
    return this.prepareCategoryData(user, minDate, maxDate)
      .then((result) => {
        const categoryData = !(minDate || maxDate) ? {
          weeklyData: result[0].map((periodItem) => {
            const categoryPeriodItem = periodItem.toJSON();
            categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
            categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
            return categoryPeriodItem;
          }),
          monthlyData: result[1].map((periodItem) => {
            const categoryPeriodItem = periodItem.toJSON();
            categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
            categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
            return categoryPeriodItem;
          }),
          yearlyData: result[2].map((periodItem) => {
            const categoryPeriodItem = periodItem.toJSON();
            categoryPeriodItem.totalAmount = categoryPeriodItem.totalAmount || 0;
            categoryPeriodItem.totalTax = categoryPeriodItem.totalTax || 0;
            return categoryPeriodItem;
          })
        } : result.map((item) => {
          const categoryItem = item.toJSON();
          categoryItem.totalAmount = categoryItem.totalAmount || 0;
          categoryItem.totalTax = categoryItem.totalTax || 0;
          return categoryItem;
        });

        if (minDate || maxDate) {
          const totalAmounts = sumProps(categoryData, 'totalAmount');
          const totalTaxes = sumProps(categoryData, 'totalTax');
          return {
            status: true,
            message: 'Insight restore successful',
            notificationCount: '2',
            categoryData,
            totalSpend: totalAmounts + totalTaxes,
            totalTaxes
          };
        }

        const totalWeeklyAmounts = sumProps(categoryData.weeklyData, 'totalAmount');
        const totalWeeklyTaxes = sumProps(categoryData.weeklyData, 'totalTax');
        const totalYearlyAmounts = sumProps(categoryData.yearlyData, 'totalAmount');
        const totalYearlyTaxes = sumProps(categoryData.yearlyData, 'totalTax');
        const totalMonthlyAmounts = sumProps(categoryData.monthlyData, 'totalAmount');
        const totalMonthlyTaxes = sumProps(categoryData.monthlyData, 'totalTax');
        return {
          status: true,
          message: 'Insight restore successful',
          notificationCount: '2',
          categoryData,
          totalYearlySpend: totalYearlyAmounts + totalYearlyTaxes,
          totalWeeklySpend: totalWeeklyAmounts + totalWeeklyTaxes,
          totalWeeklyTaxes,
          totalYearlyTaxes,
          totalMonthlySpend: totalMonthlyAmounts + totalMonthlyTaxes,
          totalMonthlyTaxes
        };
      }).catch(err => ({
        status: false,
        message: 'Insight restore failed',
        err
      }));
  }

  prepareCategoryData(user, minDate, maxDate) {
    const sevenDayDifference = new Date() - (7 * 24 * 60 * 60 * 1000);
    const monthDifference = new Date() - (30 * 24 * 60 * 60 * 1000);
    const yearDifference = new Date() - (365 * 24 * 60 * 60 * 1000);
    return new Promise((resolve, reject) => {
      const promiseQuery = !(minDate || maxDate) ? Promise.all([this.modals.categories
        .findAll({
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
              model: this.modals.consumerBillDetails,
              as: 'consumerBill',
              where: {
                status_id: {
                  $ne: 3
                },
                purchase_date: {
                  $gte: new Date(sevenDayDifference),
                  $lte: new Date()
                }
              },
              attributes: [],
              required: true
            }, {
              model: this.modals.consumerBills,
              as: 'productBillMaps',
              where: {
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            }],
            attributes: [],
            required: false,
            group: '`products`.`master_category_id`'
          }],
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: '`categories`.`display_id`'
        }), this.modals.categories
        .findAll({
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
              model: this.modals.consumerBillDetails,
              as: 'consumerBill',
              where: {
                status_id: {
                  $ne: 3
                },
                purchase_date: {
                  $gte: new Date(monthDifference),
                  $lte: new Date()
                }
              },
              attributes: [],
              required: true
            }, {
              model: this.modals.consumerBills,
              as: 'productBillMaps',
              where: {
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            }],
            attributes: [],
            required: false,
            group: '`products`.`master_category_id`'
          }],
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: '`categories`.`display_id`'
        }), this.modals.categories
        .findAll({
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
              model: this.modals.consumerBillDetails,
              as: 'consumerBill',
              where: {
                status_id: {
                  $ne: 3
                },
                purchase_date: {
                  $gte: new Date(yearDifference),
                  $lte: new Date()
                }
              },
              attributes: [],
              required: true
            }, {
              model: this.modals.consumerBills,
              as: 'productBillMaps',
              where: {
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            }],
            attributes: [],
            required: false,
            group: '`products`.`master_category_id`'
          }],
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: '`categories`.`display_id`'
        })]) : this.modals.categories
        .findAll({
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
              model: this.modals.consumerBillDetails,
              as: 'consumerBill',
              where: {
                status_id: {
                  $ne: 3
                },
                purchase_date: {
                  $gte: minDate ? new Date(minDate) : new Date(sevenDayDifference),
                  $lte: maxDate ? new Date(maxDate) : new Date()
                }
              },
              attributes: [],
              required: true
            }, {
              model: this.modals.consumerBills,
              as: 'productBillMaps',
              where: {
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            }],
            attributes: [],
            required: false,
            group: '`products`.`master_category_id`'
          }],
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: '`categories`.`display_id`'
        });
      promiseQuery.then(resolve).catch(reject);
    });
  }

  prepareProductDetail(user, categoryId, pageNo) {
    const promisedQuery = Promise
      .all([this.fetchProductDetails(user, categoryId, pageNo),
        this.modals.categories.findAll({
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
        }), this.retrieveRecentSearch(user), this.modals.categories.findOne({
          where: {
            category_id: categoryId
          },
          attributes: [['category_name', 'name']]
        })]);
    return promisedQuery.then((result) => {
      const productList = result[0].map(item => item.toJSON());
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
        nextPageUrl: productList.length > listIndex + 10 ? `categories/${categoryId}/products?pageno=${pageNo + 1}` : undefined
      };
    }).catch(err => ({
      status: false,
      err
    }));
  }

  fetchProductDetails(user, categoryId) {
    return this.modals.productBills.findAll({
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
        attributes: [],
        include: [{
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
        model: this.modals.productMetaData,
        as: 'productMetaData',
        attributes: [['form_element_value', 'value']],
        include: [{
          model: this.modals.categoryForm, as: 'categoryForm', attributes: [['form_element_name', 'name']]
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

module.exports = InsightAdaptor;
