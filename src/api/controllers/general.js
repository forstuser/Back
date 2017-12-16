/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../Adaptors/notification';
import CategoryAdaptor from '../Adaptors/category';
import BrandAdaptor from '../Adaptors/brands';
import SellerAdaptor from '../Adaptors/sellers';
import Bluebird from 'bluebird';
import shared from '../../helpers/shared';

let contactModel;
let modals;
let categoryAdaptor;
let brandAdaptor;
let sellerAdaptor;

class GeneralController {
  constructor(modal) {
    contactModel = modal.contactUs;
    categoryAdaptor = new CategoryAdaptor(modal);
    brandAdaptor = new BrandAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    modals = modal;
  }

  /**
   * Retrieve Reference Data
   * @param request
   * @param reply
   */
  static retrieveReferenceData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
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
          return categoryAdaptor.retrieveSubCategories(
              {category_id: request.query.categoryId}, true);
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
            categories: request.query.brandId ? undefined : results,
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
    contactModel.create({
      name: request.payload.name,
      phone: request.payload.phone,
      email: request.payload.email,
      message: request.payload.message,
    }).then(() => {
      reply({status: true}).code(201);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      reply({status: false}).code(500);
    });
  }

  static retrieveFAQs(request, reply) {
    modals.faqs.findAll({
      where: {
        status_id: {
          $ne: 3,
        },
      },
    }).then((faq) => {
      reply({status: true, faq}).code(200);
    }).catch((err) => {
      console.log(
          `Error on ${new Date()} for user ${user.id ||
          user.ID} is as follow: \n \n ${err}`);
      reply({status: false}).code(200);
    });
  }
}

export default GeneralController;