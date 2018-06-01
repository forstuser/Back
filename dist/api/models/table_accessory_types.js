'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const table_accessory_types = sequelize.define('table_accessory_types', {
    model: {
      type: DataTypes.STRING
    },
    brand_id: {
      type: DataTypes.INTEGER
    },
    variant: {
      type: DataTypes.STRING
    },
    accessory_product_id: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    created_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_accessory_types'
  });

  table_accessory_types.associate = models => {

    table_accessory_types.belongsTo(models.brands, {
      foreignKey: 'brand_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_types.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_types.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_types.belongsTo(models.users, {
      foreignKey: 'created_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    table_accessory_types.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    // .hasMany(models.todoUserMap,
    //     {foreignKey: 'todo_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return table_accessory_types;
};