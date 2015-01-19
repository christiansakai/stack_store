'use strict';

var User = require('./user.model');
var _ = require('lodash');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

// change a user's permissions
exports.adminUpdate = function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if(err) return next(err);
    var updated = _.merge(user, req.body);
    updated.save(function (err, user) {
      if (err) return next(err);
      return res.json(200, user);
    });
  });
}

// change a user's password, if you are an admin
exports.adminChangePassword = function(req, res, next) {
  User.findOne({
    _id: req.params.id
  }, '-salt -hashedPassword', function(err, user) {
    console.log(user);
    user.password = req.body.newPassword;
    user.save(function(err) {
      if (err) return next(err);
      return res.json(200, user);
    });
  });
}

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

// Change other user info, i don't KNOW okay
exports.update = function(req, res, next) {
  var userId = req.user._id;
  User.findById(userId, function(err, user) {
    if(err) return next(err);
    var updated = _.extend(user, req.body);
    console.log(updated);
    updated.save(function(err) {
      if (err) return next(err);
      res.send(200);
    });
  });
}

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
  })
  .populate('reviews orders')
  .exec(function(err, user){
    if (err) return next(err);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
