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
            notificationCount: 0,
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
    return !(minDate || maxDate) ? Promise.all([this.modals.categories
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
              include: [
                {
                  model: this.modals.consumerBills,
                  as: 'bill',
                  where: {
                    $and: [
                      this.modals.sequelize.where(this.modals.sequelize.col("`products->consumerBill->bill->billMapping`.`bill_ref_type`"), 1),
                      {
                        user_status: 5,
                        admin_status: 5
                      }
                    ]
                  },
                  attributes: []
                }
              ],
              attributes: [],
              required: true
            }],
            attributes: [],
            required: false,
            group: '`products`.`master_category_id`'
          }],
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights?pageno=1'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: ['display_id']
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
          attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/insights?pageno=1'), 'cURL'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`value_of_purchase`')), 'totalAmount'], [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('`products`.`taxes`')), 'totalTax']],
          group: '`categories`.`category_id`',
          order: ['display_id']
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
          order: ['display_id']
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
          order: ['display_id']
        });
  }

  prepareCategoryInsight(user, masterCategoryId, pageNo) {
    const promisedQuery = Promise
        .all([this.fetchProductDetails(user, masterCategoryId),
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
            attributes: [['category_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'categories/', masterCategoryId, '/insights?pageno=1&ctype=', this.modals.sequelize.col('`categories`.`display_id`')), 'cURL'], ['display_id', 'cType'], ['category_name', 'name']]
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
          }), this.modals.categories.findOne({
            where: {
              category_id: masterCategoryId
            },
            attributes: [['category_name', 'name']]
          })]);
    return promisedQuery.then((result) => {
      const productList = result[0].map((item) => {
        let product = item.toJSON();
        product.productMetaData.map((metaData) => {
          if (metaData.type === "2" && metaData.selectedValue) {
            metaData.value = metaData.selectedValue.value;
          }

          return metaData;
        });
        return product;
      });

      const productCostDetails = result[0].map((item) => {
        let product = item.toJSON();
        return {
          value: product.value,
          date: product.consumerBill.purchaseDate,
          totalCost: product.consumerBill.totalCost,
          totalTax: product.consumerBill.taxes,
          tax: product.taxes
        };
      });
      const listIndex = (pageNo * 10) - 10;
      return pageNo > 1 ? {
        status: true,
        productList: productList.slice((pageNo * 10) - 10, 10),
        categoryName: result[5],
        nextPageUrl: productList.length > listIndex + 10 ? `categories/${masterCategoryId}/insights?pageno=${pageNo + 1}` : ''

      } : {
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
        productCostDetails,
        categoryName: result[5],
        nextPageUrl: productList.length > listIndex + 10 ? `categories/${masterCategoryId}/insights?pageno=${pageNo + 1}` : ''
      };
    }).catch(err => ({
      status: false,
      err
    }));
  }

  fetchProductDetails(user, masterCategoryId) {
    const whereClause = {
      user_id: user.ID,
      status_id: {
        $ne: 3
      },
      master_category_id: masterCategoryId
    };
    return this.modals.productBills.findAll({
      where: whereClause,
      include: [
        {
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
          include: [{
            model: this.modals.billDetailCopies,
            as: 'billDetailCopies',
            include: [{
              model: this.modals.billCopies,
              as: 'billCopies',
              attributes: []
            }],
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', '`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`'), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
          },
            {
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col("`consumerBill->bill->billMapping`.`bill_ref_type`"), 1),
                  {
                    user_status: 5,
                    admin_status: 5
                  }
                ]
              },
              attributes: []
            },
            {
              model: this.modals.offlineSeller,
              as: 'productOfflineSeller',
              where: {
                $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
              },
              attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url']],
              required: false
            },
            {
              model: this.modals.onlineSeller,
              as: 'productOnlineSeller',
              where: {
                $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
              },
              attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
              required: false
            }],
          required: true
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
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
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
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
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
              $gt: new Date(new Date() + (7 * 24 * 60 * 60 * 1000))
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

module.exports = InsightAdaptor;
