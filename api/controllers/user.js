/**
 * Created by arpit on 7/3/2017.
 */
const bCrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const config = require('../../config/main');
// const fs = require('fs');
const authentication = require('./authentication');
const shared = require('../../helpers/shared');
const roles = require('../constants');
const requestPromise = require('request-promise');

const RSA = require("node-rsa");

const PUBLIC_KEY = new RSA(config.TRUECALLER_PUBLIC_KEY);

const DashboardAdaptor = require('../Adaptors/dashboard');
const UserAdaptor = require('../Adaptors/user');
const NearByAdaptor = require('../Adaptors/nearby');
const NotificationAdaptor = require('../Adaptors/notification');
const moment = require('moment');

let userModel;
let userRelationModel;
let modals;
let dashboardAdaptor;
let userAdaptor;
let nearByAdaptor;
let notificationAdaptor;

function isValidPassword(userpass, passwordValue) {
    return bCrypt.compareSync(passwordValue, userpass);
}

const generateRandomString = (len, charArray = null) => {
    const choice = charArray || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const round = crypto.randomBytes(len);
    const value = new Array(len);
    const arrLen = choice.length;

    for (let i = 0; i < len; i += 1) {
        value[i] = choice[round[i] % arrLen];
    }

    return value.join('');
};

const isValid = (tokenDb, token) => {
    const now = moment.utc();
    const otpCreatedAt = moment(tokenDb.token_updated).utc();

    const diff = now.diff(otpCreatedAt, 'minutes');

    return (tokenDb.OTP === token.toString() && diff <= 3 && tokenDb.valid_turns < 4);
};

const validatePayloadSignature = function (payload, signature) {
    return PUBLIC_KEY.verify(payload, signature, "", "base64");
};

class UserController {
    constructor(modal) {
        this.User = modal.users;
        userModel = modal.table_users;
        userRelationModel = modal.table_users_temp;
        modals = modal;
        dashboardAdaptor = new DashboardAdaptor(modals);
        userAdaptor = new UserAdaptor(modals);
        nearByAdaptor = new NearByAdaptor(modals);
        notificationAdaptor = new NotificationAdaptor(modals);
    }

    static dispatchOTP(request, reply) {
        const otp = generateRandomString(6);
        const options = {
            uri: 'http://login.smsgatewayhub.com/api/mt/SendSMS',
            qs: {
                APIKey: 'yoCgEiWDwkChKkOTQh3MDg',
                senderid: 'BinBil',
                channel: 2,
                DCS: 0,
                flashsms: 0,
                number: request.payload.PhoneNo,
                text: `Your verification code is "${otp}". Please enter this code to login your account.`,
                route: 1
            },
            timeout: 170000,
            json: true // Automatically parses the JSON string in the response
        };

        Promise.all([requestPromise(options), userModel.findOne({
            where: {
                mobile_no: request.payload.PhoneNo
            },
            attributes: {
                exclude: ['UserTypeID']
            }
        })]).then((response) => {
            if (response[0].ErrorMessage === 'Success') {
                userRelationModel.findOrCreate({
                    where: {
                        PhoneNo: request.payload.PhoneNo
                    },
                    defaults: {
                        OTP: otp,
                        token_updated: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
                        valid_turns: 0
                    }
                }).then((result) => {
                    if (!result[1]) {
                        result[0].updateAttributes({
                            OTP: otp,
                            token_updated: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
                            valid_turns: 0
                        });
                    }

                    if (response[1] && response[1][1]) {
                        response[1][0].updateAttributes({
                            last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss')
                        });
                        reply({
                            Status: true,
                            Name: response[1][0].Name,
                            PhoneNo: request.payload.PhoneNo
                        }).code(201);
                    } else {
                        reply({
                            Status: true,
                            PhoneNo: request.payload.PhoneNo
                        }).code(201);
                    }
                }).catch((err) => {
                    reply({
                        status: false,
                        err
                    });
                });
            } else {
                reply({error: response.ErrorMessage}).code(403);
            }
        }).catch((err) => {
            reply({
                status: false,
                err
            });
        });
    }

    static validateOTP(request, reply) {
        const trueObject = request.payload.TrueObject;
        if (request.payload.BBLogin_Type === 1) {
            userRelationModel.findOne({
                where: {
                    mobile_no: trueObject.PhoneNo
                }
            }).then((tokenResult) => {
                const tokenData = tokenResult.toJSON();
                tokenResult.updateAttributes({
                    valid_turns: tokenData.valid_turns + 1
                });
                if (isValid(tokenData, request.payload.Token)) {
                    userModel.findOrCreate({
                        where: {
                            mobile_no: trueObject.PhoneNo,
                            status_id: 1
                        },
                        defaults: {
                            mobile_no: trueObject.PhoneNo,
                            status_id: 1,
                            gcm_id: trueObject.fcmId
                        },
                        attributes: ['ID', ['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description'], ['gcm_id', 'fcmId']]
                    }).then((userData) => {
                        userData[0].updateAttributes({
                            last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
                            gcm_id: trueObject.fcmId
                        });
                        reply(dashboardAdaptor.prepareDashboardResult(userData[1], userData[0], `bearer ${authentication.generateToken(userData[0]).token}`)).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);
                    }).catch((err) => {
                        reply({message: 'Issue in updating data', status: false, err});
                    });
                } else {
                    reply({message: 'Invalid OTP'}).code(401);
                }
            }).catch((err) => {
                reply({message: 'Issue in updating data', status: false, err});
            });
        } else if (request.payload.BBLogin_Type === 2) {
            const TrueSecret = request.payload.TrueSecret;
            const TruePayload = request.payload.TruePayload;

            if (!validatePayloadSignature(TruePayload, TrueSecret)) {
                reply({message: 'Issue in updating data', status: false, err});
            } else {
                const userItem = {
                    email_id: trueObject.EmailAddress,
                    fullname: trueObject.Name,
                    Password: bCrypt.hashSync(trueObject.Password, bCrypt.genSaltSync(8), null),
                    location: trueObject.Location,
                    latitude: trueObject.Latitude,
                    longitude: trueObject.Longitude,
                    image: trueObject.ImageLink,
                    accessLevel: trueObject.accessLevel ? trueObject.accessLevel : roles.ROLE_MEMBER,
                    last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
                    mobile_no: trueObject.PhoneNo,
                    status_id: 1,
                    gcm_id: trueObject.fcmId
                };

                userModel.findOrCreate({
                    where: {
                        mobile_no: trueObject.PhoneNo,
                        status_id: 1
                    },
                    defaults: userItem,
                    attributes: ['ID', ['fullname', 'name'], ['mobile_no', 'phoneNo'], ['email_id', 'email'], 'location', 'longitude', 'latitude', ['is_enrolled_professional', 'isEnrolled'], ['professional_category_id', 'categoryId'], ['share_mobile', 'isPhoneAllowed'], ['share_email', 'isEmailAllowed'], ['email_verified', 'isEmailVerified'], ['professional_description', 'description']]
                })
                    .then((userData) => {
                        if (!userData[1]) {
                            userData[0].updateAttributes({
                                email_id: trueObject.EmailAddress,
                                fullname: trueObject.Name,
                                last_login: shared.formatDate(moment.utc(), 'yyyy-mm-dd HH:MM:ss'),
                                gcm_id: trueObject.fcmId
                            });
                        }

                        reply(dashboardAdaptor.prepareDashboardResult(userData[1], userData[0], `bearer ${authentication.generateToken(userData[0]).token}`)).code(201).header('authorization', `bearer ${authentication.generateToken(userData[0]).token}`);
                    });
            }
        }
    }

    static register(request, reply) {
        const userItem = {
            EmailAddress: request.payload.emailAddress,
            Name: request.payload.fullName,
            Password: bCrypt.hashSync(request.payload.password, bCrypt.genSaltSync(8), null),
            Location: request.payload.location,
            Latitude: request.payload.latitude,
            Longitude: request.payload.longitude,
            ImageLink: request.payload.ImageLink,
            PhoneNo: request.payload.PhoneNo,
            accessLevel: request.payload.accessLevel ? request.payload.accessLevel : roles.ROLE_MEMBER
        };
        userModel.create(userItem).then((newUser) => {
            reply({statusCode: 201}).header('authorization', `bearer ${authentication.generateToken(newUser)}`);
        });
    }

    static login(request, reply) {
        const error = new Error();
        userModel.findOne({where: {emailAddress: request.payload.UserName}}).then((userItem) => {
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

            return reply({statusCode: 201}).header('authorization', `bearer ${tokenDetail.token}`).header('expiresIn', tokenDetail.expiresIn);
        }).catch((err) => {
            error.status = 401;
            error.message = 'Something went wrong, please try again.';
            error.raw = err;
            return reply(error);
        });
    }

    static retrieveUserProfile(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (user) {
            reply(userAdaptor.retrieveUserProfile(user));
        } else {
            reply({message: 'Invalid Token'}).code(401);
        }
    }

    static updateUserProfile(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (user) {
            userAdaptor.updateUser(user, request.payload, reply);
        } else {
            reply({message: 'Invalid Token'}).code(401);
        }
    }

    static retrieveNearBy(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        nearByAdaptor.retrieveNearBy(request.query.location || user.location, request.query.geolocation || `${user.latitude},${user.longitude}`,
            request.query.professionids || '[]', reply, user.ID);
    }

    static verifyEmailAddress(request, reply) {
        const emailSecret = request.params.token;
        reply(notificationAdaptor.verifyEmailAddress(emailSecret));
    }
}

module.exports = UserController;
