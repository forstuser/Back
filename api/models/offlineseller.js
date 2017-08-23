/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('offlineSeller', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'offline_seller_id'
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'offline_seller_name'
  },
  OwnerName: {
    type: Sequelize.STRING,
    field: 'offline_seller_owner_name'
  },
  URL: {
    type: Sequelize.INTEGER,
    field: 'seller_url'
  },
  GstinNo: {
    type: Sequelize.STRING,
    field: 'offline_seller_gstin_no'
  },
  PanNo: {
    type: Sequelize.STRING,
    field: 'offline_seller_pan_number'
  },
  RegNo: {
    type: Sequelize.STRING,
    field: 'offline_seller_registration_no'
  },
  ServiceProvider: {
    type: Sequelize.INTEGER,
    field: 'is_service_provider'
  },
  OnBoarded: {
    type: Sequelize.INTEGER,
    field: 'is_onboarded'
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
    field: 'latitude'
  },
  Longitude: {
    type: Sequelize.STRING,
    field: 'longitude'
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
  timestamps: false,
  tableName: 'table_offline_seller'
});
