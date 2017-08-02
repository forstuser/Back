'use strict';

const Hapi = require('hapi');
const MySQL = require('mysql');
const Joi = require('joi');
const Bcrypt = require('bcrypt');
const crypto = require('crypto');
// Create a server with a host and port
const server = new Hapi.Server();
const connection = MySQL.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'binbill'
});
server.connection({ port: 3000, host: '192.168.0.9' });
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});
connection.connect();
function random (howMany, chars) {
    chars = chars
        || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany),
        value = new Array(howMany),
        len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    }
    return value.join('');
}
function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + "-" + hour + ":" + min + ":" + sec;

}

server.route({
    method: 'GET',
    path: '/test',
    handler: function (request, reply) {
        return reply('hello world');
    }
});

//Admin Login
server.route({
    method: 'POST',
    path: '/Services/Management/Login',
    handler:function(request,reply) {
        const EmailID = request.payload.EmailID;
        const Password = request.payload.Password;
        connection.query('SELECT user_id as ID,fullname as Name,email_id as EmailID,image as Image,user_type_id as UserType FROM table_users WHERE email_id = "' + EmailID + '" and password = md5("' + Password + '") and status_id=1', function (error, admin, fields) {
            if (error) throw error;
            if(admin.length > 0){
                const tokenNo=random(25);
                //console.log(getDateTime());
                connection.query('SELECT id FROM table_token WHERE user_id = "' + admin[0]['ID'] + '"', function (error, token, fields) {
                    if (error) throw error;
                    if(token.length > 0){
                        connection.query('UPDATE table_token SET token_id="' + tokenNo + '" WHERE user_id="' + admin[0]['ID'] + '"', function (error, results, fields) {
                            if (error) throw error;
                            //console.log(results);
                        });
                    } else {
                        connection.query('INSERT INTO table_token (token_id,user_id,created_on,expiry_on) VALUES ("' + tokenNo + '","' + admin[0]['ID'] + '","' + getDateTime() + '","' + getDateTime() + '")', function (error, results, fields) {
                            if (error) throw error;
                            //console.log(results);
                        });
                    }
                   // console.log(token);
                });
                var data = '{"statusCode": 100,"token": "'+tokenNo+'","Name": "' + admin[0]['Name'] + '","EmailID": "' + admin[0]['EmailID'] + '","Image": "' + admin[0]['Image'] + '","UserType": "' + admin[0]['UserType'] + '"}';
            } else {
                var data = '{"statusCode": 103,"error": "Not Found","message": "Invalid EmailID and Password."}';
            }
            reply(data);
        });
    },
    config:{
        validate: {
            payload: {
                EmailID: Joi.string().email(),
                Password: Joi.string(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Category
server.route({
    method: 'POST',
    path: '/Services/AddCategory',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Level = request.payload.Level;
        const RefID = request.payload.RefID;
        const Name = request.payload.Name;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT category_id FROM table_categories WHERE category_name = "' + Name + '" and status_id=1 and ref_id="'+RefID+'"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_categories (category_name,ref_id,category_level,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + Name + '","' + RefID + '","' + Level + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID": "'+results['insertId']+'","Name": "'+Name+'","RefID": "'+RefID+'","Level": "'+Level+'"}';
                            reply(data);
                        });
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                Name: Joi.string(),
                Level: Joi.number().integer(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Category
server.route({
    method: 'POST',
    path: '/Services/EditCategory',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const RefID = request.payload.RefID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT category_id FROM table_categories WHERE category_name = "' + Name + '" and status_id=1 and category_id!="'+ID+'" and ref_id="'+RefID+'"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_categories SET category_name="' + Name + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE category_id="' + ID + '"', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"error": "","message": "Data update successfully."}';
                            reply(data);
                        });
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                Name: Joi.string(),
                ID: Joi.number().integer(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Category
server.route({
    method: 'POST',
    path: '/Services/DeleteCategory',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('UPDATE table_categories AS t1 LEFT JOIN table_categories AS t2 ON t2.ref_id = t1.category_id LEFT JOIN table_categories AS t3 ON t3.ref_id = t2.category_id SET t1.status_id=3,t2.status_id=3,t3.status_id=3,t1.updated_on="' + getDateTime() + '",t1.updated_by_user_id="' + UserID + '",t2.updated_on="' + getDateTime() + '",t2.updated_by_user_id="' + UserID + '",t3.updated_on="' + getDateTime() + '",t3.updated_by_user_id="' + UserID + '" WHERE t1.category_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Data Delete successfully."}';
                    reply(data);
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Category List
server.route({
    method: 'POST',
    path: '/Services/CategoryList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const RefID = request.payload.RefID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                if(RefID != null){
                    var condition = 'WHERE status_id=1 and ref_id='+RefID+'';
                } else {
                    var condition = 'WHERE status_id=1';
                }
                connection.query('SELECT category_id as ID,category_name as Name,ref_id as RefID,category_level as Level FROM table_categories '+condition+'', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var datalist=category;
                        var data = '{"statusCode": 100,"CategoryList": '+ JSON.stringify(category) +'}';
                        reply(data);
                    } else {
                        var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                        reply(data);
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Category By ID
server.route({
    method: 'POST',
    path: '/Services/CategoryByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT category_id as ID,category_name as Name,ref_id as RefID,category_level as Level FROM table_categories WHERE category_id="' + ID + '"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var datalist=category;
                        var data = '{"statusCode": 100,"Category": '+ JSON.stringify(category) +'}';
                        reply(data);
                    } else {
                        var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                        reply(data);
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});
//User Type List
server.route({
    method: 'POST',
    path: '/Services/UserTypeList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const UserType = request.payload.UserType;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                if(UserType != 1 && UserType != 2){
                    var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                    reply(data);
                } else {
                    if(UserType == 1){
                        var condition = 'WHERE user_type_id IN(2,3,4,6) ';
                    }
                    if(UserType == 2){
                        var condition = 'WHERE user_type_id IN(3,4,6) ';
                    }
                    connection.query('SELECT user_type_id as TypeID,user_type_name as Name FROM table_user_type '+condition+'', function (error, usertype, fields) {
                        if (error) throw error;
                        if(usertype.length > 0){
                            var data = '{"statusCode": 100,"UserTypeList": '+ JSON.stringify(usertype) +'}';
                            reply(data);
                        } else {
                            var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                            reply(data);
                        }
                    });
                }
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                UserType: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Management User
server.route({
    method: 'POST',
    path: '/Services/AddManagementUser',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Name = request.payload.Name;
        const EmailID = request.payload.EmailID;
        const Password = request.payload.Password;
        const UserType = request.payload.UserType;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT user_id FROM table_users WHERE email_id = "' + EmailID + '" and status_id!=3', function (error, user, fields) {
                    if (error) throw error;
                    if(user.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "EmailID Already exists."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_users (user_type_id,fullname,email_id,password,tmp_password,created_on,updated_on,status_id) VALUES ("' + UserType + '","' + Name + '","' + EmailID + '",md5("' + Password + '"),"' + Password + '","' + getDateTime() + '","' + getDateTime() + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"error": "","message": "User add successfully."}';
                            reply(data);

                        });
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                Name: Joi.string(),
                EmailID: Joi.string().email(),
                Password: Joi.string(),
                UserType: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Management User List
server.route({
    method: 'POST',
    path: '/Services/ManagementUserList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const UserType = request.payload.UserType;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT u.user_id as ID,u.fullname as Name,u.email_id as EmailID,status_name as Status FROM table_users as u inner join table_status as s on s.status_id=u.status_id WHERE u.user_type_id="' + UserType + '" and u.status_id!=3', function (error, usertype, fields) {
                    if (error) throw error;
                    if(usertype.length > 0){
                        var data = '{"statusCode": 100,"UserList": '+ JSON.stringify(usertype) +'}';
                        reply(data);
                    } else {
                        var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                        reply(data);
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                UserType: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Management User By ID
server.route({
    method: 'POST',
    path: '/Services/ManagementUserByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT user_type_id as UserType,user_id as ID,fullname as Name,email_id as EmailID FROM table_users WHERE user_id="' + ID + '"', function (error, usertype, fields) {
                    if (error) throw error;
                    if(usertype.length > 0){
                        var data = '{"statusCode": 100,"User": '+ JSON.stringify(usertype) +'}';
                        reply(data);
                    } else {
                        var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                        reply(data);
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Management User
server.route({
    method: 'POST',
    path: '/Services/EditManagementUser',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const EmailID = request.payload.EmailID;
        const Password = request.payload.Password;
        const UserType = request.payload.UserType;
        const Status = request.payload.Status;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT user_id FROM table_users WHERE email_id = "' + EmailID + '" and status_id!=3 and user_id!="' + ID + '"', function (error, user, fields) {
                    if (error) throw error;
                    if(user.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "EmailID Already exists."}';
                        reply(data);
                    } else {
                        if(Password != ''){
                            connection.query('UPDATE table_users SET fullname="' + Name + '",email_id="' + EmailID + '",password=md5("' + Password + '"),tmp_password="' + Password + '",user_type_id="' + UserType + '",status_id="' + Status + '",updated_on="' + getDateTime() + '" WHERE user_id="' + ID + '"', function (error, results, fields) {
                                if (error) throw error;
                                var data = '{"statusCode": 100,"error": "","message": "User update successfully."}';
                                reply(data);
                            });
                        } else {
                            connection.query('UPDATE table_users SET fullname="' + Name + '",email_id="' + EmailID + '",user_type_id="' + UserType + '",status_id="' + Status + '",updated_on="' + getDateTime() + '" WHERE user_id="' + ID + '"', function (error, results, fields) {
                                if (error) throw error;
                                var data = '{"statusCode": 100,"error": "","message": "User update successfully."}';
                                reply(data);
                            });
                        }
                    }
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                Name: Joi.string(),
                EmailID: Joi.string().email(),
                Password: [Joi.string(), Joi.allow(null)],
                UserType: Joi.number().integer(),
                Status: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Management User
server.route({
    method: 'POST',
    path: '/Services/DeleteManagementUser',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('UPDATE table_users SET status_id=3,updated_on="' + getDateTime() + '" WHERE user_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "User Delete successfully."}';
                    reply(data);
                });
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                output: 'data',
                parse:true
            }
        }
    }
});

