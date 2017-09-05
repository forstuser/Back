/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('productBills', {
    bill_product_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bill_detail_id: {
        type: Sequelize.INTEGER
    },
    product_name: {
        type: Sequelize.STRING
    },
    master_category_id: {
        type: Sequelize.INTEGER
    },
    category_id: {
        type: Sequelize.INTEGER
    },
    brand_id: {
        type: Sequelize.INTEGER
    },
    color_id: {
        type: Sequelize.INTEGER
    },
    seller_type: {
        type: Sequelize.INTEGER
    },
    seller_id: {
        type: Sequelize.INTEGER
    },
    value_of_purchase: {
        type: Sequelize.FLOAT
    },
    taxes: {
        type: Sequelize.FLOAT
    },
    tag: {
        type: Sequelize.STRING
    },
    user_id: {
        type: Sequelize.INTEGER
    },
    status_id: {
        type: Sequelize.INTEGER
    },
    createdAt: {
        type: Sequelize.DATE(6),
        default: Sequelize.NOW,
        field: 'createdAt'
    },
    updatedAt: {
        type: Sequelize.DATE(6),
        default: Sequelize.NOW,
        field: 'updatedAt'
    }
}, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: false,
    tableName: 'table_consumer_bill_products'
});
