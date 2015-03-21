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

    //console.log(req.body); return;
    let CID = req.body.CID;
    let CustomerID = req.body.CustomerID;
    let cardToken = req.body.cardToken;
    let Currency = req.body.Currency;
    let CouponCodeApplied = req.body.CouponCodeApplied;
    let CouponApply_on = req.body.CouponApply_on;
    let CouponCode = req.body.CouponCode;
    let CouponDiscount = req.body.CouponDiscount;
    let CheckoutData = req.body.CheckoutData;
    let CustomerData = req.body.CustomerData;
    let productCount = req.body.productCount;
    let cartProductList = req.body.cartProductList;
    let OrderID = req.body.OrderID;
    let subTotal = req.body.subTotal;
    let Extra_Info = req.body.Extra_Info;
    let Payment_Discount = req.body.Payment_Discount;
    let Final_Amount = parseFloat(req.body.totalOrderAmount);
    //let Final_Amount = totalOrderAmount.toFixed(2);   
    let ShippingSubTotal = req.body.ShippingSubTotal;
    let ShippingDiscount = req.body.ShippingDiscount;
    let salesTax = req.body.salesTax;
    let totalTax = req.body.salesTax.totalTax;
    //let OrderID = req.body.salesTax.purchaseOrderNo;

    let Shipping_Method = req.body.Shipping_Method;
    let IP_ADDRESS = req.body.IP_ADDRESS;
    let Order_Date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

    let BillingFullName = CheckoutData.billing_first_name + ' ' + CheckoutData.billing_last_name;
    
    
      

    //console.log(salesTax);  
    /* Add Customer to Stripe
    ** and charge the order payment
    */
    const customer = stripe.customers.create({
      email: CheckoutData.billing_email,
      source: cardToken
    }).then(customer => {
      Payment_CustomerID = customer.id;
      stripe.charges.create({
        amount: parseFloat((Final_Amount * 100).toFixed(2)),
        currency: Currency,
        customer: Payment_CustomerID,
        source: cardToken,
        description: "Agfolks Order Payment : " + OrderID
      }, function (err, charge) {
        if (err) {
          return res.status(400).send({ message: err.message });

        } else {
          console.log('good to go');
          //console.log(charge);
          let Payment_ChargeID = charge.id;


          // Payment success now save the order in db
          // Manage multipl process
          async.waterfall([
            function (callback) {
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // save order details in order table
                let query = "INSERT INTO `tbl_store_orders` (`CID`, `MemberID`, `OrderID`, `Billing_Address`, `Billing_Address2`, `Billing_City`, `Billing_Country`, `Billing_Email`, `Billing_First_Name`, `Billing_Last_Name`, `Billing_Phone`, `Billing_State`, `Billing_Zip`, `Shipping_Address`, `Shipping_Address2`, `Shipping_City`, `Shipping_Country`, `Shipping_Email`, `Shipping_First_Name`, `Shipping_Last_Name`, `Shipping_Phone`, `Shipping_State`, `Shipping_Zip`, `Payment_Grandtotal`, `Order_Status`, `Payment_Shipping`,`Payment_Shipping_Discount`, `Payment_Subtotal`, `Payment_Tax`, `Order_Date`, `Payment_Discount`,`Coupon_Code`, `Coupon_Discount`, `Payment_Status`, `Shipping_Method`, `Payment_CustomerID`, `Payment_ChargeID`, `Payment_InvoiceID`,`Shipping_Type`,`Shipping_Pickup`,`Shipping_LoadingDock`,`Shipping_EqpUpload`,`Shipping_LiftGate`,`Shipping_CallAhead`,`Shipping_SemiTrucks`,`Extra_Info`) VALUES ('" + CID + "','" + CustomerID + "','" + OrderID + "','" + CheckoutData.billing_address1 + "','" + CheckoutData.billing_address2 + "','" + CheckoutData.billing_city + "','" + CheckoutData.billing_country + "','" + CheckoutData.billing_email + "','" + CheckoutData.billing_first_name + "','" + CheckoutData.billing_last_name + "','" + CheckoutData.billing_phone + "','" + CheckoutData.billing_state + "','" + CheckoutData.billing_zip + "','" + CheckoutData.shipping_address1 + "','" + CheckoutData.shipping_address2 + "','" + CheckoutData.shipping_city + "','" + CheckoutData.shipping_country + "','" + CheckoutData.shipping_email + "','" + CheckoutData.shipping_first_name + "','" + CheckoutData.shipping_last_name + "','" + CheckoutData.shipping_phone + "','" + CheckoutData.shipping_state + "','" + CheckoutData.shipping_zip + "','" + Final_Amount + "','1','" + ShippingSubTotal + "','" + ShippingDiscount + "','" + subTotal + "','" + totalTax + "','" + Order_Date + "','" + Payment_Discount + "','" + CouponCode + "','" + CouponDiscount + "','1','" + Shipping_Method + "','" + Payment_CustomerID + "','" + Payment_ChargeID + "','" + Payment_ChargeID + "', '" + CheckoutData.type + "', '" + CheckoutData.Pickup + "', '" + CheckoutData.LoadingDock + "', '" + CheckoutData.EqpUpload + "', '" + CheckoutData.LiftGate + "', '" + CheckoutData.CallAhead + "', '" + CheckoutData.SemiTrucks + "', '" + Extra_Info + "')";
                
                //console.log(query);
                  
                // run query  
                pool.query(query, function (error, StoreOrder, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, StoreOrder);
                });
              });
            },
            function (StoreOrder, callback) {
              StoreOrder = JSON.parse(JSON.stringify(StoreOrder));  // Json parse
              //console.log(StoreOrder);
              let tbl_store_order_id = StoreOrder.insertId

              // Payment success now save the order in db
              async.parallel([
                function (cbk) {
                  // save payment details in payments table
                  pool.getConnection(function (err, mc) {
                    // check error
                    if (err) return cbk(err);
                    // run query  
                    let query = "INSERT INTO `tbl_system_payments` (`CID`, `Payment_Date`, `Payment_Data_Table`, `Payment_Data_ID`, `Payment_Name`, `Payment_Last_Name`, `Payment_Address`, `Payment_Address2`, `Payment_Email`, `Payment_Phone`, `Payment_City`, `Payment_Zip`, `Payment_State`, `Payment_Country`, `Payment_CCNumber`, `Payment_CVV2`, `Payment_CC_ExpMonth`, `Payment_CC_ExpYear`, `Payment_CC_Name`, `Payment_Tax`, `Payment_Total`, `Total_Fee`, `Fee_Included`, `Billing_Name`, `Billing_Last_Name`, `Billing_Address`, `Billing_Address2`, `Billing_Zip`, `Billing_City`, `Billing_State`, `Billing_Country`, `Billing_Email`, `Billing_Phone`, `Payment_Description`,  `Payment_TransactionID`, `Payment_ChargeID`, `Payment_CustomerID`, `Payment_InvoiceID`, `Payment_Fee_Percentage`, `Payment_IPAddress`, `Payment_Currency`, `Receipt_Sent_Status`, `Payment_Gateway`,`Payment_PlanID`) VALUES ('" + CID + "', '" + Order_Date + "','tbl_store_orders', '" + tbl_store_order_id + "', '" + CheckoutData.billing_first_name + "', '" + CheckoutData.billing_last_name + "', '" + CheckoutData.billing_address1 + "', '" + CheckoutData.billing_address2 + "', '" + CheckoutData.billing_email + "', '" + CheckoutData.billing_phone + "', '" + CheckoutData.billing_city + "', '" + CheckoutData.billing_zip + "', '" + CheckoutData.billing_state + "', '" + CheckoutData.billing_country + "', '', '', '', '', '" + BillingFullName + "', '" + totalTax + "', '" + Final_Amount + "', '0.00', '0','" + CheckoutData.billing_first_name + "', '" + CheckoutData.billing_last_name + "', '" + CheckoutData.billing_address1 + "', '" + CheckoutData.billing_address2 + "', '" + CheckoutData.billing_zip + "', '" + CheckoutData.billing_city + "', '" + CheckoutData.billing_state + "', '" + CheckoutData.billing_country + "', '" + CheckoutData.billing_email + "', '" + CheckoutData.billing_phone + "','Agfolks Store Order Payment', '" + Payment_ChargeID + "', '" + Payment_ChargeID + "', '" + Payment_CustomerID + "', '" + Payment_ChargeID + "', '" + config.AGF_FEE_PERCENTAGE + "', '" + IP_ADDRESS + "', '" + Currency + "', '1', 'stripe','')";

                    //console.log('payment query : '+query);
                    pool.query(query, function (error, StoreOrderCB, fields) {
                      // connection release 
                      mc.release();
                      return cbk(error, StoreOrderCB);
                    });
                  });
                },
                function (cbk) {
                  // Pulling product documents
                  async.mapLimit(cartProductList, 1, function (pData, cbkk) {
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbkk(err);
                      // run query  
                      //console.log(pData);
                      let salTaxid = (pData.Product_Taxable == 'Yes' && pData.salTax.id) ? pData.salTax.id : '';
                      let salTaxtax = (pData.Product_Taxable == 'Yes' && pData.salTax.tax) ? pData.salTax.tax : '0.00';
                      let taxableAmount = (pData.Product_Taxable == 'Yes' && pData.salTax.taxableAmount) ? pData.salTax.taxableAmount : '0.00';
                      let taxCalculated = (pData.Product_Taxable == 'Yes' && pData.salTax.taxCalculated) ? pData.salTax.taxCalculated : '0.00';
                      let transactionId = (pData.Product_Taxable == 'Yes' && pData.salTax.transactionId) ? pData.salTax.transactionId : '';
                        
                      let shippingType = (pData.shippingStatus == true && (pData.shippingRates) && pData.shippingType) ? pData.shippingType : '';
                        
                      let ShipDate = (pData.shippingStatus == true && (pData.shippingRates) && pData.shippingRates.shipdate) ? pData.shippingRates.shipdate : '';
                      let ShippingFee = (pData.shippingStatus == true && (pData.shippingRates) && pData.shippingRates.total) ? pData.shippingRates.total : '0.00';
                      
                      let ShippingDiscount = (pData.shippingStatus == true && (pData.shippingRates) && pData.shippingRates.ShippingDiscount) ? pData.shippingRates.ShippingDiscount : '';
                        
                      let shippingRates = (pData.shippingStatus == true && (pData.shippingRates) && pData.shippingRates) ? JSON.stringify(pData.shippingRates) : '';
                    
                      let CouponDiscountPerProduct = '0.00';
                      if(CouponCodeApplied){
                          let CouponCodeData = req.body.CouponCodeData;
                          if (pData.CID == CouponCodeData.CID) {
                              CouponDiscountPerProduct = req.body.CouponDiscountPerProduct;
                          }
                      }
                      let Total_Discount = '0.00';
                      if(pData.Discount_Price){
                          Total_Discount = (pData.Product_Price * pData.Product_Count)-(pData.Discount_Price * pData.Product_Count);
                          Total_Discount = Total_Discount.toFixed(2);
                      }
                        
                      let query = "INSERT INTO `tbl_store_order_products` ( `CID`,`VID`, `MemberID`, `OrderID`, `Order_Date`, `Product_ID`, `Product_Count`, `Product_Price`, `Product_Currency`, `Discount`, `DiscountType`, `Discount_Price`,`Total_Discount`,`CouponCode`, `CouponDiscount`, `Product_Taxable`, `TotalAmount`, `SalTaxID`, `Tax`, `TaxableAmount`, `taxCalculated`, `SaleTaxTransId`,  `ShipDate`, `ShippingFee`, `ShippingDiscount`,`ShippingType`,`ShippingData`) VALUES ( '" + CID + "', '" + pData.VID + "', '" + CustomerID + "', '" + tbl_store_order_id + "', '" + Order_Date + "', '" + pData.Product_ID + "', '" + pData.Product_Count + "', '" + pData.Product_Price + "','" + pData.Product_Currency + "','" + pData.Discount + "', '" + pData.DiscountType + "','" + pData.Discount_Price + "','" + Total_Discount + "','" + CouponCode + "','" + CouponDiscountPerProduct + "','" + pData.Product_Taxable + "','" + pData.totalAmount + "','" + salTaxid + "','" + salTaxtax + "','" + taxableAmount + "','" + taxCalculated + "','" + transactionId + "','" + ShipDate + "','" + ShippingFee + "','" + ShippingDiscount + "','" + shippingType + "','" + shippingRates + "')";
                      //console.log(query);
                      pool.query(query, function (error, StoreOrderCB, fields) {
                        // connection release 
                        mc.release();
                        return cbkk(error, StoreOrderCB);
                      });
                    });
                  }, function (err, reInData) {
                    return cbk(err, reInData);
                  });
                }
              ], callback);
            }
          ], function (error, results) {
            // check error
            if (error) return res.status(500).json({ error: error.toString() });
            
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return res.status(500).json({ error: err.toString() });
              // Delete cart item from database   
              mc.query("DELETE FROM tbl_store_cart WHERE MemberID = " + CustomerID, function (error, dresults, fields) {
                // connection release 
                mc.release();
                // check error
                if (error) return res.status(500).json({ error: error.toString() });

                return res.send({ error: false, data: results });
              });
            });
           
          })
        }
      });

    });

  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
