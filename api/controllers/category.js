/**
 * Created by arpit on 8/11/2017.
 */
const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = { exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id'] };

class CategoryController {
  constructor(modal) {
    modals = modal;
  }

  static addCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_categories.findOrCreate({
      where: {
        Name: request.payload.Name,
        status_id: 1,
        RefID: request.payload.RefID
      },
      defaults: {
        Level: request.payload.Level,
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((category) => {
      if (category[1]) {
        return reply(category[0]).header('categoryId', category.ID).code(201);
      }

      return reply(category[0]).header('categoryId', category.ID).code(422);
    }).catch((err) => {
      reply(err);
    });
  }

  static updateCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_categories.update({
      Name: request.payload.Name,
      status_id: 1,
      RefID: request.payload.RefID,
      Level: request.payload.Level,
      updated_by_user_id: user.userId
    }, {
      where: {
        category_id: request.params.id
      }
    }).then(() => reply().code(204)).catch(err => reply(err));
  }

  static deleteCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_categories.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        category_id: request.params.id
      }
    }).then(() => reply().code(204)).catch(err => reply(err));
  }

  static retrieveCategory(request, reply) {
    modals.table_categories.findAll({ where: {
      $or: [
        { status_id: 1 },
        {
          $and: [
            { status_id: 1 },
            { ref_id: shared.verifyParameters(request.query, 'refid', '') }]
        },
        {
          $and: [
            { status_id: 1 },
            { category_level: shared.verifyParameters(request.query, 'level', '') }]
        }]
    },
    attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch(err => reply(err));
  }

  static retrieveCategoryById(request, reply) {
    modals.table_categories.findOne({
      where: {
        category_id: request.params.id
      },
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = CategoryController;
