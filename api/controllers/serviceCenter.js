const shared = require('../../helpers/shared');
const googleMapsClient = require('@google/maps').createClient({
  Promise,
  key: 'AIzaSyCT60FOMjGxPjOQjyk9ewP5l9VkmMcTWmE'
});

let modals;
const excludedAttributes = { exclude: ['tableBrandID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

class ServiceCenterController {
  constructor(modal) {
    modals = modal;
  }

  // Add Authorized Service Center
  static addServiceCenter(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const BrandID = request.payload.BrandID;
    const Name = request.payload.Name;
    const HouseNo = request.payload.HouseNo;
    const Block = request.payload.Block;
    const Street = request.payload.Street;
    const Sector = request.payload.Sector;
    const City = request.payload.City;
    const State = request.payload.State;
    const PinCode = request.payload.PinCode;
    const NearBy = request.payload.NearBy;
    const Latitude = request.payload.Latitude;
    const Longitude = request.payload.Longitude;
    const OpenDays = request.payload.OpenDays;
    const Timings = request.payload.Timings;
    const Details = request.payload.Details;
    modals.authorizedServiceCenter.findOrCreate({
      where: {
        Name,
        BrandID,
        HouseNo,
        Street,
        City,
        State,
        status_id: 1
      },
      defaults: {
        Longitude,
        Latitude,
        OpenDays,
        Details,
        Timings,
        Block,
        Sector,
        PinCode,
        NearBy,
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((serviceCenter) => {
      const detailPromise = [];
      let createdServiceCenter;
      if (serviceCenter[1]) {
        createdServiceCenter = serviceCenter[0];
        const CenterID = createdServiceCenter.ID;
        for (let i = 0; i < Details.length; i += 1) {
          detailPromise.push(modals.authorizeServiceCenterDetail.create({
            CenterID,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Detail: Details[i].Details,
            status_id: 1
          }));
        }
      }

      if (detailPromise.length > 0) {
        Promise.all(detailPromise).then((result) => {
          createdServiceCenter.Details = result;
          reply(createdServiceCenter).header('CenterID', createdServiceCenter.ID).code(201);
        }).catch((err) => {
          reply(err);
        });
      } else {
        reply(serviceCenter[0]).header('CenterID', serviceCenter[0].ID).code(422);
      }
    });
  }

  static addServiceCenterDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CenterID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Detail = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.authorizeServiceCenterDetail.findOrCreate({
        where: {
          DetailTypeID,
          DisplayName,
          CenterID,
          status_id: 1
        },
        defaults: {
          Detail
        },
        attributes: excludedAttributes
      }).then((serviceCenterDetail) => {
        if (serviceCenterDetail[1]) {
          return reply(serviceCenterDetail[0]).header('ServiceCenterDetailId', serviceCenterDetail[0].DetailID).code(201);
        }

        return reply(serviceCenterDetail[0]).header('ServiceCenterDetailId', serviceCenterDetail[0].DetailID).code(422);
      });
    } else {
      reply().code(401);
    }
  }

  static updateServiceCenter(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const BrandID = request.payload.BrandID;
    const Name = request.payload.Name;
    const HouseNo = request.payload.HouseNo;
    const Block = request.payload.Block;
    const Street = request.payload.Street;
    const Sector = request.payload.Sector;
    const City = request.payload.City;
    const State = request.payload.State;
    const PinCode = request.payload.PinCode;
    const NearBy = request.payload.NearBy;
    const Latitude = request.payload.Latitude;
    const Longitude = request.payload.Longitude;
    const OpenDays = request.payload.OpenDays;
    const Timings = request.payload.Timings;
    const Details = request.payload.Details;
    modals.authorizedServiceCenter.update({
      Name,
      BrandID,
      OpenDays,
      Timings,
      HouseNo,
      Block,
      Street,
      Sector,
      City,
      State,
      PinCode,
      NearBy,
      Latitude,
      Longitude,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => {
      const detailPromise = [];
      const CenterID = request.params.id;
      for (let i = 0; i < Details.length; i += 1) {
        if (Details[i].DetailID) {
          detailPromise.push(modals.authorizeServiceCenterDetail.update({
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Detail: Details[i].Details,
            status_id: 1
          }, {
            where: {
              DetailID: Details[i].DetailID
            }
          }));
        } else {
          detailPromise.push(modals.table_online_seller_details.create({
            CenterID,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Detail: Details[i].Details,
            status_id: 1
          }));
        }
      }

      if (detailPromise.length > 0) {
        Promise.all(detailPromise).then(() => reply().code(204)).catch(err => reply(err));
      } else {
        reply().code(422);
      }
    });
  }

  static updateServiceCenterDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CenterID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Detail = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.authorizeServiceCenterDetail.update({
        DetailTypeID,
        DisplayName,
        Detail
      }, {
        where: {
          CenterID,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static deleteServiceCenter(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    Promise.all([modals.authorizedServiceCenter.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }), modals.authorizeServiceCenterDetail.update({
      status_id: 3
    }, {
      where: {
        SellerID: request.params.id
      }
    })]).then(() => reply().code(204)).catch(err => reply(err));
  }

  static deleteServiceCenterDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.authorizeServiceCenterDetail.update({
        status_id: 3
      }, {
        where: {
          CenterID: request.params.id,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static retrieveServiceCenters(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const payload = request.payload || {
      location: '',
      city: '',
      searchValue: '',
      longitude: '',
      latitude: '',
      categoryId: '',
      masterCategoryId: '',
      brandId: ''
    };

    const latitude = payload.latitude || user.latitude || '';
    const longitude = payload.longitude || user.longitude || '';
    const location = payload.location || user.location || '';
    const city = payload.city || '';
    const latlong = latitude && longitude ? `${latitude}, ${longitude}` : '';
    const categoryId = request.query.categoryid || payload.categoryId || '';
    const brandId = request.query.brandid || payload.brandId || '';
    const whereClause = {
      status_id: {
        $ne: 3
      },
      $and: []
    };
    const brandWhereClause = {
      status_id: {
        $ne: 3
      }
    };
    const detailWhereClause = {
      status_id: {
        $ne: 3
      }
    };
    if (brandId) {
      whereClause.brand_id = brandId;
      brandWhereClause.brand_id = brandId;
    }

    if (categoryId) {
      detailWhereClause.category_id = categoryId;
    }

    if (city) {
      whereClause.$and.push(modals.sequelize.where(modals.sequelize.fn('lower', modals.sequelize.col('address_city')), modals.sequelize.fn('lower', city)));
    }
    const origins = [];
    const destinations = [];
    if (latlong) {
      origins.push(latlong);
    } else if (location) {
      origins.push(location);
    } else if (city) {
      origins.push(city);
    }


    Promise.all([modals.authorizedServiceCenter.findAll({
      where: whereClause,
      include: [
        {
          model: modals.table_brands,
          as: 'brand',
          attributes: [['brand_name', 'name'], ['brand_description', 'description'], ['brand_id', 'id']],
          where: brandWhereClause,
          required: true
        },
        {
          model: modals.authorizeServiceCenterDetail,
          as: 'centerDetails',
          attributes: [['display_name', 'name'], 'details', ['contactdetail_type_id', 'detailType']],
          where: detailWhereClause,
          required: true
        }
      ],
      attributes: [['center_name', 'centerName'], ['address_house_no', 'houseNo'], ['address_block', 'block'], ['address_street', 'street'], ['address_sector', 'sector'], ['address_city', 'city'], ['address_state', 'state'], ['address_pin_code', 'pinCode'], ['address_nearby', 'nearBy'], 'latitude', 'longitude', 'timings', ['open_days', 'openingDays'], [modals.sequelize.fn('CONCAT', 'categories/', categoryId, '/image'), 'cImageURL']]
    }),
    modals.table_brands.findAll({
      where: {
        status_id: {
          $ne: 3
        }
      },
      include: [{
        model: modals.brandDetails,
        as: 'details',
        where: {
          status_id: {
            $ne: 3
          },
          category_id: categoryId
        },
        attributes: []
      }],
      attributes: [['brand_id', 'id'], ['brand_name', 'name']]
    })]).then((result) => {
      const serviceCentersWithLocation = [];
      const finalResult = [];
      if (result[0].length > 0) {
        const serviceCenters = result[0].map((item) => {
          const center = item.toJSON();
          center.mobileDetails = center.centerDetails.filter(detail => detail.detailType === 3);
          center.centerAddress = `${center.centerName}, ${center.sector} ${center.street}, ${center.city}-${center.pinCode}, ${center.state}, India`;
          center.geoLocation = center.latitude && center.longitude && center.latitude.toString() !== '0' && center.longitude.toString() !== '0' ? `${center.latitude}, ${center.longitude}` : '';
          if (center.geoLocation) {
            destinations.push(center.geoLocation);
          } else if (center.city) {
            destinations.push(center.city);
          } else if (center.centerAddress) {
            destinations.push(center.centerAddress);
          }

          if (origins.length > 0 && destinations.length > 0) {
            if (origins.length < destinations.length) {
              origins.push(origins[0]);
            }
            serviceCentersWithLocation.push(center);
          } else {
            center.distanceMetrics = 'km';
            center.distance = parseFloat(500.001);
            finalResult.push(center);
          }

          return center;
        });
        if (origins.length > 0 && destinations.length > 0) {
          googleMapsClient.distanceMatrix({
            origins,
            destinations
          }).asPromise().then((matrix) => {
            for (let i = 0; i < serviceCentersWithLocation.length; i += 1) {
              const tempMatrix = matrix.status === 200 && matrix.json ? matrix.json.rows[0]
                .elements[i] : {};
              if (tempMatrix && tempMatrix.status.toLowerCase() === 'ok') {
                serviceCentersWithLocation[i].distanceMetrics = tempMatrix.distance ? tempMatrix.distance.text.split(' ')[1] : 'km';
                serviceCentersWithLocation[i].distance = parseFloat(tempMatrix.distance ? tempMatrix.distance.text.split(' ')[0] : 500.001);
                serviceCentersWithLocation[i].distance = serviceCentersWithLocation[i].distanceMetrics !== 'km' ? serviceCentersWithLocation[i].distance / 1000 : serviceCentersWithLocation[i].distance;
              } else {
                serviceCentersWithLocation[i].distanceMetrics = 'km';
                serviceCentersWithLocation[i].distance = parseFloat(500.001);
              }

              finalResult.push(serviceCentersWithLocation[i]);
            }

            if (finalResult.length === result[0].length) {
              serviceCentersWithLocation.sort((a, b) => a.distance - b.distance);
              reply({
                status: true,
                serviceCenters: serviceCentersWithLocation,
                filterData: {
                  brands: result[1]
                }
              }).code(200);
            }
          }).catch(err => reply({
            status: false,
            err
          }));
        }
        if (origins.length <= 0) {
          reply({
            status: true,
            filterData: {
              brands: result[1]
            },
            serviceCenters
          });
        }
      } else {
        reply({
          status: false,
          message: 'No Data Found for mentioned search'
        });
      }
    }).catch((err) => {
      reply({
        status: false,
        err
      });
    });
  }

  static retrieveServiceCenterById(request, reply) {
    modals.authorizedServiceCenter.findOne({
      where: {
        ID: request.params.id
      },
      include: [
        { model: modals.table_brands, as: 'Brand', attributes: ['Name'] },
        {
          model: modals.authorizeServiceCenterDetail,
          as: 'Details',
          attributes: excludedAttributes
        }
      ],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }

  static retrieveServiceCenterFilters(request, reply) {
    Promise.all([
      modals.categories.findAll({
        where: {
          display_id: [2, 3],
          category_level: 1,
          status_id: {
            $ne: 3
          }
        },
        include: [{
          model: modals.categories,
          on: {
            $or: [
              modals.sequelize.where(modals.sequelize.col('`subCategories`.`ref_id`'), modals.sequelize.col('`categories`.`category_id`'))
            ]
          },
          as: 'subCategories',
          where: {
            status_id: {
              $ne: 3
            }
          },
          attributes: [['category_id', 'id'], ['category_name', 'name']],
          required: false
        }],
        attributes: [['category_id', 'id'], ['display_id', 'cType'], ['category_name', 'name']]
      }),
      modals.authorizedServiceCenter
        .aggregate('address_city', 'DISTINCT', { plain: false, order: [['address_city']] }),
      modals.table_brands.findAll({
        where: {
          status_id: {
            $ne: 3
          }
        },
        include: [{ model: modals.authorizedServiceCenter, as: 'center', attributes: [] }],
        attributes: [['brand_name', 'name'], ['brand_id', 'id']]
      })
    ]).then((result) => {
      reply({
        status: true,
        categories: result[0],
        cities: result[1].map(item => item.DISTINCT),
        brands: result[2]
      });
    });
  }
}

module.exports = ServiceCenterController;
