'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var warranties = sequelize.define('warranties', {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    job_id: {
      type: DataTypes.INTEGER,
    },
    online_seller_id: {
      type: DataTypes.INTEGER,
    },
    document_number: {
      type: DataTypes.STRING,
    },
    renewal_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    renewal_cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    renewal_taxes: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    updated_by: {
      type: DataTypes.INTEGER,
    },
    seller_id: {
      type: DataTypes.INTEGER,
    },
    status_type: {
      type: DataTypes.INTEGER,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    effective_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    expiry_date: {
      type: DataTypes.DATE,
    },
    document_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
    },
    warranty_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'consumer_warranties',
  });

  warranties.associate = function(models) {
    warranties.belongsTo(models.products, {foreignKey: 'product_id'});
    warranties.belongsTo(models.users, {foreignKey: 'user_id', as: 'consumer'});
    warranties.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    warranties.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    warranties.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    warranties.belongsTo(models.onlineSellers,
        {foreignKey: 'online_seller_id', as: 'onlineSellers'});
    warranties.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'sellers'});
    warranties.belongsTo(models.renewalTypes,
        {foreignKey: 'renewal_type', targetKey: 'type'});
  };

  return warranties;
};