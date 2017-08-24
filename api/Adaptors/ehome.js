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
            model: this.modals.consumerBillDetails,
            as: 'consumerBill',
            where: {
              user_id: user.ID,
              status_id: {
                $ne: 3
              }
            },
            attributes: [],
            include: [{
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                user_id: user.ID,
                user_status: 5,
                admin_status: 5
              },
              attributes: []
            }]
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
}

module.exports = EHomeAdaptor;
