const constants = require('../../config/constants');
const common = require('../common');
const _ = require('lodash');
const async = require("async");
const decode = require('decode-html');

// REST API.
exports.get_cms_page_content = function (req, res) {
  try {
    // check api auth
    if (!common.checkApiAuthentication(req))
      return res.status(403).send({ auth: false, message: constants.messages.unauthorizedRequest });

    // Check cid 
    if (!(req && req.query && req.query.cid))
      return res.status(404).send({ message: constants.messages.cidNotFound });

    // Set query   
    let cond = '';
    if (req.query && req.query.home_page_flag) {
      cond = ' AND tbl_cms_page_versions.version_status = 1 AND tbl_cms_page_versions.home_page_flag = ' + req.query.home_page_flag + ' ';
    }

    // Set page slug
    if (req.query && req.query.page_name) {
      req.query.page_name = req.query.page_name.replace("content/", "");
      cond = ' AND tbl_cms_page_versions.version_status = 1 AND tbl_cms_page_versions.page_name = "' + req.query.page_name + '" ';
    }

    // Manage multipl process
    async.waterfall([
      function (callback) {
        pool.getConnection(function (err, mc) {
          // check error
          if (err) return callback(err);
          // run query  
          pool.query('SELECT tbl_cms_page_versions.ID,tbl_cms_page_versions.version_id,tbl_cms_page_versions.page_name,tbl_cms_page_versions.page_title,tbl_cms_page_versions.page_title_new,tbl_cms_page_versions.page_short_title,tbl_cms_page_versions.page_hit,tbl_cms_page_versions.page_desc,tbl_cms_page_versions.page_desc2,tbl_cms_page_versions.page_meta_title,tbl_cms_page_versions.meta_title,tbl_cms_page_versions.page_meta,tbl_cms_page_versions.page_meta,tbl_cms_page_versions.page_active,tbl_cms_page_versions.sidebar_id,tbl_cms_page_versions.slider_id,tbl_cms_page_versions.home_page_flag,tbl_cms_page_versions.ga_code,tbl_cms_page_versions.version_counter,tbl_cms_page_versions.template_id FROM tbl_cms_page_versions WHERE tbl_cms_page_versions.CID =  ' + req.query.cid + cond, function (error, cmsPage, fields) {
            // connection release 
            mc.release();
            return callback(error, cmsPage);
          });
        });
      },
      function (cmsPage, callback) {
        cmsPage = JSON.parse(JSON.stringify(cmsPage));  // Json parse
        if (cmsPage && cmsPage.length && cmsPage[0]) {
          cmsPage[0].page_desc = decode(cmsPage[0].page_desc);
          cmsPage[0].page_desc2 = decode(cmsPage[0].page_desc2);
          let cmsData = { pageData: cmsPage[0], slider: '' };
          if (cmsPage[0].slider_id) {
            pool.getConnection(function (err, mc) {
              // check error
              if (err) return callback(err);
              // run query 
              pool.query('SELECT * FROM tbl_cms_sliders  WHERE cid =' + req.query.cid + ' and slider_id =' + cmsPage[0].slider_id, function (error, data, fields) {
                // connection release 
                mc.release();
                data = JSON.parse(JSON.stringify(data));  // Json parse
                if (data && data.length) {
                  _.map(data, function (v) {
                    v.slider_title = decode(v.slider_title);
                    v.slider_desc = decode(v.slider_desc);
                    return v;
                  })
                }
                cmsData.slider = data;
                return callback(error, cmsData);
              });
            });
          } else {
            return callback(null, cmsData);
          }
        } else {
          return callback(null, null);
        }
      }
    ], function (error, results) {
      // check error
      if (error) return res.status(500).json({ error: error.toString() });

      return res.send({ error: false, data: results });
    })

  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
}

