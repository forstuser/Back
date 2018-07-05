'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const table_accessory_categories = sequelize.define('table_accessory_categories', {
    category_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    priority: {
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING
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
    tableName: 'table_accessory_categories'
  });

  table_accessory_categories.associate = models => {

    table_accessory_categories.belongsTo(models.categories, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_categories.belongsTo(models.categories, {
      foreignKey: 'main_category_id',
      as: 'main_category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_categories.hasMany(models.table_accessory_products, {
      foreignKey: 'accessory_id',
      as: 'accessory_items',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_categories.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_accessory_categories.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    table_accessory_categories.belongsTo(models.users, {
      foreignKey: 'created_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    table_accessory_categories.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return table_accessory_categories;
};