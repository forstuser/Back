/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _search = require('../Adaptors/search');

var _search2 = _interopRequireDefault(_search);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;
let searchAdaptor;

class SearchController {
  constructor(modal) {
    searchAdaptor = new _search2.default(modal);
    modals = modal;
  }

  static retrieveSearch(request, reply) {
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
    } else {
      return reply.response(searchAdaptor.prepareSearchResult(user, request.query.searchvalue, request.language));
    }
  }
}

exports.default = SearchController;