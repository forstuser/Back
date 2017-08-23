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
    this.modals.consumerBills.hasOne(this.modals.table_users, { foreignKey: 'user_id', as: 'consumer' });
    this.modals.table_users.hasMany(this.modals.consumerBills);
    this.modals.consumerBills.hasMany(this.modals.consumerBillDetails, { foreignKey: 'bill_id', as: 'billDetails' });
    this.modals.consumerBillDetails.belongsTo(this.modals.consumerBills);
    this.modals.consumerBillDetails.hasMany(this.modals.productBills, { foreignKey: 'bill_detail_id', as: 'products' });
    this.modals.productBills.belongsTo(this.modals.consumerBillDetails, { foreignKey: 'bill_detail_id', as: 'consumerBill' });
    this.modals.productBills.hasMany(this.modals.amcBills, { foreignKey: 'bill_product_id', as: 'amcDetails' });
    this.modals.amcBills.belongsTo(this.modals.productBills, { foreignKey: 'bill_product_id', as: 'amcProduct' });
    this.modals.productBills.hasMany(this.modals.insuranceBills, {
      foreignKey: 'bill_product_id',
      as: 'insuranceDetails'
    });
    this.modals.insuranceBills.belongsTo(this.modals.productBills, {
      foreignKey: 'bill_product_id',
      as: 'insuredProduct'
    });
    this.modals.productBills.hasMany(this.modals.warranty, { foreignKey: 'bill_product_id', as: 'warrantyDetails' });
    this.modals.warranty.belongsTo(this.modals.productBills, { foreignKey: 'bill_product_id', as: 'warrantyProduct' });
    this.modals.warranty.hasMany(this.modals.warrantyCopies, { foreignKey: 'bill_warranty_id', as: 'warrantyCopies' });
    this.modals.amcBills.hasMany(this.modals.amcBillCopies, { foreignKey: 'bill_amc_id', as: 'amcCopies' });
    this.modals.insuranceBills.hasMany(this.modals.insuranceBillCopies, {
      foreignKey: 'bill_insurance_id',
      as: 'insuranceCopies'
    });
    this.modals.consumerBillDetails.hasMany(this.modals.billDetailCopies, {
      foreignKey: 'bill_detail_id',
      as: 'billDetailCopies'
    });
  }

  prepareDashboardResult(isNewUser, user, token) {
    if (!isNewUser) {
      return this.modals.consumerBills.findOne({
        attributes: { exclude: ['tableUserID'] },
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
            const insightData = result[1];
            const insightResult = insightData ? {
              StartDate: insightData[0].PurchaseDate,
              EndDate: insightData[insightData.length - 1].PurchaseDate,
              TotalSpend: sumProps(insightData, 'TotalValue'),
              TotalDays: insightData.length,
              insightData
            } : {
              StartDate: '',
              EndDate: '',
              TotalSpend: 0,
              TotalDays: 0,
              insightData
            };
            return {
              status: true,
              message: 'Dashboard restore Successful',
              authorization: token,
              notificationCount: '2',
              recentSearches: result[2],
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
          authorization: token,
          notificationCount: '2',
          recentSearches: [
            'Amazon',
            'BigBasket',
            'AirBnB',
            'Uber',
            'Ola'
          ],
          upcomingServices: [
            {
              id: '10',
              type: '1',
              title: 'Electricity Bill Payment',
              subTitle: '819 Olin Rapid Suite 780',
              amount: '2,500',
              dueOn: '2017-08-30 00:00:00'
            },
            {
              Id: '11',
              Type: '2',
              Title: 'Warranty expiring',
              SubTitle: 'Sony Headphones',
              Amount: '',
              DueOn: '2017-08-26 00:00:00'
            },
            {
              Id: '12',
              Type: '3',
              Title: 'Insurance expiring',
              SubTitle: 'Hero Honda CD Deluxe',
              Amount: '',
              DueOn: '2017-09-5 00:00:00'
            },
            {
              Id: '13',
              Type: '4',
              Title: 'Service scheduled',
              SubTitle: 'MacBook Pro 15” Retina',
              Amount: '',
              DueOn: '2017-09-15 00:00:00'
            }
          ],
          INSIGHT: {
            StartDate: '2017-08-08 00:00:00',
            EndDate: '2017-08-14 00:00:00',
            TotalSpend: '31400',
            TotalDays: '7',
            Day1: '5100',
            Day2: '700',
            Day3: '2500',
            Day4: '150',
            Day5: '440',
            Day6: '540',
            Day7: '21970'
          }
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
        attributes: [['bill_product_id', 'id'], 'product_name', 'value', 'taxes'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          masterCatID: 8
        },
        include: [{ model: this.modals.consumerBillDetails, as: 'consumerBill', attributes: [['document_id', 'docId']], include: [{ model: this.modals.billDetailCopies, as: 'billDetailCopies', attributes: [['bill_copy_id', 'billCopyId']] }] }]
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
        include: [{ model: this.modals.productBills, as: 'amcProduct', attributes: [['product_name', 'productName']] }, { model: this.modals.amcBillCopies, as: 'amcCopies', attributes: [['bill_copy_id', 'billCopyId']] }]
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
        include: [{ model: this.modals.productBills, as: 'insuredProduct', attributes: [['product_name', 'productName']] }, { model: this.modals.insuranceBillCopies, as: 'insuranceCopies', attributes: [['bill_copy_id', 'billCopyId']] }]
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
        include: [{ model: this.modals.productBills, as: 'warrantyProduct', attributes: [['product_name', 'productName']] }, { model: this.modals.warrantyCopies, as: 'warrantyCopies', attributes: [['bill_copy_id', 'billCopyId']] }]
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
      }).catch(reject);
    });
  }

  prepareInsightData(user) {
    return new Promise((resolve, reject) => {
      this.modals.consumerBillDetails.findAll({
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          PurchaseDate: {
            $lt: new Date(),
            $gt: new Date(new Date() - (7 * 24 * 60 * 60 * 1000))
          }
        },
        order: [['PurchaseDate', 'ASC']],
        attributes: ['TotalValue', 'PurchaseDate']
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
}

module.exports = DashboardAdaptor;
