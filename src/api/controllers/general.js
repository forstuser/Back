/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../Adaptors/notification';
import CategoryAdaptor from '../Adaptors/category';
import BrandAdaptor from '../Adaptors/brands';
import SellerAdaptor from '../Adaptors/sellers';

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
    return Promise.all([
      categoryAdaptor.retrieveCategories({category_level: 1}),
      brandAdaptor.retrieveBrands({status_type: 1}),
      brandAdaptor.retrieveBrandDetails({status_type: 1}),
      sellerAdaptor.retrieveOfflineSellers({status_type: 1}),
      sellerAdaptor.retrieveOnlineSellers({status_type: 1})]).
        then((results) => {
          const categories = results[0];
          const brands = results[1].map((item) => {
            item.details = results[2].filter(
                (detailItem) => detailItem.brandId === item.id);
            return item;
          });

          const offlineSellers = results[3];
          const onlineSellers = results[4];

          return reply({
            status: true,
            categories,
            brands,
            offlineSellers,
            onlineSellers,
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
          console.log({
            api_err: err,
          });

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
      console.log({API_Logs: err});
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
      console.log({API_Logs: err});
      reply({status: false}).code(200);
    });
  }
}

export default GeneralController;