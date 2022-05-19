"use strict";
const { google } = require("googleapis");
const config = require("../../config/config");
const jwt = require("jsonwebtoken");
const usersModel = require("../models/users");

exports.encodeToken = async function (data = null) {
  try {
    if (data && typeof data == "object") {
      const token = jwt.sign(
        {
          data: data,
        },
        config.utilities.automationWorkflow.secret,
        {
          expiresIn: "1h",
        }
      );

      return token;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

exports.decodeToken = async function (token) {
  try {
    const decoded = jwt.verify(token, config.utilities.automationWorkflow.secret);
    return decoded.data ? decoded.data : decoded;
  } catch (error) {
    console.error(error);
    return null;
  }
};

exports.getAuth = function (req, results) {
  return new Promise((resolve, reject) => {
    var idToken = "";
    if (req.headers.idtoken) {
      idToken = req.headers.idtoken;
    } else if (req.query.id_token) {
      idToken = req.query.id_token;
    }

    let client_id = req.headers.clientid;

    if (!client_id) {
      client_id = config.oAuth.client_id;
    }

    if (!config.oAuth.allowed_client_ids.includes(client_id)) {
      reject({ message: "Client is not authorized to access this application with provided client id" });
    }

    if (idToken == "") {
      reject({ message: "Missing or invalid token" });
    } else {
      const { OAuth2Client } = require("google-auth-library");
      const client = new OAuth2Client(client_id);
      async function verify() {
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          //audience: client_id
        });
        const payload = ticket.getPayload();

        resolve(payload);
      }

      verify().catch((error) => {
        console.error(error);
        reject({ message: "Unable to verify token" });
      });
    }
  });
};

exports.setRefreshToken = async function (req) {
  return new Promise(async (resolve, reject) => {
    const code = req.code || "";
    const redirectUrl = req.redirectUrl || "";
    const oauth2Client = new google.auth.OAuth2(config.oAuth.client_id, config.oAuth.client_secret, redirectUrl);

    if (code) {
      const { tokens } = await oauth2Client.getToken(code).catch((error) => {
        console.error(error);
        reject(error);
      });

      const info = await oauth2Client.getTokenInfo(tokens.access_token);

      if (tokens.refresh_token) {
        await usersModel.updateRefreshToken(info.sub, tokens.refresh_token).catch((error) => {
          console.error(error);
          reject(error);
        });
        console.log("STORED REFRESH TOKEN");
        resolve(true);
      } else {
        reject({ message: "Missing or invalid refresh token" });
      }
    } else {
      reject({ message: "Missing or invalid code" });
    }
  });
};

exports.getAuthClient = async function (req) {
  return new Promise(async (resolve, reject) => {
    const userId = req.userId || 0;
    const accessToken = req.accessToken || "";
    const client = new google.auth.OAuth2(config.oAuth.client_id, config.oAuth.client_secret);

    if (!userId) {
      return reject({ message: "Missing or invalid user id" });
    }

    const refreshToken = await usersModel.getRefreshToken(userId).catch((error) => {
      console.error(error);
      reject(error);
    });

    if (!refreshToken) {
      return reject({ message: "Missing or invalid refresh token" });
    }

    if (refreshToken) {
      client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken.refreshToken,
      });

      const token = await client.getAccessToken().catch((error) => {
        console.error(error);
        reject(error);
      });

      if (token) {
        const scopes = await client.getTokenInfo(token.token).catch((error) => {
          console.error(error);
          reject(error);
        });

        if (scopes.scopes) {
          client.setCredentials({ access_token: token.token, scope: scopes.scopes.join(" ") });
          resolve(client);
        }
      }
    }
  });
};
