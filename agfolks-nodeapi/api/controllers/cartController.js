const constants = require('../../config/constants');
const config = require('../../config/config');
const common = require('../common');
const _ = require('lodash');
const async = require("async");
const Avatax = require('avatax');
const moment = require('moment');
const request = require('request');
const orderid = require('order-id')(config.secretOfOrder);
const builder = require('xmlbuilder');
const parser = require('xml2json');
const emailValidator = require('email-validator');

// REST API for featured product
exports.tmp_add_to_product = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    if (!(req && req.body && req.body.CID && req.body.SessionID && req.body.Product_ID))
      return res.status(404).send({ message: constants.messages.requiredData });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      mc.query("select * from tbl_store_cart WHERE Product_ID = " + req.body.Product_ID + " AND SessionID = '" + req.body.SessionID + "'", function (err, cData, fields) {
        // connection release 
        mc.release();
        // check error
        if (err) return res.status(500).json({ error: err.toString() });

        cData = JSON.parse(JSON.stringify(cData));  // Json parse

        // manage query here
        let queryData = '';
        if (cData && cData.length) {
          queryData = "UPDATE tbl_store_cart SET Product_Count = '" + (cData[0].Product_Count + req.body.Product_Count) + "' WHERE SessionID = '" + req.body.SessionID + "' and Product_ID = '" + req.body.Product_ID + "'";
        } else {
          queryData = "INSERT INTO tbl_store_cart(CID, MemberID, SessionID, Cart_Date, Product_ID, Product_Count) VALUES('" + req.body.CID + "', '" + (parseInt(req.body.MemberID) || 0) + "', '" + req.body.SessionID + "', '" + moment(new Date(req.body.Cart_Date)).format("YYYY-MM-DD HH:mm:ss") + "', '" + req.body.Product_ID + "','" + req.body.Product_Count + "')";
        }

        // Add product in cart table 
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return res.status(500).json({ error: err.toString() });

          // Pull data from database   
          mc.query(queryData, function (error, results, fields) {
            // connection release 
            mc.release();
            // check error
            if (error) return res.status(500).json({ error: error.toString() });

            results = JSON.parse(JSON.stringify(results));  // Json parse
            if (results) {
              // set data 
              let setData = req.body;
              setData.insertId = (cData && cData.length) ? cData[0].Product_ID : results.insertId;
              return res.send({ error: false, data: setData });
            } else {
              return res.status(404).send({ message: constants.messages.notFound });
            }
          });
        });
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// REST API for featured product
exports.get_product_cart_info = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Check session id 
    if (!(req && req.query && req.query.SessionID))
      return res.status(404).send({ message: constants.messages.sessionIdNotFound });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      // Pull data from database   
      mc.query("SELECT ID, CID, MemberID, SessionID, Cart_Date, Product_ID, VID, Product_Name, Product_Slug, Product_Code, Product_Price, Product_Currency, Product_Image,Product_Stock, Discount, DiscountType, Image_type, Image, Video_thumb, Category_Name, Category_Slug, Added_By, Product_Count FROM view_store_cart WHERE SessionID = '" + req.query.SessionID + "'", function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse
          let count = 0;
          let subTotal = 0;
          // sum of product count
          _.map(results, function (v) {
            // calculate discount/percentage
            v.Discount_Price = common.calculateDiscount(v);
            // Add total of product which added cart according to calculaton mode
            if (v.DiscountType == "amount" || v.DiscountType == "percent") {
              subTotal += (v.Discount_Price * v.Product_Count);
            } else {
              subTotal += (v.Product_Price * v.Product_Count);
            }
            count += v.Product_Count;
            return v;
          });
          return res.send({ error: false, data: results, productCount: count, subTotal: subTotal.toFixed(2) });
        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// REST API for remove product from cart
exports.remove_cart_item = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      // Delete cart item from database   
      mc.query("DELETE FROM tbl_store_cart WHERE ID = " + req.query.ID, function (error, results, fields) {
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

// REST API for getting product infor with sales API /shipping API
exports.get_cart_sales_shipping = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body && req.body.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Check session id 
    if (!(req && req.body && req.body.SessionID))
      return res.status(404).send({ message: constants.messages.sessionIdNotFound });

    // Check user id
    if (!(req && req.body && req.body.userData && req.body.userData.id))
      return res.status(404).send({ message: constants.messages.userNotFound });

    // Generate unique order number for order
    const orderNumber = orderid.generate();
    let checkout_data = req.body.checkout_data;
    //console.log(checkout_data);
      
    // pull data from multiple tables
    async.parallel([
      function (callback) {
        // pull cart product
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return callback(err);

          // Pull data from database   
          mc.query("SELECT * FROM view_store_cart WHERE  SessionID = '" + req.body.SessionID + "'", function (error, results, fields) {
            // connection release 
            mc.release();
            callback(error, results);
          });
        });
      }
    ], function (error, results) {
      if (error) return res.status(500).json({ error: error.toString() });

      results = JSON.parse(JSON.stringify(results));  // Json parse
      // check cart product length with user address
      if (results && results.length && results[0] && results[0].length) {
        let prData = results[0];
        let count = 0;
        let subTotal = 0;
        let lineSalesTax = [];
        let salesTax = {};
        // sum of product count
        _.map(prData, function (v) {
          // calculate discount/percentage
          v.Discount_Price = common.calculateDiscount(v);
          // Add total of product which added cart according to calculation mode
          if (v.DiscountType == "amount" || v.DiscountType == "percent") {
            subTotal += (v.Discount_Price * v.Product_Count);
          } else {
            subTotal += (v.Product_Price * v.Product_Count);
          }
          count += v.Product_Count;
          // check product taxable or not 
          if (v && String(v.Product_Taxable) == 'Yes') {
            // creating array for calculating sales tax 
            lineSalesTax.push({
              number: v.Product_ID,
              quantity: v.Product_Count,
              amount: (v.Product_Count * v.Product_Price),
              taxCode: v.Product_Code, // product tax code
              itemCode: v.Product_Code,
              description: v.Category_Name
            });
          }
          v.OrderNo = orderNumber;
          // remove kay from poduct array.
          delete v.Product_Description;
          return v;
        });

        // calling third party API
        async.parallel([
          function (callback) {
            // this section for sales tax API 
            if (lineSalesTax && lineSalesTax.length) {
              const taxDocument = {
                type: config.avataxRequest.type,
                companyCode: config.avataxRequest.companyCode,
                date: moment(new Date()).format("YYYY-MM-DD"),
                customerCode: config.avataxRequest.customerCode,
                purchaseOrderNo: orderNumber,
                addresses: {
                  SingleLocation: {
                    line1: (checkout_data.shipping_address1) ? checkout_data.shipping_address1 : '',
                    line2: (checkout_data && checkout_data.shipping_address2) ? checkout_data.shipping_address2 : '',
                    city: (checkout_data && checkout_data.shipping_city) ? checkout_data.shipping_city : '',
                    region: (checkout_data && checkout_data.shipping_state) ? checkout_data.shipping_state : '',
                    country: (checkout_data && checkout_data.shipping_country) ? checkout_data.shipping_country : '',
                    postalCode: (checkout_data && checkout_data.shipping_zip) ? checkout_data.shipping_zip : ''
                  }
                },
                lines: lineSalesTax,
                commit: config.avataxRequest.commit,
                currencyCode: config.avataxRequest.currencyCode,
                description: config.avataxRequest.description
              }
              //console.log(taxDocument);
              // set avatax config details
              const client = new Avatax(config.avataxConfig).withSecurity(config.avataxCreds);
              // calculat sale tax for product 
              client.createTransaction({ model: taxDocument })
                .then(function (result) {
                  return callback(null, result);
                },
                  function (error) {
                    return callback(error);
                  });
            } else {
              return callback(null, null)
            }
          },
          function (callback) {
            // this section for unishippers API
            async.mapLimit(prData, 1, function (pItem, cbk) {
              // check conditions (Paid/Discounted/Free). if free then not calling API
              if (pItem.Shipping == "Paid" || pItem.Shipping == "Discounted") {

                // this section for LTL unishippers shiiping 
                // check weight 
                if (config.ltl_unishippers.weight <= pItem.Packaging_Weight) {
                  // creating object method
                  let LTLUnishippersObj = common.LTLUnishippers(pItem, results,checkout_data);
                  // create xml for sending data in API
                  let xml = builder.create(LTLUnishippersObj).end({ pretty: true });
                  // calling request 
                  request.post({
                    url: config.ltl_unishippers.qa_url,
                    method: "POST",
                    headers: {
                      'Content-Type': 'application/xml',
                    },
                    body: xml
                  }, function (error, response, body) {
                    // check response status
                    if (response.statusCode == 200) {
                      // parse xml to json
                      let result = JSON.parse(parser.toJson(body));
                      result.Product_ID = pItem.Product_ID;
                      result.shipping_type = 'LTL';
                      return cbk(null, result);
                    } else {
                      // return error
                      return cbk(error);
                    }
                  });
                } else {
                  // this section for UPS unishippers shiiping 
                  // creating object method
                  let UPSUnishippersObj = common.UPSUnishippers(pItem, results, req,checkout_data);
                  // calling unishippers API for calculation shipping rate.
                  request.post({
                    url: 'http://nhdigital.co/Unishippers/PriceLink/ngshipping.php', json: UPSUnishippersObj
                  }, function (error, response, shipData) {
                    // set product id with shipping object
                    shipData.Product_ID = pItem.Product_ID;
                    shipData.shipping_type = 'UPS';
                    return cbk(error, shipData);
                  });
                }
              } else {
                return cbk(null, null);
              }
            }, callback);
          }
        ], function (err, apiResult) {
          if (err) return res.status(500).json({ err: err.toString() });

          // define total order amount 
          let totalOrderAmount = 0;
          // set shipping object
          let shippingObject = { discount: 0, total: 0, subAmount: 0 };
          apiResult = JSON.parse(JSON.stringify(apiResult));
          // Get sales tax from API and append with the product 
          _.map(prData, function (v) {
            let totalAmount = 0;
            // check sales tax array length
            if (apiResult && apiResult[0] && apiResult[0].lines && apiResult[0].lines.length) {
              // pulling product according product id from sales tax array
              let getPObject = _.find(apiResult[0].lines, { 'lineNumber': String(v.Product_ID) });
              if (getPObject) {
                v.salTax = {}; // creating new object 
                v.salTax.id = (getPObject.id) ? getPObject.id : '';
                v.salTax.transactionId = (getPObject.transactionId) ? getPObject.transactionId : '';
                v.salTax.lineNumber = (getPObject.lineNumber) ? getPObject.lineNumber : '';
                v.salTax.itemCode = (getPObject.itemCode) ? getPObject.itemCode : '';
                v.salTax.isItemTaxable = (getPObject.isItemTaxable) ? getPObject.isItemTaxable : '';
                v.salTax.lineAmount = (getPObject.lineAmount) ? parseFloat(getPObject.lineAmount.toFixed(2)) : 0;
                v.salTax.quantity = (getPObject.quantity) ? getPObject.quantity : '';
                v.salTax.reportingDate = (getPObject.reportingDate) ? getPObject.reportingDate : '';
                v.salTax.sourcing = (getPObject.sourcing) ? getPObject.sourcing : '';
                v.salTax.tax = (getPObject.tax) ? parseFloat(getPObject.tax.toFixed(2)) : 0;
                v.salTax.taxableAmount = (getPObject.taxableAmount) ? parseFloat(getPObject.taxableAmount.toFixed(2)) : 0;
                v.salTax.taxCalculated = (getPObject.taxCalculated) ? parseFloat(getPObject.taxCalculated.toFixed(2)) : 0;
                v.salTax.taxCode = (getPObject.taxCode) ? getPObject.taxCode : '';
                v.salTax.taxDate = (getPObject.taxDate) ? getPObject.taxDate : '';
                v.salTax.taxCodeId = (getPObject.taxCodeId) ? getPObject.taxCodeId : '';
                // sales tax amount 
                totalAmount += v.salTax.tax;
              }
            }
            // this sections for shipping 
            if (apiResult && apiResult[1] && apiResult[1].length) {

              // pulling product according product id from sales tax array
              let getShippingObject = _.find(apiResult[1], { 'Product_ID': v.Product_ID });
              //console.log(getShippingObject);
              // this calculation for UPS shipping
              if (getShippingObject && getShippingObject.shipping_type && getShippingObject.shipping_type == "UPS") {
                
                // check UPS shipping status
                if (getShippingObject && String(getShippingObject.status) == 'OK') {
                  // set shipping status
                  v.shippingStatus = true;
                  v.shippingType = 'UPS';
                  // set shipping rates value
                  if (getShippingObject.rates && getShippingObject.rates.rate && getShippingObject.rates.rate.length) {
                    //v.shippingRates = (getShippingObject.rates.rate && getShippingObject.rates.rate.length) ? getShippingObject.rates.rate : [];
                    // pulling lowest value
                    //console.log(getShippingObject.rates.rate);
                    v.shippingRates = _.minBy(getShippingObject.rates.rate, function (o) { if((o.total) && o.total >0){ return parseFloat(); }else return 0; });
                    // check if any rates available
                    if(v.shippingRates.total > 0){
                        // check discount of shipping
                        if (v && v.Shipping == "Discounted") {
                          let shippingAmount = parseFloat((parseFloat(v.shippingRates.total) - parseFloat(v.ShippingDiscount * v.Product_Count)).toFixed(2));
                          // set shipping finally value
                          v.shippingRates.totalShpping = (shippingAmount > 0) ? shippingAmount : 0;
                          // set shipping discount
                          v.shippingRates.ShippingDiscount = parseFloat(parseFloat(v.ShippingDiscount * v.Product_Count).toFixed(2));
                        } else {
                          // set shipping finally value
                          v.shippingRates.totalShpping = parseFloat(parseFloat(v.shippingRates.total).toFixed(2));
                          // set shipping discount
                          v.shippingRates.ShippingDiscount = 0;
                        }
                    }else{
                        v.shippingStatus = false;
                    }
                  }
                } else {
                  // set shipping status false 
                  v.shippingStatus = false;
                }

              } else if (getShippingObject && getShippingObject.shipping_type && getShippingObject.shipping_type == "LTL") {
                // this calculation for LTL shipping
                
                // check LTL shipping status if ture then calculate shipping
                if (getShippingObject.responses && getShippingObject.responses.success) {
                  // set shipping status
                  v.shippingStatus = true;
                  v.shippingType = 'LTL';

                  // set shipping rates value
                  if (getShippingObject.responses && getShippingObject.responses.response && getShippingObject.responses.response.key == "RateRequest" && getShippingObject.responses.response.success && getShippingObject.responses.response.RateResults && getShippingObject.responses.response.RateResults.PriceSheets && getShippingObject.responses.response.RateResults.PriceSheets.PriceSheet && getShippingObject.responses.response.RateResults.PriceSheets.PriceSheet.length) {
                    // pulling lowest value
                    v.shippingRates = _.minBy(getShippingObject.responses.response.RateResults.PriceSheets.PriceSheet, function (o) { return parseFloat(o.Total); });
                   // set varibale according to UPS shipping 
                    v.shippingRates.total = v.shippingRates.Total
 
                    // check discount of shipping
                    if (v && v.Shipping == "Discounted") {
                      let shippingAmount = parseFloat((parseFloat(v.shippingRates.total) - parseFloat(v.ShippingDiscount * v.Product_Count)).toFixed(2));
                      // set shipping finally value
                      v.shippingRates.totalShpping = (shippingAmount > 0) ? shippingAmount : 0;
                      // set shipping discount
                      v.shippingRates.ShippingDiscount = parseFloat(parseFloat(v.ShippingDiscount * v.Product_Count).toFixed(2));
                    } else {
                      // set shipping finally value
                      v.shippingRates.totalShpping = parseFloat(parseFloat(v.shippingRates.total).toFixed(2));
                      // set shipping discount
                      v.shippingRates.ShippingDiscount = 0;
                    }  
                  }
                } else {
                  // set shipping status false 
                  v.shippingStatus = false;
                }
              }
            }
            // get total amount with sales tax
            if (v.DiscountType == "amount" || v.DiscountType == "percent") {
              totalAmount += parseFloat((v.Discount_Price * v.Product_Count).toFixed(2));
            } else {
              totalAmount += parseFloat((v.Product_Price * v.Product_Count).toFixed(2));
            }
            // product total amount
            v.totalProductAmount = parseFloat((v.Product_Price * v.Product_Count).toFixed(2));


            // add shipping value in variable
            if (v && v.shippingStatus && v.shippingRates) {
              shippingObject.discount += parseFloat(parseFloat(v.shippingRates.ShippingDiscount).toFixed(2));;
              shippingObject.subAmount += parseFloat(parseFloat(v.shippingRates.totalShpping).toFixed(2));
              shippingObject.total += parseFloat(parseFloat(v.shippingRates.total).toFixed(2));

              // set shipping amount in total cart amount
              totalAmount += parseFloat(parseFloat(v.shippingRates.totalShpping).toFixed(2));
            }

            // set total amount with sales tax
            v.totalAmount = parseFloat(totalAmount.toFixed(2));

            // set total order amount
            totalOrderAmount += parseFloat(totalAmount.toFixed(2));
            return v;
          });

          // Get total sales tax 
          if (apiResult && apiResult[0]) {
            salesTax.totalTax = (apiResult[0].totalTax) ? parseFloat(apiResult[0].totalTax.toFixed(2)) : 0;
            salesTax.totalTaxCalculated = (apiResult[0].totalTaxCalculated) ? parseFloat(apiResult[0].totalTaxCalculated.toFixed(2)) : 0;
            salesTax.totalAmount = (apiResult[0].totalAmount) ? parseFloat(apiResult[0].totalAmount.toFixed(2)) : 0;
            salesTax.totalTaxable = (apiResult[0].totalTaxable) ? parseFloat(apiResult[0].totalTaxable.toFixed(2)) : 0;
            salesTax.id = (apiResult[0].id) ? apiResult[0].id : '';
            salesTax.code = (apiResult[0].code) ? apiResult[0].code : '';
            salesTax.date = (apiResult[0].date) ? apiResult[0].date : '';
            salesTax.companyId = (apiResult[0].companyId) ? apiResult[0].companyId : '';
            salesTax.purchaseOrderNo = (apiResult[0].purchaseOrderNo) ? apiResult[0].purchaseOrderNo : '';
            salesTax.type = (apiResult[0].type) ? apiResult[0].type : '';
            salesTax.currencyCode = (apiResult[0].currencyCode) ? apiResult[0].currencyCode : '';
            salesTax.customerCode = (apiResult[0].customerCode) ? apiResult[0].customerCode : '';
            salesTax.taxDate = (apiResult[0].taxDate) ? apiResult[0].taxDate : '';
          }
            
          // toFixed shipping object
          shippingObject.discount = parseFloat(parseFloat(shippingObject.discount).toFixed(2));;
          shippingObject.subAmount = parseFloat(parseFloat(shippingObject.subAmount).toFixed(2));
          shippingObject.total = parseFloat(parseFloat(shippingObject.total).toFixed(2));
          
          return res.send({ error: false, data: prData, productCount: count, subTotal: parseFloat(subTotal.toFixed(2)), salesTax: salesTax, shippingData: shippingObject, totalOrderAmount: parseFloat(totalOrderAmount.toFixed(2)), orderNumber: orderNumber });            
        });
      } else {
        return res.status(404).send({ message: constants.messages.notFound });
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// update member id for added product in cart
exports.update_add_to_product = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    if (!(req && req.body && req.body.SessionID))
      return res.status(404).send({ message: constants.messages.requiredData });

    if (!(req && req.body && req.body.MemberID))
      return res.status(404).send({ message: constants.messages.notFound });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      mc.query("select * from tbl_store_cart WHERE SessionID = '" + req.body.SessionID + "'", function (err, cData, fields) {
        // connection release 
        mc.release();
        // check error
        if (err) return res.status(500).json({ error: err.toString() });

        cData = JSON.parse(JSON.stringify(cData));  // Json parse
        if (cData) {
          // Add product in cart table 
          pool.getConnection(function (err, mc) {
            // check error
            if (err) return res.status(500).json({ error: err.toString() });

            // Pull data from database   
            mc.query("UPDATE tbl_store_cart SET MemberID = '" + req.body.MemberID + "' WHERE SessionID = '" + req.body.SessionID + "'", function (error, results, fields) {
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
        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// update cart api
exports.update_cart = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    if (!(req && req.body && req.body.SessionID))
      return res.status(404).send({ message: constants.messages.requiredData });
      
    let SessionID = req.body.SessionID;
    let CartProducts = req.body.CartProducts;
      
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      mc.query("select * from tbl_store_cart WHERE SessionID = '" + req.body.SessionID + "'", function (err, cData, fields) {
        // connection release 
        mc.release();
        // check error
        if (err) return res.status(500).json({ error: err.toString() });
        cData = JSON.parse(JSON.stringify(cData));  // Json parse
        if (cData) {
          // run loop of cart products
          async.mapLimit(CartProducts, 1, function (CartProduct, cbk) {
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return cbk(err);
              // run query  for update cart
                let query = "UPDATE tbl_store_cart SET Product_Count = '" + CartProduct.Quantity + "' WHERE SessionID = '" + req.body.SessionID + "' and Product_ID = '" + CartProduct.ProductID + "'";
                  //console.log(query);
                  pool.query(query, function (error, CartUpdate, fields) {
                    // connection release 
                    mc.release();
                    return cbk(error, CartUpdate);
                  });
                });
          }, function (error, results) {
            // check error
            if (error) return res.status(500).json({ error: error.toString() });
            return res.send({ error: false, data: results });
              
          });
        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// Apply Coupon
exports.apply_coupon = function (req, res) {
  try { 
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    if (!(req && req.body && req.body.CouponCode))
      return res.status(404).send({ message: constants.messages.requiredData });
      
    let SessionID = req.body.SessionID;
    let CouponCode = req.body.CouponCode;
    let cartProductList = req.body.cartProductList;
    let subTotal = req.body.subTotal;
      
    //console.log(subTotal);
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      let query = "SELECT * FROM tbl_store_discount_coupons WHERE CouponCode= '"+CouponCode+"'";
      mc.query(query, function (err, cData, fields) {
        // connection release 
        mc.release();
        // check error
        if (err) return res.status(500).json({ error: err.toString() });
        cData = JSON.parse(JSON.stringify(cData));  // Json parse
        if (cData && cData.length) {
            cData = cData[0];
            //console.log(cData);
            if(cData.CouponLimit > cData.UsedLimit && moment(new Date(cData.expiry_date)) >= moment(new Date()) ){
                
                let apply_ =  false;
                let Apply_on_products = 0;
                subTotal = 0;
                _.map(cartProductList, function (v) {
                    if (v.CID == cData.CID) {
                      apply_ =  true;
                      subTotal += v.totalProductAmount;
                      Apply_on_products = Apply_on_products+1;
                    }
                });
                if(apply_){
                    
                    let Discount_Price = 0;
                    if (cData.CouponDiscountType == "amount") {
                      Discount_Price = cData.CouponDiscount;
                    } else if (cData.CouponDiscountType == "percent") {
                      Discount_Price = ((subTotal * cData.CouponDiscount) / 100);
                    }
                    
                    Discount_Price = Discount_Price.toFixed(2);
                    CouponDiscountPerProduct = Discount_Price/Apply_on_products;
                    let CouponData = [];
                    CouponData.push({
                      COData: cData,
                      Apply_on_products:Apply_on_products,
                      Discount_Price: Discount_Price,
                      CouponDiscountPerProduct:CouponDiscountPerProduct.toFixed(2)
                    });
                    //console.log(CouponData);
                    return res.send({ error: false, data: CouponData });
                }else{
                    return res.status(500).json({ error: 'This Coupon Code not applied on products you buying.' });
                }
                
                
            }else{
                return res.status(500).json({ error: 'Invalid Coupon Code' });
            }
            
            
        } else {
          return res.status(500).json({ error: 'Invalid Coupon Code' });
        }
          
      });
        
    });
      
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// Apply Coupon
exports.remove_coupon = function (req, res) {
  try { 
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    if (!(req && req.body && req.body.CouponCode))
      return res.status(404).send({ message: constants.messages.requiredData });
      
    let SessionID = req.body.SessionID;
    let CouponCode = req.body.CouponCode;
    
    console.log(req.body);
    
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      let query = "SELECT * FROM tbl_store_discount_coupons WHERE CouponCode= '"+CouponCode+"'";
      mc.query(query, function (err, cData, fields) {
        // connection release 
        mc.release();
        // check error
        if (err) return res.status(500).json({ error: err.toString() });
        cData = JSON.parse(JSON.stringify(cData));  // Json parse
        if (cData) {
          console.log(cData);
          return res.send({ error: false, data: cData });
        } else {
          return res.status(500).json({ error: 'Invalid Coupon Code' });
        }
          
      });
        
    });
      
    
    
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

// update member id for added product in cart
exports.ltl_shipping = function (req, res) {

  try {
    // API URL
    // creating object for xml
    let QuoteRequest = {
      requests: {
        "@username": "U18857848311", "@password": "", "@id": "42", "@token": "28e8c450-eefc-11e6-a435-0050560903bc",
        request: {
          "@service": "QuoteRequest",
          QuoteRequest: {
            Header: {
              Action: {
                "#text": "Add"
              },
              Date: {
                "@type": "generation",
                "#text": "07/03/2019 13:34"
              }
            },
            Shipment: {
              Status: {
                "#text": "Pending"
              },
              Enterprise: {
                "@customerAcctNum": "CustomerAcctNumber", "@name": "Enterprise Name"
              },
              ReferenceNumbers: {
                ReferenceNumber: [{
                  "@type": "QuoteNumber",
                  "@isPrimary": true,
                  "#text": 1233453456
                }, {
                  "@type": "Franchise ID",
                  "@isPrimary": "false",
                  "#text": 36932868
                }, {
                  "@type": "PickupInstructions",
                  "@isPrimary": "false",
                  "#text": "Pickup"
                }, {
                  "@type": "QuoteNumber",
                  "@isPrimary": "false",
                  "#text": "Secondary Quote Number"
                }]
              },
              Comments: {
                Comment: {
                  "@type": "SpecialInstructions"
                }
              },
              ServiceFlags: {
                ServiceFlag: {
                  "@code": "LG2",
                  "#text": "Destination Liftgate Required"
                }
              },
              Dates: {
                Pickup: {
                  Date: [{
                    "@type": "earliest",
                    "#text": "07/03/2019 13:34"
                  }, {
                    "@type": "latest",
                    "#text": "07/03/2019 13:34"
                  }]
                },
                "Drop": {
                  Date: [{
                    "@type": "earliest",
                    "#text": "07/03/2019 13:34"
                  }, {
                    "@type": "latest",
                    "#text": "07/03/2019 13:34"
                  }]
                }
              },
              Shipper: {
                Address: {
                  "@isResidential": "false",
                  Alias: {

                  },
                  Name: {
                    "#text": "Some Company"
                  },
                  AddrLine1: {
                    "#text": "123 Any Street"
                  },
                  AddrLine2: {
                    "#text": "Suite 200"
                  },
                  City: {
                    "#text": "Salt Lake City"
                  },
                  StateProvince: {
                    "#text": "UT"
                  },
                  PostalCode: {
                    "#text": "84107"
                  },
                  CountryCode: {
                    "#text": "US"
                  },
                  Contacts: {
                    Contact: {
                      Name: {
                        "#text": "Tyler Pew"
                      },
                      ContactMethods: {
                        ContactMethod: [{
                          "@type": "phone",
                          "@sequenceNum": "1",
                          "#text": "800-123-0600"
                        },
                        {
                          "@type": "email",
                          "@sequenceNum": "2",
                          "#text": "someone@some_company.com"
                        }]
                      }
                    }
                  }
                }
              },
              Consignee: {
                Address: {
                  "@isResidential": "false",
                  Alias: {
                  },
                  Name: {
                    "#text": "San Jose House"
                  },
                  AddrLine1: {
                    "#text": "692 Dunraven Ct."
                  },
                  AddrLine2: {
                  },
                  City: {
                    "#text": "SAN JOSE"
                  },
                  StateProvince: {
                    "#text": "CA"
                  },
                  PostalCode: {
                    "#text": "95136"
                  },
                  CountryCode: {
                    "#text": "US"
                  },
                  Contacts: {
                    Contact: {
                      Name: {
                        "#text": "test"
                      },
                      ContactMethods: {
                        ContactMethod: [{
                          "@type": "phone",
                          "@sequenceNum": "1",
                          "#text": "1112223333"
                        }]
                      }
                    }
                  }
                }
              },
              HandlingUnits: {
                HandlingUnit: {
                  "@stackable": "true",
                  "@sequence": 1,
                  Quantity: {
                    "@units": "Pallet",
                    "#text": 1.0
                  },
                  Weight: {
                    "@units": "lb",
                    "#text": 3333.0
                  },
                  Dimensions: {
                    "@height": "0.0",
                    "@units": "in",
                    "@width": "0.0",
                    "@length": "0.0"
                  },
                  Items: {
                    Item: {
                      "@sequence": "1",
                      Description: {
                        "#text": "test"
                      },
                      FreightClass: {
                        "#text": 50.0
                      },
                      MinTemperature: {
                        "#text": 0.0
                      },
                      MaxTemperature: {
                        "#text": 0.0
                      },
                      TemperatureUnits: {
                        "#text": "F"
                      },
                      HazardousMaterial: {
                        "#text": false
                      },
                      Weights: {
                        Weight: {
                          "@units": "lbs",
                          "type": "planned",
                          "#text": 3333.0
                        }
                      },
                      Quantities: {
                        Quantity: {
                          "@type": "planned",
                          "#text": 0.0
                        }
                      },
                      MonetaryValue: {
                        "@units": "USD",
                        "#text": 0.0
                      }
                    }
                  }
                }
              },
              PriceSheets: {
                PriceSheet: {
                  "@isSelected": "true",
                  "@type": "Charge",
                  ContractId: {
                    "#text": "(6644580326,3023,0)"
                  }
                }
              },
              Payment: {
                Method: {
                  "#text": "Prepaid"
                },
                BillTo: {
                  "@thirdParty": "true",
                  Address: {
                    "@isResidential": "false",
                    Alias: {
                    },
                    Name: {
                      "#text": "Some Company"
                    },
                    AddrLine1: {
                      "#text": "PO Box 1234"
                    },
                    AddrLine2: {
                    },
                    City: {
                      "#text": "Kennewick"
                    },
                    StateProvince: {
                      "#text": "WA"
                    },
                    PostalCode: {
                      "#text": "99336"
                    },
                    CountryCode: {
                      "#text": "US"
                    },
                    Contacts: {
                      Contact: {
                        Name: {
                          "#text": "Contact Department"
                        },
                        ContactMethods: {
                          ContactMethod: [{
                            "@type": "phone",
                            "@sequenceNum": "1",
                            "#text": "509-123-4567"
                          }]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    // rate request
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
                "@stackable": "false",
                Quantity: {
                  "@units": "Pallet",
                  "#text": "1.0"
                },
                Weight: {
                  "@units": "lb",
                  "#text": 10.0
                },
                Dimensions: {
                  "@height": "12.0",
                  "@width": "12.0",
                  "@length": "12.0"
                },
                Items: {
                  Item: [{
                    "@freightClass": "85.0",
                    "@sequence": "1",
                    Weight: {
                      "@units": "lb",
                      "#text": "10.0"
                    },
                    Dimensions: {
                      "@height": "12.0",
                      "@units": "in",
                      "@width": "12.0",
                      "@length": "12.0",
                    },
                    Quantity: {
                      "@units": "Pallet",
                      "#text": "1.0"
                    }
                  }]
                }
              },
            },
            Events: {
              Event: [{
                "@date": "07/03/2019 17:04",
                "@type": "Pickup",
                "@sequence": "1",
                Location: {
                  City: {
                    "#text": "Salt Lake city"
                  },
                  State: {
                    "#text": "UT"
                  },
                  Zip: {
                    "#text": 84101
                  },
                  Country: {
                    "#text": "US"
                  }
                }
              }, {
                "@date": "07/03/2019 17:04",
                "@type": "Drop",
                "@sequence": "2",
                Location: {
                  City: {
                    "#text": "Salt Lake Cityy"
                  },
                  State: {
                    "#text": "UT"
                  },
                  Zip: {
                    "#text": 84101
                  },
                  Country: {
                    "#text": "US"
                  }
                }
              }]
            }
          }
        }
      }
    };
    // create xml 
    let xml = builder.create(rateRequest).end({ pretty: true });
    // calling request 
    request.post({
      url: config.ltl_unishippers.qa_url,
      method: "POST",
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xml
    },
      function (error, response, body) {
        // check response status
        if (response.statusCode == 200) {
          // xml to json
          let result = JSON.parse(JSON.stringify(parser.toJson(body)));
          console.log(result);
          return res.send({ data: result });
        }
      });

  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}


// REST API.
exports.review_order = function (req, res) {
    try {
        //console.log(req.body);
        
        let checkout_data = req.body;
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
            line1: user_data.shipping_address1,
            line2: user_data.shipping_address1,
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
                    function (callback) {
                        if (user_data.new_address == 'new') {
                                
                            let cols = ['CID', 'CustomerID', 'AddressType', 'First_Name', 'Last_Name', 'Email_Address', 'Address', 'Address2', 'Phone_Number', 'City', 'State', 'Country', 'ZipCode', 'AddedOn'];
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
                        }else{
                            return callback(null, null);
                        }
                    }
                ], function (err, response) {
                    if (err) return res.status(500).json({ error: err.toString() });

                    response = JSON.parse(JSON.stringify(response));  // Json parse
                    return res.send({ error: false, data: user_data });
                    
                });

            }, function (error) {
                return res.status(500).json({ error: error.toString() });
            });
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
}
