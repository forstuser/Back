'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (sequelize, DataTypes) {
    var table_cities = sequelize.define('table_cities', {
        name: {
            type: DataTypes.STRING
        },
        state_id: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        status_type: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        created_by: {
            type: DataTypes.INTEGER,
            defaultValue: 1
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
        tableName: 'table_cities'
    });

    table_cities.associate = function (models) {

        table_cities.belongsTo(models.states, { foreignKey: 'state_id', onDelete: 'cascade', onUpdate: 'cascade' });

        table_cities.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
        table_cities.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });

        table_cities.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade' });
        table_cities.hasMany(models.table_provider_cities, { foreignKey: 'city_id', as: 'providers', onDelete: 'cascade', onUpdate: 'cascade' });
    };
    return table_cities;
};