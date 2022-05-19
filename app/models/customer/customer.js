"use strict";
const db = require("../../../config/db");
const config = require("../../../config/config");
const enums = require("../../helpers/enums");

let customer = function (customer) {
  this.id = customer.id;
  this.created = customer.created;
  this.customerId = customer.customerId;
  this.name = customer.name;
  this.tenantEnabled = customer.tenantEnabled;
  this.gcsEnabled = customer.gcsEnabled;
  this.gcsBucket = customer.gcsBucket;

  this.tenantDatabase = {
    id: customer.tenantDatabaseId,
  };

  this.serviceAccount = {
    id: customer.serviceAccountId,
  };

  this.subscription = {
    id: customer.subscriptionId,
    name: customer.subscriptionName,
    expires: customer.subscriptionExpires,
    free: customer.subscriptionFree,
    expired: customer.subscriptionExpired,
    plus: customer.plus,
  };
};

customer.getCustomer = function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT 
        c.id,
        c.created,
        c.customerId,
        c.name,
        c.subscriptionId,
        c.subscriptionExpires,
        c.gcsEnabled, 
        c.gcsBucket,
        IFNULL(s.name, 'Not configured') as subscriptionName,
        IFNULL(s.free, 1) as subscriptionFree,
        CASE 
            WHEN c.subscriptionExpires <= CURRENT_TIMESTAMP THEN 1 
            WHEN s.id IS NULL THEN 1
            ELSE 0
        END as subscriptionExpired,
        c.tenantDatabaseId,
        c.tenantEnabled,
        c.serviceAccountId,
        s.plus
      FROM Customers c
      LEFT JOIN Customer_Subscriptions s
      ON c.subscriptionId = s.id
      WHERE c.id = ? LIMIT 1`,
      [customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get customer: Unexpected database error" });
        } else {
          if (results.length) {
            resolve(new customer(results[0]));
          } else {
            reject({ message: "Customer not found" });
          }
        }
      }
    );
  });
};

customer.getCustomerModules = function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT 
        M.id, 
        M.name, 
        M.description, 
        M.requiresServiceAccount, 
        SM.id subscriptionModuleId,
        SMSA.serviceAccountId,
        SA.delegateEmail
      FROM Modules M
      JOIN Customer_Subscription_Modules SM
      ON M.id = SM.moduleId
      JOIN Customers C
      ON SM.subscriptionId = C.subscriptionId
      LEFT JOIN (
          SELECT
            SMSA.serviceAccountId,
            SMSA.subscriptionModuleId
          FROM Customer_Subscription_Module_Service_Accounts SMSA
          JOIN Customer_Service_Accounts SA
          ON SMSA.serviceAccountId = SA.id
          JOIN Customers C
          ON SA.customerId = C.id
          WHERE C.id = ?) SMSA
      ON SM.id = SMSA.subscriptionModuleId
      LEFT JOIN Customer_Service_Accounts SA
	    ON SMSA.serviceAccountId = SA.id
      WHERE C.id = ?
      ORDER BY M.name;
          `,
      [customerId, customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get customer modules: Unexpected database error" });
        } else {
          if (results.length > 0) {
            resolve(results);
          } else {
            reject({ message: "Unable to retrieve customer modules" });
          }
        }
      }
    );
  });
};

customer.linkCustomerModule = function (subscriptionModuleId, serviceAccountId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      INSERT INTO Customer_Subscription_Module_Service_Accounts (subscriptionModuleId, serviceAccountId)
      VALUES(?,?);
    `,
      [subscriptionModuleId, serviceAccountId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: " Failed to link customer module: Unexpected database error " });
        } else {
          resolve(results);
        }
      }
    );
  });
};

customer.changeCustomerModule = function (subscriptionModuleId, serviceAccountId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      UPDATE Customer_Subscription_Module_Service_Accounts
      SET serviceAccountId = ?
      WHERE subscriptionModuleId = ?
      LIMIT 1;
    `,
      [serviceAccountId, subscriptionModuleId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: " Failed to change customer module: Unexpected database error " });
        } else {
          resolve(results);
        }
      }
    );
  });
};

customer.unlinkCustomerModule = function (subscriptionModuleId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      DELETE FROM Customer_Subscription_Module_Service_Accounts
      WHERE subscriptionModuleId = ?
      LIMIT 1;
    `,
      [subscriptionModuleId],
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: " Failed to unlink customer module: Unexpected database error " });
        } else {
          resolve(true);
        }
      }
    );
  });
};

customer.updateCloudStorage = function (customerId, enable, bucketName) {
  return new Promise((resolve, reject) => {
    if (bucketName.length > 255) {
      reject({ message: "The bucket name can't be longer than 255 characters" });
    } else {
      db.query(
        `
          UPDATE Customers
            SET gcsEnabled = ?, gcsBucket = ?
          WHERE id = ?
        `,
        [enable, bucketName.substring(0, 255), customerId],
        (err, results) => {
          if (err) {
            console.error(err);
            reject({ message: "Failed to enable cloud storage in customer table: Unexpected database error" });
          } else {
            if (results) {
              resolve(true);
            }
          }
        }
      );
    }
  });
};

customer.updateCustomer = function (customerId, customer) {
  return new Promise((resolve, reject) => {
    db.query(
      `
        UPDATE Customers c
          SET TenantDatabaseId = ?, serviceAccountId = ?, name = ?
        WHERE c.id = ?
      `,
      [customer.tenantDatabase.id, customer.serviceAccount.id ? parseInt(customer.serviceAccount.id) : null, customer.name.trim(), customerId],
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update customer: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

customer.updateSubscriptionApproveTos = function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            UPDATE Customers c
            LEFT JOIN Customer_Subscriptions s
            ON c.subscriptionId = s.id
            SET 
                c.subscriptionExpires = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL IFNULL(s.days, 14) DAY),
                c.subscriptionId = IFNULL(s.id, 1)
            WHERE c.id = ?
        `,
      [customerId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update customer: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

customer.getServiceCredentials = async function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
              SELECT 
                  CAST(AES_Decrypt(csa.accessKey, "` +
        config.encryption.key +
        `") AS CHAR(5000) CHARACTER SET utf8) as accessKey, 
                  csa.serviceEmail,
                  csa.delegateEmail 
              FROM Customer_Service_Accounts csa
              INNER JOIN Customers c
              ON csa.id = c.serviceAccountId
              WHERE c.id = ? 
              LIMIT 1`,
      [customerId],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get customer service account: Unexpected database error" });
        } else {
          if (results && results.length == 1) {
            resolve(results[0]);
          } else {
            reject({ message: "Unable to retrieve credentials" });
          }
        }
      }
    );
  });
};

customer.checkCustomerId = async function (customerId) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT customerId FROM Customers WHERE customerId = ? LIMIT 1`, [customerId], (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed to get free trial: Customers table",
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

customer.createCustomer = async function (customerId, organization, partnerName) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Customers (customerId, name, partnerName, subscriptionId) VALUES (?, ?, ?, 1)`,
      [
        customerId.substring(0, 45),
        organization.substring(0, 45),
        partnerName.substring(0, 45),
        enums.CustomerSubscription.FOURTEEN_FREE_TRIAL,
      ],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to add free trial: Customers table ",
          });
        } else {
          resolve(results.insertId);
        }
      }
    );
  });
};

module.exports = customer;
