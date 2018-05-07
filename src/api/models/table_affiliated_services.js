'use strict';

export default (sequelize, DataTypes) => {
    const table_affiliated_services = sequelize.define('table_affiliated_services', {
            name: {
                type: DataTypes.STRING,
            },
            ref_id: {
                type: DataTypes.INTEGER,
            },
            service_level: {
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
            tableName: 'table_affiliated_services',
        });

    table_affiliated_services.associate = (models) => {

        table_affiliated_services.belongsTo(models.table_affiliated_services, {
            foreignKey: 'ref_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });
        table_affiliated_services.hasMany(models.table_affiliated_services, {
            foreignKey: 'ref_id',
            onDelete: 'cascade',
            onUpdate: 'cascade'
        });

        table_affiliated_services.belongsTo(models.users,
            {foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade'});
        table_affiliated_services.belongsTo(models.users,
            {foreignKey: 'created_by', onDelete: 'cascade', onUpdate: 'cascade'});
        table_affiliated_services.belongsTo(models.statuses,
            {foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade'});
    };
    return table_affiliated_services;
};
