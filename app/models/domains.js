"use strict";
var db = require("../../config/db");

var domain = function (domain) {
  this.id = domain.id;
  this.created = domain.created;
  this.name = domain.name;
  this.customerId = domain.customerId;
};

domain.getDomain = function (domainName) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            SELECT 
                d.id, 
                d.created,
                d.name, 
                d.customerId 
            FROM Domains d
            WHERE d.name = ? LIMIT 1`,
      [domainName],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get domain: Unexpected database error" });
        } else {
          if (results) {
            if (results.length == 1) {
              resolve(new domain(results[0]));
            } else {
              reject({ message: "Domain not found" });
            }
          }
        }
      }
    );
  });
};

domain.getDomainByName = function (domainName) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT 
        d.id, 
        d.created,
        d.name, 
        d.customerId 
      FROM Domains d
      WHERE d.name = ? LIMIT 1`,
      [domainName],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get domain: Unexpected database error" });
        } else {
          if (results.length) {
            resolve(new domain(results[0]));
          } else {
            reject({ message: "Domain isn't registered" });
          }
        }
      }
    );
  });
};

domain.checkDomainName = async function (domainName) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT name FROM Domains WHERE name = ? LIMIT 1`, [domainName], (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed to get domain name: Domain table",
        });
      } else {
        if (results.length > 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    });
  });
};

domain.createDomain = async function (domainName, customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Domains (name,customerId) VALUES (?,?)`,
      [domainName.substring(0, 45), customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to create domain: Domains table",
          });
        } else {
          if (results) {
            resolve(results);
          }
        }
      }
    );
  });
};

module.exports = domain;
