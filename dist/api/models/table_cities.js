'use strict';

exports.default = (sequelize, DataTypes) => {
  const cities = sequelize.define('cities', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    created_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_cities'
  });

  cities.associate = models => {
    cities.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });
    cities.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    cities.belongsTo(models.states, { foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return cities;
};