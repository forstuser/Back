import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import ProductAdaptor from './product';

require('moment-weekday-calc');

export default class WhatToServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
  }

  retrieveAllStateData(options) {
    return this.modals.states.findAll({
      where: options,
      attributes: [
        'id',
        'state_name',
      ],
      order: [['state_name']],
    }).then((result) => result.map((item) => item.toJSON()));
  }

  retrieveStateMealItems(options, limit, offset) {
    return Promise.try(() => Promise.all([
      this.retrieveStateMeals(
          {where: {state_id: options.state_id, status_type: 1}}),
      this.retrieveUserMeals(
          {where: {user_id: options.user_id, status_type: 1}})])).
        spread((stateMeals, userMeals) => {
          const mealItemOptions = {
            where: {
              id: stateMeals.map((item) => item.meal_id),
            },
            order: [['meal_name', 'asc']],
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

          return Promise.all(
              [this.retrieveAllMealItems(mealItemOptions), userMeals]);
        }).spread((mealItems, userMeals) => mealItems.map((item) => {
          const userMeal = userMeals.find(
              (userItem) => userItem.meal_id === item.id);
          item.isSelected = !!(userMeal);

          return item;
        }));
  }

  retrieveUserMealItems(options, limit, offset) {
    return Promise.try(() => this.retrieveUserMeals(
        {
          where: {
            user_id: options.user_id, status_type: 1,
          },
          include: {
            model: this.modals.mealUserDate,
            as: 'meal_dates',
            required: false,
          },
        })).
        then((userMeals) => {
          const mealItemOptions = {
            where: {
              id: userMeals.map((item) => item.meal_id),
              $or: {
                created_by: options.user_id,
                status_type: [1, 11],
              },
            },
            order: [['meal_name', 'asc']],
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

          return Promise.all(
              [this.retrieveAllMealItems(mealItemOptions), userMeals]);
        }).spread((mealItems, userMeals) => mealItems.map((item) => {
          const userMeal = userMeals.find(
              (userItem) => userItem.meal_id === item.id);
          let mealDates = _.orderBy(
              (userMeal.meal_dates || []), ['selected_date'],
              ['asc']);
          const currentDateItem = mealDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isSame(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          const futureDateItem = mealDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isAfter(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          mealDates = _.orderBy(
              (userMeal.meal_dates || []), ['selected_date'],
              ['desc']);
          const lastDateItem = mealDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isBefore(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          if (currentDateItem) {
            item.current_date = currentDateItem.selected_date;
            item.future_date = futureDateItem ?
                futureDateItem.selected_date :
                currentDateItem.selected_date;
            item.last_date = lastDateItem ?
                lastDateItem.selected_date :
                currentDateItem.selected_date;
          } else if (futureDateItem) {
            item.current_date = futureDateItem.selected_date;
            item.future_date = futureDateItem.selected_date;
            item.last_date = lastDateItem ?
                lastDateItem.selected_date :
                futureDateItem.selected_date;
          } else if (lastDateItem) {
            item.current_date = lastDateItem.selected_date;
            item.last_date = lastDateItem.selected_date;
          } else {
            item.current_date = moment().subtract(30, 'd');
          }

          item.state_id = userMeal.state_id;

          return item;
        })).then((result) => {
          const mealItemList = _.orderBy(
              result, ['current_date'],
              ['desc']);
          const mealList = mealItemList.filter(
              (item) => moment(item.current_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.future_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.last_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day'));
          const remainingMealList = mealItemList.filter(
              (item) => (item.current_date &&
                  moment(item.current_date, moment.ISO_8601).
                      isBefore(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.current_date, moment.ISO_8601).
                      isAfter(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day')));
          mealList.push(...(_.orderBy(
              remainingMealList, ['current_date'],
              ['desc'])));

          return mealList;
        });
  }

  retrieveAllMealItems(options) {
    return this.modals.meals.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveStateMeals(options) {
    return this.modals.mealStateMap.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveUserMeals(options) {
    return this.modals.mealUserMap.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  addUserMealItem(options) {
    Promise.try(() => this.modals.meals.findCreateFind({
      where: {
        created_by: options.user_id,
        updated_by: options.user_id,
        meal_name: options.meal_name,
        is_veg: !(options.is_veg && options.is_veg === false),
        status_type: 11,
      },
    })).then((mealResult) => {
      const mealItem = mealResult[0].toJSON();
      Promise.all([
        mealItem, this.modals.mealStateMap.create({
          meal_id: mealItem.id,
          state_id: options.state_id,
        }), this.modals.mealUserMap.create({
          meal_id: mealItem.id,
          user_id: options.user_id,
        })]);
    }).spread((mealItem) => mealItem);
  }

  prepareUserMealList(options) {
    return Promise.try(() => this.retrieveUserMeals({
      user_id: options.user_id,
      meal_id: [...options.selected_ids, ...options.unselected_ids],
    })).then((mealResult) => Promise.all([
      ...options.selected_ids.map((id) => {
        const meal = mealResult.find((item) => item.meal_id === id);
        if (meal) {
          return this.modals.mealUserMap.update({
            status_type: 1,
            state_id: options.state_id,
          }, {
            where: {
              id: meal.id,
            },
          });
        }

        return this.modals.mealUserMap.create({
          user_id: options.user_id,
          meal_id: id,
          status_type: 1,
          state_id: options.state_id,
        });
      }),
      ...options.unselected_ids.map((id) => {
        const meal = mealResult.find((item) => item.meal_id === id);
        if (meal) {
          return this.modals.mealUserMap.update({
            status_type: 2,
            state_id: options.state_id,
          }, {
            where: {
              id: meal.id,
            },
          });
        }

        return this.modals.mealUserMap.create({
          user_id: options.user_id,
          meal_id: id,
          status_type: 2,
          state_id: options.state_id,
        });
      })])).then(() => this.retrieveUserMealItems({
      user_id: options.user_id,
    }));
  }

  updateUserMealCurrentDate(options) {
    return Promise.try(() => this.modals.mealUserMap.findOne({
      user_id: options.user_id,
      meal_id: options.meal_id,
    })).then((mealResult) => {
      const meal = mealResult.toJSON();
      return this.modals.mealUserDate.findCreateFind({
        where: {
          selected_date: options.current_date,
          user_meal_id: meal.id,
        },
      });
    }).then(() => this.retrieveUserMealItems({
      user_id: options.user_id,
    }));
  }

  deleteUserMealCurrentDate(options) {
    return Promise.try(() => this.modals.mealUserMap.findOne({
      user_id: options.user_id,
      meal_id: options.meal_id,
    })).then((mealResult) => {
      const meal = mealResult.toJSON();
      return this.modals.mealUserDate.destroy({
        selected_date: options.current_date,
        user_meal_id: meal.id,
      });
    }).then(() => this.retrieveUserMealItems({
      user_id: options.user_id,
    }));
  }

  retrieveToDoList(options, limit, offset) {
    return Promise.try(() => {
      const todoItemOptions = {
        where: {
          status_type: 1,
          $or: {
            created_by: options.user_id,
            status_type: [1, 11],
          },
        },
        order: [['name', 'asc']],
      };

      if (limit) {
        todoItemOptions.limit = limit;
      }

      if (offset) {
        todoItemOptions.offset = offset;
      }

      return Promise.all(
          [
            this.retrieveAllTodoListItems(todoItemOptions),
            this.retrieveUserTodoItems(
                {
                  where: {
                    user_id: options.user_id,
                    status_type: 1,
                  },
                })]);
    }).spread((todoItems, userTodoList) => todoItems.map((item) => {
      const userTodo = userTodoList.find(
          (userItem) => userItem.todo_id === item.id);
      item.isSelected = !!(userTodo);

      return item;
    }));
  }

  deleteUsertodoCurrentDate(options) {
    return Promise.try(() => this.modals.todoUserMap.findOne({
      user_id: options.user_id,
      todo_id: options.todo_id,
    })).then((todoResult) => {
      const meal = todoResult.toJSON();
      return this.modals.todoUserDate.destroy({
        selected_date: options.current_date,
        user_meal_id: meal.id,
      });
    }).then(() => this.retrieveUserTodoItems({
      user_id: options.user_id,
    }));
  }

  retrieveUserToDoList(options, limit, offset) {
    return Promise.try(() => this.retrieveUserTodoItems(
        {
          where: {
            user_id: options.user_id,
            status_type: 1,
          },
          include: {
            model: this.modals.todoUserDate,
            as: 'todo_dates',
            required: false,
          },
        })).
        then((userTodos) => {
          const todoItemOptions = {
            where: {
              id: userTodos.map((item) => item.meal_id),
              status_type: 1,
              $or: {
                created_by: options.user_id,
                status_type: [1, 11],
              },
            },
            order: [['name', 'asc']],
          };

          if (limit) {
            todoItemOptions.limit = limit;
          }

          if (offset) {
            todoItemOptions.offset = offset;
          }

          return Promise.all(
              [this.retrieveAllTodoListItems(todoItemOptions), userTodos]);
        }).spread((todoItems, userTodos) => todoItems.map((item) => {
          const userTodo = userTodos.find(
              (userItem) => userItem.todo_id === item.id);
          let todoDates = _.orderBy(
              (userTodo.todo_dates || []), ['selected_date'],
              ['asc']);
          const currentDateItem = todoDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isSame(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          const futureDateItem = todoDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isAfter(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          todoDates = _.orderBy(
              (userTodo.todo_dates || []), ['selected_date'],
              ['desc']);
          const lastDateItem = todoDates.find(
              (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
                  isBefore(options.current_date ?
                      moment(options.current_date, moment.ISO_8601) :
                      moment(), 'day'));
          if (currentDateItem) {
            item.current_date = currentDateItem.selected_date;
            item.future_date = futureDateItem ?
                futureDateItem.selected_date :
                currentDateItem.selected_date;
            item.last_date = lastDateItem ?
                lastDateItem.selected_date :
                currentDateItem.selected_date;
          } else if (futureDateItem) {
            item.current_date = futureDateItem.selected_date;
            item.future_date = futureDateItem.selected_date;
            item.last_date = lastDateItem ?
                lastDateItem.selected_date :
                futureDateItem.selected_date;
          } else if (lastDateItem) {
            item.current_date = lastDateItem.selected_date;
            item.last_date = lastDateItem.selected_date;
          } else {
            item.current_date = moment().subtract(30, 'd');
          }

          return item;
        })).then((result) => {
          const mealItemList = _.orderBy(
              result, ['current_date'],
              ['desc']);
          const mealList = mealItemList.filter(
              (item) => moment(item.current_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.future_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.last_date, moment.ISO_8601).
                      isSame(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day'));
          const remainingMealList = mealItemList.filter(
              (item) => (item.current_date &&
                  moment(item.current_date, moment.ISO_8601).
                      isBefore(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day') ||
                  moment(item.current_date, moment.ISO_8601).
                      isAfter(options.current_date ?
                          moment(options.current_date, moment.ISO_8601) :
                          moment(), 'day')));
          mealList.push(...(_.orderBy(
              remainingMealList, ['current_date'],
              ['desc'])));

          return mealList;
        });
  }

  deleteWhatTodo(options) {
    return Promise.try(() => this.modals.todo.destroy(options));
  }

  prepareUserToDoList(options) {
    return Promise.try(() => this.retrieveUserTodoItems({
      user_id: options.user_id,
      todo_id: [...options.selected_ids, ...options.unselected_ids],
    })).then((userTodo) => Promise.all([
      ...options.selected_ids.map((id) => {
        const todoItem = userTodo.find((item) => item.todo_id === id);
        if (todoItem) {
          return this.modals.todoUserMap.update({
            status_type: 1,
          }, {
            where: {
              id: todoItem.id,
            },
          });
        }

        return this.modals.todoUserMap.create({
          user_id: options.user_id,
          todo_id: id,
          status_type: 1,
        });
      }),
      ...options.unselected_ids.map((id) => {
        const todoItem = userTodo.find((item) => item.todo_id === id);
        if (todoItem) {
          return this.modals.todoUserMap.update({
            status_type: 2,
          }, {
            where: {
              id: todoItem.id,
            },
          });
        }

        return this.modals.todoUserMap.create({
          user_id: options.user_id,
          todo_id: id,
          status_type: 2,
        });
      })])).then(() => this.retrieveUserTodoItems({
      user_id: options.user_id,
    }));
  }

  updateToDoItem(options) {
    return Promise.try(() => this.modals.todolUserMap.findOne({
      user_id: options.user_id,
      todo_id: options.todo_id,
    })).then((todoResult) => {
      const todoUser = todoResult.toJSON();
      return this.modals.todoUserDate.findCreateFind({
        where: {
          selected_date: options.current_date,
          user_todo_id: todoUser.id,
        },
      });
    }).then(() => this.retrieveUserTodoItems({
      user_id: options.user_id,
    }));
  }

  addUserToDoList(options) {
    return Promise.try(() => this.modals.todo.bulkCreate(options.todo_items,
        {returning: true})).then((todoList) => {
      const userTodo = todoList;
      return Promise.all([
        userTodo,
        ...userTodo.map((todoItem) => this.modals.todoUserMap.create({
          todo_id: todoItem.id,
          user_id: options.user_id,
        }))]);
    }).spread((userTodo) => userTodo);
  }

  retrieveAllTodoListItems(options) {
    return this.modals.todo.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  retrieveUserTodoItems(options) {
    return this.modals.todoUserMap.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }
}
