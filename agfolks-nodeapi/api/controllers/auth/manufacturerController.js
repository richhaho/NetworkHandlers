const constants = require('../../../config/constants');
const config = require('../../../config/config');
const common = require('../../common');
const _ = require('lodash');
const moment = require('moment');
const async = require("async");
const emailValidator = require('email-validator');
const request = require('request');

// REST API.
exports.manufacturer_sign_up = function (req, res) {
  try {
    let user_data = req.body;
    let validate_cols = ['CID', 'Company_Name', 'First_Name', 'Last_Name', 'Email_Address', 'Mobile_Phone', 'Address', 'State', 'City', 'ZIP', 'Country', 'password', 'confirmpass'];
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
      if (!emailValidator.validate(user_data.Email_Address)) {
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

    request(config.URLEncryp + '?method=encrypt&username=' + user_data.Email_Address + '&password=' + user_data.password, function (error, response, result) {
      //check error
      if (error) return res.status(500).json({ error: error.toString() });
      encresp = JSON.parse(result);  // Json parse);
      //mysql connection 
      pool.getConnection(function (err, mc) {
        // check error
        if (err) return res.status(500).json({ error: err.toString() });
        pool.query("SELECT * FROM tbl_employees WHERE Email_Address = '" + user_data.Email_Address + "'", function (error, results, fields) {
          // connection release
          mc.release();
          // check error
          if (error) return res.status(500).json({ error: error.toString() });

          if (results && results.length) {
            return res.status(403).json({ error: "The email has already been taken." });
          } else {
            let full_name = user_data.First_Name + ' ' + user_data.Last_Name;
            user_data.Country = 'US';
            user_data.Currency = 'USD';
            let Today_Date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
            let Subs_Date = moment(moment(new Date()).add(30, 'years')).format("YYYY-MM-DD HH:mm:ss");

            // create new subscription in DB now
            // Manage multiple process
            async.waterfall([
              function (callback) {
                pool.getConnection(function (err, mc) {
                  // check error
                  if (err) return callback(err);

                  // save order details in order table

                  let query = "INSERT INTO tbl_companies (Company_Name, Contact_Name,Contact_Email,Address, State, Zip_Code, Country, Currency, City, Phone_Number,AccessType,date_format) VALUES ('" + user_data.Company_Name + "', '" + full_name + "','" + user_data.Email_Address + "', '" + user_data.Address + "',  '" + user_data.State + "', '" + user_data.ZIP + "', '" + user_data.Country + "', '" + user_data.Currency + "', '" + user_data.City + "', '" + user_data.Mobile_Phone + "','PAID','mm-dd-yyyy')";
                  // run query  
                  pool.query(query, function (error, Company, fields) {
                    // connection release 
                    mc.release();
                    return callback(error, Company);
                  });
                });
              },
              function (Company, callback) {
                Company = JSON.parse(JSON.stringify(Company));  // Json parse
                //console.log(Company);
                let company_id = Company.insertId

                // Company created now make entry in other required tables
                async.parallel([
                  function (cbk) {
                    // save company subscriptions
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbk(err);
                      // run query  
                      let query = "INSERT INTO tbl_company_subscriptions (CID, payment_gateway, Subscription_Amount,Currency, period, plan_id, subscription_id, invoice_id, transaction_id, created_at, updated_at)VALUES ('" + company_id + "', 'stripe', '100','" + user_data.Currency + "', 'month', '', '', '', '', '" + Today_Date + "', '" + Today_Date + "')";

                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbk(error, CompanyCB);
                      });
                    });
                  },
                  function (cbk) {
                    // save subscriptions
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbk(err);
                      // run query  
                      let query = "INSERT INTO tbl_subscriptions (CID, Subscription_Start, Subscription_End, Active, Subscription_Type)VALUES ('" + company_id + "', '" + Today_Date + "', '" + Subs_Date + "', '1', '5')";

                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbk(error, CompanyCB);
                      });
                    });
                  },
                  function (cbk) {
                    // save subscriptions
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbk(err);
                      // run query  
                      let query = "INSERT INTO tbl_subscriptions (CID, Subscription_Start, Subscription_End, Active, Subscription_Type)VALUES ('" + company_id + "', '" + Today_Date + "', '" + Subs_Date + "', '1', '11')";

                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbk(error, CompanyCB);
                      });
                    });
                  },
                  function (cbk) {
                    // save group record
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbk(err);
                      // run query  
                      let query = "INSERT INTO `tbl_cms_settings` (`CID`, `temporary_url`, `url`, `name`, `meta_tag`, `admin_email`, `contact_email`, `contact_name`,`permalink`, `Invoice_Sender`) VALUES ('" + company_id + "','" + config.APP_URL + "','" + config.APP_URL + "','" + user_data.Company_Name + "','" + user_data.Company_Name + "','" + user_data.Email_Address + "','" + user_data.Email_Address + "','" + full_name + "','" + config.APP_URL + "','" + user_data.Email_Address + "');";
                      //console.log(query);
                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbk(error, CompanyCB);
                      });
                    });
                  },
                  function (cbk) {
                    // save group record
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbk(err);
                      // run query  
                      let query = "INSERT INTO auth_groups (c_id, title, status)VALUES ('" + company_id + "', 'Manufacturer', '1')";

                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbk(error, CompanyCB);
                      });
                    });
                  },
                ], function (err, pResult) {
                  pResult = JSON.parse(JSON.stringify(pResult));
                  // push compnay data
                  pResult.push(Company);
                  callback(err, pResult);
                });
              }
            ], function (error, results) {
              // check error
              if (error) return res.status(500).json({ error: error.toString() });
              // check length
              results = JSON.parse(JSON.stringify(results));
              if (results && results.length) {
                let group_id = (results[4] && results[4].insertId) ? results[4].insertId : '';
                let company_id = (results[5] && results[5].insertId) ? results[5].insertId : '';
                // insert multiple data 
                async.parallel([
                  function (cbkk) {
                    // save permissions records
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbkk(err);
                      // run query  
                      pool.query("SELECT auth_sections.id from auth_sections INNER JOIN tbl_subscriptions ON auth_sections.module_id = tbl_subscriptions.Subscription_Type WHERE tbl_subscriptions.CID = '" + company_id + "'", function (error, subscriptions, fields) {
                        // connection release 
                        mc.release();
                        // check error
                        if (error) return cbkk(error);
                        // parse json
                        subscriptions = JSON.parse(JSON.stringify(subscriptions));
                        // check length
                        if (subscriptions && subscriptions.length) {
                          //console.log(subscriptions);

                          subscriptions.push({ id: 1 });
                          subscriptions.push({ id: 45 });
                          subscriptions.push({ id: 119 });
                          subscriptions.push({ id: 120 });
                          //subscriptions.push({id:121});
                          //subscriptions.push({id:122});
                          subscriptions.push({ id: 123 });
                          //subscriptions.push({id:124});
                          //subscriptions.push({id:125});
                          //subscriptions.push({id:126});
                          //subscriptions.push({id:127});
                          //subscriptions.push({id:128});
                            
                          // payments permissions
                          subscriptions.push({id:51});
                          subscriptions.push({id:52});
                          subscriptions.push({id:53});
                          subscriptions.push({id:54});
                          subscriptions.push({id:55});
                          subscriptions.push({id:56});
                          
                          
                            

                          // running jobs 
                          async.mapLimit(subscriptions, 1, function (subscription, cbkkk) {
                            pool.getConnection(function (err, mc) {
                              // check error
                              if (err) return cbkkk(err);
                              // run query  
                              let query = "INSERT INTO auth_group_permissions(group_id,section_id,edit_permission,delete_permission,publish_permission,add_permission,access,status) VALUES('" + group_id + "','" + subscription.id + "','1','1','1','1','1','1')";
                              //console.log(query);
                              pool.query(query, function (error, CompanyCB, fields) {
                                // connection release 
                                mc.release();
                                return cbkkk(error, CompanyCB);
                              });
                            });
                          }, cbkk);
                        } else {
                          cbkk(null, null);
                        }
                      });
                    });
                  }, function (cbkk) {
                    // save group record
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbkk(err);
                      // run query  
                      let query = "INSERT INTO tbl_employees (CID,group_id,First_Name, Last_Name, Email_Address, Job_Title, Mobile_Phone, City,State,ZIP,Country, Level, \$Username, \$Password, Notes, Address, added_by, Blocked, user_type,Active)VALUES ('" + company_id + "','" + group_id + "','" + user_data.First_Name + "', '" + user_data.Last_Name + "', '" + user_data.Email_Address + "', 'Admin', '" + user_data.Mobile_Phone + "', '" + user_data.City + "','" + user_data.State + "','" + user_data.ZIP + "','" + user_data.Country + "', '1', '" + encresp.username + "', '" + encresp.password + "', '', '" + user_data.Address + "', '0', '0', 'BACKEND','0')";
                      //console.log(query);
                      pool.query(query, function (error, CompanyCB, fields) {
                        // connection release 
                        mc.release();
                        return cbkk(error, CompanyCB);
                      });
                    });
                  }, function (cbkk) {
                    // send email to manufacturer  now
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbkk(err);

                      let getEmailTemplate = "SELECT * FROM `tbl_email_templates` WHERE `type` = 'Manufacturer_Signup'";
                      pool.query(getEmailTemplate, function (error, results1, fields) {
                        mc.release();
                        // check error
                        if (error) return cbkk(error);
                        if (results1 && results1.length) {
                          let message = results1[0]['template_value'];
                          let content = '';
                          let msgTemplate = message.replace('{{CONTENT}}', content);
                          const mailOptions = {
                            email: user_data.Email_Address,
                            subject: "YOUR ARE NOW SIGNED UP TO CAPTURE THE SALES YOU'VE BEEN MISSING",
                            message: msgTemplate
                          };

                          common.sendEmail(mailOptions, function (err, result) {
                            if (err) {
                              cbkk(null, null);
                            } else {
                              if (result.flag) {
                                cbkk(null, null);
                              } else {
                                cbkk(null, null);
                              }
                            }
                          });
                        } else {
                          cbkk(null, null);
                        }
                      });
                    });
                  }
                ], function (err, fResult) {
                  // check error
                  if (err) return res.status(500).json({ error: err.toString() });
                  // finally result 
                  fResult = JSON.parse(JSON.stringify(fResult));
                  //console.log(fResult);
                  return res.send({ error: false, fResult });

                });
              } else {
                res.status(500).json({ error: 'Something went wrong. Please try again later' });
              }
            })
          }
        })
      });
    });

  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
};
exports.manufacturer_login = function (req, res) {
  let user_data = req.body;
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      let check_query = "SELECT * FROM users WHERE email = '" + user_data.email + "' AND password = '" + encrypt(user_data.password) + "'";
      pool.query(check_query, function (error, results, fields) {
        // connection release
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          return res.send({ error: false, results });
        } else {
          return res.status(403).json({ error: "The email or password is incorrect" });
        }
      })
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
};

