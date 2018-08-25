'use strict';

export default (sequelize, DataTypes) => {
  const assisted_service_users = sequelize.define('assisted_service_users', {
        name: {
          type: DataTypes.STRING,
        },
        mobile_no: {
          type: DataTypes.STRING,
        },
        reviews: {
          type: DataTypes.JSONB,
        },
        document_details: {
          type: DataTypes.JSONB,
        },
        updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
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
        tableName: 'table_assisted_service_users',
      });

  assisted_service_users.associate = (models) => {
    assisted_service_users.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    assisted_service_users.hasMany(models.seller_service_types,
        {
          foreignKey: 'service_user_id',as:'service_types',
          onDelete: 'cascade', onUpdate: 'cascade',
        });
    assisted_service_users.belongsTo(models.sellers,
        {
          foreignKey: 'seller_id',
          as: 'seller',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    assisted_service_users.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return assisted_service_users;
};
