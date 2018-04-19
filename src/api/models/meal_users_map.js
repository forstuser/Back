'use strict';
export default (sequelize, DataTypes) => {
  const mealUserMap = sequelize.define('mealUserMap', {
        user_id: {
          type: DataTypes.INTEGER,
        },
        meal_id: {
          type: DataTypes.INTEGER,
        },
        current_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        last_date: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
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
        Table_name: 'table_meal_user_map',
      });

  mealUserMap.associate = (models) => {
    mealUserMap.belongsTo(models.users, {foreignKey: 'user_id'});
    mealUserMap.belongsTo(models.users,
        {foreignKey: 'created_by'});
    mealUserMap.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    mealUserMap.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    mealUserMap.belongsTo(models.meals,
        {foreignKey: 'meal_id'});
  };
  return mealUserMap;
}








