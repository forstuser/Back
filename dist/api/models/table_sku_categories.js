'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = (sequelize, DataTypes) => {
    const sku_categories = sequelize.define('sku_categories', {
        title: {
            type: DataTypes.STRING
        },
        ref_id: {
            'type': DataTypes.INTEGER
        },
        category_id: {
            'type': DataTypes.INTEGER
        },
        level: {
            'type': DataTypes.INTEGER
        },
        image_name: {
            'type': DataTypes.STRING
        },
        updated_by: {
            type: DataTypes.INTEGER
        },
        status_type: {
            type: DataTypes.INTEGER
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()')
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()')
        },
        brand_ids: {
            type: DataTypes.JSONB
        }
    }, {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_sku_categories'
    });

    sku_categories.associate = models => {
        sku_categories.belongsTo(models.users, { foreignKey: 'updated_by' });
        sku_categories.belongsTo(models.categories, { foreignKey: 'category_id' });
        sku_categories.belongsTo(models.sku_categories, { foreignKey: 'ref_id' });
        sku_categories.hasMany(models.sku_categories, { foreignKey: 'ref_id', as: 'subCategories' });
        sku_categories.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    };
    return sku_categories;
};