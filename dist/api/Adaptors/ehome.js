/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _category = require('./category');

var _category2 = _interopRequireDefault(_category);

var _insurances = require('./insurances');

var _insurances2 = _interopRequireDefault(_insurances);

var _amcs = require('./amcs');

var _amcs2 = _interopRequireDefault(_amcs);

var _warranties = require('./warranties');

var _warranties2 = _interopRequireDefault(_warranties);

var _repairs = require('./repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var EHomeAdaptor = function() {
  function EHomeAdaptor(modals) {
    _classCallCheck(this, EHomeAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
    this.categoryAdaptor = new _category2.default(modals);
    this.insuranceAdaptor = new _insurances2.default(modals);
    this.amcAdaptor = new _amcs2.default(modals);
    this.warrantyAdaptor = new _warranties2.default(modals);
    this.repairAdaptor = new _repairs2.default(modals);
  }

  _createClass(EHomeAdaptor, [
    {
      key: 'prepareEHomeResult',
      value: function prepareEHomeResult(user, request) {
        return Promise.all([
          this.retrieveUnProcessedBills(user),
          this.prepareCategoryData(user, {})]).then(function(result) {

          var OtherCategory = null;

          var categoryList = result[1].map(function(item) {
            var categoryData = item;
            if (categoryData.id === 9) {
              OtherCategory = categoryData;
            }

            return categoryData;
          });

          var categoryDataWithoutOthers = categoryList.filter(function(elem) {
            return elem.id !== 9;
          });

          var newCategoryData = categoryDataWithoutOthers;

          var pushed = false;

          if (OtherCategory) {
            newCategoryData = [];
            categoryDataWithoutOthers.forEach(function(elem) {
              if (OtherCategory.productCounts > elem.productCounts && !pushed) {
                newCategoryData.push(OtherCategory);
                pushed = true;
              }
              newCategoryData.push(elem);
            });

            if (!pushed) {
              newCategoryData.push(OtherCategory);
            }
          }

          // const recentSearches = result[2].map(item => item.toJSON());

          return {
            status: true,
            message: 'EHome restore successful',
            notificationCount: result[3],
            // categories: result[3],
            // recentSearches: recentSearches.map(item => item.searchValue).slice(0, 5),
            unProcessedBills: result[0],
            categoryList: newCategoryData,
            forceUpdate: request.pre.forceUpdate,
          };
        }).catch(function(err) {
          console.log({API_Logs: err});
          return {
            status: false,
            message: 'EHome restore failed',
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'retrieveUnProcessedBills',
      value: function retrieveUnProcessedBills(user) {
        return this.modals.jobs.findAll({
          attributes: [['created_at', 'uploadedDate'], ['id', 'docId']],
          where: {
            user_id: user.id,
            user_status: {
              $notIn: [3, 5, 9],
            },
            admin_status: {
              $notIn: [3, 5, 9] // 3=Delete, 5=Complete, 9=Discard
            },
          },
          include: [
            {
              model: this.modals.jobCopies,
              as: 'copies',
              attributes: [
                [
                  'id',
                  'billCopyId'],
                [
                  'file_type',
                  'billCopyType'],
                [
                  this.modals.sequelize.fn('CONCAT', 'jobs/',
                      this.modals.sequelize.literal('"jobs"."id"'), '/files/',
                      this.modals.sequelize.literal('"copies"."id"')),
                  'fileUrl']],
              where: {
                status_type: {
                  $notIn: [3, 5, 9],
                },
              },
            }],
          order: [['created_at', 'DESC']],
        });
      },
    }, {
      key: 'prepareCategoryData',
      value: function prepareCategoryData(user, options) {
        var categoryOption = {
          category_level: 1,
          status_type: 1,
        };

        var productOptions = {
          status_type: 5,
          user_id: user.id,
          product_status_type: 8,
        };

        if (options.category_id) {
          categoryOption.category_id = options.category_id;
          productOptions.main_category_id = options.category_id;
        }
        return Promise.all([
          this.categoryAdaptor.retrieveCategories(categoryOption),
          this.productAdaptor.retrieveProductCounts(productOptions),
          this.amcAdaptor.retrieveAMCCounts(productOptions),
          this.insuranceAdaptor.retrieveInsuranceCount(productOptions),
          this.repairAdaptor.retrieveRepairCount(productOptions),
          this.warrantyAdaptor.retrieveWarrantyCount(productOptions)]).
            then(function(results) {
              return results[0].map(function(categoryItem) {
                var category = categoryItem;
                console.log({amc: results[2]});
                var products = _lodash2.default.chain(results[1]).
                    filter(function(productItem) {
                      return productItem.masterCategoryId === category.id;
                    });
                var amcs = _lodash2.default.chain(results[2]).
                    filter(function(amcItem) {
                      return amcItem.masterCategoryId === category.id;
                    });
                var insurances = _lodash2.default.chain(results[3]).
                    filter(function(insuranceItem) {
                      return insuranceItem.masterCategoryId === category.id;
                    });
                var repairs = _lodash2.default.chain(results[4]).
                    filter(function(repairItem) {
                      return repairItem.masterCategoryId === category.id;
                    });
                var warranties = _lodash2.default.chain(results[5]).
                    filter(function(warrantyItem) {
                      return warrantyItem.masterCategoryId === category.id;
                    });
                var expenses = _lodash2.default.chain([].concat(
                    _toConsumableArray(products), _toConsumableArray(amcs),
                    _toConsumableArray(insurances), _toConsumableArray(repairs),
                    _toConsumableArray(warranties)) || []).
                    orderBy(['lastUpdatedAt'], ['desc']);
                category.cLastUpdate = expenses && expenses.length > 0 ?
                    expenses[0].lastUpdatedAt :
                    null;
                category.productCounts = parseInt(
                    _shared2.default.sumProps(expenses, 'productCounts'));
                return category;
              });
            });
      },
    }, {
      key: 'retrieveRecentSearch',
      value: function retrieveRecentSearch(user) {
        return this.modals.recentSearches.findAll({
          where: {
            user_id: user.ID,
          },
          order: [['searchDate', 'DESC']],
          attributes: ['searchValue'],
        });
      },
    }, {
      key: 'prepareProductDetail',
      value: function prepareProductDetail(
          user, masterCategoryId, ctype, /* pageNo, */brandIds, categoryIds,
          offlineSellerIds, onlineSellerIds, sortBy, searchValue, request) {
        var promisedQuery = Promise.all([
          this.fetchProductDetails(user, masterCategoryId, ctype || undefined,
              brandIds.split('[')[1].split(']')[0].split(',').filter(Boolean),
              categoryIds.split('[')[1].split(']')[0].split(',').
                  filter(Boolean),
              offlineSellerIds.split('[')[1].split(']')[0].split(',').
                  filter(Boolean),
              onlineSellerIds.split('[')[1].split(']')[0].split(',').
                  filter(Boolean), sortBy, '%' + (searchValue || '') + '%'),
          this.modals.categories.findAll({
            where: {
              ref_id: masterCategoryId,
              status_type: {
                $ne: 3,
              },
            },
            attributes: [
              [
                'category_id',
                'id'],
              [
                this.modals.sequelize.fn('CONCAT', 'categories/',
                    masterCategoryId, '/products?pageno=1&ctype=',
                    this.modals.sequelize.col('`categories`.`display_id`')),
                'cURL'],
              [
                'display_id',
                'cType'],
              [
                'category_name',
                'name']],
            order: [['category_name', 'ASC']],
          }),
          this.modals.table_brands.findAll({
            where: {
              status_type: {
                $ne: 3,
              },
            },
            include: [
              {
                model: this.modals.brandDetails,
                as: 'details',
                where: {
                  status_type: {
                    $ne: 3,
                  },
                },
                attributes: [['category_id', 'categoryId']],
              }],
            attributes: [['brand_id', 'id'], ['brand_name', 'name']],
            order: [['brand_name', 'ASC']],
          }),
          this.modals.offlineSeller.findAll({
            where: {
              status_type: {
                $ne: 3,
              },
            },
            include: [
              {
                model: this.modals.offlineSellerDetails,
                as: 'sellerDetails',
                where: {
                  status_type: {
                    $ne: 3,
                  },
                },
                attributes: [['category_id', 'categoryId']],
              }],
            attributes: ['ID', ['offline_seller_name', 'name']],
            order: [['offline_seller_name', 'ASC']],
          }),
          this.modals.onlineSeller.findAll({
            where: {
              status_type: {
                $ne: 3,
              },
            },
            include: [
              {
                model: this.modals.onlineSellerDetails,
                as: 'sellerDetails',
                where: {
                  status_type: {
                    $ne: 3,
                  },
                },
                attributes: [['category_id', 'categoryId']],
              }],
            attributes: ['ID', ['seller_name', 'name']],
            order: [['seller_name', 'ASC']],
          }),
          this.modals.categories.findOne({
            where: {
              category_id: masterCategoryId,
            },
            attributes: [['category_name', 'name']],
          })]);
        return promisedQuery.then(function(result) {
          var productList = result[0].map(function(item) {
            var product = item.toJSON();
            product.productMetaData.map(function(metaItem) {
              var metaData = metaItem;
              if (metaData.type === '2' && metaData.selectedValue) {
                metaData.value = metaData.selectedValue.value;
              }

              return metaData;
            });
            return product;
          });
          /* const listIndex = (pageNo * 10) - 10; */
          var categoryIdList = result[1].map(function(item) {
            var category = item.toJSON();
            return category.id;
          });

          var brands = result[2].map(function(item) {
            var brandItem = item.toJSON();
            var brandDetail = brandItem.details.find(function(detailItem) {
              return categoryIdList.indexOf(detailItem.categoryId) > -1;
            });
            return brandDetail ? {
              id: brandItem.id,
              name: brandItem.name,
            } : {id: 0};
          });

          var offlineSellers = result[3].map(function(item) {
            var offlineItem = item.toJSON();
            var offlineDetail = offlineItem.sellerDetails.find(
                function(detailItem) {
                  return categoryIdList.indexOf(detailItem.categoryId) > -1;
                });
            return offlineDetail ? {
              id: offlineItem.ID,
              name: offlineItem.name,
            } : {id: 0};
          });

          var onlineSellers = result[4].map(function(item) {
            var onlineItem = item.toJSON();
            var onlineDetail = onlineItem.sellerDetails.find(
                function(detailItem) {
                  return categoryIdList.indexOf(detailItem.categoryId) > -1;
                });
            return onlineDetail ? {
              id: onlineItem.ID,
              name: onlineItem.name,
            } : {id: 0};
          });
          return {
            status: true,
            productList: productList /* :productList.slice((pageNo * 10) - 10, 10) */
            , filterData: {
              categories: result[1],
              brands: brands.filter(function(item) {
                return item.id !== 0;
              }),
              sellers: {
                offlineSellers: offlineSellers.filter(function(item) {
                  return item.id !== 0;
                }),
                onlineSellers: onlineSellers.filter(function(item) {
                  return item.id !== 0;
                }),
              },
            },
            categoryName: result[5],
            forceUpdate: request.pre.forceUpdate,
            /* ,
                nextPageUrl: productList.length > listIndex + 10 ?
                 `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
                 &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
                 &offlinesellerids=${offlineSellerIds}&onlinesellerids=
                 ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
          };
        }).catch(function(err) {
          console.log({API_Logs: err});
          return {
            status: false,
            err: err,
            forceUpdate: request.pre.forceUpdate,
          };
        });
      },
    }, {
      key: 'fetchProductDetails',
      value: function fetchProductDetails(
          user, masterCategoryId, subCategoryId, brandIds, categoryIds,
          offlineSellerIds, onlineSellerIds, sortBy, searchValue) {
        var _this = this;

        return this.modals.categories.findOne({
          where: {
            ref_id: masterCategoryId,
            display_id: subCategoryId,
            status_type: {
              $ne: 3,
            },
          },
        }).then(function(item) {
          var offlineSellerWhereClause = {
            $and: [
              _this.modals.sequelize.where(_this.modals.sequelize.col(
                  '`consumerBill->productOfflineSeller->billSellerMapping`.`ref_type`'),
                  2)],
          };
          var onlineSellerWhereClause = {
            $and: [
              _this.modals.sequelize.where(_this.modals.sequelize.col(
                  '`consumerBill->productOnlineSeller->billSellerMapping`.`ref_type`'),
                  1)],
          };
          var offlineSellerRequired = false;
          var onlineSellerRequired = false;
          var whereClause = subCategoryId ? {
            user_id: user.ID,
            status_type: {
              $ne: 3,
            },
            master_category_id: masterCategoryId,
            category_id: subCategoryId ? item.category_id : undefined,
            $and: [
              _this.modals.sequelize.where(_this.modals.sequelize.fn('lower',
                  _this.modals.sequelize.col('product_name')),
                  {$like: _this.modals.sequelize.fn('lower', searchValue)})],
          } : {
            user_id: user.ID,
            status_type: {
              $ne: 3,
            },
            master_category_id: masterCategoryId,
            $and: [
              _this.modals.sequelize.where(_this.modals.sequelize.fn('lower',
                  _this.modals.sequelize.col('product_name')),
                  {$like: _this.modals.sequelize.fn('lower', searchValue)})],
          };
          if (brandIds && brandIds.length > 0) {
            whereClause.brand_id = brandIds;
          }

          if (categoryIds && categoryIds.length > 0) {
            whereClause.category_id = categoryIds;
          }

          if (offlineSellerIds && offlineSellerIds.length > 0) {
            offlineSellerRequired = true;
            offlineSellerWhereClause.$and.push({ID: offlineSellerIds});
          }

          if (onlineSellerIds && onlineSellerIds.length > 0) {
            onlineSellerRequired = true;
            onlineSellerWhereClause.$and.push({ID: onlineSellerIds});
          }

          return _this.modals.productBills.findAll({
            where: whereClause,
            include: [
              {
                model: _this.modals.consumerBillDetails,
                as: 'consumerBill',
                where: {
                  status_type: {
                    $ne: 3,
                  },
                },
                attributes: [
                  [
                    'invoice_number',
                    'invoiceNo'],
                  [
                    'total_purchase_value',
                    'totalCost'],
                  'taxes',
                  [
                    'purchase_date',
                    'purchaseDate']],
                include: [
                  {
                    model: _this.modals.billDetailCopies,
                    as: 'billDetailCopies',
                    include: [
                      {
                        model: _this.modals.billCopies,
                        as: 'billCopies',
                        attributes: [],
                      }],
                    attributes: [
                      [
                        'bill_copy_id',
                        'billCopyId'],
                      [
                        _this.modals.sequelize.fn('CONCAT',
                            _this.modals.sequelize.col(
                                '`consumerBill->billDetailCopies->billCopies`.`bill_copy_type`')),
                        'billCopyType'],
                      [
                        _this.modals.sequelize.fn('CONCAT', 'bills/',
                            _this.modals.sequelize.col(
                                '`consumerBill->billDetailCopies->billCopies`.`bill_copy_id`'),
                            '/files'),
                        'fileUrl']],
                  }, {
                    model: _this.modals.consumerBills,
                    as: 'bill',
                    where: {
                      $and: [
                        _this.modals.sequelize.where(_this.modals.sequelize.col(
                            '`consumerBill->bill->billMapping`.`bill_ref_type`'),
                            1), {
                          user_status: 5,
                          admin_status: 5,
                        }],
                    },
                    attributes: [],
                  }, {
                    model: _this.modals.offlineSeller,
                    as: 'productOfflineSeller',
                    where: offlineSellerWhereClause,
                    attributes: [
                      'ID',
                      [
                        'offline_seller_name',
                        'sellerName'],
                      [
                        'seller_url',
                        'url'],
                      [
                        'address_house_no',
                        'houseNo'],
                      [
                        'address_block',
                        'block'],
                      [
                        'address_street',
                        'street'],
                      [
                        'address_sector',
                        'sector'],
                      [
                        'address_city',
                        'city'],
                      [
                        'address_state',
                        'state'],
                      [
                        'address_pin_code',
                        'pinCode'],
                      [
                        'address_nearby',
                        'nearBy'],
                      'latitude',
                      'longitude'],
                    include: [
                      {
                        model: _this.modals.offlineSellerDetails,
                        as: 'sellerDetails',
                        where: {
                          status_type: {
                            $ne: 3,
                          },
                        },
                        attributes: [
                          [
                            'display_name',
                            'displayName'],
                          'details',
                          [
                            'contactdetail_type_id',
                            'typeId']],
                        required: false,
                      }],
                    required: offlineSellerRequired,
                  }, {
                    model: _this.modals.onlineSeller,
                    as: 'productOnlineSeller',
                    where: onlineSellerWhereClause,
                    attributes: [
                      'ID',
                      [
                        'seller_name',
                        'sellerName'],
                      [
                        'seller_url',
                        'url']],
                    include: [
                      {
                        model: _this.modals.onlineSellerDetails,
                        as: 'sellerDetails',
                        where: {
                          status_type: {
                            $ne: 3,
                          },
                        },
                        attributes: [
                          [
                            'display_name',
                            'displayName'],
                          'details',
                          [
                            'contactdetail_type_id',
                            'typeId']],
                        required: false,
                      }],
                    required: onlineSellerRequired,
                  }],
                required: true,
              }, {
                model: _this.modals.table_brands,
                as: 'brand',
                attributes: [
                  [
                    'brand_name',
                    'name'],
                  [
                    'brand_description',
                    'description'],
                  [
                    'brand_id',
                    'id']],
                required: false,
              }, {
                model: _this.modals.table_color,
                as: 'color',
                attributes: [['color_name', 'name'], ['color_id', 'id']],
                required: false,
              }, {
                model: _this.modals.amcBills,
                as: 'amcDetails',
                attributes: [
                  [
                    'bill_amc_id',
                    'id'],
                  'policyNo',
                  'premiumType',
                  'premiumAmount',
                  'effectiveDate',
                  'expiryDate'],
                where: {
                  user_id: user.ID,
                  status_type: {
                    $ne: 3,
                  },
                },
                order: [['policy_expiry_date', 'DESC']],
                required: false,
              }, {
                model: _this.modals.insuranceBills,
                as: 'insuranceDetails',
                attributes: [
                  [
                    'bill_insurance_id',
                    'id'],
                  'policyNo',
                  'premiumType',
                  'premiumAmount',
                  'effectiveDate',
                  'expiryDate',
                  'amountInsured',
                  'plan'],
                where: {
                  user_id: user.ID,
                  status_type: {
                    $ne: 3,
                  },
                },
                order: [['policy_expiry_date', 'DESC']],
                required: false,
              }, {
                model: _this.modals.warranty,
                as: 'warrantyDetails',
                attributes: [
                  [
                    'bill_warranty_id',
                    'id'],
                  'warrantyType',
                  'policyNo',
                  'premiumType',
                  'premiumAmount',
                  'effectiveDate',
                  'expiryDate'],
                where: {
                  user_id: user.ID,
                  status_type: {
                    $ne: 3,
                  },
                },
                order: [['policy_expiry_date', 'DESC']],
                required: false,
              }, {
                model: _this.modals.productMetaData,
                as: 'productMetaData',
                attributes: [
                  [
                    'form_element_value',
                    'value'],
                  [
                    _this.modals.sequelize.fn('upper',
                        _this.modals.sequelize.col(
                            '`productMetaData->categoryForm`.`form_element_type`')),
                    'type'],
                  [
                    _this.modals.sequelize.fn('upper',
                        _this.modals.sequelize.col(
                            '`productMetaData->categoryForm`.`form_element_name`')),
                    'name']],
                include: [
                  {
                    model: _this.modals.categoryForm,
                    as: 'categoryForm',
                    attributes: [],
                  }, {
                    model: _this.modals.categoryFormMapping,
                    as: 'selectedValue',
                    on: {
                      $or: [
                        _this.modals.sequelize.where(_this.modals.sequelize.col(
                            '`productMetaData`.`category_form_id`'),
                            _this.modals.sequelize.col(
                                '`productMetaData->categoryForm`.`category_form_id`'))],
                    },
                    where: {
                      $and: [
                        _this.modals.sequelize.where(_this.modals.sequelize.col(
                            '`productMetaData`.`form_element_value`'),
                            _this.modals.sequelize.col(
                                '`productMetaData->selectedValue`.`mapping_id`')),
                        _this.modals.sequelize.where(_this.modals.sequelize.col(
                            '`productMetaData->categoryForm`.`form_element_type`'),
                            2)],
                    },
                    attributes: [['dropdown_name', 'value']],
                    required: false,
                  }],
                required: false,
              }, {
                model: _this.modals.categories,
                as: 'masterCategory',
                attributes: [],
              }, {
                model: _this.modals.categories,
                as: 'category',
                attributes: [],
              }],
            attributes: [
              [
                'bill_product_id',
                'id'],
              [
                'product_name',
                'productName'],
              [
                'value_of_purchase',
                'value'],
              'taxes',
              [
                'category_id',
                'categoryId'],
              [
                'master_category_id',
                'masterCategoryId'],
              [
                _this.modals.sequelize.col('`masterCategory`.`category_name`'),
                'masterCategoryName'],
              [
                _this.modals.sequelize.col('`category`.`category_name`'),
                'categoryName'],
              [
                'brand_id',
                'brandId'],
              [
                'color_id',
                'colorId'],
              [
                _this.modals.sequelize.fn('CONCAT', 'products/',
                    _this.modals.sequelize.col(
                        '`productBills`.`bill_product_id`')),
                'productURL'],
              [
                _this.modals.sequelize.fn('CONCAT', 'categories/',
                    _this.modals.sequelize.col('`productBills`.`category_id`'),
                    '/image/'),
                'cImageURL'],
              [
                _this.modals.sequelize.literal(
                    '`consumerBill`.`total_purchase_value`'),
                'totalCost'],
              [
                _this.modals.sequelize.literal('`consumerBill`.`taxes`'),
                'totalTaxes'],
              [
                _this.modals.sequelize.literal(
                    '`consumerBill`.`purchase_date`'),
                'purchaseDate']],
            order: [
              [
                _this.modals.sequelize.literal('`consumerbill.purchaseDate`'),
                sortBy || 'DESC']],
          });
        });
      },
    }]);

  return EHomeAdaptor;
}();

exports.default = EHomeAdaptor;