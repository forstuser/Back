'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (sequelize, DataTypes) {
    var table_provider_categories = sequelize.define('table_provider_categories', {
        provider_city_id: {
            type: DataTypes.INTEGER
        },
        category_id: {
            type: DataTypes.INTEGER
        },
        affiliated_category_id: {
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
        tableName: 'table_provider_categories'
    });

    table_provider_categories.associate = function (models) {

        table_provider_categories.belongsTo(models.categories, {
            foreignKey: 'category_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });

        table_provider_categories.belongsTo(models.users, {
            foreignKey: 'updated_by',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
        table_provider_categories.belongsTo(models.users, {
            foreignKey: 'created_by',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
        table_provider_categories.belongsTo(models.statuses, {
            foreignKey: 'status_type',
            targetKey: 'status_type',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });

        table_provider_categories.belongsTo(models.table_provider_cities, {
            foreignKey: 'provider_city_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
    };
    return table_provider_categories;
};