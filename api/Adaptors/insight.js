const shared = require('../../helpers/shared');

function sumProps(arrayItem, prop) {
  let total = 0;
  for (let i = 0; i < arrayItem.length; i += 1) {
    total += arrayItem[i][prop] || 0;
  }
  return total;
}

function weekAndDay(d) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const prefixes = [1, 2, 3, 4, 5];

  return { monthWeek: prefixes[Math.round(d.getDate() / 7)], day: days[d.getDay()] };
}


const monthArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const date = new Date();
const monthStartDay = new Date(date.getFullYear(), date.getMonth(), 1);
const monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
const yearStartDay = new Date(date.getFullYear(), 0, 1);
const yearLastDay = new Date(date.getFullYear() + 1, 0, 0);
const first = date.getDate() - date.getDay();
// First day is the day of the month - the day of the week
const last = first + 6;// last day is the first day + 6
const lastDate = new Date(date.setDate(last));

const firstDay = new Date(date.setDate(first));
const lastDay = date.getDate() > lastDate.getDate() ? new Date(date
  .getFullYear(), date.getMonth() + 1, lastDate.getDate()) : lastDate;

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
        } : {
          customDateData: result.map((item) => {
            const categoryItem = item.toJSON();
            categoryItem.totalAmount = categoryItem.totalAmount || 0;
            categoryItem.totalTax = categoryItem.totalTax || 0;
            return categoryItem;
          })
        };

        if (minDate || maxDate) {
          const totalAmounts = sumProps(categoryData, 'totalAmount');
          const totalTaxes = sumProps(categoryData, 'totalTax');
          return {
            status: true,
            message: 'Insight restore successful',
            notificationCount: '2',
            categoryData,
            totalSpend: totalAmounts + totalTaxes,
            totalTaxes,
            startDate: minDate,
            endDate: maxDate
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
          weekStartDate: shared.formatDate(firstDay, 'yyyy-mm-dd'),
          monthStartDate: shared.formatDate(monthStartDay, 'yyyy-mm-dd'),
          weekEndDate: shared.formatDate(lastDay, 'yyyy-mm-dd'),
          monthLastDate: shared.formatDate(monthLastDay, 'yyyy-mm-dd'),
          yearStartDate: shared.formatDate(yearStartDay, 'yyyy-mm-dd'),
          yearEndDate: shared.formatDate(yearLastDay, 'yyyy-mm-dd'),
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
                $gte: new Date(firstDay),
                $lte: new Date(lastDay)
              }
            },
            include: [
              {
                model: this.modals.consumerBills,
                as: 'bill',
                where: {
                  $and: [
                    this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
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
                $gte: new Date(monthStartDay),
                $lte: new Date(monthLastDay)
              }
            },
            include: [
              {
                model: this.modals.consumerBills,
                as: 'bill',
                where: {
                  $and: [
                    this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                    {
                      user_status: 5,
                      admin_status: 5
                    }
                  ]
                },
                attributes: []
              }],
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
      }),
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
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          where: {
            status_id: {
              $ne: 3
            },
            purchase_date: {
              $gte: new Date(yearStartDay),
              $lte: new Date(yearLastDay)
            }
          },
          attributes: [],
          include: [
            {
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                $and: [
                  this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                  {
                    user_status: 5,
                    admin_status: 5
                  }
                ]
              },
              attributes: []
            }],
          required: true
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
                $gte: minDate ? new Date(minDate) : monthStartDay,
                $lte: maxDate ? new Date(maxDate) : monthLastDay
              }
            },
            attributes: [],
            include: [
              {
                model: this.modals.consumerBills,
                as: 'bill',
                where: {
                  $and: [
                    this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
                    {
                      user_status: 5,
                      admin_status: 5
                    }
                  ]
                },
                attributes: []
              }],
            required: true
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

  prepareCategoryInsight(user, masterCategoryId, minDate, maxDate) {
    const promisedQuery = Promise
      .all([this.fetchProductDetails(user, masterCategoryId, minDate, maxDate),
        this.modals.categories.findOne({
          where: {
            category_id: masterCategoryId
          },
          attributes: [['category_name', 'name']]
        })]);
    return promisedQuery.then((result) => {
      const productList = result[0].map((item) => {
        const product = item.toJSON();
        product.productMetaData.map((metaItem) => {
          const metaData = metaItem;
          if (metaData.type === '2' && metaData.selectedValue) {
            metaData.value = metaData.selectedValue.value;
          }

          return metaData;
        });
        return product;
      });

      const distinctInsightWeekly = [];
      const distinctInsightMonthly = [];
      const distinctInsight = [];
      result[0].map((item) => {
        const product = item.toJSON();
        const index = distinctInsight
          .findIndex(distinctItem => (new Date(distinctItem.date)
            .getTime() === new Date(product.consumerBill.purchaseDate).getTime()));
        if (index === -1) {
          distinctInsight.push({
            value: product.value,
            month: monthArray[new Date(product.consumerBill.purchaseDate).getMonth()],
            monthId: new Date(product.consumerBill.purchaseDate).getMonth() + 1,
            date: new Date(product.consumerBill.purchaseDate),
            week: weekAndDay(new Date(product.consumerBill.purchaseDate)).monthWeek,
            day: weekAndDay(new Date(product.consumerBill.purchaseDate)).day,
            totalCost: product.consumerBill.totalCost,
            totalTax: product.consumerBill.taxes,
            tax: product.taxes
          });
        } else {
          distinctInsight[index].value += product.value;
          distinctInsight[index].totalCost += product.consumerBill.totalCost;
          distinctInsight[index].totalTax += product.consumerBill.taxes;
          distinctInsight[index].tax += product.taxes;
        }

        return product;
      });

      const distinctInsightTemp = distinctInsight.map((item) => {
        const dayItem = {
          value: item.value,
          month: item.month,
          monthId: item.monthId,
          date: item.date,
          week: item.week,
          day: item.day,
          totalCost: item.totalCost,
          totalTax: item.totalTax,
          tax: item.tax
        };
        const monthIndex = distinctInsightMonthly
          .findIndex(distinctItem => (distinctItem.month === item.month));
        const weekIndex = distinctInsightWeekly
          .findIndex(distinctItem => (distinctItem.week === item.week));
        if (weekIndex !== -1 && monthIndex !== -1) {
          const currentWeekInsight = distinctInsightWeekly[weekIndex];
          currentWeekInsight.value += item.value;
          currentWeekInsight.totalCost += item.totalCost;
          currentWeekInsight.totalTax += item.totalTax;
          currentWeekInsight.tax += item.tax;
        } else {
          distinctInsightWeekly.push(item);
        }

        if (monthIndex === -1) {
          distinctInsightMonthly.push(item);
        } else {
          const currentMonthInsight = distinctInsightMonthly[monthIndex];
          currentMonthInsight.value += item.value;
          currentMonthInsight.totalCost += item.totalCost;
          currentMonthInsight.totalTax += item.totalTax;
          currentMonthInsight.tax += item.tax;
        }

        return dayItem;
      });

      productList.sort((a, b) => new Date(b
        .consumerBill.purchaseDate) - new Date(a
          .consumerBill.purchaseDate));
      const productListWeekly = productList
        .filter(item => new Date(item
          .consumerBill.purchaseDate).getTime() >= new Date(shared.formatDate(monthStartDay, 'yyyy-mm-dd')).getTime() && new Date(item
            .consumerBill.purchaseDate).getTime() <= new Date(shared.formatDate(monthLastDay, 'yyyy-mm-dd')).getTime()).slice(0, 10);
      const productListMonthly = productList
        .filter(item => new Date(item
          .consumerBill.purchaseDate).getTime() >= new Date(shared.formatDate(yearStartDay, 'yyyy-mm-dd')) && new Date(item
            .consumerBill.purchaseDate).getTime() <= new Date(shared.formatDate(yearLastDay, 'yyyy-mm-dd')).getTime()).slice(0, 10);
      distinctInsightMonthly.sort((a, b) => new Date(b.date) - new Date(a.date));
      distinctInsightWeekly.sort((a, b) => new Date(b.date) - new Date(a.date));

      const insightData = distinctInsightTemp
        .filter(item => new Date(item.date).getTime() >= new Date(shared.formatDate(firstDay, 'yyyy-mm-dd')).getTime() && new Date(item.date).getTime() <= new Date(shared.formatDate(lastDay, 'yyyy-mm-dd')).getTime());
      insightData.sort((a, b) => new Date(b.date) - new Date(a.date));

      const insightWeekly = distinctInsightWeekly
        .filter(item => new Date(item
          .date).getTime() >= new Date(shared.formatDate(monthStartDay, 'yyyy-mm-dd')).getTime() && new Date(item
            .date).getTime() <= new Date(shared.formatDate(monthLastDay, 'yyyy-mm-dd')).getTime());
      const insightMonthly = distinctInsightMonthly
        .filter(item => new Date(item
          .date).getTime() >= new Date(shared.formatDate(yearStartDay, 'yyyy-mm-dd')).getTime() && new Date(item
            .date) <= new Date(shared.formatDate(yearLastDay, 'yyyy-mm-dd')).getTime());
      return {
        status: true,
        productList: productList
          .filter(item => new Date(item
            .consumerBill.purchaseDate).getTime() >= new Date(shared.formatDate(firstDay, 'yyyy-mm-dd')).getTime() && new Date(item
              .consumerBill.purchaseDate).getTime() <= new Date(shared.formatDate(lastDay, 'yyyy-mm-dd')).getTime()).slice(0, 10),
        productListWeekly,
        productListMonthly,
        insight: distinctInsight && distinctInsight.length > 0 ? {
          categoryName: result[1].name,
          startDate: new Date(shared.formatDate(firstDay, 'yyyy-mm-dd')),
          endDate: new Date(shared.formatDate(lastDay, 'yyyy-mm-dd')),
          currentMonthId: new Date().getMonth() + 1,
          currentWeek: weekAndDay(new Date()).monthWeek,
          currentDay: weekAndDay(new Date()).day,
          monthStartDate: new Date(shared.formatDate(monthStartDay, 'yyyy-mm-dd')),
          monthEndDate: new Date(shared.formatDate(monthLastDay, 'yyyy-mm-dd')),
          yearStartDate: new Date(shared.formatDate(yearStartDay, 'yyyy-mm-dd')),
          yearEndDate: new Date(shared.formatDate(yearLastDay, 'yyyy-mm-dd')),
          totalSpend: sumProps(insightData, 'value'),
          totalYearlySpend: sumProps(insightMonthly, 'value'),
          totalMonthlySpend: sumProps(insightWeekly, 'value'),
          totalDays: insightData.length,
          insightData,
          insightWeekly,
          insightMonthly
        } : {
          startDate: new Date(),
          endDate: new Date(),
          totalSpend: 0,
          totalDays: 0,
          insightData: distinctInsight
        },
        categoryName: result[5]
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
    const dateWhereClause = {
      $gte: yearStartDay,
      $lte: yearLastDay
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
            },
            purchase_date: dateWhereClause
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
                this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1),
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
                this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`category_form_id`'), this.modals.sequelize.col('`productMetaData->categoryForm`.`category_form_id`'))
              ]
            },
            where: {
              $and: [
                this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData`.`form_element_value`'), this.modals.sequelize.col('`productMetaData->selectedValue`.`mapping_id`')),
                this.modals.sequelize.where(this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`'), 2)]
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
      attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
      order: [['bill_product_id', 'DESC']]
    });
  }
}

module.exports = InsightAdaptor;
