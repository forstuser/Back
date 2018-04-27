'use strict';
export default (sequelize, DataTypes) => {
  const todoUserMap = sequelize.define('todoUserMap', {
        user_id: {
          type: DataTypes.INTEGER,
        },
        todo_id: {
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
        tableName: 'table_todo_user_map',
      });

  todoUserMap.associate = (models) => {
    todoUserMap.belongsTo(models.users,
        {foreignKey: 'user_id', onDelete: 'cascade', onUpdate: 'cascade'});
    todoUserMap.belongsTo(models.users,
        {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
    todoUserMap.belongsTo(models.users,
        {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
    todoUserMap.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    todoUserMap.belongsTo(models.todo,
        {foreignKey: 'todo_id', onDelete: 'cascade', onUpdate: 'cascade'});
    todoUserMap.hasMany(models.todoUserDate, {
      foreignKey: 'user_todo_id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      as: 'todo_dates',
    });
  };
  return todoUserMap;
}








