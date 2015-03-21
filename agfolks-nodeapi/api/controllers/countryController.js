const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const listToTree = require('list-to-tree-lite')

// REST API.
exports.get_countries = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    
    // Pull data from database   
    let query = '';
    query = 'SELECT * FROM tbl_countries ORDER BY Country_Name asc';
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

exports.get_states = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    
    // Pull data from database   
    let query = '';
    query = "SELECT * FROM tbl_states where Country_Code = 'US' ORDER BY State_Name asc";
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

