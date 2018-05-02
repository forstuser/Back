import Promise from 'bluebird';
import CategoryAdaptor from './category';

export default class affiliatedServicesAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
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

}