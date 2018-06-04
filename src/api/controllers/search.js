/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import SearchAdaptor from '../Adaptors/search';

let modals;
let searchAdaptor;

class SearchController {
  constructor(modal) {
    searchAdaptor = new SearchAdaptor(modal);
    modals = modal;
  }

  static async retrieveSearch(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      const result = await searchAdaptor.prepareSearchResult(user,
          request.query.searchvalue,
          request.language);
      return reply.response(result);
    }
  }
}

export default SearchController;
