/*jshint esversion: 6 */
'use strict';

const SearchAdaptor = require('../Adaptors/search');
const shared = require('../../helpers/shared');

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

module.exports = SearchController;
