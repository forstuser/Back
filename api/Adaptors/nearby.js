/*jshint esversion: 6 */
'use strict';

const googleMapsClient = require('@google/maps').createClient({
	Promise,
	key: 'AIzaSyCT60FOMjGxPjOQjyk9ewP5l9VkmMcTWmE'
});

class NearByAdaptor {
	constructor(modals) {
		this.modals = modals;
	}

	retrieveNearBy(location, geoLocation, professionIds, reply, userId, request) {
		const origins = [];
		const destinations = [];
		if (geoLocation) {
			origins.push(geoLocation);
		} else if (location) {
			origins.push(`${location},India`);
		}
		this.filterNearByProfessional(professionIds.split('[')[1].split(']')[0].split(',').filter(Boolean), userId)
			.then((result) => {
				const finalResult = [];
				const userWithOrigins = [];
				if (result.length > 0) {
					const users = result.map((item) => {
						const user = item.toJSON();
						user.address = `${user.location}, India`;
						user.geoLocation = user.latitude && user.longitude ? `${user.latitude},${user.longitude}` : '';
						user.phoneNo = user.isPhoneAllowed ? user.phoneNo : '';
						user.email = user.isEmailAllowed ? user.email : '';

						if (user.geoLocation) {
							destinations.push(user.geoLocation);
						} else if (user.address) {
							destinations.push(user.address);
						}

						if (origins.length > 0 && destinations.length > 0) {
							if (origins.length < destinations.length) {
								origins.push(origins[0]);
							}
							userWithOrigins.push(user);
						} else {
							user.distanceMetrics = 'km';
							user.distance = 500.001;

							finalResult.push(user);
						}
						return user;
					});

					if (origins.length > 0 && destinations.length > 0) {
						googleMapsClient.distanceMatrix({
							origins,
							destinations
						}).asPromise().then((matrix) => {
							for (let i = 0; i < userWithOrigins.length; i += 1) {
								const tempMatrix = matrix.status === 200 && matrix.json ? matrix.json.rows[0]
									.elements[i] : {};
								if (tempMatrix && tempMatrix.status.toLowerCase() === 'ok') {
									userWithOrigins[i].distanceMetrics = tempMatrix.distance ? tempMatrix.distance.text.split(' ')[1] : 'km';
									userWithOrigins[i].distance = parseFloat(tempMatrix.distance ? tempMatrix.distance.text.split(' ')[0] : 500.001);
									userWithOrigins[i].distance = userWithOrigins[i].distanceMetrics !== 'km' ? userWithOrigins[i].distance / 1000 : userWithOrigins[i].distance;
								} else {
									userWithOrigins[i].distanceMetrics = 'km';
									userWithOrigins[i].distance = parseFloat(500.001);
								}
								finalResult.push(userWithOrigins[i]);
								if (finalResult.length === result.length) {
									finalResult.sort((a, b) => a.distance - b.distance);
									reply({
										status: true,
										sortedUsers: finalResult,
										forceUpdate: request.pre.forceUpdate
									}).code(200);
								}
							}
						}).catch((err) => {
							console.log(err);
							reply({
								status: false,
								err,
								forceUpdate: request.pre.forceUpdate
							});
						});
					}


					if (origins.length <= 0) {
						reply({
							status: true,
							users,
							forceUpdate: request.pre.forceUpdate
						});
					}
				} else {
					reply({
						status: false,
						message: 'No Data Found for mentioned search',
						forceUpdate: request.pre.forceUpdate
					});
				}
			}).catch((err) => {
			console.log(err);
			reply({
				status: false,
				message: 'Unable to get near by professional',
				err,
				forceUpdate: request.pre.forceUpdate
			});
		});
	}

	filterNearByProfessional(professionIds, userId) {
		const whereClause = {
			is_enrolled_professional: 1,
			status_id: {
				$ne: 3
			},
			ID: {
				$ne: userId
			}
		};

		if (professionIds.length > 0) {
			whereClause.professional_category_id = professionIds;
		}

		return this.modals.table_users.findAll({
			where: whereClause,
			attributes: [['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude',
				'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'],
				['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'],
				['professional_description', 'description']],
			include: [{
				model: this.modals.userImages,
				as: 'userImages',
				attributes: [[this.modals.sequelize.fn('CONCAT', 'consumer/', this.modals.sequelize.col('user_image_id'), '/images'), 'imageUrl']]
			}]
		});
	}
}

module.exports = NearByAdaptor;
