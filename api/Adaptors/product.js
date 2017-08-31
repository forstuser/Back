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

    return this.modals.productReviews.findOrCreate({
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
          include: [{
            model: this.modals.billCopies,
            as: 'billCopies',
            attributes: []
          }],
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']],
          required: false
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
          attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOfflineSeller`.`offline_seller_id`'), '/reviews?isonlineseller=false'), 'reviewUrl']],
          required: false,
          include: [{
            model: this.modals.offlineSellerDetails,
            as: 'sellerDetails',
            attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
            required: false
          }, {
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }]
        },
        {
          model: this.modals.onlineSeller,
          as: 'productOnlineSeller',
          where: {
            $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
          },
          attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url'], [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOnlineSeller`.`seller_id`'), '/reviews?isonlineseller=true'), 'reviewUrl']],
          include: [{
            model: this.modals.onlineSellerDetails,
            as: 'sellerDetails',
            attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
            required: false
          }, {
            model: this.modals.sellerReviews,
            as: 'sellerReviews',
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
            required: false
          }],
          required: false
        }],
        required: true
      },
      {
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
            $gt: new Date()
          }
        },
        include: [{
          model: this.modals.amcBillCopies,
          as: 'amcCopies',
          include: [{
            model: this.modals.billCopies,
            as: 'billCopies',
            attributes: []
          }],
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`amcDetails->amcCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`amcDetails->amcCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
        },
        {
          model: this.modals.exclusions,
          as: 'exclusions',
          attributes: [['exclusions_name', 'value']]
        },
        {
          model: this.modals.inclusions,
          as: 'inclusions',
          attributes: [['inclusions_name', 'value']]
        }],
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
            $gt: new Date()
          }
        },
        include: [{
          model: this.modals.insuranceBillCopies,
          as: 'insuranceCopies',
          include: [{
            model: this.modals.billCopies,
            as: 'billCopies',
            attributes: []
          }],
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`insuranceDetails->insuranceCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`insuranceDetails->insuranceCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
        },
        {
          model: this.modals.exclusions,
          as: 'exclusions',
          attributes: [['exclusions_name', 'value']]
        },
        {
          model: this.modals.inclusions,
          as: 'inclusions',
          attributes: [['inclusions_name', 'value']]
        }],
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
            $gt: new Date()
          }
        },
        include: [{
          model: this.modals.warrantyCopies,
          as: 'warrantyCopies',
          include: [{
            model: this.modals.billCopies,
            as: 'billCopies',
            attributes: []
          }],
          attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.fn('CONCAT', this.modals.sequelize.col('`warrantyDetails->warrantyCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('`warrantyDetails->warrantyCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
        },
        {
          model: this.modals.exclusions,
          as: 'exclusions',
          attributes: [['exclusions_name', 'value']]
        },
        {
          model: this.modals.inclusions,
          as: 'inclusions',
          attributes: [['inclusions_name', 'value']]
        }],
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
      },
      {
        model: this.modals.productReviews,
        as: 'productReviews',
        attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
        required: false
      },
      {
        model: this.modals.categories,
        as: 'masterCategory',
        attributes: []
      },
      {
        model: this.modals.categories,
        as: 'category',
        attributes: []
      }],
      attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`'), '/reviews'), 'reviewUrl']]
    }).then((result) => {
      const product = result.toJSON();
      product.serviceCenterUrl = `/consumer/servicecenters?brandid=${product.brandId}`;
      product.consumerBill.productOfflineSeller = product.consumerBill
        .productOfflineSeller.map((sellerItem) => {
          const seller = sellerItem;
          seller.sellerDetails.map((sellerDetail) => {
            if (sellerDetail.typeId.toString() === '3') {
              seller.contactNo = seller.contactNo ? `${seller.contactNo}\\${sellerDetail.details}` : sellerDetail.details;
            }

            return sellerDetail;
          });

          return seller;
        });

      product.consumerBill.productOnlineSeller = product
        .consumerBill.productOnlineSeller.map((sellerItem) => {
          const seller = sellerItem;
          seller.sellerDetails.map((sellerDetail) => {
            if (sellerDetail.typeId.toString() === '3') {
              seller.contactNo = seller.contactNo ? `${seller.contactNo}\\${sellerDetail.details}` : sellerDetail.details;
            }

            return sellerDetail;
          });

          return seller;
        });
      const productMetaData = product.productMetaData.map((metaItem) => {
        const metaData = metaItem;
        if (metaData.type === '2' && metaData.selectedValue) {
          metaData.value = metaData.selectedValue.value;
        }

        return metaData;
      });

      const amcDetails = product.amcDetails.map((amcItem) => {
        const amcDetail = amcItem;
        amcDetail.exclusions = amcDetail.exclusions.map(item => item.value);
        amcDetail.inclusions = amcDetail.inclusions.map(item => item.value);

        return amcDetail;
      });

      const warrantyDetails = product.warrantyDetails.map((warrantyItem) => {
        const warrantyCopy = warrantyItem;
        warrantyCopy.exclusions = warrantyCopy.exclusions.map(item => item.value);
        warrantyCopy.inclusions = warrantyCopy.inclusions.map(item => item.value);
        return warrantyCopy;
      });

      const insuranceDetails = product.insuranceDetails.map((insuranceItem) => {
        const insuranceDetail = insuranceItem;
        insuranceDetail.exclusions = insuranceDetail.exclusions.map(item => item.value);
        insuranceDetail.inclusions = insuranceDetail.inclusions.map(item => item.value);
        return insuranceDetail;
      });

      product.insuranceDetails = insuranceDetails;
      product.warrantyDetails = warrantyDetails;
      product.productMetaData = productMetaData;
      product.amcDetails = amcDetails;
      return ({
        status: true,
        product
      });
    }).catch(err => ({
      status: false,
      err
    }));
  }
}

module.exports = ProductAdaptor;
