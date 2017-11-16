/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modals = void 0;

var CategoryController = function () {
  function CategoryController(modal) {
    _classCallCheck(this, CategoryController);

    modals = modal;
  }

  _createClass(CategoryController, null, [
    {
      key: 'getCategories',
      value: function getCategories(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (!user) {
          reply({
            status: false,
            message: 'Unauthorized',
            forceUpdate: request.pre.forceUpdate,
          });
        } else if (!request.pre.forceUpdate) {
          var condition = void 0;

          if (request.query.brandid) {
            condition = '= ' + request.query.brandid;
          } else {
            condition = 'IS NOT NULL';
          }

          return modals.sequelize.query('SELECT category_id, category_name from categories where category_id in (SELECT DISTINCT category_id from service_center_details where center_id in (SELECT center_id from center_brand_mapping where brand_id ' +
              condition + ')) order by category_name;').then(function(results) {
            if (results.length === 0) {
              reply({
                status: true,
                categories: [],
                forceUpdate: request.pre.forceUpdate,
              });
            } else {
              reply({
                status: true,
                categories: results[0],
                forceUpdate: request.pre.forceUpdate,
              });
            }
          }).catch(function(err) {
            console.log({API_Logs: err});
            reply({status: false, message: 'ISE'});
          });
        } else {
          reply({
            status: false,
            message: 'Forbidden',
            forceUpdate: request.pre.forceUpdate,
          });
        }
      },
    }]);

  return CategoryController;
}();

exports.default = CategoryController;