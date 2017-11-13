/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true,
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modals = void 0;
var excludedAttributes = {
  exclude: [
    'display_id',
    'created_on',
    'updated_on',
    'updated_by_user_id',
    'status_id'],
};

var BrandController = function () {
  function BrandController(modal) {
    _classCallCheck(this, BrandController);

    modals = modal;
  }

  _createClass(BrandController, null, [
    {
      key: 'getBrands',
      value: function getBrands(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (!user) {
          reply({status: false, message: 'Unauthorized'});
        } else if (!request.pre.forceUpdate) {
          var categoryId = request.query.categoryid || undefined;

          var options = {
            status_type: 1,
            category_id: categoryId,
          };

          if (categoryId) {
            options.category_id = categoryId;
          }

          return _bluebird2.default.try(function() {
            if (categoryId) {
              return modals.brands.findAll({
                where: {
                  status_type: 1,
                },
                include: [
                  {
                    model: modals.brandDetails,
                    as: 'details',
                    where: options,
                    required: true,
                  }, {
                    model: modals.serviceCenters,
                    as: 'centers',
                    attributes: [],
                    required: true,
                  }],
                order: [['brand_name', 'ASC']],
                attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
              });
            } else {
              return modals.brands.findAll({
                where: {
                  status_type: 1,
                },
                order: [['brand_name', 'ASC']],
                attributes: [['brand_name', 'brandName'], ['brand_id', 'id']],
                include: [
                  {
                    model: modals.serviceCenters,
                    as: 'centers',
                    attributes: [],
                    required: true,
                  }],
              });
            }
          }).then(function(results) {
            reply({
              status: true,
              message: 'Successful',
              brands: results,
              forceUpdate: request.pre.forceUpdate,
            });
          }).catch(function(err) {
            console.log({API_Logs: err});
            reply({
              status: false,
              message: 'Something wrong',
              forceUpdate: request.pre.forceUpdate,
            }).code(500);
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

  return BrandController;
}();

exports.default = BrandController;