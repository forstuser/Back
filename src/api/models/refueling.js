'use strict';

export default (sequelize, DataTypes) => {
  const refueling = sequelize.define('refueling', {
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        job_id: {
          type: DataTypes.INTEGER,
        },
        odometer_reading: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        document_number: {
          type: DataTypes.STRING,
        },
        fuel_quantity: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        purchase_cost: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        purchase_taxes: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
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
        document_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        copies: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
        fuel_type: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'consumer_refueling',
      });

  refueling.associate = (models) => {
    refueling.belongsTo(models.products, {foreignKey: 'product_id'});
    refueling.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'consumer'});
    refueling.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    refueling.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    refueling.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
  };

  return refueling;
};
