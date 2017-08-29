function sumProps(arrayItem, prop) {
  let total = 0;
  for (let i = 0; i < arrayItem.length; i += 1) {
    total += arrayItem[i][prop];
  }
  return total;
}

const dueDays = {
  Yearly: 365, HalfYearly: 180, Quarterly: 90, Monthly: 30, Weekly: 7, Daily: 1
};

class DashboardAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveDashboardResult(user) {
    return Promise.all([
      this.filterUpcomingService(user),
      this.prepareInsightData(user),
      this.retrieveRecentSearch(user)
    ]).then((result) => {
      const insightData = result[1].map(item => item.toJSON());
      const insightResult = insightData && insightData.length > 0 ? {
        startDate: insightData[0].purchaseDate,
        endDate: insightData[insightData.length - 1].purchaseDate,
        totalSpend: sumProps(insightData, 'value'),
        totalDays: insightData.length,
        insightData
      } : {
        startDate: '',
        endDate: '',
        totalSpend: 0,
        totalDays: 0,
        insightData
      };
      return {
        status: true,
        message: 'Dashboard restore Successful',
        notificationCount: 0,
        recentSearches: result[2].map((item) => {
          const search = item.toJSON();
          return search.searchValue
        }),
        upcomingServices: result[0],
        insight: insightResult
      };
    }).catch(err => ({
      status: false,
      message: 'Dashboard restore failed',
      err
    }));
  }

  prepareDashboardResult(isNewUser, user, token) {
    if (!isNewUser) {
      return this.modals.consumerBills.findOne({
        attributes: {exclude: ['tableUserID']},
        where: {
          user_id: user.ID,
          user_status: {
            $ne: 3
          }
        }
      }).then((bill) => {
        if (bill) {
          return Promise.all([
            this.filterUpcomingService(user),
            this.prepareInsightData(user),
            this.retrieveRecentSearch(user)
          ]).then((result) => {
            const insightData = result[1].map(item => item.toJSON());
            const insightResult = insightData && insightData.length > 0 ? {
              startDate: insightData[0].purchaseDate,
              endDate: insightData[insightData.length - 1].purchaseDate,
              totalSpend: sumProps(insightData, 'value'),
              totalDays: insightData.length,
              insightData
            } : {
              startDate: '',
              endDate: '',
              totalSpend: 0,
              totalDays: 0,
              insightData
            };
            const recentSearches = result[2].map((item) => {
              const search = item.toJSON();
              return search.searchValue
            });
            return {
              status: true,
              message: 'Dashboard restore Successful',
              authorization: token,
              notificationCount: 0,
              recentSearches,
              upcomingServices: result[0],
              insight: insightResult
            };
          }).catch(err => ({
            status: false,
            authorization: token,
            message: 'Dashboard restore failed',
            err
          }));
        }
        return {
          status: true,
          message: 'Dashboard restore Successful',
          notificationCount: 0,
          recentSearches: [],
          upcomingServices: [],
          insight: insightResult
        };
      }).catch(err => ({
        status: false,
        authorization: token,
        message: 'Dashboard restore failed',
        err
      }));
    }

    return {
      Status: true,
      Authorization: token,
      Message: 'Dashboard restore Successful'
    };
  }

  filterUpcomingService(user) {
    return new Promise((resolve, reject) => {
      Promise.all([this.modals.productBills.findAll({
        attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          master_category_id: 8
        },
        include: [{
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          attributes: [['document_id', 'docId']],
          include: [{
            model: this.modals.billDetailCopies,
            as: 'billDetailCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          }]
        }, {
          model: this.modals.productMetaData,
          as: 'productMetaData',
          attributes: [['form_element_value', 'value']],
          include: [{
            model: this.modals.categoryForm, as: 'categoryForm', attributes: [['form_element_name', 'name']]
          }],
          required: false
        }]
      }),
        this.modals.amcBills.findAll({
          attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(),
              $lt: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
            }
          },
          include: [{
            model: this.modals.productBills,
            as: 'amcProduct',
            attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL']]
          }, {
            model: this.modals.amcBillCopies,
            as: 'amcCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          }]
        }), this.modals.insuranceBills.findAll({
          attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(),
              $lt: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
            }
          },
          include: [{
            model: this.modals.productBills,
            as: 'insuredProduct',
            attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL']]
          }, {
            model: this.modals.insuranceBillCopies,
            as: 'insuranceCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          }]
        }),
        this.modals.warranty.findAll({
          attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
          where: {
            user_id: user.ID,
            status_id: {
              $ne: 3
            },
            expiryDate: {
              $gt: new Date(),
              $lt: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
            }
          },
          include: [{
            model: this.modals.productBills,
            as: 'warrantyProduct',
            attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL']]
          }, {
            model: this.modals.warrantyCopies,
            as: 'warrantyCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          }]
        })]).then((result) => {
        const products = result[0].map(item => item.toJSON());
        const amcs = result[1].map(item => item.toJSON());
        const insurances = result[2].map(item => item.toJSON());
        const warranties = result[3].map(item => item.toJSON());
        products.forEach((e) => {
          if (typeof e === 'object') {
            e.productType = 1;
          }
        });
        amcs.forEach((e) => {
          if (typeof e === 'object') {
            e.productType = 4;
          }
        });
        insurances.forEach((e) => {
          if (typeof e === 'object') {
            e.productType = 3;
          }
        });
        warranties.forEach((e) => {
          if (typeof e === 'object') {
            e.productType = 2;
          }
        });

        resolve([...products, ...warranties, ...insurances, ...amcs]);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  prepareInsightData(user) {
    return this.modals.consumerBillDetails.findAll({
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        },
        purchase_date: {
          $lt: new Date(),
          $gt: new Date(new Date() - (7 * 24 * 60 * 60 * 1000))
        }
      },
      order: [['purchase_date', 'ASC']],
      attributes: [['total_purchase_value', 'value'], ['purchase_date', 'purchaseDate']]
    });
  }

  retrieveRecentSearch(user) {
    return this.modals.recentSearches.findAll({
      where: {
        user_id: user.ID
      },
      order: [['searchDate', 'DESC']],
      attributes: ['searchValue']
    });
  }
}

module.exports = DashboardAdaptor;
