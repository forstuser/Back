'use strict';

export default (sequelize, DataTypes) => {
  const reg_certificate = sequelize.define('reg_certificate', {
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        job_id: {
          type: DataTypes.INTEGER,
        },
        state_id: {
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
        tableName: 'consumer_reg_certificate',
      });

  reg_certificate.associate = (models) => {
    reg_certificate.belongsTo(models.products, {foreignKey: 'product_id'});
    reg_certificate.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'consumer'});
    reg_certificate.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    reg_certificate.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    reg_certificate.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    reg_certificate.belongsTo(models.states,
        {foreignKey: 'state_id', as: 'state'});
    reg_certificate.belongsTo(models.renewalTypes,
        {foreignKey: 'renewal_type', targetKey: 'type', as: 'renewal_detail'});
  };

  return reg_certificate;
};
