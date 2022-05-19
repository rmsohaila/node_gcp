// config.js
const fs = require("fs");
const http = require("http");
const https = require("https");

const ENVIRONMENT = process.env.ENVIRONMENT;

const config = {
  env: ENVIRONMENT || "dev",
  app: {
    port: 4203,
  },
  jobs: {
    secretKey: process.env.JOBS_SECRET_KEY || "SECRET_KEY",
  },
  oAuth: {
    client_id: "CLIENT_ID",
    client_secret: "CLIENT_SECRET_KEY",
    allowed_client_ids: [ "CLIENT_ID" ],
  },
  allowedAppIds: ["CLIENT_ID.apps.googleusercontent.com"],
  reCaptcha: {
    secretKey: "RECAPTCHA_KEY",
  },
  email: {
    api: {
      key: "HASHED_API_KEY",
    },
  },
};

config.apiKey = "HASHED_API_KEY";
config.apiUrl = process.env.API_URL || "127.0.0.1";
config.apiPort = config.env == "dev" ? 4203 : 443;
config.protocol = config.env == "dev" ? http : https;

config.encryption = {};
config.encryption.key = process.env.ENCRYPTION_KEY || "testKey";

config.conn = {};

if (ENVIRONMENT) {
  config.conn = {
    socketPath: process.env.CONN_SOCKET_PATH,
    user: process.env.CONN_USER,
    password: process.env.CONN_PASSWORD,
    database: process.env.CONN_DATABASE,
    multipleStatements: true,
    queryTimeout: 60000,
    connectTimeout: 60000,
  };
} else {
  config.conn = {
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

if (ENVIRONMENT) {
  config.customer = {
    socketPath: process.env.CUSTOMER_SOCKET_PATH,
    user: process.env.CUSTOMER_USER,
    password: process.env.CUSTOMER_PASSWORD,
    database: process.env.CUSTOMER_DATABASE,
    multipleStatements: true,
    queryTimeout: 60000,
    connectTimeout: 60000,
  };
} else {
  config.customer = {
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

module.exports = config;
