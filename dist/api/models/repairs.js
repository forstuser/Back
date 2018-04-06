'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var repairs = sequelize.define('repairs', {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    online_seller_id: {
      type: DataTypes.INTEGER
    },
    document_number: {
      type: DataTypes.STRING
    },
    repair_for: {
      type: DataTypes.STRING
    },
    warranty_upto: {
      type: DataTypes.STRING
    },
    repair_cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    repair_taxes: {
      type: DataTypes.FLOAT,
      defaultValue: 0
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
    },
    document_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSONB)
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'consumer_repairs'
  });

  repairs.associate = function (models) {
    repairs.belongsTo(models.products, { foreignKey: 'product_id' });
    repairs.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    repairs.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });

    repairs.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    repairs.belongsTo(models.jobs, { as: 'jobs', foreignKey: 'job_id' });
    repairs.belongsTo(models.onlineSellers, { foreignKey: 'online_seller_id', as: 'onlineSellers' });
    repairs.belongsTo(models.offlineSellers, { foreignKey: 'seller_id', as: 'sellers' });
  };

  return repairs;
};