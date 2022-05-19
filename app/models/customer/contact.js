"use strict";
const db = require("../../../config/db");

let contact = function (contact) {
  this.id = contact.id;
  this.created = contact.created;
  this.customerId = contact.customerId;
  this.email = contact.email;
  this.firstName = contact.firstName;
  this.lastName = contact.lastName;
  this.role = contact.role;
  this.acceptedTos = contact.acceptedTos;
  this.acceptedTosDate = contact.acceptedTosDate;
  this.signature = contact.signature;
};

contact.createCustomerContact = async function (customerId, email, firstName, lastName) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Customer_Contacts (
        	customerId, 
        	email, 
        	firstName, 
        	lastName
    	) VALUES (
            ?,
            ?,
            ?,
            ?
        )`,
      [customerId, email.substring(0, 128), firstName.substring(0, 64), lastName.substring(0, 64)],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to create customer contact: Customer_Contact table",
          });
        } else {
          resolve(true);
        }
      }
    );
  });
};

contact.getCustomerContact = function (email) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, created, customerId, email, firstName, lastName, role, acceptedTos, acceptedTosDate FROM Customer_Contacts WHERE email = ?`,
      [email],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get customer contact: Unexpected database error" });
        } else {
          if (results.length != 1) {
            var errorModules = {
              id: 0,
              message: "Customer Contact does not exist",
            };
            resolve(errorModules);
          } else {
            resolve(new contact(results[0]));
          }
        }
      }
    );
  });
};

contact.getTosApproved = function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, created, customerId, email, firstName, lastName, role, acceptedTos, acceptedTosDate FROM Customer_Contacts WHERE customerId = ? AND acceptedTos = 1`,
      [customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get customer contact: Unexpected database error" });
        } else {
          var contacts = [];
          if (results) {
            for (var i = 0; i < results.length; i++) {
              contacts.push(new contact(results[i]));
            }
          }
          resolve(contacts);
        }
      }
    );
  });
};

contact.approveTos = function (customerId, email, signature) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE Customer_Contacts 
            SET acceptedTos = 1,
            signature = ?,
             acceptedTosDate = CURRENT_TIMESTAMP
             WHERE customerId = ? AND email = ? ;
             UPDATE Users SET euaSigned = CURRENT_TIMESTAMP WHERE email = ?`,
      [signature.substring(0, 100), customerId, email.substring(0, 128), email.substring(0, 128)],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get update contact: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

module.exports = contact;
