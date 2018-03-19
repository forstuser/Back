/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../Adaptors/notification';
import CategoryAdaptor from '../Adaptors/category';
import BrandAdaptor from '../Adaptors/brands';
import SellerAdaptor from '../Adaptors/sellers';
import JobAdaptor from '../Adaptors/job';
import ProductAdaptor from '../Adaptors/product';
import UserAdaptor from '../Adaptors/user';
import Bluebird from 'bluebird';
import shared from '../../helpers/shared';
import moment from 'moment/moment';
import config from '../../config/main';

let contactModel;
let modals;
let categoryAdaptor;
let brandAdaptor;
let sellerAdaptor;
let jobAdaptor;
let productAdaptor;
let userAdaptor;

class GeneralController {
  constructor(modal) {
    contactModel = modal.contactUs;
    categoryAdaptor = new CategoryAdaptor(modal);
    brandAdaptor = new BrandAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal);
    productAdaptor = new ProductAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
    modals = modal;
  }

  /**
   * Retrieve Reference Data
   * @param request
   * @param reply
   */
  static retrieveReferenceData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    let isBrandRequest = false;
    return Bluebird.try(() => {
      if (request.query && user) {
        if (request.query.categoryId && request.query.brandId) {
          return brandAdaptor.retrieveBrandDropDowns({
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
          return Promise.all([
            categoryAdaptor.retrieveSubCategories(
                {category_id: request.query.categoryId}, true,
                request.language),
            categoryAdaptor.retrieveRenewalTypes({
              status_type: 1,
            })]);
        } else if (request.query.mainCategoryId) {
          return categoryAdaptor.retrieveCategories(
              {category_id: request.query.mainCategoryId}, false,
              request.language);
        }
      }

      return categoryAdaptor.retrieveCategories(
          {category_level: 1}, false, request.language);
    }).
        then((results) => {
          return reply({
            status: true,
            dropDowns: request.query.brandId ? results : undefined,
            categories: request.query.brandId ?
                undefined :
                isBrandRequest ?
                    results[0] :
                    results,
            renewalTypes: isBrandRequest ? results[1] : undefined,
            contactType: [
              {
                id: 1,
                name: 'URL',
              }, {
                id: 2,
                name: 'EMAIL',
              }, {
                id: 3,
                name: 'PHONE',
              }],
          });
        }).
        catch((err) => {
          console.log(
              `Error on ${new Date()} for user ${user.id ||
              user.ID} is as follow: \n \n ${err}`);

          return reply({
            status: false,
          });
        });
  }

  static contactUs(request, reply) {
    return Bluebird.try(() => {
      if (request.payload.captcha_response) {
        return NotificationAdaptor.verifyCaptcha(
            request.payload.captcha_response);
      }

      return false;
    }).then((isVerified) => {
      if (isVerified) {
        NotificationAdaptor.sendLinkOnMessage(request.payload.phone);
      }

      return contactModel.findOne({
        where: {
          phone: request.payload.phone,
        },
      }).then((item) => {
        if (item) {
          return contactModel.update({msg_day: item.msg_day + 1}, {
            where: {
              phone: request.payload.phone,
            },
          });
        } else if (!item) {
          return contactModel.create({
            name: request.payload.name,
            phone: request.payload.phone,
            email: request.payload.email,
            message: request.payload.message,
          });
        }

        return false;
      }).then((isValid) => {
        if (isValid === false) {
          return reply({
            status: false,
            message: 'You have reached to max attempt for a day',
          });
        }

        if (request.payload.message || isVerified) {
          if (request.payload.message) {
            NotificationAdaptor.sendUserCommentToTeam('Comment received',
                request.payload);
          }
          return reply({status: true}).code(201);
        }

        return reply({
          status: false,
          message: 'Invalid Request',
        });
      }).catch((error) => {
        console.log(
            `Error on ${new Date()} is as follow: \n \n ${error}`);
        return reply({
          status: false,
          message: 'Invalid Request',
        });
      });
    });
  }

  static retrieveFAQs(request, reply) {
    return modals.faqs.findAll({
      where: {
        status_id: {
          $ne: 3,
        },
      },
      order: [['id']],
    }).then((faq) => {
      return reply({status: true, faq}).code(200);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false}).code(200);
    });
  }

  static retrieveTips(request, reply) {
    return modals.tips.findAll({order: [['id']]}).then((tips) => {
      return reply({status: true, tips}).code(200);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false}).code(200);
    });
  }

  static retrieveKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    if (request.pre.userExist && !request.pre.forceUpdate) {
      const language = request.language;
      const options = {
        include: [
          {
            model: modals.tags,
            as: 'tags',
            attributes: [
              [
                'title',
                'default_title'],
              [`${language ? `title_${language}` : `title`}`, 'title'],
              [
                'description',
                'default_description'],
              [`${language ? `description_${language}` : `description`}`, 'description']
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
          [`${language ? `title_${language}` : `title`}`, 'title'],
          [
            'description',
            'default_description'],
          [`${language ? `description_${language}` : `description`}`, 'description'],
          'short_url'],
        order: [['created_at', 'desc']],
      };

      if (request.payload && request.payload.tag_id &&
          request.payload.tag_id.length > 0) {
        options.where = modals.sequelize.where(
            modals.sequelize.literal('"tags"."id"'),
            {$in: request.payload.tag_id});
      }
      return modals.knowItems.findAll(options).then((knowItems) => {
        return reply({
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
            item.isLikedByUser = item.users.findIndex(
                (userItem) => userItem.id === (user.id || user.ID)) >= 0;
            return item;
          }),
        }).code(200);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({status: false}).code(200);
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveKnowItemUnAuthorized(request, reply) {
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
            [`${language ? `title_${language}` : `title`}`, 'title'],
            [
              'description',
              'default_description'],
            [`${language ? `description_${language}` : `description`}`, 'description']
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
        [`${language ? `title_${language}` : `title`}`, 'title'],
        [
          'description',
          'default_description'],
        [`${language ? `description_${language}` : `description`}`, 'description'],
        'short_url'],
      order: [['created_at', 'desc']],
    };

    return modals.knowItems.findAll(options).then((knowItems) => {
      return reply({
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
        }),
      }).code(200);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} is as follow: \n \n ${err}`);
      return reply({status: false}).code(200);
    });
  }

  static retrieveKnowItemsById(request, reply) {
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
            [`${language ? `title_${language}` : `title`}`, 'title'],
            [
              'description',
              'default_description'],
            [`${language ? `description_${language}` : `description`}`, 'description']
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
        [`${language ? `title_${language}` : `title`}`, 'title'],
        [
          'description',
          'default_description'],
        [`${language ? `description_${language}` : `description`}`, 'description'],
        'short_url'],
      order: [['created_at', 'desc']],
    };

    return modals.knowItems.findById(request.params.id, options).
        then((result) => {
          const knowItem = result.toJSON();
          knowItem.imageUrl = `/knowitem/${knowItem.id}/images`;
          knowItem.hashTags = '';
          knowItem.title = knowItem.title || knowItem.default_title;
          knowItem.description = knowItem.description || knowItem.default_description;
          knowItem.tags = knowItem.tags.map((tagItem) => {
            tagItem.title = tagItem.title || tagItem.default_title;
            return tagItem;
          });
          knowItem.tags.forEach((tagItem) => {
            knowItem.hashTags += `#${tagItem.title} `;
          });
          knowItem.hashTags = knowItem.hashTags.trim();
          knowItem.totalLikes = knowItem.users.length;

          return reply({
            status: true, item: knowItem,
          }).code(200);
        }).
        catch((err) => {
          console.log(
              `Error on ${new Date()} is as follow: \n \n ${err}`);
          return reply({status: false}).code(200);
        });
  }

  static retrieveTags(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      const language = request.language;
      return modals.tags.findAll({
        attributes: [
          'id',
          [
            'title',
            'default_title'],
          [`${language ? `title_${language}` : `title`}`, 'title'],
          [
            'description',
            'default_description'],
          [`${language ? `description_${language}` : `description`}`, 'description'],],
        order: [['created_at', 'desc']],
      }).then((tagItems) => {
        return reply({
          status: true, items: tagItems.map((item) => {
            item = item.toJSON();
            item.title = item.title || item.default_title;
            item.description = item.description || item.default_description;
            return item;
          }),
        }).code(200);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({status: false}).code(200);
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static likeKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return modals.know_user_likes.create({
        user_id: user.id || user.ID,
        know_item_id: request.params.id,
      }).then(() => {
        return reply({
          status: true,
          message: 'You have successfully liked this item.',
        }).code(200);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({status: false}).code(200);
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static disLikeKnowItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return modals.know_user_likes.destroy({
        where: {
          user_id: user.id || user.ID,
          know_item_id: request.params.id,
        },
      }).then(() => {
        return reply({
          status: true,
          message: 'You have successfully Un-liked this item.',
        }).code(200);
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({status: false}).code(200);
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static intializeUserProduct(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Bluebird.try(() => {
        return jobAdaptor.createJobs({
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
      }).then((jobResult) => {
        return Promise.all([
          productAdaptor.createEmptyProduct({
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
      }).then((initResult) => reply({
        status: true,
        product: initResult[0],
        categories: initResult[1],
        renewalTypes: initResult[2],
        message: 'Product and Job is initialized.',
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Unable to initialize product or job.',
          forceUpdate: request.pre.forceUpdate,
        }).code(200);
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static serviceCenterAccessed(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Bluebird.try(() => {
        return userAdaptor.updateUserDetail(
            {service_center_accessed: true}, {
              where: {
                id: user.id || user.ID,
              },
            });
      }).then(() => reply({
        status: true,
        message: 'Status updated successfully.',
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Failed to update status',
          forceUpdate: request.pre.forceUpdate,
        });
      });
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveRepairableProducts(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Bluebird.try(() => {
        return productAdaptor.retrieveProducts({
          main_category_id: [1, 2, 3],
          status_type: [5, 11],
          user_id: user.id || user.ID,
        });
      }).then((productResult) => reply({
        status: true,
        product: productResult,
        message: 'Success.',
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'Unable to fetch product list',
          forceUpdate: request.pre.forceUpdate,
        });
      });

    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default GeneralController;