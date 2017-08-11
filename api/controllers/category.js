/**
 * Created by arpit on 7/31/2017.
 */
const shared = require('../../helpers/shared');

let modals;

class BenchMarkController {
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
      }
    }).then((category, created) => {
      if (created) {
        return reply({ statusCode: 201 }).header('categoryId', category.category_id);
      }

      return reply({ statusCode: 402, error: 'Data Exist', message: 'Data Exist.' });
    });
  }
}

module.exports = BenchMarkController;
