'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _repairs = require('../Adaptors/repairs');

var _repairs2 = _interopRequireDefault(_repairs);

var _sellers = require('../Adaptors/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var repairAdaptor = void 0;
var sellerAdaptor = void 0;

var ProductItemController = function() {
  function ProductItemController(modal) {
    _classCallCheck(this, ProductItemController);

    repairAdaptor = new _repairs2.default(modal);
    sellerAdaptor = new _sellers2.default(modal);
  }

  _createClass(ProductItemController, null, [
    {
      key: 'updateRepair',
      value: function updateRepair(request, reply) {
        var user = _shared2.default.verifyAuthorization(request.headers);
        if (!user) {
          return reply({
            status: false,
            message: 'Unauthorized',
            forceUpdate: request.pre.forceUpdate,
          });
        } else if (user && !request.pre.forceUpdate) {
          var sellerPromise = !request.payload.seller_id &&
          (request.payload.seller_contact || request.payload.seller_name) ?
              sellerAdaptor.retrieveOrCreateOfflineSellers({
                contact_no: request.payload.seller_contact,
              }, {
                seller_name: request.payload.seller_name,
                contact_no: request.payload.contact_no,
                updated_by: user.id || user.ID,
                created_by: user.id || user.ID,
                address: request.payload.seller_address,
                status_type: 11,
              }) :
              '';
          sellerPromise.then(function(sellerList) {
            var productId = request.params.id;
            var repairId = request.params.repairId;
            var newSellerId = sellerList ? sellerList.sid : undefined;
            var document_date = _moment2.default.utc(
                request.payload.document_date, _moment2.default.ISO_8601).
                isValid() ?
                _moment2.default.utc(request.payload.document_date,
                    _moment2.default.ISO_8601).startOf('day') :
                _moment2.default.utc(request.payload.document_date,
                    'DD MMM YY').startOf('day');
            var repairPromise = repairId ?
                repairAdaptor.updateRepairs(repairId, {
                  updated_by: user.id || user.ID,
                  status_type: 11,
                  product_id: productId,
                  seller_id: request.payload.seller_id || newSellerId,
                  document_date: _moment2.default.utc(document_date).
                      format('YYYY-MM-DD'),
                  repair_for: request.payload.repair_for,
                  repair_cost: request.payload.value,
                  warranty_upto: request.payload.warranty_upto,
                  user_id: user.id || user.ID,
                }) :
                repairAdaptor.createRepairs({
                  updated_by: user.id || user.ID,
                  status_type: 11,
                  product_id: productId,
                  document_date: _moment2.default.utc(document_date).
                      format('YYYY-MM-DD'),
                  seller_id: request.payload.seller_id || newSellerId,
                  repair_for: request.payload.repair_for,
                  repair_cost: request.payload.value,
                  warranty_upto: request.payload.warranty_upto,
                  user_id: user.id || user.ID,
                });
            return repairPromise.then(function(result) {
              if (result) {
                return reply({
                  status: true,
                  message: 'successfull',
                  repair: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'Repair already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            });
          }).catch(function(err) {
            console.log('Error on ' + new Date() + ' for user ' +
                (user.id || user.ID) + ' is as follow: \n \n ' + err);
            return reply({
              status: false,
              message: 'An error occurred in product creation.',
              forceUpdate: request.pre.forceUpdate,
              err: err,
            });
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

  return ProductItemController;
}();

exports.default = ProductItemController;