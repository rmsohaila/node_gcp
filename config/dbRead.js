const mysql = require("mysql");
const config = require("./config.js");
const fs = require("fs");

var conn = {};

if (config.env == "prod") {
  conn = {
    socketPath:
      "WEB_SOCKET_PATH",
    user: "DATABASE_USER",
    password: "DATABASE_PASSWORD",
    database: "DATABASE_NAME",
    multipleStatements: true,
    queryTimeout: 60000,
    connectTimeout: 60000,
    connectionLimit: 10,
  };
} else if (config.env == "beta") {
  conn = {
    socketPath:
      "WEB_SOCKET_PATH",
    user: "DATABASE_USER",
    password: "DATABASE_PASSWORD",
    database: "DATABASE_NAME",
    multipleStatements: true,
    queryTimeout: 60000,
    connectTimeout: 60000,
  };
} else if (config.env == "dev") {
  conn = {
    host: "DATABASE_HOST_IP",
    user: "DATABASE_USER",
    password: "DATABASE_PASSWORD",
    database: "DATABASE_NAME",
    multipleStatements: true,
    queryTimeout: 60000,
    connectTimeout: 60000,
    connectionLimit: 10,
    ssl: {
      ca: fs.readFileSync(__dirname + "/server-ca.pem"),
      cert: fs.readFileSync(__dirname + "/client-cert.pem"),
      key: fs.readFileSync(__dirname + "/client-key.pem"),
    },
  };
}

var pool = mysql.createPool(conn);

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      setTimeout(pool.getConnection, 3000);
      console.error("Database connection was refused.");
    }
  }
  if (connection) connection.release();
  return;
});

module.exports = pool;
