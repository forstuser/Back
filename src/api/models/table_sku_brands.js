'use strict';

export default (sequelize, DataTypes) => {
    const sku_brands = sequelize.define('sku_brands', {
            title: {
                type: DataTypes.STRING,
            },
            category_ids: {
                type: DataTypes.JSONB,
            },
            details: {
                type: DataTypes.JSONB,
            },
            image_name: {
                type: DataTypes.STRING,
            },
            updated_by: {
                type: DataTypes.INTEGER,
            },
            status_type: {
                type: DataTypes.INTEGER,
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
            tableName: 'table_sku_brands',
        });

    sku_brands.associate = (models) => {
        sku_brands.belongsTo(models.users,
            {foreignKey: 'updated_by'});
        sku_brands.belongsTo(models.statuses,
            {foreignKey: 'status_type', targetKey: 'status_type'});
    };
    return sku_brands;
};
