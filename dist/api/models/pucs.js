'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var pucs = sequelize.define('pucs', {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    job_id: {
      type: DataTypes.INTEGER,
    },
    document_number: {
      type: DataTypes.STRING,
    },
    renewal_type: {
      type: DataTypes.INTEGER,
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
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'consumer_pucs',
  });

  pucs.associate = function(models) {
    pucs.belongsTo(models.products, {foreignKey: 'product_id'});
    pucs.belongsTo(models.users, {foreignKey: 'user_id', as: 'consumer'});
    pucs.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    pucs.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    pucs.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    pucs.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'sellers'});
    pucs.belongsTo(models.renewalTypes,
        {foreignKey: 'renewal_type', targetKey: 'type'});
  };

  return pucs;
};