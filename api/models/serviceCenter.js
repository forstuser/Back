/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_authorized_service_center', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'center_id'
  },
  BrandID: {
    type: Sequelize.INTEGER,
    field: 'brand_id'
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'center_name'
  },
  HouseNo: {
    type: Sequelize.STRING,
    field: 'address_house_no'
  },
  Block: {
    type: Sequelize.STRING,
    field: 'address_block'
  },
  Street: {
    type: Sequelize.STRING,
    field: 'address_street'
  },
  Sector: {
    type: Sequelize.STRING,
    field: 'address_sector'
  },
  City: {
    type: Sequelize.STRING,
    field: 'address_city'
  },
  State: {
    type: Sequelize.STRING,
    field: 'address_state'
  },
  PinCode: {
    type: Sequelize.STRING,
    field: 'address_pin_code'
  },
  NearBy: {
    type: Sequelize.STRING,
    field: 'address_nearby'
  },
  Latitude: {
    type: Sequelize.STRING,
    field: 'Latitude'
  },
  Longitude: {
    type: Sequelize.STRING,
    field: 'longitude'
  },
  Timings: {
    type: Sequelize.STRING,
    field: 'timings'
  },
  OpenDays: {
    type: Sequelize.STRING,
    field: 'open_days'
  },
  updated_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_by_user_id: {
    type: Sequelize.INTEGER
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
