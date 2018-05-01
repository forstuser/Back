'use strict';

export default (sequelize, DataTypes) => {
    const table_service_providers = sequelize.define('table_service_providers', {
            name: {
                type: DataTypes.STRING,
            },
            end_point: {
                type: DataTypes.STRING,
            },
            logo: {
                type: DataTypes.STRING,
            },
            ratings: {
                type: DataTypes.FLOAT,
            },
            reviews: {
                type: DataTypes.ARRAY(DataTypes.JSONB),
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
            tableName: 'table_service_providers',
        });

    table_service_providers.associate = (models) => {
        table_service_providers.belongsTo(models.users,
            {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
        table_service_providers.belongsTo(models.users,
            {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});

        table_service_providers.belongsTo(models.statuses,
            {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
        table_service_providers.hasMany(models.table_provider_cities,
            {foreignKey: 'provider_id', as: 'cities', onDelete: 'cascade', onUpdate: 'cascade'});
    };
    return table_service_providers;
};
