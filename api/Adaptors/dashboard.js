class DashboardAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.modals.consumerBills.belongsTo(this.modals.table_users, { foreignKey: 'user_id', as: 'consumer' });
    this.modals.table_users.hasMany(this.modals.consumerBills);
    this.modals.consumerBills.hasMany(this.modals.consumerBillDetails, { foreignKey: 'bill_id', as: 'billDetails' });
    this.modals.consumerBillDetails.belongsTo(this.modals.consumerBills);
    this.modals.consumerBillDetails.hasMany(this.modals.productBills, { foreignKey: 'bill_detail_id', as: 'products' });
    this.modals.productBills.belongsTo(this.modals.consumerBillDetails);
    this.modals.productBills.hasMany(this.modals.amcBills, { foreignKey: 'bill_product_id', as: 'amcDetails' });
    this.modals.amcBills.belongsTo(this.modals.productBills);
    this.modals.productBills.hasMany(this.modals.insuranceBills, { foreignKey: 'bill_product_id', as: 'insuranceDetails' });
    this.modals.insuranceBills.belongsTo(this.modals.productBills);
    this.modals.productBills.hasMany(this.modals.warranty, { foreignKey: 'bill_product_id', as: 'warrantyDetails' });
    this.modals.warranty.belongsTo(this.modals.productBills);
    this.modals.warranty.hasMany(this.modals.warrantyCopies, { foreignKey: 'bill_warranty_id', as: 'warrantyCopies' });
    this.modals.amcBills.hasMany(this.modals.amcBillCopies, { foreignKey: 'bill_amc_id', as: 'amcCopies' });
    this.modals.insuranceBills.hasMany(this.modals.insuranceBillCopies, { foreignKey: 'bill_insurance_id', as: 'insuranceCopies' });
    this.modals.consumerBillDetails.hasMany(this.modals.billDetailCopies, { foreignKey: 'bill_detail_id', as: 'billDetailCopies' });
  }

  prepareDashboardResult(isNewUser, user, token) {
    if (!isNewUser) {
      return {
        Status: true,
        Message: 'Dashboard restore Successful',
        Authorization: token,
        NotificationCount: '2',
        RecentSearches: [
          'Amazon',
          'BigBasket',
          'AirBnB',
          'Uber',
          'Ola'
        ],
        UpcomingServices: [
          {
            Id: '10',
            Type: '1',
            Title: 'Electricity Bill Payment',
            SubTitle: '819 Olin Rapid Suite 780',
            Amount: '2,500',
            DueOn: '2017-08-30 00:00:00'
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
    }

    return {
      Status: true,
      Authorization: token,
      Message: 'Dashboard restore Successful'
    };
  }

  filterUpcomingService(user) {
    this.modals.consumerBills.findAll({
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        }
      }
    }).then((result) => {
      Promise.all([this.modals.productBills.findAll({
        where: {

        }
      })]);
    });
  }
}

module.exports = DashboardAdaptor