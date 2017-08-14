

const Hapi = require('hapi');
const cors = require('hapi-cors');
const good = require('good');
const hapiJWT = require('hapi-auth-jwt2');
const models = require('./api/models');
const routers = require('./routes/router');
const hapiSwagger = require('hapi-swagger');
const inert = require('inert');
const vision = require('vision');
const { readFileSync } = require('fs');
// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ port: 3000 });

const goodLoggingOption = {
  ops: {
    interval: 1000
  },
  reporters: {
    myConsoleReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*' }]
    }, {
      module: 'good-console'
    }, 'stdout'],
    myFileReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*', error: '*' }]
    }, {
      module: 'good-squeeze',
      name: 'SafeJson',
      args: [
        null,
        { separator: ',' }
      ]
    }, {
      module: 'rotating-file-stream',
      args: [
        'log.json',
        {
          size: '10M', // rotate every 10 MegaBytes written
          interval: '1d', // rotate daily
          compress: 'gzip', // compress rotated files
          history: `logs-${new Date().getTime()}`,
          path: './logs'
        }
      ]
    }]
  }
};

models.sequelize.sync().then(() => {
  server.register([
    {
      register: good,
      options: goodLoggingOption
    },
    {
      register: inert
    },
    {
      register: vision
    },
    {
      register: hapiSwagger,
      options: {
        info: {
          title: 'Test API Documentation',
          version: '1.0.0'
        }
      }
    },
    {
      register: cors,
      options: {
        origins: ['http://localhost:4200']
      }
    }], (err) => {
    if (!err) {
      server.register(hapiJWT, (jwtErr) => {
        if (!jwtErr) {
          const jwtKey = readFileSync(`${__dirname}/helpers/rsa-public-key.pem`);
          server.auth.strategy('jwt', 'jwt',
            {
              key: jwtKey.toString(),
              validateFunc: (decoded, request, callback) => {
                if (!decoded) {
                  return callback(null, false);
                }

                return callback(null, true);
              },
              verifyOptions: { algorithms: ['RS256'] } // pick a strong algorithm
            });

          server.auth.default('jwt');
          server.start(() => {
            console.log(server.info.uri);
          });
          routers(server, models);
        }
      });
    }
  });
}).catch(err => console.log(err, 'Something went wrong with the Database Update!'));
