'use strict';

export default (sequelize, DataTypes) => {
  const brandDropDown = sequelize.define('brandDropDown', {
        category_form_id: {
          type: DataTypes.INTEGER,
        },
        category_id: {
          type: DataTypes.INTEGER,
        },
        title: {
          type: DataTypes.STRING,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        warranty_renewal_type: {
          type: DataTypes.INTEGER,
        },
        dual_renewal_type: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        created_by: {
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
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'brand_drop_downs',
      });

  brandDropDown.associate = (models) => {
    brandDropDown.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    brandDropDown.belongsTo(models.users,
        {foreignKey: 'created_by'});

    brandDropDown.belongsTo(models.brands,
        {foreignKey: 'brand_id', as: 'brand'});

    brandDropDown.belongsTo(models.categoryForms, {
      foreignKey: 'category_form_id', as: 'categoryForm',
    });

    brandDropDown.belongsTo(models.renewalTypes, {
      foreignKey: 'warranty_renewal_type', as: 'warrantyRenewalType',
    });
    brandDropDown.belongsTo(models.renewalTypes, {
      foreignKey: 'dual_renewal_type', as: 'dualRenewalType',
    });
    brandDropDown.belongsTo(models.categories,
        {foreignKey: 'category_id'});
    brandDropDown.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return brandDropDown;
};
