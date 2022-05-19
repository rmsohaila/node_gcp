"use strict";

const mysql = require("mysql");
const tableDataTransformer = require("../transformers/tableData");

var email = function (email) {
  this.id = email.id;
  this.created = email.created;
  this.type = {};
  this.type.id = email.typeId;
  this.type.name = email.type;
  this.reportId = email.reportId;
  this.emailAddress = email.emailAddress;
};

email.getEmails = async function (db, reportId, query) {
  const countSelect = `
    SELECT
      COUNT(DISTINCT el.id) count
    FROM Storage_Report_Email_Logs el
  `;
  var select = `
        SELECT 
            el.id, 
            el.created, 
            el.typeId, 
            elt.name as type, 
            el.reportId,
            el.emailAddress
        FROM Storage_Report_Email_Logs el
        LEFT JOIN Storage_Report_Email_Log_Types elt
        ON el.typeId = elt.id
    `;
  var limit = query.limit ? " LIMIT " + query.limit : "";
  var orderBy = query.orderBy ? " ORDER BY " + query.orderBy : "";
  var order = query.order ? " " + query.order : "";
  var offset = query.offset ? " OFFSET " + query.offset : "";
  var search = query.search ? query.search.replace(/'/g, "''") : "";
  var where = ` WHERE el.reportId = ` + reportId + ``;
  if (search !== "") {
    where += ` AND el.emailAddress LIKE ` + mysql.escape("%" + search + "%") + ``;
  }
  let sqlString = (query.getCount == "true" ? countSelect + where + "; " : "") + select + where;
  return new Promise((resolve, reject) => {
    db.query(sqlString + orderBy + order + limit + offset, [], (err, results) => {
      if (err) {
        console.error(err);
        reject({ message: "Failed to get emails: Unexpected database error" });
      } else {
        let emails = tableDataTransformer.formatResults(results);
        resolve(emails);
      }
    });
  });
};

email.getHistoryCount = async function (db, reportId) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT COUNT(id) FROM Storage_Report_Email_Logs WHERE reportId = ?;`, [reportId], (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed to get total history email count by report id: Unexpected database error",
        });
      } else {
        resolve(results[0]);
      }
    });
  });
};

email.getActionEmails = async function (db, query) {
  var select = `
        SELECT Storage_Report_User_Flags.created, Storage_Report_Users.email, Storage_Report_Email_Log_Types.name
        FROM Storage_Report_User_Flags
        JOIN Storage_Report_Users
        ON Storage_Report_User_Flags.googleId = Storage_Report_Users.googleId
    `;
  var limit = query.limit ? " LIMIT " + query.limit : "";
  var orderBy = query.orderBy ? " ORDER BY " + query.orderBy : "";
  var order = query.order ? " " + query.order : "";
  var offset = query.offset ? " OFFSET " + query.offset : "";
  var search = query.search ? query.search.replace(/'/g, "''") : "";
  var where = "";
  if (search !== "") {
    where += ` WHERE Storage_Report_Users.email LIKE ` + mysql.escape("%" + search + "%") + ``;
  }
  return new Promise((resolve, reject) => {
    db.query(select + where + orderBy + order + limit + offset, [], (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed to get results from Storage_Report_User_Flags: Unexpected database error",
        });
      } else {
        resolve(results);
      }
    });
  });
};

email.updateEmailSent = async function (db, googleId) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE Storage_Report_User_Flags SET emailSent = CURRENT_TIMESTAMP WHERE googleId = ?`,
      [googleId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to update emailSent in Storage_Report_User_Flags: Unexpected database error",
          });
        } else {
          resolve(results);
        }
      }
    );
  });
};

email.getFlag = async function (db, id) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            SELECT Storage_Report_User_Flags.googleId, Storage_Report_User_Flags.usageStorage, Storage_Report_User_Flags.id AS flagId FROM Storage_Report_User_Flags
            LEFT JOIN Storage_Report_Users
            ON Storage_Report_Users.googleId = Storage_Report_User_Flags.googleId
            WHERE Storage_Report_User_Flags.id = ?
            LIMIT 1;
        `,
      [id],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to get flag from Storage_Report_User_Flags: Unexpected database error",
          });
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};

email.getFlagByGoogleId = async function (db, googleId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            SELECT Storage_Report_User_Flags.googleId, Storage_Report_User_Flags.emailSent, 
            Storage_Report_User_Flags.usageStorage, Storage_Report_User_Flags.id AS flagId FROM Storage_Report_User_Flags
            LEFT JOIN Storage_Report_Users
            ON Storage_Report_Users.googleId = Storage_Report_User_Flags.googleId
            WHERE Storage_Report_User_Flags.googleId = ?
            LIMIT 1;
        `,
      [googleId],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to get flag from Storage_Report_User_Flags: Unexpected database error",
          });
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};

email.addFlag = async function (db, user, reportId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
            INSERT INTO Storage_Report_User_Flags (googleId, usageStorage, driveTrashed, firstName, lastName, email, reportId) 
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
      [
        user.googleId.substring(0, 24),
        user.totalStorage,
        user.trashedStorage,
        user.firstName.substring(0, 255),
        user.lastName.substring(0, 255),
        user.email.substring(0, 100),
        reportId,
      ],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to insert into Storage_Report_User_Flags: Unexpected database error",
          });
        } else {
          resolve(results.insertId);
        }
      }
    );
  });
};

email.deleteFlag = async function (db, googleId) {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM Storage_Report_User_Flags WHERE googleId = ?`, [googleId], (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed delete flag from Storage_Report_User_Flags: Unexpected database error",
        });
      } else {
        resolve(googleId);
      }
    });
  });
};

email.addEmail = async function (db, typeId, reportId, emailAddress) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Storage_Report_Email_Logs ( typeId, reportId, emailAddress ) VALUES ( ?, ?, ?)`,
      [typeId, reportId, emailAddress.substring(0, 128)],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get emails: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

email.getEmailCustomData = async function (db, emailName, reportId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      SELECT
      id,
      headerUrl,
      paragraphs,
      footerLines
      FROM Storage_Report_Custom_Emails
      WHERE name = '${emailName}'
      AND reportId = ${reportId}
      LIMIT 1
      `,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to get custom email data: Unexpected database error" });
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};

email.saveEmailCustomization = async function (db, emailCustomization, reportId) {
  let headerUrl = null;
  if (emailCustomization.headerUrl) headerUrl = `${mysql.escape(emailCustomization.headerUrl)}`;
  let paragraphs = null;
  if (emailCustomization.paragraphs) paragraphs = `${mysql.escape(JSON.stringify(emailCustomization.paragraphs))}`;
  let footerLines = null;
  if (emailCustomization.footerLines) footerLines = `${mysql.escape(JSON.stringify(emailCustomization.footerLines))}`;
  return new Promise((resolve, reject) => {
    db.query(
      `
      INSERT INTO Storage_Report_Custom_Emails ( reportId, name, headerUrl, paragraphs, footerLines )
      VALUES ( ${reportId}, '${emailCustomization.name.substring(0, 45)}', ${headerUrl.substring(
        0,
        2048
      )} , ${paragraphs}, ${footerLines})
      ON DUPLICATE KEY UPDATE headerUrl = ${headerUrl.substring(
        0,
        2048
      )}, paragraphs = ${paragraphs}, footerLines = ${footerLines}
    `,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to save custom email data: Unexpected database error" });
        } else {
          if (results) {
            resolve(results);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

email.deleteEmailCustomization = async function (db, emailId) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      DELETE FROM Storage_Report_Custom_Emails
      WHERE id = ${emailId}
      `,
      (err) => {
        if (err) {
          console.error(error);
          reject({ message: "Failed to delete custom email data: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

module.exports = email;
