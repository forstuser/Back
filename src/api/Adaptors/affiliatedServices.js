import CategoryAdaptor from 'category';

export default class AffiliatedServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.categoryAdaptor = new CategoryAdaptor(modals);
  }

  getCities(options) {
    return this.modals.table_cities.findAll(options).
        then(result => result.map((item) => item.toJSON()));
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

