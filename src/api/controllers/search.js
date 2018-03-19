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

	static retrieveSearch(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
		} else {
      return reply(
          searchAdaptor.prepareSearchResult(user, request.query.searchvalue, request.language));
		}
	}
}

export default SearchController;
