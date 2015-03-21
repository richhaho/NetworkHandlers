
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');

// Import config file
require('./config/database');
const config = require('./config/config');
const constants = require('./config/constants');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cors());
let allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);

  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
};
app.use(allowCrossDomain);

// set default port 
app.set('port', process.env.PORT || config.PORT);

// Import routes
require(config.APIURL)(app, express);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  err.msg = constants.messages.unableToProccessRequest;
  res.status(404).send(err);
});

// start server here
let server = http.createServer(app);
server.listen(app.get('port'), config.HOST, function () {
  console.log(server.address().address +':' + app.get('port'));
});


// allows "grunt dev" to create a development server with livereload
module.exports = app;