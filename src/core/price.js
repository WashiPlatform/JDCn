var async = require('async');
var util = require('util');
var fs = require('fs');
var path = require('path');
var ip = require('ip');
var extend = require('extend');
var Router = require('../utils/router.js');
var sandboxHelper = require('../utils/sandbox.js');

require('array.prototype.find'); // Old node fix

// Private fields
var modules, library, self, private = {}, shared = {};

// Constructor
function Price(cb, scope) {
  library = scope;
  self = this;
  self.__private = private;
  private.attachApi();

  setImmediate(cb, null, self);
}

// Private methods
private.attachApi = function () {
  var router = new Router();

  router.use(function (req, res, next) {
    if (modules) return next();
    res.status(500).send({success: false, error: "Blockchain is loading"});
  });

  router.map(shared, {
    // "get /": "getPrices",
    // "get /version": "version",
    "get /get": "getPrice",
    'put /issuers': 'registerIssuer',
  });

  router.use(function (req, res) {
    res.status(500).send({success: false, error: "API endpoint not found"});
  });

  library.network.app.use('/api/price', router);
  library.network.app.use(function (err, req, res, next) {
    if (!err) return next();
    library.logger.error(req.url, err.toString());
    res.status(500).send({success: false, error: err.toString()});
  });
}

private.updatePrice = function (price, cb) {
  price = parseInt(price);
  if (isNaN(price)) return cb && cb("Price is not a number.");

  library.dbLite.query("UPDATE price SET price = $price;", {price: price}, function (err) {
    err && library.logger.error('Price#update', err);

    cb && cb(err)
  });
};

private.getPrice = function (cb) {
  library.dbLite.query("SELECT price, issuePrice FROM price", {
    "price": Number,
    "issuePrice": Number
  }, function (err, rows) {
    if (err) {
      library.logger.error('Price#get', err);
      return cb(err);
    }

    if (rows.length)
      return cb(null, rows[0]);

    library.dbLite.query("INSERT OR IGNORE INTO price (name, price, issuePrice) VALUES ($name, $price, $issuePrice)", {
      "name": "SERC",
      "price": 100,
      "issuePrice": 100
    }, function (err) {
      if (err) {
        library.logger.error('Price#insert', err);
        return cb(err);
      }

      return cb(null, {"price": 100, "issuePrice": 100});
    });
  });
}

// Public methods
Price.prototype.getPrice = function (cb) {
  private.getPrice(function (err, price) {
    if (err) {
      library.logger.error('Price#insert', err);
      return cb(err);
    }

    return cb(null, price);
  });
}

Price.prototype.setPrice = function (price, cb) {
  private.updatePrice(price, function (err) {
    err && library.logger.error('Price#update', err);
    cb && cb()
  })
};

Price.prototype.sandboxApi = function (call, args, cb) {
  sandboxHelper.callMethod(shared, call, args, cb);
}

// Events
Price.prototype.onBind = function (scope) {
  modules = scope;
}

// Shared
shared.getPrice = function (req, cb) {
  private.getPrice(function (err, price) {
    err && library.logger.error('get Price fail', err);
    cb && cb()
  });
  // var query = req.body;
  // library.scheme.validate(query, {
  //   type: "object",
  //   properties: {
  //     name: {
  //       type: "string",
  //       minLength: 1
  //     },
  //     price: {
  //       type: "integer",
  //       minimum: 1,
  //       // maximum: 65535
  //     }
  //   },
  //   required: ['name', 'price']
  // }, function (err) {
  //   if (err) {
  //     return cb(err[0].message);
  //   }
  //
  //   // private.getByFilter({
  //   //   ip: query.ip,
  //   //   port: query.port
  //   // }, function (err, price) {
  //   //   if (err) {
  //   //     return cb("Price not found");
  //   //   }
  //   //
  //   //   var price = price.length ? price[0] : null;
  //   //
  //   //   if (price) {
  //   //     price.ip = ip.fromLong(price.ip);
  //   //   }
  //   //
  //   //   cb(null, {price: price || {}});
  //   // });
  // });
}

shared.setPrice = function (req, cb) {
  var price = parseInt(req.data.price);
  if (isNaN(price)) return cb('Price is not a number');

  private.updatePrice(price, function (err) {
    err && library.logger.error('set Price fail', err);
    cb && cb();
  })
}

// Export
module.exports = Price;
