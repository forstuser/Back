/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

let modals;
const excludedAttributes = {exclude: ['display_id', 'created_on', 'updated_on', 'updated_by_user_id', 'status_id']};

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
                updated_by_user_id: user.ID,
                category_name: request.payload.Name,
                status_id: 1,
                ref_id: request.payload.RefID
            },
            attributes: excludedAttributes,
            order: [['category_name', 'ASC']]
        }).then((category) = > {
            if(category[1]
    )
        {
            return reply(category[0]).header('categoryId', category.category_id).code(201);
        }

        return reply(category[0]).header('categoryId', category.category_id).code(422);
    }).
        catch((err) = > {
            console.log(err);
        reply(err);
    })
        ;
    }

    static updateCategory(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        modals.table_categories.update({
            category_level: request.payload.Level,
            updated_by_user_id: user.ID,
            category_name: request.payload.Name,
            status_id: 1,
            ref_id: request.payload.RefID
        }, {
            where: {
                category_id: request.params.id
            }
        }).then(() = > reply().code(204)
    ).
        catch((err) = > {
            console.log(err);
        reply(err);
    })
        ;
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
        }).then(() = > reply().code(204)
    ).
        catch((err) = > {
            console.log(err);
        reply(err);
    })
        ;
    }

    static retrieveCategory(request, reply) {
        modals.table_categories.findAll({
            where: {
                $or: [
                    {status_id: 1},
                    {
                        $and: [
                            {status_id: 1},
                            {ref_id: shared.verifyParameters(request.query, 'refid', '')}]
                    },
                    {
                        $and: [
                            {status_id: 1},
                            {category_level: shared.verifyParameters(request.query, 'level', '')}]
                    }]
            },
            attributes: excludedAttributes
        }).then((result) = > {
            reply(result).code(200);
    }).
        catch((err) = > {
            console.log(err);
        reply(err);
    })
        ;
    }

    static retrieveCategoryById(request, reply) {
        modals.table_categories.findOne({
            where: {
                category_id: request.params.id
            },
            attributes: excludedAttributes
        }).then((result) = > {
            reply(result).code(200);
    }).
        catch((err) = > {
            console.log(err);
        reply(err);
    })
        ;
    }

    static getCategories(request, reply) {
        const user = shared.verifyAuthorization(request.headers);
        if (!user) {
            reply({status: false, message: "Unauthorized", forceUpdate: request.pre.forceUpdate});
        } else if (!request.pre.forceUpdate) {
            // const includes = [{
            // 		modal: modals.authorizedServiceCenter,
            // 		as: 'center',
            // 		where: {brand_id: request.query.brandid},
            // 		attributes: []
            // }];
            //
            // if (request.query.brandid) {
            // 	includes.push({
            // 		model: modals.brandDetails,
            // 		as: 'details',
            // 		where: {
            // 			status_id: {
            // 				$ne: 3
            // 			},
            // 			brand_id: request.query.brandid
            // 		},
            // 		attributes: [],
            // 		required: true
            // 	});
            // }

            // return modals.categories.findAll({
            // 	where: {
            // 		status_id: {
            // 			$ne: 3
            // 		}
            // 	},
            // 	include: includes,
            // 	attributes: [['category_id', 'id'], ['display_id', 'cType'], ['category_name', 'name']],
            // 	order: ['category_name']
            // })

            let condition;

            if (request.query.brandid) {
                condition = `= ${request.query.brandid}`;
            } else {
                condition = "IS NOT NULL";
            }

            return modals.sequelize.query(`SELECT category_id, category_name from table_categories where category_id in (SELECT DISTINCT category_id from table_authorized_service_center_details where center_id in (SELECT center_id from table_authorized_service_center where brand_id ${condition}));`).then((results) = > {
                if(results.length === 0
        )
            {
                reply({status: true, categories: [], forceUpdate: request.pre.forceUpdate});
            }
        else
            {
                reply({status: true, categories: results[0], forceUpdate: request.pre.forceUpdate});
            }
        }).
            catch((err) = > {
                console.log(err);
            reply({status: false, message: "ISE"});
        })
            ;
        } else {
            reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
        }
    }
}

module.exports = CategoryController;
