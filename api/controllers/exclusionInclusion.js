
const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = { exclude: ['tableBrandID', 'tableUserID', 'display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id', 'tableAuthorizedServiceCenterID'] };

class ExclusionInclusionController {
  constructor(modal) {
    modals = modal;
    modals.table_list_of_exclusions.belongsTo(modals.categories, { foreignKey: 'CatID', as: 'Categories' });
    modals.table_list_of_inclusions.belongsTo(modals.categories, { foreignKey: 'CatID', as: 'Categories' });
  }

  // Add Exclusions
  static addExclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CatID = request.payload.CatID;
    const Name = request.payload.Name;
    modals.table_list_of_exclusions.findOrCreate({
      where: {
        Name,
        CatID,
        status_id: 1
      },
      defaults: {
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((exclusionCat) => {
      if (exclusionCat[1]) {
        reply(exclusionCat[0]).headers('ExclusionID', exclusionCat[0].ID).code(201);
      } else {
        reply(exclusionCat[0]).header('ExclusionID', exclusionCat[0].ID).code(422);
      }
    });
  }

  // Add Inclusions
  static addInclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CatID = request.payload.CatID;
    const Name = request.payload.Name;
    modals.table_list_of_inclusions.findOrCreate({
      where: {
        Name,
        CatID,
        status_id: 1
      },
      defaults: {
        updated_by_user_id: user.userId
      },
      attributes: excludedAttributes
    }).then((inclusionCat) => {
      if (inclusionCat[1]) {
        reply(inclusionCat[0]).headers('InclusionID', inclusionCat[0].ID).code(201);
      } else {
        reply(inclusionCat[0]).header('InclusionID', inclusionCat[0].ID).code(422);
      }
    });
  }

  static updateExclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CatID = request.payload.CatID;
    const Name = request.payload.Name;
    modals.table_list_of_exclusions.update({
      CatID,
      Name,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(reply().code(204)).catch(err => reply(err));
  }

  static updateInclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const CatID = request.payload.CatID;
    const Name = request.payload.Name;
    modals.table_list_of_inclusions.update({
      CatID,
      Name,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(reply().code(204)).catch(err => reply(err));
  }

  static deleteExclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_list_of_exclusions.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => reply().code(204)).catch(err => reply(err));
  }

  static deleteInclusions(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    modals.table_list_of_inclusions.update({
      status_id: 3,
      updated_by_user_id: user.userId
    }, {
      where: {
        ID: request.params.id
      }
    }).then(() => reply().code(204)).catch(err => reply(err));
  }

  // Get Exclusions
  static retrieveExclusions(request, reply) {
    modals.table_list_of_exclusions.findAll({
      where: {
        status_id: 1
      },
      include: [
        { model: modals.table_categories, as: 'Categories', attributes: ['Name'] }
      ],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }

  // Get Inclusions
  static retrieveInclusions(request, reply) {
    modals.table_list_of_inclusions.findAll({
      where: {
        status_id: 1
      },
      include: [
        { model: modals.table_categories, as: 'Categories', attributes: ['Name'] }
      ],
      attributes: excludedAttributes
    }).then((result) => {
      reply(result).code(200);
    }).catch((err) => {
      reply(err);
    });
  }
}

module.exports = ExclusionInclusionController;
