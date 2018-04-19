'use strict';
exports.default = (sequelize, DataTypes) => {
  const states = sequelize.define('states', {
        state_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status_type: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_states',
      });

  states.associate = (models) => {
    states.belongsTo(models.users,
        {foreignKey: 'created_by'});
    states.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    states.hasMany(models.mealStateMap,
        {foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade'});
  };
  return states;
};


