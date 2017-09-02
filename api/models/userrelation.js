/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_users_temp', {
  user_temp_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
    type: Sequelize.STRING(2000)
  }
},
{
  freezeTableName: true,
  defaultPrimaryKey: false
});
