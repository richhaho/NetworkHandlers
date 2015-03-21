const constants = require('../../config/constants');
const config = require('../../config/config');
const common = require('../common');
const moment = require('moment');
const _ = require('lodash');
const async = require("async");
var stripe = require("stripe")(config.Strp_Sec_key);

// REST API for featured product
exports.make_payment = function (req, res) {
  try {
    
      
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.body.CID && req.body.CID))
      return res.status(404).send({ message: constants.messages.cidNotFound });
    
    if (!(req && req.body && req.body.CID && req.body.CustomerID && req.body.cardToken && req.body.Currency))
      return res.status(404).send({ message: constants.messages.requiredData });
    
    
    let CID = req.body.CID;
    let CustomerID = req.body.CustomerID;
    let cardToken = req.body.cardToken;
    let Currency = req.body.Currency;
    let CouponCode = req.body.CouponCode;
    let CouponDiscount = req.body.CouponDiscount;
    
    let CustomerData = req.body.CustomerData;
    let BillingAddress = req.body.BillingAddress;
    let ShippingAddress = req.body.ShippingAddress;
    let productCount = req.body.productCount;
    let cartProductList = req.body.cartProductList;
    let subTotal = req.body.subTotal;
    let totalOrderAmount = req.body.totalOrderAmount;
    let Final_Amount = totalOrderAmount.toFixed(2);   
    let Total_Shipping = req.body.Total_Shipping;
    let salesTax = req.body.salesTax;
    let totalTax = req.body.salesTax.totalTax;
    let OrderID = req.body.salesTax.purchaseOrderNo;
      
    let Shipping_Method =  req.body.Shipping_Method; 
    let Order_Date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      
    //console.log(salesTax);  
    /* Add Customer to Stripe
    ** and charge the order payment
    */
    const customer = stripe.customers.create({
        email: req.body.BillingAddress.Email_Address,
        source: cardToken
    }).then(customer => {
        Payment_CustomerID = customer.id; 
        stripe.charges.create({
            amount: Final_Amount*100,
            currency: Currency,
            customer: Payment_CustomerID,
            source: cardToken,
            description: "Agfolks Order Payment : " + OrderID
        }, function(err, charge) {
            if(err) {
                console.log(err); 
                return res.status(400).send({ message: err.message });
                
            } else {
                console.log('good to go');
                //console.log(charge);
                let Payment_ChargeID = charge.id;
                
                // Payment success now save the order in db
                async.parallel([
                    function (callback) {
                      // Pulling product image
                      pool.getConnection(function (err, mc) {
                        // check error
                        if (err) return callback(err);
                        // run query  
                        let query = "INSERT INTO `tbl_store_orders` (`CID`, `MemberID`, `OrderID`, `Billing_Address`, `Billing_Address2`, `Billing_City`, `Billing_Country`, `Billing_Email`, `Billing_First_Name`, `Billing_Last_Name`, `Billing_Phone`, `Billing_State`, `Billing_Zip`, `Shipping_Address`, `Shipping_Address2`, `Shipping_City`, `Shipping_Country`, `Shipping_Email`, `Shipping_First_Name`, `Shipping_Last_Name`, `Shipping_Phone`, `Shipping_State`, `Shipping_Zip`, `Payment_Grandtotal`, `Order_Status`, `Payment_Shipping`, `Payment_Subtotal`, `Payment_Tax`, `Order_Date`, `Coupon_Code`, `Coupon_Discount`, `Payment_Status`, `Shipping_Method`, `Payment_CustomerID`, `Payment_ChargeID`, `Payment_InvoiceID`) VALUES ('"+CID+"','"+CustomerID+"','"+OrderID+"','"+BillingAddress.Address+"','"+BillingAddress.Address2+"','"+BillingAddress.City+"','"+BillingAddress.Country+"','"+BillingAddress.Email_Address+"','"+BillingAddress.First_Name+"','"+BillingAddress.Last_Name+"','"+BillingAddress.Phone_Number+"','"+BillingAddress.State+"','"+BillingAddress.ZipCode+"','"+ShippingAddress.Address+"','"+ShippingAddress.Address2+"','"+ShippingAddress.City+"','"+ShippingAddress.Country+"','"+ShippingAddress.Email_Address+"','"+ShippingAddress.First_Name+"','"+ShippingAddress.Last_Name+"','"+ShippingAddress.Phone_Number+"','"+ShippingAddress.State+"','"+ShippingAddress.ZipCode+"','"+Final_Amount+"','1','"+Total_Shipping+"','"+subTotal+"','"+totalTax+"','"+Order_Date+"','"+CouponCode+"','"+CouponDiscount+"','1','"+Shipping_Method+"','"+Payment_CustomerID+"','"+Payment_ChargeID+"','"+Payment_ChargeID+"')";
                        console.log(query);
                        pool.query(query, function (error, cmsPage, fields) {
                          // connection release 
                          mc.release();
                          return callback(error, cmsPage);
                        });
                      });
                    },
                    function (callback) {
                      // Pulling product documents
                      pool.getConnection(function (err, mc) {
                        // check error
                        if (err) return callback(err);
                        // run query  
                        let query = "INSERT INTO `tbl_system_payments` (`CID`, `Payment_Date`, `Payment_Data_Table`, `Payment_Data_ID`, `Payment_Name`, `Payment_Last_Name`, `Payment_Address`, `Payment_Address2`, `Payment_Email`, `Payment_Phone`, `Payment_City`, `Payment_Zip`, `Payment_State`, `Payment_Country`, `Payment_CCNumber`, `Payment_CVV2`, `Payment_CC_ExpMonth`, `Payment_CC_ExpYear`, `Payment_CC_Name`, `Payment_Tax`, `Payment_Total`, `Total_Fee`, `Fee_Included`, `Billing_Name`, `Billing_Last_Name`, `Billing_Address`, `Billing_Address2`, `Billing_Zip`, `Billing_City`, `Billing_State`, `Billing_Country`, `Billing_Email`, `Billing_Phone`, `Payment_Description`, `Payment_PONumber`, `Payment_PaymentNum`, `Payment_TransactionID`, `Payment_ChargeID`, `Payment_CustomerID`, `Payment_PlanID`, `Payment_SubscriptionID`, `transfer_amount`, `Payment_Recurring_Result`, `Payment_Recurring_Result_Desc`, `Payment_InvoiceID`, `Payment_RefundID`, `Payment_Fee_Percentage`, `Stripe_Fees`, `Admin_Fees`, `Payment_transferID`, `Payment_GLCode`, `Payment_IPAddress`, `Payment_Total_Occurrences`, `Payment_Recurring_Length`, `Payment_Recurring_Unit`, `Payment_Currency`, `Payment_IsTest`, `Payment_IsRefunded`, `Payment_Refund_Date`, `Payment_Refund_Description`, `Payment_Referred_By`, `Receipt_No`, `Receipt_Sent_Status`, `Payment_Gateway`) VALUES ('"+CID+"', '"+CID+"','"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '0','"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"','"+CID+"','"+CID+"', '"+CID+"', '', '', '', '', '"+CID+"', '','"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '"+CID+"', '', '', '', '"+CID+"', '"+CID+"', '9999', '1', 'month', 'USD', '0', '0', '', '', NULL, NULL, '1', 'stripe');";
                        pool.query(query, function (error, cmsPage, fields) {
                          // connection release 
                          mc.release();
                          return callback(error, cmsPage);
                        });
                      });
                    }
                    ], function (err, pdata) {
                    if (err) return res.status(500).json({ error: err.toString() });
                    
                    console.log(pdata);
                    
                    // Json parse
                    pdata = JSON.parse(JSON.stringify(pdata));
                    if (pdata && pdata.length) {
                      // Set images for product slider 
                      //results.slider = (pdata[0] && pdata[0].length) ? pdata[0] : [];
                      // Set images for product documents
                      //results.documents = (pdata[1] && pdata[1].length) ? pdata[1] : [];
                      // Set images for product attributes
                      
                    }

                    return res.send({ error: false, data: pdata });
                });
                return res.send({ error: false, data: charge });

            }
        });
        
    });
      
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
