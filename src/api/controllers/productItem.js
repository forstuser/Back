import moment from 'moment/moment';
import shared from '../../helpers/shared';
import InsuranceAdaptor from '../Adaptors/insurances';
import AMCAdaptor from '../Adaptors/amcs';
import PUCAdaptor from '../Adaptors/pucs';
import WarrantyAdaptor from '../Adaptors/warranties';
import RepairAdaptor from '../Adaptors/repairs';
import SellerAdaptor from '../Adaptors/sellers';
import CategoryAdaptor from '../Adaptors/category';
import ProductAdaptor from '../Adaptors/product';
import JobAdaptor from '../Adaptors/job';

let repairAdaptor;
let sellerAdaptor;
let insuranceAdaptor;
let amcAdaptor;
let pucAdaptor;
let warrantyAdaptor;
let categoryAdaptor;
let productAdaptor;
let jobAdaptor;

class ProductItemController {
  constructor(modal) {
    repairAdaptor = new RepairAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
    insuranceAdaptor = new InsuranceAdaptor(modal);
    amcAdaptor = new AMCAdaptor(modal);
    pucAdaptor = new PUCAdaptor(modal);
    warrantyAdaptor = new WarrantyAdaptor(modal);
    categoryAdaptor = new CategoryAdaptor(modal);
    productAdaptor = new ProductAdaptor(modal);
    jobAdaptor = new JobAdaptor(modal);
  }

  static updateRepair(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const sellerPromise = !request.payload.seller_id &&
      (request.payload.seller_contact ||
          request.payload.seller_name) ?
          sellerAdaptor.retrieveOrCreateOfflineSellers({
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
              },
              {
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
                updated_by: user.id || user.ID,
                created_by: user.id || user.ID,
                address: request.payload.seller_address,
                status_type: 11,
              }) :
          '';
      return Promise.all([sellerPromise]).then(sellerList => {
        const product_id = parseInt(request.params.id);
        const repairId = parseInt(request.params.repairId);
        const newSellerId = sellerList[0] ? sellerList[0].sid : undefined;
        const document_date = moment.utc(request.payload.document_date,
            moment.ISO_8601).isValid() ?
            moment.utc(request.payload.document_date, moment.ISO_8601).
                startOf('day') :
            moment.utc(request.payload.document_date, 'DD MMM YY').
                startOf('day');

        const values = {
          updated_by: user.id || user.ID,
          status_type: 11,
          product_id,
          seller_id: request.payload.seller_id || newSellerId,
          document_date: document_date ?
              moment.utc(document_date).format('YYYY-MM-DD') :
              moment.utc().format('YYYY-MM-DD'),
          repair_for: request.payload.repair_for,
          repair_cost: request.payload.value,
          warranty_upto: request.payload.warranty_upto,
          user_id: user.id || user.ID,
          job_id: request.payload.job_id,
        };
        const repairPromise = repairId ?
            repairAdaptor.updateRepairs(repairId, values) :
            repairAdaptor.createRepairs(values);
        return repairPromise.
            then((result) => {
              if (result) {
                return reply({
                  status: true,
                  message: 'successfull',
                  repair: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'Repair already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in Repair creation.',
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

  static deleteRepair(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return repairAdaptor.deleteRepair(request.params.repairId, user.id ||
          user.ID).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
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

  static updateInsurance(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const providerPromise =
          request.payload.provider_name ?
              insuranceAdaptor.findCreateInsuranceBrand({
                main_category_id: request.payload.main_category_id,
                category_id: request.payload.category_id,
                type: 1,
                status_type: 11,
                updated_by: user.id || user.ID,
                name: request.payload.provider_name,
              }) :
              undefined;
      let insuranceRenewalType;
      let renewalTypes;
      let insuranceId;
      let providerId;
      let product_id;
      return Promise.all([
        providerPromise, categoryAdaptor.retrieveRenewalTypes({
          id: {
            $gte: 7,
          },
        })]).then(promiseResult => {
        const provider = promiseResult[0];
        renewalTypes = promiseResult[1];
        product_id = parseInt(request.params.id);
        insuranceId = parseInt(request.params.insuranceId);
        providerId = provider ? provider.id : undefined;
        insuranceRenewalType = renewalTypes.find(
            item => item.type === 8);
        if (request.payload.renewal_type) {
          insuranceRenewalType = renewalTypes.find(
              item => item.type === request.payload.renewal_type);
        }
        return productAdaptor.retrieveProductById(product_id,
            {status_type: [5, 8, 11]});
      }).then((productResult) => {
        const currentItem = productResult ?
            productResult.insuranceDetails.find(
                item => item.id === parseInt(insuranceId)) :
            undefined;
        const insuranceEffectiveDate = productResult ?
            productResult.insuranceDetails &&
            productResult.insuranceDetails.length > 0 ?
                currentItem ?
                    moment.utc(currentItem.effectiveDate, moment.ISO_8601) :
                    moment.utc(productResult.insuranceDetails[0].expiryDate,
                        moment.ISO_8601).add(1, 'days') :
                productResult.purchaseDate :
            undefined;
        let effective_date = insuranceEffectiveDate ?
            request.payload.effective_date ||
            insuranceEffectiveDate :
            moment.utc();
        effective_date = moment.utc(effective_date, moment.ISO_8601).
            isValid() ?
            moment.utc(effective_date,
                moment.ISO_8601).startOf('day') :
            moment.utc(effective_date, 'DD MMM YY').
                startOf('day');
        const expiry_date = insuranceRenewalType ? moment.utc(effective_date,
            moment.ISO_8601).
            add(insuranceRenewalType.effective_months, 'months').
            subtract(1, 'day').
            endOf('days') : undefined;
        const insuranceBody = {
          renewal_type: request.payload.renewal_type || 8,
          updated_by: user.id || user.ID,
          job_id: request.payload.job_id,
          status_type: 11,
          product_id,
          expiry_date: effective_date && expiry_date ?
              moment.utc(expiry_date).format('YYYY-MM-DD') :
              undefined,
          effective_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          document_number: request.payload.policy_no,
          provider_id: providerId ||
          request.payload.provider_id,
          amount_insured: request.payload.amount_insured,
          renewal_cost: request.payload.value,
          user_id: user.id || user.ID,
        };
        return insuranceId ?
            insuranceAdaptor.updateInsurances(
                insuranceId, insuranceBody) :
            insuranceAdaptor.createInsurances(insuranceBody);
      }).then((result) => {
        if (result) {
          return reply({
            status: true,
            message: 'successful',
            insurance: result,
            forceUpdate: request.pre.forceUpdate,
          });
        } else {
          return reply({
            status: false,
            message: 'Insurance already exist.',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in Insurance creation.',
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

  static deleteInsurance(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return insuranceAdaptor.deleteInsurance(
          request.params.insuranceId, user.id ||
          user.ID).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
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

  static updateAmc(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const sellerPromise = !request.payload.seller_id &&
      (request.payload.seller_contact ||
          request.payload.seller_name) ?
          sellerAdaptor.retrieveOrCreateOfflineSellers({
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
              },
              {
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
                updated_by: user.id || user.ID,
                created_by: user.id || user.ID,
                address: request.payload.seller_address,
                status_type: 11,
              }) :
          '';
      const product_id = parseInt(request.params.id);
      const amcId = parseInt(request.params.amcId);
      let sellerList;
      return Promise.all([sellerPromise]).then(sellerResult => {
        sellerList = sellerResult[0];

        return productAdaptor.retrieveProductById(product_id,
            {status_type: [5, 8, 11]});
      }).then((productResult) => {
        const currentItem = productResult ?
            productResult.amcDetails.find(
                (item) => item.id === parseInt(amcId)) :
            undefined;
        const amcEffectiveDate = productResult ?
            currentItem ?
                moment.utc(currentItem.effectiveDate, moment.ISO_8601) :
                productResult.amcDetails &&
                productResult.amcDetails.length > 0 ?
                    moment.utc(productResult.amcDetails[0].expiryDate,
                        moment.ISO_8601).add(1, 'days') :
                    productResult.purchaseDate :
            undefined;
        let effective_date = amcEffectiveDate ?
            request.payload.effective_date ||
            amcEffectiveDate :
            moment.utc();
        effective_date = moment.utc(effective_date, moment.ISO_8601).
            isValid() ?
            moment.utc(effective_date,
                moment.ISO_8601).startOf('day') :
            moment.utc(effective_date, 'DD MMM YY').
                startOf('day');
        const expiry_date = moment.utc(effective_date,
            moment.ISO_8601).
            add(12, 'months').
            subtract(1, 'day').
            endOf('days').
            format('YYYY-MM-DD');

        const values = {
          renewal_type: 8,
          updated_by: user.id || user.ID,
          status_type: 11,
          product_id: product_id,
          job_id: request.payload.job_id,
          renewal_cost: request.payload.value,
          seller_id: sellerList ?
              sellerList.sid :
              request.payload.seller_id,
          expiry_date: effective_date ?
              moment.utc(expiry_date).format('YYYY-MM-DD') :
              undefined,
          effective_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          user_id: user.id || user.ID,
        };
        return amcId ?
            amcAdaptor.updateAMCs(amcId, values) :
            amcAdaptor.createAMCs(values);
      }).then((result) => {
        if (result) {
          return reply({
            status: true,
            message: 'successful',
            amc: result,
            forceUpdate: request.pre.forceUpdate,
          });
        } else {
          return reply({
            status: false,
            message: 'AMC already exist.',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in AMC creation.',
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

  static deleteAMC(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return amcAdaptor.deleteAMC(request.params.amcId, user.id ||
          user.ID).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
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

  static updatePUC(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const sellerPromise = !request.payload.seller_id &&
      (request.payload.seller_contact ||
          request.payload.seller_name) ?
          sellerAdaptor.retrieveOrCreateOfflineSellers({
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
              },
              {
                seller_name: request.payload.seller_name,
                contact_no: request.payload.seller_contact,
                updated_by: user.id || user.ID,
                created_by: user.id || user.ID,
                address: request.payload.seller_address,
                status_type: 11,
              }) :
          '';
      let sellerList;
      const product_id = parseInt(request.params.id);
      const pucId = parseInt(request.params.pucId);
      return Promise.all([sellerPromise]).then(sellerResult => {
        sellerList = sellerResult[0];
        return productAdaptor.retrieveProductById(product_id,
            {status_type: [5, 8, 11]});
      }).then((productResult) => {
        const currentItem = productResult ?
            productResult.pucDetails.find(
                (pucItem) => pucItem.id === parseInt(pucId)) :
            undefined;
        const pucEffectiveDate = productResult ?
            currentItem ?
                moment.utc(currentItem.effectiveDate, moment.ISO_8601) :
                productResult.pucDetails &&
                productResult.pucDetails.length > 0 ?
                    moment.utc(productResult.pucDetails[0].expiryDate,
                        moment.ISO_8601).add(1, 'days') :
                    productResult.purchaseDate :
            undefined;
        let effective_date = pucEffectiveDate ?
            request.payload.effective_date ||
            pucEffectiveDate :
            moment.utc();
        effective_date = moment.utc(effective_date, moment.ISO_8601).
            isValid() ?
            moment.utc(effective_date,
                moment.ISO_8601).startOf('day') :
            moment.utc(effective_date, 'DD MMM YY').
                startOf('day');
        const expiry_date = moment.utc(effective_date,
            moment.ISO_8601).
            add(request.payload.expiry_period || 6, 'months').
            subtract(1, 'day').
            endOf('days').format('YYYY-MM-DD');
        const values = {
          renewal_type: request.payload.expiry_period || 6,
          updated_by: user.id || user.ID,
          status_type: 11,
          renewal_cost: request.payload.value,
          product_id,
          job_id: request.payload.job_id,
          seller_id: sellerList ?
              sellerList.sid :
              request.payload.seller_id,
          expiry_date: effective_date ?
              moment.utc(expiry_date).format('YYYY-MM-DD') :
              undefined,
          effective_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          user_id: user.id || user.ID,
        };
        const pucPromise = pucId ?
            pucAdaptor.updatePUCs(pucId, values) :
            pucAdaptor.createPUCs(values);
        return pucPromise.
            then((result) => {
              if (result) {
                return reply({
                  status: true,
                  message: 'successful',
                  puc: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'PUC already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in PUC creation.',
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

  static deletePUC(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return pucAdaptor.deletePUCs(request.params.pucId, user.id ||
          user.ID).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
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

  static updateWarranty(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const providerPromise =
          request.payload.provider_name ?
              insuranceAdaptor.findCreateInsuranceBrand({
                main_category_id: request.payload.main_category_id,
                category_id: request.payload.category_id,
                type: 1,
                status_type: 11,
                updated_by: user.id || user.ID,
                name: request.payload.provider_name,
              }) :
              undefined;
      const product_id = parseInt(request.params.id);
      const warrantyId = parseInt(request.params.warrantyId);
      let warrantyRenewalType;
      let expiry_date;
      let provider;
      return Promise.all([
        providerPromise, categoryAdaptor.retrieveRenewalTypes({
          id: {
            $gte: 7,
          },
        })]).then(promiseResult => {
        provider = promiseResult[0];
        warrantyRenewalType = promiseResult[1].find(
            item => item.type === request.payload.renewal_type);
        return productAdaptor.retrieveProductById(product_id,
            {status_type: [5, 8, 11]});
      }).then((productResult) => {
        const warrantyDetails = productResult ?
            productResult.warrantyDetails.filter(
                (warrantyItem) => (request.payload.warranty_type === 3 ?
                    warrantyItem.warranty_type === 3 :
                    warrantyItem.warranty_type === 1 ||
                    warrantyItem.warranty_type === 2)) : [];

        const currentItem = warrantyDetails.find(
            (warrantyDetail) => {
              return warrantyDetail.id === parseInt(warrantyId);
            });

        console.log(`\n\n\n\n\n\n${JSON.stringify({
          warrantyId,
          currentItem,
          warrantyDetail: warrantyDetails,
        })}`);
        const warrantyEffectiveDate = currentItem ?
            moment.utc(currentItem.effectiveDate, moment.ISO_8601) :
            warrantyDetails.length > 0 ?
                moment.utc(warrantyDetails[0].expiryDate, moment.ISO_8601).
                    add(1, 'days') :
                productResult.purchaseDate;
        let effective_date = warrantyEffectiveDate ?
            request.payload.effective_date ||
            warrantyEffectiveDate :
            moment.utc();
        effective_date = moment.utc(effective_date, moment.ISO_8601).
            isValid() ?
            moment.utc(effective_date,
                moment.ISO_8601).startOf('day') :
            moment.utc(effective_date, 'DD MMM YY').
                startOf('day');
        expiry_date = warrantyRenewalType ?
            moment.utc(effective_date, moment.ISO_8601).
            add(warrantyRenewalType.effective_months, 'months').
            subtract(1, 'day').
                endOf('days') :
            undefined;

        console.log(
            `\n\n\n\n\n\n\n\n\n\n\n\n\n\n ${effective_date}, ${expiry_date}`);
        const values = {
          renewal_type: request.payload.renewal_type,
          updated_by: user.id || user.ID,
          status_type: 11,
          job_id: request.payload.job_id,
          product_id: product_id,
          expiry_date: effective_date && expiry_date ?
              moment.utc(expiry_date).format('YYYY-MM-DD') :
              undefined,
          effective_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : undefined,
          document_date: effective_date ? moment.utc(effective_date).
              format('YYYY-MM-DD') : moment.utc().format('YYYY-MM-DD'),
          provider_id: provider ? provider.id : request.payload.provider_id,
          warranty_type: request.payload.warranty_type,
          user_id: user.id || user.ID,
        };
        const warrantyItemPromise = warrantyId ?
            warrantyAdaptor.updateWarranties(
                warrantyId, values) : warrantyAdaptor.createWarranties(values);
        return warrantyItemPromise.
            then((result) => {
              if (result) {
                return reply({
                  status: true,
                  message: 'successful',
                  warranty: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'Warranty already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in warranty creation.',
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

  static deleteWarranty(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return warrantyAdaptor.deleteWarranties(
          request.params.warrantyId, user.id ||
          user.ID).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
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

export default ProductItemController;