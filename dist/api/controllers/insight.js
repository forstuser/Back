/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _insight = require('../Adaptors/insight');

var _insight2 = _interopRequireDefault(_insight);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var insightAdaptor = void 0;

var InsightController = function () {
  function InsightController(modal) {
    _classCallCheck(this, InsightController);

    insightAdaptor = new _insight2.default(modal);
  }

  _createClass(InsightController, null, [{
    key: 'retrieveCategoryWiseInsight',
    value: function retrieveCategoryWiseInsight(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        return reply.response(insightAdaptor.prepareInsightData(user, request)).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveInsightForSelectedCategory',
    value: function retrieveInsightForSelectedCategory(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
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
        return reply.response(insightAdaptor.prepareCategoryInsight(user, request)).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return InsightController;
}();

exports.default = InsightController;