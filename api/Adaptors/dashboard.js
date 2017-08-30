const shared = require('../../helpers/shared');
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
      let distinctInsight = [];
      const insightData = result[1].map((item) => {
        const insightItem = item.toJSON();
        const index = distinctInsight.findIndex(distinctItem => (new Date(distinctItem.purchaseDate).getTime() === new Date(insightItem.purchaseDate).getTime()));

        if (index === -1) {
          distinctInsight.push(insightItem);
        } else {
          distinctInsight[index].value += insightItem.value;
        }
      });
      const insightResult = distinctInsight && distinctInsight.length > 0 ? {
        startDate: distinctInsight[0].purchaseDate,
        endDate: distinctInsight[distinctInsight.length - 1].purchaseDate,
        totalSpend: sumProps(distinctInsight, 'value'),
        totalDays: distinctInsight.length,
        distinctInsight
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

            let distinctInsight = [];
            const insightData = result[1].map((item) => {
              const insightItem = item.toJSON();
              const index = distinctInsight.findIndex(distinctItem => (new Date(distinctItem.purchaseDate).getTime() === new Date(insightItem.purchaseDate).getTime()));

              if (index === -1) {
                distinctInsight.push(insightItem);
              } else {
                distinctInsight[index].value += insightItem.value;
              }
            });
            const insightResult = distinctInsight && distinctInsight.length > 0 ? {
              startDate: distinctInsight[0].purchaseDate,
              endDate: distinctInsight[distinctInsight.length - 1].purchaseDate,
              totalSpend: sumProps(distinctInsight, 'value'),
              totalDays: distinctInsight.length,
              distinctInsight
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
        attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          master_category_id: [6,8]
        },
        include: [{
          model: this.modals.consumerBillDetails,
          as: 'consumerBill',
          attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
          include: [{
            model: this.modals.billDetailCopies,
            as: 'billDetailCopies',
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
          }]
        },
          {
            model: this.modals.productMetaData,
            as: 'productMetaData',
            attributes: [['form_element_value', 'value'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
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
        }),
        this.modals.insuranceBills.findAll({
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
        const products = result[0].map((item) => {
          const product = item.toJSON();

          product.productMetaData.map((metaData) => {
            if (metaData.type === "2" && metaData.selectedValue) {
              metaData.value = metaData.selectedValue.value;
            }

            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date')) {
              const dueDateTime = new Date(metaData.value).getTime();
              if(dueDateTime >= new Date().getTime()) {
                product.dueDate = shared.formatDate(metaData.value, 'dd mmm');
                product.dueIn = Math.floor((dueDateTime - new Date().getTime())/(24 * 60 * 60 * 1000));
                if(product.masterCatId.toString() === '6') {
                  product.productType = 5;
                } else {
                product.productType =  1;
                }

              }
            }

            return metaData;
          });

          return product;
        });
        const amcs = result[1].map((item) => {
          const amc = item.toJSON();
            const dueDateTime = new Date(amc.expiryDate).getTime();
            if(dueDateTime >= new Date().getTime()) {
              amc.dueDate = shared.formatDate(amc.expiryDate, 'dd mmm');
              amc.dueIn = Math.floor((dueDateTime - new Date().getTime())/(24 * 60 * 60 * 1000));
              amc.productType =  4;
            }
            
            return amc;
        });
        const insurances = result[2].map((item) => {
          const insurance = item.toJSON();
          const dueDateTime = new Date(insurance.expiryDate).getTime();
          if(dueDateTime >= new Date().getTime()) {
            insurance.dueDate = shared.formatDate(insurance.expiryDate, 'dd mmm');
            insurance.dueIn = Math.floor((dueDateTime - new Date().getTime())/(24 * 60 * 60 * 1000));
            insurance.productType = 3;
          }

          return insurance;
        });
        const warranties = result[3].map((item) => {
          const warranty = item.toJSON();
          const dueDateTime = new Date(warranty.expiryDate).getTime();
          if(dueDateTime >= new Date().getTime()) {
            warranty.dueDate = shared.formatDate(warranty.expiryDate, 'dd mmm');
            warranty.dueIn = Math.floor((dueDateTime - new Date().getTime())/(24 * 60 * 60 * 1000));
            warranty.productType =  2;
          }

          return warranty;
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
