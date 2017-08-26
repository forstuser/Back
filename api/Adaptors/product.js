const dueDays = {
  Yearly: 365, HalfYearly: 180, Quarterly: 90, Monthly: 30, Weekly: 7, Daily: 1
};

class ProductAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  updateBrandReview(user, brandId, payload) {
    return this.modals.brandReviews.findOrCreate({
      where: {
        user_id: user.ID,
        brand_id: brandId,
        status_id: 1
      },
      defaults: {
        user_id: user.ID,
        brand_id: brandId,
        status_id: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      }
    }).then((result) => {
      if (!result[1]) {
        result[0].updateAttributes({
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        });
      }

      return { status: true, message: 'Review Updated Successfully' };
    }).catch(err => ({ status: true, message: 'Review Update Failed', err }));
  }

  updateSellerReview(user, sellerId, isOnlineSeller, payload) {
    const whereClause = isOnlineSeller ? {
      user_id: user.ID,
      seller_id: sellerId,
      status_id: 1
    } : {
      user_id: user.ID,
      offline_seller_id: sellerId,
      status_id: 1
    };

    const defaultClause = isOnlineSeller ? {
      user_id: user.ID,
      seller_id: sellerId,
      status_id: 1,
      review_ratings: payload.ratings,
      review_feedback: payload.feedback,
      review_comments: payload.comments
    } : {
      user_id: user.ID,
      offline_seller_id: sellerId,
      status_id: 1,
      review_ratings: payload.ratings,
      review_feedback: payload.feedback,
      review_comments: payload.comments
    };

    return this.modals.sellerReviews.findOrCreate({
      where: whereClause,
      defaults: defaultClause
    }).then((result) => {
      if (!result[1]) {
        result[0].updateAttributes({
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        });
      }

      return { status: true, message: 'Review Updated Successfully' };
    }).catch(err => ({ status: true, message: 'Review Update Failed', err }));
  }

  updateProductReview(user, productId, payload) {
    const whereClause = {
      user_id: user.ID,
      bill_product_id: productId,
      status_id: 1
    };

    return this.modals.sellerReviews.findOrCreate({
      where: whereClause,
      defaults: {
        user_id: user.ID,
        bill_product_id: productId,
        status_id: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      }
    }).then((result) => {
      if (!result[1]) {
        result[0].updateAttributes({
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        });
      }

      return { status: true, message: 'Review Updated Successfully' };
    }).catch(err => ({ status: true, message: 'Review Update Failed', err }));
  }

  prepareProductDetail(user, productId) {
    return this.modals.productBills.findOne({
      where: {
        bill_product_id: productId
      },
      include: [{
        model: this.modals.consumerBillDetails,
        as: 'consumerBill',
        attributes: [['document_id', 'docId'], ['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
        include: [{
          model: this.modals.billDetailCopies,
          as: 'billDetailCopies',
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']]
        }, {
          model: this.modals.offlineSeller,
          as: 'productOfflineSeller',
          attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOfflineSeller`.`offline_seller_id`'), '/reviews?isonlineseller=false'), 'reviewUrl']],
          required: false,
          include: [{
            model: this.modals.offlineSellerDetails,
            as: 'sellerDetails',
            attributes: [['display_name', 'displayName'], 'details']
          }, {
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }]
        }, {
          model: this.modals.onlineSeller,
          as: 'productOnlineSeller',
          attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url'], [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOnlineSeller`.`seller_id`'), '/reviews?isonlineseller=true'), 'reviewUrl']],
          include: [{
            model: this.modals.onlineSellerDetails,
            as: 'sellerDetails',
            attributes: [['display_name', 'displayName'], 'details']
          }, {
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }]
        }],
        required: false
      }, {
        model: this.modals.table_brands,
        as: 'brand',
        attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('`brand`.`brand_id`'), '/reviews'), 'reviewUrl']],
        required: false,
        include: [{
          model: this.modals.brandReviews,
          as: 'brandReviews',
          attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
          required: false
        }]
      }, {
        model: this.modals.table_color,
        as: 'color',
        attributes: [['color_name', 'name'], ['color_id', 'id']],
        required: false
      }, {
        model: this.modals.amcBills,
        as: 'amcDetails',
        attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.insuranceBills,
        as: 'insuranceDetails',
        attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.warranty,
        as: 'warrantyDetails',
        attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
        where: {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          expiryDate: {
            $gt: new Date(),
            $lte: new Date(new Date() + (dueDays[this.modals.sequelize.col('premiumType')] * 24 * 60 * 60 * 1000))
          }
        },
        required: false
      }, {
        model: this.modals.productMetaData,
        as: 'productMetaData',
        attributes: [['form_element_value', 'value']],
        include: [{
          model: this.modals.categoryForm, as: 'categoryForm', attributes: [['form_element_name', 'name']]
        }],
        required: false
      }, {
        model: this.modals.productReviews,
        as: 'productReviews',
        attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
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
      attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`'), '/reviews'), 'reviewUrl']]
    }).then(result => ({
      status: true,
      product: result
    })).catch(err => ({
      status: false,
      err
    }));
  }
}

module.exports = ProductAdaptor;