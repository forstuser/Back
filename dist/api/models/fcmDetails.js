'use strict';

module.exports = function (sequelize, DataTypes) {
	var fcmDetails = sequelize.define('fcmDetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			unique: true
		},
		user_id: {
			type: DataTypes.INTEGER
		},
		fcm_id: {
			type: DataTypes.STRING,
			unique: true
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
		tableName: 'fcm_details'
	});

	fcmDetails.associate = function (models) {
		fcmDetails.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
	};

	return fcmDetails;
};