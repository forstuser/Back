import Promise from 'bluebird';

export default class affiliatedServicesAdaptor {
  constructor(modals) {
    this.modals = modals;

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

}