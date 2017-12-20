'use strict';

export default (sequelize, DataTypes) => {
  const brandDetails = sequelize.define('brandDetails', {
        brand_id: {
          type: DataTypes.INTEGER,
        },
        category_id: {
          type: DataTypes.INTEGER,
        },
        detail_type: {
          type: DataTypes.INTEGER,
        },
        value: {
          type: DataTypes.STRING,
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
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'brand_details',
      });

  brandDetails.associate = (models) => {
    brandDetails.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    brandDetails.belongsTo(models.brands,
        {foreignKey: 'brand_id', targetKey: 'brand_id'});

    brandDetails.belongsTo(models.categories,
        {foreignKey: 'category_id', targetKey: 'category_id'});

    brandDetails.belongsTo(models.detailTypes,
        {foreignKey: 'detail_type', targetKey: 'id'});

    brandDetails.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return brandDetails;
};
