"use strict";

const db = require("../../../config/db");
const config = require("../../../config/config");
const mysql = require("mysql");

const tenant = function(tenant) {
  this.id         = tenant.id;
  this.created    = tenant.created;
  this.customerId = tenant.customerId;
  this.version    = tenant.version;
  this.socketPath = tenant.socketPath;
  this.user       = tenant.user;
  this.database   = tenant.database;
  this.host       = tenant.host;
  this.port       = tenant.port;
};

tenant.getTenantDatabases = function (customerId) {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT id,
            created,
            customerId,
            version,
            host,
            port,
            CAST(AES_Decrypt(socketPath, "` +
              config.encryption.key +
              `") AS CHAR(512) CHARACTER SET utf8) as socketPath,
            CAST(AES_Decrypt(\`database\`, "` +
                config.encryption.key +
                `") AS CHAR(512) CHARACTER SET utf8) as \`database\`,
            CAST(AES_Decrypt(\`user\`, "` +
                config.encryption.key +
                `") AS CHAR(512) CHARACTER SET utf8) as \`user\`
              FROM Customer_Tenant_Databases
              WHERE customerId = ?`,
        [customerId],
        (err, results) => {
          if (err) {
            console.error(err);
            reject({ message: "Failed to get tenant databases - database error" });
          } else {
            resolve(results);
          }
        }
      );
    });
  };

tenant.getTenantDatabase = function (customerId, tenantDatabaseId) {
    return new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          id,
          created,
          customerId,
          version,
          CAST(AES_Decrypt(socketPath, "` +
              config.encryption.key +
              `") AS CHAR(512) CHARACTER SET utf8) as socketPath,
          CAST(AES_Decrypt(user, "` +
              config.encryption.key +
              `") AS CHAR(512) CHARACTER SET utf8) as user,
          CAST(AES_Decrypt(password, "` +
              config.encryption.key +
              `") AS CHAR(512) CHARACTER SET utf8) as password,
          CAST(AES_Decrypt(\`database\`, "` +
              config.encryption.key +
              `") AS CHAR(512) CHARACTER SET utf8) as \`database\`,
          host,
          port,
          CAST(AES_Decrypt(sslKey, "` +
              config.encryption.key +
              `") AS CHAR(5000) CHARACTER SET utf8) as sslKey,
          CAST(AES_Decrypt(sslCertificate, "` +
              config.encryption.key +
              `") AS CHAR(5000) CHARACTER SET utf8) as sslCertificate,
          CAST(AES_Decrypt(sslCertificateAuthority, "` +
              config.encryption.key +
              `") AS CHAR(5000) CHARACTER SET utf8) as sslCertificateAuthority
        FROM Customer_Tenant_Databases
              WHERE customerId = ?
              AND id = ?
              LIMIT 1`,
        [
            customerId,
            tenantDatabaseId
        ],
        (err, results) => {
          if (err) {
            console.error(err);
            reject({ message: "Failed to get tenant database - database error" });
          } else {
            if(results.length){
              resolve(results[0]);
            }else{
              reject({ message: "Failed to get tenant database - not found" });
            }
          }
        }
      );
    });
};

tenant.createTenantDatabase = function (customerId, tenantDatabase) {
    const encryptionKey = config.encryption.key;
    const socketPath = mysql.escape(tenantDatabase.socketPath);
    const user = mysql.escape(tenantDatabase.user);
    const password = mysql.escape(tenantDatabase.password);
    const database = mysql.escape(tenantDatabase.database);
    const host = mysql.escape(tenantDatabase.host);
    const port = mysql.escape(tenantDatabase.port);

    const sslKey = mysql.escape(tenantDatabase.sslKey);
    const sslCertificate = mysql.escape(tenantDatabase.sslCertificate);
    const sslCertificateAuthority = mysql.escape(tenantDatabase.sslCertificateAuthority);

    return new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO Customer_Tenant_Databases (
            customerId,
            socketPath,
            user,
            password,
            \`database\`,
            host,
            port,
            sslKey,
            sslCertificate,
            sslCertificateAuthority
        ) VALUES (
            ?,
            AES_ENCRYPT(${socketPath}, "${encryptionKey}"),
            AES_ENCRYPT(${user}, "${encryptionKey}"),
            AES_ENCRYPT(${password}, "${encryptionKey}"),
            AES_ENCRYPT(${database}, "${encryptionKey}"),
            ${host},
            ${port},
            AES_ENCRYPT(REPLACE(${sslKey}, '\\\\n', CHAR(10)), "${encryptionKey}"), 
            AES_ENCRYPT(REPLACE(${sslCertificate}, '\\\\n', CHAR(10)), "${encryptionKey}"), 
            AES_ENCRYPT(REPLACE(${sslCertificateAuthority}, '\\\\n', CHAR(10)), "${encryptionKey}")
        )`,
        [
            customerId
        ],
        (err, results) => {
          if (err) {
            console.error(err);
            reject({ message: "Failed to create tenant database - database error" });
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
};

tenant.updateTenantDatabase = function (customerId, tenantDatabase) {
    const encryptionKey = config.encryption.key;
    const socketPath = mysql.escape(tenantDatabase.socketPath);
    const user = mysql.escape(tenantDatabase.user);
    const password = tenantDatabase.password ? mysql.escape(tenantDatabase.password) : '';
    const database = mysql.escape(tenantDatabase.database);
    const host = mysql.escape(tenantDatabase.host);
    const port = mysql.escape(tenantDatabase.port);
    const sslKey = tenantDatabase.sslKey ? mysql.escape(tenantDatabase.sslKey) : '';
    const sslCertificate = tenantDatabase.sslCertificate ? mysql.escape(tenantDatabase.sslCertificate) : '';
    const sslCertificateAuthority = tenantDatabase.sslCertificateAuthority ? mysql.escape(tenantDatabase.sslCertificateAuthority) : '';

    let queryString = `UPDATE Customer_Tenant_Databases SET`;
    queryString += password != '' ? ` password = AES_ENCRYPT(${password}, "${encryptionKey}"),` : ``;
    queryString += sslKey != '' ? ` sslKey = AES_ENCRYPT(REPLACE(${sslKey}, '\\\\n', CHAR(10)), "${encryptionKey}"),` : ``;
    queryString += sslCertificate != '' ? ` sslCertificate = AES_ENCRYPT(REPLACE(${sslCertificate}, '\\\\n', CHAR(10)), "${encryptionKey}"),` : ``;
    queryString += sslCertificateAuthority != '' ? ` sslCertificateAuthority = AES_ENCRYPT(REPLACE(${sslCertificateAuthority}, '\\\\n', CHAR(10)), "${encryptionKey}"),` : ``;
    queryString += `
            socketPath = AES_ENCRYPT(${socketPath}, "${encryptionKey}"),
            user = AES_ENCRYPT(${user}, "${encryptionKey}"),
            \`database\` = AES_ENCRYPT(${database}, "${encryptionKey}"),
            host = ${host},
            port = ${port}
        WHERE customerId = ?
            AND id = ?`;
    return new Promise((resolve, reject) => {
        db.query(
            queryString,
            [
              customerId,
              tenantDatabase.id
            ],
            (err, results) => {
                if (err) {
                    console.error(err);
                    reject({ message: "Failed to update tenant database - database error" });
                } else {
                    resolve(true);
                }
            }
        );
    });
};

tenant.deleteTenantDatabase = function (customerId, tenantDatabaseId) {
    return new Promise((resolve, reject) => {
      db.query(`
        DELETE FROM Customer_Tenant_Databases
              WHERE customerId = ?
              AND id = ?`,
        [
            customerId,
            tenantDatabaseId
        ],
        (err, results) => {
          if (err) {
            console.error(err);
            reject({ message: "Failed to delete tenant database - database error" });
          } else {
            resolve(true);
          }
        }
      );
    });
};

tenant.createTenantDatabaseSchema = function (db, sqlQuery) {
  return new Promise((resolve, reject) => {
    db.query(sqlQuery,
      [],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to create tenant database schema - database error" });
        } else {
          resolve(results);
        }
      }
    );
  });
};

module.exports = tenant;
