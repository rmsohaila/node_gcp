'use strict';
module.exports = function(app) {
  var accountController = require('../controllers/account');

  app.route('/account')
    .get(accountController.getAccount);
};