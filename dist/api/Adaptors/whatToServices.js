'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('moment-weekday-calc');

class WhatToServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
  }

  retrieveAllStateData(options) {
    return this.modals.states.findAll({
      where: options,
      attributes: ['id', 'state_name'],
      order: [['id']]
    }).then(result => {
      const stateData = result.map(item => item.toJSON());
      const stateList = stateData.filter(stateItem => stateItem.id === 0);
      stateList.push(..._lodash2.default.orderBy(stateData.filter(stateItem => stateItem.id !== 0), ['state_name'], ['asc']));
      return stateList;
    });
  }

  retrieveStateMealItems(options, limit, offset) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.retrieveStateMeals({ where: { state_id: options.state_id, status_type: 1 } }), this.retrieveUserMeals({ where: { user_id: options.user_id, status_type: 1 } })])).spread((stateMeals, userMeals) => {
      const mealItemOptions = {
        where: {
          $or: [{
            $and: {
              id: stateMeals.map(item => item.meal_id),
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

      return _bluebird2.default.all([this.retrieveAllMealItems(mealItemOptions), userMeals]);
    }).spread((mealItems, userMeals) => mealItems.map(item => {
      const userMeal = userMeals.find(userItem => userItem.meal_id === item.id);
      item.isSelected = !!userMeal;

      return item;
    }));
  }

  retrieveUserMealItems(options, limit, offset) {
    return _bluebird2.default.try(() => this.retrieveUserMeals({
      where: {
        user_id: options.user_id,
        status_type: 1
      },
      include: {
        model: this.modals.mealUserDate,
        as: 'meal_dates',
        required: false
      }
    })).then(userMeals => {
      const mealItemOptions = {
        where: {
          id: userMeals.map(item => item.meal_id),
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

      return _bluebird2.default.all([this.retrieveAllMealItems(mealItemOptions), userMeals]);
    }).spread((mealItems, userMeals) => mealItems.map(item => {
      const userMeal = userMeals.find(userItem => userItem.meal_id === item.id);
      item.selected_times = (userMeal.meal_dates || []).filter(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSameOrBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')).length;
      let mealDates = _lodash2.default.orderBy(userMeal.meal_dates || [], ['selected_date'], ['asc']);
      const currentDateItem = mealDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const futureDateItem = mealDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      mealDates = _lodash2.default.orderBy(userMeal.meal_dates || [], ['selected_date'], ['desc']);
      const lastDateItem = mealDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
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
    })).then(result => {
      const mealItemList = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
      const mealList = mealItemList.filter(item => item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')));
      const previousMealList = mealItemList.filter(item => item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const remainingMealList = mealItemList.filter(item => !item.current_date);
      mealList.push(..._lodash2.default.orderBy(previousMealList, ['current_date'], ['asc']));
      mealList.push(...remainingMealList);

      return mealList;
    });
  }

  retrieveAllMealItems(options) {
    return this.modals.meals.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveStateMeals(options) {
    return this.modals.mealStateMap.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveUserMeals(options) {
    return this.modals.mealUserMap.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  addUserMealItem(options) {
    return _bluebird2.default.try(() => this.modals.meals.bulkCreate(options.meal_items, { returning: true })).then(mealResult => {
      console.log(JSON.stringify({ mealResult }));
      const mealItems = mealResult;
      return _bluebird2.default.all([mealItems, ...mealItems.map(mealItem => this.modals.mealStateMap.create({
        meal_id: mealItem.id,
        state_id: options.state_id
      })), ...mealItems.map(mealItem => this.modals.mealUserMap.create({
        meal_id: mealItem.id,
        user_id: options.user_id,
        state_id: options.state_id
      }))]);
    }).spread(mealItems => _bluebird2.default.all([mealItems, ...(options.current_date ? mealItems.map(mealItem => this.updateUserMealCurrentDate({
      meal_id: mealItem.id,
      user_id: options.user_id,
      current_date: options.current_date
    })) : [])])).spread(mealItems => mealItems);
  }

  prepareUserMealList(options) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.retrieveUserMeals({
      where: {
        user_id: options.user_id,
        meal_id: [...options.selected_ids, ...options.unselected_ids]
      }
    }), this.modals.mealUserMap.update({
      status_type: 2
    }, {
      where: {
        user_id: options.user_id,
        meal_id: {
          $notIn: [...options.selected_ids]
        }
      }
    })])).spread(mealResult => _bluebird2.default.all([...options.selected_ids.map(id => {
      const meal = mealResult.find(item => item.meal_id === id);
      if (meal) {
        return this.modals.mealUserMap.update({
          status_type: 1,
          state_id: options.state_id || null
        }, {
          where: {
            id: meal.id
          }
        });
      }

      return this.modals.mealUserMap.create({
        user_id: options.user_id,
        meal_id: id,
        status_type: 1,
        state_id: options.state_id || null
      });
    }), ...options.unselected_ids.map(id => {
      const meal = mealResult.find(item => item.meal_id === id);
      if (meal) {
        return this.modals.mealUserMap.update({
          status_type: 2,
          state_id: options.state_id || null
        }, {
          where: {
            id: meal.id
          }
        });
      }

      return this.modals.mealUserMap.create({
        user_id: options.user_id,
        meal_id: id,
        status_type: 2,
        state_id: options.state_id || null
      });
    })])).then(() => this.retrieveUserMealItems({
      user_id: options.user_id
    }));
  }

  updateUserMealCurrentDate(options) {
    return _bluebird2.default.try(() => this.modals.mealUserMap.findOne({
      where: {
        user_id: options.user_id,
        meal_id: options.meal_id
      }
    })).then(mealResult => {
      const meal = mealResult.toJSON();
      return this.modals.mealUserDate.findCreateFind({
        where: {
          selected_date: options.current_date,
          user_meal_id: meal.id
        }
      });
    }).then(() => this.retrieveUserMealItems({
      user_id: options.user_id
    }));
  }

  deleteUserMealCurrentDate(options) {
    return _bluebird2.default.try(() => this.modals.mealUserMap.findOne({
      where: {
        user_id: options.user_id,
        meal_id: options.meal_id
      }
    })).then(mealResult => {
      const meal = mealResult.toJSON();
      return this.modals.mealUserDate.destroy({
        where: {
          selected_date: options.current_date,
          user_meal_id: meal.id
        }
      });
    }).then(() => this.retrieveUserMealItems({
      user_id: options.user_id
    }));
  }

  removeMeals(options) {
    return _bluebird2.default.try(() => this.modals.meals.destroy(options));
  }

  addWearable(options) {
    return _bluebird2.default.try(() => this.modals.wearables.create({
      name: options.item_name,
      created_by: options.user_id,
      updated_by: options.user_id
    })).then(result => _bluebird2.default.all([result, options.current_date ? this.updateWearableCurrentDate({
      user_id: options.user_id,
      id: result.id,
      current_date: options.current_date
    }) : ''])).spread(result => result);
  }

  updateWearableCurrentDate(options) {
    return _bluebird2.default.try(() => this.modals.wearables.findOne({
      where: {
        created_by: options.user_id,
        id: options.id
      }
    })).then(wearableItems => {
      const wearable = wearableItems.toJSON();
      return this.modals.wearableDate.findCreateFind({
        where: {
          selected_date: options.current_date,
          wearable_id: wearable.id
        }
      });
    }).then(() => this.retrieveWearables({
      user_id: options.user_id
    }));
  }

  retrieveWearables(options) {
    return _bluebird2.default.try(() => this.modals.wearables.findAll({
      where: {
        created_by: options.user_id,
        image_code: {
          $ne: null
        }
      },
      include: {
        model: this.modals.wearableDate,
        as: 'wearable_dates',
        required: false
      },
      order: [['name', 'asc']]
    })).then(results => results.map(item => {
      item = item.toJSON();
      item.image_link = `/wearable/${item.id}/images/${item.image_code}`;
      let wearableDates = _lodash2.default.orderBy(item.wearable_dates || [], ['selected_date'], ['asc']);

      item.selected_times = (item.wearable_dates || []).filter(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSameOrBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')).length;
      const currentDateItem = wearableDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const futureDateItem = wearableDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      wearableDates = _lodash2.default.orderBy(item.wearable_dates || [], ['selected_date'], ['desc']);
      const lastDateItem = wearableDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
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
    })).then(result => {
      const wearableItems = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
      const wearableList = wearableItems.filter(item => item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')));
      const previousWearableList = wearableItems.filter(item => item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const remainingWearableList = wearableItems.filter(item => !item.current_date);
      wearableList.push(..._lodash2.default.orderBy(previousWearableList, ['current_date'], ['asc']));
      wearableList.push(...remainingWearableList);

      return wearableList;
    });
  }

  updateWearable(options) {
    return _bluebird2.default.try(() => this.modals.wearables.update({
      name: options.item_name,
      updated_by: options.user_id
    }, {
      where: {
        id: options.id
      }
    }));
  }

  deleteWearable(options) {
    return _bluebird2.default.try(() => this.modals.wearables.destroy({
      where: {
        id: options.id,
        created_by: options.user_id,
        updated_by: options.user_id
      }
    }));
  }

  removeWearableCurrentDate(options) {
    return _bluebird2.default.try(() => this.modals.wearables.findOne({
      where: {
        created_by: options.user_id,
        id: options.id
      }
    })).then(wearabbleItem => {
      const wearable = wearabbleItem.toJSON();
      return this.modals.wearableDate.destroy({
        where: {
          selected_date: options.current_date,
          wearable_id: wearable.id
        }
      });
    }).then(() => this.retrieveWearables({
      user_id: options.user_id
    }));
  }

  retrieveToDoList(options, limit, offset) {
    return _bluebird2.default.try(() => {
      const todoItemOptions = {
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

      return _bluebird2.default.all([this.retrieveAllTodoListItems(todoItemOptions), this.retrieveUserTodoItems({
        where: {
          user_id: options.user_id,
          status_type: 1
        }
      })]);
    }).spread((todoItems, userTodoList) => todoItems.map(item => {
      const userTodo = userTodoList.find(userItem => userItem.todo_id === item.id);
      item.isSelected = !!userTodo;

      return item;
    }));
  }

  deleteUserTodoCurrentDate(options) {
    return _bluebird2.default.try(() => this.modals.todoUserMap.findOne({
      where: {
        user_id: options.user_id,
        todo_id: options.todo_id
      }
    })).then(todoResult => {
      const todo = todoResult.toJSON();
      return this.modals.todoUserDate.destroy({
        where: {
          selected_date: options.current_date,
          user_todo_id: todo.id
        }
      });
    }).then(() => this.retrieveUserToDoList({
      user_id: options.user_id
    }));
  }

  retrieveUserToDoList(options, limit, offset) {
    return _bluebird2.default.try(() => this.retrieveUserTodoItems({
      where: {
        user_id: options.user_id,
        status_type: 1
      },
      include: {
        model: this.modals.todoUserDate,
        as: 'todo_dates',
        required: false
      }
    })).then(userTodos => {
      const todoItemOptions = {
        where: {
          id: userTodos.map(item => item.todo_id),
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

      return _bluebird2.default.all([this.retrieveAllTodoListItems(todoItemOptions), userTodos]);
    }).spread((todoItems, userTodos) => todoItems.map(item => {
      const userTodo = userTodos.find(userItem => userItem.todo_id === item.id);
      item.selected_times = (userTodo.todo_dates || []).filter(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSameOrBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')).length;
      let todoDates = _lodash2.default.orderBy(userTodo.todo_dates || [], ['selected_date'], ['asc']);
      const currentDateItem = todoDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const futureDateItem = todoDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      todoDates = _lodash2.default.orderBy(userTodo.todo_dates || [], ['selected_date'], ['desc']);
      const lastDateItem = todoDates.find(dateItem => (0, _moment2.default)(dateItem.selected_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
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
    })).then(result => {
      const todoItemList = _lodash2.default.orderBy(result, ['current_date'], ['desc']);
      const todoList = todoItemList.filter(item => item.current_date && ((0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.future_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.last_date, _moment2.default.ISO_8601).isSame(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day')));
      const previousTodoList = todoItemList.filter(item => item.current_date && (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isBefore(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day') || (0, _moment2.default)(item.current_date, _moment2.default.ISO_8601).isAfter(options.current_date ? (0, _moment2.default)(options.current_date, _moment2.default.ISO_8601) : (0, _moment2.default)(), 'day'));
      const remainingTodoList = todoItemList.filter(item => !item.current_date);
      todoList.push(..._lodash2.default.orderBy(previousTodoList, ['current_date'], ['asc']));
      todoList.push(...remainingTodoList);

      return todoList;
    });
  }

  deleteWhatTodo(options) {
    return _bluebird2.default.try(() => this.modals.todo.destroy(options));
  }

  prepareUserToDoList(options) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.retrieveUserTodoItems({
      where: {
        user_id: options.user_id,
        todo_id: [...options.selected_ids, ...options.unselected_ids]
      }
    }), this.modals.todoUserMap.update({
      status_type: 2
    }, {
      where: {
        user_id: options.user_id,
        todo_id: {
          $notIn: [...options.selected_ids, ...options.unselected_ids]
        }
      }
    })])).spread(userTodo => _bluebird2.default.all([...options.selected_ids.map(id => {
      const todoItem = userTodo.find(item => item.todo_id === id);
      if (todoItem) {
        return this.modals.todoUserMap.update({
          status_type: 1
        }, {
          where: {
            id: todoItem.id
          }
        });
      }

      return this.modals.todoUserMap.create({
        user_id: options.user_id,
        todo_id: id,
        status_type: 1
      });
    }), ...options.unselected_ids.map(id => {
      const todoItem = userTodo.find(item => item.todo_id === id);
      if (todoItem) {
        return this.modals.todoUserMap.update({
          status_type: 2
        }, {
          where: {
            id: todoItem.id
          }
        });
      }

      return this.modals.todoUserMap.create({
        user_id: options.user_id,
        todo_id: id,
        status_type: 2
      });
    })])).then(() => this.retrieveUserToDoList({
      user_id: options.user_id
    }));
  }

  updateToDoItem(options) {
    return _bluebird2.default.try(() => this.modals.todoUserMap.findOne({
      where: {
        user_id: options.user_id,
        todo_id: options.todo_id
      }
    })).then(todoResult => {
      const todoUser = todoResult.toJSON();
      return this.modals.todoUserDate.findCreateFind({
        where: {
          selected_date: options.current_date,
          user_todo_id: todoUser.id
        }
      });
    }).then(() => this.retrieveUserToDoList({
      user_id: options.user_id
    }));
  }

  addUserToDoList(options) {
    return _bluebird2.default.try(() => this.modals.todo.bulkCreate(options.todo_items, { returning: true })).then(todoList => {
      const userTodo = todoList;
      return _bluebird2.default.all([userTodo, ...userTodo.map(todoItem => this.modals.todoUserMap.create({
        todo_id: todoItem.id,
        user_id: options.user_id
      }))]);
    }).spread(userTodo => _bluebird2.default.all([userTodo, ...(options.current_date ? userTodo.map(todoItem => this.updateToDoItem({
      current_date: options.current_date,
      todo_id: todoItem.id,
      user_id: options.user_id
    })) : [])])).spread(userTodo => userTodo);
  }

  retrieveAllTodoListItems(options) {
    return this.modals.todo.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveUserTodoItems(options) {
    return this.modals.todoUserMap.findAll(options).then(result => result.map(item => item.toJSON()));
  }
}
exports.default = WhatToServiceAdaptor;