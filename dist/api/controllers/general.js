/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

var _category = require('../Adaptors/category');

var _category2 = _interopRequireDefault(_category);

var _brands = require('../Adaptors/brands');

var _brands2 = _interopRequireDefault(_brands);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _job = require('../Adaptors/job');

var _job2 = _interopRequireDefault(_job);

var _product = require('../Adaptors/product');

var _product2 = _interopRequireDefault(_product);

var _user = require('../Adaptors/user');

var _user2 = _interopRequireDefault(_user);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contactModel = void 0;
var modals = void 0;
var categoryAdaptor = void 0;
var brandAdaptor = void 0;
var sellerAdaptor = void 0;
var jobAdaptor = void 0;
var productAdaptor = void 0;
var userAdaptor = void 0;

var GeneralController = function () {
  function GeneralController(modal) {
    _classCallCheck(this, GeneralController);

    contactModel = modal.contactUs;
    categoryAdaptor = new _category2.default(modal);
    brandAdaptor = new _brands2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
    jobAdaptor = new _job2.default(modal);
    productAdaptor = new _product2.default(modal);
    userAdaptor = new _user2.default(modal);
    modals = modal;
  }

  /**
   * Retrieve Reference Data
   * @param request
   * @param reply
   */


  _createClass(GeneralController, null, [{
    key: 'retrieveReferenceData',
    value: function retrieveReferenceData(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      var isBrandRequest = false;
      return _bluebird2.default.try(function () {
        if (request.query && user) {
          if (request.query.categoryId && request.query.brandId) {
            return brandAdaptor.retrieveBrandDropDowns({
              category_id: request.query.categoryId,
              brand_id: request.query.brandId,
              $or: {
                status_type: 1,
                $and: {
                  status_type: 11,
                  updated_by: user.id || user.ID
                }
              }
            });
          } else if (request.query.categoryId) {
            isBrandRequest = true;
            return _bluebird2.default.all([categoryAdaptor.retrieveSubCategories({ category_id: request.query.categoryId }, true, request.language, user), categoryAdaptor.retrieveRenewalTypes({
              status_type: 1
            })]);
          } else if (request.query.mainCategoryId) {
            return categoryAdaptor.retrieveCategories({ category_id: request.query.mainCategoryId }, false, request.language, false, user);
          }
        }

        return categoryAdaptor.retrieveCategories({ category_level: 1 }, false, request.language);
      }).then(function (results) {
        return reply({
          status: true,
          dropDowns: request.query.brandId ? results : undefined,
          categories: request.query.brandId ? undefined : isBrandRequest ? results[0] : results,
          renewalTypes: isBrandRequest ? results[1] : undefined,
          contactType: [{
            id: 1,
            name: 'URL'
          }, {
            id: 2,
            name: 'EMAIL'
          }, {
            id: 3,
            name: 'PHONE'
          }]
        });
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });

        return reply({
          status: false
        });
      });
    }
  }, {
    key: 'contactUs',
    value: function contactUs(request, reply) {
      return _bluebird2.default.try(function () {
        if (request.payload.captcha_response) {
          return _notification2.default.verifyCaptcha(request.payload.captcha_response);
        }

        return false;
      }).then(function (isVerified) {
        if (isVerified) {
          _notification2.default.sendLinkOnMessage(request.payload.phone);
        }

        return contactModel.findOne({
          where: {
            phone: request.payload.phone
          }
        }).then(function (item) {
          if (item) {
            return contactModel.update({ msg_day: item.msg_day + 1 }, {
              where: {
                phone: request.payload.phone
              }
            });
          } else if (!item) {
            return contactModel.create({
              name: request.payload.name,
              phone: request.payload.phone,
              email: request.payload.email,
              message: request.payload.message
            });
          }

          return false;
        }).then(function (isValid) {
          if (isValid === false) {
            return reply({
              status: false,
              message: 'You have reached to max attempt for a day'
            });
          }

          if (request.payload.message || isVerified) {
            if (request.payload.message) {
              _notification2.default.sendUserCommentToTeam('Comment received', request.payload);
            }
            return reply({ status: true }).code(201);
          }

          return reply({
            status: false,
            message: 'Invalid Request'
          });
        }).catch(function (error) {
          console.log('Error on ' + new Date() + ' is as follow: \n \n ' + error);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: 1,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({
            status: false,
            message: 'Invalid Request'
          });
        });
      });
    }
  }, {
    key: 'retrieveFAQs',
    value: function retrieveFAQs(request, reply) {
      return modals.faqs.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        order: [['id']]
      }).then(function (faq) {
        return reply({ status: true, faq: faq }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user is as follow: \n \n ' + err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'retrieveTips',
    value: function retrieveTips(request, reply) {
      return modals.tips.findAll({ order: [['id']] }).then(function (tips) {
        return reply({ status: true, tips: tips }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' for user is as follow: \n \n ' + err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'retrieveKnowItems',
    value: function retrieveKnowItems(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        var language = request.language;
        var options = {
          where: {
            batch_date: {
              $lte: (0, _moment2.default)().endOf('days')
            }
          },
          include: [{
            model: modals.tags,
            as: 'tags',
            attributes: [['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description']]
          }, {
            model: modals.users,
            as: 'users',
            attributes: ['id']
          }],
          attributes: ['id', ['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description'], 'short_url'],
          order: [['id', 'asc']],
          limit: request.query.limit || 10
        };

        console.log({ offset: request.query.offset });
        if (request.query.offset) {
          options.offset = request.query.offset;
        }

        var tagMapOptions = {};
        if (request.payload && request.payload.tag_id && request.payload.tag_id.length > 0) {
          tagMapOptions.where = modals.sequelize.where(modals.sequelize.col('"tag_id"'), { $in: request.payload.tag_id });
        }
        return _bluebird2.default.try(function () {
          return modals.know_tag_map.findAll(tagMapOptions);
        }).then(function (tagMapResult) {
          tagMapResult = tagMapResult.map(function (tMItem) {
            return tMItem.toJSON();
          });
          options.where.id = tagMapResult.map(function (tMItem) {
            return tMItem.know_item_id;
          });
          return modals.knowItems.findAll(options);
        }).then(function (knowItems) {
          return reply({
            status: true,
            items: JSON.parse(JSON.stringify(knowItems.map(function (item) {
              var knowItemDetail = item.toJSON();
              knowItemDetail.imageUrl = '/knowitem/' + knowItemDetail.id + '/images';
              knowItemDetail.title = knowItemDetail.title || knowItemDetail.default_title;
              knowItemDetail.description = knowItemDetail.description || knowItemDetail.default_description;
              knowItemDetail.tags = knowItemDetail.tags.map(function (tagItem) {
                tagItem.title = tagItem.title || tagItem.default_title;
                return tagItem;
              });
              knowItemDetail.hashTags = '';
              knowItemDetail.tags.forEach(function (tagItem) {
                knowItemDetail.hashTags += '#' + tagItem.title + ' ';
              });
              knowItemDetail.hashTags = knowItemDetail.hashTags.trim();
              knowItemDetail.totalLikes = knowItemDetail.users.length;
              knowItemDetail.isLikedByUser = knowItemDetail.users.findIndex(function (userItem) {
                return userItem.id === (user.id || user.ID);
              }) >= 0;
              return knowItemDetail;
            })))
          }).code(200);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({ status: false }).code(200);
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveKnowItemUnAuthorized',
    value: function retrieveKnowItemUnAuthorized(request, reply) {
      var supportedLanguages = _main2.default.SUPPORTED_LANGUAGES.split(',');
      var language = (request.headers.language || '').split('-')[0];
      language = supportedLanguages.indexOf(language) >= 0 ? language : '';
      var options = {
        where: {
          batch_date: {
            $lte: (0, _moment2.default)()
          }
        },
        include: [{
          model: modals.tags,
          as: 'tags',
          attributes: [['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description']]
        }, {
          model: modals.users,
          as: 'users',
          attributes: ['id']
        }],
        attributes: ['id', ['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description'], 'short_url'],
        order: [['id', 'asc']]
      };

      return modals.knowItems.findAll(options).then(function (knowItems) {
        return reply({
          status: true, items: knowItems.map(function (item) {
            item = item.toJSON();
            item.imageUrl = '/knowitem/' + item.id + '/images';
            item.title = item.title || item.default_title;
            item.description = item.description || item.default_description;
            item.tags = item.tags.map(function (tagItem) {
              tagItem.title = tagItem.title || tagItem.default_title;
              return tagItem;
            });
            item.hashTags = '';
            item.tags.forEach(function (tagItem) {
              item.hashTags += '#' + tagItem.title + ' ';
            });
            item.hashTags = item.hashTags.trim();
            item.totalLikes = item.users.length;
            return item;
          }).slice((request.query.offset || 1) - 1, request.query.limit || 10)
        }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' is as follow: \n \n ' + err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'retrieveKnowItemsById',
    value: function retrieveKnowItemsById(request, reply) {
      var supportedLanguages = _main2.default.SUPPORTED_LANGUAGES.split(',');
      var language = (request.headers.language || '').split('-')[0];
      language = supportedLanguages.indexOf(language) >= 0 ? language : '';
      var options = {
        include: [{
          model: modals.tags,
          as: 'tags',
          attributes: [['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description']]
        }, {
          model: modals.users,
          as: 'users',
          attributes: ['id']
        }],
        attributes: ['id', ['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description'], 'short_url'],
        order: [['created_at', 'desc']]
      };

      return modals.knowItems.findById(request.params.id, options).then(function (result) {
        var knowItem = result.toJSON();
        knowItem.imageUrl = '/knowitem/' + knowItem.id + '/images';
        knowItem.hashTags = '';
        knowItem.title = knowItem.title || knowItem.default_title;
        knowItem.description = knowItem.description || knowItem.default_description;
        knowItem.tags = knowItem.tags.map(function (tagItem) {
          tagItem.title = tagItem.title || tagItem.default_title;
          return tagItem;
        });
        knowItem.tags.forEach(function (tagItem) {
          knowItem.hashTags += '#' + tagItem.title + ' ';
        });
        knowItem.hashTags = knowItem.hashTags.trim();
        knowItem.totalLikes = knowItem.users.length;

        return reply({
          status: true, item: knowItem
        }).code(200);
      }).catch(function (err) {
        console.log('Error on ' + new Date() + ' is as follow: \n \n ' + err);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err: err
          })
        }).catch(function (ex) {
          return console.log('error while logging on db,', ex);
        });
        return reply({ status: false }).code(200);
      });
    }
  }, {
    key: 'retrieveTags',
    value: function retrieveTags(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        var language = request.language;
        return modals.tags.findAll({
          include: {
            model: modals.knowItems,
            as: 'knowItems',
            where: {
              batch_date: {
                $lte: (0, _moment2.default)()
              }
            },
            attributes: [],
            required: true
          },
          attributes: ['id', ['title', 'default_title'], ['' + (language ? 'title_' + language : 'title'), 'title'], ['description', 'default_description'], ['' + (language ? 'description_' + language : 'description'), 'description']],
          distinct: true,
          order: [['created_at', 'desc']]
        }).then(function (tagItems) {
          return reply({
            status: true, items: tagItems.map(function (item) {
              item = item.toJSON();
              item.title = item.title || item.default_title;
              item.description = item.description || item.default_description;
              return item;
            })
          }).code(200);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({ status: false }).code(200);
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'likeKnowItems',
    value: function likeKnowItems(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return modals.know_user_likes.create({
          user_id: user.id || user.ID,
          know_item_id: request.params.id
        }).then(function () {
          return reply({
            status: true,
            message: 'You have successfully liked this item.'
          }).code(200);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({ status: false }).code(200);
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'disLikeKnowItems',
    value: function disLikeKnowItems(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return modals.know_user_likes.destroy({
          where: {
            user_id: user.id || user.ID,
            know_item_id: request.params.id
          }
        }).then(function () {
          return reply({
            status: true,
            message: 'You have successfully Un-liked this item.'
          }).code(200);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({ status: false }).code(200);
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'initializeUserProduct',
    value: function initializeUserProduct(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return jobAdaptor.createJobs({
            job_id: '' + Math.random().toString(36).substr(2, 9) + (user.id || user.ID).toString(36),
            user_id: user.id || user.ID,
            updated_by: user.id || user.ID,
            uploaded_by: user.id || user.ID,
            user_status: 8,
            admin_status: 2,
            comments: request.query ? request.query.productId ? 'This job is sent for product id ' + request.query.productId : request.query.productName ? 'This job is sent for product name ' + request.query.productName : '' : ''
          });
        }).then(function (jobResult) {
          return _bluebird2.default.all([productAdaptor.createEmptyProduct({
            job_id: jobResult.id,
            product_name: request.payload.product_name,
            user_id: user.id || user.ID,
            main_category_id: request.payload.main_category_id,
            category_id: request.payload.category_id,
            brand_id: request.payload.brand_id,
            colour_id: request.payload.colour_id,
            purchase_cost: request.payload.purchase_cost,
            taxes: request.payload.taxes,
            updated_by: user.id || user.ID,
            seller_id: request.payload.seller_id,
            status_type: 8,
            document_number: request.payload.document_number,
            document_date: request.payload.document_date ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).isValid() ? _moment2.default.utc(request.payload.document_date, _moment2.default.ISO_8601).startOf('day').format('YYYY-MM-DD') : _moment2.default.utc(request.payload.document_date, 'DD MMM YY').startOf('day').format('YYYY-MM-DD') : undefined,
            brand_name: request.payload.brand_name,
            copies: []
          }), categoryAdaptor.retrieveSubCategories({ category_id: request.payload.category_id }, true), categoryAdaptor.retrieveRenewalTypes({
            status_type: 1
          })]);
        }).then(function (initResult) {
          return reply({
            status: true,
            product: initResult[0],
            categories: initResult[1],
            renewalTypes: initResult[2],
            message: 'Product and Job is initialized.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({
            status: false,
            message: 'Unable to initialize product or job.',
            forceUpdate: request.pre.forceUpdate
          }).code(200);
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'serviceCenterAccessed',
    value: function serviceCenterAccessed(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return userAdaptor.updateUserDetail({ service_center_accessed: true }, {
            where: {
              id: user.id || user.ID
            }
          });
        }).then(function () {
          return reply({
            status: true,
            message: 'Status updated successfully.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({
            status: false,
            message: 'Failed to update status',
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveRepairableProducts',
    value: function retrieveRepairableProducts(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);

      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return productAdaptor.retrieveProducts({
            main_category_id: [1, 2, 3],
            status_type: [5, 11],
            user_id: user.id || user.ID
          });
        }).then(function (productResult) {
          return reply({
            status: true,
            product: productResult,
            message: 'Success.'
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          modals.logs.create({
            api_action: request.method,
            api_path: request.url.pathname,
            log_type: 2,
            user_id: user.id || user.ID,
            log_content: JSON.stringify({
              params: request.params,
              query: request.query,
              headers: request.headers,
              payload: request.payload,
              err: err
            })
          }).catch(function (ex) {
            return console.log('error while logging on db,', ex);
          });
          return reply({
            status: false,
            message: 'Unable to fetch product list',
            forceUpdate: request.pre.forceUpdate
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return GeneralController;
}();

exports.default = GeneralController;