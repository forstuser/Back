import Promise from 'bluebird';
import CategoryAdaptor from './category';
import ProductAdapter from './product';

const rp = require('request-promise');
const MrRightEndPoint = 'https://www.mrright.in/api/partner/V_1/';
const MrRightApiKey = 'f168fb76-378a-456c-8c68-6441cf60b214';

export default class affiliatedServicesAdaptor {

  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
    this.productAdapter = new ProductAdapter(modals);
    this.rp = rp;
  }

  validateCoupon(parameters) {
    console.log(parameters);
    let {couponCode, service_id} = parameters;
    const options = {
      url: MrRightEndPoint + 'coupon/validate',
      method: 'POST',
      headers: {
        ApiKey: MrRightApiKey,
      },
      json: {
        couponCode: couponCode,
        serviceId: service_id,
      },
    };
    return this.rp(options).then(data => {
      console.log(data);
    }).catch((err) => console.log(err));
  }

  createBooking(serviceToBook) {
    // console.log(serviceToBook);
    const options = {
      url: MrRightEndPoint + 'case/book',
      method: 'POST',
      headers: {
        ApiKey: MrRightApiKey,
      },
      json: serviceToBook,
    };
    return this.rp(options);
  }

  addOrder(orderDetails) {
    console.log(orderDetails);
    return this.modals.table_orders.bulkCreate(orderDetails);
  }

  rescheduleBooking(data) {
    const options = {
      url: MrRightEndPoint + 'case/reschedule',
      method: 'POST',
      headers: {
        ApiKey: MrRightApiKey,
      }, json: data,
    };
    console.log('in reschedule booking with data', data);
    return Promise.try(() => this.rp(options)).then((result) => {
      console.log('response of reschedule is ', result);
      if (result.Success) {

        // on success, do a get case details call and
        // shove that data into the case details section of the orders table
        // also set the status type to be 3

        const getCaseDetailsOptions = {
          url: MrRightEndPoint + 'case/details/' + data.caseId,
          method: 'GET',
          headers: {
            ApiKey: MrRightApiKey,
          },
        };

        return Promise.try(() => this.rp(getCaseDetailsOptions)).
            then((caseDetails) => {

              console.log(caseDetails);
              const updatedData = {
                status_type: 3,
                case_details: JSON.parse(caseDetails).Case,
              };

              const options = {
                where: {
                  case_id: data.caseId,
                },
              };

              return this.rescheduleOrder(updatedData, options);
            });
      }
      // failed to reschedule order
      return 0;
    }).then((result) => {
      return {status: result && result !== 0};
    }).catch((err) => {
      console.log('the error of reschedule is ', err);
      return {
        status: false,
        error: err.error,
      };
    });
  }

  cancelBooking(data) {
    const options = {
      url: MrRightEndPoint + 'case/cancel',
      method: 'POST',
      headers: {
        ApiKey: MrRightApiKey,
      }, json: data,
    };
    return Promise.try(() => this.rp(options)).then((result) => {
      if (result.Success) {
        return this.cancelOrder({
          where: {
            case_id: data.caseId,
          },
        });
      }
      // failed to cancel order
      // what do i do here
      return 0;

    }).then((result) => {
      console.log(result);
      return !!result && result !== 0;
    });
  }

  getCities(options) {
    return Promise.try(() => this.modals.table_cities.findAll(options)).
        then(result => {
          console.log(result);
          return result.map((item) => item.toJSON());
        });
  }

  getServices(options) {
    return this.getAllProviderCities({
      where: {id: options.city_id},
    }).
        then((cityResults) => this.getAllProviderCategories({
          where: {provider_city_id: cityResults.map((item) => item.id)},
        })).
        then((providerCategories) => this.getAllProviderServices({
          where: {
            provider_category_id: providerCategories.map(item => item.id),
          },
        })).
        then((result) => this.getAllAffiliatedServices({
          where: {
            id: result.map((item) => item.service_id),
          },
        })).
        then((result) => this.getAllAffiliatedServices({
          where: {
            id: result.map((item) => item.ref_id),
            service_level: 1,
          },
        }));
  }

  getAllCategory(options) {
    return this.getAllProviderCities({
      where: {id: options.city_id},
    }).
        then((cityResults) => this.getAllProviderCategories({
          where: {provider_city_id: cityResults.map((item) => item.id)},
        })).
        then((providerCategories) => this.categoryAdaptor.retrieveCategories(
            {category_id: providerCategories.map((item) => item.category_id)}));
  }

  getAllProviders(options) {
    return this.getAllProviderCities({
      where: {id: options.city_id},
    }).then((cityResults) => this.getProviderList({
      where: {
        id: cityResults.map(item => item.provider_id),
      },
    }));
  }

  getChildServices(options) {
    return Promise.try(() => Promise.all([
      this.getAllChildServices({
        where: {ref_id: options.ref_id},
      }), this.getAllProviderCategories({
        where: {
          category_id: options.category_ids,
        },
        attributes: ['id'],
      })])).
        spread((childServiceList, categoryIdList) => {
          const providerServiceOptions = {
            service_id: childServiceList.map((item) => item.id),
          };
          if (categoryIdList.length > 0) {
            providerServiceOptions.provider_category_id = categoryIdList.map(
                (item) => item.id);
          }

          return Promise.all([
            childServiceList, this.getAllProviderServices({
              where: providerServiceOptions,
              attributes: [
                'id',
                'provider_category_id',
                'service_id',
                'price_options',
                'affiliated_service_id'],
            })]);
        }).
        spread((serviceList, providerServiceList) => serviceList.map(
            (serviceItem) => {
              const providerServiceItem = providerServiceList.find(
                  (psItem) => psItem.service_id === serviceItem.id);
              if (providerServiceItem) {
                serviceItem.price_options = providerServiceItem.price_options;
                serviceItem.affiliated_service_id = providerServiceItem.affiliated_service_id;
                serviceItem.provider_category_id = providerServiceItem.provider_category_id;
                serviceItem.service_mapping_id = providerServiceItem.id;
                return serviceItem;
              }

              return null;
            }).filter(serviceItem => !!serviceItem)).catch(console.log);
  }

  getOrders(options) {
    return Promise.try(() => this.modals.table_orders.findAll(options)).
        then((orders) => {
          console.log('the orders are ', orders);
          return orders.map(item => item.toJSON());
        });
  }

// below are all the helper functions which are used to avoid redundancy of code
  getAllProviderCities(options) {
    return Promise.try(
        () => this.modals.table_provider_cities.findAll(options)).
        then((result) => result.map((item) => item.toJSON()));
  }

  getAllProviderCategories(options) {
    return Promise.try(
        () => this.modals.table_provider_categories.findAll(options)).
        then((result) => result.map((item) => item.toJSON()));
  }

  getAllProviderServices(options) {
    return Promise.try(
        () => this.modals.table_provider_services_mapping.findAll(options)).
        then((result) => {
          return result.map((item) => item.toJSON());
        });
  }

  getAllAffiliatedServices(options) {
    return Promise.try(
        () => this.modals.table_affiliated_services.findAll(options)).
        then((result) => {
          return result.map(item => item.toJSON());
        });
  }

  getProviderList(options) {
    return Promise.try(
        () => this.modals.table_service_providers.findAll(options).
            then((providers) => {
              return providers.map(item => item.toJSON());
            }));
  }

  getAllChildServices(options) {
    return Promise.try(
        () => this.modals.table_affiliated_services.findAll(options).
            then((childServices) => {
              return childServices.map(item => item.toJSON());
            }),
    );
  }

  cancelOrder(options) {
    return Promise.try(() => this.modals.table_orders.update({
      status_type: 2,
    }, options));
  }

  rescheduleOrder(updatedData, options) {
    return Promise.try(
        () => this.modals.table_orders.update(updatedData, options));
  }

  getProductServices(options) {

    return Promise.try(() => this.getChildServices(options)).
        then(result => this.getAllProviderServices({
          where: {
            service_id: result.map(item => item.id),
          },
          attributes: ['provider_category_id'],
        })).then(providerServices => this.getAllProviderCategories({
          where: {
            id: providerServices.map(item => item.provider_category_id),
          },
          attributes: ['category_id'],
        })).then(categories => this.productAdapter.retrieveProducts({
          category_id: categories.map(item => item.category_id),
          user_id: options.user_id,
        }));
  }

}