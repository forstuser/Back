'use strict';
import Hapi from 'hapi';
import hapiJWT from 'hapi-auth-jwt2';
import hapiSwagger from 'hapi-swagger';
import inert from 'inert';
import vision from 'vision';
import models from './api/models';
import config from './config/main';
import routers from './routes/router';
// Create a server with a host and port

const PORT = config.APP.PORT || 8443;

const init = async () => {
  const server = new Hapi.Server({
    port: PORT,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Content-Type', 'Authorization', 'language'],
      },
    },
  });

  await server.register(
      {
        plugin: inert,
      });
  await server.register({
    plugin: vision,
  });
  await server.register({
    plugin: hapiSwagger,
    options: {
      info: {
        title: 'Consumer API Documentation',
        version: '1.0.0',
      },
    },
  });
  await server.register(hapiJWT);
  const jwtKey = config.JWT_SECRET;
  server.auth.strategy('jwt', 'jwt',
      {
        key: jwtKey.toString(),
        validate: (decoded, request, callback) => {
          if (!decoded) {
            return callback(null, false);
          }

          return callback(null, true);
        },
        verifyOptions: {algorithms: ['HS512']}, // pick a strong algorithm
      });

  await server.start();
  return server;
};

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
/*if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const TLS_OPTIONS = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/key.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.crt')),
    ca: fs.readFileSync(path.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
  };

  server.options.tls = TLS_OPTIONS;
}*/

const initModel = () => {
  models.sequelize.sync().then(() => {
    init().then((server) => {
      routers(server, models);
      process.on('unhandledRejection', (err) => {
        console.log(err);
        models.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({err}),
        }).
            catch((ex) => console.log('error while logging on db,', ex));

        process.exit(1);
      });
      process.on('UnhandledPromiseRejectionWarning', (err) => {
        console.log(err);
        models.logs.create({
          log_type: 2,
          user_id: 1,
          log_content: JSON.stringify({err}),
        }).
            catch((ex) => console.log('error while logging on db,', ex));

        process.exit(1);
      });
    });
  }).catch(err =>
      console.log(
          `Error at start up is as follow: \n \n ${err}`));
};
export default {
  initModel,
};