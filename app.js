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
        console.log('hi');
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

//Category Level List
server.route({
    method: 'POST',
    path: '/Services/CategoryLevelList',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Level = request.payload.Level;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                if(Level == 1){
                    connection.query('SELECT category_id as ID,category_name as Name,ref_id as RefID,category_level as Level FROM table_categories WHERE category_level=1 ORDER BY category_name', function (error, category, fields) {
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
                    connection.query('SELECT t2.category_id as ID,t1.category_name AS maincategory, t2.category_name as category,t2.ref_id as RefID,t2.category_level as Level FROM table_categories AS t1 INNER JOIN table_categories AS t2 ON t2.ref_id = t1.category_id WHERE t2.category_level = 2 ORDER BY t1.category_name,t2.category_name', function (error, category, fields) {
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
                    connection.query('SELECT t3.category_id as ID,t1.category_name AS maincategory,t2.category_name as category,t3.category_name as subcategory,t3.ref_id as RefID,t3.category_level as Level FROM table_categories AS t1 INNER JOIN table_categories AS t2 ON t2.ref_id = t1.category_id INNER JOIN table_categories AS t3 ON t3.ref_id = t2.category_id WHERE t3.category_level = 3 ORDER BY t1.category_name,t2.category_name,t3.category_name', function (error, category, fields) {
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
                TokenNo: Joi.string(),
                Level: Joi.number().integer(),
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

//Add Brand
server.route({
    method: 'POST',
    path: '/Services/AddBrand',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Name = request.payload.Name;
        const Description = request.payload.Description;
        const Details = request.payload.Details;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT brand_id FROM table_brands WHERE brand_name = "' + Name + '" and status_id=1', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        var data = '{"statusCode": 104,"error": "Data Exist","message": "Brand Already exists."}';
                        reply(data);
                    } else {
                        connection.query('INSERT INTO table_brands (brand_name,brand_description,created_on,updated_on,updated_by_user_id,status_id) VALUES ("' + Name + '","' + Description + '","' + getDateTime() + '","' + getDateTime() + '","' + UserID + '",1)', function (error, results, fields) {
                            if (error) throw error;
                            for(var i = 0; i < Details.length; i++) {
                                connection.query('INSERT INTO table_brand_details (brand_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+results['insertId']+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                Description: Joi.allow(null),
                Details: Joi.array(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                                    connection.query('UPDATE table_brand_details SET contactdetails_type_id="' + Details[i].DetailTypeID + '",display_name="' + Details[i].DisplayName + '",details="' + Details[i].Details + '"WHERE brand_detail_id="' + Details[i].DetailID + '"', function (error, detail, fields) {
                                    });
                                } else {
                                    connection.query('INSERT INTO table_brand_details (brand_id,contactdetails_type_id,display_name,details,status_id) VALUES ("'+ID+'","'+Details[i].DetailTypeID+'","'+Details[i].DisplayName+'","'+Details[i].Details+'",1)', function (error, detail, fields) {
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                Name: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT brand_id as ID,brand_name as Name,brand_description as Description FROM table_brands WHERE status_id!=3 ORDER BY brand_name', function (error, brand, fields) {
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
                TokenNo: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT brand_id as ID,brand_name as Name,brand_description as Description FROM table_brands WHERE brand_id = "' + ID + '"', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        connection.query('SELECT brand_detail_id as DetailID,contactdetails_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_brand_details WHERE brand_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                Name: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT seller_id as ID,seller_name as Name,seller_url as URL,seller_gstin_no as GstinNo FROM table_online_seller WHERE status_id!=3 ORDER BY seller_name', function (error, seller, fields) {
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
                TokenNo: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT seller_id as ID,seller_name as Name,seller_url as URL,seller_gstin_no as GstinNo FROM table_online_seller WHERE seller_id = "' + ID + '"', function (error, seller, fields) {
                    if (error) throw error;
                    if(seller.length > 0){
                        connection.query('SELECT seller_detail_id as DetailID,contactdetail_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_online_seller_details WHERE seller_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+seller[0]['ID']+',"Name":"'+seller[0]['Name']+'","Description":"'+seller[0]['URL']+'","Description":"'+seller[0]['GstinNo']+'","Details": '+ JSON.stringify(detail) +'}';
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('INSERT INTO table_authorized_service_center (brand_id,center_name,address_house_no,address_block,address_street,address_sector,address_city,address_state,address_pin_code,address_nearby,lattitude,longitude,open_days,timings,status_id) VALUES ("'+request.payload.BrandID+'","'+request.payload.Name+'","'+request.payload.HouseNo+'","'+request.payload.Block+'","'+request.payload.Street+'","'+request.payload.Sector+'","'+request.payload.City+'","'+request.payload.State+'","'+request.payload.PinCode+'","'+request.payload.NearBy+'","'+request.payload.Lattitude+'","'+request.payload.Longitude+'","'+request.payload.OpenDays+'","'+request.payload.Timings+'",1)', function (error, results, fields) {
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
                TokenNo: Joi.string(),
                BrandID: Joi.number().integer(),
                Name: Joi.string(),
                HouseNo: Joi.allow(null),
                Block: Joi.allow(null),
                Street: Joi.allow(null),
                Sector: Joi.allow(null),
                City: Joi.string(),
                State: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('UPDATE table_authorized_service_center SET brand_id="'+request.payload.BrandID+'",center_name="'+request.payload.Name+'",address_house_no="'+request.payload.HouseNo+'",address_block="'+request.payload.Block+'",address_street="'+request.payload.Street+'",address_sector="'+request.payload.Sector+'",address_city="'+request.payload.City+'",address_state="'+request.payload.State+'",address_pin_code="'+request.payload.PinCode+'",address_nearby="'+request.payload.NearBy+'",lattitude="'+request.payload.Lattitude+'",longitude="'+request.payload.Longitude+'",open_days="'+request.payload.OpenDays+'",timings="'+request.payload.Timings+'" WHERE center_id="' + ID + '"', function (error, results, fields) {
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
                BrandID: Joi.number().integer(),
                Name: Joi.string(),
                HouseNo: Joi.allow(null),
                Block: Joi.allow(null),
                Street: Joi.allow(null),
                Sector: Joi.allow(null),
                City: Joi.string(),
                State: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT a.center_id as ID,a.brand_id as BrandID,b.brand_name as BrandName,a.center_name as Name,a.address_house_no as HouseNo,a.address_block as Block,a.address_street as Street,a.address_sector as Sector,a.address_city as City,a.address_state as State,a.address_pin_code as PinCode,a.address_nearby as NearBy,a.lattitude as Lattitude,a.longitude as Longitude,a.open_days as OpenDays,a.timings as Timings FROM table_authorized_service_center as a inner join table_brands as b on a.brand_id=b.brand_id WHERE a.status_id!=3 ORDER BY b.brand_name', function (error, service_center, fields) {
                    if (error) throw error;
                    if(service_center.length > 0){
                        var data = '{"statusCode": 100,"BrandList": '+ JSON.stringify(service_center) +'}';
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT a.center_id as ID,a.brand_id as BrandID,b.brand_name as BrandName,a.center_name as Name,a.address_house_no as HouseNo,a.address_block as Block,a.address_street as Street,a.address_sector as Sector,a.address_city as City,a.address_state as State,a.address_pin_code as PinCode,a.address_nearby as NearBy,a.lattitude as Lattitude,a.longitude as Longitude,a.open_days as OpenDays,a.timings as Timings FROM table_authorized_service_center as a inner join table_brands as b on a.brand_id=b.brand_id WHERE a.center_id = "' + ID + '"', function (error, brand, fields) {
                    if (error) throw error;
                    if(brand.length > 0){
                        connection.query('SELECT center_detail_id as DetailID,contactdetail_type_id as DetailTypeID,display_name as DisplayName,details as Details FROM table_authorized_service_center_details WHERE center_id = "' + ID + '" and status_id!=3', function (error, detail, fields) {
                            if (error) throw error;
                            var data = '{"statusCode": 100,"ID":'+brand[0]['ID']+',"BrandID":'+brand[0]['ID']+',"BrandName":"'+brand[0]['BrandName']+'","Name":"'+brand[0]['Name']+'","HouseNo":"'+brand[0]['HouseNo']+'","Block":"'+brand[0]['Block']+'","Street":"'+brand[0]['Street']+'","Sector":"'+brand[0]['Sector']+'","City":"'+brand[0]['City']+'","State":"'+brand[0]['State']+'","PinCode":'+brand[0]['PinCode']+',"NearBy":"'+brand[0]['NearBy']+'","Lattitude":"'+brand[0]['Lattitude']+'","Longitude":"'+brand[0]['Longitude']+'","OpenDays":"'+brand[0]['OpenDays']+'","Timings":"'+brand[0]['Timings']+'","Details": '+ JSON.stringify(detail) +'}';
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                ID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                CatID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                ID: Joi.number().integer(),
                CatID: Joi.number().integer(),
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
        const Name = request.payload.Name;
        const CatID = request.payload.CatID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                ID: Joi.number().integer(),
                CatID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT e.exclusions_id as ID, e.category_id as CatID,c.category_name as CatName,e.exclusions_name as Name FROM table_list_of_exclusions as e left join table_categories as c on c.category_id=e.category_id WHERE e.status_id=1', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"ExclusionsList": "'+JSON.stringify(results)+'"}';
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                CatID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                ID: Joi.number().integer(),
                CatID: Joi.number().integer(),
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
        const Name = request.payload.Name;
        const CatID = request.payload.CatID;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                ID: Joi.number().integer(),
                CatID: Joi.number().integer(),
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
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('SELECT i.inclusions_id as ID, i.category_id as CatID,c.category_name as CatName,i.inclusions_name as Name FROM table_list_of_inclusions as i left join table_categories as c on c.category_id=i.category_id WHERE i.status_id=1', function (error, results, fields) {
                    if (error) throw error;
                    var data = '{"statusCode": 100,"InclusionsList": "'+JSON.stringify(results)+'"}';
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

//Add Offline Seller
server.route({
    method: 'POST',
    path: '/Services/AddOfflineSeller',
    handler: function (request, reply) {
        const TokenNo = request.payload.TokenNo;
        const Details = request.payload.Details;
        connection.query('SELECT id FROM table_token WHERE token_id = "' + TokenNo + '"', function (error, token, fields) {
            if (error) throw error;
            if(token.length > 0){
                var UserID = token[0]['id'];
                connection.query('INSERT INTO table_authorized_service_center (brand_id,center_name,address_house_no,address_block,address_street,address_sector,address_city,address_state,address_pin_code,address_nearby,lattitude,longitude,open_days,timings,status_id) VALUES ("'+request.payload.BrandID+'","'+request.payload.Name+'","'+request.payload.HouseNo+'","'+request.payload.Block+'","'+request.payload.Street+'","'+request.payload.Sector+'","'+request.payload.City+'","'+request.payload.State+'","'+request.payload.PinCode+'","'+request.payload.NearBy+'","'+request.payload.Lattitude+'","'+request.payload.Longitude+'","'+request.payload.OpenDays+'","'+request.payload.Timings+'",1)', function (error, results, fields) {
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
                TokenNo: Joi.string(),
                Name: Joi.string(),
                OwnerName: Joi.allow(null),
                GstinNo: Joi.allow(null),
                PanNo: Joi.allow(null),
                RegNo: Joi.allow(null),
                HouseNo: Joi.allow(null),
                Block: Joi.allow(null),
                Street: Joi.allow(null),
                Sector: Joi.allow(null),
                City: Joi.string(),
                State: Joi.string(),
                PinCode: Joi.allow(null),
                NearBy: Joi.allow(null),
                Lattitude: Joi.allow(null),
                Longitude: Joi.allow(null),
                Details: Joi.array(),
                output: 'data',
                parse:true
            }
        }
    }
});