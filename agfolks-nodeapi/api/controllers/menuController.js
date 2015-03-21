const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const listToTree = require('list-to-tree-lite')

// REST API getting parent menu.
exports.get_menu = function (req, res) {
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

      // Pull data from database   
      mc.query('SELECT * FROM tbl_cms_menu WHERE CID = ' + req.query.cid + ' AND menu="main" ORDER BY orderby asc', function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse
          results = listToTree(results, {
            idKey: 'ID',
            parentKey: 'topmenu',
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

// REST API getting footer menu.
exports.get_footer = function (req, res) {
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

      // Pull data from database   
      mc.query('SELECT * FROM tbl_cms_menu WHERE CID = ' + req.query.cid + ' AND menu="footer" ORDER BY orderby asc', function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) return res.status(500).json({ error: error.toString() });

        if (results && results.length) {
          results = JSON.parse(JSON.stringify(results));  // Json parse
          results = listToTree(results, {
            idKey: 'ID',
            parentKey: 'topmenu',
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

