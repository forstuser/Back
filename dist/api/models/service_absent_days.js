'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var service_absent_days = sequelize.define('service_absent_days', {
    payment_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    absent_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    created_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_service_absent_days'
  });

  service_absent_days.associate = function (models) {
    service_absent_days.belongsTo(models.service_payment, { foreignKey: 'payment_id' });
    service_absent_days.belongsTo(models.users, { foreignKey: 'updated_by' });
    service_absent_days.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return service_absent_days;
};