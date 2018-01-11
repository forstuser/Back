import moment from 'moment/moment';
import shared from '../../helpers/shared';
import RepairAdaptor from '../Adaptors/repairs';
import SellerAdaptor from '../Adaptors/sellers';

let repairAdaptor;
let sellerAdaptor;

class ProductItemController {
  constructor(modal) {
    repairAdaptor = new RepairAdaptor(modal);
    sellerAdaptor = new SellerAdaptor(modal);
  }

  static updateRepair(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const sellerPromise = !request.payload.seller_id &&
      (request.payload.seller_contact ||
          request.payload.seller_name) ?
          sellerAdaptor.retrieveOrCreateOfflineSellers({
                contact_no: request.payload.seller_contact,
              },
              {
                seller_name: request.payload.seller_name,
                contact_no: request.payload.contact_no,
                updated_by: user.id || user.ID,
                created_by: user.id || user.ID,
                address: request.payload.seller_address,
                status_type: 11,
              }) :
          '';
      sellerPromise.then(sellerList => {
        const productId = request.params.id;
        const repairId = request.params.repairId;
        const newSellerId = sellerList ? sellerList.sid : undefined;
        const document_date = moment.utc(request.payload.document_date,
            moment.ISO_8601).isValid() ?
            moment.utc(request.payload.document_date, moment.ISO_8601).
                startOf('day') :
            moment.utc(request.payload.document_date, 'DD MMM YY').
                startOf('day');
        const repairPromise = repairId ?
            repairAdaptor.updateRepairs(repairId, {
              updated_by: user.id || user.ID,
              status_type: 11,
              product_id: productId,
              seller_id: request.payload.seller_id || newSellerId,
              document_date: moment.utc(document_date).format('YYYY-MM-DD'),
              repair_for: request.payload.repair_for,
              repair_cost: request.payload.value,
              warranty_upto: request.payload.warranty_upto,
              user_id: user.id || user.ID,
            }) :
            repairAdaptor.createRepairs({
              updated_by: user.id || user.ID,
              status_type: 11,
              product_id: productId,
              document_date: moment.utc(document_date).format('YYYY-MM-DD'),
              seller_id: request.payload.seller_id || newSellerId,
              repair_for: request.payload.repair_for,
              repair_cost: request.payload.value,
              warranty_upto: request.payload.warranty_upto,
              user_id: user.id || user.ID,
            });
        return repairPromise.
            then((result) => {
              if (result) {
                return reply({
                  status: true,
                  message: 'successfull',
                  repair: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              } else {
                return reply({
                  status: false,
                  message: 'Repair already exist.',
                  forceUpdate: request.pre.forceUpdate,
                });
              }
            });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in product creation.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default ProductItemController;