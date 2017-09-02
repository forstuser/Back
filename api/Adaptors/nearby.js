const googleMapsClient = require('@google/maps').createClient({
  Promise,
  key: 'AIzaSyCT60FOMjGxPjOQjyk9ewP5l9VkmMcTWmE'
});

class NearByAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveNearBy(location, geoLocation, professionIds, reply, userId) {
    const origins = [];
    if (geoLocation) {
      origins.push(geoLocation);
    }

    if (location) {
      origins.push(`${location},India`);
    }
    this.filterNearByProfessional(professionIds.split('[')[1].split(']')[0].split(',').filter(Boolean), userId)
      .then((result) => {
        const sortedUsers = [];
        const users = result.map((item) => {
          const user = item.toJSON();
          user.address = `${user.location}, India`;
          user.geoLocation = `${user.latitude},${user.longitude}`;
          user.phoneNo = user.isPhoneAllowed ? user.phoneNo : '';
          user.email = user.isEmailAllowed ? user.email : '';
          const destinations = [];
          if (user.geoLocation) {
            destinations.push(user.geoLocation);
          }

          if (user.address) {
            destinations.push(user.address);
          }

          if (origins.length > 0 && destinations.length > 0) {
            googleMapsClient.distanceMatrix({
              origins,
              destinations
            }).asPromise().then((matrix) => {
              const tempMatrix = matrix.status === 200 && matrix.json ? matrix.json.rows[0]
                .elements.find(matrixItem => matrixItem.status === 'OK') : { };
              user.distanceMetrics = tempMatrix && tempMatrix.distance ? tempMatrix.distance.text.split(' ')[1] : 'km';
              user.distance = parseFloat(tempMatrix && tempMatrix.distance ? tempMatrix.distance.text.split(' ')[0] : 0);
              sortedUsers.push(user);
              if (sortedUsers.length === result.length) {
                sortedUsers.sort((a, b) => a.distance - b.distance);
                reply({
                  status: true,
                  sortedUsers
                }).code(200);
              }
            }).catch(err => reply({
              status: false,
              err
            }));
          } else {
            sortedUsers.push(user);
          }

          return user;
        });

        if (origins.length <= 0) {
          reply({
            status: true,
            users
          });
        }
      }).catch(err => reply({
        status: false,
        message: 'Unable to get near by professional',
        err
      }));
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
