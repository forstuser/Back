'use strict';
export default (sequelize, DataTypes) => {
  const mealStateMap = sequelize.define('mealStateMap', {
        meal_id: {
          type: DataTypes.INTEGER,
        },
        state_id: {
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
        tableName: 'table_meal_state_map',

      });

  mealStateMap.associate = (models) => {
    mealStateMap.belongsTo(models.users,
        {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
    mealStateMap.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    mealStateMap.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
    mealStateMap.belongsTo(models.meals,
        {foreignKey: 'meal_id', onDelete: 'cascade', onUpdate: 'cascade'});
    mealStateMap.belongsTo(models.states,
        {foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return mealStateMap;
}
