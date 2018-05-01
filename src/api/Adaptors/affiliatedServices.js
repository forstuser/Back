export default class WhatToServiceAdaptor {
  constructor(modals) {
    this.modals = modals;

  }

  getCities(options) {
    return this.modals.table_cities.findAll(options).
        then(result => result.map((item) => item.toJSON()));
  }

}