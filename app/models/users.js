"use strict";

const config = require("../../config/config");
const db = require("../../config/db");

let user = function (user) {
  this.id = user.id;
  this.created = user.created;
  this.googleID = user.googleID;
  this.firstName = user.firstName;
  this.lastName = user.lastName;
  this.email = user.email;
  this.euaSigned = user.euaSigned;
  this.refreshToken = user.refreshToken;
};

user.getUser = function (googleID) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, created, googleID, firstName, lastName, email, euaSigned FROM Users WHERE googleID = ?`,
      [googleID],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get user: Unexpected database error" });
        } else {
          if (results.length) {
            resolve(new user(results[0]));
          } else {
            reject({ message: "User not found by GoogleId: " + googleID });
          }
        }
      }
    );
  });
};

user.getUserById = function (id) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT id, created, googleID, firstName, lastName, email, euaSigned FROM Users WHERE id = ?`,
      [id],
      (err, results) => {
        if (err) {
          reject({ message: "Failed to get user: Unexpected database error" });
        } else {
          if (results.length != 1) {
            reject({ message: "User not found by id" });
          } else {
            resolve(new user(results[0]));
          }
        }
      }
    );
  });
};

user.addUser = function (payload) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Users (googleID, firstName, lastName, email) VALUES (?, ?, ?, ?)`,
      [
        payload["sub"].substring(0, 64),
        payload["given_name"].substring(0, 64),
        payload["family_name"].substring(0, 64),
        payload["email"].substring(0, 128),
      ],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to add user: Unexpected database error" });
        } else {
          resolve(results.insertId);
        }
      }
    );
  });
};

user.approveEua = function (userId) {
  return new Promise((resolve, reject) => {
    db.query(`UPDATE Users SET euaSigned = CURRENT_TIMESTAMP WHERE id = ?`, [userId], (err) => {
      if (err) {
        console.error(err);
        reject({ message: "Failed to update user: Unexpected database error" });
      } else {
        resolve(true);
      }
    });
  });
};

user.updateRefreshToken = function (googleUserId, refreshToken) {
  const encryptionKey = config.encryption.key;
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE Users SET refreshToken = AES_ENCRYPT("${refreshToken}", "${encryptionKey}") WHERE googleID = ${googleUserId}`,
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update refresh token: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

user.getRefreshToken = function (userId) {
  const encryptionKey = config.encryption.key;
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        CASE WHEN refreshToken IS NOT NULL THEN CAST(AES_Decrypt(refreshToken, "${encryptionKey}") AS CHAR(5000) CHARACTER SET utf8) END AS refreshToken
        FROM Users
        WHERE id = ${userId}
        LIMIT 1`,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to retrieve refresh token: Unexpected database error" });
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};

module.exports = user;