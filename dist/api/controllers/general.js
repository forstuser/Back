/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
				value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _notification = require('../Adaptors/notification');

var _notification2 = _interopRequireDefault(_notification);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contactModel = void 0;
var modals = void 0;

var GeneralController = function () {
				function GeneralController(modal) {
								_classCallCheck(this, GeneralController);

								contactModel = modal.contactUs;
								modals = modal;
				}

				_createClass(GeneralController, null, [{
								key: 'contactUs',
								value: function contactUs(request, reply) {
												_notification2.default.sendLinkOnMessage(request.payload.phone);
												contactModel.create({
																name: request.payload.name,
																phone: request.payload.phone,
																email: request.payload.email,
																message: request.payload.message
												}).then(function () {
																reply({ status: true }).code(201);
												}).catch(function (err) {
																console.log({ API_Logs: err });
																reply({ status: false }).code(500);
												});
								}
				}, {
								key: 'retrieveFAQs',
								value: function retrieveFAQs(request, reply) {
												modals.faqs.findAll({
																where: {
																				status_id: {
																								$ne: 3
																				}
																}
												}).then(function (faq) {
																reply({ status: true, faq: faq }).code(200);
												}).catch(function (err) {
																console.log({ API_Logs: err });
																reply({ status: false }).code(200);
												});
								}
				}]);

				return GeneralController;
}();

exports.default = GeneralController;