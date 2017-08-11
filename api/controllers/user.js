/**
 * Created by arpit on 7/3/2017.
 */
const bCrypt = require('bcrypt-nodejs');
// const fs = require('fs');
const authentication = require('./authentication');
const roles = require('../constants');

let userModel;
let sequelize;

function isValidPassword(userpass, passwordValue) {
  return bCrypt.compareSync(passwordValue, userpass);
}

class UserController {
  constructor(modal) {
    this.User = modal.users;
    userModel = modal.users;
    sequelize = modal.sequelize;
  }

  static register(request, reply) {
    const userItem = {
      emailAddress: request.payload.emailAddress,
      fullName: request.payload.fullName,
      password: bCrypt.hashSync(request.payload.password, bCrypt.genSaltSync(8), null),
      location: request.payload.location,
      designation: request.payload.designation,
      organization: request.payload.organization,
      website: request.payload.website,
      accessLevel: request.payload.accessLevel ? request.payload.accessLevel : roles.ROLE_MEMBER
    };
    userModel.create(userItem).then((newUser) => {
      reply({ statusCode: 201 }).header('authorization', `bearer ${authentication.generateToken(newUser)}`);
    });
  }

  static login(request, reply) {
    const error = new Error();
    userModel.findOne({ where: { emailAddress: request.payload.UserName } }).then((userItem) => {
      if (!userItem) {
        error.statusCode = 404;
        error.message = 'Email does not exist';
        return reply(error);
      }

      if (!isValidPassword(userItem.password, request.payload.Password)) {
        error.statusCode = 401;
        error.message = 'Incorrect password.';
        return reply(error);
      }
      let tokenDetail = userItem;
      if (!authentication.validateToken(userItem.expiresIn)) {
        tokenDetail = authentication.generateToken(userItem);
      }

      return reply({ statusCode: 201 }).header('authorization', `bearer ${tokenDetail.token}`).header('expiresIn', tokenDetail.expiresIn);
    }).catch((err) => {
      error.status = 401;
      error.message = 'Something went wrong, please try again.';
      error.raw = err;
      return reply(error);
    });
  }

  static uploadData(request, reply, next) {
    const queryStr = `LOAD DATA LOCAL INFILE '${request.files[0].destination + request.files[0].filename}' INTO TABLE \`${request.params.tableName}\` FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\\r\\n'  IGNORE 1 LINES`;
    sequelize.query(queryStr).then((result) => {
      reply(result);
      return next();
    }).catch(err => next(err));
  }

  static executeQuery(request, reply, next) {
    const queryStr = request.payload.queryString;
    sequelize.query(queryStr).then((result) => {
      reply(result[0]);
      return next();
    }).catch(err => next(err));
  }
}

module.exports = UserController;
