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
    try {
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
        return reply.response(await searchAdaptor.prepareSearchResult(user,
            request.query.searchvalue, request.language));
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to fetch product.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }
}

export default SearchController;
