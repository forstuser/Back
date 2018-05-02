
import Promise from 'bluebird';
import CategoryAdaptor from 'category';

export default class affiliatedServicesAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
  }

  getCities(options) {
    return Promise.try(() => this.modals.table_cities.findAll(options)).
        then(result => {
            console.log(result);
            result.map((item) => item.toJSON());
        })
  }

  getServices(options) {
    return Promise.try(() => this.modals.table_provider_cities.findAll({
      where: {city_id: options.city_id},
    })).then(result => {
        console.log("providers for the city id are",options.city_id, result);
    });
  }

  getAllCategory(options) {
    return this.getAllProviderCities({
      where: {city_id: options.city_id},
    }).then((cityResults) => this.getAllProviderCategories({
      where: {provider_city_id: cityResults.map((item) => item.id)},
    })).then((providerCategories) => this.categoryAdaptor.retrieveCategories({category_id: providerCategories.map((item) => item.category_id)}));
  }

  getAllProviderCities(options) {
    return Promise.try(() => this.modals.table_cities.findAll(options)).
        then((result) => result.map((item) => item.toJSON()));
  }

  getAllProviderCategories(options) {
    return Promise.try(
        () => this.modals.table_provider_categories.findAll(options)).
        then((result) => result.map((item) => item.toJSON()));
  }

}