'use strict';
export default (sequelize, DataTypes) => {
  const table_accessory_listing = sequelize.define('table_accessory_listing', {

        title: {
          type: DataTypes.STRING,
        },
        product_brand_id: {
          type: DataTypes.STRING,
        },
        product_model: {
          type: DataTypes.STRING,
        },
        description: {
          type: DataTypes.STRING,
        },
        asin: {
          type: DataTypes.STRING,
        },
        pid: {
          type: DataTypes.STRING,
        },
        details: {
          type: DataTypes.JSONB,
        },
        accessory_type_id: {
          type: DataTypes.INTEGER,
        },
        priorty: {
          type: DataTypes.INTEGER,
        },
        class: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_accessory_listing',
      });

  table_accessory_listing.associate = (models) => {

    table_accessory_listing.belongsTo(models.users,
        {
          foreignKey: 'updated_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_listing.belongsTo(models.users,
        {
          foreignKey: 'created_by',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    table_accessory_listing.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });

    // .hasMany(models.todoUserMap,
    //     {foreignKey: 'todo_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return table_accessory_listing;
}