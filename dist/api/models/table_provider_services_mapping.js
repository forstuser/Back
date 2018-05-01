'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (sequelize, DataTypes) {
    var table_provider_services_mapping = sequelize.define('table_provider_services_mapping', {
        name: {
            type: DataTypes.STRING
        },
        service_id: {
            type: DataTypes.INTEGER
        },
        provider_category_id: {
            type: DataTypes.INTEGER
        },
        inclusions: {
            type: DataTypes.JSONB
        },
        exclusion: {
            type: DataTypes.JSONB
        },
        price_options: {
            type: DataTypes.JSONB
        },
        ratings: {
            type: DataTypes.FLOAT
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

    table_provider_services_mapping.associate = function (models) {

        table_provider_services_mapping.belongsTo(models.table_affiliated_services, { foreignKey: 'service_id', onDelete: 'cascade', onUpdate: 'cascade' });

        table_provider_services_mapping.belongsTo(models.table_provider_category, { foreignKey: 'provider_category_id', onDelete: 'cascade', onUpdate: 'cascade' });

        table_provider_services_mapping.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
        table_provider_services_mapping.belongsTo(models.users, { foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade' });
        table_provider_services_mapping.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade' });
    };
    return table_provider_services_mapping;
};