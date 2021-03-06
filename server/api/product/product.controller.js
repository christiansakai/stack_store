'use strict';

var _ = require('lodash');
var Product = require('./product.model');

// Get list of products
exports.index = function(req, res) {
  Product.find(function (err, products) {
    if(err) { return handleError(res, err); }
    return res.json(200, products);
  });
};

// Get a single product
exports.show = function(req, res) {
  Product.findById(req.params.id, function (err, product) {
    if(err) { return handleError(res, err); }
    if(!product) { return res.send(404); }
  })
  // .populate('categories')
  .exec(function(err, product) {
    if(err) { return handleError(res, err); }
    return res.json(product);
  });
};

// Get multiple products BUT NOT ALL
exports.showMultiple = function(req, res) {
  Product.find(function (err, products) {
    if(err) { return handleError(res, err); }
    var searchResults = Product.search(req.params.query, products);
    return res.json(200, searchResults);
  });
};

// Creates a new product in the DB.
exports.create = function(req, res) {
  Product.create(req.body, function(err, product) {
    // console.log(err);
    if(err) { return handleError(res, err); }
    return res.json(201, product);
  });
};

// Updates an existing product in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Product.findById(req.params.id, function (err, product) {
    if (err) { return handleError(res, err); }
    if(!product) { return res.send(404); }
    var updated = _.extend(product, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, product);
    });
  });
};

exports.updateQuantity = function(req, res) {
  console.log(req.body);
  Product.findById(req.body.productId, function (err, product) {
    if (err) { return handleError(res, err); }
    if(!product) { return res.send(404); }
    product.changeQuantity(req.body.quantity);
    console.log(product);
    product.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, product);
    });
  });
};

// Deletes a product from the DB.
exports.destroy = function(req, res) {
  Product.findById(req.params.id, function (err, product) {
    if(err) { return handleError(res, err); }
    if(!product) { return res.send(404); }
    product.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}