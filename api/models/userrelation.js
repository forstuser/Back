/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_users_temp', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'user_id'
  },
  OTP: {
    type: Sequelize.STRING,
    field: 'tmp_password'
  },
  PhoneNo: {
    type: Sequelize.STRING,
    unique: true,
    field: 'mobile_no'
  },
  secret: {
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false
});
