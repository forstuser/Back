'use strict';

export default (sequelize, DataTypes) => {
  const insurances = sequelize.define('insurances', {
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
        },
        renewal_cost: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        renewal_taxes: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        amount_insured: {
          type: DataTypes.FLOAT,
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
        provider_id: {
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
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        expiry_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        document_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        copies: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'consumer_insurances',
      });

  insurances.associate = (models) => {
    insurances.belongsTo(models.products, {foreignKey: 'product_id'});
    insurances.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'consumer'});
    insurances.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    insurances.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    insurances.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    insurances.belongsTo(models.onlineSellers,
        {foreignKey: 'online_seller_id', as: 'onlineSellers'});
    insurances.belongsTo(models.sellers,
        {foreignKey: 'seller_id', as: 'sellers'});
    insurances.belongsTo(models.insuranceBrands,
        {foreignKey: 'provider_id', as: 'provider'});
    insurances.belongsTo(models.renewalTypes,
        {foreignKey: 'renewal_type', targetKey: 'type'});
  };

  return insurances;
};
