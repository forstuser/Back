/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_authorized_service_center_details', {
  DetailID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'center_detail_id'
  },
  CenterID: {
    type: Sequelize.INTEGER,
    notEmpty: true,
    field: 'center_id'
  },
  DetailTypeID: {
    type: Sequelize.INTEGER,
    field: 'contactdetail_type_id'
  },
  DisplayName: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'display_name'
  },
  Detail: {
    type: Sequelize.STRING,
    field: 'details'
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
