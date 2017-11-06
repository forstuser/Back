/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EHomeAdaptor = function () {
  function EHomeAdaptor(modals) {
    _classCallCheck(this, EHomeAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
  }

  _createClass(EHomeAdaptor, [{
    key: 'prepareEHomeResult',
    value: function prepareEHomeResult(user, request) {
      return Promise.all([this.retrieveUnProcessedBills(user), this.prepareCategoryData(user), this.retrieveRecentSearch(user), this.modals.mailBox.count({ where: { user_id: user.ID, status_id: 4 } })]).then(function (result) {

        var OtherCategory = null;

        var categoryList = result[1].map(function (item) {
          var categoryData = item.toJSON();

          categoryData.cURL += categoryData.subCategories.length > 0 && categoryData.subCategories[0].categoryType > 0 ? categoryData.subCategories[0].categoryType : '';

          if (categoryData.cType === 9) {
            OtherCategory = categoryData;
          }

          return categoryData;
        });

        var categoryDataWithoutOthers = categoryList.filter(function (elem) {
          return elem.cType !== 9;
        });

        var newCategoryData = [];

        var pushed = false;

        categoryDataWithoutOthers.forEach(function (elem) {
          if (OtherCategory.productCounts > elem.productCounts && !pushed) {
            newCategoryData.push(OtherCategory);
            pushed = true;
          }
          newCategoryData.push(elem);
        });

        if (!pushed) {
          newCategoryData.push(OtherCategory);
        }

        var recentSearches = result[2].map(function (item) {
          return item.toJSON();
        });

        return {
          status: true,
          message: 'EHome restore successful',
          notificationCount: result[3],
          // categories: result[3],
          recentSearches: recentSearches.map(function (item) {
            return item.searchValue;
          }).slice(0, 5),
          unProcessedBills: result[0],
          categoryList: newCategoryData,
          forceUpdate: request.pre.forceUpdate
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          message: 'EHome restore failed',
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'retrieveUnProcessedBills',
    value: function retrieveUnProcessedBills(user) {
      return this.modals.consumerBills.findAll({
        attributes: [['created_on', 'uploadedDate'], ['bill_id', 'docId']],
        where: {
          user_id: user.ID,
          user_status: {
            $notIn: [3, 5, 10]
          },
          admin_status: {
            $notIn: [3, 5, 10] // 3=Delete, 5=Complete, 10=Discard
          }
        },
        include: [{
          model: this.modals.billCopies,
          as: 'billCopies',
          attributes: [['bill_copy_id', 'billCopyId'], ['bill_copy_type', 'billCopyType'], [this.modals.sequelize.fn('CONCAT', 'bills/', this.modals.sequelize.col('bill_copy_id'), '/files'), 'fileUrl']],
          where: {
            status_id: {
              $ne: 3
            }
          }
        }],
        order: [['created_on', 'DESC']]
      });
    }
  }, {
    key: 'prepareCategoryData',
    value: function prepareCategoryData(user) {
      return this.modals.categories.findAll({
        where: {
          category_level: 1,
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: this.modals.categories,
          on: {
            $or: [this.modals.sequelize.where(this.modals.sequelize.col('`subCategories`.`ref_id`'), this.modals.sequelize.col('`categories`.`category_id`'))]
          },
          where: {
            display_id: 1
          },
          as: 'subCategories',
          attributes: [['display_id', 'categoryType'], ['category_id', 'categoryId'], ['category_name', 'categoryName']],
          order: [['display_id', 'ASC']],
          required: false
        }, {
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
              status_id: {
                $ne: 3
              }
            },
            attributes: [],
            include: [{
              model: this.modals.consumerBills,
              as: 'bill',
              where: {
                $and: [this.modals.sequelize.where(this.modals.sequelize.col('`products->consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
                  user_status: 5,
                  admin_status: 5
                }]
              },
              attributes: []
            }]
          }],
          attributes: [],
          required: false
        }],
        attributes: [['category_name', 'cName'], ['display_id', 'cType'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/products?pageno=1&ctype='), 'cURL'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/products?pageno=1&ctype='), 'genericURL'], [this.modals.sequelize.fn('MAX', this.modals.sequelize.col('`products->consumerBill->bill`.`updated_on`')), 'cLastUpdate'], [this.modals.sequelize.fn('COUNT', this.modals.sequelize.col('`products`.`product_name`')), 'productCounts'], [this.modals.sequelize.fn('CONCAT', 'categories/', this.modals.sequelize.col('`categories`.`category_id`'), '/image/'), 'cImageURL']],
        order: [[this.modals.sequelize.fn('COUNT', this.modals.sequelize.col('`products`.`product_name`')), 'DESC'], ['category_name']],
        group: '`categories`.`category_id`'
      });
    }
  }, {
    key: 'retrieveRecentSearch',
    value: function retrieveRecentSearch(user) {
      return this.modals.recentSearches.findAll({
        where: {
          user_id: user.ID
        },
        order: [['searchDate', 'DESC']],
        attributes: ['searchValue']
      });
    }
  }, {
    key: 'prepareProductDetail',
    value: function prepareProductDetail(user, masterCategoryId, ctype, /* pageNo, */brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue, request) {
      var promisedQuery = Promise.all([this.fetchProductDetails(user, masterCategoryId, ctype || undefined, brandIds.split('[')[1].split(']')[0].split(',').filter(Boolean), categoryIds.split('[')[1].split(']')[0].split(',').filter(Boolean), offlineSellerIds.split('[')[1].split(']')[0].split(',').filter(Boolean), onlineSellerIds.split('[')[1].split(']')[0].split(',').filter(Boolean), sortBy, '%' + (searchValue || '') + '%'), this.modals.categories.findAll({
        where: {
          ref_id: masterCategoryId,
          status_id: {
            $ne: 3
          }
        },
        attributes: [['category_id', 'id'], [this.modals.sequelize.fn('CONCAT', 'categories/', masterCategoryId, '/products?pageno=1&ctype=', this.modals.sequelize.col('`categories`.`display_id`')), 'cURL'], ['display_id', 'cType'], ['category_name', 'name']],
        order: [['category_name', 'ASC']]
      }), this.modals.table_brands.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: this.modals.brandDetails,
          as: 'details',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['category_id', 'categoryId']]
        }],
        attributes: [['brand_id', 'id'], ['brand_name', 'name']],
        order: [['brand_name', 'ASC']]
      }), this.modals.offlineSeller.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: this.modals.offlineSellerDetails,
          as: 'sellerDetails',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['category_id', 'categoryId']]
        }],
        attributes: ['ID', ['offline_seller_name', 'name']],
        order: [['offline_seller_name', 'ASC']]
      }), this.modals.onlineSeller.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: this.modals.onlineSellerDetails,
          as: 'sellerDetails',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['category_id', 'categoryId']]
        }],
        attributes: ['ID', ['seller_name', 'name']],
        order: [['seller_name', 'ASC']]
      }), this.modals.categories.findOne({
        where: {
          category_id: masterCategoryId
        },
        attributes: [['category_name', 'name']]
      })]);
      return promisedQuery.then(function (result) {
        var productList = result[0].map(function (item) {
          var product = item.toJSON();
          product.productMetaData.map(function (metaItem) {
            var metaData = metaItem;
            if (metaData.type === '2' && metaData.selectedValue) {
              metaData.value = metaData.selectedValue.value;
            }

            return metaData;
          });
          return product;
        });
        /* const listIndex = (pageNo * 10) - 10; */
        var categoryIdList = result[1].map(function (item) {
          var category = item.toJSON();
          return category.id;
        });

        var brands = result[2].map(function (item) {
          var brandItem = item.toJSON();
          var brandDetail = brandItem.details.find(function (detailItem) {
            return categoryIdList.indexOf(detailItem.categoryId) > -1;
          });
          return brandDetail ? {
            id: brandItem.id,
            name: brandItem.name
          } : { id: 0 };
        });

        var offlineSellers = result[3].map(function (item) {
          var offlineItem = item.toJSON();
          var offlineDetail = offlineItem.sellerDetails.find(function (detailItem) {
            return categoryIdList.indexOf(detailItem.categoryId) > -1;
          });
          return offlineDetail ? {
            id: offlineItem.ID,
            name: offlineItem.name
          } : { id: 0 };
        });

        var onlineSellers = result[4].map(function (item) {
          var onlineItem = item.toJSON();
          var onlineDetail = onlineItem.sellerDetails.find(function (detailItem) {
            return categoryIdList.indexOf(detailItem.categoryId) > -1;
          });
          return onlineDetail ? {
            id: onlineItem.ID,
            name: onlineItem.name
          } : { id: 0 };
        });
        return {
          status: true,
          productList: productList /* :productList.slice((pageNo * 10) - 10, 10) */
          , filterData: {
            categories: result[1],
            brands: brands.filter(function (item) {
              return item.id !== 0;
            }),
            sellers: {
              offlineSellers: offlineSellers.filter(function (item) {
                return item.id !== 0;
              }),
              onlineSellers: onlineSellers.filter(function (item) {
                return item.id !== 0;
              })
            }
          },
          categoryName: result[5],
          forceUpdate: request.pre.forceUpdate
          /* ,
              nextPageUrl: productList.length > listIndex + 10 ?
               `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
               &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
               &offlinesellerids=${offlineSellerIds}&onlinesellerids=
               ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
        };
      }).catch(function (err) {
        console.log({ API_Logs: err });
        return {
          status: false,
          err: err,
          forceUpdate: request.pre.forceUpdate
        };
      });
    }
  }, {
    key: 'fetchProductDetails',
    value: function fetchProductDetails(user, masterCategoryId, ctype, brandIds, categoryIds, offlineSellerIds, onlineSellerIds, sortBy, searchValue) {
      var _this = this;

      return this.modals.categories.findOne({
        where: {
          ref_id: masterCategoryId,
          display_id: ctype,
          status_id: {
            $ne: 3
          }
        }
      }).then(function (item) {
        var offlineSellerWhereClause = {
          $and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'), 2)]
        };
        var onlineSellerWhereClause = {
          $and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'), 1)]
        };
        var offlineSellerRequired = false;
        var onlineSellerRequired = false;
        var whereClause = ctype ? {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          master_category_id: masterCategoryId,
          category_id: ctype ? item.category_id : undefined,
          $and: [_this.modals.sequelize.where(_this.modals.sequelize.fn('lower', _this.modals.sequelize.col('product_name')), { $like: _this.modals.sequelize.fn('lower', searchValue) })]
        } : {
          user_id: user.ID,
          status_id: {
            $ne: 3
          },
          master_category_id: masterCategoryId,
          $and: [_this.modals.sequelize.where(_this.modals.sequelize.fn('lower', _this.modals.sequelize.col('product_name')), { $like: _this.modals.sequelize.fn('lower', searchValue) })]
        };
        if (brandIds && brandIds.length > 0) {
          whereClause.brand_id = brandIds;
        }

        if (categoryIds && categoryIds.length > 0) {
          whereClause.category_id = categoryIds;
        }

        if (offlineSellerIds && offlineSellerIds.length > 0) {
          offlineSellerRequired = true;
          offlineSellerWhereClause.$and.push({ ID: offlineSellerIds });
        }

        if (onlineSellerIds && onlineSellerIds.length > 0) {
          onlineSellerRequired = true;
          onlineSellerWhereClause.$and.push({ ID: onlineSellerIds });
        }

        return _this.modals.productBills.findAll({
          where: whereClause,
          include: [{
            model: _this.modals.consumerBillDetails,
            as: 'consumerBill',
            where: {
              status_id: {
                $ne: 3
              }
            },
            attributes: [['invoice_number', 'invoiceNo'], ['total_purchase_value', 'totalCost'], 'taxes', ['purchase_date', 'purchaseDate']],
            include: [{
              model: _this.modals.billDetailCopies,
              as: 'billDetailCopies',
              include: [{
                model: _this.modals.billCopies,
                as: 'billCopies',
                attributes: []
              }],
              attributes: [['bill_copy_id', 'billCopyId'], [_this.modals.sequelize.fn('CONCAT', _this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')), 'billCopyType'], [_this.modals.sequelize.fn('CONCAT', 'bills/', _this.modals.sequelize.col('`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'), '/files'), 'fileUrl']]
            }, {
              model: _this.modals.consumerBills,
              as: 'bill',
              where: {
                $and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`consumerBill->bill->billMapping`.`bill_ref_type`'), 1), {
                  user_status: 5,
                  admin_status: 5
                }]
              },
              attributes: []
            }, {
              model: _this.modals.offlineSeller,
              as: 'productOfflineSeller',
              where: offlineSellerWhereClause,
              attributes: ['ID', ['offline_seller_name', 'sellerName'], ['seller_url', 'url'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude'],
              include: [{
                model: _this.modals.offlineSellerDetails,
                as: 'sellerDetails',
                where: {
                  status_id: {
                    $ne: 3
                  }
                },
                attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
                required: false
              }],
              required: offlineSellerRequired
            }, {
              model: _this.modals.onlineSeller,
              as: 'productOnlineSeller',
              where: onlineSellerWhereClause,
              attributes: ['ID', ['seller_name', 'sellerName'], ['seller_url', 'url']],
              include: [{
                model: _this.modals.onlineSellerDetails,
                as: 'sellerDetails',
                where: {
                  status_id: {
                    $ne: 3
                  }
                },
                attributes: [['display_name', 'displayName'], 'details', ['contactdetail_type_id', 'typeId']],
                required: false
              }],
              required: onlineSellerRequired
            }],
            required: true
          }, {
            model: _this.modals.table_brands,
            as: 'brand',
            attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
            required: false
          }, {
            model: _this.modals.table_color,
            as: 'color',
            attributes: [['color_name', 'name'], ['color_id', 'id']],
            required: false
          }, {
            model: _this.modals.amcBills,
            as: 'amcDetails',
            attributes: [['bill_amc_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
            where: {
              user_id: user.ID,
              status_id: {
                $ne: 3
              }
            },
            order: [['policy_expiry_date', 'DESC']],
            required: false
          }, {
            model: _this.modals.insuranceBills,
            as: 'insuranceDetails',
            attributes: [['bill_insurance_id', 'id'], 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate', 'amountInsured', 'plan'],
            where: {
              user_id: user.ID,
              status_id: {
                $ne: 3
              }
            },
            order: [['policy_expiry_date', 'DESC']],
            required: false
          }, {
            model: _this.modals.warranty,
            as: 'warrantyDetails',
            attributes: [['bill_warranty_id', 'id'], 'warrantyType', 'policyNo', 'premiumType', 'premiumAmount', 'effectiveDate', 'expiryDate'],
            where: {
              user_id: user.ID,
              status_id: {
                $ne: 3
              }
            },
            order: [['policy_expiry_date', 'DESC']],
            required: false
          }, {
            model: _this.modals.productMetaData,
            as: 'productMetaData',
            attributes: [['form_element_value', 'value'], [_this.modals.sequelize.fn('upper', _this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`')), 'type'], [_this.modals.sequelize.fn('upper', _this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_name`')), 'name']],
            include: [{
              model: _this.modals.categoryForm,
              as: 'categoryForm',
              attributes: []
            }, {
              model: _this.modals.categoryFormMapping,
              as: 'selectedValue',
              on: {
                $or: [_this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData`.`category_form_id`'), _this.modals.sequelize.col('`productMetaData->categoryForm`.`category_form_id`'))]
              },
              where: {
                $and: [_this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData`.`form_element_value`'), _this.modals.sequelize.col('`productMetaData->selectedValue`.`mapping_id`')), _this.modals.sequelize.where(_this.modals.sequelize.col('`productMetaData->categoryForm`.`form_element_type`'), 2)]
              },
              attributes: [['dropdown_name', 'value']],
              required: false
            }],
            required: false
          }, {
            model: _this.modals.categories,
            as: 'masterCategory',
            attributes: []
          }, {
            model: _this.modals.categories,
            as: 'category',
            attributes: []
          }],
          attributes: [['bill_product_id', 'id'], ['product_name', 'productName'], ['value_of_purchase', 'value'], 'taxes', ['category_id', 'categoryId'], ['master_category_id', 'masterCategoryId'], [_this.modals.sequelize.col('`masterCategory`.`category_name`'), 'masterCategoryName'], [_this.modals.sequelize.col('`category`.`category_name`'), 'categoryName'], ['brand_id', 'brandId'], ['color_id', 'colorId'], [_this.modals.sequelize.fn('CONCAT', 'products/', _this.modals.sequelize.col('`productBills`.`bill_product_id`')), 'productURL'], [_this.modals.sequelize.fn('CONCAT', 'categories/', _this.modals.sequelize.col('`productBills`.`category_id`'), '/image/'), 'cImageURL'], [_this.modals.sequelize.literal('`consumerBill`.`total_purchase_value`'), 'totalCost'], [_this.modals.sequelize.literal('`consumerBill`.`taxes`'), 'totalTaxes'], [_this.modals.sequelize.literal('`consumerBill`.`purchase_date`'), 'purchaseDate']],
          order: [[_this.modals.sequelize.literal('`consumerbill.purchaseDate`'), sortBy || 'DESC']]
        });
      });
    }
  }]);

  return EHomeAdaptor;
}();

exports.default = EHomeAdaptor;