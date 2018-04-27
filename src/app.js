'use strict';
import fs from 'fs';
import path from 'path';
import Hapi from 'hapi';
import hapiJWT from 'hapi-auth-jwt2';
import cors from 'hapi-cors';
import hapiSwagger from 'hapi-swagger';
import inert from 'inert';
import vision from 'vision';
import models from './api/models';
import config from './config/main';
import routers from './routes/router';
// Create a server with a host and port
const server = new Hapi.Server();

const PORT = config.APP.PORT || 8443;

const SERVER_OPTIONS = {
  port: PORT,
};

// Remove local reading of certificates from production environment as we use ElasticBeanstalk for that
/*if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const TLS_OPTIONS = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/key.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.crt')),
    ca: fs.readFileSync(path.resolve(__dirname, 'cert/bundle.crt')) //, fs.readFileSync(path.resolve(__dirname, 'cert/bundle2.crt')), fs.readFileSync(path.resolve(__dirname, 'cert/bundle3.crt'))]
  };

  SERVER_OPTIONS.tls = TLS_OPTIONS;
}*/

if (process.env.NODE_ENV !== 'production') {
  server.connection(SERVER_OPTIONS);
}

models.sequelize.sync().then(() => {
  server.register([
    {
      register: inert,
    },
    {
      register: vision,
    },
    {
      register: hapiSwagger,
      options: {
        info: {
          title: 'Test API Documentation',
          version: '1.0.0',
        },
      },
    },
    {
      register: cors,
      options: {
        origins: ['*'],
        methods: ['POST, GET, OPTIONS', 'PUT', 'DELETE'],
        headers: ['Accept', 'Content-Type', 'Authorization', 'language'],
      },
    }], (err) => {
    if (!err) {
      server.register(hapiJWT, (jwtErr) => {
        if (!jwtErr) {
          const jwtKey = config.JWT_SECRET;
          server.auth.strategy('jwt', 'jwt',
              {
                key: jwtKey.toString(),
                validateFunc: (decoded, request, callback) => {
                  if (!decoded) {
                    return callback(null, false);
                  }

                  return callback(null, true);
                },
                verifyOptions: {algorithms: ['HS512']} // pick a strong algorithm
              });
          server.start(() => {
          });
          routers(server, models);
        }
      });
    }
  });
}).catch(err =>
    console.log(
        `Error at start up is as follow: \n \n ${err}`));

export default {
  server,
  options: SERVER_OPTIONS,
};