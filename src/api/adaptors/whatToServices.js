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

  async retrieveAllStateData(options) {
    let stateData = await this.modals.states.findAll({
      where: options,
      attributes: [
        'id',
        'state_name',
      ],
      order: [['id']],
    });
    stateData = stateData.map((item) => item.toJSON());
    const stateList = stateData.filter((stateItem) => stateItem.id === 0);
    stateList.push(...(_.orderBy(
        stateData.filter((stateItem) => stateItem.id !== 0), ['state_name'],
        ['asc'])));
    return stateList;
  }

  async retrieveStateMealItems(options, limit, offset) {
    const [stateMeals, userMeals] = await Promise.all([
      this.retrieveStateMeals(
          {where: {state_id: options.state_id, status_type: 1}}),
      this.retrieveUserMeals(
          {where: {user_id: options.user_id, status_type: 1}})]);
    const mealItemOptions = {
      where: {
        $or: [
          {
            $and: {
              id: stateMeals.map((item) => item.meal_id),
              status_type: 1,
            },
          }, {
            $and: {
              created_by: options.user_id,
              status_type: [1, 11],
            },
          }],
      },
      order: [['item_type', 'asc'], ['name', 'asc']],
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

    const mealItems = this.retrieveAllMealItems(mealItemOptions);
    return mealItems.map((item) => {
      const userMeal = userMeals.find(
          (userItem) => userItem.meal_id === item.id);
      item.isSelected = !!(userMeal);

      return item;
    });
  }

  async retrieveUserMealItems(options, limit, offset) {
    const userMeals = await this.retrieveUserMeals(
        {
          where: {
            user_id: options.user_id,
            status_type: 1,
          },
          include: {
            model: this.modals.mealUserDate,
            as: 'meal_dates',
            required: false,
          },
        });
    const mealItemOptions = {
      where: {
        id: userMeals.map((item) => item.meal_id),
        $or: {
          status_type: 1,
          $and: {
            created_by: options.user_id,
            status_type: [1, 11],
          },
        },
      },
      order: [['name', 'asc']],
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

    let mealItems = await this.retrieveAllMealItems(mealItemOptions);
    mealItems = mealItems.map((item) => {
      const userMeal = userMeals.find(
          (userItem) => userItem.meal_id === item.id);
      item.selected_times = (userMeal.meal_dates || []).filter(
          (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
              isSameOrBefore(options.current_date ?
                  moment(options.current_date, moment.ISO_8601) :
                  moment(), 'day')).length;
      let mealDates = _.orderBy((userMeal.meal_dates || []), ['selected_date'],
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
      }

      item.state_id = userMeal.state_id;

      return item;
    });
    mealItems = _.orderBy(mealItems, ['current_date'], ['desc']);
    const mealList = mealItems.filter((item) => item.current_date &&
        (moment(item.current_date, moment.ISO_8601).
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
                    moment(), 'day')));
    const previousMealList = mealItems.filter((item) => (item.current_date &&
        moment(item.current_date, moment.ISO_8601).
            isBefore(options.current_date ?
                moment(options.current_date, moment.ISO_8601) :
                moment(), 'day') ||
        moment(item.current_date, moment.ISO_8601).
            isAfter(options.current_date ?
                moment(options.current_date, moment.ISO_8601) :
                moment(), 'day')));
    const remainingMealList = mealItems.filter((item) => (!item.current_date));
    mealList.push(...(_.orderBy(previousMealList, ['current_date'], ['asc'])));
    mealList.push(...remainingMealList);

    return mealList;
  }

  async retrieveAllMealItems(options) {
    const result = await this.modals.meals.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveStateMeals(options) {
    const result = await this.modals.mealStateMap.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveUserMeals(options) {
    const result = await this.modals.mealUserMap.findAll(options);
    return result.map(item => item.toJSON());
  }

  async addUserMealItem(options) {
    const mealItems = await this.modals.meals.bulkCreate(options.meal_items,
        {returning: true});
    await Promise.all([
      ...mealItems.map((mealItem) => this.modals.mealStateMap.create({
        meal_id: mealItem.id,
        state_id: options.state_id,
      })),
      ...mealItems.map((mealItem) => this.modals.mealUserMap.create({
        meal_id: mealItem.id,
        user_id: options.user_id,
        state_id: options.state_id,
      }))]);
    await Promise.all([
      ...(options.current_date ?
          mealItems.map((mealItem) => this.updateUserMealCurrentDate({
            meal_id: mealItem.id,
            user_id: options.user_id,
            current_date: options.current_date,
          })) : [])]);
    return mealItems;
  }

  async prepareUserMealList(options) {
    const [mealResult] = await Promise.all([
      this.retrieveUserMeals({
        where: {
          user_id: options.user_id,
          meal_id: [...options.selected_ids, ...options.unselected_ids],
        },
      }), this.modals.mealUserMap.update({
        status_type: 2,
      }, {
        where: {
          user_id: options.user_id,
          meal_id: {
            $notIn: [...options.selected_ids],
          },
        },
      })]);
    await Promise.all([
      ...options.selected_ids.map((id) => {
        const meal = mealResult.find((item) => item.meal_id === id);
        if (meal) {
          return this.modals.mealUserMap.update({
            status_type: 1,
            state_id: options.state_id || null,
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
          state_id: options.state_id || null,
        });
      }),
      ...options.unselected_ids.map((id) => {
        const meal = mealResult.find((item) => item.meal_id === id);
        if (meal) {
          return this.modals.mealUserMap.update({
            status_type: 2,
            state_id: options.state_id || null,
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
          state_id: options.state_id || null,
        });
      })]);
    return await this.retrieveUserMealItems({
      user_id: options.user_id,
    });
  }

  async updateUserMealCurrentDate(options) {
    const mealResult = await this.modals.mealUserMap.findOne({
      where: {
        user_id: options.user_id,
        meal_id: options.meal_id,
      },
    });
    const meal = mealResult.toJSON();
    await this.modals.mealUserDate.findCreateFind({
      where: {
        selected_date: options.current_date,
        user_meal_id: meal.id,
      },
    });
    return await this.retrieveUserMealItems({
      user_id: options.user_id,
    });
  }

  async deleteUserMealCurrentDate(options) {
    const mealResult = await this.modals.mealUserMap.findOne({
      where: {
        user_id: options.user_id,
        meal_id: options.meal_id,
      },
    });
    const meal = mealResult.toJSON();
    await this.modals.mealUserDate.destroy({
      where: {
        selected_date: options.current_date,
        user_meal_id: meal.id,
      },
    });

    return await this.retrieveUserMealItems({
      user_id: options.user_id,
    });
  }

  async removeMeals(options) {
    return await this.modals.meals.destroy(options);
  }

  async addWearable(options) {
    const result = await this.modals.wearables.create({
      name: options.item_name,
      created_by: options.user_id,
      updated_by: options.user_id,
    });
    await Promise.all([

      options.current_date ? this.updateWearableCurrentDate({
        user_id: options.user_id,
        id: result.id,
        current_date: options.current_date,
      }) : '']);
    return result;
  }

  async updateWearableCurrentDate(options) {
    let wearableItem = await this.modals.wearables.findOne({
      where: {
        created_by: options.user_id,
        id: options.id,
      },
    });
    wearableItem = wearableItem.toJSON();
    await this.modals.wearableDate.findCreateFind({
      where: {
        selected_date: options.current_date,
        wearable_id: wearableItem.id,
      },
    });

    return await this.retrieveWearables({
      user_id: options.user_id,
    });
  }

  async retrieveWearables(options) {
    let results = await this.modals.wearables.findAll({
      where: {
        created_by: options.user_id,
        image_code: {
          $ne: null,
        },
      },
      include: {
        model: this.modals.wearableDate,
        as: 'wearable_dates',
        required: false,
      },
      order: [['name', 'asc']],
    });
    results = results.map((item) => {
      item = item.toJSON();
      item.image_link = `/wearable/${item.id}/images/${item.image_code}`;
      let wearableDates = _.orderBy(
          (item.wearable_dates || []), ['selected_date'],
          ['asc']);

      item.selected_times = (item.wearable_dates || []).filter(
          (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
              isSameOrBefore(options.current_date ?
                  moment(options.current_date, moment.ISO_8601) :
                  moment(), 'day')).length;
      const currentDateItem = wearableDates.find(
          (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
              isSame(options.current_date ?
                  moment(options.current_date, moment.ISO_8601) :
                  moment(), 'day'));
      const futureDateItem = wearableDates.find(
          (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
              isAfter(options.current_date ?
                  moment(options.current_date, moment.ISO_8601) :
                  moment(), 'day'));
      wearableDates = _.orderBy(
          (item.wearable_dates || []), ['selected_date'],
          ['desc']);
      const lastDateItem = wearableDates.find(
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
      }

      return item;
    });

    const wearableItems = _.orderBy(
        results, ['current_date'],
        ['desc']);
    const wearableList = wearableItems.filter(
        (item) => item.current_date &&
            (moment(item.current_date, moment.ISO_8601).
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
                        moment(), 'day')));
    const previousWearableList = wearableItems.filter(
        (item) => (item.current_date &&
            moment(item.current_date, moment.ISO_8601).
                isBefore(options.current_date ?
                    moment(options.current_date, moment.ISO_8601) :
                    moment(), 'day') ||
            moment(item.current_date, moment.ISO_8601).
                isAfter(options.current_date ?
                    moment(options.current_date, moment.ISO_8601) :
                    moment(), 'day')));
    const remainingWearableList = wearableItems.filter(
        (item) => (!item.current_date));
    wearableList.push(...(_.orderBy(
        previousWearableList, ['current_date'],
        ['asc'])));
    wearableList.push(...remainingWearableList);

    return wearableList;
  }

  async updateWearable(options) {
    return await this.modals.wearables.update({
      name: options.item_name,
      updated_by: options.user_id,
    }, {
      where: {
        id: options.id,
      },
    });
  }

  async deleteWearable(options) {
    return await this.modals.wearables.destroy({
      where: {
        id: options.id,
        created_by: options.user_id,
        updated_by: options.user_id,
      },
    });
  }

  async removeWearableCurrentDate(options) {
    let wearable = await this.modals.wearables.findOne({
      where: {
        created_by: options.user_id,
        id: options.id,
      },
    });
    wearable = wearable.toJSON();
    await this.modals.wearableDate.destroy({
      where: {
        selected_date: options.current_date,
        wearable_id: wearable.id,
      },
    });
    return await this.retrieveWearables({
      user_id: options.user_id,
    });
  }

  async retrieveToDoList(options, limit, offset) {
    const todoItemOptions = {
      where: {
        $or: {
          status_type: 1,
          $and: {
            created_by: options.user_id,
            status_type: [1, 11],
          },
        },
      },
      order: [['item_type', 'asc'], ['name', 'asc']],
    };

    if (limit) {
      todoItemOptions.limit = limit;
    }

    if (offset) {
      todoItemOptions.offset = offset;
    }

    const [todoItems, userTodoList] = await Promise.all(
        [
          this.retrieveAllTodoListItems(todoItemOptions),
          this.retrieveUserTodoItems(
              {
                where: {
                  user_id: options.user_id,
                  status_type: 1,
                },
              })]);
    return todoItems.map((item) => {
      const userTodo = userTodoList.find(
          (userItem) => userItem.todo_id === item.id);
      item.isSelected = !!(userTodo);

      return item;
    });
  }

  async deleteUserTodoCurrentDate(options) {
    let todo = await this.modals.todoUserMap.findOne({
      where: {
        user_id: options.user_id,
        todo_id: options.todo_id,
      },
    });

    todo = todo.toJSON();
    await this.modals.todoUserDate.destroy({
      where: {
        selected_date: options.current_date,
        user_todo_id: todo.id,
      },
    });
    return await this.retrieveUserToDoList({
      user_id: options.user_id,
    });
  }

  async retrieveUserToDoList(options, limit, offset) {
    const userTodos = await this.retrieveUserTodoItems(
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
        });
    const todoItemOptions = {
      where: {
        id: userTodos.map((item) => item.todo_id),
        $or: {
          status_type: 1,
          $and: {
            created_by: options.user_id,
            status_type: [1, 11],
          },
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

    let todoItems = await this.retrieveAllTodoListItems(todoItemOptions);
    todoItems = todoItems.map((item) => {
      const userTodo = userTodos.find(
          (userItem) => userItem.todo_id === item.id);
      item.selected_times = (userTodo.todo_dates || []).filter(
          (dateItem) => moment(dateItem.selected_date, moment.ISO_8601).
              isSameOrBefore(options.current_date ?
                  moment(options.current_date, moment.ISO_8601) :
                  moment(), 'day')).length;
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
      }

      return item;
    });
    todoItems = _.orderBy(
        todoItems, ['current_date'],
        ['desc']);
    const todoList = todoItems.filter(
        (item) => item.current_date &&
            (moment(item.current_date, moment.ISO_8601).
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
                        moment(), 'day')));
    const previousTodoList = todoItems.filter(
        (item) => (item.current_date &&
            moment(item.current_date, moment.ISO_8601).
                isBefore(options.current_date ?
                    moment(options.current_date, moment.ISO_8601) :
                    moment(), 'day') ||
            moment(item.current_date, moment.ISO_8601).
                isAfter(options.current_date ?
                    moment(options.current_date, moment.ISO_8601) :
                    moment(), 'day')));
    const remainingTodoList = todoItems.filter(
        (item) => (!item.current_date));
    todoList.push(...(_.orderBy(
        previousTodoList, ['current_date'],
        ['asc'])));
    todoList.push(...remainingTodoList);

    return todoList;
  }

  async deleteWhatTodo(options) {
    return await this.modals.todo.destroy(options);
  }

  async prepareUserToDoList(options) {
    const [userTodo] = await Promise.all([
      this.retrieveUserTodoItems({
        where: {
          user_id: options.user_id,
          todo_id: [...options.selected_ids, ...options.unselected_ids],
        },
      }), this.modals.todoUserMap.update({
        status_type: 2,
      }, {
        where: {
          user_id: options.user_id,
          todo_id: {
            $notIn: [
              ...options.selected_ids,
              ...options.unselected_ids],
          },
        },
      })]);
    await Promise.all([
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
      })]);
    return await this.retrieveUserToDoList({
      user_id: options.user_id,
    });
  }

  async updateToDoItem(options) {
    let todoUser = this.modals.todoUserMap.findOne({
      where: {
        user_id: options.user_id,
        todo_id: options.todo_id,
      },
    });
    todoUser = todoUser.toJSON();
    await this.modals.todoUserDate.findCreateFind({
      where: {
        selected_date: options.current_date,
        user_todo_id: todoUser.id,
      },
    });
    return await this.retrieveUserToDoList({
      user_id: options.user_id,
    });
  }

  async addUserToDoList(options) {
    let userTodo = await this.modals.todo.bulkCreate(options.todo_items,
        {returning: true});
    await Promise.all(
        userTodo.map((todoItem) => this.modals.todoUserMap.create({
          todo_id: todoItem.id,
          user_id: options.user_id,
        })));
    if (options.current_date) {
      await Promise.all(userTodo.map((todoItem) => this.updateToDoItem({
        current_date: options.current_date,
        todo_id: todoItem.id,
        user_id: options.user_id,
      })));
    }
    return userTodo;
  }

  async retrieveAllTodoListItems(options) {
    const result = await this.modals.todo.findAll(options);
    return result.map(item => item.toJSON());
  }

  async retrieveUserTodoItems(options) {
    const result = await this.modals.todoUserMap.findAll(options);
    return result.map(item => item.toJSON());
  }
}
