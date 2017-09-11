/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('contactUs', {
    name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: Sequelize.STRING
    },
    message: {
        type: Sequelize.STRING
    },
    createdAt: {
        type: Sequelize.DATE(6),
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE(6),
        defaultValue: Sequelize.NOW
    },
    resolved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    resolved_by: {
        type: Sequelize.INTEGER
    }
}, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: false,
    tableName: "table_contact_us"
});
