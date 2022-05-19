"use strict";

var db = require("../../config/db");

var login = function (login) {
  this.id = login.id;
  this.userID = login.userID;
  this.moduleID = login.moduleID;
  this.created = login.created;
};

login.getUserModules = async function (userID) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT m.name FROM Modules m
      INNER JOIN Customer_Subscription_Modules csm 
      ON m.ID = csm.moduleId 
      INNER JOIN Customers c
      ON csm.subscriptionId = c.subscriptionId
      INNER JOIN Domains d
      ON c.id = d.customerId
      INNER JOIN Users u 
      ON right(u.email, length(u.email)-INSTR(u.email, '@')) = d.name 
      WHERE u.id = ?`,
      [userID],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get user modules: Unexpected database error" });
        } else {
          var userModules = [];

          if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
              userModules.push(results[i].name);
            }
          }

          resolve(userModules);
        }
      }
    );
  });
};

login.getUserModuleScopes = async function (userId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT DISTINCT scope 
      FROM Scopes s
      INNER JOIN Module_Scopes ms
      ON s.id = ms.scopeId
      INNER JOIN Modules m
      ON ms.moduleId = m.id
      INNER JOIN Customer_Subscription_Modules csm 
      ON ms.moduleId = csm.moduleId 
      INNER JOIN Customers c
      ON csm.subscriptionId = c.subscriptionId
      INNER JOIN Domains d
      ON c.id = d.customerId
      INNER JOIN Users u 
      ON right(u.email, length(u.email)-INSTR(u.email, '@')) = d.name 
      WHERE u.id = ?
      AND m.requiresServiceAccount != 1`,
      [userId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get user module scopes: Unexpected database error" });
        } else {
          var scopes = [];

          if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
              scopes.push(results[i].scope);
            }
          }
          resolve(scopes);
        }
      }
    );
  });
};

module.exports = login;
