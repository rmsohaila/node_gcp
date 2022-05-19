const mysql = require("mysql");
const customerDb = require("../../config/customerDb");
const config = require("../../config/config");
const tenantConnections = [];

class tenant {
  constructor(tenant) {
    if (!tenant) {
      return customerDb; //If no tenant is passed in, we will just use the default connection info.
    } else {
      //search the array for tenant.id
      if (tenantConnections[tenant.id]) {
        return tenantConnections[tenant.id];
      } else {
        const newPool = this.createPool(tenant);

        tenantConnections[tenant.id] = newPool;

        return newPool;
      }
    }
  }

  createPool(tenant) {
    let conn = config.conn;

    //Override the connection value with the values from the database
    conn.socketPath = tenant.socketPath;
    conn.host = tenant.host;
    conn.user = tenant.user;
    conn.password = tenant.password;
    conn.database = tenant.database;
    if (!tenant.socketPath || tenant.socketPath == "") {
      conn.ssl = {};
      conn.ssl.ca = tenant.sslCertificateAuthority;
      conn.ssl.cert = tenant.sslCertificate;
      conn.ssl.key = tenant.sslKey;
    }

    let pool = mysql.createPool(conn);
    pool.getConnection((err, connection) => {
      if (err) {
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          console.error("Database connection was closed.");
        }
        if (err.code === "ER_CON_COUNT_ERROR") {
          console.error("Database has too many connections.");
        }
        if (err.code === "ECONNREFUSED") {
          console.error("Database connection was refused.");
        }
      }
      if (connection) {
        connection.release();
        return;
      }
    });

    return pool;
  }
}

module.exports = tenant;
