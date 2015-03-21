const constants = require('../../../config/constants');
const config = require('../../../config/config');
const common = require('../../common');
const _ = require('lodash');
const moment = require('moment');
const emailValidator = require('email-validator');
const request = require('request');
const async = require("async");
const Avatax = require('avatax');
const forgotPasswordCode = {};// key: token, value: userId

// REST API.
exports.sign_up = function (req, res) {
    try {
        let user_data = req.body;

        //Valide the SignUp FormData
        let validate_cols = ['firstname', 'lastname', 'email', 'phone', 'address1', 'state', 'country', 'city', 'zip', 'password', 'confirmpass'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (user_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }
        if (valid_status) {
            if (user_data.password != user_data.confirmpass) {
                valid_status = false;
                error_msg = constants.messages.insertSamePassword;
            }
            if (!emailValidator.validate(user_data.email)) {
                valid_status = false;
                error_msg = constants.messages.invalidEmail;
            }
        }
        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });
        request(config.URLEncryp + '?method=encrypt&username=' + user_data.email + '&password=' + user_data.password, function (error, response, result) {
            //check error
            if (error) return res.status(500).json({ error: error.toString() });
            encresp = JSON.parse(result);  // Json parse);
            //mysql connection 
            pool.getConnection(function (err, mc) {
                // check error
                if (err) return res.status(500).json({ error: err.toString() });
                // return false;
                let check_query = "SELECT * FROM users WHERE email = '" + user_data.email + "'";
                pool.query(check_query, function (error, results, fields) {
                    // connection release
                    mc.release();
                    // check error
                    if (error) return res.status(500).json({ error: error.toString() });

                    if (results && results.length) {
                        return res.status(403).json({ error: constants.messages.emailAlreadyExist });
                    } else {
                        
                        async.waterfall([
                          function (callback) {
                            pool.getConnection(function (err, mc) {
                              // check error
                              if (err) return callback(err);

                              // save user in users table

                              let cols = ['CID', 'first_name', 'last_name', 'email', 'role_id', 'phone', 'address', 'address2', 'state', 'city', 'country', 'zip', 'password', 'created_at', 'updated_at', 'username'];
                                user_data.role_id = '5';
                                user_data.first_name = user_data.firstname;
                                user_data.last_name = user_data.lastname;
                                user_data.address = user_data.address1;
                                user_data.address2 = user_data.address2;

                                user_data.username = user_data.email;
                                user_data.password = encresp.password;
                                let now = new Date();
                                user_data.created_at = moment(now).format('Y-MM-DD HH:mm:s');
                                user_data.updated_at = user_data.created_at;

                                // return;
                                let cols_sql = "";
                                let values_sql = "";
                                for (let i = 0; i < cols.length; i++) {
                                    cols_sql += "`" + cols[i] + "`";
                                    values_sql += "'" + user_data[cols[i]] + "'";
                                    if (i + 1 < cols.length) {
                                        cols_sql += ",";
                                        values_sql += ",";
                                    }
                                }
                             let insert_sql = "INSERT INTO `users` (" + cols_sql + ") VALUES (" + values_sql + ");";
                              // run query  
                              pool.query(insert_sql, function (error, UserRecord, fields) {
                                // connection release 
                                mc.release();
                                return callback(error, UserRecord);
                              });
                            });
                          },
                          function (UserRecord, callback) {
                            UserRecord = JSON.parse(JSON.stringify(UserRecord));  // Json parse
                            //console.log(Company);
                            let CustomerID = UserRecord.insertId

                            // Company created now make entry in other required tables
                            async.parallel([
                              function (cbk) {
                                // save company subscriptions
                                pool.getConnection(function (err, mc) {
                                  // check error
                                  if (err) return cbk(err);
                                  // run query  
                                  let cols1 = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
                                    let now = new Date();

                                    user_data.AddressType = 'billing';
                                    user_data.CID = user_data.CID;
                                    user_data.CustomerID = CustomerID;
                                    user_data.First_Name = user_data.firstname;
                                    user_data.Last_Name = user_data.lastname;
                                    user_data.Email_Address = user_data.email;
                                    user_data.Address = user_data.address1;
                                    user_data.Address2 = user_data.address2;
                                    user_data.Phone_Number = user_data.phone;
                                    user_data.City = user_data.city;
                                    user_data.State = user_data.state;
                                    user_data.Country = user_data.country;
                                    user_data.ZipCode = user_data.zip;
                                    user_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                                    // return;
                                    let cols1_sql = "";
                                    let values_sql = "";
                                    for (let i = 0; i < cols1.length; i++) {
                                        cols1_sql += "`" + cols1[i] + "`";
                                        values_sql += "'" + user_data[cols1[i]] + "'";
                                        if (i + 1 < cols1.length) {
                                            cols1_sql += ",";
                                            values_sql += ",";
                                        }
                                    }
                                    let insert_sql = "INSERT INTO `tbl_store_customer_address` (" + cols1_sql + ") VALUES (" + values_sql + ");";

                                  pool.query(insert_sql, function (error, UserRecordCB, fields) {
                                    // connection release 
                                    mc.release();
                                    return cbk(error, UserRecordCB);
                                  });
                                });
                              },
                              function (cbk) {
                                // save billing address
                                pool.getConnection(function (err, mc) {
                                  // check error
                                  if (err) return cbk(err);
                                  // run query  
                                  
                                    let cols1 = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
                                    let now = new Date();

                                    user_data.AddressType = 'shipping';
                                    user_data.CID = user_data.CID;
                                    user_data.CustomerID = CustomerID;
                                    user_data.First_Name = user_data.firstname;
                                    user_data.Last_Name = user_data.lastname;
                                    user_data.Email_Address = user_data.email;
                                    user_data.Address = user_data.address1;
                                    user_data.Address2 = user_data.address2;
                                    user_data.Phone_Number = user_data.phone;
                                    user_data.City = user_data.city;
                                    user_data.State = user_data.state;
                                    user_data.Country = user_data.country;
                                    user_data.ZipCode = user_data.zip;
                                    user_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                                    // return;
                                    let cols1_sql = "";
                                    let values_sql = "";
                                    for (let i = 0; i < cols1.length; i++) {
                                        cols1_sql += "`" + cols1[i] + "`";
                                        values_sql += "'" + user_data[cols1[i]] + "'";
                                        if (i + 1 < cols1.length) {
                                            cols1_sql += ",";
                                            values_sql += ",";
                                        }
                                    }
                                    let insert_sql = "INSERT INTO `tbl_store_customer_address` (" + cols1_sql + ") VALUES (" + values_sql + ");";
                                  pool.query(insert_sql, function (error, UserRecordCB, fields) {
                                    // connection release 
                                    mc.release();
                                    return cbk(error, UserRecordCB);
                                  });
                                });
                              },
                              function (cbk) {
                                // send email to manufacturer  now
                                pool.getConnection(function (err, mc) {
                                  // check error
                                  if (err) return cbk(err);

                                  let getEmailTemplate = "SELECT * FROM `tbl_email_templates` WHERE `type` = 'Customer_Signup'";
                                  pool.query(getEmailTemplate, function (error, results1, fields) {
                                    mc.release();
                                    // check error
                                    if (error) return cbk(error);
                                    if (results1 && results1.length) {
                                      let message = results1[0]['template_value'];
                                      let content = '';
                                      let msgTemplate = message.replace('{{CONTENT}}', content);
                                      const mailOptions = {
                                        email: user_data.email,
                                        subject: "YOUR ARE NOW SIGNED UP TO CAPTURE THE SALES YOU'VE BEEN MISSING",
                                        message: msgTemplate
                                      };

                                      common.sendEmail(mailOptions, function (err, result) {
                                        if (err) {
                                          cbk(null, null);
                                        } else {
                                          if (result.flag) {
                                            cbk(null, null);
                                          } else {
                                            cbk(null, null);
                                          }
                                        }
                                      });
                                    } else {
                                      cbk(null, null);
                                    }
                                  });
                                });
                              }
                            ], function (err, pResult) {
                              pResult = JSON.parse(JSON.stringify(pResult));
                              // push compnay data
                              pResult.push(UserRecord);
                              callback(err, pResult);
                            });
                          }
                        ], function (error, results) {
                          // check error
                          if (error) return res.status(500).json({ error: error.toString() });
                          // check length
                          results = JSON.parse(JSON.stringify(results));
                          return res.send({ error: false, results });
                            
                        });
                        
                    }
                })
            });
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

exports.login = function (req, res) {

    try {
        let user_data = req.body;

        let validate_cols = ['email', 'password'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (user_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }
        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        request(config.URLEncryp + '?method=encrypt&username=' + user_data.email + '&password=' + user_data.password, function (error, response, result) {
            //check error
            if (error) return res.status(500).json({ error: error.toString() });
            let encresp = JSON.parse(result);  // Json parse);
            //mysql connection 
            pool.getConnection(function (err, mc) {
                // check error
                if (err) return res.status(500).json({ error: err.toString() });
                // return false;
                let check_query = "SELECT * FROM users WHERE email = '" + user_data.email + "' AND password = '" + encresp.password + "'";
                pool.query(check_query, function (error, results, fields) {
                    // connection release
                    mc.release();
                    // check error
                    if (error) return res.status(500).json({ error: error.toString() });
                    // parse json
                    results = JSON.parse(JSON.stringify(results));
                    if (results && results.length) {
                        // delete password key
                        delete results[0].password;
                        // response
                        res.status(200).send({
                            error: false,
                            token: common.generateToken(results),
                            data: results[0],
                        });
                        //return res.send({ error: false, results});
                    } else {
                        return res.status(403).json({ error: constants.messages.invalidEmailPassword });
                    }
                })
            });
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API.
exports.save_user_address = function (req, res) {
    try {
        let user_data = req.body;

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        // Check user id
        if (!(user_data && user_data.CustomerID))
            return res.status(404).send({ message: constants.messages.userNotFound });

        //Valide the SignUp FormData
        let validate_cols = ['CustomerID', 'billing_first_name', 'billing_last_name', 'billing_email', 'billing_phone', 'billing_address1', 'billing_city', 'billing_zip', 'billing_state', 'billing_country', 'shipping_first_name', 'shipping_last_name', 'shipping_email', 'shipping_phone', 'shipping_address1', 'shipping_city', 'shipping_zip', 'shipping_state', 'shipping_country'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (user_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }
        if (valid_status) {
            if (!emailValidator.validate(user_data.billing_email)) {
                valid_status = false;
                error_msg = constants.messages.invalidEmail;
            }
        }
        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }
        // set avatax config details
        const client = new Avatax(config.avataxConfig).withSecurity(config.avataxCreds);
        const address = {
            line1: user_data.billing_address1,
            line2: user_data.billing_address1,
            city: user_data.shipping_city,
            postalCode: user_data.shipping_zip,
            region: user_data.shipping_state,
            country: user_data.shipping_country
        };
        client.resolveAddress(address)
            .then(function (checkAdress) {
                // check address validated error 
                if (checkAdress && checkAdress.validatedAddresses && checkAdress.validatedAddresses.length && checkAdress.validatedAddresses[0] && String(checkAdress.validatedAddresses[0].addressType) == String('UnknownAddressType')) {
                    let errorMessage = (checkAdress && checkAdress.messages && checkAdress.messages[0] && checkAdress.messages[0].summary) ? checkAdress.messages[0].summary : 'An exact street name match could not be found!!';
                    return res.status(404).json({ error: errorMessage.toString() });
                }

                // pulling data from multiple tables 
                async.parallel([
                    function (cbk) {
                        //mysql connection 
                        pool.getConnection(function (err, mc) {
                            // check error
                            if (err) return cbk(err);
                            // return false;
                            pool.query("SELECT * FROM tbl_store_customer_address WHERE AddressType ='billing' and CustomerID = '" + user_data.CustomerID + "'", function (error, results, fields) {
                                // connection release
                                mc.release();
                                cbk(error, results);
                            });
                        });
                    },
                    function (cbk) {
                        //mysql connection 
                        pool.getConnection(function (err, mc) {
                            // check error
                            if (err) return cbk(err);
                            // return false;
                            pool.query("SELECT * FROM tbl_store_customer_address WHERE AddressType ='shipping' and   CustomerID = '" + user_data.CustomerID + "'", function (error, results, fields) {
                                // connection release
                                mc.release();
                                cbk(error, results);
                            });
                        });
                    }
                ], function (err, getResult) {
                    if (err) return res.status(500).json({ error: err.toString() });

                    getResult = JSON.parse(JSON.stringify(getResult));  // Json parse
                    // save/update address 
                    async.parallel([
                        function (callback) {
                            let queryData = '' //store query
                            if (getResult && getResult.length && getResult[0] && getResult[0][0] && getResult[0][0].ID) {
                                // update address query here
                                queryData = "UPDATE tbl_store_customer_address SET First_Name = '" + user_data.billing_first_name + "',Last_Name = '" + user_data.billing_last_name + "',Email_Address = '" + user_data.billing_email + "',Address = '" + user_data.billing_address1 + "',Address2 = '" + user_data.billing_address2 + "',Phone_Number = '" + user_data.billing_phone + "',City = '" + user_data.billing_city + "',State = '" + user_data.billing_state + "',Country = '" + user_data.billing_country + "',ZipCode = '" + user_data.billing_zip + "' WHERE ID = '" + getResult[0][0].ID + "'";
                            } else {
                                let cols = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
                                let now = new Date();
                                user_data.AddressType = 'billing';
                                user_data.First_Name = user_data.billing_first_name;
                                user_data.Last_Name = user_data.billing_last_name;
                                user_data.Email_Address = user_data.billing_email;
                                user_data.Address = user_data.billing_address1;
                                user_data.Address2 = user_data.billing_address2;
                                user_data.Phone_Number = user_data.billing_phone;
                                user_data.City = user_data.billing_city;
                                user_data.State = user_data.billing_state;
                                user_data.Country = user_data.billing_country;
                                user_data.ZipCode = user_data.billing_zip;
                                user_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                                // manage column
                                let cols_sql = "";
                                let values_sql = "";
                                for (let i = 0; i < cols.length; i++) {
                                    cols_sql += "`" + cols[i] + "`";
                                    values_sql += "'" + user_data[cols[i]] + "'";
                                    if (i + 1 < cols.length) {
                                        cols_sql += ",";
                                        values_sql += ",";
                                    }
                                }
                                // set insert query
                                queryData = "INSERT INTO `tbl_store_customer_address` (" + cols_sql + ") VALUES (" + values_sql + ");";
                            }
                            // Add/update address
                            pool.getConnection(function (err, mc) {
                                // check error
                                if (err) return callback(err);
                                // Pull data from database   
                                mc.query(queryData, function (error, results, fields) {
                                    // connection release 
                                    mc.release();
                                    return callback(error, results);
                                });
                            });
                        },
                        function (callback) {
                            let queryData = ''
                            if (getResult && getResult.length && getResult[1] && getResult[1][0] && getResult[1][0].ID) {
                                // update address query here
                                queryData = "UPDATE tbl_store_customer_address SET First_Name = '" + user_data.shipping_first_name + "',Last_Name = '" + user_data.shipping_last_name + "',Email_Address = '" + user_data.shipping_email + "',Address = '" + user_data.shipping_address1 + "',Address2 = '" + user_data.shipping_address2 + "',Phone_Number = '" + user_data.shipping_phone + "',City = '" + user_data.shipping_city + "',State = '" + user_data.shipping_state + "',Country = '" + user_data.shipping_country + "',ZipCode = '" + user_data.shipping_zip + "' WHERE ID = '" + getResult[1][0].ID + "'";
                            } else {
                                // saving shipping address now
                                let cols1 = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
                                let now = new Date();
                                user_data.AddressType = 'shipping';
                                user_data.First_Name = user_data.shipping_first_name;
                                user_data.Last_Name = user_data.shipping_last_name;
                                user_data.Email_Address = user_data.shipping_email;
                                user_data.Address = user_data.shipping_address1;
                                user_data.Address2 = user_data.shipping_address2;
                                user_data.Phone_Number = user_data.shipping_phone;
                                user_data.City = user_data.shipping_city;
                                user_data.State = user_data.shipping_state;
                                user_data.Country = user_data.shipping_country;
                                user_data.ZipCode = user_data.shipping_zip;
                                user_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                                // return;
                                let cols1_sql = "";
                                let values_sql = "";
                                for (let i = 0; i < cols1.length; i++) {
                                    cols1_sql += "`" + cols1[i] + "`";
                                    values_sql += "'" + user_data[cols1[i]] + "'";
                                    if (i + 1 < cols1.length) {
                                        cols1_sql += ",";
                                        values_sql += ",";
                                    }
                                }
                                queryData = "INSERT INTO `tbl_store_customer_address` (" + cols1_sql + ") VALUES (" + values_sql + ");";
                            }
                            pool.getConnection(function (err, mc) {
                                // check error
                                if (err) return callback(err);
                                // Pull data from database   
                                mc.query(queryData, function (error, results, fields) {
                                    // connection release 
                                    mc.release();
                                    return callback(error, results);
                                });
                            });
                        }
                    ], function (error, response) {
                        if (error) return res.status(500).json({ error: error.toString() });
                        // return response
                        response = JSON.parse(JSON.stringify(response));  // Json parse
                        return res.send({ error: false, data: response });
                    });
                });

            }, function (error) {
                return res.status(500).json({ error: error.toString() });
            });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};


// REST API for get user address
exports.get_user_address = function (req, res) {
    try {
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.CustomerID))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });

        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            // Pull data from database   
            mc.query("SELECT * FROM tbl_store_customer_address WHERE CustomerID = '" + req.query.CustomerID + "'", function (error, results, fields) {
                // connection release 
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                if (results && results.length) {
                    results = JSON.parse(JSON.stringify(results));  // Json parse

                    return res.send({ error: false, data: results });
                } else {
                    return res.status(404).send({ message: constants.messages.notFound });
                }
            });

        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};
exports.forgot_password = function (req, res) {

    // check api auth
    if (!common.checkApiAuthentication(req))
        return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    try {
        const email = req.body.email;
        const CID = req.body.cid;
        const fullURL = req.get('origin');
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            // return false;
            let check_query = "SELECT * FROM users WHERE email = '" + email + "'";
            pool.query(check_query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                if (results && results.length) {
                    const userId = results[0]['id'];
                    const userName = results[0]['first_name'] + ' ' + results[0]['last_name'];
                    const resetPasswordToken = common.genResetPasswordToken(20, '#aA');
                    forgotPasswordCode[resetPasswordToken] = { id: userId, email: email };

                    let getEmailTemplate = "SELECT * FROM `tbl_email_templates` WHERE `type` = 'Default'";
                    pool.query(getEmailTemplate, function (error, results1, fields) {
                        // check error
                        if (error) return res.status(500).json({ error: error.toString() });
                        if (results1 && results1.length) {
                            let message = results1[0]['template_value'];
                            let content = '<b>Hi, ' + userName + '</b><br/>Click on the link to reset your password. <br/>' +
                                '<a href="' + fullURL + '/reset/' + resetPasswordToken + '">' + fullURL + '/reset/' + resetPasswordToken + '</a>';
                            let msgTemplate = message.replace('{{CONTENT}}', content);
                            const mailOptions = {
                                email: email,
                                subject: 'Forgot Password',
                                message: msgTemplate
                            };

                            common.sendEmail(mailOptions, function (err, result) {
                                if (err) {
                                    return res.status(400).json({
                                        error: 'Fail to send email'
                                    })
                                } else {
                                    if (result.flag) {
                                        pool.query("UPDATE users SET remember_token = '" + resetPasswordToken + "' WHERE id = '" + userId + "'", function (error, result2, fields) {
                                            // check error
                                            if (error) return res.status(500).json({ error: error.toString() });
                                            if (result2) {
                                                res.status(200).send({
                                                    error: false,
                                                    data: result.message,
                                                    passwordToken: resetPasswordToken
                                                });
                                            }
                                        });
                                    } else {
                                        res.status(500).send({
                                            error: result.message
                                        })
                                    }
                                }
                            });
                        }
                    });
                } else {
                    return res.status(403).json({ error: constants.messages.errorSendingForgotPasswordEmail });
                }
            })
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

exports.reset_password = function (req, res) {

    // check api auth
    if (!common.checkApiAuthentication(req))
        return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    try {
        const passwordToken = req.body['passwordToken'];
        const newPassword = req.body['newPassword'];

        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            let query = "SELECT * FROM users WHERE remember_token = '" + passwordToken + "'";
            pool.query(query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });
                if (results && results.length) {
                    let email = results[0]['email'];
                    request(config.URLEncryp + '?method=encrypt&username=' + email + '&password=' + newPassword, function (error, response, result) {
                        //check error
                        if (error) return res.status(500).json({ error: error.toString() });
                        let encresp = JSON.parse(result);  // Json parse);
                        pool.getConnection(function (err, mc) {
                            // check error
                            if (err) return res.status(500).json({ error: err.toString() });
                            // return false;
                            let check_query = "UPDATE users SET password = '" + encresp.password + "' WHERE email = '" + email + "'";
                            pool.query(check_query, function (error, results, fields) {
                                // connection release
                                mc.release();
                                // check error
                                if (error) return res.status(500).json({ error: error.toString() });
                                if (results) {
                                    let query = "UPDATE users SET remember_token = '' WHERE email = '" + email + "'";
                                    pool.query(query, function (error, results1, fields) {
                                        // check error
                                        if (err) return res.status(500).json({ error: err.toString() });
                                        if (results1) {
                                            res.status(200).send({
                                                error: false,
                                                data: "CHANGED_PASSWORD"
                                            })
                                        }
                                    });
                                } else {
                                    return res.status(403).json({ error: constants.messages.errorSendingForgotPasswordEmail });
                                }
                            })
                        });
                    })
                } else {
                    return res.status(200).json({
                        error: false,
                        data: 'PASSWORD_TOKEN_EXPIRED'
                    })
                }
            });
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for get current user address
exports.get_current_user_address = function (req, res) {
    try {
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });

        // check id prams
        let qeuryData = '';
        if (req && req.query && req.query.id) {
            qeuryData = "SELECT * FROM tbl_store_customer_address WHERE  CustomerID = '" + req.query.userId + "' AND id = '" + req.query.id + "'"

        } else {
            qeuryData = "SELECT * FROM tbl_store_customer_address WHERE  CustomerID = '" + req.query.userId + "'"
        }

        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            // Pull data from database   
            mc.query(qeuryData, function (error, results, fields) {
                // connection release 
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                if (results && results.length) {
                    results = JSON.parse(JSON.stringify(results));  // Json parse

                    return res.send({ error: false, data: results });
                } else {
                    return res.status(404).send({ message: constants.messages.notFound });
                }
            });

        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};


// REST API for get current user data
exports.get_current_user = function (req, res) {
    try {
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            // Pull data from database  
            mc.query("SELECT * FROM users WHERE  id = '" + req.query.userId + "'", function (error, results, fields) {
                // connection release 
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                results = JSON.parse(JSON.stringify(results));  // Json parse
                if (results && results.length) {
                    // removed password from object
                    delete results[0].password
                    return res.send({ error: false, data: results });
                } else {
                    return res.status(404).send({ message: constants.messages.notFound });
                }
            });
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for edit profile 
exports.edit_user_profile = function (req, res) {
    try {
        let user_data = req.body;
        //Valide the SignUp FormData
        let validate_cols = ['first_name', 'last_name', 'email', 'phone', 'address', 'state', 'country', 'city', 'zip'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (user_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }
        if (valid_status) {
            if (!emailValidator.validate(user_data.email)) {
                valid_status = false;
                error_msg = constants.messages.invalidEmail;
            }
        }
        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        //mysql connection 
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });

            // return false;
            let check_query = "UPDATE users SET first_name ='" + user_data.first_name + "', last_name ='" + user_data.last_name + "', email='" + user_data.email + "', address ='" + user_data.address + "', phone ='" + user_data.phone + "', address2 ='" + user_data.address2 + "', city ='" + user_data.city + "',state ='" + user_data.state + "', zip ='" + user_data.zip + "' WHERE  id ='" + user_data.id + "'";
            pool.query(check_query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                // return result
                results = JSON.parse(JSON.stringify(results));  // Json parse
                if (results && request) {

                    // get current user information
                    pool.getConnection(function (err, mc) {
                        // check error
                        if (err) return res.status(500).json({ error: err.toString() });

                        pool.query("SELECT * FROM users WHERE  id ='" + user_data.id + "'", function (error, uData, fields) {
                            // connection release
                            mc.release();
                            // check error
                            if (error) return res.status(500).json({ error: error.toString() });

                            // return result
                            uData = JSON.parse(JSON.stringify(uData));  // Json parse
                            // delete password key
                            delete uData[0].password;
                            // send result
                            return res.send({ error: false, data: uData[0] });
                        })
                    });

                } else {
                    return res.status(403).send({ auth: false, message: constants.messages.userProfileNotUpdated });
                }
            })
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for edit user address 
exports.edit_address = function (req, res) {
    try {
        let user_data = req.body;
        //Valide the SignUp FormData
        let validate_cols = ['Address', 'State', 'Country', 'City', 'ZipCode'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (user_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }

        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        //mysql connection 
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });

            // return false;
            let check_query = ''
            if (user_data && user_data.id) {
                check_query = "UPDATE tbl_store_customer_address SET  Address ='" + user_data.Address + "', Address2 ='" + user_data.Address2 + "', State ='" + user_data.State + "', City ='" + user_data.City + "', First_Name ='" + user_data.First_Name + "', Last_Name ='" + user_data.Last_Name + "', Email_Address ='" + user_data.Email_Address + "', Phone_Number ='" + user_data.Phone_Number + "', ZipCode ='" + user_data.ZipCode + "' WHERE  id ='" + user_data.id + "'";
            } else {
                let cols = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
                let now = new Date();
                user_data.CustomerID = user_data.userId;
                user_data.AddressType = 'billing';
                user_data.First_Name = user_data.First_Name;
                user_data.Last_Name = user_data.Last_Name;
                user_data.Email_Address = user_data.Email_Address;
                user_data.Address = user_data.Address;
                user_data.Address2 = user_data.Address2;
                user_data.Phone_Number = user_data.Phone_Number;
                user_data.City = user_data.City;
                user_data.State = user_data.State;
                user_data.Country = user_data.country;
                user_data.ZipCode = user_data.ZipCode;
                user_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                // manage column
                // manage column
                let cols_sql = "";
                let values_sql = "";
                for (let i = 0; i < cols.length; i++) {
                    cols_sql += "`" + cols[i] + "`";
                    values_sql += "'" + user_data[cols[i]] + "'";
                    if (i + 1 < cols.length) {
                        cols_sql += ",";
                        values_sql += ",";
                    }
                }
                check_query = "INSERT INTO `tbl_store_customer_address` (" + cols_sql + ") VALUES (" + values_sql + ");";
            }
            pool.query(check_query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                // return result
                results = JSON.parse(JSON.stringify(results));  // Json parse
                if (results && request) {
                    return res.send({ error: false, data: results });
                } else {
                    return res.status(403).send({ auth: false, message: constants.messages.userAddressNotUpdated });
                }
            })
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for remove address according ids 
exports.remove_address = function (req, res) {
    try {
        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        // Check address id 
        if (!(req && req.query && req.query.id))
            return res.status(404).send({ message: constants.messages.addressPramsNotFound });

        //mysql connection 
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });

            // return false;
            let check_query = "DELETE FROM tbl_store_customer_address WHERE  id ='" + req.query.id + "'";
            pool.query(check_query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                // return result
                results = JSON.parse(JSON.stringify(results));  // Json parse
                if (results && request) {
                    return res.send({ error: false, data: results });

                } else {
                    return res.status(403).send({ auth: false, message: constants.messages.addressNotFound });
                }
            })
        });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for change password  
exports.update_password = function (req, res) {
    try {
        // get user data 
        let user_data = req.body;

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

        // Check user token
        if (!(user_data && user_data.token))
            return res.status(404).send({ message: constants.messages.tokenRequired });

        async.parallel([
            function (cbk) {
                // get old password 
                request(config.URLEncryp + '?method=encrypt&username=' + user_data.email + '&password=' + user_data.old_passwored, function (error, response, pResult) {
                    //check error
                    if (error) return cbk(error);
                    pResult = JSON.parse(pResult);  // Json parse);
                    return cbk(null, pResult);
                });
            },
            function (cbk) {
                // get new password 
                request(config.URLEncryp + '?method=encrypt&username=' + user_data.email + '&password=' + user_data.password, function (error, response, pResult) {
                    //check error
                    if (error) return cbk(error);
                    pResult = JSON.parse(pResult);  // Json parse);
                    return cbk(null, pResult);
                });
            },
            function (cbk) {
                // pull user from database
                pool.getConnection(function (err, mc) {
                    // check error
                    if (err) return cbk(err);
                    // run query    
                    pool.query("SELECT * FROM users WHERE email = '" + user_data.email + "'", function (error, results, fields) {
                        // connection release
                        mc.release();
                        if (error) return cbk(error);

                        results = JSON.parse(JSON.stringify(results));  // Json parse
                        return cbk(null, results);
                    });
                });
            }
        ], function (error, result) {
            // check error
            if (error) return res.status(500).json({ error: error.toString() });

            result = JSON.parse(JSON.stringify(result));  // Json parse
            // user type old password
            let oldPassword = (result && result[0] && result[0].password) ? result[0].password : '';
            // new password
            let NewPassword = (result && result[1] && result[1].password) ? result[1].password : '';
            // db old passwored   
            let oldDBPassword = (result && result[2] && result[2] && result[2][0] && result[2][0].password) ? result[2][0].password : '';
            // check old and db passwored 
            if ((oldPassword == oldDBPassword) && NewPassword) {
                // run query
                pool.getConnection(function (err, mc) {
                    // check error
                    if (err) return cbk(err);
                    pool.query("UPDATE users SET password ='" + NewPassword + "' WHERE email = '" + user_data.email + "'", function (error, results, fields) {
                        // connection release
                        mc.release();
                        // check error
                        if (error) return res.status(500).json({ error: error.toString() });

                        // return result
                        results = JSON.parse(JSON.stringify(results));  // Json parse
                        // return result 
                        return res.send({ error: false, data: results });
                    });
                });
            } else {
                return res.status(404).send({ message: constants.messages.OldPasswordDoesNotMatch });
            }
        })
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};


// REST API for get current user orders
exports.get_user_orders = function (req, res) {
    try {
        
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });

        // Set query   
        let cond = '';
        if (req.query && req.query.status && req.query.status != 'all') {
          cond = ' AND Order_Status = ' + req.query.status + ' ';
        }
        
        // Manage multipl process
        async.waterfall([
          function (callback) {
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return callback(err);
              // run query  
              let query = "SELECT ID,CID,VID,MemberID,OrderID,Billing_First_Name,Billing_Last_Name,Billing_Email,Billing_Phone,Shipping_First_Name,Shipping_Last_Name,Shipping_Email,Shipping_Address,Shipping_Address2,Shipping_City,Shipping_State,Shipping_Country,Shipping_Zip,Shipping_Phone,Order_Status,Payment_Shipping,Payment_Shipping_Discount,Payment_Subtotal,Payment_Tax,Coupon_Discount,Payment_Subtotal,Payment_Grandtotal,Order_Date,Payment_InvoiceID FROM tbl_store_orders WHERE Payment_Status = '1' and MemberID= '"+req.query.userId+"' " + cond+ ' order by Order_Date desc';
              //console.log(query);
                
              pool.query(query, function (error, Orders, fields) {
                // connection release 
                mc.release();
                return callback(error, Orders);
              });
                
            });
              
          },
          function (Orders, callback) {
            Orders = JSON.parse(JSON.stringify(Orders));  // Json parse
            if (Orders && Orders.length) {
              //console.log(Orders);
              
              async.mapLimit(Orders, 1, function (Order, cbk) {
                pool.getConnection(function (err, mc) {
                  // check error
                  if (err) return cbk(err);
                  Order.Order_Date = moment(new Date(Order.Order_Date)).format("DD MMMM YYYY");
                  Order.Payment_Grandtotal = Order.Payment_Grandtotal.toFixed(2);
                  // run query  
                  let query = "SELECT stv.ID,stv.CID,stv.VID,stv.MemberID,stv.Product_ID,stv.Product_Count,stv.Product_Price,stv.Discount_Price,stv.CouponDiscount,stv.Tax,stv.ShippingFee,stv.ShippingDiscount,stv.TotalAmount,product.Product_Name,product.Product_Slug,product.Product_Short_Description,product.Image_type,product.Image,product.Video,product.Video_thumb,product.CategoryID,product.Category_Name,product.Category_Slug,product.Added_By,Shipping_Status FROM tbl_store_order_products stv left join view_store_products product on(product.ID=stv.Product_ID) WHERE OrderID = '"+Order.ID+"' ";
                  //console.log(query);
                  pool.query(query, function (error, OrderProducts, fields) {
                    // connection release 
                    mc.release();
                    Order.products = OrderProducts;
                    return cbk(error, Order);
                  });
                });
              }, callback);
               
            } else {
              return callback(null, null);
            }
          }
        ], function (error, results) {
          // check error
          if (error) return res.status(500).json({ error: error.toString() });
          //console.log(results);
          return res.send({ error: false, data: results });
        });
        
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for add product in wishlist
exports.add_to_wishlist = function (req, res) {
    try {
        
        // Check cid 
        if (!(req && req.body && req.body.CID))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.body && req.body.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });
        let p_data = req.body;

        //Valide the SignUp FormData
        let validate_cols = ['userId', 'Product_ID'];
        let valid_status = true;
        let error_msg = constants.messages.requiredData;
        for (let i = 0; i < validate_cols.length; i++) {
            if (p_data[validate_cols[i]] == '') {
                valid_status = false;
                break;
            }
        }
        
        if (!valid_status) {
            return res.status(403).send({ error: error_msg });
        }

        // check api auth
        if (!common.checkApiAuthentication(req))
            return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });
        //mysql connection 
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });
            // return false;
            let check_query = "SELECT * FROM tbl_store_wishlist_products WHERE CustomerID = '" + p_data.userId + "' and Product_ID = '" + p_data.Product_ID + "'";
            pool.query(check_query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                if (results && results.length) {
                    return res.status(403).json({ error: constants.messages.ProductExistinWishlist });
                }else{
                    async.waterfall([
                      function (callback) {

                        pool.getConnection(function (err, mc) {
                          // check error
                          if (err) return callback(err);

                          // save user in users table

                          let cols = ['CID', 'CustomerID', 'Wishlist_ID', 'Product_ID', 'AddedOn'];
                            p_data.Wishlist_ID = '0';
                            p_data.CustomerID = p_data.userId;
                            p_data.Product_ID = p_data.Product_ID;
                            let now = new Date();
                            p_data.AddedOn = moment(now).format('Y-MM-DD HH:mm:s');

                            // return;
                            let cols_sql = "";
                            let values_sql = "";
                            for (let i = 0; i < cols.length; i++) {
                                cols_sql += "`" + cols[i] + "`";
                                values_sql += "'" + p_data[cols[i]] + "'";
                                if (i + 1 < cols.length) {
                                    cols_sql += ",";
                                    values_sql += ",";
                                }
                            }
                         let insert_sql = "INSERT INTO `tbl_store_wishlist_products` (" + cols_sql + ") VALUES (" + values_sql + ");";
                          // run query  
                          pool.query(insert_sql, function (error, Record, fields) {
                            // connection release 
                            mc.release();
                            return callback(error, Record);
                          });
                        });

                      },
                      function (Record, callback) {
                        Record = JSON.parse(JSON.stringify(Record));  // Json parse

                        // product added in wishlist
                        async.parallel([
                          function (cbk) {
                            // fetch wishlists now
                            let query = "SELECT ID,CID,CustomerID,Product_CID,Product_ID,AddedOn,Product_Name,Product_Slug,Product_Code,Product_Model_Number,CategoryID,Product_Short_Description,Product_Price,Product_Currency,Product_Stock,Product_Image,Product_AddedOn,Product_Featured,DiscountType,Discount,Product_Status,Product_AddedBy,Image_type,Image,Video,Video_source,Video_thumb from view_store_wishlist_products WHERE CustomerID= '"+p_data.userId+"' order by AddedOn desc";
                            pool.query(query, function (error, results, fields) {
                                // check error
                                if (error) return res.status(500).json({ error: error.toString() });

                                // return result
                                results = JSON.parse(JSON.stringify(results));  // Json parse
                                if (results && results.length) {
                                    return cbk(error, results);

                                }
                            });
                          }
                        ], callback);
                      }

                    ], function (error, results) {
                      // check error
                      if (error) return res.status(500).json({ error: error.toString() });
                      // check length
                      results = JSON.parse(JSON.stringify(results[0]));
                      return res.send({ error: false, data:results });

                    });
                } 
            });
        });
        
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

// REST API for remove product from wishlist
exports.remove_product_from_wishlist = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      // Delete cart item from database   
      mc.query("DELETE FROM tbl_store_wishlist_products WHERE ID= '"+req.query.ID+"' " , function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        results = JSON.parse(JSON.stringify(results));  // Json parse
        if (results) {
          return res.send({ error: false, data: results });
        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// REST API for get current user wishlist products
exports.get_user_wishlist_products = function (req, res) {
    try {
        
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });

        // Set query   
        let cond = '';
        if (req.query && req.query.status && req.query.status != 'all') {
          cond = ' AND Wishlist_Status = ' + req.query.status + ' ';
        }
        
        //mysql connection 
        pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });

            // return false;
            let query = "SELECT ID,CID,CustomerID,Product_ID,AddedOn,Product_CID,Product_Name,Product_Slug,Product_Code,Product_Model_Number,CategoryID,Product_Short_Description,Product_Price,Product_Currency,Product_Stock,Product_Image,Product_AddedOn,Product_Featured,DiscountType,Discount,Product_Status,Product_AddedBy,Image_type,Image,Video,Video_source,Video_thumb from view_store_wishlist_products WHERE CustomerID= '"+req.query.userId+"' " + cond+ ' order by AddedOn desc';
            pool.query(query, function (error, results, fields) {
                // connection release
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                // return result
                results = JSON.parse(JSON.stringify(results));  // Json parse
                if (results && request) {
                    return res.send({ error: false, data: results });

                } else {
                    return res.status(403).send({ auth: false, message: constants.messages.WishlistEmpty });
                }
            })
        });
        
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
    
};

// REST API for get order details
exports.get_order_details = function (req, res) {
    try {
        
        // Check cid 
        if (!(req && req.query && req.query.cid))
            return res.status(404).send({ message: constants.messages.cidNotFound });

        // Check session id 
        if (!(req && req.query && req.query.userId))
            return res.status(404).send({ message: constants.messages.sessionIdNotFound });

        // Set query   
        let cond = '';
        if (req.query && req.query.OrderID && req.query.OrderID != 'all') {
          cond = ' AND OrderID = "' + req.query.OrderID + '" ';
        }
        
        // Manage multipl process
        async.waterfall([
          function (callback) {
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return callback(err);
              // run query  
              let query = "SELECT ID,CID,VID,MemberID,OrderID,Billing_First_Name,Billing_Last_Name,Billing_Email,Billing_Phone,Shipping_First_Name,Shipping_Last_Name,Shipping_Email,Shipping_Address,Shipping_Address2,Shipping_City,Shipping_State,Shipping_Country,Shipping_Zip,Shipping_Phone,Order_Status,Payment_Shipping,Payment_Shipping_Discount,Payment_Subtotal,Payment_Tax,Payment_Discount,Coupon_Code,Coupon_Discount,Payment_Subtotal,Payment_Grandtotal,Order_Date,Payment_InvoiceID,Shipping_Type,Shipping_Pickup,Shipping_LoadingDock,Shipping_EqpUpload,Payment_InvoiceID,Shipping_LiftGate,Shipping_CallAhead,Shipping_SemiTrucks,Extra_Info FROM tbl_store_orders WHERE Payment_Status = '1' and MemberID= '"+req.query.userId+"' " + cond;
              //console.log(query);
                
              pool.query(query, function (error, Orders, fields) {
                // connection release 
                mc.release();
                return callback(error, Orders);
              });
                
            });
              
          },
          function (Orders, callback) {
            Orders = JSON.parse(JSON.stringify(Orders));  // Json parse
            if (Orders && Orders.length) {
              //console.log(Orders);
              
              async.mapLimit(Orders, 1, function (Order, cbk) {
                pool.getConnection(function (err, mc) {
                  // check error
                  if (err) return cbk(err);
                  Order.Order_Date = moment(new Date(Order.Order_Date)).format("DD MMMM YYYY");
                  Order.Payment_Subtotal = Order.Payment_Subtotal.toFixed(2);
                  Order.Payment_Tax = Order.Payment_Tax.toFixed(2);
                  Order.Payment_Shipping = Order.Payment_Shipping.toFixed(2);
                  Order.Payment_Shipping_Discount = Order.Payment_Shipping_Discount.toFixed(2);
                  Order.Payment_Grandtotal = Order.Payment_Grandtotal.toFixed(2);
                    
                    
                  // run query  
                  let query = "SELECT stv.ID,stv.CID,stv.VID,stv.MemberID,stv.Product_ID,stv.Product_Count,stv.Product_Price,stv.Discount_Price,stv.Total_Discount,stv.CouponDiscount,stv.Tax,stv.ShippingFee,stv.ShippingDiscount,stv.TotalAmount,product.Product_Name,product.Product_Slug,product.Product_Short_Description,product.Image_type,product.Image,product.Video,product.Video_thumb,product.CategoryID,product.Category_Name,product.Category_Slug,product.Added_By,product.Estimated_Leed_Type,product.Estimated_Leed_Count FROM tbl_store_order_products stv left join view_store_products product on(product.ID=stv.Product_ID) WHERE OrderID = '"+Order.ID+"'";
                  //console.log(query);
                  pool.query(query, function (error, OrderProducts, fields) {
                     // connection release 
                     mc.release();
                     OrderProducts = JSON.parse(JSON.stringify(OrderProducts));  // Json parse
                      _.map(OrderProducts, function (v) {
                        // calculate discount/percentage
                        v.TotalAmount = v.TotalAmount.toFixed(2);
                        let LeadDays = moment(new Date()).format("YYYY-MM-DD");
                        if (v && v.Estimated_Leed_Type == "day") {
                          LeadDays = moment(moment(new Date()).add(parseInt(v.Estimated_Leed_Count), 'day')).format("YYYY-MM-DD");
                        } else if (v && v.Estimated_Leed_Type == "week") {
                          LeadDays = moment(moment(new Date()).add(parseInt(v.Estimated_Leed_Count), 'week')).format("YYYY-MM-DD");
                        } else if (v && v.Estimated_Leed_Type == "month") {
                          LeadDays = moment(moment(new Date()).add(parseInt(v.Estimated_Leed_Count), 'month')).format("YYYY-MM-DD");
                        }
                        v.LeadDays = LeadDays;
                        return v;
                      });
                      //console.log(OrderProducts);
                     Order.products = OrderProducts;
                     return cbk(error, Order);
                  });
                });
              }, callback);
               
            } else {
              return callback(null, null);
            }
          }
        ], function (error, results) {
          // check error
          if (error) return res.status(500).json({ error: error.toString() });
          //console.log(results);
          return res.send({ error: false, data: results });
        });
        
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
};

