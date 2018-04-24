'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var wearableDate = sequelize.define('wearableDate', {
    wearable_id: {
      type: DataTypes.INTEGER
    },
    selected_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_wearable_date'
  });

  wearableDate.associate = function (models) {
    wearableDate.belongsTo(models.wearables, { foreignKey: 'wearable_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return wearableDate;
};