'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var mealUserMap = sequelize.define('mealUserMap', {
    user_id: {
      type: DataTypes.INTEGER
    },
    meal_id: {
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
    Table_name: 'table_meal_user_map'
  });

  mealUserMap.associate = function (models) {
    mealUserMap.belongsTo(models.users, { foreignKey: 'user_id', onDelete: 'cascade', onUpdate: 'cascade' });
    mealUserMap.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });
    mealUserMap.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    mealUserMap.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    mealUserMap.belongsTo(models.meals, { foreignKey: 'meal_id', onDelete: 'cascade', onUpdate: 'cascade' });
    mealUserMap.hasMany(models.mealUserDate, {
      foreignKey: 'user_meal_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      as: 'meal_dates'
    });
  };
  return mealUserMap;
};