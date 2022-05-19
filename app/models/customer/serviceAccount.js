"use strict";

const config = require("../../../config/config");
const db = require("../../../config/db");
const mysql = require("mysql");

let serviceAccount = function (serviceAccount) {
  this.id = serviceAccount.id;
  this.created = serviceAccount.created;
  this.customerId = serviceAccount.customerId;
  this.name = serviceAccount.name;
  this.description = serviceAccount.description;
  this.serviceEmail = serviceAccount.serviceEmail;
  this.delegateEmail = serviceAccount.delegateEmail;
  this.clientId = serviceAccount.clientId;
};

serviceAccount.getServiceAccounts = function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT 
        csa.id,
        csa.created,
        csa.customerId,
        csa.name,
        csa.description,
        csa.serviceEmail,
        csa.delegateEmail,
        csa.clientId,
        (SELECT COUNT(subscriptionModuleId) FROM Customer_Subscription_Module_Service_Accounts
        WHERE serviceAccountId = csa.id) moduleCount,
        (
          SELECT 
            GROUP_CONCAT(DISTINCT s.scope) 
          FROM Scopes s 
          JOIN Module_Scopes ms
          ON s.id = ms.scopeId
          JOIN Modules m 
          ON ms.moduleId = m.id
          JOIN Customer_Subscription_Modules csm
          ON m.id = csm.moduleId
          JOIN Customer_Subscription_Module_Service_Accounts csmsa
          ON csm.id = csmsa.subscriptionModuleId
          WHERE m.requiresServiceAccount = 1
          AND csmsa.serviceAccountId = csa.id
          ) as scopes
      FROM Customer_Service_Accounts csa
      WHERE csa.customerId = ?`,
      [customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get service accounts - database error" });
        } else {
          resolve(results);
        }
      }
    );
  });
};

serviceAccount.getServiceAccount = function (serviceAccountId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT 
        csa.id,
        csa.created,
        csa.customerId,
        csa.name,
        csa.description,
        csa.serviceEmail,
        csa.delegateEmail,
        csa.clientId,
        (
          SELECT 
            GROUP_CONCAT(s.scope) 
          FROM Scopes s 
          JOIN Module_Scopes ms
          ON s.id = ms.scopeId
          JOIN Modules m 
          ON ms.moduleId = m.id
          JOIN Customer_Subscription_Modules csm
          ON m.id = csm.moduleId
          JOIN Customer_Subscription_Module_Service_Accounts csmsa
          ON csm.id = csmsa.subscriptionModuleId
          WHERE m.requiresServiceAccount = 1
          AND csmsa.serviceAccountId = csa.id
          ) as scopes
      FROM Customer_Service_Accounts csa
      WHERE csa.id = ?`,
      [serviceAccountId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get service account - database error" });
        } else {
          if (results.length && results.length == 1) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

serviceAccount.createServiceAccount = function (serviceAccount) {
  const encryptionKey = config.encryption.key;
  const accessKey = mysql.escape(serviceAccount.accessKey);
  return new Promise((resolve, reject) => {
    db.query(
      `
        INSERT INTO Customer_Service_Accounts (
          customerId,
          name,
          description,
          accessKey,
          serviceEmail,
          delegateEmail,
          clientId,
          typeId)
        VALUES (
          ${serviceAccount.customerId},
          ${mysql.escape(serviceAccount.name.substring(0, 255))},
          ${serviceAccount.description != undefined ? mysql.escape(serviceAccount.description.substring(0, 512)) : null},
          AES_ENCRYPT(REPLACE(${accessKey}, '\\\\n', CHAR(10)), "${encryptionKey}"), 
          ${mysql.escape(serviceAccount.serviceEmail.substring(0, 512))}, 
          ${mysql.escape(serviceAccount.delegateEmail.substring(0, 512))},
          ${mysql.escape(serviceAccount.clientId.substring(0, 124))},
          1)
      `,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to create Service Account: unexpected database error" });
        } else {
          if (results && results.affectedRows == 1) {
            resolve(results);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

serviceAccount.updateServiceAccount = function (serviceAccount, customerId) {
  const encryptionKey = config.encryption.key;
  const id = serviceAccount.id;
  const name = serviceAccount.name.substring(0, 255);
  const description = serviceAccount.description.substring(0, 512);
  const serviceEmail = serviceAccount.serviceEmail.substring(0, 512);
  const delegateEmail = serviceAccount.delegateEmail.substring(0, 512);
  const clientId = serviceAccount.clientId;
  const accessKey = serviceAccount.accessKey;
  return new Promise((resolve, reject) => {
    db.query(
      `
      UPDATE Customer_Service_Accounts 
      SET updated = CURRENT_TIMESTAMP
      ,name = ${mysql.escape(name)}
      ,description = ${description != undefined ? mysql.escape(description) : null}
      ${
        accessKey != undefined
          ? `,accessKey = AES_ENCRYPT(REPLACE(` + mysql.escape(accessKey) + `, '\\\\n', CHAR(10)), '` + encryptionKey + `')`
          : ""
      } 
      ,serviceEmail = ${mysql.escape(serviceEmail)}
      ,delegateEmail = ${mysql.escape(delegateEmail)}
      ,clientId = ${mysql.escape(clientId)}
      WHERE id = ${id}
      AND customerId = ${customerId}
      `,
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update Service Account: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

serviceAccount.deleteServiceAccount = function (serviceAccountId, customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
    DELETE FROM Customer_Service_Accounts
    WHERE id = ${serviceAccountId}
    AND customerId = ${customerId}
    AND NOT EXISTS (SELECT serviceAccountId FROM Customer_Subscription_Module_Service_Accounts
      WHERE serviceAccountId = id)
    `,
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to delete Service Account: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

serviceAccount.updateServiceAccountTestedDate = function (serviceAccountId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      UPDATE Customer_Service_Accounts
      SET testedDate = CURRENT_TIMESTAMP
      WHERE id = ${serviceAccountId}
      `,
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update Service Account: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

//Whoa, this is a little intense...
serviceAccount.getServiceAccountByModule = async function (customerId, moduleId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            SELECT 
                csa.id,
                CAST(AES_Decrypt(csa.accessKey, "` +
        config.encryption.key +
        `") AS CHAR(5000) CHARACTER SET utf8) as accessKey,
                csa.name,
                csa.description,
                csa.serviceEmail,
                csa.delegateEmail,
                csa.clientId
            FROM Customer_Service_Accounts csa
            JOIN Customer_Subscription_Module_Service_Accounts csmsa
            ON csa.id = csmsa.serviceAccountId
            JOIN Customer_Subscription_Modules csm
            ON csmsa.subscriptionModuleId = csm.id
            WHERE csa.customerId = ? 
            AND csm.moduleId = ?
            LIMIT 1`,
      [customerId, moduleId],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get customer service account by module: Unexpected database error" });
        } else {
          if (results.length) {
            resolve(results[0]);
          } else {
            reject({ message: "Unable to retrieve service account, credentials not found" });
          }
        }
      }
    );
  });
};

module.exports = serviceAccount;
