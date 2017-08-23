
const bCrypt = require('bcrypt-nodejs');
const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

class UserManagementController {
  constructor(modal) {
    modals = modal;
    modals.table_users.belongsTo(modals.table_user_type, { foreignKey: 'UserTypeID', as: 'UserType' });
  }

  // Add Exclusions
  static addUser(request, reply) {
    const user = shared.verifyAuthorization(request.headers);

    const UserTypeID = request.payload.UserTypeID;
    const Name = request.payload.Name;
    const GoogleAuthKey = request.payload.GoogleAuthKey;
    const FacebookAuthKey = request.payload.FacebookAuthKey;
    const EmailAddress = request.payload.EmailAddress;
    const PhoneNo = request.payload.PhoneNo;
    const Password = bCrypt.hashSync(request.payload.Password, bCrypt.genSaltSync(8), null);
    const OTP = request.payload.OTP;
    const Location = request.payload.Location;
    const Latitude = request.payload.Latitude;
    const Longitude = request.payload.Longitude;
    const ImageLink = request.payload.ImageLink;
    const OSTypeId = request.payload.OSTypeId;
    const GCMId = request.payload.GCMId;
    const deviceId = request.payload.deviceId;
    const deviceModel = request.payload.deviceModel;
    const apkVersion = request.payload.apkVersion;
    modals.table_users.findOrCreate({
      where: {
        Name,
        EmailAddress,
        status_id: 1
      },
      defaults: {
        UserTypeID,
        GoogleAuthKey,
        FacebookAuthKey,
        PhoneNo,
        Password,
        OTP,
        Location,
        Longitude,
        Latitude,
        ImageLink,
        OSTypeId,
        GCMId,
        deviceId,
        deviceModel,
        apkVersion,
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((userDetail) => {
      if (userDetail[1]) {
        reply(userDetail[0]).headers('UserID', userDetail[0].ID).code(201);
      } else {
        reply(userDetail[0]).header('UserID', userDetail[0].ID).code(422);
      }
    });
  }

  static updateUsers(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const UserTypeID = request.payload.UserTypeID;
    const Name = request.payload.Name;
    const GoogleAuthKey = request.payload.GoogleAuthKey;
    const FacebookAuthKey = request.payload.FacebookAuthKey;
    const EmailAddress = request.payload.EmailAddress;
    const PhoneNo = request.payload.PhoneNo;
    const password = bCrypt.hashSync(request.payload.password, bCrypt.genSaltSync(8), null);
    const OTP = request.payload.OTP;
    const location = request.payload.Location;
    const latitude = request.payload.Latitude;
    const longitude = request.payload.Longitude;
    const image = request.payload.ImageLink;
    const OSTypeId = request.payload.OSTypeId;
    const GCMId = request.payload.GCMId;
    const deviceId = request.payload.deviceId;
    const deviceModel = request.payload.deviceModel;
    const apkVersion = request.payload.apkVersion;
    modals.table_users.update({
      user_type_id: UserTypeID,
      GoogleAuthKey,
      FacebookAuthKey,
      mobile_no: PhoneNo,
      password,
      tmp_password: OTP,
      location,
      longitude,
      latitude,
      image,
      os_type_id: OSTypeId,
      gcm_id: GCMId,
      email_id: EmailAddress,
      device_id: deviceId,
      device_model: deviceModel,
      apk_version: apkVersion,
      fullname: Name,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(reply().code(204)).catch(err => reply(err));
  }

  static deleteUsers(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_users.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => reply().code(204)).catch(err => reply(err));
  }

  static retrieveUsers(request, reply) {
    modals.table_users.findAll({
      where: {
        UserType: request.query.usertype,
        status_id: {
          $ne: 3
        }
      },
      include: [{ model: modals.table_user_type, as: 'UserType', attributes: ['Name'] }],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }

  static retrieveUserByID(request, reply) {
    modals.table_users.findOne({
      where: {
        ID: request.params.id
      },
      include: [{ model: modals.table_user_type, as: 'UserType', attributes: ['Name'] }],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = UserManagementController;
