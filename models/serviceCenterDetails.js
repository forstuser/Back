/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('authorizeServiceCenterDetail', {
  center_detail_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  center_id: {
    type: Sequelize.INTEGER
  },
  contactdetail_type_id: {
    type: Sequelize.INTEGER
  },
  display_name: {
    type: Sequelize.STRING
  },
  details: {
    type: Sequelize.STRING
  },
  status_id: {
    type: Sequelize.INTEGER
  },
  category_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_authorized_service_center_details'
});
