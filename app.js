

const Hapi = require('hapi');
const cors = require('hapi-cors');
const hapiJWT = require('hapi-auth-jwt2');
const models = require('./api/models');
const routers = require('./routes/router');
const { readFileSync } = require('fs');
// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ port: 3000 });

models.sequelize.sync().then(() => {
  console.log('Nice! Database looks fine');
  server.register({
    register: cors,
    options: {
      origins: ['http://localhost:4200']
    }
  }, (err) => {
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
