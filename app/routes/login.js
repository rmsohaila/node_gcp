"use strict";
module.exports = function (app) {
  var loginController = require("../controllers/login");

  app.route("/login").get(loginController.getUserModules);

  app.route("/login/approve").get(loginController.approveTos);

  app.route("/login/eua/approve").get(loginController.approveEua);

  app.route("/login/get-user-info").get(loginController.getUserInfo);

  app.route("/login/user-auth-code").post(loginController.createUserAuthCode);
};
