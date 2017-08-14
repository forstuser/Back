/**
 * Created by arpit on 8/11/2017.
 */
const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = { exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id'] };

class SellerController {
  constructor(modal) {
    modals = modal;
  }

  static addSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const Name = request.payload.Name;
    const URL = request.payload.URL;
    const GstinNo = request.payload.GstinNo;
    const Details = request.payload.Details;
    modals.table_online_seller.findOrCreate({
      where: {
        Name,
        status_id: 1
      },
      defaults: {
        URL,
        GstinNo,
        Details,
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((seller) => {
      const detailPromise = [];
      let createdSeller;
      if (seller[1]) {
        createdSeller = seller[0];
        const sellerId = createdSeller.ID;
        for (let i = 0; i < Details.length; i += 1) {
          detailPromise.push(modals.table_online_seller_details.create({
            SellerID: sellerId,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
            status_id: 1
          }));
        }
      }

      if (detailPromise.length > 0) {
        Promise.all(detailPromise).then((result) => {
          createdSeller.Details = result;
          reply(createdSeller).header('SellerID', seller.ID).code(201);
        }).catch((err) => {
          reply(err);
        });
      } else {
        reply(seller[0]).header('SellerId', seller.ID).code(422);
      }
    });
  }

  static addSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const SellerID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Details = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_online_seller_details.findOrCreate({
        where: {
          DetailTypeID,
          DisplayName,
          SellerID,
          status_id: 1
        },
        defaults: {
          Details
        },
        attributes: excludedAttributes
      }).then((brandDetail) => {
        if (brandDetail[1]) {
          return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(201);
        }

        return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(422);
      });
    } else {
      reply().code(401);
    }
  }

  static updateSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const Name = request.payload.Name;
    const URL = request.payload.URL;
    const GstinNo = request.payload.GstinNo;
    const Details = request.payload.Details;
    modals.table_online_seller.update({
      Name,
      URL,
      GstinNo,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => {
      const detailPromise = [];
      const SellerID = request.params.id;
      for (let i = 0; i < Details.length; i += 1) {
        if (Details[i].DetailID) {
          detailPromise.push(modals.table_online_seller_details.update({
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
            status_id: 1
          }, {
            where: {
              DetailID: Details[i].DetailID
            }
          }));
        } else {
          detailPromise.push(modals.table_online_seller_details.create({
            SellerID,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
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

  static updateSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const SellerID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Details = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_online_seller_details.update({
        DetailTypeID,
        DisplayName,
        Details
      }, {
        where: {
          SellerID,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static deleteSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    Promise.all([modals.table_online_seller.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }), modals.table_online_seller_details.update({
      status_id: 3
    }, {
      where: {
        SellerID: request.params.id
      }
    })]).then(() => reply().code(204)).catch(err => reply(err));
  }

  static deleteSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_online_seller_details.update({
        status_id: 3
      }, {
        where: {
          SellerID: request.params.id,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static retrieveSeller(request, reply) {
    modals.table_online_seller.findAll({
      where: { status_id: 1 },
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch(err => reply(err));
  }

  static retrieveSellerById(request, reply) {
    Promise.all([modals.table_online_seller.findOne({
      where: {
        ID: request.params.id
      },
      attributes: excludedAttributes
    }), modals.table_online_seller_details.findAll({
      where: {
        status_id: 1,
        SellerID: request.params.id
      }
    })]).then((result) => {
      const seller = result[0].toJSON();
      seller.Details = result[1];
      reply(seller).code(200);
    }).catch((err) => {
      reply(err);
    });
  }

  static addOfflineSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const OwnerName = request.payload.OwnerName;
    const PanNo = request.payload.PanNo;
    const RegNo = request.payload.RegNo;
    const ServiceProvider = request.payload.ServiceProvider;
    const OnBoarded = request.payload.Onboarded;
    const HouseNo = request.payload.HouseNo;
    const Block = request.payload.Block;
    const Street = request.payload.Street;
    const Sector = request.payload.Sector;
    const City = request.payload.City;
    const State = request.payload.State;
    const PinCode = request.payload.PinCode;
    const NearBy = request.payload.NearBy;
    const Lattitude = request.payload.Lattitude;
    const Longitude = request.payload.Longitude;
    const Name = request.payload.Name;
    const URL = request.payload.URL;
    const GstinNo = request.payload.GstinNo;
    const Details = request.payload.Details;
    modals.table_offline_seller.findOrCreate({
      where: {
        Name,
        OwnerName,
        HouseNo,
        Street,
        City,
        State,
        status_id: 1
      },
      defaults: {
        Longitude,
        Lattitude,
        OwnerName,
        GstinNo,
        Details,
        PanNo,
        RegNo,
        ServiceProvider,
        Block,
        Sector,
        PinCode,
        NearBy,
        URL,
        OnBoarded,
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((seller) => {
      const detailPromise = [];
      let createdSeller;
      if (seller[1]) {
        createdSeller = seller[0];
        const sellerId = createdSeller.ID;
        for (let i = 0; i < Details.length; i += 1) {
          detailPromise.push(modals.table_offline_seller_details.create({
            SellerID: sellerId,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
            status_id: 1
          }));
        }
      }

      if (detailPromise.length > 0) {
        Promise.all(detailPromise).then((result) => {
          createdSeller.Details = result;
          reply(createdSeller).header('SellerID', seller.ID).code(201);
        }).catch((err) => {
          reply(err);
        });
      } else {
        reply(seller[0]).header('SellerId', seller.ID).code(422);
      }
    });
  }

  static addOfflineSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const SellerID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Details = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_offline_seller_details.findOrCreate({
        where: {
          DetailTypeID,
          DisplayName,
          SellerID,
          status_id: 1
        },
        defaults: {
          Details
        },
        attributes: excludedAttributes
      }).then((brandDetail) => {
        if (brandDetail[1]) {
          return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(201);
        }

        return reply(brandDetail[0]).header('brandDetailId', brandDetail.DetailID).code(422);
      });
    } else {
      reply().code(401);
    }
  }

  static updateOfflineSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const OwnerName = request.payload.OwnerName;
    const PanNo = request.payload.PanNo;
    const RegNo = request.payload.RegNo;
    const ServiceProvider = request.payload.ServiceProvider;
    const OnBoarded = request.payload.Onboarded;
    const HouseNo = request.payload.HouseNo;
    const Block = request.payload.Block;
    const Street = request.payload.Street;
    const Sector = request.payload.Sector;
    const City = request.payload.City;
    const State = request.payload.State;
    const PinCode = request.payload.PinCode;
    const NearBy = request.payload.NearBy;
    const Lattitude = request.payload.Lattitude;
    const Longitude = request.payload.Longitude;
    const Name = request.payload.Name;
    const URL = request.payload.URL;
    const GstinNo = request.payload.GstinNo;
    const Details = request.payload.Details;
    modals.table_offline_seller.update({
      Name,
      URL,
      GstinNo,
      OwnerName,
      PanNo,
      RegNo,
      ServiceProvider,
      OnBoarded,
      HouseNo,
      Block,
      Street,
      Sector,
      City,
      State,
      PinCode,
      NearBy,
      Lattitude,
      Longitude,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => {
      const detailPromise = [];
      const SellerID = request.params.id;
      for (let i = 0; i < Details.length; i += 1) {
        if (Details[i].DetailID) {
          detailPromise.push(modals.table_online_seller_details.update({
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
            status_id: 1
          }, {
            where: {
              DetailID: Details[i].DetailID
            }
          }));
        } else {
          detailPromise.push(modals.table_online_seller_details.create({
            SellerID,
            DetailTypeID: Details[i].DetailTypeID,
            DisplayName: Details[i].DisplayName,
            Details: Details[i].Details,
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

  static updateOfflineSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const SellerID = request.params.id;
    const DetailTypeID = request.payload.DetailTypeID;
    const DisplayName = request.payload.DisplayName;
    const Details = request.payload.Details;
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_offline_seller_details.update({
        DetailTypeID,
        DisplayName,
        Details
      }, {
        where: {
          SellerID,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static deleteOfflineSeller(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    Promise.all([modals.table_offline_seller.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }), modals.table_offline_seller_details.update({
      status_id: 3
    }, {
      where: {
        SellerID: request.params.id
      }
    })]).then(() => reply().code(204)).catch(err => reply(err));
  }

  static deleteOfflineSellerDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (user.accessLevel.toLowerCase() === 'premium') {
      modals.table_offline_seller_details.update({
        status_id: 3
      }, {
        where: {
          SellerID: request.params.id,
          DetailID: request.params.detailid
        }
      }).then(() => reply().code(204)).catch(err => reply(err));
    } else {
      reply().code(401);
    }
  }

  static retrieveOfflineSeller(request, reply) {
    modals.table_offline_seller.findAll({
      where: { status_id: 1 },
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch(err => reply(err));
  }

  static retrieveOfflineSellerById(request, reply) {
    Promise.all([modals.table_offline_seller.findOne({
      where: {
        ID: request.params.id
      },
      attributes: excludedAttributes
    }), modals.table_offline_seller_details.findAll({
      where: {
        status_id: 1,
        SellerID: request.params.id
      }
    })]).then((result) => {
      const seller = result[0].toJSON();
      seller.Details = result[1];
      reply(seller).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = SellerController;
