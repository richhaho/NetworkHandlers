const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const listToTree = require('list-to-tree-lite')

// REST API.
exports.get_categories = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Pull data from database   
    let query = '';
    if (req.query.parent_category_id == '') {
      query = 'SELECT * FROM tbl_store_categories WHERE CID = ' + req.query.cid + ' ORDER BY Category_OrderBy asc';
    } else {
      query = 'SELECT * FROM tbl_store_categories WHERE CID = ' + req.query.cid + ' and Parent_Category = ' + req.query.parent_category_id + ' ORDER BY Category_OrderBy asc';
    }
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      pool.query(query, function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse
          results = listToTree(results, {
            idKey: 'ID',
            parentKey: 'Parent_Category',
            childrenKey: 'childrenMenu'
          });
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

// REST API.
exports.get_featured_categories = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Pull data from database   
    let query = '';
    if (req.query.parent_category_id == '') {
      query = "SELECT * FROM view_store_categories WHERE  Featured_Category='yes' ORDER BY Category_AddedDate asc limit "+ req.query.limit;
    } else {
      query = "SELECT * FROM view_store_categories WHERE Parent_Category=  " + req.query.parent_category_id + " and Featured_Category='yes' ORDER BY Category_AddedDate asc limit "+ req.query.limit;
    }
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      pool.query(query, function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse
          results = listToTree(results, {
            idKey: 'ID',
            parentKey: 'Parent_Category',
            childrenKey: 'childrenMenu'
          });
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

// REST API  for get all parents of child category
exports.get_category_parents = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    let category_id = req.query.category_id;
    // Pull data from database   
    let query = 'SELECT T2.ID, T2.Category_Name,T2.Category_Slug,T2.Parent_Category FROM ( SELECT @r AS _id, (SELECT @r := Parent_Category FROM tbl_store_categories WHERE ID = _id) AS Parent_Category, @l := @l + 1 AS lvl FROM (SELECT @r := "'+category_id+'", @l := 0) vars, tbl_store_categories m WHERE @r <> 0) T1 JOIN tbl_store_categories T2 ON T1._id = T2.ID ORDER BY T1.lvl DESC';
    //console.log(query);
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });

      pool.query(query, function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
            results = JSON.parse(JSON.stringify(results));  // Json parse
            //console.log(results);
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

