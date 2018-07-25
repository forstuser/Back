'use strict';

exports.default = (sequelize, DataTypes) => {
  const locations = sequelize.define('locations', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pin_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city_id: {
      type: DataTypes.INTEGER,
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

  locations.associate = models => {
    locations.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });
    locations.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade' });
    locations.belongsTo(models.states, { foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade' });
    locations.belongsTo(models.cities, { foreignKey: 'city_id', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return locations;
};