'use strict';

export default (sequelize, DataTypes) => {
    const table_provider_category = sequelize.define('table_provider_category', {
            provider_city_id: {
                type: DataTypes.INTEGER,
            },
            category_id: {
                type: DataTypes.INTEGER,
            },
            provider_category_id: {
                type: DataTypes.INTEGER,
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
                defaultValue: sequelize.literal('NOW()'),
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: sequelize.literal('NOW()'),
            },

        },
        {
            freezeTableName: true,
            defaultPrimaryKey: true,
            timestamps: true,
            underscored: true,
            tableName: 'table_provider_category',
        });

    table_provider_category.associate = (models) => {

        table_provider_category.belongsTo(models.table_provider_cities,
            {foreignKey: 'provider_city_id', onDelete: 'cascade', onUpdate: 'cascade'});

        table_provider_category.belongsTo(models.categories,
            {foreignKey: 'category_id', onDelete: 'cascade', onUpdate: 'cascade'});

        table_provider_category.belongsTo(models.users,
            {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
        table_provider_category.belongsTo(models.users,
            {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
        table_provider_category.belongsTo(models.statuses,
            {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
    };
    return table_provider_category;
};
