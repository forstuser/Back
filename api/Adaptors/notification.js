const request = require('request');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const env = require('../../config/env');
const config = require('../../config/main');

class NotificationAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveNotifications(user) {
    return Promise.all([
      this.filterUpcomingService(user),
      this.prepareNotificationData(user)
    ]).then((result) => {
      /* const listIndex = (parseInt(pageNo || 1, 10) * 10) - 10; */
      const notifications = [...result[0], ...result[1]];
      return {
        status: true,
        message: 'Mailbox restore Successful',
        notifications
        /* .slice(listIndex, 10), */
        /* nextPageUrl: notifications.length >
         listIndex + 10 ? `consumer/mailbox?pageno=${parseInt(pageNo, 10) + 1}` : '' */
      };
    }).catch(err => ({
      status: false,
      message: 'Mailbox restore failed',
      err
    }));
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
        }]
      }),
      this.modals.amcBills.findAll({
        attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`amcProduct`.`bill_product_id`')), 'productURL']],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date()
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
        attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`insuredProduct`.`bill_product_id`')), 'productURL']],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date()
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
        attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`warrantyProduct`.`bill_product_id`')), 'productURL']],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date()
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

          product.productMetaData.map((metaItem) => {
            const metaData = metaItem;
            if (metaData.type === '2' && metaData.selectedValue) {
              metaData.value = metaData.selectedValue.value;
            }

            if (metaData.name.toLowerCase().includes('due') && metaData.name.toLowerCase().includes('date')) {
              const dueDateTime = new Date(metaData.value).getTime();
              if (dueDateTime >= new Date().getTime()) {
                product.dueDate = metaData.value;
                product.dueIn = Math.floor((dueDateTime - new Date()
                  .getTime()) / (24 * 60 * 60 * 1000));
                if (product.masterCatId.toString() === '6') {
                  product.productType = 5;
                } else {
                  product.title = `${product.productName} Reminder`;
                  product.description = product.description && metaData.name.toLowerCase().includes('address') ? `For ${metaData.value}` : '';
                  product.productType = 4;
                }
              }
            }

            return metaData;
          });

          return product;
        });

        products = products.filter(product => product.dueIn && product
          .dueIn <= 30 && product.dueIn >= 0);
        let amcs = result[1].map((item) => {
          const amc = item.toJSON();
          const dueDateTime = new Date(amc.expiryDate).getTime();
          if (dueDateTime >= new Date().getTime()) {
            amc.dueDate = amc.expiryDate;
            amc.dueIn = Math.floor((dueDateTime - new Date().getTime()) / (24 * 60 * 60 * 1000));
            amc.productType = 3;
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
            insurance.dueDate = insurance.expiryDate;
            insurance.dueIn = Math.floor((dueDateTime - new Date()
              .getTime()) / (24 * 60 * 60 * 1000));
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
            warranty.dueDate = warranty.expiryDate;
            warranty.dueIn = Math.floor((dueDateTime - new Date()
              .getTime()) / (24 * 60 * 60 * 1000));
            warranty.productType = 3;
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

  prepareNotificationData(user) {
    return this.modals.mailBox.findAll({
      where: {
        user_id: user.ID,
        status_id: {
          $ne: 3
        }
      },
      include: [{
        model: this.modals.productBills,
        as: 'product',
        attributes: [['product_name', 'productName'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`product`.`bill_product_id`')), 'productURL']],
        required: false
      }, {
        model: this.modals.billCopies,
        as: 'copies',
        attributes: [['bill_copy_id', 'billCopyId'], ['bill_copy_type', 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`copies`.`bill_copy_id`'), '/files'), 'fileUrl']],
        required: false
      }],
      order: [['updatedAt', 'DESC']],
      attributes: [['due_amount', 'dueAmount'], ['due_date', 'dueDate'], 'taxes', ['total_amount', 'totalAmount'], ['notification_type', 'productType'], 'title', 'description', ['status_id', 'statusId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`product`.`bill_product_id`')), 'productURL']]
    });
  }

  notifyUser(userId, payload, reply) {
    const whereClause = userId ? {
      ID: userId,
      status_id: {
        $ne: 3
      }
    } : {
      status_id: {
        $ne: 3
      }
    };
    return this.modals.table_users.findAll({
      where: whereClause
    }).then((result) => {
      const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: { Authorization: 'key=AAAAx4_n95E:APA91bE8ZnA83WXrHVdiB31D87eqCGedieYmvfzabLTMyyPdXdWIf3ZWko1EWd1dPwqtlTgxr0YF4tX1ksdsd4LxUnXMyOLF3u9szv3u_yMTWvwOTf64SPnvszmnK5IU8Tc_4apGf78x' },
        json: {
          // note that Sequelize returns token object array, we map it with token value only
          registration_ids: result.map(user => user.gcm_id),
          // iOS requires priority to be set as 'high' for message to be received in background
          priority: 'high',
          data: payload
        }
      };
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          // request was success, should early return response to client
          reply({
            status: true
          }).code(200);
        } else {
          reply({
            status: false,
            error
          }).code(500);
        }
        // extract invalid registration for removal
        if (body.failure > 0 && Array.isArray(body.results) && body
          .results.length === result.length) {
          const results = body.results;
          for (let i = 0; i < result.length; i += 1) {
            if (results[i].error === 'InvalidRegistration') {
              result[i].updateAttributes({
                gcm_id: ''
              });
            }
          }
        }
      });
    });
  }

  verifyEmailAddress(emailSecret) {
    return this.modals.table_users.findOne({
      where: {
        status_id: {
          $ne: 3
        },
        email_secret: emailSecret
      },
      attributes: {
        exclude: ['UserTypeID']
      }
    }).then((result) => {
      result.updateAttributes({
        email_verified: 1
      });

      return 'Thanks for registering with BinBill.';
    }).catch(() => '');
  }

  static sendVerificationMail(email, user) {
    const smtpTransporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASSWORD
      },
      secure: true,
      port: 465
    }));


    // setup email data with unicode symbols
    const mailOptions = {
      from: '"BinBill" <noreply@binbill.com>', // sender address
      to: email, // list of receivers
      subject: 'SAFER Email Verification',
      html: `Hi ${user.fullname},<br /><br /> <a href='${config.SERVER_HOST[env]}verify/${user.email_secret}' >Click here</a> to verify your email account -<br /><a href='${config.SERVER_HOST[env]}verify/${user.email_secret}' >${config.SERVER_HOST[env]}verify/${user.email_secret}</a><br /> Welcome to the safe and connected world!<br /><br />Regards,<br />BinBill`
    };

    // send mail with defined transport object
    smtpTransporter.sendMail(mailOptions);
  }
}

module.exports = NotificationAdaptor;
