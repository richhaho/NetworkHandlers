const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const decode = require('decode-html');
const async = require("async");

// REST API for featured product
exports.get_store_list = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // set product limit
    let filterLimit = '';
    if (req && req.query && req.query.limit)
      filterLimit = 'limit ' + req.query.limit;

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      mc.query("SELECT * FROM view_store_products WHERE  Type='1' AND Product_Featured='yes' AND Product_Status = 1  ORDER BY Product_AddedOn  DESC " + filterLimit + "", function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse

          // decode html 
          if (results && results.length) {
            _.map(results, function (v) {
              if (v.Product_Description != null && v.Product_Description != '') { v.Product_Description = decode(v.Product_Description); }
              if (v.Product_Short_Description != null && v.Product_Short_Description != '') { v.Product_Short_Description = decode(v.Product_Short_Description); }
              // calculate discount
              v.Discount_Price = common.calculateDiscount(v);
              return v;
            })
          }
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

// REST API for product(store) list.
exports.get_products_list = function (req, res) {
  try {
    let getCountQuery;
    let getProductsListQuery;
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // set product limit
    let filterLimit = '';
    let offSet = 1;
    if (req && req.query && req.query.limit) {
      offSet = (req.query.page - 1) * req.query.limit;
      filterLimit = 'limit ' + offSet + ', ' + req.query.limit;
    }

    // this parallel for search filters
    async.parallel([
      function (callback) {
        // check category slug
        if (req && req.query && req.query.categorySlug && req.query.categorySlug) {
          pool.getConnection(function (err, mc) {
            // check error
            if (err) return callback(err);
            // query
            query = "SELECT cat.ID, cat.Category_Name, cat.Category_Slug  FROM tbl_store_categories as cat WHERE Category_Slug = '" + req.query.categorySlug + "'";
            pool.query(query, function (error, results, fields) {
              // connection release 
              mc.release();
              // return response
              return callback(error, results);
            });
          });
        } else {
          return callback(null, null);
        }
      },
      function (callback) {
        // check filter type list
        if (req && req.query && req.query.type && req.query.type.length) {
          async.mapLimit(req.query.type, 1, function (item, cbk) {
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return cbk(err);
              // query
              let query = "SELECT ID,Product_ID FROM tbl_store_product_attributes where Attribute_ID='" + item.ID + "' and Attribute_Name='" + item.Field_Name + "' and Attribute_Value='" + item.Options + "'";
              pool.query(query, function (error, results, fields) {
                // connection release 
                mc.release();
                // return response
                return cbk(error, results)
              });
            });
          }, callback);
        } else {
          return callback(null, null);
        }
      }
    ], function (err, ftResult) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      // Json parse
      ftResult = JSON.parse(JSON.stringify(ftResult));

      // this section   
      let searchCondQuery = '';
      // for category ids
      if (ftResult && ftResult.length && ftResult[0] && ftResult[0].length && ftResult[0][0] && ftResult[0][0].ID) {
        searchCondQuery += " AND CategoryID=" + ftResult[0][0].ID;
      }

      // for type filter
      if (ftResult && ftResult.length && ftResult[1] && ftResult[1].length) {
        let pIds = [];
        // get product ids
        _.map(ftResult[1], function (o) {
          if (o) {
            _.map(o, function (k) {
              // push ids
              pIds.push(k.Product_ID);
            });
          }
        });
        // set query
        searchCondQuery += " AND ID IN (" + pIds.join(',') + ")";
      }

      // for manufacturer filter
      if (req && req.query && req.query.manufacturer && req.query.manufacturer.length) {
        let mIds = [];
        // get manufacturer ids
        _.map(req.query.manufacturer, function (o) {
          if (o) {
            mIds.push(o);
          }
        });
        // set query
        searchCondQuery += " AND CID IN (" + mIds.join(',') + ")";
      }
      // this secton for product price 
      if (req && req.query && req.query.price && req.query.price.minValue && req.query.price.maxValue) {
        searchCondQuery += " AND Product_Price BETWEEN " + req.query.price.minValue + " AND " + req.query.price.maxValue;
      }
      // search filter ASC/DESC
      let ShFilters = '';
      let condFeatured = ''
      if (req && req.query && req.query.sorting) {
        // 1 for Featured
        if (req.query.sorting == 1) {
          searchCondQuery += " AND Product_Featured='yes'";
          condFeatured += " AND Product_Featured='yes'";
        } else if (req.query.sorting == 2) {
          // 2 for Best Selling

        } else if (req.query.sorting == 3) {
          // 3 for  Name, A - Z
          ShFilters = " ORDER BY Product_Name ASC";
        }
        else if (req.query.sorting == 4) {
          // 4 for Name, Z - A
          ShFilters = " ORDER BY Product_Name DESC";
        }
        else if (req.query.sorting == 5) {
          // 5 for Price, low to high
          ShFilters = " ORDER BY Product_Price ASC";
        }
        else if (req.query.sorting == 6) {
          // 6 for Price, high to low
          ShFilters = " ORDER BY Product_Price DESC";
        }
        else if (req.query.sorting == 7) {
          // 7 for Date, new to old
          ShFilters = " ORDER BY Product_AddedOn DESC";
        }
        else if (req.query.sorting == 8) {
          // 8 for Date, old to new
          ShFilters = " ORDER BY Product_AddedOn ASC";
        }
      }

      // receiver any search conditions
      if (searchCondQuery) {
        // making query according to seach conditions
        getCountQuery = "SELECT count(*) as total FROM view_store_products WHERE  Type='1' AND Product_Status = 1" + searchCondQuery;
        getProductsListQuery = "SELECT * FROM view_store_products WHERE Type='1' AND Product_Status = 1" + searchCondQuery + ShFilters+ " " + filterLimit;
      } else {
        // default query 
        getCountQuery = "SELECT count(*) as total FROM view_store_products WHERE  Type='1' AND Product_Status = 1" + condFeatured;
        getProductsListQuery = "SELECT * FROM view_store_products WHERE  Type='1' AND Product_Status = 1" + condFeatured + ShFilters+ " " + filterLimit + ""

      }
      
      async.parallel([
        function (callback) {
          pool.getConnection(function (err, mc) {
            // check error
            if (err) return callback(err);
            // return product count
            mc.query(getCountQuery, function (error, count, fields) {
              // connection release
              mc.release();
              return callback(error, count)
            });
          });
        },
        function (callback) {
          pool.getConnection(function (err, mc) {
            // check error
            if (err) return callback(err);
            // return product list
            mc.query(getProductsListQuery, function (error, recored, fields) {
              // connection release
              mc.release();
              return callback(error, recored)
            });
          });
        },
      ], function (error, results) {
        if (error) return res.status(500).json({ error: error.toString() });
        results = JSON.parse(JSON.stringify(results));  // Json parse
        if (results && results.length) {
          // Get product count
          let total = (results[0] && results[0][0] && results[0][0].total) ? results[0][0].total : 0;

          // decode product list
          let recored = [];
          if (results[1] && results[1].length) {
            recored = _.map(results[1], function (v) {
              if (v.Product_Description != null && v.Product_Description != '') {
                v.Product_Description = decode(v.Product_Description);
              }
              if (v.Product_Short_Description != null && v.Product_Short_Description != '') {
                v.Product_Short_Description = decode(v.Product_Short_Description);
              }
              // calculate discount
              v.Discount_Price = common.calculateDiscount(v)
              return v;
            })
          }
          return res.send({ error: false, total: total, data: recored });
        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });

    });

  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}



// REST API for poduct details 
exports.get_product_details = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Check product slug 
    if (!(req && req.query && req.query.Product_Slug))
      return res.status(404).send({ message: constants.messages.productSlugNotFound });

    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      // Pull data from database   
      mc.query("SELECT * FROM view_store_products WHERE  Product_Status = 1 AND Product_Slug='" + req.query.Product_Slug + "'", function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        // Json parse
        results = JSON.parse(JSON.stringify(results));
        if (results && results.length) {
          // decode html 
          _.map(results, function (v) {
            if (v.Product_Description != null && v.Product_Description != '') { v.Product_Description = decode(v.Product_Description); }
            if (v.Product_Short_Description != null && v.Product_Short_Description != '') { v.Product_Short_Description = decode(v.Product_Short_Description); }
            if (v.Specifications != null && v.Specifications != '') { v.Specifications = decode(v.Specifications); }
            if (v.Warranty != null && v.Warranty != '') { v.Warranty = decode(v.Warranty); }
            if (v.Accessories != null && v.Accessories != '') { v.Accessories = decode(v.Accessories); }
            // calculate discount
            v.Discount_Price = common.calculateDiscount(v);
            return v;
          })
          // set product object 
          results = results[0];

          // Pulling data from multiple tables
          async.parallel([
            function (callback) {
              // Pulling product image
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT * FROM tbl_store_product_images WHERE  Product_ID = ' + results.ID + ' ORDER BY ordering ASC', function (error, cmsPage, fields) {
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
                pool.query('SELECT * FROM tbl_store_product_documents WHERE  Product_ID = ' + results.ID + ' ORDER BY ordering ASC', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
            function (callback) {
              // Pulling product attributes 
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT * FROM view_store_product_attributes WHERE  Product_ID = ' + results.ID + '', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
            function (callback) {
              // Pulling next product data
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT ID, Product_Name, Product_Slug, Product_Price, Image, Product_Image FROM view_store_products WHERE  Type="1" AND ID > ' + results.ID + ' ORDER BY ID LIMIT 1', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
            function (callback) {
              // Pulling sub product data
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT ID, Product_Name, Product_Slug, Product_Price, Image, Product_Image FROM view_store_products WHERE Type="1" AND  Parent_Product_ID = ' + results.Parent_Product_ID + '', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
            function (callback) {
              // Pulling product attributes 
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT sta.Accessory_ID,vsp.ID,vsp.CID,vsp.Product_Name,vsp.Product_Code,vsp.Product_Model_Number, vsp.Product_Slug,vsp.Product_Short_Description, vsp.Product_Price,vsp.Image_type, vsp.Image, vsp.Product_Image,vsp.Product_Stock FROM tbl_store_product_accessories sta left join view_store_products vsp on(vsp.ID=sta.Accessory_ID) WHERE  sta.Product_ID = ' + results.ID + '', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
            function (callback) {
              // Pulling product attributes 
              pool.getConnection(function (err, mc) {
                // check error
                if (err) return callback(err);
                // run query  
                pool.query('SELECT sta.Part_ID,vsp.ID,vsp.CID,vsp.Product_Name,vsp.Product_Code,vsp.Product_Model_Number, vsp.Product_Slug,vsp.Product_Short_Description, vsp.Product_Price, vsp.Image_type,vsp.Image, vsp.Product_Image,vsp.Product_Stock FROM tbl_store_product_parts sta left join view_store_products vsp on(vsp.ID=sta.Part_ID) WHERE  sta.Product_ID = ' + results.ID + '', function (error, cmsPage, fields) {
                  // connection release 
                  mc.release();
                  return callback(error, cmsPage);
                });
              });
            },
          ], function (err, pdata) {
            if (err) return res.status(500).json({ error: err.toString() });

            // Json parse
            pdata = JSON.parse(JSON.stringify(pdata));
            if (pdata && pdata.length) {
              // Set images for product slider 
              results.slider = (pdata[0] && pdata[0].length) ? pdata[0] : [];
              // Set images for product documents
              results.documents = (pdata[1] && pdata[1].length) ? pdata[1] : [];
              // Set images for product attributes
              results.attributes = (pdata[2] && pdata[2].length) ? pdata[2] : [];
              // Set images for next product
              results.nextProduct = (pdata[3] && pdata[3].length) ? pdata[3] : [];
              // Set images for sub product
              results.subProduct = (pdata[4] && pdata[4].length) ? pdata[4] : [];
              // Set product Accessories
              results.Product_Accessories = (pdata[5] && pdata[5].length) ? pdata[5] : [];
              // Set product parts
              results.Product_Parts = (pdata[6] && pdata[6].length) ? pdata[6] : [];
            }

            return res.send({ error: false, data: results });
          });
        } else {
          return res.status(404).send({ message: constants.messages.productNotFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }

}

// REST API for autocomplete product search using the categoryId and name
exports.search_products = function (req, res) {
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
      let categoryId = req.query.categoryId;
      let productName = req.query.name;
      let query;
      // query
      if (categoryId > -1) { // one category is selected
        query = "SELECT * FROM view_store_products WHERE  Type='1' AND CategoryID = " + categoryId +
          " AND Product_Name LIKE '%" + productName + "%' AND Product_Status = 1";
      } else { // All
        query = "SELECT * FROM view_store_products WHERE  Type='1' AND Product_Name LIKE '%" + productName + "%' AND Product_Status = 1";
      }
      // Pull data from database
      mc.query(query, function (error, results, fields) {
        // connection release
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse

          // decode html
          if (results && results.length) {
            _.map(results, function (v) {
              if (v.Product_Description != null && v.Product_Description != '') { v.Product_Description = decode(v.Product_Description); }
              if (v.Product_Short_Description != null && v.Product_Short_Description != '') { v.Product_Short_Description = decode(v.Product_Short_Description); }
              // calculate discount
              v.Discount_Price = common.calculateDiscount(v);
              return v;
            })
          }
          return res.send({ error: false, total: results.length, data: results });

        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}


// REST API for get store attributes
exports.get_store_attributes = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    async.parallel([
      function (callback) {
        // pulling product attributes
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return callback(err);
          // query
          let query = "SELECT * FROM tbl_store_attributes";
          mc.query(query, function (error, attResult, fields) {
            // connection release
            mc.release();
            // check error
            if (err) return callback(error);
            attResult = JSON.parse(JSON.stringify(attResult)); // parse object
            // check length
            if (attResult && attResult.length) {
              // create options array
              _.map(attResult, function (v) {
                if (v.Options) {
                  v.Options = v.Options.split(',');
                }
                return v;
              });
              // run loop man array
              async.mapLimit(attResult, 1, function (item, cbk) {
                // check length
                if (item.Options && item.Options.length) {
                  // run loop options array
                  async.mapLimit(item.Options, 1, function (itemOpt, cbkk) {
                    pool.getConnection(function (err, mc) {
                      // check error
                      if (err) return cbkk(err);
                      // query
                      let query = "SELECT COUNT(Product_ID) AS total FROM tbl_store_product_attributes where Attribute_ID='" + item.ID + "' and  Attribute_Name='" + item.Field_Name + "' and  Attribute_Value='" + itemOpt + "'";
                      mc.query(query, function (error, attResult, fields) {
                        // connection release
                        mc.release();
                        // json parse 
                        attResult = JSON.parse(JSON.stringify(attResult));
                        // create new object
                        let dataId = itemOpt.replace(/&/g, '_');
                        let dataObj = {
                          ID: item.ID,
                          Field_Name: item.Field_Name,
                          Options: itemOpt,
                          dataId: dataId.replace(/ /g,'_'),
                          Total: (attResult && attResult.length) ? attResult[0].total : 0
                        };
                        return cbkk(error, dataObj);
                      });
                    });
                  }, function (err, fResult) {
                    if (err) return cbk(err);
                    // json parse 
                    fResult = JSON.parse(JSON.stringify(fResult));
                    //set data in parent object
                    item.data = (fResult && fResult.length) ? fResult : [];
                    return cbk(err, item);
                  });
                } else {
                  return cbk(null, item);
                }
              }, function (err, fResult) {
                return callback(err, fResult);
              });
            } else {
              return callback({ message: constants.messages.attributesNotFound });
            }
          });
        });
      },
      function (callback) {
        // pulling product min/max price
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return callback(err);
          // query
          let query = "SELECT min(Product_Price) as min_price, max(Product_Price) as max_price FROM tbl_store_products where Product_Status=1";
          mc.query(query, function (error, attResult, fields) {
            // connection release
            mc.release();
            // parse object
            attResult = JSON.parse(JSON.stringify(attResult)); // parse object
            return callback(error, attResult);
          });
        });
      },
      function (callback) {
        // pulling Manufacturers list
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return callback(err);
          // query
          let query = "SELECT tbl_companies.ID as ID, tbl_companies.Company_Name as Company_Name, tbl_companies.Logo as Logo  FROM tbl_employees  LEFT JOIN tbl_companies on tbl_employees.CID = tbl_companies.ID WHERE tbl_employees.ID != 1 AND tbl_employees.Active = 1 AND tbl_employees.Blocked = 0";
          mc.query(query, function (error, attResult, fields) {
            // connection release
            mc.release();
            // parse object
            attResult = JSON.parse(JSON.stringify(attResult)); // parse object
            return callback(error, attResult);
          });
        });
      }
    ], function (err, results) {
      if (err) return res.status(500).json({ error: err.toString() });

      // parse object
      results = JSON.parse(JSON.stringify(results));
      if (results && results.length) {
        // product attributes 
        let attObject = (results[0]) ? results[0] : [];
        // product min/max price
        let priceObj = (results[1] && results[1].length) ? results[1][0] : [];
        // manufacturers list
        let manufacturers = (results[2] && results[2].length) ? results[2] : [];
        // response 
        return res.send({ error: false, data: attObject, price: priceObj, manufacturers: manufacturers });
      } else {
        return res.status(404).send({ message: constants.messages.notFound });
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
