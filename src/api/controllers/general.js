/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../adaptors/notification';
import CategoryAdaptor from '../adaptors/category';
import BrandAdaptor from '../adaptors/brands';
import SellerAdaptor from '../adaptors/sellers';
import JobAdaptor from '../adaptors/job';
import ProductAdaptor from '../adaptors/product';
import UserAdaptor from '../adaptors/user';
import Promise from 'bluebird';
import shared from '../../helpers/shared';
import moment from 'moment/moment';
import config from '../../config/main';
import {sendSMS} from '../../helpers/sms';

let contactModel;
let modals;
let categoryAdaptor;
let brandAdaptor;
let sellerAdaptor;
let jobAdaptor;
let productAdaptor;
let userAdaptor;

class GeneralController {
  constructor(modal, socket) {
    contactModel = modal.contactUs;
    categoryAdaptor = new CategoryAdaptor(modal);
    brandAdaptor = new BrandAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal, socket);
    productAdaptor = new ProductAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
    modals = modal;
  }

  static async checkForAppUpdate(request, reply) {
    try {
      if (request.headers['app-version'] !== undefined ||
          request.headers['ios-app-version'] !== undefined) {
        const id = request.headers['ios-app-version'] ? 2 : 1;

        const result = await modals.appVersion.findOne({
          where: {id},
          order: [['updatedAt', 'DESC']],
          attributes: [
            'recommended_version', 'force_version', 'details'],
        });
        return reply.response(result);
      } else {
        console.log('App Version not in Headers');
        return reply.response(null);
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to fetch product list.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  /**
   * Retrieve Reference Data
   * @param request
   * @param reply
   */
  static async retrieveReferenceData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    let isBrandRequest = false;
    try {
      let results;
      if (request.query && user) {
        if (request.query.categoryId && request.query.brandId) {
          results = await brandAdaptor.retrieveBrandDropDowns({
            category_id: request.query.categoryId,
            brand_id: request.query.brandId,
            $or: {
              status_type: 1,
              $and: {
                status_type: 11,
                updated_by: user.id || user.ID,
              },
            },
          });
        } else if (request.query.categoryId) {
          isBrandRequest = true;
          results = await Promise.all([
            categoryAdaptor.retrieveSubCategories(
                {category_id: request.query.categoryId}, true,
                request.language, user),
            categoryAdaptor.retrieveRenewalTypes({
              status_type: 1,
            })]);
        } else if (request.query.mainCategoryId) {
          const category_id = request.query.mainCategoryId.toString() === '2' ?
              [11, 12] : request.query.mainCategoryId;
          results = await categoryAdaptor.retrieveCategories(
              {
                options: {category_id},
                isSubCategoryRequiredForAll: true,
                isBrandFormRequired: false,
                language: request.language,
                isFilterRequest: false,
                user: user,
              });
        } else {
          results = await categoryAdaptor.retrieveCategories(
              {
                options: {category_level: 1},
                isSubCategoryRequiredForAll: true,
                isBrandFormRequired: false,
                language: request.language,
              });
        }

        return reply.response({
          status: true,
          dropDowns: request.query.brandId ? results : undefined,
          categories: request.query.brandId ?
              undefined :
              isBrandRequest ?
                  results[0] :
                  results,
          renewalTypes: isBrandRequest ? results[1] : undefined,
          contactType: [
            {id: 1, name: 'URL'},
            {id: 2, name: 'EMAIL'},
            {id: 3, name: 'PHONE'}],
        });
      }
      results = await categoryAdaptor.retrieveCategories(
          {
            options: {category_level: 1}, isSubCategoryRequiredForAll: true,
            isBrandFormRequired: false,
            language: request.language,
          });
      return reply.response({
        status: true,
        dropDowns: request.query.brandId ? results : undefined,
        categories: request.query.brandId ?
            undefined :
            isBrandRequest ?
                results[0] :
                results,
        renewalTypes: isBrandRequest ? results[1] : undefined,
        contactType: [
          {id: 1, name: 'URL'},
          {id: 2, name: 'EMAIL'},
          {id: 3, name: 'PHONE'}],
      });
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
      });
    }
  }

  static async retrieveAccessoryPartRefData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      return reply.response({
        status: true,
        accessory_parts: request.query.category_id ?
            await categoryAdaptor.retrieveAccessoryPart(
                {category_id: request.query.category_id}) :
            await categoryAdaptor.retrieveAccessoryPart(
                {options: {main_category_id: [1, 2, 3]}}),
      });
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
      });
    }
  }

  static async contactUs(request, reply) {
    try {
      let isVerified = false;
      if (request.payload.captcha_response) {
        isVerified = await NotificationAdaptor.verifyCaptcha(
            request.payload.captcha_response);
      }

      if (isVerified) {
        NotificationAdaptor.sendLinkOnMessage(request.payload.phone);
      }

      const item = await contactModel.findOne({
        where: {
          phone: request.payload.phone,
        },
      });
      let isValid = false;
      if (item) {
        isValid = await contactModel.update({msg_day: item.msg_day + 1}, {
          where: {
            phone: request.payload.phone,
          },
        });
      } else if (!item) {
        isValid = await contactModel.create({
          name: request.payload.name,
          phone: request.payload.phone,
          email: request.payload.email,
          message: request.payload.message,
        });
      }
      if (isValid === false) {
        return reply.response({
          status: false,
          message: 'You have reached to max attempt for a day',
        });
      }

      if (request.payload.message || isVerified) {
        if (request.payload.message) {
          NotificationAdaptor.sendUserCommentToTeam('Comment received',
              request.payload);
        }

        return reply.response({status: true}).code(201);
      }

      return reply.response({
        status: false,
        message: 'Invalid Request',
      });
    } catch (err) {
      console.log(
          `Error on ${new Date()} is as follow: \n \n ${error}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));

      return reply.response({
        status: false,
        message: 'Invalid Request',
      });
    }
  }

  static async retrieveFAQs(request, reply) {
    try {
      let user_location, user;
      if (request.headers) {
        user = shared.verifyAuthorization(request.headers);
        user_location = user.seller_detail ?
            await modals.seller_users.findOne(
                {where: {id: user.id}, attributes: ['id']}) :
            await modals.users.findOne(
                {where: {id: user.id}, attributes: ['location']});
        user_location = user_location.toJSON();
      }

      const type = user ? user.seller_detail ? 3 :
          (user_location && (user_location.location &&
          user_location.location.toLowerCase() ===
          'other') || !user_location.location ? 1 : [1, 2]) : undefined;
      const faq = await modals.faqs.findAll({
        where: JSON.parse(JSON.stringify({status_id: {$ne: 3}, type})),
        order: [['id']],
      });
      return reply.response({status: true, faq}).code(200);
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user is as follow: \n \n ${err}`);

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,

        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveTips(request, reply) {
    try {
      const tips = await modals.tips.findAll({order: [['id']]});
      return reply.response({status: true, tips}).code(200);
    } catch (err) {
      console.log(
          `Error on ${new Date()} for user is as follow: \n \n ${err}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,

        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const language = request.language;
        const options = {
          where: {batch_date: {$lte: moment().endOf('days')}},
          include: [
            {
              model: modals.tags, as: 'tags',
              attributes: [
                ['title', 'default_title'],
                [`${language ? `title_${language}` : `title`}`, 'title'],
                ['description', 'default_description'],
                [
                  `${language ? `description_${language}` : `description`}`,
                  'description'],
              ],
            },
            {
              model: modals.users,
              as: 'users',
              attributes: ['id'],
            }],
          attributes: [
            'id',
            ['title', 'default_title'],
            [`${language ? `title_${language}` : `title`}`, 'title'],
            ['description', 'default_description'],
            [
              `${language ? `description_${language}` : `description`}`,
              'description'], 'short_url'],
          order: [['id', 'asc']],
          limit: request.query.limit || 10,
        };

        console.log({offset: request.query.offset});
        if (request.query.offset) {
          options.offset = request.query.offset;
        }

        const tagMapOptions = {};
        if (request.payload && request.payload.tag_id &&
            request.payload.tag_id.length > 0) {
          tagMapOptions.where = modals.sequelize.where(
              modals.sequelize.col('"tag_id"'),
              {$in: request.payload.tag_id});
        }
        let tagMapResult = await modals.know_tag_map.findAll(tagMapOptions);
        tagMapResult = tagMapResult.map((tMItem) => tMItem.toJSON());
        options.where.id = tagMapResult.map(
            (tMItem) => tMItem.know_item_id);
        const knowItems = await modals.knowItems.findAll(options);
        return reply.response({
          status: true,
          items: JSON.parse(JSON.stringify(knowItems.map((item) => {
            const knowItemDetail = item.toJSON();
            knowItemDetail.imageUrl = `/knowitem/${knowItemDetail.id}/images`;
            knowItemDetail.title = knowItemDetail.title ||
                knowItemDetail.default_title;
            knowItemDetail.description = knowItemDetail.description ||
                knowItemDetail.default_description;
            knowItemDetail.tags = knowItemDetail.tags.map((tagItem) => {
              tagItem.title = tagItem.title || tagItem.default_title;
              return tagItem;
            });
            knowItemDetail.hashTags = '';
            knowItemDetail.tags.forEach((tagItem) => {
              knowItemDetail.hashTags += `#${tagItem.title} `;
            });
            knowItemDetail.hashTags = knowItemDetail.hashTags.trim();
            knowItemDetail.totalLikes = knowItemDetail.users.length;
            knowItemDetail.isLikedByUser = knowItemDetail.users.findIndex(
                (userItem) => userItem.id === (user.id || user.ID)) >= 0;
            return knowItemDetail;
          }))),
        }).code(200);
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveKnowItemUnAuthorized(request, reply) {
    try {
      const supportedLanguages = config.SUPPORTED_LANGUAGES.split(',');
      let language = (request.headers.language || '').split('-')[0];
      language = supportedLanguages.indexOf(language) >= 0 ? language : '';
      const options = {
        where: {
          batch_date: {
            $lte: moment(),
          },
        },
        include: [
          {
            model: modals.tags,
            as: 'tags',
            attributes: [
              [
                'title',
                'default_title'],
              [
                `${language ? `title_${language}` : `title`}`,
                'title'],
              [
                'description',
                'default_description'],
              [
                `${language ? `description_${language}` : `description`}`,
                'description'],
            ],
          },
          {
            model: modals.users,
            as: 'users',
            attributes: ['id'],
          }],
        attributes: [
          'id',
          [
            'title',
            'default_title'],
          [
            `${language ? `title_${language}` : `title`}`,
            'title'],
          [
            'description',
            'default_description'],
          [
            `${language ? `description_${language}` : `description`}`,
            'description'],
          'short_url'],
        order: [['id', 'asc']],
      };
      const knowItems = await modals.knowItems.findAll(options);
      return reply.response({
        status: true, items: knowItems.map((item) => {
          item = item.toJSON();
          item.imageUrl = `/knowitem/${item.id}/images`;
          item.title = item.title || item.default_title;
          item.description = item.description || item.default_description;
          item.tags = item.tags.map((tagItem) => {
            tagItem.title = tagItem.title || tagItem.default_title;
            return tagItem;
          });
          item.hashTags = '';
          item.tags.forEach((tagItem) => {
            item.hashTags += `#${tagItem.title} `;
          });
          item.hashTags = item.hashTags.trim();
          item.totalLikes = item.users.length;
          return item;
        }).slice((request.query.offset || 1) - 1, request.query.limit || 10),
      }).code(200);
    } catch (err) {
      console.log(
          `Error on ${new Date()} is as follow: \n \n ${err}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,

        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveKnowItemsById(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      const supportedLanguages = config.SUPPORTED_LANGUAGES.split(',');
      let language = (request.headers.language || '').split('-')[0];
      language = supportedLanguages.indexOf(language) >= 0 ? language : '';
      const options = {
        include: [
          {
            model: modals.tags,
            as: 'tags',
            attributes: [
              [
                'title',
                'default_title'],
              [
                `${language ? `title_${language}` : `title`}`,
                'title'],
              [
                'description',
                'default_description'],
              [
                `${language ? `description_${language}` : `description`}`,
                'description'],
            ],
          },
          {
            model: modals.users,
            as: 'users',
            attributes: ['id'],
          }],
        attributes: [
          'id',
          [
            'title',
            'default_title'],
          [
            `${language ? `title_${language}` : `title`}`,
            'title'],
          [
            'description',
            'default_description'],
          [
            `${language ? `description_${language}` : `description`}`,
            'description'],
          'short_url'],
        order: [['created_at', 'desc']],
      };

      const result = await modals.knowItems.findById(request.params.id,
          options);
      const knowItem = result.toJSON();
      knowItem.imageUrl = `/knowitem/${knowItem.id}/images`;
      knowItem.hashTags = '';
      knowItem.title = knowItem.title || knowItem.default_title;
      knowItem.description = knowItem.description ||
          knowItem.default_description;
      knowItem.tags = knowItem.tags.map((tagItem) => {
        tagItem.title = tagItem.title || tagItem.default_title;
        return tagItem;
      });
      knowItem.tags.forEach((tagItem) => {
        knowItem.hashTags += `#${tagItem.title} `;
      });
      knowItem.hashTags = knowItem.hashTags.trim();
      knowItem.totalLikes = knowItem.users.length;
      knowItem.isLikedByUser = user ? knowItem.users.findIndex(
          (userItem) => userItem.id === (user.id || user.ID)) >= 0 : false;
      return reply.response({
        status: true, item: knowItem,
      }).code(200);
    } catch (err) {
      console.log(
          `Error on ${new Date()} is as follow: \n \n ${err}`);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveTags(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const language = request.language;
        const tagItems = await modals.tags.findAll({
          include:
              {
                model: modals.knowItems,
                as: 'knowItems',
                where: {
                  batch_date: {
                    $lte: moment(),
                  },
                },
                attributes: [],
                required: true,
              },
          attributes: [
            'id',
            [
              'title',
              'default_title'],
            [
              `${language ? `title_${language}` : `title`}`,
              'title'],
            [
              'description',
              'default_description'],
            [
              `${language ? `description_${language}` : `description`}`,
              'description']],
          distinct: true,
          order: [['created_at', 'desc']],
        });
        return reply.response({
          status: true, items: tagItems.map((item) => {
            item = item.toJSON();
            item.title = item.title || item.default_title;
            item.description = item.description || item.default_description;
            return item;
          }),
        }).code(200);
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async likeKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        await modals.know_user_likes.create({
          user_id: user.id || user.ID,
          know_item_id: request.params.id,
        });
        return reply.response({
          status: true,
          message: 'You have successfully liked this item.',
        }).code(200);
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async disLikeKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        await modals.know_user_likes.destroy({
          where: {
            user_id: user.id || user.ID,
            know_item_id: request.params.id,
          },
        });
        return reply.response({
          status: true,
          message: 'You have successfully Un-liked this item.',
        }).code(200);

      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({status: false}).code(200);
    }
  }

  static async initializeUserProduct(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const jobResult = await jobAdaptor.createJobs({
          job_id: `${Math.random().
              toString(36).
              substr(2, 9)}${(user.id ||
              user.ID).toString(
              36)}`,
          user_id: user.id || user.ID,
          updated_by: user.id || user.ID,
          uploaded_by: user.id || user.ID,
          user_status: 8,
          admin_status: 2,
          comments: request.query ?
              request.query.productId ?
                  `This job is sent for product id ${request.query.productId}` :
                  request.query.productName ?
                      `This job is sent for product name ${request.query.productName}` :
                      '' :
              ``,
        });
        const [product, categories, renewalTypes] = await Promise.all([
          productAdaptor.createEmptyProduct({
            job_id: jobResult.id,
            product_name: request.payload.product_name,
            user_id: user.id || user.ID,
            main_category_id: request.payload.main_category_id,
            category_id: request.payload.category_id,
            sub_category_id: request.payload.sub_category_id,
            brand_id: request.payload.brand_id,
            colour_id: request.payload.colour_id,
            purchase_cost: request.payload.purchase_cost,
            taxes: request.payload.taxes,
            updated_by: user.id || user.ID,
            seller_id: request.payload.seller_id,
            status_type: 8,
            document_number: request.payload.document_number,
            document_date: request.payload.document_date ?
                moment.utc(request.payload.document_date,
                    moment.ISO_8601).
                    isValid() ?
                    moment.utc(request.payload.document_date,
                        moment.ISO_8601).
                        startOf('day').
                        format('YYYY-MM-DD') :
                    moment.utc(request.payload.document_date, 'DD MMM YY').
                        startOf('day').
                        format('YYYY-MM-DD') :
                undefined,
            brand_name: request.payload.brand_name,
            copies: [],
          }), categoryAdaptor.retrieveSubCategories(
              {category_id: request.payload.category_id}, true),
          categoryAdaptor.retrieveRenewalTypes({
            status_type: 1,
          })]);
        return reply.response({
          status: true,
          product,
          categories,
          renewalTypes,
          message: 'Product and Job is initialized.',
        });
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to initialize product or job.',
        forceUpdate: request.pre.forceUpdate,
      }).code(200);
    }
  }

  static async serviceCenterAccessed(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        await userAdaptor.updateUserDetail(
            {service_center_accessed: true}, {
              where: {
                id: user.id || user.ID,
              },
            });
        return reply.response({
          status: true,
          message: 'Status updated successfully.',
        });
      } catch (err) {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Failed to update status',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } else if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async sesBounceHandler(request, reply) {
    try {
      await modals.logs.create({
        log_type: 4,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
        }),
      });
      return reply.response().code(200);
    } catch (e) {
      console.log('error while logging on db,', ex);
      return reply.response().code(200);
    }
  }

  static async sesComplaintHandler(request, reply) {
    try {
      await modals.logs.create({
        log_type: 4,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
        }),
      });
      return reply.response({status: true}).code(200);
    } catch (e) {
      console.log('error while logging on db,', ex);
      return reply.response({status: false}).code(200);
    }
  }

  static async sendMessages(request, reply) {
    try {
      await modals.logs.create({
        log_type: 100,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
        }),
      });
      sendSMS(request.query.billDetails, request.query.number);
      return reply.response({status: true}).code(200);
    } catch (e) {
      console.log('error while logging on db,', ex);
      return reply.response({status: false}).code(200);
    }
  }

  static async retrieveRepairableProducts(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        const product = await productAdaptor.retrieveProducts({
          main_category_id: [1, 2, 3],
          status_type: [5, 11],
          user_id: user.id || user.ID,
        });
        return reply.response({
          status: true,
          product,
          message: 'Success.',
        });

      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to fetch product list.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default GeneralController;