'use strict';

export default (sequelize, DataTypes) => {
  const invited_sellers = sequelize.define('invited_sellers', {
        seller_name: {
          type: DataTypes.STRING,
        },
        is_onboarded: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        address: {
          type: DataTypes.STRING,
        },
        city_id: {
          type: DataTypes.INTEGER,
        },
        state_id: {
          type: DataTypes.INTEGER,
        },
        locality_id: {
          type: DataTypes.INTEGER,
        },
        customer_id: {type: DataTypes.INTEGER},
        url: {
          type: DataTypes.STRING,
        },
        contact_no: {
          type: DataTypes.STRING,
        },
        email: {
          type: DataTypes.STRING,
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
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: false,
        timestamps: true,
        underscored: true,
        tableName: 'table_invited_sellers',
      });

  invited_sellers.associate = (models) => {
    invited_sellers.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          as: 'updater',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    invited_sellers.belongsTo(models.seller_users,
        {
          foreignKey: 'user_id',
          as: 'user',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    invited_sellers.belongsTo(models.users,
        {
          foreignKey: 'customer_id',
          as: 'customer',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    invited_sellers.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    invited_sellers.belongsTo(models.states,
        {foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade'});
    invited_sellers.belongsTo(models.cities,
        {foreignKey: 'city_id', onDelete: 'cascade', onUpdate: 'cascade'});
    invited_sellers.belongsTo(models.locality,
        {foreignKey: 'locality_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return invited_sellers;
};
