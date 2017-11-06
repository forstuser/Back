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
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized'
			});
		} else {
			reply(searchAdaptor.prepareSearchResult(user, request.query.searchvalue));
		}
	}
}

export default SearchController;