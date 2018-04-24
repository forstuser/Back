'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('moment-weekday-calc');

var WhatToServiceAdaptor = function () {
  function WhatToServiceAdaptor(modals) {
    _classCallCheck(this, WhatToServiceAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
  }

  _createClass(WhatToServiceAdaptor, [{
    key: 'retrieveAllStateData',
    value: function retrieveAllStateData(options) {
      return this.modals.states.findAll({
        where: options,
        attributes: ['id', 'state_name'],
        order: [['state_name']]
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveStateMealItems',
    value: function retrieveStateMealItems(options, limit, offset) {
      var _this = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this.retrieveStateMeals({ where: { state_id: options.state_id, status_type: 1 } }), _this.retrieveUserMeals({ where: { user_id: options.user_id, status_type: 1 } })]);
      }).spread(function (stateMeals, userMeals) {
        var mealItemOptions = {
          where: {
            id: stateMeals.map(function (item) {
              return item.meal_id;
            })
          },
          order: [['meal_name', 'asc']]
        };
        if (options.is_veg) {
          mealItemOptions.where.is_veg = options.is_veg;
        }

        if (limit) {
          mealItemOptions.limit = limit;
        }

        if (offset) {
          mealItemOptions.offset = offset;
        }

        return _bluebird2.default.all([_this.retrieveAllMealItems(mealItemOptions), userMeals]);
      }).spread(function (mealItems, userMeals) {
        return mealItems.map(function (item) {
          var userMeal = userMeals.find(function (userItem) {
            return userItem.meal_id === item.id;
          });
          item.isSelected = !!userMeal;

          return item;
        });
      });
    }
  }, {
    key: 'retrieveUserMealItems',
    value: function retrieveUserMealItems(options, limit, offset) {
      var _this2 = this;

      return _bluebird2.default.try(function () {
        return _this2.retrieveUserMeals({
          where: {
            user_id: options.user_id, status_type: 1
          },
          include: {
            model: _this2.modals.mealUserDate,
            as: 'meal_dates',
            required: false
          }
        });
      }).then(function (userMeals) {
        var mealItemOptions = {
          where: {
            id: userMeals.map(function (item) {
              return item.meal_id;
            }),
            $or: $or
          },
          order: [['meal_name', 'asc']]
        };
        if (options.is_veg) {
          mealItemOptions.where.is_veg = options.is_veg;
        }

        if (limit) {
          mealItemOptions.limit = limit;
        }

        if (offset) {
          mealItemOptions.offset = offset;
        }

        return _bluebird2.default.all([_this2.retrieveAllMealItems(mealItemOptions), userMeals]);
      }).spread(function (mealItems, userMeals) {
        return mealItems.map(function (item) {
          var userMeal = userMeals.find(function (userItem) {
            return userItem.meal_id === item.id;
          });
          var mealDates = _lodash2.default.orderBy(userMeal.meal_dates || [], ['selected_date'], ['asc']);
          var currentDateItem = mealDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          var futureDateItem = mealDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          mealDates = _lodash2.default.orderBy(userMeal.meal_dates || [], ['selected_date'], ['desc']);
          var lastDateItem = mealDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          if (currentDateItem) {
            item.current_date = currentDateItem.selected_date;
            item.future_date = futureDateItem ? futureDateItem.selected_date : currentDateItem.selected_date;
            item.last_date = lastDateItem ? lastDateItem.selected_date : currentDateItem.selected_date;
          } else if (futureDateItem) {
            item.current_date = futureDateItem.selected_date;
            item.future_date = futureDateItem.selected_date;
            item.last_date = lastDateItem ? lastDateItem.selected_date : futureDateItem.selected_date;
          } else if (lastDateItem) {
            item.current_date = lastDateItem.selected_date;
            item.last_date = lastDateItem.selected_date;
          } else {
            item.current_date = (0, _moment2.default)().subtract(30, 'd');
          }

          item.state_id = userMeal.state_id;

          return item;
        });
      }).then(function (result) {
        var mealItemList = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
        var mealList = mealItemList.filter(function (item) {
          return (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
        });
        var remainingMealList = mealItemList.filter(function (item) {
          return item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
        });
        mealList.push.apply(mealList, _toConsumableArray(_lodash2.default.orderBy(remainingMealList, ['current_date'], ['desc'])));

        return mealList;
      });
    }
  }, {
    key: 'retrieveAllMealItems',
    value: function retrieveAllMealItems(options) {
      return this.modals.meals.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveStateMeals',
    value: function retrieveStateMeals(options) {
      return this.modals.mealStateMap.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveUserMeals',
    value: function retrieveUserMeals(options) {
      return this.modals.mealUserMap.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'addUserMealItem',
    value: function addUserMealItem(options) {
      var _this3 = this;

      _bluebird2.default.try(function () {
        return _this3.modals.meals.findCreateFind({
          where: {
            created_by: options.user_id,
            updated_by: options.user_id,
            meal_name: options.meal_name,
            is_veg: !(options.is_veg && options.is_veg === false),
            status_type: 11
          }
        });
      }).then(function (mealResult) {
        var mealItem = mealResult[0].toJSON();
        _bluebird2.default.all([mealItem, _this3.modals.mealStateMap.create({
          meal_id: mealItem.id,
          state_id: options.state_id
        }), _this3.modals.mealUserMap.create({
          meal_id: mealItem.id,
          user_id: options.user_id
        })]);
      }).spread(function (mealItem) {
        return mealItem;
      });
    }
  }, {
    key: 'prepareUserMealList',
    value: function prepareUserMealList(options) {
      var _this4 = this;

      _bluebird2.default.try(function () {
        return _this4.retrieveUserMeals({
          user_id: options.user_id,
          meal_id: [].concat(_toConsumableArray(options.selected_ids), _toConsumableArray(options.unselected_ids))
        });
      }).then(function (mealResult) {
        return _bluebird2.default.all([].concat(_toConsumableArray(options.selected_ids.map(function (id) {
          var meal = mealResult.find(function (item) {
            return item.meal_id === id;
          });
          if (meal) {
            return _this4.modals.mealUserMap.update({
              status_type: 1,
              state_id: options.state_id
            }, {
              where: {
                id: meal.id
              }
            });
          }

          return _this4.modals.mealUserMap.create({
            user_id: options.user_id,
            meal_id: id,
            status_type: 1,
            state_id: options.state_id
          });
        })), _toConsumableArray(options.unselected_ids.map(function (id) {
          var meal = mealResult.find(function (item) {
            return item.meal_id === id;
          });
          if (meal) {
            return _this4.modals.mealUserMap.update({
              status_type: 2,
              state_id: options.state_id
            }, {
              where: {
                id: meal.id
              }
            });
          }

          return _this4.modals.mealUserMap.create({
            user_id: options.user_id,
            meal_id: id,
            status_type: 2,
            state_id: options.state_id
          });
        }))));
      }).then(function () {
        return _this4.retrieveUserMealItems({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'updateUserMealCurrentDate',
    value: function updateUserMealCurrentDate(options) {
      var _this5 = this;

      _bluebird2.default.try(function () {
        return _this5.modals.mealUserMap.findOne({
          user_id: options.user_id,
          meal_id: options.meal_id
        });
      }).then(function (mealResult) {
        var meal = mealResult.toJSON();
        return _this5.modals.mealUserDate.findCreateFind({
          where: {
            selected_date: options.current_date,
            user_meal_id: meal.id
          }
        });
      }).then(function () {
        return _this5.retrieveUserMealItems({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'deleteUserMealCurrentDate',
    value: function deleteUserMealCurrentDate(options) {
      var _this6 = this;

      _bluebird2.default.try(function () {
        return _this6.modals.mealUserMap.findOne({
          user_id: options.user_id,
          meal_id: options.meal_id
        });
      }).then(function (mealResult) {
        var meal = mealResult.toJSON();
        return _this6.modals.mealUserDate.destroy({
          selected_date: options.current_date,
          user_meal_id: meal.id
        });
      }).then(function () {
        return _this6.retrieveUserMealItems({
          user_id: options.user_id
        });
      });
    }
  }]);

  return WhatToServiceAdaptor;
}();

exports.default = WhatToServiceAdaptor;