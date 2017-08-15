
const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

class BillManagementController {
  constructor(modal) {
    modals = modal;
    modals.table_consumer_bills.belongsTo(modals.table_users, { foreignKey: 'user_id', as: 'User' });
    modals.table_users.hasMany(modals.table_consumer_bills);

    modals.table_cust_executive_tasks.belongsTo(modals.table_consumer_bills, { foreignKey: 'BillID', as: 'CustomerExecutive' });
    modals.table_consumer_bills.hasOne(modals.table_cust_executive_tasks, { foreignKey: 'BillID', as: 'CustomerExecutive' });
    modals.table_cust_executive_tasks.belongsTo(modals.table_users, { foreignKey: 'user_id', as: 'User' });
    modals.table_users.hasMany(modals.table_cust_executive_tasks);

    modals.table_qual_executive_tasks.belongsTo(modals.table_consumer_bills, { foreignKey: 'BillID', as: 'QualityExecutive' });
    modals.table_consumer_bills.hasOne(modals.table_qual_executive_tasks, { foreignKey: 'BillID', as: 'QualityExecutive' });
    modals.table_qual_executive_tasks.belongsTo(modals.table_users, { foreignKey: 'user_id', as: 'User' });
    modals.table_users.hasMany(modals.table_qual_executive_tasks);

    modals.table_consumer_bill_copies.belongsTo(modals.table_consumer_bills, { foreignKey: 'BillID', as: 'BillCopies' });
    modals.table_consumer_bills.hasMany(modals.table_consumer_bill_copies, { foreignKey: 'BillID', as: 'BillCopies' });
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
    modals.table_authorized_service_center.findOrCreate({
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
          detailPromise.push(modals.table_authorized_service_center_details.create({
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
      modals.table_authorized_service_center_details.findOrCreate({
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
    modals.table_authorized_service_center.update({
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
          detailPromise.push(modals.table_authorized_service_center_details.update({
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
      modals.table_authorized_service_center_details.update({
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
    Promise.all([modals.table_authorized_service_center.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }), modals.table_authorized_service_center_details.update({
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
      modals.table_authorized_service_center_details.update({
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

  // Get Admin Consumer Bills List
  static retrieveAdminConsumerBillList(request, reply) {
    const Status = request.query.status;
    let includeTables;
    switch (Status) {
      case '4': {
        includeTables = [
          { model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }
        ];
        break;
      }
      case '8': {
        includeTables = [
          { model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] },
          { model: modals.table_cust_executive_tasks, as: 'CustomerExecutive', attributes: ['status_id', 'TaskAssignedDate'], include: [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }] },
          { model: modals.table_qual_executive_tasks, as: 'QualityExecutive', attributes: ['status_id', 'TaskAssignedDate'], include: [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }] }
        ];
        break;
      }
      case '5': {
        includeTables = [
          { model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] },
          { model: modals.table_cust_executive_tasks, as: 'CustomerExecutive', attributes: ['status_id', 'TaskAssignedDate'], include: [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }] },
          { model: modals.table_qual_executive_tasks, as: 'QualityExecutive', attributes: ['status_id', 'TaskAssignedDate'], include: [{ model: modals.table_users, as: 'User', attributes: ['Name', 'EmailAddress', 'PhoneNo'] }] }
        ];
        break;
      }
      default: {
        const data = '{"statusCode": 402,"error": "Invalid Status","message": "Invalid Status."}';
        return reply(data);
      }
    }

    return modals.table_consumer_bills.findAll({
      where: {
        user_status: {
          $ne: 3
        },
        admin_status: 4
      },
      include: includeTables,
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }

  static retrieveServiceCenterById(request, reply) {
    modals.table_authorized_service_center.findOne({
      where: {
        ID: request.params.id
      },
      include: [
        { model: modals.table_brands, as: 'Brand', attributes: ['Name'] },
        { model: modals.table_authorized_service_center_details,
          as: 'Details',
          attributes: excludedAttributes }
      ],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = BillManagementController;
