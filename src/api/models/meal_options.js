'use strict';
export default (sequelize, DataTypes) => {
  const meals = sequelize.define('meals', {
        meal_name: {
          type: DataTypes.STRING,
          unique: true,
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
        meal_type: {
          type: DataTypes.INTEGER,
          defaultValue: 2,
        },
        is_veg: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        table_name: 'table_meal_options',
      });

  meals.associate = (models) => {
    meals.belongsTo(models.users,
        {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
    meals.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    meals.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    meals.hasMany(models.mealStateMap,
        {foreignKey: 'meal_id', onDelete: 'cascade', onUpdate: 'cascade'});
    meals.hasMany(models.mealUserMap,
        {foreignKey: 'meal_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return meals;
}






