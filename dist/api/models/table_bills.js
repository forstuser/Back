'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var bills = sequelize.define('bills', {
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    consumer_name: {
      type: DataTypes.STRING
    },
    consumer_email: {
      type: DataTypes.STRING
    },
    consumer_phone_no: {
      type: DataTypes.STRING
    },
    document_number: {
      type: DataTypes.STRING
    },
    document_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'consumer_bills'
  });

  bills.associate = function (models) {
    bills.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    bills.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });

    bills.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    bills.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    bills.belongsTo(models.onlineSellers, { foreignKey: 'seller_id', as: 'sellers' });
  };
  return bills;
};