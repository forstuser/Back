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

class NotificationAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveNotifications(user) {
    return Promise.all([
      this.filterUpcomingService(user),
      this.prepareNotificationData(user)
    ]).then((result) => {
      const notifications = [...result[0], ...result[1]];
      return {
        status: true,
        message: 'Mailbox restore Successful',
        notifications
      };
    }).catch(err => ({
      status: false,
      message: 'Mailbox restore failed',
      err
    }));
  }

filterUpcomingService(user)
{
  return new Promise((resolve, reject) => {
    Promise.all([this.modals.productBills.findAll({
      attributes: [['bill_product_id', 'id'], ['master_category_id', 'masterCatId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL']],
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        },
        master_category_id: [6, 8]
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
      let products = result[0].map((item) => {
        const product = item.toJSON();

        product.productMetaData.map((metaData) => {
          if (metaData.type === "2" && metaData.selectedValue) {
            metaData.value = metaData.selectedValue.value;
          }

          if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date')) {
            const dueDateTime = new Date(metaData.value).getTime();
            if (dueDateTime >= new Date().getTime()) {
              product.dueDate = shared.formatDate(metaData.value, 'dd mmm');
              product.dueIn = Math.floor((dueDateTime - new Date().getTime()) / (24 * 60 * 60 * 1000));
              if (product.masterCatId.toString() === '6') {
                product.productType = 5;
              } else {
                product.title = `${product.productName} Reminder`;
                product.description = product.description && metaData.name.toLowerCase().includes('address') ? `For ${metaData.value}` : '';
                product.productType = 1;
              }
            }
          }

          return metaData;
        });

        return product;
      });

      products = products.filter(product => product.dueIn && product.dueIn <= 30 && product.dueIn >= 0);
      let amcs = result[1].map((item) => {
        const amc = item.toJSON();
        const dueDateTime = new Date(amc.expiryDate).getTime();
        if (dueDateTime >= new Date().getTime()) {
          amc.dueDate = shared.formatDate(amc.expiryDate, 'dd mmm');
          amc.dueIn = Math.floor((dueDateTime - new Date().getTime()) / (24 * 60 * 60 * 1000));
          amc.productType = 4;
          amc.title = 'AMC Renewal Pending';
          amc.description = amc.amcProduct ? amc.amcProduct.productName : '';
        }

        return amc;
      });

      amcs = amcs.filter(amc => amc.dueIn && amc.dueIn <= 30 && amc.dueIn >= 0);
      let insurances = result[2].map((item) => {
        const insurance = item.toJSON();
        const dueDateTime = new Date(insurance.expiryDate).getTime();
        if (dueDateTime >= new Date().getTime()) {
          insurance.dueDate = shared.formatDate(insurance.expiryDate, 'dd mmm');
          insurance.dueIn = Math.floor((dueDateTime - new Date().getTime()) / (24 * 60 * 60 * 1000));
          insurance.productType = 3;
          insurance.title = 'Insurance Renewal Pending';
          insurance.description = insurance.insuredProduct ? insurance.insuredProduct.productName : '';
        }

        return insurance;
      });

      insurances = insurances.filter(item => item.dueIn && item.dueIn <= 30 && item.dueIn >= 0);

      let warranties = result[3].map((item) => {
        const warranty = item.toJSON();
        const dueDateTime = new Date(warranty.expiryDate).getTime();
        if (dueDateTime >= new Date().getTime()) {
          warranty.dueDate = shared.formatDate(warranty.expiryDate, 'dd mmm');
          warranty.dueIn = Math.floor((dueDateTime - new Date().getTime()) / (24 * 60 * 60 * 1000));
          warranty.productType = 2;
          warranty.title = 'Warranty Renewal Pending';
          warranty.description = warranty.warrantyProduct ? warranty.warrantyProduct.productName : '';
        }

        return warranty;
      });

      warranties = warranties.filter(item => item.dueIn && item.dueIn <= 30 && item.dueIn >= 0);

      resolve([...products, ...warranties, ...insurances, ...amcs]);
    }).catch((err) => {
      reject(err);
    });
  });
}

prepareNotificationData(user)
{
  return this.modals.mailBox.findAll({
    where: {
      user_id: user.ID,
      status_id: {
        $ne: 3
      }
    },
    order: [['due_date', 'DESC']],
    attributes: [['due_amount', 'dueAmount'], ['due_date', 'dueDate'], 'taxes', ['total_amount', 'totalAmount'], ['notification_type', 'productType'], 'title', 'description', ['bill_copy_id', 'copyId'], ['status_id', 'statusId']]
  });
}

retrieveRecentSearch(user)
{
  return this.modals.recentSearches.findAll({
    where: {
      user_id: user.ID
    },
    order: [['searchDate', 'DESC']],
    attributes: ['searchValue']
  });
}
}

module.exports = NotificationAdaptor;
