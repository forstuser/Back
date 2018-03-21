'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var service_payment = sequelize.define('service_payment', {
    ref_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    total_days: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    end_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    paid_on: {
      type: DataTypes.DATEONLY
    },
    total_amount: {
      type: DataTypes.FLOAT
    },
    total_units: {
      type: DataTypes.FLOAT
    },
    amount_paid: {
      type: DataTypes.FLOAT
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
    tableName: 'table_service_payment'
  });

  service_payment.associate = function (models) {
    service_payment.belongsTo(models.user_calendar_item, { foreignKey: 'ref_id', as: 'calendar_item' });
    service_payment.belongsTo(models.users, { foreignKey: 'updated_by' });
    service_payment.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    service_payment.hasMany(models.service_absent_days, {
      foreignKey: 'payment_id',
      as: 'absent_day_detail',
      onDelete: 'cascade'
    });
  };
  return service_payment;
};