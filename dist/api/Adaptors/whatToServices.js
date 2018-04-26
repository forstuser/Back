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
            $or: [{
              $and: {
                id: stateMeals.map(function (item) {
                  return item.meal_id;
                }),
                status_type: 1
              }
            }, {
              $and: {
                created_by: options.user_id,
                status_type: [1, 11]
              }
            }]
          },
          order: [['item_type', 'asc'], ['name', 'asc']]
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
            user_id: options.user_id,
            status_type: 1
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
            $or: {
              status_type: 1,
              $and: {
                created_by: options.user_id,
                status_type: [1, 11]
              }
            }
          },
          order: [['name', 'asc']]
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
          }

          item.state_id = userMeal.state_id;

          return item;
        });
      }).then(function (result) {
        var mealItemList = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
        var mealList = mealItemList.filter(function (item) {
          return item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
        });
        var previousMealList = mealItemList.filter(function (item) {
          return item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
        });
        var remainingMealList = mealItemList.filter(function (item) {
          return !item.current_date;
        });
        mealList.push.apply(mealList, _toConsumableArray(remainingMealList));
        mealList.push.apply(mealList, _toConsumableArray(_lodash2.default.orderBy(previousMealList, ['current_date'], ['desc'])));

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

      return _bluebird2.default.try(function () {
        return _this3.modals.meals.bulkCreate(options.meal_items, { returning: true });
      }).then(function (mealResult) {
        console.log(JSON.stringify({ mealResult: mealResult }));
        var mealItems = mealResult;
        return _bluebird2.default.all([mealItems].concat(_toConsumableArray(mealItems.map(function (mealItem) {
          return _this3.modals.mealStateMap.create({
            meal_id: mealItem.id,
            state_id: options.state_id
          });
        })), _toConsumableArray(mealItems.map(function (mealItem) {
          return _this3.modals.mealUserMap.create({
            meal_id: mealItem.id,
            user_id: options.user_id,
            state_id: options.state_id
          });
        }))));
      }).spread(function (mealItems) {
        return _bluebird2.default.all([mealItems].concat(_toConsumableArray(options.current_date ? mealItems.map(function (mealItem) {
          return _this3.updateUserMealCurrentDate({
            meal_id: mealItem.id,
            user_id: options.user_id,
            current_date: options.current_date
          });
        }) : [])));
      }).spread(function (mealItems) {
        return mealItems;
      });
    }
  }, {
    key: 'prepareUserMealList',
    value: function prepareUserMealList(options) {
      var _this4 = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this4.retrieveUserMeals({
          user_id: options.user_id,
          meal_id: [].concat(_toConsumableArray(options.selected_ids), _toConsumableArray(options.unselected_ids))
        }), _this4.modals.mealUserMap.update({
          status_type: 2
        }, {
          where: {
            user_id: options.user_id,
            meal_id: {
              $notIn: [].concat(_toConsumableArray(options.selected_ids), _toConsumableArray(options.unselected_ids))
            }
          }
        })]);
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

      return _bluebird2.default.try(function () {
        return _this5.modals.mealUserMap.findOne({
          where: {
            user_id: options.user_id,
            meal_id: options.meal_id
          }
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

      return _bluebird2.default.try(function () {
        return _this6.modals.mealUserMap.findOne({
          where: {
            user_id: options.user_id,
            meal_id: options.meal_id
          }
        });
      }).then(function (mealResult) {
        var meal = mealResult.toJSON();
        return _this6.modals.mealUserDate.destroy({
          where: {
            selected_date: options.current_date,
            user_meal_id: meal.id
          }
        });
      }).then(function () {
        return _this6.retrieveUserMealItems({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'removeMeals',
    value: function removeMeals(options) {
      var _this7 = this;

      return _bluebird2.default.try(function () {
        return _this7.modals.meals.destroy(options);
      });
    }
  }, {
    key: 'addWearable',
    value: function addWearable(options) {
      var _this8 = this;

      return _bluebird2.default.try(function () {
        return _this8.modals.wearables.create({
          name: options.item_name,
          created_by: options.user_id,
          updated_by: options.user_id
        });
      }).then(function (result) {
        return _bluebird2.default.all([result, options.current_date ? _this8.updateWearableCurrentDate({
          user_id: options.user_id,
          id: result.id,
          current_date: options.current_date
        }) : '']);
      }).spread(function (result) {
        return result;
      });
    }
  }, {
    key: 'updateWearableCurrentDate',
    value: function updateWearableCurrentDate(options) {
      var _this9 = this;

      return _bluebird2.default.try(function () {
        return _this9.modals.wearables.findOne({
          where: {
            created_by: options.user_id,
            id: options.id
          }
        });
      }).then(function (wearableItems) {
        var wearable = wearableItems.toJSON();
        return _this9.modals.wearableDate.findCreateFind({
          where: {
            selected_date: options.current_date,
            wearable_id: wearable.id
          }
        });
      }).then(function () {
        return _this9.retrieveWearables({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'retrieveWearables',
    value: function retrieveWearables(options) {
      var _this10 = this;

      return _bluebird2.default.try(function () {
        return _this10.modals.wearables.findAll({
          where: {
            created_by: options.user_id,
            image_code: {
              $ne: null
            }
          },
          include: {
            model: _this10.modals.wearableDate,
            as: 'wearable_dates',
            required: false
          },
          order: [['name', 'asc']]
        });
      }).then(function (results) {
        return results.map(function (item) {
          item = item.toJSON();
          item.image_link = '/wearable/' + item.id + '/images/' + item.image_code;
          var wearableDates = _lodash2.default.orderBy(item.wearable_dates || [], ['selected_date'], ['asc']);
          var currentDateItem = wearableDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          var futureDateItem = wearableDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          wearableDates = _lodash2.default.orderBy(item.wearable_dates || [], ['selected_date'], ['desc']);
          var lastDateItem = wearableDates.find(function (dateItem) {
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
          }

          return item;
        });
      }).then(function (result) {
        var wearableItems = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
        var wearableList = wearableItems.filter(function (item) {
          return item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
        });
        var previousWearableList = wearableItems.filter(function (item) {
          return item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
        });
        var remainingWearableList = wearableItems.filter(function (item) {
          return !item.current_date;
        });
        wearableList.push.apply(wearableList, _toConsumableArray(remainingWearableList));
        wearableList.push.apply(wearableList, _toConsumableArray(_lodash2.default.orderBy(previousWearableList, ['current_date'], ['desc'])));

        return wearableList;
      });
    }
  }, {
    key: 'updateWearable',
    value: function updateWearable(options) {
      var _this11 = this;

      return _bluebird2.default.try(function () {
        return _this11.modals.wearables.update({
          name: options.item_name,
          updated_by: options.user_id
        }, {
          where: {
            id: options.id
          }
        });
      });
    }
  }, {
    key: 'deleteWearable',
    value: function deleteWearable(options) {
      var _this12 = this;

      return _bluebird2.default.try(function () {
        return _this12.modals.wearables.destroy({
          where: {
            id: options.id,
            created_by: options.user_id,
            updated_by: options.user_id
          }
        });
      });
    }
  }, {
    key: 'removeWearableCurrentDate',
    value: function removeWearableCurrentDate(options) {
      var _this13 = this;

      return _bluebird2.default.try(function () {
        return _this13.modals.wearables.findOne({
          where: {
            created_by: options.user_id,
            id: options.id
          }
        });
      }).then(function (wearabbleItem) {
        var wearable = wearabbleItem.toJSON();
        return _this13.modals.wearableDate.destroy({
          where: {
            selected_date: options.current_date,
            wearable_id: wearable.id
          }
        });
      }).then(function () {
        return _this13.retrieveWearables({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'retrieveToDoList',
    value: function retrieveToDoList(options, limit, offset) {
      var _this14 = this;

      return _bluebird2.default.try(function () {
        var todoItemOptions = {
          where: {
            $or: {
              status_type: 1,
              $and: {
                created_by: options.user_id,
                status_type: [1, 11]
              }
            }
          },
          order: [['item_type', 'asc'], ['name', 'asc']]
        };

        if (limit) {
          todoItemOptions.limit = limit;
        }

        if (offset) {
          todoItemOptions.offset = offset;
        }

        return _bluebird2.default.all([_this14.retrieveAllTodoListItems(todoItemOptions), _this14.retrieveUserTodoItems({
          where: {
            user_id: options.user_id,
            status_type: 1
          }
        })]);
      }).spread(function (todoItems, userTodoList) {
        return todoItems.map(function (item) {
          var userTodo = userTodoList.find(function (userItem) {
            return userItem.todo_id === item.id;
          });
          item.isSelected = !!userTodo;

          return item;
        });
      });
    }
  }, {
    key: 'deleteUserTodoCurrentDate',
    value: function deleteUserTodoCurrentDate(options) {
      var _this15 = this;

      return _bluebird2.default.try(function () {
        return _this15.modals.todoUserMap.findOne({
          where: {
            user_id: options.user_id,
            todo_id: options.todo_id
          }
        });
      }).then(function (todoResult) {
        var todo = todoResult.toJSON();
        return _this15.modals.todoUserDate.destroy({
          where: {
            selected_date: options.current_date,
            user_todo_id: todo.id
          }
        });
      }).then(function () {
        return _this15.retrieveUserToDoList({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'retrieveUserToDoList',
    value: function retrieveUserToDoList(options, limit, offset) {
      var _this16 = this;

      return _bluebird2.default.try(function () {
        return _this16.retrieveUserTodoItems({
          where: {
            user_id: options.user_id,
            status_type: 1
          },
          include: {
            model: _this16.modals.todoUserDate,
            as: 'todo_dates',
            required: false
          }
        });
      }).then(function (userTodos) {
        var todoItemOptions = {
          where: {
            id: userTodos.map(function (item) {
              return item.todo_id;
            }),
            $or: {
              status_type: 1,
              $and: {
                created_by: options.user_id,
                status_type: [1, 11]
              }
            }
          },
          order: [['name', 'asc']]
        };

        if (limit) {
          todoItemOptions.limit = limit;
        }

        if (offset) {
          todoItemOptions.offset = offset;
        }

        return _bluebird2.default.all([_this16.retrieveAllTodoListItems(todoItemOptions), userTodos]);
      }).spread(function (todoItems, userTodos) {
        return todoItems.map(function (item) {
          var userTodo = userTodos.find(function (userItem) {
            return userItem.todo_id === item.id;
          });
          var todoDates = _lodash2.default.orderBy(userTodo.todo_dates || [], ['selected_date'], ['asc']);
          var currentDateItem = todoDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          var futureDateItem = todoDates.find(function (dateItem) {
            return (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
          });
          todoDates = _lodash2.default.orderBy(userTodo.todo_dates || [], ['selected_date'], ['desc']);
          var lastDateItem = todoDates.find(function (dateItem) {
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
          }

          return item;
        });
      }).then(function (result) {
        var todoItemList = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
        var todoList = todoItemList.filter(function (item) {
          return item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
        });
        var previousTodoList = todoItemList.filter(function (item) {
          return item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day');
        });
        var remainingTodoList = todoItemList.filter(function (item) {
          return !item.current_date;
        });
        todoList.push.apply(todoList, _toConsumableArray(remainingTodoList));
        todoList.push.apply(todoList, _toConsumableArray(_lodash2.default.orderBy(previousTodoList, ['current_date'], ['desc'])));

        return todoList;
      });
    }
  }, {
    key: 'deleteWhatTodo',
    value: function deleteWhatTodo(options) {
      var _this17 = this;

      return _bluebird2.default.try(function () {
        return _this17.modals.todo.destroy(options);
      });
    }
  }, {
    key: 'prepareUserToDoList',
    value: function prepareUserToDoList(options) {
      var _this18 = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this18.retrieveUserTodoItems({
          where: {
            user_id: options.user_id,
            todo_id: [].concat(_toConsumableArray(options.selected_ids), _toConsumableArray(options.unselected_ids))
          }
        }), _this18.modals.todoUserMap.update({
          status_type: 2
        }, {
          where: {
            user_id: options.user_id,
            todo_id: {
              $notIn: [].concat(_toConsumableArray(options.selected_ids), _toConsumableArray(options.unselected_ids))
            }
          }
        })]);
      }).spread(function (userTodo) {
        return _bluebird2.default.all([].concat(_toConsumableArray(options.selected_ids.map(function (id) {
          var todoItem = userTodo.find(function (item) {
            return item.todo_id === id;
          });
          if (todoItem) {
            return _this18.modals.todoUserMap.update({
              status_type: 1
            }, {
              where: {
                id: todoItem.id
              }
            });
          }

          return _this18.modals.todoUserMap.create({
            user_id: options.user_id,
            todo_id: id,
            status_type: 1
          });
        })), _toConsumableArray(options.unselected_ids.map(function (id) {
          var todoItem = userTodo.find(function (item) {
            return item.todo_id === id;
          });
          if (todoItem) {
            return _this18.modals.todoUserMap.update({
              status_type: 2
            }, {
              where: {
                id: todoItem.id
              }
            });
          }

          return _this18.modals.todoUserMap.create({
            user_id: options.user_id,
            todo_id: id,
            status_type: 2
          });
        }))));
      }).then(function () {
        return _this18.retrieveUserToDoList({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'updateToDoItem',
    value: function updateToDoItem(options) {
      var _this19 = this;

      return _bluebird2.default.try(function () {
        return _this19.modals.todoUserMap.findOne({
          where: {
            user_id: options.user_id,
            todo_id: options.todo_id
          }
        });
      }).then(function (todoResult) {
        var todoUser = todoResult.toJSON();
        return _this19.modals.todoUserDate.findCreateFind({
          where: {
            selected_date: options.current_date,
            user_todo_id: todoUser.id
          }
        });
      }).then(function () {
        return _this19.retrieveUserToDoList({
          user_id: options.user_id
        });
      });
    }
  }, {
    key: 'addUserToDoList',
    value: function addUserToDoList(options) {
      var _this20 = this;

      return _bluebird2.default.try(function () {
        return _this20.modals.todo.bulkCreate(options.todo_items, { returning: true });
      }).then(function (todoList) {
        var userTodo = todoList;
        return _bluebird2.default.all([userTodo].concat(_toConsumableArray(userTodo.map(function (todoItem) {
          return _this20.modals.todoUserMap.create({
            todo_id: todoItem.id,
            user_id: options.user_id
          });
        }))));
      }).spread(function (userTodo) {
        return _bluebird2.default.all([userTodo].concat(_toConsumableArray(options.current_date ? userTodo.map(function (todoItem) {
          return _this20.updateToDoItem({
            current_date: options.current_date,
            todo_id: todoItem.id,
            user_id: options.user_id
          });
        }) : [])));
      }).spread(function (userTodo) {
        return userTodo;
      });
    }
  }, {
    key: 'retrieveAllTodoListItems',
    value: function retrieveAllTodoListItems(options) {
      return this.modals.todo.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveUserTodoItems',
    value: function retrieveUserTodoItems(options) {
      return this.modals.todoUserMap.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }]);

  return WhatToServiceAdaptor;
}();

exports.default = WhatToServiceAdaptor;