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
                {category_id: request.query.categoryId}, true),
            categoryAdaptor.retrieveRenewalTypes({
              status_type: 1,
            })]);
        } else if (request.query.mainCategoryId) {
          return categoryAdaptor.retrieveCategories(
              {category_id: request.query.mainCategoryId}, false);
        }
      }

      return categoryAdaptor.retrieveCategories(
          {category_level: 1, category_id: [2, 3]}, true);
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
    NotificationAdaptor.sendLinkOnMessage(request.payload.phone);
    return contactModel.create({
      name: request.payload.name,
      phone: request.payload.phone,
      email: request.payload.email,
      message: request.payload.message,
    }).then(() => {
      return reply({status: true}).code(201);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      return reply({status: false}).code(500);
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