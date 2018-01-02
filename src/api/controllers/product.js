/*jshint esversion: 6 */
'use strict';

import ProductAdaptor from '../Adaptors/product';
import shared from '../../helpers/shared';
import moment from 'moment/moment';

let productAdaptor;

class ProductController {
  constructor(modal) {
    productAdaptor = new ProductAdaptor(modal);
  }

  static createProduct(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      const productBody = {
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
        status_type: 11,
        document_number: request.payload.document_number,
        document_date: request.payload.document_date ?
            moment(request.payload.document_date,
            moment.ISO_8601).
            isValid() ?
            moment(request.payload.document_date,
                moment.ISO_8601).startOf('day').format('YYYY-MM-DD') :
            moment(request.payload.document_date, 'DD MMM YY').
                startOf('day').
                format('YYYY-MM-DD') :
            undefined,
        brand_name: request.payload.brand_name,
        copies: [],
      };

      const otherItems = {
        warranty: request.payload.warranty,
        insurance: request.payload.insurance,
        puc: request.payload.puc,
        amc: request.payload.amc,
        repair: request.payload.repair,
      };

      const metaDataBody = request.payload.metadata ?
          request.payload.metadata.map((item) => {
            item.updated_by = user.id || user.ID;

            return item;
          }) :
          [];
      return productAdaptor.createProduct(productBody, metaDataBody,
          otherItems).
          then((result) => {
            if (result) {
              return reply({
                status: true,
                message: 'successfull',
                product: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'Product already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          }).
          catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            return reply({
              status: false,
              message: 'An error occurred in product creation.',
              forceUpdate: request.pre.forceUpdate,
              err,
            });
          });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateProduct(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        user_id: user.id || user.ID,
        main_category_id: request.payload.main_category_id,
        category_id: request.payload.category_id,
        brand_id: request.payload.brand_id,
        colour_id: request.payload.colour_id,
        purchase_cost: request.payload.purchase_cost,
        taxes: request.payload.taxes,
        updated_by: user.id || user.ID,
        seller_name: request.payload.seller_name,
        seller_contact: request.payload.seller_contact,
        seller_id: request.payload.seller_id,
        status_type: 11,
        document_number: request.payload.document_number,
        document_date: request.payload.document_date ?
            moment(request.payload.document_date,
                moment.ISO_8601).
                isValid() ?
                moment(request.payload.document_date,
                    moment.ISO_8601).startOf('day').format('YYYY-MM-DD') :
                moment(request.payload.document_date, 'DD MMM YY').
                    startOf('day').
                    format('YYYY-MM-DD') :
            undefined,
        brand_name: request.payload.brand_name,
        copies: [],
      };

      const otherItems = {
        warranty: request.payload.warranty,
        insurance: request.payload.insurance,
        puc: request.payload.puc,
        amc: request.payload.amc,
        repair: request.payload.repair,
      };

      const metaDataBody = request.payload.metadata ?
          request.payload.metadata.map((item) => {
            item.updated_by = user.id || user.ID;

            return item;
          }) :
          [];
      return productAdaptor.updateProductDetails(productBody, metaDataBody,
          otherItems, request.params.id).
          then((result) => {
            if (result) {
              return reply({
                status: true,
                message: 'successfull',
                product: result,
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              return reply({
                status: false,
                message: 'Product already exist.',
                forceUpdate: request.pre.forceUpdate,
              });
            }
          }).
          catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            return reply({
              status: false,
              message: 'An error occurred in product creation.',
              forceUpdate: request.pre.forceUpdate,
              err,
            });
          });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateUserReview(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      const id = request.params.id;
      if (request.params.reviewfor === 'brands') {
        reply(productAdaptor.updateBrandReview(user, id, request));
      } else if (request.params.reviewfor === 'sellers') {
        reply(productAdaptor.updateSellerReview(user, id,
            request.query.isonlineseller, request));
      } else {
        reply(productAdaptor.updateProductReview(user, id, request));
      }
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveProductDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      reply(productAdaptor.prepareProductDetail(user, request)).code(200);
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveCenterProducts(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!user) {
      reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (user && !request.pre.forceUpdate) {
      const brandId = (request.query.brandids || '[]').split('[')[1].split(
          ']')[0].split(',').filter(Boolean);
      const categoryId = (request.query.categoryids || '[]').split(
          '[')[1].split(']')[0].split(',').filter(Boolean);
      const options = {
        main_category_id: [2, 3],
        status_type: [5, 11],
        user_id: user.id || user.ID,
      };

      if (brandId.length > 0) {
        options.brand_id = brandId;
      }

      if (categoryId.length > 0) {
        options.category_id = categoryId;
      }

      return productAdaptor.retrieveProducts(options).then((result) => {
        return reply({
          status: true,
          productList: result /* :productList.slice((pageNo * 10) - 10, 10) */,
          forceUpdate: request.pre.forceUpdate,
          /* ,
              nextPageUrl: productList.length > listIndex + 10 ?
               `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
               &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
               &offlinesellerids=${offlineSellerIds}&onlinesellerids=
               ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'Unable to fetch product list',
          forceUpdate: request.pre.forceUpdate,
        });
      });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default ProductController;
