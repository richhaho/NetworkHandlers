const config = require('../config/config');
const _ = require('lodash');
const crypto = require('crypto');
const secret_key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
let jwt = require('jsonwebtoken');
const moment = require('moment');
const nodemailer = require('nodemailer');
const constants = require('../config/constants');

module.exports = {
  // Check API authenticateion
  checkApiAuthentication: function (req) {
    let headers = JSON.parse(JSON.stringify(req.headers));
    // Check api keys;
    if (String(config.APIKEY) == String(headers.apikey)) {
      return true;
    } else {
      return false
    }
  },
  // Caculate dicount/percent for product.
  calculateDiscount: function (v) {
    let Discount_Price = 0;
    if (v.DiscountType == "amount") {
      Discount_Price = (v.Product_Price - v.Discount);
    } else if (v.DiscountType == "percent") {
      Discount_Price = (v.Product_Price - ((v.Product_Price * v.Discount) / 100));
    }
    return Discount_Price.toFixed(2);
  },
  encrypt: function (text) {
    let cipher = crypto.createCipheriv(config.CHIPER, Buffer.from(config.SECRET_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  },

  decrypt: function (text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv(config.CHIPER, Buffer.from(config.SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },

  generateToken: function (user) {
    let payload = {
      iss: config.HOST,
      sub: user.id,
      iat: moment().unix(),
      exp: moment().add(7, 'days').unix()
    };
    return jwt.sign(payload, config.TOKEN_SECRET);
  },

  genResetPasswordToken: function (length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    let result = '';
    for (let i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  },

  // sending email
  sendEmail: function (params, callback) {
    const email = params.email;
    const subject = params.subject;
    const mailMsg = params.message;

    const smtpTransport = nodemailer.createTransport({
      service: config.SMTP_SERVICE,
      host: config.SMTP_HOST, // hostname
      secureConnection: false, // use SSL
      port: config.SMTP_PORT, // port for secure SMTP
      auth: {
        user: config.SMTP_USERNAME,
        pass: config.SMTP_PASSWORD
      }
    });
    // setup e-mail data with unicode symbols
    let mailOptions = mailMsg.indexOf('<') !== -1 ? {
      from: "Angle Hosts", // sender address
      to: email, // list of receivers
      subject: subject, // Subject line
      html: mailMsg,
    } : {
        from: "Angle Hosts", // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: mailMsg,
      };

    // send mail with defined transport object
    let result;
    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        result = {
          flag: false,
          message: 'Error'
        };
        callback(null, result);
      } else {
        result = {
          flag: true,
          message: 'RESET_PASSWORD'
        };
        callback(null, result);
      }
    });
  },

  UPSUnishippers: function (pItem, results, req,checkout_data) {
    // manage shipping date 
    let shipDate = moment(new Date()).format("YYYY-MM-DD");
    if (pItem && pItem.Estimated_Leed_Type == "day") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'day')).format("YYYY-MM-DD");
    } else if (pItem && pItem.Estimated_Leed_Type == "week") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'week')).format("YYYY-MM-DD");
    } else if (pItem && pItem.Estimated_Leed_Type == "month") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'month')).format("YYYY-MM-DD");
    }
    // manage UPS unishipper data object 
    let unishippersObj = {
      api_key: config.unishippers.api_key,
      CID: req.body.cid,
      requestkey: config.unishippers.requestkey,
      username: config.unishippers.username,
      password: config.unishippers.password,
      upsaccountnumber: config.unishippers.upsaccountnumber,
      unishipperscustomernumber: config.unishippers.unishipperscustomernumber,
      service: config.unishippers.service,
      shipdate: shipDate,
      senderstate: (pItem && pItem.State) ? pItem.State.substring(0, 2) : '',
      sendercountry: (pItem && pItem.Country) ? pItem.Country : '',
      senderzip: (pItem && pItem.ZIP) ? pItem.ZIP : '',
      receiverstate: (checkout_data && checkout_data.shipping_state) ? checkout_data.shipping_state.substring(0, 2) : '',
      receivercountry: (checkout_data && checkout_data.shipping_country) ? checkout_data.shipping_country : '',
      receiverzip: (checkout_data && checkout_data.shipping_zip) ? checkout_data.shipping_zip : '',
      fees: {
        REP: "REP",
        SUR: "SUR"
      },
      packages: [{
        weight: (pItem && pItem.Packaging_Weight) ? pItem.Packaging_Weight : 0,
        length: (pItem && pItem.Packaging_Length) ? pItem.Packaging_Length : 0,
        height: (pItem && pItem.Packaging_Height) ? pItem.Packaging_Height : 0,
        width: (pItem && pItem.Packaging_Width) ? pItem.Packaging_Width : 0,
        packagetype: 'P',
        declaredvalue: (pItem && pItem.ShipmentValue) ? (pItem.ShipmentValue * pItem.Product_Count) : '',
        cod: 0
      }]
    };
    return unishippersObj;
  },

  LTLUnishippers: function (pItem, results,checkout_data) {
    // manage shipping date 
    let pickUpDate = moment(new Date()).format("MM/DD/YYYY hh:mm");
    let shipDate = moment(new Date()).format("MM/DD/YYYY hh:mm");
    if (pItem && pItem.Estimated_Leed_Type == "day") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'day')).format("MM/DD/YYYY hh:mm");
    } else if (pItem && pItem.Estimated_Leed_Type == "week") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'week')).format("MM/DD/YYYY hh:mm");
    } else if (pItem && pItem.Estimated_Leed_Type == "month") {
      shipDate = moment(moment(new Date()).add(parseInt(pItem.Estimated_Leed_Count), 'month')).format("MM/DD/YYYY hh:mm");
    }
    // mange LTL unishipper object 
    let rateRequest = {
      requests: {
        "@username": config.ltl_unishippers.username, "@password": config.ltl_unishippers.password, "@id": config.ltl_unishippers.id, "@token": config.ltl_unishippers.token,
        request: {
          "@service": "RateRequest",
          RateRequest: {
            "@unitPricing": "false",
            RatingLevel: {
              "@isCompanyAccountNumber": config.ltl_unishippers.isCompanyAccountNumber_status,
              "#text": config.ltl_unishippers.isCompanyAccountNumber
            },
            Constraints: {
              Contract: {
              },
              Carrier: {
              },
              Mode: {
              },
              ServiceFlags: {
              }
            },
            PaymentTerms: {
              "#text": config.ltl_unishippers.PaymentTerms
            },
            HandlingUnits: {
              HandlingUnit: {
                "@stackable": (pItem && pItem.Stackable) ? pItem.Stackable : "false",
                Quantity: {
                  "@units": (pItem && pItem.Packaging_Type) ? pItem.Packaging_Type : "Pallet", 
                  "#text": pItem.Product_Count
                },
                Weight: {
                  "@units": "lb",
                  "#text": (pItem && pItem.Packaging_Weight) ? pItem.Packaging_Weight : 0
                },
                Dimensions: {
                  "@height": (pItem && pItem.Packaging_Height) ? pItem.Packaging_Height : 0,
                  "@width": (pItem && pItem.Packaging_Width) ? pItem.Packaging_Width : 0,
                  "@length": (pItem && pItem.Packaging_Length) ? pItem.Packaging_Length : 0,
                },
                Items: {
                  Item: [{
                    "@freightClass": (pItem && pItem.Packaging_Class) ? pItem.Packaging_Class : 0, 
                    "@sequence": "1",
                    Weight: {
                      "@units": "lb",
                      "#text": (pItem && pItem.Packaging_Weight) ? pItem.Packaging_Weight : 0
                    },
                    Dimensions: {
                      "@height": (pItem && pItem.Packaging_Height) ? pItem.Packaging_Height : 0,
                      "@units": "in",
                      "@width": (pItem && pItem.Packaging_Width) ? pItem.Packaging_Width : 0,
                      "@length": (pItem && pItem.Packaging_Length) ? pItem.Packaging_Length : 0,
                    },
                    Quantity: {
                      "@units": (pItem && pItem.Packaging_Type) ? pItem.Packaging_Type : "Pallet",
                      "#text": pItem.Product_Count
                    }
                  }]
                }
              },
            },
            Events: {
              Event: [{
                "@date": pickUpDate,
                "@type": "Pickup",
                "@sequence": "1",
                Location: {
                  City: {
                    "#text": (pItem && pItem.City) ? pItem.City : ''
                  },
                  State: {
                    "#text": (pItem && pItem.State) ? pItem.State.substring(0, 2) : ''
                  },
                  Zip: {
                    "#text": (pItem && pItem.ZIP) ? pItem.ZIP : ''
                  },
                  Country: {
                    "#text": (pItem && pItem.Country) ? pItem.Country : ''
                  }
                }
              }, {
                "@date": shipDate,
                "@type": "Drop",
                "@sequence": "2",
                Location: {
                  City: {
                    "#text": (checkout_data && checkout_data.shipping_city) ? checkout_data.shipping_city : ''
                  },
                  State: {
                    "#text": (checkout_data && checkout_data.shipping_state) ? checkout_data.shipping_state.substring(0, 2) : ''
                  },
                  Zip: {
                    "#text": (checkout_data && checkout_data.shipping_zip) ? checkout_data.shipping_zip : ''
                  },
                  Country: {
                    "#text": (checkout_data && checkout_data.shipping_country) ? checkout_data.shipping_country : ''
                  }
                }
              }]
            }
          }
        }
      }
    };
    // return object 
    return rateRequest;
  }
}
