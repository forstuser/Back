'use strict';

const Hapi = require('hapi');
const MySQL = require('mysql');
const Joi = require('joi');
const Bcrypt = require('bcrypt');
const crypto = require('crypto');
// Create a server with a host and port
const server = new Hapi.Server();
const connection = MySQL.createConnection({
    host: 'binbilldbinstancetest.cpnnj7xlkrir.ap-south-1.rds.amazonaws.com',
    user: 'binbillDB',
    password: 'devbindb1!#',
    database: 'binbill'
});
//server.connection({ port: 3000});
server.connection({ port: 3000, host: '192.168.0.9'});
server.register({
    register: require('hapi-cors'),
    options: {
        origins: ['http://localhost:4200']
    }
}, function(err){
    server.start(function(){
        console.log(server.info.uri);
    });
});
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
function getDate() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + "-" + month + "-" + day;

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
        //console.log(request);
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
                EmailID: Joi.string().email().required(),
                Password: Joi.string().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT category_id FROM table_categories WHERE category_name = "'+Name+'" and status_id=1 and ref_id="'+RefID+'"', function (error, category, fields) {
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                Level: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                ID: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});

//Category Level List
server.route({
    method: 'POST',
    path: '/Services/CategoryLevelList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Level = request.payload.Level;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(Level == 1){
                    connection.query('SELECT category_id as ID,category_name as Name,ref_id as RefID,category_level as Level FROM table_categories WHERE category_level=1 and status_id=1 ORDER BY category_name', function (error, category, fields) {
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
                }
                if(Level == 2){
                    connection.query('SELECT t2.category_id as ID,t1.category_name AS maincategory, t2.category_name as category,t2.ref_id as RefID,t2.category_level as Level FROM table_categories AS t1 INNER JOIN table_categories AS t2 ON t2.ref_id = t1.category_id WHERE t2.category_level = 2 and t2.status_id=1 ORDER BY t1.category_name,t2.category_name', function (error, category, fields) {
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
                }
                if(Level == 3){
                    connection.query('SELECT t3.category_id as ID,t1.category_name AS maincategory,t2.category_name as category,t3.category_name as subcategory,t3.ref_id as RefID,t3.category_level as Level FROM table_categories AS t1 INNER JOIN table_categories AS t2 ON t2.ref_id = t1.category_id INNER JOIN table_categories AS t3 ON t3.ref_id = t2.category_id WHERE t3.category_level = 3 and t3.status_id=1 ORDER BY t1.category_name,t2.category_name,t3.category_name', function (error, category, fields) {
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
                TokenNo: Joi.string().required(),
                Level: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                UserType: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                EmailID: Joi.string().email().required(),
                Password: Joi.string().required(),
                UserType: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                UserType: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                EmailID: Joi.string().email().required(),
                Password: [Joi.string(), Joi.allow(null)],
                UserType: Joi.number().integer().required(),
                Status: Joi.number().integer().required(),
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
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Brand
server.route({
    method: 'POST',
    path: '/Services/AddBrand',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Name = request.payload.Name;
        const Description = request.payload.Description;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT brand_id FROM table_brands WHERE brand_name = "' + Name + '" and status_id=1', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Brand Already exists."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_brands (brand_name,brand_description,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + Name + '","' + Description + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < Details.length; i++) {
                                connection.query('INSERT INTO table_brand_details (brand_id,category_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+Details[i].CategoryID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                                    if (error) throw error;
                                });
                            }
                            var data = '{"statusCode": 100,"ID": "'+results['insertId']+'","Name": "'+Name+'","Description": "'+Description+'"}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                Description: Joi.allow(null),
                Details: Joi.array().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Brand
server.route({
    method: 'POST',
    path: '/Services/EditBrand',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const Description = request.payload.Description;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT brand_id FROM table_brands WHERE brand_name = "' + Name + '" and brand_id!="' + ID + '" and status_id=1', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Brand Already exists."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_brands SET brand_name="' + Name + '",brand_description="' + Description + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE brand_id="' + ID + '"', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < Details.length; i++) {
                                if(Details[i].DetailID != null && Details[i].DetailID != ''){
                                    connection.query('UPDATE table_brand_details SET category_id="' + Details[i].CategoryID + '",contactdetails_type_id="' + Details[i].DetailTypeID + '",display_name="' + Details[i].DisplayName + '",details="' + Details[i].Details + '"WHERE brand_detail_id="' + Details[i].DetailID + '"', function (error, detail, fields) {
                                    });
                                } else {
                                    connection.query('INSERT INTO table_brand_details (brand_id,category_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+ID+'","'+Details[i].CategoryID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                                    });
                                }

                            }
                            var data = '{"statusCode": 100,"error": "","message": "Brand update successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                Description: Joi.allow(null),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Brand
server.route({
    method: 'POST',
    path: '/Services/DeleteBrand',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_brands as b left Join table_brand_details as d on b.brand_id=d.brand_id SET b.status_id=3,d.status_id=3,b.updated_on="' + getDateTime() + '",b.updated_by_user_id="' + UserID + '" WHERE b.brand_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Brand Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Brand Detail
server.route({
    method: 'POST',
    path: '/Services/DeleteBrandDetail',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_brand_details SET status_id=3 WHERE brand_detail_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Brand Detail Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Brand List
server.route({
    method: 'POST',
    path: '/Services/BrandList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(OffSet != null && Limit != null  ){
                    if(!isNaN(OffSet) && !isNaN(OffSet)){
                        var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                    } else {
                        var LimitCondition = '';
                    }
                } else {
                    var LimitCondition = '';
                }
                connection.query('SELECT brand_id as ID,brand_name as Name,brand_description as Description FROM table_brands WHERE status_id!=3 ORDER BY brand_name '+LimitCondition+' ', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 100,"BrandList": '+ JSON.stringify(brand) +'}';
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
                TokenNo: Joi.string().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Brand By ID
server.route({
    method: 'POST',
    path: '/Services/BrandByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT brand_id as ID,brand_name as Name,brand_description as Description FROM table_brands WHERE brand_id = "' + ID + '"', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        connection.query('SELECT brand_detail_id as DetailID,category_id as CategoryID,contactdetails_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_brand_details WHERE brand_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+brand[0]['ID']+',"Name":"'+brand[0]['Name']+'","Description":"'+brand[0]['Description']+'","Details": '+ JSON.stringify(detail) +'}';
                            reply(data);
                        });

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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Search Brand List
server.route({
    method: 'POST',
    path: '/Services/SearchBrand',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT brand_id as ID,brand_name as Name,brand_description as Description FROM table_brands WHERE status_id!=3 AND brand_name LIKE "%'+Search+'%" ORDER BY brand_name ', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 100,"BrandList": '+ JSON.stringify(brand) +'}';
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
                TokenNo: Joi.string().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Online Seller
server.route({
    method: 'POST',
    path: '/Services/AddOnlineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Name = request.payload.Name;
        const URL = request.payload.URL;
        const GstinNo = request.payload.GstinNo;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT seller_id FROM table_online_seller WHERE seller_name = "' + Name + '" and status_id=1', function (error, seller, fields) {
                    if (error) throw error;
                    if(seller.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Online Seller Already exists."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_online_seller (seller_name,seller_url,seller_gstin_no,status_id) VALUES ("' + Name + '","' + URL + '","' + GstinNo + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < Details.length; i++) {
                                connection.query('INSERT INTO table_online_seller_details (seller_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                                    if (error) throw error;
                                });
                            }
                            var data = '{"statusCode": 100,"ID": "'+results['insertId']+'","Name": "'+Name+'","URL": "'+URL+'","GstinNo": "'+GstinNo+'"}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                URL: Joi.allow(null),
                GstinNo: Joi.allow(null),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Online Seller
server.route({
    method: 'POST',
    path: '/Services/EditOnlineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const URL = request.payload.URL;
        const GstinNo = request.payload.GstinNo;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT seller_id FROM table_online_seller WHERE seller_name = "' + Name + '" and seller_id!="' + ID + '" and status_id=1', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Online Seller Already exists."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_online_seller SET seller_name="' + Name + '",seller_url="' + URL + '",seller_gstin_no="' + GstinNo + '" WHERE seller_id="' + ID + '"', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < Details.length; i++) {
                                if(Details[i].DetailID != null && Details[i].DetailID != ''){
                                    connection.query('UPDATE table_online_seller_details SET contactdetail_type_id="' + Details[i].DetailTypeID + '",display_name="' + Details[i].DisplayName + '",details="' + Details[i].Details + '"WHERE seller_detail_id="' + Details[i].DetailID + '"', function (error, detail, fields) {
                                    });
                                } else {
                                    connection.query('INSERT INTO table_online_seller_details (seller_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+ID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                                    });
                                }

                            }
                            var data = '{"statusCode": 100,"error": "","message": "Online Seller update successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                URL: Joi.allow(null),
                GstinNo: Joi.allow(null),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Online Seller
server.route({
    method: 'POST',
    path: '/Services/DeleteOnlineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_online_seller as s left Join table_online_seller_details as d on s.seller_id=d.seller_id SET s.status_id=3,d.status_id=3 WHERE s.seller_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Online Seller Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Online Seller Detail
server.route({
    method: 'POST',
    path: '/Services/DeleteOnlineSellerDetail',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_online_seller_details SET status_id=3 WHERE seller_detail_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Online Seller Detail Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Online Seller List
server.route({
    method: 'POST',
    path: '/Services/OnlineSellerList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(OffSet != null && Limit != null  ){
                    if(!isNaN(OffSet) && !isNaN(OffSet)){
                        var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                    } else {
                        var LimitCondition = '';
                    }
                } else {
                    var LimitCondition = '';
                }
                connection.query('SELECT seller_id as ID,seller_name as Name,seller_url as URL,seller_gstin_no as GstinNo FROM table_online_seller WHERE status_id!=3 ORDER BY seller_name '+LimitCondition+' ', function (error, seller, fields) {
                    if (error) throw error;
                    if(seller.length > 0){
                        var data = '{"statusCode": 100,"SellerList": '+ JSON.stringify(seller) +'}';
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
                TokenNo: Joi.string().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Search Online Seller List
server.route({
    method: 'POST',
    path: '/Services/SearchOnlineSellerList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT seller_id as ID,seller_name as Name,seller_url as URL,seller_gstin_no as GstinNo FROM table_online_seller WHERE status_id!=3 and (seller_url LIKE "%'+Search+'%" OR seller_name LIKE "%'+Search+'%" OR seller_gstin_no LIKE "%'+Search+'%") ORDER BY seller_name  ', function (error, seller, fields) {
                    if (error) throw error;
                    if(seller.length > 0){
                        var data = '{"statusCode": 100,"SellerList": '+ JSON.stringify(seller) +'}';
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
                TokenNo: Joi.string().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Online Seller By ID
server.route({
    method: 'POST',
    path: '/Services/OnlineSellerByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT seller_id as ID,seller_name as Name,seller_url as URL,seller_gstin_no as GstinNo FROM table_online_seller WHERE seller_id = "' + ID + '"', function (error, seller, fields) {
                    if (error) throw error;
                    if(seller.length > 0){
                        connection.query('SELECT seller_detail_id as DetailID,contactdetail_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_online_seller_details WHERE seller_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+seller[0]['ID']+',"Name":"'+seller[0]['Name']+'","URL":"'+seller[0]['URL']+'","GstinNo":"'+seller[0]['GstinNo']+'","Details": '+ JSON.stringify(detail) +'}';
                            reply(data);
                        });

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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Authorized Service Center
server.route({
    method: 'POST',
    path: '/Services/AddAuthorizedServiceCenter',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('INSERT INTO table_authorized_service_center (brand_id,center_name,address_house_no,address_block,address_street,address_sector,address_city,address_state,address_pin_code,address_nearby,latitude,longitude,open_days,timings,status_id) VALUES ("'+request.payload.BrandID+'","'+request.payload.Name+'","'+request.payload.HouseNo+'","'+request.payload.Block+'","'+request.payload.Street+'","'+request.payload.Sector+'","'+request.payload.City+'","'+request.payload.State+'","'+request.payload.PinCode+'","'+request.payload.NearBy+'","'+request.payload.Lattitude+'","'+request.payload.Longitude+'","'+request.payload.OpenDays+'","'+request.payload.Timings+'",1)', function (error, results, fields) {
                    if (error) throw error;
                    for(var i = 0; i < Details.length; i++) {
                        connection.query('INSERT INTO table_authorized_service_center_details (center_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                        });
                    }
                    var data = '{"statusCode": 100,"error": "","message": "Authorized service center add successfully."}';
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
                TokenNo: Joi.string().required(),
                BrandID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                HouseNo: Joi.allow(null),
                Block: Joi.allow(null),
                Street: Joi.allow(null),
                Sector: Joi.allow(null),
                City: Joi.string().required(),
                State: Joi.string().required(),
                PinCode: Joi.allow(null),
                NearBy: Joi.allow(null),
                Lattitude: Joi.allow(null),
                Longitude: Joi.allow(null),
                OpenDays: Joi.string(),
                Timings: Joi.string(),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Authorized Service Center
server.route({
    method: 'POST',
    path: '/Services/EditAuthorizedServiceCenter',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_authorized_service_center SET brand_id="'+request.payload.BrandID+'",center_name="'+request.payload.Name+'",address_house_no="'+request.payload.HouseNo+'",address_block="'+request.payload.Block+'",address_street="'+request.payload.Street+'",address_sector="'+request.payload.Sector+'",address_city="'+request.payload.City+'",address_state="'+request.payload.State+'",address_pin_code="'+request.payload.PinCode+'",address_nearby="'+request.payload.NearBy+'",latitude="'+request.payload.Lattitude+'",longitude="'+request.payload.Longitude+'",open_days="'+request.payload.OpenDays+'",timings="'+request.payload.Timings+'" WHERE center_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    for(var i = 0; i < Details.length; i++) {
                        if(Details[i].DetailID != null && Details[i].DetailID != ''){
                            connection.query('UPDATE table_authorized_service_center_details SET contactdetail_type_id="' + Details[i].DetailTypeID + '",display_name="' + Details[i].DisplayName + '",details="' + Details[i].Details + '"WHERE center_detail_id="' + Details[i].DetailID + '"', function (error, detail, fields) {
                            });
                        } else {
                            connection.query('INSERT INTO table_authorized_service_center_details (center_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+ID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                            });
                        }

                    }
                    var data = '{"statusCode": 100,"error": "","message": "Authorized Service Center update successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                BrandID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                HouseNo: Joi.allow(null),
                Block: Joi.allow(null),
                Street: Joi.allow(null),
                Sector: Joi.allow(null),
                City: Joi.string().required(),
                State: Joi.string().required(),
                PinCode: Joi.allow(null),
                NearBy: Joi.allow(null),
                Lattitude: Joi.allow(null),
                Longitude: Joi.allow(null),
                OpenDays: Joi.string(),
                Timings: Joi.string(),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Authorized Service Center
server.route({
    method: 'POST',
    path: '/Services/DeleteAuthorizedServiceCenter',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_authorized_service_center as c left Join table_authorized_service_center_details as d on c.center_id=d.center_id SET c.status_id=3,d.status_id=3 WHERE c.center_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Authorized Service Center Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Authorized Service Center Detail
server.route({
    method: 'POST',
    path: '/Services/DeleteAuthorizedServiceCenterDetail',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_authorized_service_center_details SET status_id=3 WHERE center_detail_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Authorized Service Center Detail Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Authorized Service Center List
server.route({
    method: 'POST',
    path: '/Services/AuthorizedServiceCenterList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(OffSet != null && Limit != null  ){
                    if(!isNaN(OffSet) && !isNaN(OffSet)){
                        var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                    } else {
                        var LimitCondition = '';
                    }
                } else {
                    var LimitCondition = '';
                }
                connection.query('SELECT a.center_id as ID,a.brand_id as BrandID,b.brand_name as BrandName,a.center_name as Name,a.address_house_no as HouseNo,a.address_block as Block,a.address_street as Street,a.address_sector as Sector,a.address_city as City,a.address_state as State,a.address_pin_code as PinCode,a.address_nearby as NearBy,a.latitude as Lattitude,a.longitude as Longitude,a.open_days as OpenDays,a.timings as Timings FROM table_authorized_service_center as a inner join table_brands as b on a.brand_id=b.brand_id WHERE a.status_id!=3 ORDER BY b.brand_name '+LimitCondition+' ', function (error, service_center, fields) {
                    if (error) throw error;
                    if(service_center.length > 0){
                        var data = '{"statusCode": 100,"AuthorizedList": '+ JSON.stringify(service_center) +'}';
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
                TokenNo: Joi.string().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Authorized Service Center By ID
server.route({
    method: 'POST',
    path: '/Services/AuthorizedServiceCenterByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT a.center_id as ID,a.brand_id as BrandID,b.brand_name as BrandName,a.center_name as Name,a.address_house_no as HouseNo,a.address_block as Block,a.address_street as Street,a.address_sector as Sector,a.address_city as City,a.address_state as State,a.address_pin_code as PinCode,a.address_nearby as NearBy,a.latitude as Lattitude,a.longitude as Longitude,a.open_days as OpenDays,a.timings as Timings FROM table_authorized_service_center as a inner join table_brands as b on a.brand_id=b.brand_id WHERE a.center_id = "' + ID + '"', function (error, service, fields) {
                    if (error) throw error;
                    if(service.length > 0){
                        connection.query('SELECT center_detail_id as DetailID,contactdetail_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_authorized_service_center_details WHERE center_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+service[0]['ID']+',"BrandID":'+service[0]['BrandID']+',"BrandName":"'+service[0]['BrandName']+'","Name":"'+service[0]['Name']+'","HouseNo":"'+service[0]['HouseNo']+'","Block":"'+service[0]['Block']+'","Street":"'+service[0]['Street']+'","Sector":"'+service[0]['Sector']+'","City":"'+service[0]['City']+'","State":"'+service[0]['State']+'","PinCode":'+service[0]['PinCode']+',"NearBy":"'+service[0]['NearBy']+'","Lattitude":"'+service[0]['Lattitude']+'","Longitude":"'+service[0]['Longitude']+'","OpenDays":"'+service[0]['OpenDays']+'","Timings":"'+service[0]['Timings']+'","Details": '+ JSON.stringify(detail) +'}';
                            reply(data);
                        });

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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Color
server.route({
    method: 'POST',
    path: '/Services/AddColor',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Name = request.payload.Name;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT color_id FROM table_color WHERE color_name = "' + Name + '" and status_id=1', function (error, color, fields) {
                    if (error) throw error;
                    if(color.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_color (color_name,status_id) VALUES ("' + Name + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID": "'+results['insertId']+'","Name": "'+Name+'"}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Color
server.route({
    method: 'POST',
    path: '/Services/DeleteColor',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_color SET status_id=3 WHERE color_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Color List
server.route({
    method: 'POST',
    path: '/Services/ColorList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const RefID = request.payload.RefID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT color_id as ID,color_name as Name FROM table_color WHERE status_id=1 ORDER BY color_name', function (error, color, fields) {
                    if (error) throw error;
                    if(color.length > 0){
                        var data = '{"statusCode": 100,"ColorList": '+ JSON.stringify(color) +'}';
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
                TokenNo: Joi.string().required(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Exclusions
server.route({
    method: 'POST',
    path: '/Services/AddExclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const CatID = request.payload.CatID;
        const Name = request.payload.Name;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT exclusions_id FROM table_list_of_exclusions WHERE exclusions_name = "' + Name + '" and category_id = "' + CatID + '" and status_id=1', function (error, data, fields) {
                    if (error) throw error;
                    if(data.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_list_of_exclusions (category_id,exclusions_name,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + CatID + '","' + Name + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"error": "","message": "Data add successfully."}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                CatID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Edit Exclusions
server.route({
    method: 'POST',
    path: '/Services/EditExclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const CatID = request.payload.CatID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT exclusions_id FROM table_list_of_exclusions WHERE exclusions_name = "' + Name + '" and status_id=1 and exclusions_id!="'+ID+'" and category_id="'+CatID+'"', function (error, data, fields) {
                    if (error) throw error;
                    if(data.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_list_of_exclusions SET exclusions_name="' + Name + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE exclusions_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                ID: Joi.number().integer().required(),
                CatID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Exclusions
server.route({
    method: 'POST',
    path: '/Services/DeleteExclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_list_of_exclusions SET status_id=3,updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE exclusions_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Exclusions List
server.route({
    method: 'POST',
    path: '/Services/ExclusionsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT e.exclusions_id as ID, e.category_id as CatID,c.category_name as CatName,e.exclusions_name as Name FROM table_list_of_exclusions as e left join table_categories as c on c.category_id=e.category_id WHERE e.status_id=1', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"ExclusionsList": '+JSON.stringify(results)+'}';
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
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Inclusions
server.route({
    method: 'POST',
    path: '/Services/AddInclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const CatID = request.payload.CatID;
        const Name = request.payload.Name;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT inclusions_id FROM table_list_of_inclusions WHERE inclusions_name = "' + Name + '" and category_id = "' + CatID + '" and status_id=1', function (error, data, fields) {
                    if (error) throw error;
                    if(data.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_list_of_inclusions (category_id,inclusions_name,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + CatID + '","' + Name + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"error": "","message": "Data add successfully."}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                CatID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Edit Inclusions
server.route({
    method: 'POST',
    path: '/Services/EditInclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const CatID = request.payload.CatID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT inclusions_id FROM table_list_of_inclusions WHERE inclusions_name = "' + Name + '" and status_id=1 and inclusions_id!="'+ID+'" and category_id="'+CatID+'"', function (error, data, fields) {
                    if (error) throw error;
                    if(data.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_list_of_inclusions SET inclusions_name="' + Name + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE inclusions_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                ID: Joi.number().integer().required(),
                CatID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Inclusions
server.route({
    method: 'POST',
    path: '/Services/DeleteInclusions',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_list_of_inclusions SET status_id=3,updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE inclusions_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Inclusions List
server.route({
    method: 'POST',
    path: '/Services/InclusionsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT i.inclusions_id as ID, i.category_id as CatID,c.category_name as CatName,i.inclusions_name as Name FROM table_list_of_inclusions as i left join table_categories as c on c.category_id=i.category_id WHERE i.status_id=1', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"InclusionsList": '+JSON.stringify(results)+'}';
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
                TokenNo: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Offline Seller
server.route({
    method: 'POST',
    path: '/Services/AddOfflineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('INSERT INTO table_offline_seller (offline_seller_name,offline_seller_owner_name,offline_seller_gstin_no,offline_seller_pan_number,offline_seller_registration_no,is_service_provider,is_onboarded,address_house_no,address_block,address_street,address_sector,address_city,address_state,address_pin_code,address_nearby,latitude,longitude,status_id) VALUES ("'+request.payload.Name+'","'+request.payload.OwnerName+'","'+request.payload.GstinNo+'","'+request.payload.PanNo+'","'+request.payload.RegNo+'","'+request.payload.ServiceProvider+'","'+request.payload.Onboarded+'","'+request.payload.HouseNo+'","'+request.payload.Block+'","'+request.payload.Street+'","'+request.payload.Sector+'","'+request.payload.City+'","'+request.payload.State+'","'+request.payload.PinCode+'","'+request.payload.NearBy+'","'+request.payload.Lattitude+'","'+request.payload.Longitude+'",1)', function (error, results, fields) {
                    if (error) throw error;
                    for(var i = 0; i < Details.length; i++) {
                        connection.query('INSERT INTO table_offline_seller_details (offline_seller_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                        });
                    }
                    var data = '{"statusCode": 100,"error": "","message": "Offline Seller add successfully.","ID": '+results['insertId']+',"Name": "'+request.payload.Name+'"}';
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                OwnerName: [Joi.string(), Joi.allow(null)],
                GstinNo: [Joi.string(), Joi.allow(null)],
                PanNo: [Joi.string(), Joi.allow(null)],
                RegNo: [Joi.string(), Joi.allow(null)],
                ServiceProvider: [Joi.number().integer(), Joi.allow(null)],
                Onboarded: [Joi.number().integer(), Joi.allow(null)],
                HouseNo: [Joi.string(), Joi.allow(null)],
                Block: [Joi.string(), Joi.allow(null)],
                Street: [Joi.string(), Joi.allow(null)],
                Sector: [Joi.string(), Joi.allow(null)],
                City: Joi.string().required(),
                State: Joi.string().required(),
                PinCode: [Joi.number().integer(), Joi.allow(null)],
                NearBy: [Joi.string(), Joi.allow(null)],
                Lattitude: [Joi.string(), Joi.allow(null)],
                Longitude: [Joi.string(), Joi.allow(null)],
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Offline Seller
server.route({
    method: 'POST',
    path: '/Services/EditOfflineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Details = request.payload.Details;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_offline_seller SET offline_seller_name="'+request.payload.Name+'",offline_seller_owner_name="'+request.payload.OwnerName+'",offline_seller_gstin_no="'+request.payload.GstinNo+'",offline_seller_pan_number="'+request.payload.PanNo+'",offline_seller_registration_no="'+request.payload.RegNo+'",is_service_provider="'+request.payload.ServiceProvider+'",is_onboarded="'+request.payload.Onboarded+'",address_house_no="'+request.payload.HouseNo+'",address_block="'+request.payload.Block+'",address_street="'+request.payload.Street+'",address_sector="'+request.payload.Sector+'",address_city="'+request.payload.City+'",address_state="'+request.payload.State+'",address_pin_code="'+request.payload.PinCode+'",address_nearby="'+request.payload.NearBy+'",latitude="'+request.payload.Lattitude+'",longitude="'+request.payload.Longitude+'" WHERE offline_seller_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    for(var i = 0; i < Details.length; i++) {
                        if(Details[i].DetailID != null && Details[i].DetailID != ''){
                            connection.query('UPDATE table_offline_seller_details SET contactdetail_type_id="' + Details[i].DetailTypeID + '",display_name="' + Details[i].DisplayName + '",details="' + Details[i].Details + '"WHERE seller_detail_id="' + Details[i].DetailID + '"', function (error, detail, fields) {
                            });
                        } else {
                            connection.query('INSERT INTO table_offline_seller_details (offline_seller_id,contactdetail_type_id,display_name,details,status_id) VALUES ("'+ID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
                            });
                        }

                    }
                    var data = '{"statusCode": 100,"error": "","message": "Offline Seller update successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                Name: Joi.string().required(),
                OwnerName: [Joi.string(), Joi.allow(null)],
                GstinNo: [Joi.string(), Joi.allow(null)],
                PanNo: [Joi.string(), Joi.allow(null)],
                RegNo: [Joi.string(), Joi.allow(null)],
                ServiceProvider: [Joi.number().integer(), Joi.allow(null)],
                Onboarded: [Joi.number().integer(), Joi.allow(null)],
                HouseNo: [Joi.string(), Joi.allow(null)],
                Block: [Joi.string(), Joi.allow(null)],
                Street: [Joi.string(), Joi.allow(null)],
                Sector: [Joi.string(), Joi.allow(null)],
                City: Joi.string().required(),
                State: Joi.string().required(),
                PinCode: [Joi.number().integer(), Joi.allow(null)],
                NearBy: [Joi.string(), Joi.allow(null)],
                Lattitude: [Joi.string(), Joi.allow(null)],
                Longitude: [Joi.string(), Joi.allow(null)],
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Delete Offline Seller
server.route({
    method: 'POST',
    path: '/Services/DeleteOfflineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_offline_seller as s left Join table_offline_seller_details as d on s.offline_seller_id=d.offline_seller_id SET s.status_id=3,d.status_id=3 WHERE s.offline_seller_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Offline Seller Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Offline Seller Detail
server.route({
    method: 'POST',
    path: '/Services/DeleteOfflineSellerDetail',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_offline_seller_details SET status_id=3 WHERE seller_detail_id="' + ID + '"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Offline Seller Detail Delete successfully."}';
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Offline Seller List
server.route({
    method: 'POST',
    path: '/Services/OfflineSellerList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(OffSet != null && Limit != null  ){
                    if(!isNaN(OffSet) && !isNaN(OffSet)){
                        var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                    } else {
                        var LimitCondition = '';
                    }
                } else {
                    var LimitCondition = '';
                }
                connection.query('SELECT offline_seller_id as ID,offline_seller_name as Name,offline_seller_owner_name as OwnerName,offline_seller_gstin_no as GstinNo,offline_seller_pan_number as PanNo,offline_seller_registration_no as RegNo,is_service_provider as ServiceProvider,is_onboarded as Onboarded,address_house_no as HouseNo,address_block as Block,address_street as Street,address_sector as Sector,address_city as City,address_state as State,address_pin_code as PinCode,address_nearby as NearBy,latitude as Lattitude,longitude as Longitude FROM table_offline_seller WHERE status_id!=3 ORDER BY offline_seller_name '+LimitCondition+'', function (error, service_center, fields) {
                    if (error) throw error;
                    if(service_center.length > 0){
                        var data = '{"statusCode": 100,"OfflineSellerList": '+ JSON.stringify(service_center) +'}';
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
                TokenNo: Joi.string().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Search Offline Seller List
server.route({
    method: 'POST',
    path: '/Services/SearchOfflineSellerList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT offline_seller_id as ID,offline_seller_name as Name,offline_seller_owner_name as OwnerName,offline_seller_gstin_no as GstinNo,offline_seller_pan_number as PanNo,offline_seller_registration_no as RegNo,is_service_provider as ServiceProvider,is_onboarded as Onboarded,address_house_no as HouseNo,address_block as Block,address_street as Street,address_sector as Sector,address_city as City,address_state as State,address_pin_code as PinCode,address_nearby as NearBy,latitude as Lattitude,longitude as Longitude FROM table_offline_seller WHERE status_id!=3 and (offline_seller_name LIKE "%'+Search+'%" OR offline_seller_owner_name LIKE "%'+Search+'%" OR offline_seller_gstin_no LIKE "%'+Search+'%" OR offline_seller_pan_number LIKE "%'+Search+'%" OR offline_seller_registration_no LIKE "%'+Search+'%") ORDER BY offline_seller_name ', function (error, service_center, fields) {
                    if (error) throw error;
                    if(service_center.length > 0){
                        var data = '{"statusCode": 100,"OfflineSellerList": '+ JSON.stringify(service_center) +'}';
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
                TokenNo: Joi.string().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Offline Seller By ID
server.route({
    method: 'POST',
    path: '/Services/OfflineSellerByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT offline_seller_id as ID,offline_seller_name as Name,offline_seller_owner_name as OwnerName,offline_seller_gstin_no as GstinNo,offline_seller_pan_number as PanNo,offline_seller_registration_no as RegNo,is_service_provider as ServiceProvider,is_onboarded as Onboarded,address_house_no as HouseNo,address_block as Block,address_street as Street,address_sector as Sector,address_city as City,address_state as State,address_pin_code as PinCode,address_nearby as NearBy,latitude as Lattitude,longitude as Longitude FROM table_offline_seller WHERE offline_seller_id = "' + ID + '"', function (error, offline_seller, fields) {
                    if (error) throw error;
                    if(offline_seller.length > 0){
                        connection.query('SELECT seller_detail_id as DetailID,contactdetail_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_offline_seller_details WHERE offline_seller_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+offline_seller[0]['ID']+',"Name":"'+offline_seller[0]['Name']+'","OwnerName":"'+offline_seller[0]['OwnerName']+'","GstinNo":"'+offline_seller[0]['GstinNo']+'","PanNo":"'+offline_seller[0]['PanNo']+'","RegNo":"'+offline_seller[0]['RegNo']+'","ServiceProvider":"'+offline_seller[0]['ServiceProvider']+'","Onboarded":"'+offline_seller[0]['Onboarded']+'","HouseNo":"'+offline_seller[0]['HouseNo']+'","Block":"'+offline_seller[0]['Block']+'","Street":"'+offline_seller[0]['Street']+'","Sector":"'+offline_seller[0]['Sector']+'","City":"'+offline_seller[0]['City']+'","State":"'+offline_seller[0]['State']+'","PinCode":"'+offline_seller[0]['PinCode']+'","NearBy":"'+offline_seller[0]['NearBy']+'","Lattitude":"'+offline_seller[0]['Lattitude']+'","Longitude":"'+offline_seller[0]['Longitude']+'","Details": '+ JSON.stringify(detail) +'}';
                            reply(data);
                        });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Admin Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/AdminConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        if(OffSet != null && Limit != null  ){
                            if(!isNaN(OffSet) && !isNaN(OffSet)){
                                var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                            } else {
                                var LimitCondition = '';
                            }
                        } else {
                            var LimitCondition = '';
                        }
                        connection.query('SELECT b.bill_id as BID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id WHERE b.admin_status=4 and b.user_status!=3 ORDER BY b.updated_on DESC '+LimitCondition+' ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    case 8:
                        if(OffSet != null && Limit != null  ){
                            if(!isNaN(OffSet) && !isNaN(OffSet)){
                                var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                            } else {
                                var LimitCondition = '';
                            }
                        } else {
                            var LimitCondition = '';
                        }
                        connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,ceu.fullname as CE_Name,ceu.email_id as CE_EmailID,ce.created_on as CE_TaskDate,ces.status_name as CE_Status,ces.status_id as CE_StatusID,qeu.fullname as QE_Name,qeu.email_id as QE_EmailID,qe.created_on as QE_TaskDate,qes.status_name as QE_Status,qes.status_id as QE_StatusID FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ceu.user_id=ce.user_id LEFT JOIN table_status as ces on ce.status_id=ces.status_id LEFT JOIN table_qual_executive_tasks as qe on qe.bill_id=b.bill_id LEFT JOIN table_users as qeu on qe.user_id=qeu.user_id LEFT JOIN table_status as qes on qes.status_id=qe.status_id WHERE b.admin_status=8 and b.user_status!=3 ORDER BY b.updated_on DESC '+LimitCondition+' ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    case 5:
                        if(OffSet != null && Limit != null  ){
                            if(!isNaN(OffSet) && !isNaN(OffSet)){
                                var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                            } else {
                                var LimitCondition = '';
                            }
                        } else {
                            var LimitCondition = '';
                        }
                        connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,ceu.fullname as CE_Name,ceu.email_id as CE_EmailID,ce.created_on as CE_TaskDate,ces.status_name as CE_Status,ces.status_id as CE_StatusID,qeu.fullname as QE_Name,qeu.email_id as QE_EmailID,qe.created_on as QE_TaskDate,qes.status_name as QE_Status,qes.status_id as QE_StatusID FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ceu.user_id=ce.user_id LEFT JOIN table_status as ces on ce.status_id=ces.status_id LEFT JOIN table_qual_executive_tasks as qe on qe.bill_id=b.bill_id LEFT JOIN table_users as qeu on qe.user_id=qeu.user_id LEFT JOIN table_status as qes on qes.status_id=qe.status_id WHERE b.admin_status=5 and b.user_status!=3 ORDER BY b.updated_on DESC '+LimitCondition+' ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    default:
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});

//Search Admin Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/SearchAdminConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        connection.query('SELECT b.bill_id as BID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id WHERE b.admin_status=4 and b.user_status!=3 AND (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%") ORDER BY b.updated_on DESC ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    case 8:
                        connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,ceu.fullname as CE_Name,ceu.email_id as CE_EmailID,ce.created_on as CE_TaskDate,ces.status_name as CE_Status,ces.status_id as CE_StatusID,qeu.fullname as QE_Name,qeu.email_id as QE_EmailID,qe.created_on as QE_TaskDate,qes.status_name as QE_Status,qes.status_id as QE_StatusID FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ceu.user_id=ce.user_id LEFT JOIN table_status as ces on ce.status_id=ces.status_id LEFT JOIN table_qual_executive_tasks as qe on qe.bill_id=b.bill_id LEFT JOIN table_users as qeu on qe.user_id=qeu.user_id LEFT JOIN table_status as qes on qes.status_id=qe.status_id WHERE b.admin_status=8 and b.user_status!=3 AND (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%") ORDER BY b.updated_on DESC ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    case 5:
                        connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,ceu.fullname as CE_Name,ceu.email_id as CE_EmailID,ce.created_on as CE_TaskDate,ces.status_name as CE_Status,ces.status_id as CE_StatusID,qeu.fullname as QE_Name,qeu.email_id as QE_EmailID,qe.created_on as QE_TaskDate,qes.status_name as QE_Status,qes.status_id as QE_StatusID FROM table_consumer_bills as b LEFT JOIN table_users as u on u.user_id=b.user_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ceu.user_id=ce.user_id LEFT JOIN table_status as ces on ce.status_id=ces.status_id LEFT JOIN table_qual_executive_tasks as qe on qe.bill_id=b.bill_id LEFT JOIN table_users as qeu on qe.user_id=qeu.user_id LEFT JOIN table_status as qes on qes.status_id=qe.status_id WHERE b.admin_status=5 and b.user_status!=3 AND (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%") ORDER BY b.updated_on DESC ', function (error, bill, fields) {
                            if (error) throw error;
                            if(bill.length > 0){
                                var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
                                reply(data);
                            } else {
                                var data = '{"statusCode": 105,"error": "Not Found","message": "Data not Available."}';
                                reply(data);
                            }
                        });
                        break;
                    default:
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Task Assigned To CE
server.route({
    method: 'POST',
    path: '/Services/TaskAssignedCE',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const UID = request.payload.UID;
        const BID = request.payload.BID;
        const Comments = request.payload.Comments;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT id FROM table_cust_executive_tasks WHERE user_id = "' + UID + '" and bill_id = "' + BID + '"', function (error, data, fields) {
                    if (error) throw error;
                    if(data.length > 0){
                        connection.query('UPDATE table_cust_executive_tasks SET comments="' + Comments + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '",status_id=7 WHERE id="' + data[0]['id'] + '"', function (error, results, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"error": "","message": "Task Assigned successfully."}';
                            reply(data);
                        });
                    } else {
                        connection.query('INSERT INTO table_cust_executive_tasks (user_id,bill_id,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + UID + '","' + BID + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",6)', function (error, results, fields) {
                            if (error) throw error;
                            connection.query('UPDATE table_consumer_bills SET admin_status=8 WHERE bill_id="' + BID + '"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            connection.query('DELETE FROM table_cust_executive_tasks WHERE bill_id="' + BID + '" and user_id!="' + UID + '"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            var data = '{"statusCode": 100,"error": "","message": "Task Assigned successfully."}';
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
                TokenNo: Joi.string().required(),
                UID: Joi.number().integer().required(),
                BID: Joi.number().integer().required(),
                Comments: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Task Assigned To QE
server.route({
    method: 'POST',
    path: '/Services/TaskAssignedQE',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const UID = request.payload.UID;
        const BID = request.payload.BID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('INSERT INTO table_qual_executive_tasks (user_id,bill_id,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + UID + '","' + BID + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",6)', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Task Assigned successfully."}';
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
                TokenNo: Joi.string().required(),
                UID: Joi.number().integer().required(),
                BID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get CE Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/CEConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        var status = true;
                        var condition = 'WHERE ce.status_id IN (6,7) and  b.user_status!=3 and ce.user_id='+UserID+'';
                        break;
                    case 5:
                        var status = true;
                        var condition = 'WHERE ce.status_id=5 and ce.user_id='+UserID+'';
                        break;
                    default:
                        var status = false;
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
                }
                if(status == true){
                    if(OffSet != null && Limit != null  ){
                        if(!isNaN(OffSet) && !isNaN(OffSet)){
                            var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                        } else {
                            var LimitCondition = '';
                        }
                    } else {
                        var LimitCondition = '';
                    }
                    connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,assu.fullname as AssignedBy,ce.created_on as AssignedDate,status_name as Status FROM table_cust_executive_tasks as ce INNER JOIN table_consumer_bills as b on b.bill_id=ce.bill_id LEFT JOIN table_users as u on u.user_id=b.user_id  LEFT JOIN table_users as assu on ce.updated_by_user_id=assu.user_id LEFT JOIN table_status as s on s.status_id=ce.status_id '+condition+' ORDER BY ce.updated_on DESC '+LimitCondition+'', function (error, bill, fields) {
                        if (error) throw error;
                        if(bill.length > 0){
                            var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Search CE Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/SearchCEConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        var status = true;
                        var condition = 'WHERE ce.status_id IN (6,7) and  b.user_status!=3 and ce.user_id='+UserID+' and (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%")';
                        break;
                    case 5:
                        var status = true;
                        var condition = 'WHERE ce.status_id=5 and ce.user_id='+UserID+' and (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%")';
                        break;
                    default:
                        var status = false;
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
                }
                if(status == true){
                    connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,assu.fullname as AssignedBy,ce.created_on as AssignedDate,status_name as Status FROM table_cust_executive_tasks as ce INNER JOIN table_consumer_bills as b on b.bill_id=ce.bill_id LEFT JOIN table_users as u on u.user_id=b.user_id  LEFT JOIN table_users as assu on ce.updated_by_user_id=assu.user_id LEFT JOIN table_status as s on s.status_id=ce.status_id '+condition+' ORDER BY ce.updated_on DESC ', function (error, bill, fields) {
                        if (error) throw error;
                        if(bill.length > 0){
                            var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get QE Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/QEConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        var status = true;
                        var condition = 'WHERE qe.status_id=6 and  b.user_status!=3 and qe.user_id='+UserID+'';
                        break;
                    case 5:
                        var status = true;
                        var condition = 'WHERE qe.status_id=5 and qe.user_id='+UserID+'';
                        break;
                    default:
                        var status = false;
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
                }
                if(status == true){
                    if(OffSet != null && Limit != null  ){
                        if(!isNaN(OffSet) && !isNaN(OffSet)){
                            var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                        } else {
                            var LimitCondition = '';
                        }
                    } else {
                        var LimitCondition = '';
                    }
                    connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,assu.fullname as AssignedBy,qe.created_on as AssignedDate,ceu.user_id as CE_ID,ceu.fullname as CE_Name,s.status_name as Status FROM table_qual_executive_tasks as qe INNER JOIN table_consumer_bills as b on b.bill_id=qe.bill_id LEFT JOIN table_users as u on u.user_id=b.user_id  LEFT JOIN table_users as assu on qe.updated_by_user_id=assu.user_id LEFT JOIN table_status as s on s.status_id=qe.status_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ce.user_id=ceu.user_id '+condition+' ORDER BY qe.updated_on DESC '+LimitCondition+'', function (error, bill, fields) {
                        if (error) throw error;
                        if(bill.length > 0){
                            var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Search QE Consumer Bills List
server.route({
    method: 'POST',
    path: '/Services/SearchQEConsumerBillsList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Status = request.payload.Status;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (Status) {
                    case 4:
                        var status = true;
                        var condition = 'WHERE qe.status_id=6 and  b.user_status!=3 and qe.user_id='+UserID+' and (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%")';
                        break;
                    case 5:
                        var status = true;
                        var condition = 'WHERE qe.status_id=5 and qe.user_id='+UserID+' and (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%")';
                        break;
                    default:
                        var status = false;
                        var data = '{"statusCode": 100,"error": "Invalid Status","message": "Invalid Status."}';
                        reply(data);
                }
                if(status == true){
                    connection.query('SELECT b.bill_id as BID,b.user_id as UID,b.bill_reference_id as BillNo,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,b.created_on as BillDate,assu.fullname as AssignedBy,qe.created_on as AssignedDate,ceu.user_id as CE_ID,ceu.fullname as CE_Name,s.status_name as Status FROM table_qual_executive_tasks as qe INNER JOIN table_consumer_bills as b on b.bill_id=qe.bill_id LEFT JOIN table_users as u on u.user_id=b.user_id  LEFT JOIN table_users as assu on qe.updated_by_user_id=assu.user_id LEFT JOIN table_status as s on s.status_id=qe.status_id LEFT JOIN table_cust_executive_tasks as ce on ce.bill_id=b.bill_id LEFT JOIN table_users as ceu on ce.user_id=ceu.user_id '+condition+' ORDER BY qe.updated_on DESC ', function (error, bill, fields) {
                        if (error) throw error;
                        if(bill.length > 0){
                            var data = '{"statusCode": 100,"BillList": '+ JSON.stringify(bill) +'}';
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
                TokenNo: Joi.string().required(),
                Status: Joi.number().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Add QE Task Assigned To CE
server.route({
    method: 'POST',
    path: '/Services/QEAssignedCE',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const UID = request.payload.UID;
        const BID = request.payload.BID;
        const Comments = request.payload.Comments;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_cust_executive_tasks SET comments="' + Comments + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '",status_id=7 WHERE user_id="' + UID + '" and bill_id="' + BID + '"', function (error, results, fields) {
                    if (error) throw error;
                    connection.query('DELETE FROM table_qual_executive_tasks WHERE user_id="' + UserID + '" and bill_id="' + BID + '"', function (error, results, fields) {
                        if (error) throw error;
                    });
                    var data = '{"statusCode": 100,"error": "","message": "Task Assigned successfully."}';
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
                TokenNo: Joi.string().required(),
                UID: Joi.number().integer().required(),
                BID: Joi.number().integer().required(),
                Comments: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Category Form
server.route({
    method: 'POST',
    path: '/Services/AddCategoryForm',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Level = request.payload.Level;
        const RefID = request.payload.RefID;
        const Name = request.payload.Name;
        const FormList = request.payload.FormList;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT category_id FROM table_categories WHERE category_name = "' + Name + '" and status_id=1 and ref_id="'+RefID+'"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_categories (category_name,ref_id,category_level,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + Name + '","' + RefID + '","' + Level + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < FormList.length; i++) {
                                const CatType=FormList[i].Type;
                                const List = FormList[i].List;
                                connection.query('INSERT INTO table_category_form (category_id,form_element_name,form_element_type,status_id) VALUES ("'+results['insertId']+'","'+FormList[i].ElementName+'","'+FormList[i].Type+'",1)', function (error, formlist, fields) {
                                    if (error) throw error;
                                        if(CatType == 2){
                                            for(var a = 0; a < List.length; a++) {
                                            connection.query('INSERT INTO table_category_form_mapping (category_form_id,dropdown_name,status_id) VALUES ("'+formlist['insertId']+'","'+List[a].DropdownName+'",1)', function (error, list, fields) {
                                             });
                                         }
                                     }
                                });
                            }
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                Level: Joi.number().integer().required(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                FormList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Category By ID
server.route({
    method: 'POST',
    path: '/Services/CategoryFormByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT category_id as ID,category_name as Name,ref_id as RefID,category_level as Level FROM table_categories WHERE category_id="' + ID + '"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        connection.query('SELECT category_form_id as FormID,form_element_name as ElementName,form_element_type as Type FROM table_category_form WHERE category_id="' + ID + '" and status_id=1 ', function (error, form, fields) {
                            var id = [];
                            for(var i = 0; i < form.length; i++) {
                                id.push(form[i].FormID);
                            }
                            var FormIDList = id.join();
                           connection.query('SELECT category_form_id as FormID,mapping_id as DropdownID,dropdown_name as DropdownName FROM table_category_form_mapping WHERE category_form_id IN ('+FormIDList+')  and status_id=1 ', function (error, droupdown, fields) {
                               //console.log(droupdown);
                               var data = '{"statusCode": 100,"Category": '+ JSON.stringify(category) +',"FormList": '+ JSON.stringify(form) +',"List": '+ JSON.stringify(droupdown) +'}';
                               reply(data);
                            });
                        });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Edit Form Category
server.route({
    method: 'POST',
    path: '/Services/EditCategoryForm',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        const Name = request.payload.Name;
        const RefID = request.payload.RefID;
        const FormList = request.payload.FormList;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT category_id FROM table_categories WHERE category_name = "' + Name + '" and status_id=1 and category_id!="'+ID+'" and ref_id="'+RefID+'"', function (error, category, fields) {
                    if (error) throw error;
                    if(category.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Data Exist."}';
                        reply(data);
                    } else {
                        connection.query('UPDATE table_categories SET category_name="' + Name + '",updated_on="' + getDateTime() + '",updated_by_user_id="' + UserID + '" WHERE category_id="' + ID + '"', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < FormList.length; i++) {
                                const CatType=FormList[i].Type;
                                const List = FormList[i].List;
                                if(FormList[i].FormID != null && FormList[i].FormID != ''){
                                    connection.query('UPDATE table_category_form SET form_element_name="' + FormList[i].ElementName + '" "WHERE category_form_id="' + FormList[i].FormID + '"', function (error, detail, fields) {
                                        if(CatType == 2){
                                            for(var a = 0; a < List.length; a++) {
                                                if(List[a].DropdownID != null && List[a].DropdownID !=''){
                                                    connection.query('UPDATE table_category_form_mapping SET dropdown_name="' + List[a].DropdownName + '" "WHERE mapping_id="' + List[a].DropdownID + '"', function (error, detail, fields) {
                                                    });
                                                } else {
                                                    connection.query('INSERT INTO table_category_form_mapping (category_form_id,dropdown_name,status_id) VALUES ("'+FormList[i].FormID+'","'+List[a].DropdownName+'",1)', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                        }
                                    });
                                } else {
                                    connection.query('INSERT INTO table_category_form (category_id,form_element_name,form_element_type,status_id) VALUES ("'+ID+'","'+FormList[i].ElementName+'","'+FormList[i].Type+'",1)', function (error, formlist, fields) {
                                        if (error) throw error;
                                        if(CatType == 2){
                                            for(var a = 0; a < List.length; a++) {
                                                connection.query('INSERT INTO table_category_form_mapping (category_form_id,dropdown_name,status_id) VALUES ("'+formlist['insertId']+'","'+List[a].DropdownName+'",1)', function (error, list, fields) {
                                                });
                                            }
                                        }
                                    });
                                }

                            }
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
                TokenNo: Joi.string().required(),
                Name: Joi.string().required(),
                ID: Joi.number().integer().required(),
                RefID: [Joi.number().integer(), Joi.allow(null)],
                FormList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Form Element
server.route({
    method: 'POST',
    path: '/Services/DeleteFromElement',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_category_form as f left Join table_category_form_mapping as m on m.category_form_id=f.category_form_id SET f.status_id=3,m.status_id=3 WHERE f.category_form_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Form Element Dropdown
server.route({
    method: 'POST',
    path: '/Services/DeleteFromElementDropdown',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_category_form_mapping SET status_id=3 WHERE mapping_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Consumer Bill By ID
server.route({
    method: 'POST',
    path: '/Services/ConsumerBillByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT b.bill_id as BillID,b.bill_reference_id BillNo,u.user_id as UserID,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo FROM table_consumer_bills as b left join table_users as u on b.user_id=u.user_id WHERE b.bill_id = "' + ID + '"', function (error, bill, fields) {
                    if (error) throw error;
                    if(bill.length > 0){
                        connection.query('SELECT bill_copy_id as ImageID FROM table_consumer_bill_copies WHERE bill_id = "' + ID + '" and status_id!=3', function (error, image, fields) {
                            if (error) throw error;
                            connection.query('SELECT d.bill_detail_id as DetailID,d.consumer_name as Name,d.consumer_email_id as EmailID,d.consumer_phone_no as PhoneNo,d.invoice_number as Invoice, d.total_purchase_value as TotalAmount,d.taxes as Tex,d.purchase_date as PurchaseDate FROM table_consumer_bill_details as d LEFT JOIN table_consumer_bill_mapping as m on (m.ref_id=d.bill_detail_id and m.bill_ref_type=1) WHERE m.bill_id = "' + ID + '" and d.status_id!=3', function (error, detail, fields) {
                                if (error) throw error;
                                connection.query('SELECT p.bill_product_id as ProductID,p.product_name as ProductName,p.value_of_purchase as Value,p.taxes as Taxes,p.tag as Tag,mc.category_name as MasterCatName,c.category_name as CatName, b.brand_name,co.color_name FROM table_consumer_bill_products as p LEFT JOIN table_consumer_bill_mapping as m on (m.ref_id=p.bill_product_id and m.bill_ref_type=2) LEFT JOIN table_categories as mc on mc.category_id=p.master_category_id LEFT JOIN table_categories as c on c.category_id=p.category_id LEFT JOIN table_brands as b on b.brand_id=p.brand_id LEFT JOIN table_color as co on co.color_id=p.color_id WHERE m.bill_id = "' + ID + '" and p.status_id!=3', function (error, productdetail, fields) {
                                    if (error) throw error;
                                    var data = '{"statusCode": 100,"BillID":'+bill[0]['BillID']+',"BillNo":"'+bill[0]['BillNo']+'","UserID":"'+bill[0]['UserID']+'","Name":"'+bill[0]['Name']+'","EmailID":"'+bill[0]['EmailID']+'","PhoneNo":"'+bill[0]['PhoneNo']+'","ImageList": '+ JSON.stringify(image) +',"Detail": '+ JSON.stringify(detail) +',"ProductDetail": '+ JSON.stringify(productdetail) +'}';
                                    reply(data);
                                });
                            });
                        });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Consumer Bill
server.route({
    method: 'POST',
    path: '/Services/AddConsumerBill',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BillID = request.payload.BillID;
        const BillUserID = request.payload.UserID;
        //console.log(request);
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('INSERT INTO table_consumer_bill_details (user_id,consumer_name,consumer_email_id,consumer_phone_no,document_id,invoice_number,total_purchase_value,taxes,purchase_date,created_on,updated_on,updated_by_user_id,status_id) VALUES ("'+BillUserID+'","'+request.payload.Name+'","'+request.payload.EmailID+'","'+request.payload.PhoneNo+'","'+request.payload.DocID+'","'+request.payload.InvoiceNo+'","'+request.payload.TotalValue+'","'+request.payload.Taxes+'","'+request.payload.DateofPurchase+'","'+getDateTime()+'","'+getDateTime()+'","'+UserID+'",1)', function (error, bildetail, fields) {
                    if (error) throw error;
                    const BillDetailID = bildetail['insertId'];
                    connection.query('INSERT INTO table_consumer_bill_mapping (bill_id,bill_ref_type,ref_id) VALUES ("'+request.payload.BillID+'",1,"'+BillDetailID+'")', function (error, list, fields) {
                        if (error) throw error;
                    });
                    if(request.payload.OnlineSellerID != null && request.payload.OnlineSellerID !=''){
                        connection.query('INSERT INTO table_consumer_bill_seller_mapping (bill_detail_id,ref_type,seller_ref_id) VALUES ("'+BillDetailID+'",1,"'+request.payload.OnlineSellerID+'")', function (error, list, fields) {
                            if (error) throw error;
                        });
                    }
                    if(request.payload.SellerList.length > 0){
                        const SellerList = request.payload.SellerList;
                        //console.log(SellerList, 'SellerList')
                        for(var s = 0; s < SellerList.length; s++) {
                            connection.query('INSERT INTO table_consumer_bill_seller_mapping (bill_detail_id,ref_type,seller_ref_id) VALUES ("'+BillDetailID+'",2,"'+SellerList[s]+'")', function (error, list, fields) {
                                if (error) throw error;
                            });
                        }
                    }
                    if(request.payload.BillImage.length > 0){
                        for(var i = 0; i < request.payload.BillImage.length; i++) {
                            connection.query('INSERT INTO table_consumer_bill_details_copies (bill_detail_id,bill_copy_id) VALUES ("'+BillDetailID+'","'+request.payload.BillImage[i]+'")', function (error, list, fields) {
                            });
                        }
                    }
                    if(request.payload.ProductList.length > 0){
                        const ProductList = request.payload.ProductList;
                        for(var p = 0; p < ProductList.length; p++) {
                            var ProductForm = ProductList[p].ProductForm;
                            var InsuranceList = ProductList[p].InsuranceList;
                            var WarrantyList = ProductList[p].WarrantyList;
                            var AMCList = ProductList[p].AMCList;
                            var RepairList = ProductList[p].RepairList;
                            connection.query('INSERT INTO table_consumer_bill_products (bill_detail_id,user_id,product_name,master_category_id,category_id,brand_id,color_id,value_of_purchase,taxes,tag,status_id) VALUES ("'+BillDetailID+'","'+BillUserID+'","'+ProductList[p].ProductName+'","'+ProductList[p].MasterCatID+'","'+ProductList[p].CatID+'","'+ProductList[p].BrandID+'","'+ProductList[p].ColorID+'","'+ProductList[p].Value+'","'+ProductList[p].Taxes+'","'+ProductList[p].Tag+'",1)', function (error, product, fields) {
                                if (error) throw error;
                                const ProductID = product['insertId'];
                             /* connection.query('INSERT INTO table_consumer_bill_mapping (bill_id,bill_ref_type,ref_id) VALUES ("'+BillID+'",2,"'+ProductID+'")', function (error, list, fields) {
                              });*/
                                if(ProductForm.length > 0){
                                    for(var i = 0; i < ProductForm.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_product_meta_data (bill_product_id,category_form_id,form_element_value) VALUES ("'+product['insertId']+'","'+ProductForm[i].CatFormID+'","'+ProductForm[i].value+'")', function (error, detail, fields) {
                                        });
                                    }
                                }
                                // Add Insurance
                                if(InsuranceList.length > 0){
                                    for(var i = 0; i < InsuranceList.length; i++) {
                                        var Insurance = InsuranceList[i];
                                        var InsuranceSellerInfo = InsuranceList[i].SellerInfo;
                                        var InsuranceInclusions = InsuranceList[i].Inclusions;
                                        var InsuranceExclusions = InsuranceList[i].Exclusions;
                                        var InsuranceImage = InsuranceList[i].InsuranceImage;
                                        if(InsuranceList[i].BrandID != null && InsuranceList[i].BrandID!='') {
                                            var SellerType = 1;
                                            var SellerID = InsuranceList[i].BrandID;
                                        } else {
                                            var SellerType = 2;
                                            var SellerID = InsuranceList[i].SellerInfo;
                                        }
                                        connection.query('INSERT INTO table_consumer_bill_insurance (user_id,bill_product_id,seller_type,seller_id,insurance_plan,policy_number,amount_insured,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+InsuranceList[i].Plan+'","'+InsuranceList[i].PolicyNo+'","'+InsuranceList[i].AmountInsured+'","'+InsuranceList[i].PremiumType+'","'+InsuranceList[i].PremiumAmount+'","'+InsuranceList[i].PolicyEffectiveDate+'","'+InsuranceList[i].PolicyExpiryDate+'",1)', function (error, insurance, fields) {
                                            if(InsuranceImage.length > 0){
                                                for(var i = 0; i < InsuranceImage.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_insurance_copies (bill_insurance_id,bill_copy_id) VALUES ("'+insurance['insertId']+'","'+InsuranceImage[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(InsuranceInclusions.length > 0){
                                                for(var i = 0; i < InsuranceInclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_insurance_inclusions (bill_insurance_id,inclusions_id) VALUES ("'+insurance['insertId']+'","'+InsuranceInclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(InsuranceExclusions.length > 0){
                                                for(var i = 0; i < InsuranceExclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_insurance_exclusions (bill_insurance_id,exclusions_id) VALUES ("'+insurance['insertId']+'","'+InsuranceExclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }                                //Add Warranty
                                if(WarrantyList.length > 0){
                                    for(var w = 0; w < WarrantyList.length; w++) {
                                        var Warranty = WarrantyList[w];
                                        var WarrantySellerInfo = WarrantyList[w].SellerInfo;
                                        var WarrantyInclusions = WarrantyList[w].Inclusions;
                                        var WarrantyExclusions = WarrantyList[w].Exclusions;
                                        var WarrantyImage = WarrantyList[w].WarrantyImage;
                                        if(WarrantyList[w].BrandID != null && WarrantyList[w].BrandID!='') {
                                            var SellerType = 1;
                                            var SellerID = WarrantyList[w].BrandID;
                                        } else {
                                            var SellerType = 2;
                                            var SellerID = WarrantyList[w].SellerInfo;
                                        }
                                        connection.query('INSERT INTO table_consumer_bill_warranty (user_id,bill_product_id,seller_type,seller_id,warranty_type,policy_number,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+WarrantyList[w].WarrantyType+'","'+WarrantyList[w].PolicyNo+'","'+WarrantyList[w].PremiumType+'","'+WarrantyList[w].PremiumAmount+'","'+WarrantyList[w].PolicyEffectiveDate+'","'+WarrantyList[w].PolicyExpiryDate+'",1)', function (error, warranty, fields) {
                                            if(WarrantyImage.length > 0){
                                                for(var i = 0; i < WarrantyImage.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_warranty_copies (bill_warranty_id,bill_copy_id) VALUES ("'+warranty['insertId']+'","'+WarrantyImage[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(WarrantyInclusions.length > 0){
                                                for(var i = 0; i < WarrantyInclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_warranty_inclusions ( bill_warranty_id,inclusions_id) VALUES ("'+warranty['insertId']+'","'+WarrantyInclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(WarrantyExclusions.length > 0){
                                                for(var i = 0; i < WarrantyExclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_warranty_exclusions (bill_warranty_id,exclusions_id) VALUES ("'+warranty['insertId']+'","'+WarrantyExclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                                //Add AMC
                                if(AMCList.length > 0){
                                    for(var a = 0; a < AMCList.length; a++) {
                                        var AMC = AMCList[a];
                                        var AMCSellerInfo = AMCList[a].SellerInfo;
                                        var AMCInclusions = AMCList[a].Inclusions;
                                        var AMCExclusions = AMCList[a].Exclusions;
                                        var AMCImage = AMCList[a].AMCImage;
                                        if(AMCList[a].BrandID != null && AMCList[a].BrandID!='') {
                                            var SellerType = 1;
                                            var SellerID = AMCList[a].BrandID;
                                        } else {
                                            var SellerType = 2;
                                            var SellerID = AMCList[a].SellerInfo;
                                        }
                                        connection.query('INSERT INTO table_consumer_bill_amc (user_id,bill_product_id,seller_type,seller_id,policy_number,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+AMCList[a].PolicyNo+'","'+AMCList[a].PremiumType+'","'+AMCList[a].PremiumAmount+'","'+AMCList[a].PolicyEffectiveDate+'","'+AMCList[a].PolicyExpiryDate+'",1)', function (error, amc, fields) {
                                            if(AMCImage.length > 0){
                                                for(var i = 0; i < AMCImage.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_amc_copies (bill_amc_id,bill_copy_id) VALUES ("'+amc['insertId']+'","'+AMCImage[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(AMCInclusions.length > 0){
                                                for(var i = 0; i < AMCInclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_amc_inclusions (bill_amc_id,inclusions_id) VALUES ("'+amc['insertId']+'","'+AMCInclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                            if(AMCInclusions.length > 0){
                                                for(var i = 0; i < AMCInclusions.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_amc_exclusions (bill_amc_id,exclusions_id) VALUES ("'+amc['insertId']+'","'+AMCExclusions[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                                //Add Repair
                                if(RepairList.length > 0){
                                    for(var r = 0; r < RepairList.length; r++) {
                                        var RepairImage = RepairList[r].RepairImage;
                                        if(RepairList[r].BrandID != null && RepairList[r].BrandID!='') {
                                            var SellerType = 1;
                                            var SellerID = RepairList[r].BrandID;
                                        } else {
                                            var SellerType = 2;
                                            var SellerID = RepairList[r].SellerInfo;
                                        }
                                        connection.query('INSERT INTO table_consumer_bill_repair (user_id,bill_product_id,seller_type,seller_id,value_of_repair,taxes,repair_invoice_number,repair_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+RepairList[r].RepairValue+'","'+RepairList[r].Taxes+'","'+RepairList[r].RepairInvoiceNumber+'","'+RepairList[r].RepairDate+'",1)', function (error, repair, fields) {
                                            if(RepairImage.length > 0){
                                                for(var i = 0; i < RepairImage.length; i++) {
                                                    connection.query('INSERT INTO table_consumer_bill_repair_copies (bill_repair_id,bill_copy_id) VALUES ("'+repair['insertId']+'","'+RepairImage[i]+'")', function (error, list, fields) {
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });

                        }
                    }
                    //Update ce status
                   /* connection.query('UPDATE table_cust_executive_tasks SET status_id=5 WHERE bill_id="'+BillID +'" and user_id="'+UserID+'"', function (error, results, fields) {
                        if (error) throw error;
                    });*/
                    var data = '{"statusCode": 100,"message": "Data added."}';
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
                TokenNo: Joi.string().required(),
                UserID: Joi.number().integer().required(),
                BillID: Joi.number().integer().required(),
                DocID: Joi.number().integer().required(),
                InvoiceNo: [Joi.string(), Joi.allow(null)],
                Name:  [Joi.string(), Joi.allow(null)],
                EmailID: [Joi.string(), Joi.allow(null)],
                PhoneNo: [Joi.string(), Joi.allow(null)],
                TotalValue: [Joi.string(), Joi.allow(null)],
                Taxes: [Joi.string(), Joi.allow(null)],
                DateofPurchase: [Joi.string(), Joi.allow(null)],
                BillImage: Joi.array(),
                OnlineSellerID: [Joi.string(), Joi.allow(null)],
                SellerList: Joi.array(),
                ProductList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Consumer Bill By ID
server.route({
    method: 'POST',
    path: '/Services/ConsumerBillDetailByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT bill_detail_id as DetailID,consumer_name as Name,consumer_email_id as EmailID,consumer_phone_no as PhoneNo,invoice_number as InvoiceNo,total_purchase_value as TotalValue,taxes as Tax,purchase_date as PurchaseDate FROM table_consumer_bill_details WHERE status_id=1 AND bill_detail_id = "' + ID + '"', function (error, bill, fields) {
                    if (error) throw error;
                    if(bill.length > 0){
                        connection.query('SELECT m.bill_detail_id as DetailID,m.seller_ref_id as SellerID,s.seller_name as SellerName FROM table_consumer_bill_seller_mapping as m left join table_online_seller as s on s.seller_id=m.seller_ref_id WHERE m.bill_detail_id = "' + ID + '" AND m.ref_type=1 ', function (error, billonlineseller, fields) {
                            if (error) throw error;
                        connection.query('SELECT m.bill_detail_id as DetailID,m.seller_ref_id as SellerID,s.offline_seller_name as SellerName FROM table_consumer_bill_seller_mapping as m left join table_offline_seller as s on s.offline_seller_id=m.seller_ref_id WHERE m.bill_detail_id = "' + ID + '" AND m.ref_type=2 ', function (error, billofflineseller, fields) {
                            if (error) throw error;
                        connection.query('SELECT bill_copy_id as ImageID FROM table_consumer_bill_copies WHERE bill_id = "' + ID + '" and status_id!=3', function (error, image, fields) {
                            if (error) throw error;
                            connection.query('SELECT p.bill_product_id as ProductID,p.bill_detail_id as DetailID,p.product_name as ProductName,p.master_category_id as MasterCatID,p.category_id as ColorID,p.brand_id as BrandID,p.color_id as ColorID,p.value_of_purchase as Value,p.taxes as Taxes,p.tag as Tag,mc.category_name as MasterCatName, c.category_id as CatID, c.category_name as CatName, b.brand_name as BrandName, cl.color_name ColorName FROM table_consumer_bill_products as p left join table_categories as mc on p.master_category_id=mc.category_id left join table_categories as c on c.category_id=p.category_id left join table_brands as b on b.brand_id=p.brand_id left join table_color as cl on cl.color_id=p.color_id WHERE p.bill_detail_id = "' + ID + '" and p.status_id!=3', function (error, product, fields) {
                                if (error) throw error;
                                var id = [];
                                for(var i = 0; i < product.length; i++) {
                                    id.push(product[i].ProductID);
                                }
                                var ProductIDList = id.join();
                                connection.query('SELECT m.bill_product_id as ProductID,m.category_form_id as CatFormID,m.form_element_value as value, cf.form_element_name as CatFormName,cf.form_element_type as ElementType,mc.dropdown_name as DropdownValue FROM table_consumer_bill_product_meta_data as m left join table_category_form as cf on cf.category_form_id=m.category_form_id left join table_category_form_mapping as mc on (mc.mapping_id=m.form_element_value and cf.form_element_type=2)  WHERE m.bill_product_id IN ('+ProductIDList+')', function (error, productform, fields) {
                                    if (error) throw error;
                                    //Insurance List
                                    connection.query('SELECT i.bill_insurance_id as InsuranceID,i.bill_product_id as ProductID,i.seller_type as SellerType, i.seller_id as SellerID, b.brand_name as BrandName, s.offline_seller_name as SellerName, i.insurance_plan as Plan,i.policy_number as PolicyNo,i.amount_insured as AmountInsured,i.premium_type as PremiumType,i.premium_amount as PremiumAmount,i.policy_effective_date as PolicyEffectiveDate,i.policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_insurance as i LEFT JOIN table_brands as b on (b.brand_id=i.seller_id AND i.seller_type=1) LEFT JOIN table_offline_seller as s on (s.offline_seller_id=i.seller_id AND i.seller_type=2)  WHERE i.status_id=1 AND i.bill_product_id IN ('+ProductIDList+')', function (error, insurance, fields) {
                                        if (error) throw error;
                                        if(insurance.length > 0){
                                            var insuranceid = [];
                                            for(var i = 0; i < insurance.length; i++) {
                                                insuranceid.push(insurance[i].InsuranceID);
                                            }
                                            var InsuranceIDList = insuranceid.join();
                                        } else {
                                            var InsuranceIDList = 0;
                                        }

                                        connection.query('SELECT bill_insurance_id as InsuranceID,bill_copy_id as ImageID FROM table_consumer_bill_insurance_copies WHERE bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceimage, fields) {
                                            if (error) throw error;
                                            connection.query('SELECT i.bill_insurance_id as InsuranceID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_insurance_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceinclusions, fields) {
                                                if (error) throw error;
                                                connection.query('SELECT e.bill_insurance_id as InsuranceID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_insurance_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceexclusions, fields) {
                                                    if (error) throw error;
                                                    //Warranty List
                                                    connection.query('SELECT w.bill_warranty_id as WarrantyID,w.bill_product_id as ProductID,w.seller_type as SellerType,w.seller_id as SellerID, b.brand_name as BrandName, s.offline_seller_name as SellerName,w.warranty_type as WarrantyType,w.policy_number as PolicyNo,w.premium_type as PremiumType,w.premium_amount as PremiumAmount,w.policy_effective_date as PolicyEffectiveDate,w.policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_warranty as w LEFT JOIN table_brands as b on (b.brand_id=w.seller_id AND w.seller_type=1) LEFT JOIN table_offline_seller as s on (s.offline_seller_id=w.seller_id AND w.seller_type=2) WHERE w.status_id=1 AND w.bill_product_id IN ('+ProductIDList+')', function (error, warranty, fields) {
                                                        if (error) throw error;
                                                        if(warranty.length > 0){
                                                            var warrantyid = [];
                                                            for(var i = 0; i < warranty.length; i++) {
                                                                warrantyid.push(warranty[i].WarrantyID);
                                                            }
                                                            var WarrantyIDList = warrantyid.join();
                                                        } else {
                                                            var WarrantyIDList = 0;
                                                        }

                                                        connection.query('SELECT bill_warranty_id as WarrantyID,bill_copy_id as ImageID FROM table_consumer_bill_warranty_copies WHERE bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyimage, fields) {
                                                            if (error) throw error;
                                                            connection.query('SELECT e.bill_warranty_id as WarrantyID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_warranty_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyexclusions, fields) {
                                                                if (error) throw error;
                                                                connection.query('SELECT i.bill_warranty_id as WarrantyID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_warranty_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyinclusions, fields) {
                                                                    if (error) throw error;
                                                                    //AMC List
                                                                    connection.query('SELECT a.bill_amc_id as AmcID,a.bill_product_id as ProductID,a.seller_type as SellerType,a.seller_id as SellerID, b.brand_name as BrandName, s.offline_seller_name as SellerName,a.policy_number as PolicyNo,a.premium_type as PremiumType,a.premium_amount as PremiumAmount,a.policy_effective_date as PolicyEffectiveDate,a.policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_amc as a LEFT JOIN table_brands as b on (b.brand_id=a.seller_id AND a.seller_type=1) LEFT JOIN table_offline_seller as s on (s.offline_seller_id=a.seller_id AND a.seller_type=2) WHERE a.status_id=1 AND a.bill_product_id IN ('+ProductIDList+')', function (error, amc, fields) {
                                                                        if (error) throw error;
                                                                        if(amc.length > 0){
                                                                            var amcid = [];
                                                                            for (var i = 0; i < amc.length; i++) {
                                                                                amcid.push(amc[i].AmcID);
                                                                            }
                                                                            var AMCIDList = amcid.join();
                                                                        } else {
                                                                            var AMCIDList = 0;
                                                                        }
                                                                        connection.query('SELECT bill_amc_id as AmcID,bill_copy_id as ImageID FROM table_consumer_bill_amc_copies WHERE bill_amc_id IN ('+AMCIDList+')', function (error, amcimage, fields) {
                                                                            if (error) throw error;
                                                                            connection.query('SELECT e.bill_amc_id as AmcID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_amc_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_amc_id IN ('+AMCIDList+')', function (error, amcexclusions, fields) {
                                                                                if (error) throw error;
                                                                                connection.query('SELECT i.bill_amc_id as AmcID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_amc_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_amc_id IN (' + AMCIDList + ')', function (error, amcinclusions, fields) {
                                                                                    if (error) throw error;
                                                                                    //Repair List
                                                                                    connection.query('SELECT r.bill_repair_id as RepairID,r.bill_product_id as ProductID,r.seller_type as SellerType,r.seller_id as SellerID, b.brand_name as BrandName, s.offline_seller_name as SellerName,r.value_of_repair as RepairValue,r.taxes as Taxes,r.repair_invoice_number as RepairInvoiceNumber,r.repair_date as RepairDate FROM table_consumer_bill_repair as r LEFT JOIN table_brands as b on (b.brand_id=r.seller_id AND r.seller_type=1) LEFT JOIN table_offline_seller as s on (s.offline_seller_id=r.seller_id AND r.seller_type=2) WHERE r.status_id=1 AND r.bill_product_id IN ('+ProductIDList+')', function (error, repair, fields) {
                                                                                        if (error) throw error;
                                                                                        if(repair.length > 0){
                                                                                            var repairid = [];
                                                                                            for(var i = 0; i < repair.length; i++) {
                                                                                                repairid.push(repair[i].RepairID);
                                                                                            }
                                                                                            var RepairIDList = repairid.join();
                                                                                        } else {
                                                                                            var RepairIDList = 0;
                                                                                        }
                                                                                        connection.query('SELECT bill_repair_id as RepairID,bill_copy_id as ImageID FROM table_consumer_bill_repair_copies WHERE bill_repair_id IN ('+RepairIDList+')', function (error, repairimage, fields) {
                                                                                            if (error) throw error;
                                                                                            var data = '{"statusCode": 100,"BillDetail": '+ JSON.stringify(bill) +',"BillOnlineSeller": '+JSON.stringify(billonlineseller)+',"BillOfflineSeller": '+JSON.stringify(billofflineseller)+',"BillImage": '+JSON.stringify(image)+',"ProductList": '+JSON.stringify(product)+',"ProductForm":'+JSON.stringify(productform)+',"InsuranceList":'+JSON.stringify(insurance)+',"InsuranceImage":'+JSON.stringify(insuranceimage)+',"InsuranceInclusions":'+JSON.stringify(insuranceinclusions)+',"InsuranceExclusions":'+JSON.stringify(insuranceexclusions)+',"WarrantyList":'+JSON.stringify(warranty)+',"WarrantyImage":'+JSON.stringify(warrantyimage)+',"WarrantyExclusions":'+JSON.stringify(warrantyexclusions)+',"WarrantyInclusions":'+JSON.stringify(warrantyinclusions)+',"AMCList":'+JSON.stringify(amc)+',"AMCImage":'+JSON.stringify(amcimage)+',"AMCExclusions":'+JSON.stringify(amcexclusions)+',"AMCInclusions":'+JSON.stringify(amcinclusions)+',"RepairList":'+JSON.stringify(repair)+',"RepairImage":'+JSON.stringify(repairimage)+'}';
                                                                                            reply(data);
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                        });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Edit Consumer Bill
server.route({
    method: 'POST',
    path: '/Services/EditConsumerBill',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BillID = request.payload.BillID;
        const UserID = request.payload.UserID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_consumer_bill_details SET consumer_name = "'+request.payload.Name+'", consumer_email_id = "'+request.payload.EmailID+'", consumer_phone_no = "'+request.payload.PhoneNo+'", invoice_number = "'+request.payload.InvoiceNo+'", total_purchase_value = "'+request.payload.TotalValue+'", taxes = "'+request.payload.Taxes+'", purchase_date = "'+request.payload.DateofPurchase+'", updated_on = "'+getDateTime()+'",updated_by_user_id = "'+request.payload.UserID+'" WHERE bill_detail_id="'+request.payload.DetailID+'" ', function (error, bildetail, fields) {
                    if (error) throw error;
                });
                if(request.payload.BillImage.length > 0){
                    connection.query('DELETE FROM table_consumer_bill_details_copies WHERE bill_detail_id="'+request.payload.DetailID+'"', function (error, results, fields) {
                        if (error) throw error;
                    });
                    for(var i = 0; i < request.payload.BillImage.length; i++) {
                        connection.query('INSERT INTO table_consumer_bill_details_copies (bill_detail_id,bill_copy_id) VALUES ("'+request.payload.DetailID+'","'+request.payload.BillImage[i]+'")', function (error, list, fields) {
                        });
                    }
                }
                if(request.payload.ProductList.length > 0) {
                    const ProductList = request.payload.ProductList;
                    for (var p = 0; p < ProductList.length; p++) {
                        var ProductForm = ProductList[p].ProductForm;
                        var InsuranceList = ProductList[p].InsuranceList;
                        var WarrantyList = ProductList[p].WarrantyList;
                        var AMCList = ProductList[p].AMCList;
                        var RepairList = ProductList[p].RepairList;
                        connection.query('UPDATE table_consumer_bill_products SET product_name = "'+ProductList[p].ProductName+'",master_category_id = "'+ProductList[p].MasterCatID+'",category_id = "'+ProductList[p].CatID+'",brand_id = "'+ProductList[p].BrandID+'",color_id = "'+ProductList[p].ColorID+'",value_of_purchase = "'+ProductList[p].Value+'",taxes = "'+ProductList[p].Taxes+'",tag = "'+ProductList[p].Tag+'" WHERE bill_product_id = "'+ProductList[p].ProductID+'"', function (error, product, fields) {
                            if (error) throw error;
                        });
                        if(ProductForm.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_product_meta_data WHERE bill_product_id="'+request.payload.DetailID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < ProductForm.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_product_meta_data (bill_product_id,category_form_id,form_element_value) VALUES ("'+ProductList[p].ProductName+'","'+ProductForm[i].CatFormID+'","'+ProductForm[i].value+'")', function (error, detail, fields) {
                                });
                            }
                        }
                        // Update Insurance
                        if(InsuranceList.length > 0) {
                            for (var i = 0; i < InsuranceList.length; i++) {
                                var Insurance = InsuranceList[i];
                                //var InsuranceSellerInfo = InsuranceList[i].SellerInfo;
                                var InsuranceInclusions = InsuranceList[i].Inclusions;
                                var InsuranceExclusions = InsuranceList[i].Exclusions;
                                var InsuranceImage = InsuranceList[i].InsuranceImage;
                                if(InsuranceList[i].BrandID != null && InsuranceList[i].BrandID!='') {
                                    var SellerType = 1;
                                    var SellerID = InsuranceList[i].BrandID;
                                } else {
                                    var SellerType = 2;
                                    var SellerID = InsuranceList[i].SellerInfo;
                                }
                                connection.query('UPDATE table_consumer_bill_insurance SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",insurance_plan = "' + InsuranceList[i].Plan + '",policy_number = "' + InsuranceList[i].PolicyNo + '",amount_insured = "' + InsuranceList[i].AmountInsured + '",premium_type = "' + InsuranceList[i].PremiumType + '",premium_amount = "' + InsuranceList[i].PremiumAmount + '",policy_effective_date = "' + InsuranceList[i].PolicyEffectiveDate + '",policy_expiry_date = "' + InsuranceList[i].PolicyExpiryDate + '" WHERE bill_insurance_id = "' + InsuranceList[i].InsuranceID + '" ', function (error, insurance, fields) {
                                    if (error) throw error;
                                });
                                var InsuranceID = InsuranceList[i].InsuranceID;
                                if(InsuranceImage.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_insurance_copies WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < InsuranceImage.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_insurance_copies (bill_insurance_id,bill_copy_id) VALUES ("'+InsuranceID+'","'+InsuranceImage[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(InsuranceInclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_insurance_inclusions WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < InsuranceInclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_insurance_inclusions (bill_insurance_id,inclusions_id) VALUES ("'+InsuranceID+'","'+InsuranceInclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(InsuranceExclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_insurance_exclusions WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < InsuranceExclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_insurance_exclusions (bill_insurance_id,exclusions_id) VALUES ("'+InsuranceID+'","'+InsuranceExclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }

                            }
                        }
                        //Update Warranty
                        if(WarrantyList.length > 0) {
                            for (var w = 0; w < WarrantyList.length; w++) {
                                var Warranty = WarrantyList[w];
                                var WarrantySellerInfo = WarrantyList[w].SellerInfo;
                                var WarrantyInclusions = WarrantyList[w].Inclusions;
                                var WarrantyExclusions = WarrantyList[w].Exclusions;
                                var WarrantyImage = WarrantyList[w].WarrantyImage;
                                if(WarrantyList[w].BrandID != null && WarrantyList[w].BrandID!='') {
                                    var SellerType = 1;
                                    var SellerID = WarrantyList[w].BrandID;
                                } else {
                                    var SellerType = 2;
                                    var SellerID = WarrantyList[w].SellerInfo;
                                }
                                connection.query('UPDATE table_consumer_bill_warranty SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",warranty_type = "'+WarrantyList[w].WarrantyType+'",policy_number = "'+WarrantyList[w].PolicyNo+'",premium_type = "'+WarrantyList[w].PremiumType+'",premium_amount = "'+WarrantyList[w].PremiumAmount+'",policy_effective_date = "'+WarrantyList[w].PolicyEffectiveDate+'",policy_expiry_date = "'+WarrantyList[w].PolicyExpiryDate+'" WHERE bill_warranty_id = "'+WarrantyList[w].WarrantyID+'" ', function (error, warranty, fields) {
                                    if (error) throw error;
                                });
                                if(WarrantyImage.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_warranty_copies WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < WarrantyImage.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_warranty_copies (bill_warranty_id,bill_copy_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyImage[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(WarrantyInclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_warranty_inclusions WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < WarrantyInclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_warranty_inclusions ( bill_warranty_id,inclusions_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyInclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(WarrantyExclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_warranty_exclusions WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < WarrantyExclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_warranty_exclusions (bill_warranty_id,exclusions_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyExclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                            }
                        }
                        //Update AMC
                        if(AMCList.length > 0) {
                            for (var a = 0; a < AMCList.length; a++) {
                                var AMC = AMCList[a];
                                var AMCSellerInfo = AMCList[a].SellerInfo;
                                var AMCInclusions = AMCList[a].Inclusions;
                                var AMCExclusions = AMCList[a].Exclusions;
                                var AMCImage = AMCList[a].AMCImage;

                                if(AMCList[a].BrandID != null && AMCList[a].BrandID!='') {
                                    var SellerType = 1;
                                    var SellerID = AMCList[a].BrandID;
                                } else {
                                    var SellerType = 2;
                                    var SellerID = AMCList[a].SellerInfo;
                                }
                                connection.query('UPDATE table_consumer_bill_amc SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",policy_number = "'+AMCList[a].PolicyNo+'",premium_type = "'+AMCList[a].PremiumType+'",premium_amount = "'+AMCList[a].PremiumAmount+'",policy_effective_date = "'+AMCList[a].PolicyEffectiveDate+'",policy_expiry_date = "'+AMCList[a].PolicyExpiryDate+'" WHERE bill_amc_id = "'+AMCList[a].AmcID+'" ', function (error, amc, fields) {
                                    if (error) throw error;
                                });
                                if(AMCImage.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_amc_copies WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < AMCImage.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_amc_copies (bill_amc_id,bill_copy_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCImage[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(AMCInclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_amc_inclusions WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < AMCInclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_amc_inclusions (bill_amc_id,inclusions_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCInclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                                if(AMCInclusions.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_amc_exclusions WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < AMCInclusions.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_amc_exclusions (bill_amc_id,exclusions_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCExclusions[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                            }
                        }
                        //Update Repair
                        if(RepairList.length > 0) {
                            for (var r = 0; r < RepairList.length; r++) {
                                var RepairImage = RepairList[r].RepairImage;
                                if(RepairList[r].BrandID != null && RepairList[r].BrandID!='') {
                                    var SellerType = 1;
                                    var SellerID = RepairList[r].BrandID;
                                } else {
                                    var SellerType = 2;
                                    var SellerID = RepairList[r].SellerInfo;
                                }
                                connection.query('UPDATE table_consumer_bill_repair SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",value_of_repair = "'+RepairList[r].RepairValue+'",taxes = "'+RepairList[r].Taxes+'",repair_invoice_number = "'+RepairList[r].RepairInvoiceNumber+'",repair_date = "'+RepairList[r].RepairDate+'" WHERE bill_repair_id = "'+RepairList[r].RepairID+'" ', function (error, repair, fields) {
                                    if (error) throw error;
                                });
                                if(RepairImage.length > 0){
                                    connection.query('DELETE FROM table_consumer_bill_repair_copies WHERE bill_repair_id = "'+RepairList[r].RepairID+'"', function (error, results, fields) {
                                        if (error) throw error;
                                    });
                                    for(var i = 0; i < RepairImage.length; i++) {
                                        connection.query('INSERT INTO table_consumer_bill_repair_copies (bill_repair_id,bill_copy_id) VALUES ("'+RepairList[r].RepairID+'","'+RepairImage[i]+'")', function (error, list, fields) {
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                //Update ce status
                /*connection.query('UPDATE table_cust_executive_tasks SET status_id=5 WHERE bill_id="'+BillID +'" and user_id="'+UserID+'"', function (error, results, fields) {
                    if (error) throw error;
                });*/
                var data = '{"statusCode": 100,"message": "Data updated."}';
                reply(data);
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string().required(),
                UserID: Joi.number().integer().required(),
                DetailID: Joi.number().integer().required(),
                InvoiceNo: [Joi.string(), Joi.allow(null)],
                Name:  [Joi.string(), Joi.allow(null)],
                EmailID: [Joi.string(), Joi.allow(null)],
                PhoneNo: [Joi.string(), Joi.allow(null)],
                TotalValue: [Joi.string(), Joi.allow(null)],
                Taxes: [Joi.string(), Joi.allow(null)],
                DateofPurchase: [Joi.string(), Joi.allow(null)],
                BillImage: Joi.array(),
                ProductList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Exclusions List By Category ID
server.route({
    method: 'POST',
    path: '/Services/ExclusionsListByCategoryID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const RefID = request.payload.RefID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT exclusions_id as id,exclusions_name as name FROM table_list_of_exclusions WHERE category_id = "' + RefID + '" and status_id!=3 ', function (error, exclusions, fields) {
                    if (error) throw error;
                    if(exclusions.length > 0){
                        var data = '{"statusCode": 100,"ExclusionsList": '+ JSON.stringify(exclusions) +'}';
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
                TokenNo: Joi.string().required(),
                RefID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Inclusions List By Category ID
server.route({
    method: 'POST',
    path: '/Services/InclusionsListByCategoryID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const RefID = request.payload.RefID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT inclusions_id as id,inclusions_name as name FROM table_list_of_inclusions WHERE category_id = "' + RefID + '" and status_id!=3 ', function (error, inclusions, fields) {
                    if (error) throw error;
                    if(inclusions.length > 0){
                        var data = '{"statusCode": 100,"InclusionsList": '+ JSON.stringify(inclusions) +'}';
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
                TokenNo: Joi.string().required(),
                RefID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
})

//Add Task Complete To QE
server.route({
    method: 'POST',
    path: '/Services/TaskCompleteQE',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BID = request.payload.BID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_qual_executive_tasks SET status_id=5 WHERE bill_id="'+BID +'"', function (error, results, fields) {
                    if (error) throw error;
                })
                connection.query('UPDATE table_consumer_bills SET user_status=5, admin_status=5 WHERE bill_id="'+BID +'"', function (error, results, fields) {
                    if (error) throw error;
                });
                var data = '{"statusCode": 100,"error": "","message": "Task Complete successfully."}';
                reply(data);
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string().required(),
                BID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Add Consumer Product
server.route({
    method: 'POST',
    path: '/Services/AddConsumerProduct',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BillUserID = request.payload.UserID;
        const BillID = request.payload.BillID;
        const ProductID = request.payload.ProductID;
        const InsuranceList = request.payload.InsuranceList;
        const WarrantyList = request.payload.WarrantyList;
        const AMCList = request.payload.AMCList;
        const RepairList = request.payload.RepairList;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                // Add Insurance
                connection.query('INSERT INTO table_consumer_bill_mapping (bill_id,bill_ref_type,ref_id) VALUES ("'+BillID+'",2,"'+ProductID+'")', function (error, list, fields) {
                });
                if(InsuranceList.length > 0){
                    for(var i = 0; i < InsuranceList.length; i++) {
                        var Insurance = InsuranceList[i];
                        var InsuranceSellerInfo = InsuranceList[i].SellerInfo;
                        var InsuranceInclusions = InsuranceList[i].Inclusions;
                        var InsuranceExclusions = InsuranceList[i].Exclusions;
                        var InsuranceImage = InsuranceList[i].InsuranceImage;
                        if(InsuranceList[i].BrandID != null && InsuranceList[i].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = InsuranceList[i].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = InsuranceList[i].SellerInfo;
                        }
                        connection.query('INSERT INTO table_consumer_bill_insurance (user_id,bill_product_id,seller_type,seller_id,insurance_plan,policy_number,amount_insured,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+InsuranceList[i].Plan+'","'+InsuranceList[i].PolicyNo+'","'+InsuranceList[i].AmountInsured+'","'+InsuranceList[i].PremiumType+'","'+InsuranceList[i].PremiumAmount+'","'+InsuranceList[i].PolicyEffectiveDate+'","'+InsuranceList[i].PolicyExpiryDate+'",1)', function (error, insurance, fields) {
                            if(InsuranceImage.length > 0){
                                for(var i = 0; i < InsuranceImage.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_insurance_copies (bill_insurance_id,bill_copy_id) VALUES ("'+insurance['insertId']+'","'+InsuranceImage[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(InsuranceInclusions.length > 0){
                                for(var i = 0; i < InsuranceInclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_insurance_inclusions (bill_insurance_id,inclusions_id) VALUES ("'+insurance['insertId']+'","'+InsuranceInclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(InsuranceExclusions.length > 0){
                                for(var i = 0; i < InsuranceExclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_insurance_exclusions (bill_insurance_id,exclusions_id) VALUES ("'+insurance['insertId']+'","'+InsuranceExclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                        });
                    }
                }
                //Add Warranty
                if(WarrantyList.length > 0){
                    for(var w = 0; w < WarrantyList.length; w++) {
                        var Warranty = WarrantyList[w];
                        var WarrantySellerInfo = WarrantyList[w].SellerInfo;
                        var WarrantyInclusions = WarrantyList[w].Inclusions;
                        var WarrantyExclusions = WarrantyList[w].Exclusions;
                        var WarrantyImage = WarrantyList[w].WarrantyImage;
                        if(WarrantyList[w].BrandID != null && WarrantyList[w].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = WarrantyList[w].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = WarrantyList[w].SellerInfo;
                        }
                        connection.query('INSERT INTO table_consumer_bill_warranty (user_id,bill_product_id,seller_type,seller_id,warranty_type,policy_number,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+WarrantyList[w].WarrantyType+'","'+WarrantyList[w].PolicyNo+'","'+WarrantyList[w].PremiumType+'","'+WarrantyList[w].PremiumAmount+'","'+WarrantyList[w].PolicyEffectiveDate+'","'+WarrantyList[w].PolicyExpiryDate+'",1)', function (error, warranty, fields) {
                            if(WarrantyImage.length > 0){
                                for(var i = 0; i < WarrantyImage.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_warranty_copies (bill_warranty_id,bill_copy_id) VALUES ("'+warranty['insertId']+'","'+WarrantyImage[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(WarrantyInclusions.length > 0){
                                for(var i = 0; i < WarrantyInclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_warranty_inclusions ( bill_warranty_id,inclusions_id) VALUES ("'+warranty['insertId']+'","'+WarrantyInclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(WarrantyExclusions.length > 0){
                                for(var i = 0; i < WarrantyExclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_warranty_exclusions (bill_warranty_id,exclusions_id) VALUES ("'+warranty['insertId']+'","'+WarrantyExclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                        });
                    }
                }
                //Add AMC
                if(AMCList.length > 0){
                    for(var a = 0; a < AMCList.length; a++) {
                        var AMC = AMCList[a];
                        var AMCSellerInfo = AMCList[a].SellerInfo;
                        var AMCInclusions = AMCList[a].Inclusions;
                        var AMCExclusions = AMCList[a].Exclusions;
                        var AMCImage = AMCList[a].AMCImage;
                        if(AMCList[a].BrandID != null && AMCList[a].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = AMCList[a].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = AMCList[a].SellerInfo;
                        }
                        connection.query('INSERT INTO table_consumer_bill_amc (user_id,bill_product_id,seller_type,seller_id,policy_number,premium_type,premium_amount,policy_effective_date,policy_expiry_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+AMCList[a].PolicyNo+'","'+AMCList[a].PremiumType+'","'+AMCList[a].PremiumAmount+'","'+AMCList[a].PolicyEffectiveDate+'","'+AMCList[a].PolicyExpiryDate+'",1)', function (error, amc, fields) {
                            if(AMCImage.length > 0){
                                for(var i = 0; i < AMCImage.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_amc_copies (bill_amc_id,bill_copy_id) VALUES ("'+amc['insertId']+'","'+AMCImage[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(AMCInclusions.length > 0){
                                for(var i = 0; i < AMCInclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_amc_inclusions (bill_amc_id,inclusions_id) VALUES ("'+amc['insertId']+'","'+AMCInclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                            if(AMCInclusions.length > 0){
                                for(var i = 0; i < AMCInclusions.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_amc_exclusions (bill_amc_id,exclusions_id) VALUES ("'+amc['insertId']+'","'+AMCExclusions[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                        });
                    }
                }
                //Add Repair
                if(RepairList.length > 0){
                    for(var r = 0; r < RepairList.length; r++) {
                        var RepairImage = RepairList[r].RepairImage;
                        if(RepairList[r].BrandID != null && RepairList[r].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = RepairList[r].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = RepairList[r].SellerInfo;
                        }
                        connection.query('INSERT INTO table_consumer_bill_repair (user_id,bill_product_id,seller_type,seller_id,value_of_repair,taxes,repair_invoice_number,repair_date,status_id) VALUES ("'+BillUserID+'","'+ProductID+'","'+SellerType+'","'+SellerID+'","'+RepairList[r].RepairValue+'","'+RepairList[r].Taxes+'","'+RepairList[r].RepairInvoiceNumber+'","'+RepairList[r].RepairDate+'",1)', function (error, repair, fields) {
                            if(RepairImage.length > 0){
                                for(var i = 0; i < RepairImage.length; i++) {
                                    connection.query('INSERT INTO table_consumer_bill_repair_copies (bill_repair_id,bill_copy_id) VALUES ("'+repair['insertId']+'","'+RepairImage[i]+'")', function (error, list, fields) {
                                    });
                                }
                            }
                        });
                    }
                }
                //Update ce status
               /* connection.query('UPDATE table_cust_executive_tasks SET status_id=5 WHERE bill_id="'+BillID +'" and user_id="'+UserID+'"', function (error, results, fields) {
                    if (error) throw error;
                });*/
                var data = '{"statusCode": 100,"message": "Data added."}';
                reply(data);
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string().required(),
                UserID: Joi.number().integer().required(),
                BillID: Joi.number().integer().required(),
                ProductID: Joi.number().integer().required(),
                InsuranceList: Joi.array(),
                WarrantyList: Joi.array(),
                AMCList: Joi.array(),
                RepairList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Edit Consumer Product
server.route({
    method: 'POST',
    path: '/Services/EditConsumerProduct',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BillUserID = request.payload.UserID;
        const BillID = request.payload.BillID;
        const ProductID = request.payload.ProductID;
        const InsuranceList = request.payload.InsuranceList;
        const WarrantyList = request.payload.WarrantyList;
        const AMCList = request.payload.AMCList;
        const RepairList = request.payload.RepairList;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                // Update Insurance
                if(InsuranceList.length > 0){
                    for(var i = 0; i < InsuranceList.length; i++) {
                        var Insurance = InsuranceList[i];
                        var InsuranceSellerInfo = InsuranceList[i].SellerInfo;
                        var InsuranceInclusions = InsuranceList[i].Inclusions;
                        var InsuranceExclusions = InsuranceList[i].Exclusions;
                        var InsuranceImage = InsuranceList[i].InsuranceImage;
                        if(InsuranceList[i].BrandID != null && InsuranceList[i].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = InsuranceList[i].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = InsuranceList[i].SellerInfo;
                        }
                        connection.query('UPDATE table_consumer_bill_insurance SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",insurance_plan = "' + InsuranceList[i].Plan + '",policy_number = "' + InsuranceList[i].PolicyNo + '",amount_insured = "' + InsuranceList[i].AmountInsured + '",premium_type = "' + InsuranceList[i].PremiumType + '",premium_amount = "' + InsuranceList[i].PremiumAmount + '",policy_effective_date = "' + InsuranceList[i].PolicyEffectiveDate + '",policy_expiry_date = "' + InsuranceList[i].PolicyExpiryDate + '" WHERE bill_insurance_id = "' + InsuranceList[i].InsuranceID + '" ', function (error, insurance, fields) {
                            if (error) throw error;
                        });
                        var InsuranceID = InsuranceList[i].InsuranceID;
                        if(InsuranceImage.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_insurance_copies WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < InsuranceImage.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_insurance_copies (bill_insurance_id,bill_copy_id) VALUES ("'+InsuranceID+'","'+InsuranceImage[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(InsuranceInclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_insurance_inclusions WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < InsuranceInclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_insurance_inclusions (bill_insurance_id,inclusions_id) VALUES ("'+InsuranceID+'","'+InsuranceInclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(InsuranceExclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_insurance_exclusions WHERE bill_insurance_id="'+InsuranceID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < InsuranceExclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_insurance_exclusions (bill_insurance_id,exclusions_id) VALUES ("'+InsuranceID+'","'+InsuranceExclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }

                    }
                }
                //Update Warranty
                if(WarrantyList.length > 0){
                    for(var w = 0; w < WarrantyList.length; w++) {
                        var Warranty = WarrantyList[w];
                        var WarrantySellerInfo = WarrantyList[w].SellerInfo;
                        var WarrantyInclusions = WarrantyList[w].Inclusions;
                        var WarrantyExclusions = WarrantyList[w].Exclusions;
                        var WarrantyImage = WarrantyList[w].WarrantyImage;
                        if(WarrantyList[w].BrandID != null && WarrantyList[w].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = WarrantyList[w].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = WarrantyList[w].SellerInfo;
                        }
                        connection.query('UPDATE table_consumer_bill_warranty SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",warranty_type = "'+WarrantyList[w].WarrantyType+'",policy_number = "'+WarrantyList[w].PolicyNo+'",premium_type = "'+WarrantyList[w].PremiumType+'",premium_amount = "'+WarrantyList[w].PremiumAmount+'",policy_effective_date = "'+WarrantyList[w].PolicyEffectiveDate+'",policy_expiry_date = "'+WarrantyList[w].PolicyExpiryDate+'" WHERE bill_warranty_id = "'+WarrantyList[w].WarrantyID+'" ', function (error, warranty, fields) {
                            if (error) throw error;
                        });
                        if(WarrantyImage.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_warranty_copies WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < WarrantyImage.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_warranty_copies (bill_warranty_id,bill_copy_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyImage[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(WarrantyInclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_warranty_inclusions WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < WarrantyInclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_warranty_inclusions ( bill_warranty_id,inclusions_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyInclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(WarrantyExclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_warranty_exclusions WHERE bill_warranty_id="'+WarrantyList[w].WarrantyID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < WarrantyExclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_warranty_exclusions (bill_warranty_id,exclusions_id) VALUES ("'+WarrantyList[w].WarrantyID+'","'+WarrantyExclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }

                    }
                }
                //Update AMC
                if(AMCList.length > 0){
                    for(var a = 0; a < AMCList.length; a++) {
                        var AMC = AMCList[a];
                        var AMCSellerInfo = AMCList[a].SellerInfo;
                        var AMCInclusions = AMCList[a].Inclusions;
                        var AMCExclusions = AMCList[a].Exclusions;
                        var AMCImage = AMCList[a].AMCImage;
                        if(AMCList[a].BrandID != null && AMCList[a].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = AMCList[a].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = AMCList[a].SellerInfo;
                        }
                        connection.query('UPDATE table_consumer_bill_amc SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",policy_number = "'+AMCList[a].PolicyNo+'",premium_type = "'+AMCList[a].PremiumType+'",premium_amount = "'+AMCList[a].PremiumAmount+'",policy_effective_date = "'+AMCList[a].PolicyEffectiveDate+'",policy_expiry_date = "'+AMCList[a].PolicyExpiryDate+'" WHERE bill_amc_id = "'+AMCList[a].AmcID+'" ', function (error, amc, fields) {
                            if (error) throw error;
                        });
                        if(AMCImage.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_amc_copies WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < AMCImage.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_amc_copies (bill_amc_id,bill_copy_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCImage[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(AMCInclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_amc_inclusions WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < AMCInclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_amc_inclusions (bill_amc_id,inclusions_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCInclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }
                        if(AMCInclusions.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_amc_exclusions WHERE bill_amc_id = "'+AMCList[a].AmcID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < AMCInclusions.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_amc_exclusions (bill_amc_id,exclusions_id) VALUES ("'+AMCList[a].AmcID+'","'+AMCExclusions[i]+'")', function (error, list, fields) {
                                });
                            }
                        }

                    }
                }
                //Update Repair
                if(RepairList.length > 0){
                    for(var r = 0; r < RepairList.length; r++) {
                        var RepairImage = RepairList[r].RepairImage;
                        if(RepairList[r].BrandID != null && RepairList[r].BrandID!='') {
                            var SellerType = 1;
                            var SellerID = RepairList[r].BrandID;
                        } else {
                            var SellerType = 2;
                            var SellerID = RepairList[r].SellerInfo;
                        }
                        connection.query('UPDATE table_consumer_bill_repair SET seller_type = "'+SellerType+'",seller_id = "'+SellerID+'",value_of_repair = "'+RepairList[r].RepairValue+'",taxes = "'+RepairList[r].Taxes+'",repair_invoice_number = "'+RepairList[r].RepairInvoiceNumber+'",repair_date = "'+RepairList[r].RepairDate+'" WHERE bill_repair_id = "'+RepairList[r].RepairID+'" ', function (error, repair, fields) {
                            if (error) throw error;
                        });
                        if(RepairImage.length > 0){
                            connection.query('DELETE FROM table_consumer_bill_repair_copies WHERE bill_repair_id = "'+RepairList[r].RepairID+'"', function (error, results, fields) {
                                if (error) throw error;
                            });
                            for(var i = 0; i < RepairImage.length; i++) {
                                connection.query('INSERT INTO table_consumer_bill_repair_copies (bill_repair_id,bill_copy_id) VALUES ("'+RepairList[r].RepairID+'","'+RepairImage[i]+'")', function (error, list, fields) {
                                });
                            }
                        }

                    }
                }
                //Update ce status
                /*connection.query('UPDATE table_cust_executive_tasks SET status_id=5 WHERE bill_id="'+BillID +'" and user_id="'+UserID+'"', function (error, results, fields) {
                    if (error) throw error;
                });*/
                var data = '{"statusCode": 100,"message": "Data updated."}';
                reply(data);
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string().required(),
                UserID: Joi.number().integer().required(),
                BillID: Joi.number().integer().required(),
                ProductID: Joi.number().integer().required(),
                InsuranceList: Joi.array(),
                WarrantyList: Joi.array(),
                AMCList: Joi.array(),
                RepairList: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Get Consumer Bill Product By ID
server.route({
    method: 'POST',
    path: '/Services/ConsumerBillProductByID',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT p.bill_product_id as ProductID,p.product_name as ProductName,p.value_of_purchase as Value,p.taxes as Taxes,p.tag as Tag,mc.category_id as MasterCatID,mc.category_name as MasterCatName,c.category_id as CatID,c.category_name as CatName, b.brand_id as BrandID, b.brand_name as BrandName,co.color_id as ColorID,co.color_name as ColorName FROM table_consumer_bill_products as p LEFT JOIN table_categories as mc on mc.category_id=p.master_category_id LEFT JOIN table_categories as c on c.category_id=p.category_id LEFT JOIN table_brands as b on b.brand_id=p.brand_id LEFT JOIN table_color as co on co.color_id=p.color_id WHERE p.bill_product_id = "'+ID+ '"', function (error, product, fields) {
                    if (error) throw error;
                    if(product.length > 0){
                        connection.query('SELECT m.bill_product_id as ProductID,m.category_form_id as CatFormID,m.form_element_value as value, cf.form_element_name as CatFormName,cf.form_element_type as ElementType,mc.dropdown_name as DropdownValue FROM table_consumer_bill_product_meta_data as m left join table_category_form as cf on cf.category_form_id=m.category_form_id left join table_category_form_mapping as mc on (mc.mapping_id=m.form_element_value and cf.form_element_type=2)  WHERE m.bill_product_id ='+product[0].ProductID+'', function (error, productform, fields) {
                            if (error) throw error;
                            connection.query('SELECT bill_insurance_id as InsuranceID,bill_product_id as ProductID,seller_type as SellerType, seller_id as SellerID, insurance_plan as Plan,policy_number as PolicyNo,amount_insured as AmountInsured,premium_type as PremiumType,premium_amount as PremiumAmount,policy_effective_date as PolicyEffectiveDate,policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_insurance  WHERE bill_product_id ='+product[0].ProductID+'', function (error, insurance, fields) {
                                if (error) throw error;
                                if(insurance.length > 0){
                                    var insuranceid = [];
                                    for(var i = 0; i < insurance.length; i++) {
                                        insuranceid.push(insurance[i].InsuranceID);
                                    }
                                    var InsuranceIDList = insuranceid.join();
                                } else {
                                    var InsuranceIDList = 0;
                                }

                                connection.query('SELECT bill_insurance_id as InsuranceID,bill_copy_id as ImageID FROM table_consumer_bill_insurance_copies WHERE bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceimage, fields) {
                                    if (error) throw error;
                                    connection.query('SELECT i.bill_insurance_id as InsuranceID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_insurance_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceinclusions, fields) {
                                        if (error) throw error;
                                        connection.query('SELECT e.bill_insurance_id as InsuranceID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_insurance_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_insurance_id IN ('+InsuranceIDList+')', function (error, insuranceexclusions, fields) {
                                            if (error) throw error;
                                            connection.query('SELECT bill_warranty_id as WarrantyID,bill_product_id as ProductID,seller_type as SellerType,seller_id as SellerID,warranty_type as WarrantyType,policy_number as PolicyNo,premium_type as PremiumType,premium_amount as PremiumAmount,policy_effective_date as PolicyEffectiveDate,policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_warranty  WHERE bill_product_id ='+product[0].ProductID+'', function (error, warranty, fields) {
                                                if (error) throw error;
                                                if(warranty.length > 0){
                                                    var warrantyid = [];
                                                    for(var i = 0; i < warranty.length; i++) {
                                                        warrantyid.push(warranty[i].WarrantyID);
                                                    }
                                                    var WarrantyIDList = warrantyid.join();
                                                } else {
                                                    var WarrantyIDList = 0;
                                                }

                                                connection.query('SELECT bill_warranty_id as WarrantyID,bill_copy_id as ImageID FROM table_consumer_bill_warranty_copies WHERE bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyimage, fields) {
                                                    if (error) throw error;
                                                    connection.query('SELECT e.bill_warranty_id as WarrantyID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_warranty_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyexclusions, fields) {
                                                        if (error) throw error;
                                                        connection.query('SELECT i.bill_warranty_id as WarrantyID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_warranty_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_warranty_id IN ('+WarrantyIDList+')', function (error, warrantyinclusions, fields) {
                                                            if (error) throw error;
                                                            connection.query('SELECT bill_amc_id as AmcID,bill_product_id as ProductID,seller_type as SellerType,seller_id as SellerID,policy_number as PolicyNo,premium_type as PremiumType,premium_amount as PremiumAmount,policy_effective_date as PolicyEffectiveDate,policy_expiry_date as PolicyExpiryDate FROM table_consumer_bill_amc  WHERE bill_product_id ='+product[0].ProductID+'', function (error, amc, fields) {
                                                                if (error) throw error;
                                                                if(amc.length > 0){
                                                                    var amcid = [];
                                                                    for (var i = 0; i < amc.length; i++) {
                                                                        amcid.push(amc[i].AmcID);
                                                                    }
                                                                    var AMCIDList = amcid.join();
                                                                } else {
                                                                    var AMCIDList = 0;
                                                                }
                                                                connection.query('SELECT bill_amc_id as AmcID,bill_copy_id as ImageID FROM table_consumer_bill_amc_copies WHERE bill_amc_id IN ('+AMCIDList+')', function (error, amcimage, fields) {
                                                                    if (error) throw error;
                                                                    connection.query('SELECT e.bill_amc_id as AmcID,e.exclusions_id as ExclusionsID,el.exclusions_name as ExclusionsName FROM table_consumer_bill_amc_exclusions as e LEFT JOIN table_list_of_exclusions as el on el.exclusions_id=e.exclusions_id WHERE e.bill_amc_id IN ('+AMCIDList+')', function (error, amcexclusions, fields) {
                                                                        if (error) throw error;
                                                                        connection.query('SELECT i.bill_amc_id as AmcID,i.inclusions_id as InclusionsID,il.inclusions_name as InclusionsName FROM table_consumer_bill_amc_inclusions as i LEFT JOIN table_list_of_inclusions as il on il.inclusions_id=i.inclusions_id WHERE i.bill_amc_id IN (' + AMCIDList + ')', function (error, amcinclusions, fields) {
                                                                            if (error) throw error;
                                                                            connection.query('SELECT bill_repair_id as RepairID,bill_product_id as ProductID,seller_type as SellerType,seller_id as SellerID,value_of_repair as RepairValue,taxes as Taxes,repair_invoice_number as RepairInvoiceNumber,repair_date as RepairDate FROM table_consumer_bill_repair  WHERE bill_product_id ='+product[0].ProductID+'', function (error, repair, fields) {
                                                                                if (error) throw error;
                                                                                if(repair.length > 0){
                                                                                    var repairid = [];
                                                                                    for(var i = 0; i < repair.length; i++) {
                                                                                        repairid.push(repair[i].RepairID);
                                                                                    }
                                                                                    var RepairIDList = repairid.join();
                                                                                } else {
                                                                                    var RepairIDList = 0;
                                                                                }

                                                                                connection.query('SELECT bill_repair_id as RepairID,bill_copy_id as ImageID FROM table_consumer_bill_repair_copies WHERE bill_repair_id IN ('+RepairIDList+')', function (error, repairimage, fields) {
                                                                                    if (error) throw error;
                                                                                    var data = '{"statusCode": 100,"ProductList": '+JSON.stringify(product)+',"ProductForm":'+JSON.stringify(productform)+',"InsuranceList":'+JSON.stringify(insurance)+',"InsuranceImage":'+JSON.stringify(insuranceimage)+',"InsuranceInclusions":'+JSON.stringify(insuranceinclusions)+',"InsuranceExclusions":'+JSON.stringify(insuranceexclusions)+',"WarrantyList":'+JSON.stringify(warranty)+',"WarrantyImage":'+JSON.stringify(warrantyimage)+',"WarrantyExclusions":'+JSON.stringify(warrantyexclusions)+',"WarrantyInclusions":'+JSON.stringify(warrantyinclusions)+',"AMCList":'+JSON.stringify(amc)+',"AMCImage":'+JSON.stringify(amcimage)+',"AMCExclusions":'+JSON.stringify(amcexclusions)+',"AMCInclusions":'+JSON.stringify(amcinclusions)+',"RepairList":'+JSON.stringify(repair)+',"RepairImage":'+JSON.stringify(repairimage)+'}';
                                                                                    reply(data);
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Consumer Product Search
server.route({
    method: 'POST',
    path: '/Services/ConsumerProductSearch',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ConsumerID = request.payload.ConsumerID;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT p.bill_product_id as ProductID,p.product_name as ProductName,p.value_of_purchase as Value,p.taxes as Taxes,p.tag as Tag,mc.category_name as MasterCatName,c.category_name as CatName, b.brand_name,co.color_name FROM table_consumer_bill_products as p LEFT JOIN table_categories as mc on mc.category_id=p.master_category_id LEFT JOIN table_categories as c on c.category_id=p.category_id LEFT JOIN table_brands as b on b.brand_id=p.brand_id LEFT JOIN table_color as co on co.color_id=p.color_id WHERE p.user_id = '+ConsumerID+' AND (p.product_name LIKE "%' + Search + '%" OR mc.category_name LIKE "%' + Search + '%" OR c.category_name LIKE "%' + Search + '%" OR b.brand_name LIKE "%' + Search + '%")', function (error, product, fields) {
                    if (error) throw error;
                    if (product.length > 0) {
                        var data = '{"statusCode": 100,"ProductList":'+JSON.stringify(product)+'}';
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
                TokenNo: Joi.string().required(),
                ConsumerID: Joi.number().integer().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Task Complete CE
server.route({
    method: 'POST',
    path: '/Services/TaskCompleteCE',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const BillID = request.payload.BID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('UPDATE table_cust_executive_tasks SET status_id=5 WHERE bill_id="'+BillID +'" and user_id="'+UserID+'"', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"error": "","message": "Task Complete successfully."}';
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
                TokenNo: Joi.string().required(),
                BID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Admin Analytics
server.route({
    method: 'POST',
    path: '/Services/AdminAnalytics',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const DateRange = request.payload.DateRange;
        const FromDate = request.payload.FromDate;
        const ToDate = request.payload.ToDate;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                switch (DateRange) {
                    case 1:
                        var status = true;
                        var condition = 'AND DATE(created_on) = CURDATE()';
                        break;
                    case 2:
                        var status = true;
                        var condition = 'AND DATE(created_on) > (NOW() - INTERVAL 7 DAY)';
                        break;
                    case 3:
                        var status = true;
                        var condition = 'AND (created_on BETWEEN "'+FromDate+'" AND "'+ToDate+'")';
                        break;
                    default:
                        var status = true;
                        var condition = '';
                        break;
                }
                if(status == true){
                    //console.log('SELECT COUNT(bill_id) as Total FROM table_consumer_bills WHERE user_status !=3 AND '+condition+'');
                    connection.query('SELECT COUNT(bill_id) as Total FROM table_consumer_bills WHERE user_status !=3 '+condition+'', function (error, bill, fields) {
                        if (error) throw error;
                        connection.query('SELECT COUNT(user_id) as Total FROM table_users WHERE status_id !=3 AND user_type_id=5 '+condition+'', function (error, user, fields) {
                            if (error) throw error;
                            connection.query('SELECT COUNT(brand_id) as Total FROM table_brands WHERE status_id !=3 '+condition+'', function (error, brand, fields) {
                                if (error) throw error;
                                connection.query('SELECT COUNT(offline_seller_id) as Total FROM table_offline_seller WHERE status_id !=3', function (error, offline, fields) {
                                    if (error) throw error;
                                    connection.query('SELECT COUNT(seller_id) as Total FROM table_online_seller WHERE status_id !=3 ', function (error, online, fields) {
                                        if (error) throw error;
                                        connection.query('SELECT COUNT(DISTINCT seller_id) as Total FROM table_consumer_bill_insurance WHERE status_id =1 ', function (error, insurance, fields) {
                                            if (error) throw error;
                                            connection.query('SELECT COUNT(DISTINCT seller_id) as Total FROM table_consumer_bill_warranty WHERE status_id =1 ', function (error, warranty, fields) {
                                                if (error) throw error;
                                                connection.query('SELECT COUNT(DISTINCT seller_id) as Total FROM table_consumer_bill_amc WHERE status_id =1 ', function (error, amc, fields) {
                                                    if (error) throw error;
                                                    connection.query('SELECT COUNT(DISTINCT seller_id) as Total FROM table_consumer_bill_repair WHERE status_id =1 ', function (error, repair, fields) {
                                                        if (error) throw error;
                                                        connection.query('SELECT COUNT(center_id) as Total FROM table_authorized_service_center WHERE status_id =1 ', function (error, repair, fields) {
                                                            if (error) throw error;
                                                            var data = '{"statusCode": 10,"TotalBills": "'+bill[0].Total+'","TotalUsers": "'+user[0].Total+'","TotalBrands": "'+brand[0].Total+'","TotalASC": "'+repair[0].Total+'","TotalOfflineSeller": "'+offline[0].Total+'","TotalOnlineSeller": "'+online[0].Total+'","TotalInsurance": "'+insurance[0].Total+'","TotalWarranty": "'+warranty[0].Total+'","TotalAMC": "'+amc[0].Total+'","TotalRepair": "'+repair[0].Total+'"}';
                                                            reply(data);
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });

                                });
                            });
                        });
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
                TokenNo: Joi.string().required(),
                DateRange: [Joi.number().integer(), Joi.allow(null)],
                FromDate: [Joi.string(), Joi.allow(null)],
                ToDate: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});

//Get Consumer User List
server.route({
    method: 'POST',
    path: '/Services/ConsumerList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const OffSet = request.payload.OffSet;
        const Limit = request.payload.Limit;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                if(OffSet != null && Limit != null  ){
                    if(!isNaN(OffSet) && !isNaN(OffSet)){
                        var LimitCondition = 'LIMIT '+Limit+' OFFSET '+OffSet+'';
                    } else {
                        var LimitCondition = '';
                    }
                } else {
                    var LimitCondition = '';
                }
                //console.log(LimitCondition);
                connection.query('SELECT u.user_id as ID,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,u.last_login as LastActive,u.created_on as AddedDate,status_name as Status FROM table_users as u inner join table_status as s on s.status_id=u.status_id WHERE u.user_type_id=5 and u.status_id!=3 ORDER BY u.created_on DESC '+LimitCondition+' ', function (error, consumer, fields) {
                    if (error) throw error;
                    if(consumer.length > 0){
                        var data = '{"statusCode": 100,"ConsumerList": '+ JSON.stringify(consumer) +'}';
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
                TokenNo: Joi.string().required(),
                OffSet: [Joi.string(), Joi.allow(null)],
                Limit: [Joi.string(), Joi.allow(null)],
                output: 'data',
                parse:true
            }
        }
    }
});
//Search Consumer User
server.route({
    method: 'POST',
    path: '/Services/SearchConsumer',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Search = request.payload.Search;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT u.user_id as ID,u.fullname as Name,u.email_id as EmailID,u.mobile_no as PhoneNo,u.last_login as LastActive,u.created_on as AddedDate,status_name as Status FROM table_users as u inner join table_status as s on s.status_id=u.status_id WHERE u.user_type_id=5 AND u.status_id!=3 AND (u.fullname LIKE "%'+Search+'%" OR u.email_id LIKE "%'+Search+'%" OR u.mobile_no LIKE "%'+Search+'%") ', function (error, consumer, fields) {
                    if (error) throw error;
                    if(consumer.length > 0){
                        var data = '{"statusCode": 100,"ConsumerList": '+ JSON.stringify(consumer) +'}';
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
                TokenNo: Joi.string().required(),
                Search: Joi.string().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Delete Consumer User
server.route({
    method: 'POST',
    path: '/Services/DeleteConsumer',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});
//Analytics Consumer User
server.route({
    method: 'POST',
    path: '/Services/ConsumerAnalytics',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const ID = request.payload.ID;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                connection.query('SELECT COUNT(bill_detail_id) as Total FROM table_consumer_bill_details WHERE user_id = "'+ID+'"', function (error, bill, fields) {
                    if (error) throw error;
                    connection.query('SELECT (SUM(total_purchase_value) + SUM(taxes)) as TotalValue FROM table_consumer_bill_details WHERE user_id = "'+ID+'"', function (error, billamount, fields) {
                        if (error) throw error;
                        var data = '{"statusCode": 100,"TotalBill": "'+JSON.stringify(bill[0].Total)+'","TotalAmount": "'+JSON.stringify(billamount[0].TotalValue)+'"}';
                        reply(data);
                    });
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
                TokenNo: Joi.string().required(),
                ID: Joi.number().integer().required(),
                output: 'data',
                parse:true
            }
        }
    }
});

//Add Brand CSV
server.route({
    method: 'POST',
        path: '/Services/AddBrandCSV',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const List = request.payload.List;
        connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['user_id'];
                for(var i = 0; i < List.length; i++) {
                    var BrandName = List[i].Name;
                    var CategoryID = List[i].CategoryID
                    var DisplayTypeID = List[i].DisplayTypeID
                    var DisplayName = List[i].DisplayName
                    var Details = List[i].Details
                    connection.query('SELECT brand_id FROM table_brands WHERE brand_name = "'+BrandName+'" and status_id=1', function (error, brand, fields) {
                        if (error) throw error;
                        if(brand.length > 0){
                            connection.query('INSERT INTO table_brand_details (brand_id,category_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+brand[0]['brand_id']+'","'+CategoryID+'","'+DisplayTypeID+'","'+DisplayName+'","'+Details+'",1)', function (error, detail, fields) {
                                if (error) throw error;
                            });
                        } else {
                            connection.query('INSERT INTO table_brands (brand_name,brand_description,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + BrandName + '"," ","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                                if (error) throw error;
                                connection.query('INSERT INTO table_brand_details (brand_id,category_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+CategoryID+'","'+DisplayTypeID+'","'+DisplayName+'","'+Details+'",1)', function (error, detail, fields) {
                                    if (error) throw error;
                                });
                            });
                        }
                    });
                }
                var data = '{"statusCode": 100}';
                reply(data);
            } else {
                var data = '{"statusCode": 101,"error": "Invalid Token","message": "Invalid Token."}';
                reply(data);
            }
        });
    },
    config:{
        validate: {
            payload: {
                TokenNo: Joi.string().required(),
                List: Joi.array().required(),
                output: 'data',
                parse:true
            }
        }
    }
});