'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const wearables = sequelize.define('wearables', {
    name: {
      type: DataTypes.STRING
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    created_by: {
      type: DataTypes.INTEGER
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
    },
    image_code: {
      type: DataTypes.STRING
    },
    image_name: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_wearable_items'
  });

  wearables.associate = models => {
    wearables.belongsTo(models.users, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    wearables.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    wearables.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    wearables.hasMany(models.wearableDate, {
      foreignKey: 'wearable_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      as: 'wearable_dates'
    });
  };
  return wearables;
};