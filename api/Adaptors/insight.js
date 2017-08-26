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
        const categoryData = result.map((item) => {
          const categoryItem = item.toJSON();
          categoryItem.totalAmount = categoryItem.totalAmount || 0;
          categoryItem.totalTax = categoryItem.totalTax || 0;
          return categoryItem;
        });
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
      }).catch(err => ({
        status: false,
        message: 'Insight restore failed',
        err
      }));
  }

  prepareCategoryData(user, minDate, maxDate) {
    const previousDays = new Date() - (7 * 24 * 60 * 60 * 1000);
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
            model: this.modals.consumerBillDetails,
            as: 'consumerBill',
            where: {
              status_id: {
                $ne: 3
              },
              purchase_date: {
                $gte: minDate ? new Date(minDate) : new Date(previousDays),
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
        group: '`categories`.`category_id`'
      }).then(resolve).catch(reject);
    });
  }
}

module.exports = InsightAdaptor;
