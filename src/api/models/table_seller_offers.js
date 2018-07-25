'use strict';

export default (sequelize, DataTypes) => {
  const seller_offers = sequelize.define('seller_offers', {
        title: {
          type: DataTypes.STRING,
        },
        description: {
          type: DataTypes.STRING,
        },
        seller_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1
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
        tableName: 'table_seller_offers',
      });

  seller_offers.associate = (models) => {
    seller_offers.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_offers.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'seller', onDelete: 'cascade', onUpdate: 'cascade'});
    seller_offers.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return seller_offers;
};
