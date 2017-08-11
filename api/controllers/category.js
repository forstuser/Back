/**
 * Created by arpit on 7/31/2017.
 */
const shared = require('../../helpers/shared');

let modals;

class CategoryController {
  constructor(modal) {
    modals = modal;
  }

  static addCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_categories.findOrCreate({
      where: {
        category_name: request.payload.Name,
        status_id: 1,
        ref_id: request.payload.RefID
      },
      defaults: {
        category_level: request.payload.Level,
        updated_by_user_id: user.userId
      },
      attributes: ['Name', 'RefID', 'Level', 'ID']
    }).then((category) => {
      if (category[1]) {
        return reply(category[1]).header('categoryId', category.category_id).code(201);
      }

      return reply(category[0]).header('categoryId', category.category_id).code(422);
    });
  }

  static updateCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_categories.update({
      category_name: request.payload.Name,
      status_id: 1,
      ref_id: request.payload.RefID,
      category_level: request.payload.Level,
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
    attributes: ['Name', 'RefID', 'Level', 'ID']
    }).then((result) => {
      reply(result).code(200);
    }).catch(err => reply(err));
  }

  static retrieveCategoryById(request, reply) {
    modals.table_categories.findOne({
      where: {
        category_id: request.params.id
      },
      attributes: ['Name', 'RefID', 'Level', 'ID']
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = CategoryController;
