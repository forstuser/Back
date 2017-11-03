/*jshint esversion: 6 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SearchAdaptor = require('../Adaptors/search');
var shared = require('../../helpers/shared');

var modals = void 0;
var searchAdaptor = void 0;

var SearchController = function () {
	function SearchController(modal) {
		_classCallCheck(this, SearchController);

		searchAdaptor = new SearchAdaptor(modal);
		modals = modal;
	}

	_createClass(SearchController, null, [{
		key: 'retrieveSearch',
		value: function retrieveSearch(request, reply) {
			var user = shared.verifyAuthorization(request.headers);
			if (!user) {
				reply({
					status: false,
					message: 'Unauthorized'
				});
			} else {
				reply(searchAdaptor.prepareSearchResult(user, request.query.searchvalue));
			}
		}
	}]);

	return SearchController;
}();

module.exports = SearchController;