const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const async = require("async");
const decode = require('decode-html')

// REST API for get slier by slider_category
exports.get_slider = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });
      
    pool.getConnection(function (err, mc) {
      // check error
      if (err) return res.status(500).json({ error: err.toString() });
      mc.query('SELECT * FROM tbl_cms_sliders_new left join tbl_cms_sliders on(tbl_cms_sliders.slider_id=tbl_cms_sliders_new.slider_id) WHERE tbl_cms_sliders_new.CID =' + req.query.cid + ' and tbl_cms_sliders_new.slider_category =' + req.query.slider_category, function (error, results, fields) {
        // connection release 
        mc.release();
        // check error
        if (error) res.status(500).json({ error: error.toString() });
        if (results && results.length) {
          data = JSON.parse(JSON.stringify(results));  // Json parse
          _.map(data, function (v) {
            v.slider_title = decode(v.slider_title);
            v.slider_desc = decode(v.slider_desc);
            return v;
          })
          //console.log(data);
          return res.send({ error: false, data: data });

        } else {
          return res.status(404).send({ message: constants.messages.notFound });
        }
        //return res.send({ error: false, data: results });
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}
