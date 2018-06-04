/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _insight = require('../Adaptors/insight');

var _insight2 = _interopRequireDefault(_insight);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let insightAdaptor;

class InsightController {
  constructor(modal) {
    insightAdaptor = new _insight2.default(modal);
  }

  static async retrieveCategoryWiseInsight(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response((await insightAdaptor.prepareInsightData(user, request))).code(200);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static async retrieveInsightForSelectedCategory(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response((await insightAdaptor.prepareCategoryInsight(user, request))).code(200);
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }
}

exports.default = InsightController;