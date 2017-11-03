/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sortAmcWarrantyInsuranceRepair = function sortAmcWarrantyInsuranceRepair(a, b) {
  var aDate = void 0;
  var bDate = void 0;

  aDate = a.expiryDate;
  bDate = b.expiryDate;

  if (_moment2.default.utc(aDate).isBefore(_moment2.default.utc(bDate))) {
    return 1;
  }

  return -1;
};

var ProductAdaptor = function () {
  function ProductAdaptor(modals) {
    _classCallCheck(this, ProductAdaptor);

    this.modals = modals;
  }

  _createClass(ProductAdaptor, [{
    key: 'retrieveProducts',
    value: function retrieveProducts(options) {
      var _this = this;

      options.status_type = {
        $notIn: [3, 9]
      };

      var products = void 0;
      return this.modals.products.findAll({
        where: options,
        include: [{
          model: this.modals.brands,
          as: 'brand',
          attributes: [['brand_id', 'brandId'], ['brand_name', 'name'], ['brand_description', 'description']],
          required: false
        }, {
          model: this.modals.colours,
          as: 'color',
          attributes: [['colour_id', 'colorId'], ['colour_name', 'colorName']],
          required: false
        }, {
          model: this.modals.bills,
          attributes: [['consumer_name', 'consumerName'], ['consumer_email', 'consumerEmail'], ['consumer_phone_no', 'consumerPhoneNo'], ['document_number', 'invoiceNo']],
          include: [{
            model: this.modals.onlineSellers,
            as: 'sellers',
            attributes: [['seller_name', 'sellerName'], 'url', 'gstin', 'contact', 'email'],
            required: false
          }],
          required: false
        }, {
          model: this.modals.offlineSellers,
          as: 'sellers',
          attributes: [['seller_name', 'sellerName'], ['owner_name', 'ownerName'], ['pan_no', 'panNo'], ['reg_no', 'regNo'], ['is_service', 'isService'], 'url', 'gstin', 'contact', 'email', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'],
          required: false
        }],
        attributes: ['id', ['product_name', 'productName'], ['category_id', 'categoryId'], ['main_category_id', 'masterCategoryId'], ['brand_id', 'brandId'], ['colour_id', 'colorId'], ['purchase_cost', 'value'], 'taxes', [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('category_id'), '/images'), 'cImageURL'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('id')), 'productURL'], ['document_date', 'purchaseDate'], ['document_number', 'documentNo'], ['bill_id', 'billId'], ['job_id', 'jobId'], ['seller_id', 'sellerId'], 'copies']
      }).then(function (productResult) {
        products = productResult.map(function (item) {
          return item.toJSON();
        });
        return _this.retrieveProductMetadata({
          product_id: {
            $in: products.map(function (item) {
              return item.id;
            })
          }
        });
      }).then(function (metaDataResult) {
        var metaData = metaDataResult.map(function (item) {
          return item.toJSON();
        });

        return products.map(function (productItem) {
          productItem.metaData = metaData.filter(function (item) {
            return item.productId === productItem.id;
          });

          return productItem;
        });
      });
    }
  }, {
    key: 'retrieveProductMetadata',
    value: function retrieveProductMetadata(options) {
      options.status_type = {
        $notIn: [3, 9]
      };

      return this.modals.metaData.findAll({
        where: options,
        include: [{
          model: this.modals.categoryForms,
          as: 'categoryForm',
          attributes: []
        }, {
          model: this.modals.dropDowns,
          as: 'dropDown',
          where: {
            $and: [this.modals.sequelize.where(this.modals.sequelize.literal('`metaData`.`form_value`'), this.modals.sequelize.literal('`dropDown`.`type`')), this.modals.sequelize.where(this.modals.sequelize.literal('`categoryForm`.`form_type`'), 2)]
          },
          attributes: ['title'],
          required: false
        }],

        attributes: [['product_id', 'productId'], ['form_value', 'value'], [this.modals.sequelize.literal('categoryForm.title'), 'name'], [this.modals.sequelize.literal('`categoryForm`.`display_index`'), 'displayIndex']]
      }).then(function (metaData) {
        var unOrderedMetaData = metaData.map(function (item) {
          var metaDataItem = item.toJSON();
          metaDataItem.value = metaDataItem.dropDown ? metaDataItem.dropDown.title : metaDataItem.value;
          return metaDataItem;
        });

        unOrderedMetaData.sort(function (itemA, itemB) {
          return itemA.displayIndex - itemB.displayIndex;
        });

        return unOrderedMetaData;
      });
    }
  }, {
    key: 'updateBrandReview',
    value: function updateBrandReview(user, brandId, request) {
      var payload = request.payload;
      return this.modals.brandReviews.findOrCreate({
        where: {
          user_id: user.ID,
          brand_id: brandId,
          status_type: 1
        },
        defaults: {
          user_id: user.ID,
          brand_id: brandId,
          status_type: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        }
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'updateSellerReview',
    value: function updateSellerReview(user, sellerId, isOnlineSeller, request) {
      var payload = request.payload;
      var whereClause = isOnlineSeller ? {
        user_id: user.ID,
        seller_id: sellerId,
        status_type: 1
      } : {
        user_id: user.ID,
        offline_seller_id: sellerId,
        status_type: 1
      };

      var defaultClause = isOnlineSeller ? {
        user_id: user.ID,
        seller_id: sellerId,
        status_type: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      } : {
        user_id: user.ID,
        offline_seller_id: sellerId,
        status_type: 1,
        review_ratings: payload.ratings,
        review_feedback: payload.feedback,
        review_comments: payload.comments
      };

      return this.modals.sellerReviews.findOrCreate({
        where: whereClause,
        defaults: defaultClause
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'updateProductReview',
    value: function updateProductReview(user, productId, request) {
      var payload = request.payload;
      var whereClause = {
        user_id: user.ID,
        bill_product_id: productId,
        status_type: 1
      };

      return this.modals.productReviews.findOrCreate({
        where: whereClause,
        defaults: {
          user_id: user.ID,
          bill_product_id: productId,
          status_type: 1,
          review_ratings: payload.ratings,
          review_feedback: payload.feedback,
          review_comments: payload.comments
        }
      }).then(function (result) {
        if (!result[1]) {
          result[0].updateAttributes({
            review_ratings: payload.ratings,
            review_feedback: payload.feedback,
            review_comments: payload.comments
          });
        }

        return {
          status: true,
          message: 'Review Updated Successfully',
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: true,
          message: 'Review Update Failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'prepareProductDetail',
    value: function prepareProductDetail(user, request) {
      var _this2 = this;

      var productId = request.params.id;
      return this.modals.productBills.findOne({
        where: {
          bill_product_id: productId,
          user_id: user.ID
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
          }, {
            model: this.modals.consumerBills,
            as: 'bill',
            where: {
              $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
                user_status: 5,
                admin_status: 5
              }]
            },
            attributes: []
          }, {
            model: this.modals.offlineSeller,
            as: 'productOfflineSeller',
            where: {
              $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
            },
            attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude', [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOfflineSeller`.`offline_seller_id`'), '/reviews?isonlineseller=false'), 'reviewUrl']],
            required: false,
            include: [{
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
              required: false
            }]
          }, {
            model: this.modals.onlineSeller,
            as: 'productOnlineSeller',
            where: {
              $and: [this.modals.sequelize.where(this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
            },
            attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url'], [this.modals.sequelize.fn('CONCAT', 'sellers/', this.modals.sequelize.col('`consumerBill->productOnlineSeller`.`seller_id`'), '/reviews?isonlineseller=true'), 'reviewUrl']],
            include: [{
              model: this.modals.sellerReviews,
              as: 'sellerReviews',
              attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']],
              required: false
            }],
            required: false
          }],
          required: true
        }, {
          model: this.modals.table_brands,
          as: 'brand',
          attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'brands/', this.modals.sequelize.col('`brand`.`brand_id`'), '/reviews'), 'reviewUrl']],
          required: false
        }, {
          model: this.modals.table_color,
          as: 'color',
          attributes: [['color_name', 'name'], ['color_id', 'id']],
          required: false
        }, {
          model: this.modals.amcBills,
          as: 'amcDetails',
          attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'sellerID', 'sellerType'],
          where: {
            user_id: user.ID,
            status_type: {
              $ne: 3
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
          }, {
            model: this.modals.exclusions,
            as: 'exclusions',
            attributes: [['exclusions_name', 'value']]
          }, {
            model: this.modals.inclusions,
            as: 'inclusions',
            attributes: [['inclusions_name', 'value']]
          }],
          order: [['policy_expiry_date', 'DESC']],
          required: false
        }, {
          model: this.modals.insuranceBills,
          as: 'insuranceDetails',
          attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan', 'sellerID', 'sellerType'],
          where: {
            user_id: user.ID,
            status_type: {
              $ne: 3
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
          }, {
            model: this.modals.exclusions,
            as: 'exclusions',
            attributes: [['exclusions_name', 'value']]
          }, {
            model: this.modals.inclusions,
            as: 'inclusions',
            attributes: [['inclusions_name', 'value']]
          }],
          order: [['policy_expiry_date', 'DESC']],
          required: false
        }, {
          model: this.modals.warranty,
          as: 'warrantyDetails',
          attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'sellerID', 'sellerType'],
          where: {
            user_id: user.ID,
            status_type: {
              $ne: 3
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
          }, {
            model: this.modals.exclusions,
            as: 'exclusions',
            attributes: [['exclusions_name', 'value']]
          }, {
            model: this.modals.inclusions,
            as: 'inclusions',
            attributes: [['inclusions_name', 'value']]
          }],
          order: [['policy_expiry_date', 'DESC']],
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
        }, {
          model: this.modals.repairBills,
          as: 'repairBills',
          attributes: [['bill_repair_id', 'id'], ['value_of_repair', 'premiumAmount'], 'taxes', ['repair_invoice_number', 'invoiceNumber'], ['repair_date', 'repairDate'], ['seller_id', 'sellerID'], ['seller_type', 'sellerType']],
          where: {
            user_id: user.ID,
            status_type: {
              $ne: 3
            }
          },
          include: [{
            model: this.modals.repairBillCopies,
            as: 'copies',
            include: [{
              model: this.modals.billCopies,
              as: 'billCopies',
              attributes: []
            }],
            attributes: [['bill_copy_id', 'billCopyId'], [this.modals.sequelize.literal('`repairBills->copies->billCopies`.`bill_copy_type`'), 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.literal('`repairBills->copies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
          }],
          required: false
        }],
        attributes: [['bill_product_id', 'id'], ['brand_id', 'brandId'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], [this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], ['master_category_id', 'masterCategoryId'], [this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`productBills`.`category_id`'), '/image/'), 'cImageURL'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [this.modals.sequelize.fn('CONCAT', 'products/', this.modals.sequelize.col('`productBills`.`bill_product_id`'), '/reviews'), 'reviewUrl'], [this.modals.sequelize.literal('`consumerBill`.`total_purchase_value`'), 'totalCost'], [this.modals.sequelize.literal('`consumerBill`.`taxes`'), 'totalTaxes'], [this.modals.sequelize.literal('`consumerBill`.`purchase_date`'), 'purchaseDate']]
      }).then(function (result) {
        if (result) {
          var product = result.toJSON();
          var productOnlineSellerId = product.consumerBill.productOnlineSeller.map(function (item) {
            return item.ID;
          });
          var warrantyOnlineSellerId = product.warrantyDetails.filter(function (item) {
            return item.sellerType === 1;
          }).map(function (item) {
            return item.sellerID;
          });
          var warrantyOfflineSellerId = product.warrantyDetails.filter(function (item) {
            return item.sellerType === 2;
          }).map(function (item) {
            return item.sellerID;
          });
          var insuranceOnlineSellerId = product.insuranceDetails.filter(function (item) {
            return item.sellerType === 1;
          }).map(function (item) {
            return item.sellerID;
          });
          var insuranceOfflineSellerId = product.insuranceDetails.filter(function (item) {
            return item.sellerType === 2;
          }).map(function (item) {
            return item.sellerID;
          });
          var amcOnlineSellerId = product.amcDetails.filter(function (item) {
            return item.sellerType === 1;
          }).map(function (item) {
            return item.sellerID;
          });
          var amcOfflineSellerId = product.amcDetails.filter(function (item) {
            return item.sellerType === 2;
          }).map(function (item) {
            return item.sellerID;
          });
          var repairOnlineSellerId = product.repairBills.filter(function (item) {
            return item.sellerType === 1;
          }).map(function (item) {
            return item.sellerID;
          });
          var repairOfflineSellerId = product.repairBills.filter(function (item) {
            return item.sellerType === 2;
          }).map(function (item) {
            return item.sellerID;
          });
          var productOfflineSellerId = product.consumerBill.productOfflineSeller.map(function (item) {
            return item.ID;
          });
          var offlineSellerId = [].concat(_toConsumableArray(productOfflineSellerId), _toConsumableArray(repairOfflineSellerId), _toConsumableArray(amcOfflineSellerId), _toConsumableArray(insuranceOfflineSellerId), _toConsumableArray(warrantyOfflineSellerId));
          offlineSellerId = [].concat(_toConsumableArray(new Set(offlineSellerId)));
          var onlineSellerId = [].concat(_toConsumableArray(productOnlineSellerId), _toConsumableArray(repairOnlineSellerId), _toConsumableArray(amcOnlineSellerId), _toConsumableArray(insuranceOnlineSellerId), _toConsumableArray(warrantyOnlineSellerId));
          onlineSellerId = [].concat(_toConsumableArray(new Set(onlineSellerId)));
          return Promise.all([_this2.modals.brandDetails.findAll({
            where: {
              status_type: {
                $ne: 3
              },
              category_id: product.categoryId,
              brand_id: product.brandId
            },
            attributes: [['category_id', 'categoryId'], ['display_name', 'displayName'], 'details', ['contactdetails_type_id', 'typeId']]
          }), _this2.modals.brandReviews.findOne({
            where: {
              status_type: {
                $ne: 3
              },
              brand_id: product.brandId
            },
            attributes: [['review_ratings', 'ratings'], ['review_feedback', 'feedback'], ['review_comments', 'comments']]
          }), _this2.modals.onlineSellerDetails.findAll({
            where: {
              status_type: {
                $ne: 3
              },
              seller_id: onlineSellerId
            },
            attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId'], ['seller_id', 'sellerId']]
          }), _this2.modals.offlineSellerDetails.findAll({
            where: {
              status_type: {
                $ne: 3
              },
              offline_seller_id: offlineSellerId
            },
            attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId'], ['offline_seller_id', 'sellerId']]
          }), _this2.modals.productMetaData.findAll({
            where: {
              bill_product_id: product.id
            },
            attributes: [['form_element_value', 'value'], [_this2.modals.sequelize.literal('`categoryForm`.`form_element_type`'), 'type'], [_this2.modals.sequelize.literal('`categoryForm`.`form_element_name`'), 'name']],
            include: [{
              model: _this2.modals.categoryForm,
              as: 'categoryForm',
              attributes: []
            }, {
              model: _this2.modals.categoryFormMapping,
              as: 'selectedValue',
              on: {
                $or: [_this2.modals.sequelize.where(_this2.modals.sequelize.literal('`productMetaData`.`category_form_id`'), _this2.modals.sequelize.literal('`categoryForm`.`category_form_id`'))]
              },
              where: {
                $and: [_this2.modals.sequelize.where(_this2.modals.sequelize.literal('`productMetaData`.`form_element_value`'), _this2.modals.sequelize.literal('`selectedValue`.`mapping_id`')), _this2.modals.sequelize.where(_this2.modals.sequelize.literal('`categoryForm`.`form_element_type`'), 2)]
              },
              attributes: [['dropdown_name', 'value']],
              required: false
            }]
          }), _this2.modals.onlineSeller.findAll({
            where: {
              ID: onlineSellerId
            },
            attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']]
          }), _this2.modals.offlineSeller.findAll({
            where: {
              ID: offlineSellerId
            },
            attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude']
          })]).then(function (mappableResult) {
            if (product.brand) {
              product.brand.details = mappableResult[0].map(function (item) {
                return item.toJSON();
              });
              product.brand.brandReviews = mappableResult[1] ? mappableResult[1].toJSON() : null;
            }

            var onlineSellerDetails = mappableResult[2].map(function (item) {
              return item.toJSON();
            });
            var offlineSellerDetails = mappableResult[3].map(function (item) {
              return item.toJSON();
            });
            if (product.consumerBill) {
              product.consumerBill.productOnlineSeller = product.consumerBill.productOnlineSeller.map(function (item) {
                var onlineSeller = item;
                onlineSeller.sellerDetails = onlineSellerDetails.filter(function (elem) {
                  return elem.sellerId === item.ID;
                });

                return onlineSeller;
              });

              product.consumerBill.productOfflineSeller = product.consumerBill.productOfflineSeller.map(function (item) {
                var offlineSeller = item;
                offlineSeller.sellerDetails = offlineSellerDetails.filter(function (elem) {
                  return elem.sellerId === item.ID;
                });

                return offlineSeller;
              });
            }

            var productMetaData = mappableResult[4].map(function (item) {
              return item.toJSON();
            });
            product.serviceCenterUrl = '/consumer/servicecenters?brandid=' + product.brandId + '&categoryid=' + product.categoryId;

            product.productMetaData = productMetaData.map(function (metaItem) {
              var metaData = metaItem;
              if (metaData.type === 2 && metaData.selectedValue) {
                metaData.value = metaData.selectedValue.value;
              }

              return metaData;
            });

            var onlineSellers = mappableResult[5].map(function (item) {
              return item.toJSON();
            });
            var offlineSellers = mappableResult[6].map(function (item) {
              return item.toJSON();
            });
            product.amcDetails = product.amcDetails.sort(sortAmcWarrantyInsuranceRepair);
            product.amcDetails = product.amcDetails.map(function (amcItem) {
              var amcDetail = amcItem;
              var seller = amcDetail.sellerType === 1 ? onlineSellers.find(function (item) {
                return item.ID === amcDetail.sellerID;
              }) : offlineSellers.find(function (item) {
                return item.ID === amcDetail.sellerID;
              });
              amcDetail.exclusions = amcDetail.exclusions.map(function (item) {
                return item.value;
              });
              amcDetail.inclusions = amcDetail.inclusions.map(function (item) {
                return item.value;
              });
              if (seller) {
                var sellerDetail = amcDetail.sellerType === 1 ? onlineSellerDetails.find(function (elem) {
                  return elem.sellerId === amcDetail.sellerID && elem.typeId === 3;
                }) : offlineSellerDetails.find(function (elem) {
                  return elem.sellerId === amcDetail.sellerID && elem.typeId === 3;
                });
                amcDetail.sellerName = seller.sellerName;
                amcDetail.sellerContact = sellerDetail ? sellerDetail.details : '';
              } else {
                amcDetail.sellerName = '';
                amcDetail.sellerContact = '';
              }
              return amcDetail;
            });

            product.warrantyDetails = product.warrantyDetails.sort(sortAmcWarrantyInsuranceRepair);
            product.warrantyDetails = product.warrantyDetails.map(function (warrantyItem) {
              var warrantyCopy = warrantyItem;
              var seller = warrantyCopy.sellerType === 1 ? onlineSellers.find(function (item) {
                return item.ID === warrantyCopy.sellerID;
              }) : offlineSellers.find(function (item) {
                return item.ID === warrantyCopy.sellerID;
              });
              warrantyCopy.exclusions = warrantyCopy.exclusions.map(function (item) {
                return item.value;
              });
              warrantyCopy.inclusions = warrantyCopy.inclusions.map(function (item) {
                return item.value;
              });
              if (seller) {
                var sellerDetail = warrantyCopy.sellerType === 1 ? onlineSellerDetails.find(function (elem) {
                  return elem.sellerId === warrantyCopy.sellerID && elem.typeId === 3;
                }) : offlineSellerDetails.find(function (elem) {
                  return elem.sellerId === warrantyCopy.sellerID && elem.typeId === 3;
                });
                warrantyCopy.sellerName = seller.sellerName;
                warrantyCopy.sellerContact = sellerDetail ? sellerDetail.details : '';
              } else {
                warrantyCopy.sellerName = '';
                warrantyCopy.sellerContact = '';
              }
              return warrantyCopy;
            });

            product.insuranceDetails = product.insuranceDetails.sort(sortAmcWarrantyInsuranceRepair);
            product.insuranceDetails = product.insuranceDetails.map(function (insuranceItem) {
              var insuranceDetail = insuranceItem;
              var seller = insuranceDetail.sellerType === 1 ? onlineSellers.find(function (item) {
                return item.ID === insuranceDetail.sellerID;
              }) : offlineSellers.find(function (item) {
                return item.ID === insuranceDetail.sellerID;
              });
              insuranceDetail.exclusions = insuranceDetail.exclusions.map(function (item) {
                return item.value;
              });
              insuranceDetail.inclusions = insuranceDetail.inclusions.map(function (item) {
                return item.value;
              });
              if (seller) {
                var sellerDetail = insuranceDetail.sellerType === 1 ? onlineSellerDetails.find(function (elem) {
                  return elem.sellerId === insuranceDetail.sellerID && elem.typeId === 3;
                }) : offlineSellerDetails.find(function (elem) {
                  return elem.sellerId === insuranceDetail.sellerID && elem.typeId === 3;
                });
                insuranceDetail.sellerName = seller.sellerName;
                insuranceDetail.sellerContact = sellerDetail ? sellerDetail.details : '';
              } else {
                insuranceDetail.sellerName = '';
                insuranceDetail.sellerContact = '';
              }

              return insuranceDetail;
            });

            product.repairBills = product.repairBills.map(function (repairItem) {
              var repairDetail = repairItem;
              var seller = repairDetail.sellerType === 1 ? onlineSellers.find(function (item) {
                return item.ID === repairDetail.sellerID;
              }) : offlineSellers.find(function (item) {
                return item.ID === repairDetail.sellerID;
              });
              if (seller) {
                var sellerDetail = repairDetail.sellerType === 1 ? onlineSellerDetails.find(function (elem) {
                  return elem.sellerId === repairDetail.sellerID && elem.typeId === 3;
                }) : offlineSellerDetails.find(function (elem) {
                  return elem.sellerId === repairDetail.sellerID && elem.typeId === 3;
                });
                repairDetail.sellerName = seller.sellerName;
                repairDetail.sellerContact = sellerDetail ? sellerDetail.details : '';
              } else {
                repairDetail.sellerName = '';
                repairDetail.sellerContact = '';
              }

              return repairDetail;
            });

            return {
              status: true,
              product: product,
              forceUpdate: request.pre.forceUpdate
            };
          }).catch(function (err) {
            console.log({ API_Logs: err });
            return {
              status: false,
              err: err,
              forceUpdate: request.pre.forceUpdate
            };
          });
        } else {
          return {
            status: false,
            product: {},
            message: 'No Data Found',
            forceUpdate: request.pre.forceUpdate
          };
        }
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }]);

  return ProductAdaptor;
}();

module.exports = ProductAdaptor;