/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_users', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'user_id'
	},
	user_type_id: {
		type: Sequelize.INTEGER
	},
	fullname: {
		type: Sequelize.STRING
	},
	GoogleAuthKey: {
		type: Sequelize.STRING,
		field: 'gmail_id'
	},
	FacebookAuthKey: {
		type: Sequelize.STRING,
		field: 'facebook_id'
	},
	email_id: {
		type: Sequelize.STRING,
		unique: true,
		validate: {
			isEmail: false
		}
	},
	mobile_no: {
		type: Sequelize.STRING,
		unique: true
	},
	password: {
		type: Sequelize.STRING
	},
	tmp_password: {
		type: Sequelize.STRING
	},
	location: {
		type: Sequelize.STRING
	},
	latitude: {
		type: Sequelize.STRING
	},
	longitude: {
		type: Sequelize.STRING
	},
	image: {
		type: Sequelize.STRING
	},
	os_type_id: {
		type: Sequelize.STRING
	},
	accessLevel: {
		type: Sequelize.ENUM('user', 'free', 'premium'),
		defaultValue: 'user'
	},
	created_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	gcm_id: {
		type: Sequelize.STRING
	},
	passwordResetToken: {
		type: Sequelize.STRING
	},
	token: {
		type: Sequelize.STRING
	},
	expiresIn: {
		type: Sequelize.BIGINT
	},
	updated_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	device_id: {
		type: Sequelize.STRING
	},
	device_model: {
		type: Sequelize.STRING
	},
	apk_version: {
		type: Sequelize.STRING
	},
	last_login: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	status_id: {
		defaultValue: 1,
		type: Sequelize.INTEGER
	},
	is_enrolled_professional: {
		type: Sequelize.BOOLEAN
	},
	professional_category_id: {
		type: Sequelize.INTEGER
	},
	share_mobile: {
		type: Sequelize.BOOLEAN
	},
	share_email: {
		type: Sequelize.BOOLEAN
	},
	email_verified: {
		type: Sequelize.BOOLEAN
	},
	professional_description: {
		type: Sequelize.STRING
	},
	email_secret: {
		type: Sequelize.STRING(2000)
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
