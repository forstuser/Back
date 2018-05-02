'use strict';
// this is the provider city mapping. one provider to the cities they are available in

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (sequelize, DataTypes) {
    var table_provider_cities = sequelize.define('table_provider_cities', {
        provider_id: {
            type: DataTypes.INTEGER
        },
        city_id: {
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
        tableName: 'table_provider_cities'
    });

    table_provider_cities.associate = function (models) {

        table_provider_cities.belongsTo(models.table_cities, {
            foreignKey: 'city_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });

        table_provider_cities.belongsTo(models.table_service_providers, {
            foreignKey: 'provider_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });

        table_provider_cities.belongsTo(models.users, {
            foreignKey: 'updated_by',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
        table_provider_cities.belongsTo(models.users, {
            foreignKey: 'created_by',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
        table_provider_cities.belongsTo(models.statuses, {
            foreignKey: 'status_type',
            targetKey: 'status_type',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
    };
    return table_provider_cities;
};