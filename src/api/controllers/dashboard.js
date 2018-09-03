/*jshint esversion: 6 */
'use strict';

import NotificationAdaptor from '../Adaptors/notification';
import EHomeAdaptor from '../Adaptors/ehome';
import DashboardAdaptor from '../Adaptors/dashboard';
import UserAdaptor from '../Adaptors/user';
import shared from '../../helpers/shared';

let dashboardAdaptor;
let eHomeAdaptor;
let notificationAdaptor;
let userAdaptor;
let modals;

class DashboardController {
  constructor(modal) {
    dashboardAdaptor = new DashboardAdaptor(modal);
    eHomeAdaptor = new EHomeAdaptor(modal);
    notificationAdaptor = new NotificationAdaptor(modal);
    userAdaptor = new UserAdaptor(modal);
    modals = modal;
  }

  static async getDashboard(request, reply) {
    const user = request.user || shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response(
            await dashboardAdaptor.retrieveDashboardResult(user, request));
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve dashboard.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getSellerDashboard(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (!request.pre.forceUpdate) {
        const {seller_id} = request.params;
        return reply.response(
            await dashboardAdaptor.retrieveSellerDashboard({seller_id},
                request));
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve dashboard.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async retrieveUpcomingService(request, reply) {
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response(await dashboardAdaptor.filterUpcomingService({
          id: [
            '13868',
            '14043',
            '14145',
            '14309',
            '14321',
            '14379',
            '14438',
            '14719',
            '14921',
            '14939',
            '15002',
            '15023',
            '15090',
            '15233',
            '15401',
            '15686',
            '15737',
            '15891',
            '16293',
            '16433',
            '16718',
            '16856',
            '16905',
            '17209',
            '17230',
            '17314',
            '17474',
            '17496',
            '17601',
            '17824',
            '17923',
            '17993',
            '18195',
            '18202',
            '18373',
            '18515',
            '18544',
            '18866',
            '18896',
            '18918',
            '19088',
            '19135',
            '19185',
            '19375',
            '19492',
            '19540',
            '19604',
            '19668',
            '19751',
            '19812',
            '19947',
            '20174',
            '20380',
            '20425',
            '20513',
            '20541',
            '20545',
            '20601',
            '20739',
            '20773',
            '20847',
            '20890',
            '21317',
            '21557',
            '21568',
            '21700',
            '21773',
            '21943',
            '22004',
            '22060',
            '22243',
            '22263',
            '22342',
            '22396',
            '22492',
            '22495',
            '22513',
            '22563',
            '22573',
            '22654',
            '22681',
            '22803',
            '22894',
            '22908',
            '22913',
            '22934',
            '23038',
            '23044',
            '23259',
            '23290',
            '23359',
            '23386',
            '23408',
            '23505',
            '23546',
            '23675',
            '23684',
            '23768',
            '23779',
            '24017',
            '24019',
            '24148',
            '24180',
            '24233',
            '24251',
            '24320',
            '24342',
            '24517',
            '24616',
            '24644',
            '24649',
            '24677',
            '24801',
            '24811',
            '24983',
            '25014',
            '25041',
            '25056',
            '25193',
            '25201',
            '25275',
            '25357',
            '25496',
            '25504',
            '25538',
            '25556',
            '25627',
            '25703',
            '25736',
            '25738',
            '25847',
            '26014',
            '26069',
            '26081',
            '26102',
            '26221',
            '26229',
            '26258',
            '26276',
            '26351',
            '26473',
            '26519',
            '26586',
            '26618',
            '26662',
            '26673',
            '26696',
            '26709',
            '26788',
            '26842',
            '26993',
            '27036',
            '27146',
            '27220',
            '27281',
            '27338',
            '27366',
            '27455',
            '27459',
            '27467',
            '27786',
            '27846',
            '27912',
            '27958',
            '28067',
            '28137',
            '28160',
            '28182',
            '28219',
            '28221',
            '28249',
            '28366',
            '28430',
            '28461',
            '28505',
            '28507',
            '28570',
            '28597',
            '28632',
            '28672',
            '28676',
            '28797',
            '28823',
            '28885',
            '28977',
            '28978',
            '29032',
            '29041',
            '29170',
            '29192',
            '29339',
            '29364',
            '29370',
            '29398',
            '29403',
            '29436',
            '29491',
            '29676',
            '29762',
            '29786',
            '29794',
            '29822',
            '29823',
            '29839',
            '29909',
            '29944',
            '29955',
            '29958',
            '29969',
            '29984',
            '29994',
            '30029',
            '30126',
            '30197',
            '30205',
            '30292',
            '30303',
            '30312',
            '30337',
            '30376',
            '30403',
            '30423',
            '30556',
            '30679',
            '30833',
            '30847',
            '30917',
            '30943',
            '31027',
            '31031',
            '31036',
            '31113',
            '31309',
            '31367',
            '31458',
            '31482',
            '31524',
            '31549',
            '31557',
            '31651',
            '31736',
            '31744',
            '31824',
            '31925',
            '31931',
            '31969',
            '32119',
            '32183',
            '32286',
            '32371',
            '32412',
            '32435',
            '32469',
            '32516',
            '32581',
            '32593',
            '32628',
            '32694',
            '32769',
            '32825',
            '32871',
            '33002',
            '33247',
            '33270',
            '33274',
            '33325',
            '33370',
            '33405',
            '33426',
            '33523',
            '33539',
            '33550',
            '33596',
            '33681',
            '33700',
            '33737',
            '33760',
            '33810',
            '33855',
            '33893',
            '33945',
            '34041',
            '34105',
            '34215',
            '34242',
            '34292',
            '34403',
            '34411',
            '34419',
            '34432',
            '34443',
            '34485',
            '34841',
            '34847',
            '34879',
            '35278',
            '13930',
            '14300',
            '14317',
            '14406',
            '14462',
            '14463',
            '14509',
            '14512',
            '14552',
            '14613',
            '14738',
            '14835',
            '14863',
            '14888',
            '14923',
            '14944',
            '14970',
            '15003',
            '15067',
            '15070',
            '15073',
            '15240',
            '15248',
            '15251',
            '15298',
            '15314',
            '15366',
            '15412',
            '15416',
            '15451',
            '15484',
            '15501',
            '15504',
            '15545',
            '15621',
            '15654',
            '15657',
            '15685',
            '15723',
            '15856',
            '15961',
            '16080',
            '16189',
            '16192',
            '16409',
            '16422',
            '16610',
            '16638',
            '16737',
            '16740',
            '16765',
            '16970',
            '17024',
            '17102',
            '17119',
            '17121',
            '17172',
            '17195',
            '17238',
            '17244',
            '17271',
            '17293',
            '17391',
            '17482',
            '17728',
            '17879',
            '17893',
            '17904',
            '17929',
            '17950',
            '17975',
            '18034',
            '18100',
            '18110',
            '18174',
            '18222',
            '18223',
            '18302',
            '18337',
            '18363',
            '18397',
            '18447',
            '18463',
            '18491',
            '18545',
            '18688',
            '18743',
            '18801',
            '18819',
            '18976',
            '19000',
            '19013',
            '19200',
            '19224',
            '19277',
            '19382',
            '19401',
            '19543',
            '19653',
            '19725',
            '19731',
            '19934',
            '20170',
            '20235',
            '20294',
            '20374',
            '20456',
            '20501',
            '20505',
            '20518',
            '20702',
            '20746',
            '20812',
            '20854',
            '20865',
            '21037',
            '21207',
            '21362',
            '21441',
            '21642',
            '21678',
            '21867',
            '22075',
            '22173',
            '22174',
            '22235',
            '22436',
            '22539',
            '22623',
            '22624',
            '23033',
            '23136',
            '23177',
            '23190',
            '23233',
            '23303',
            '23343',
            '23446',
            '23482',
            '23557',
            '23714',
            '23745',
            '23801',
            '23873',
            '24106',
            '24114',
            '24126',
            '24181',
            '24449',
            '24530',
            '24675',
            '24723',
            '24789',
            '24842',
            '24942',
            '24950',
            '25012',
            '25673',
            '25706',
            '25788',
            '25833',
            '26024',
            '26171',
            '26188',
            '26196',
            '26360',
            '26624',
            '26654',
            '26775',
            '26839',
            '26850',
            '26921',
            '26971'],
        }, request));
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve dashboard.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getEHome(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    const language = request.language;
    try {
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response(
            await eHomeAdaptor.prepareEHomeResult(user, request, language)).
            code(200);
      } else if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve eHome data.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getProductsInCategory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply.response(
            await eHomeAdaptor.prepareProductDetail({
              user,
              masterCategoryId: request.params.id,
              ctype: request.query.subCategoryId,
              brandIds: (request.query.brandids || '[]').split('[')[1].split(
                  ']')[0].split(',').filter(Boolean),
              categoryIds: (request.query.categoryids ||
                  '[]').split('[')[1].split(']')[0].split(',').filter(Boolean),
              offlineSellerIds: (request.query.offlinesellerids || '[]').split(
                  '[')[1].split(']')[0].split(',').filter(Boolean),
              onlineSellerIds: (request.query.onlinesellerids || '[]').split(
                  '[')[1].split(']')[0].split(',').filter(Boolean),
              sortBy: request.query.sortby,
              searchValue: request.query.searchvalue,
              request,
            })).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve category product list.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getEHomeProducts(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const {brand_id, category_id, offline_seller_id, online_seller_id, sort_by, search_value, limit, offset} = request.query;
        return reply.response(
            await eHomeAdaptor.retrieveEHomeProducts({
              user, type: parseInt(request.params.type), sort_by, search_value,
              request, brand_id: (brand_id || '').split(',').filter(Boolean),
              category_id: (category_id || '').split(',').filter(Boolean),
              offline_seller_id: (offline_seller_id || '').split(',').
                  filter(Boolean),
              online_seller_id: (online_seller_id || '').split(',').
                  filter(Boolean), limit, offset,
            })).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve category product list.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async updateNotificationStatus(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else {
        await notificationAdaptor.updateNotificationStatus(user,
            request.payload.notificationIds);
        return reply.response({status: true}).code(201);
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to update notification status.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static async getMailbox(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (!request.pre.forceUpdate && user) {
        return reply.response(
            await notificationAdaptor.retrieveNotifications(user, request)).
            code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {

      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve mails now.',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static notifyUser(request, reply) {
    const payload = request.payload ||
        {userId: '', data: {title: '', description: ''}};
    notificationAdaptor.notifyUser({
      userId: payload.userId || '',
      payload: payload.data,
      reply: reply
    });
  }
}

export default DashboardController;
