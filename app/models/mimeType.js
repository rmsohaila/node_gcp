"use strict";

const mysql = require("mysql");
const dateFormat = require("dateformat");
const dateMask = "yyyy-mm-dd hh:MM:ss";

const mimeType = function (mimeType) {
  this.id = mimeType.id;
  this.name = mimeType.name;
};

const mimeTypeSelect = `SELECT
    mt.id,
    mt.name
    FROM MimeType_Types AS mt`;

mimeType.getMimeTypeById = async function (db, mimeTypeId) {
  return new Promise((resolve, reject) => {
    db.query(
      `${mimeTypeSelect}  
            WHERE id = ${mimeTypeId} 
            LIMIT 1`,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to get Mime Type: Unexpected database error",
          });
        } else {
          if (results && results.length == 1) {
            resolve(new mimeType(results[0]));
          } else {
            reject({ message: "Mime Type not found" });
          }
        }
      }
    );
  });
};

// Escaping the name isn't really necessary (name comes from Google directly)
// but it's safer this way
mimeType.getMimeTypeByName = async function (db, mimeTypeName) {
  return new Promise((resolve, reject) => {
    db.query(`${mimeTypeSelect} WHERE driveId`, (err, results) => {
      if (err) {
        console.error(err);
        reject({
          message: "Failed to get Mime Type: Unexpected database error",
        });
      } else {
        if (results && results.length == 1) {
          resolve(new mimeType(results[0]));
        } else {
          reject({ message: "Mime Type not found" });
        }
      }
    });
  });
};

mimeType.getMimeTypesByFiles = async function (db, reportId, query) {
  let sqlString =  `
    SELECT DISTINCT mimeType
    FROM Storage_Report_User_Files AS files
    LEFT JOIN Storage_Report_Users AS users
    ON users.id = files.userId
    LEFT JOIN Storage_Report_Shared_Drives AS drives
    ON files.driveId = drives.id
    WHERE files.reportId = ${mysql.escape(reportId)}
  `;
  let md5ChecksumSearch = query.md5ChecksumSearch ? query.md5ChecksumSearch : "";
  let firstName = query.firstName ? query.firstName : "";
  let lastName = query.lastName ? query.lastName : "";
  let email = query.email ? query.email : "";
  let usage = query.usageSize ? query.usageSize : "";
  let ouSearch = query.ouSearch ? query.ouSearch : "";
  let lastViewedBefore = query.lastViewedBefore ? query.lastViewedBefore + "23:59:59" : "";
  let lastViewedAfter = query.lastViewedAfter ? query.lastViewedAfter + "00:00:00" : "";
  let sharedDrive = query.sharedDrive ? query.sharedDrive :  "";
  let trash = query.hideTrashed === "true" ? " AND files.trashed = 0 " : "";
  let driveId = query.driveId && query.driveId !== "" && query.driveId !== "0" ? " AND files.driveId = " + parseInt(query.driveId) : "";
  let search = ``;
  search += md5ChecksumSearch && md5ChecksumSearch !== "" ? ` AND files.md5Checksum = ` + mysql.escape(md5ChecksumSearch) : ``;
  search +=
    firstName && firstName !== ""
      ? ` AND users.firstName LIKE ` + mysql.escape(firstName + `%`)
      : ``;
  search +=
    lastName && lastName !== ""
      ? ` AND users.lastName LIKE ` + mysql.escape(lastName + `%`)
      : ``;
  search +=
    email && email !== "" ? `AND users.email LIKE ` + mysql.escape(email + `%`) : ``;
  search +=
    ouSearch && ouSearch !== `/` !== "" ? `AND users.OU LIKE ` + mysql.escape(ouSearch + `%`) : ``;
  search +=
    sharedDrive && sharedDrive !== ""
      ? " AND drives.name LIKE " + mysql.escape(sharedDrive + `%`)
      : "";
  search +=
    query.fileName && query.fileName !== ""
      ? ` AND files.name LIKE ` + mysql.escape(query.fileName + `%`)
      : ``;
  search +=
    lastViewedBefore && lastViewedBefore !== ""
      ? ` AND files.viewedByMeTime < DATE_SUB(` +
        mysql.escape(dateFormat(lastViewedBefore, dateMask)) +
        `, INTERVAL 1 DAY)`
      : ``;
  search +=
    lastViewedAfter && lastViewedAfter !== ""
      ? ` AND files.viewedByMeTime > DATE_ADD(` +
        mysql.escape(dateFormat(lastViewedAfter, dateMask)) +
        `, INTERVAL 1 DAY)`
      : ``;
  
  if (usage && usage !== "") {
    if (usage === "0") {
      search += ` AND files.storageMb >= 0`;
    } else {
      search += ` AND files.storageMb >= (` + mysql.escape(usage) + `*1024)`;
    }
  }
  sqlString = sqlString + search + trash + driveId;
  return new Promise((resolve, reject) => {
    db.query(sqlString,
      (err, results) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to get Mime Types by files: Unexpected database error",
          });
        } else {
          resolve(results);
        }
      }
    );
  });
};

mimeType.deleteXrefByReportId = async function (db, reportId) {
  return new Promise((resolve, reject) => {
    db.query(
      `DELETE FROM Storage_Report_MimeType_Xref
    WHERE reportId = ${reportId}`,
      (err) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to delete by report id in Storage_Report_MimeType_Xref: Unexpected database error",
          });
        } else {
          resolve(true);
        }
      }
    );
  });
};

mimeType.syncMimeTypes = async function (db, reportId) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO MimeType_Types (name)
      SELECT DISTINCT csruf.mimeType FROM Storage_Report_User_Files AS csruf
      LEFT JOIN MimeType_Types AS mt
      ON csruf.mimeType = mt.name
      WHERE csruf.reportId = ${reportId}
      AND mt.name IS NULL;
      INSERT INTO Storage_Report_MimeType_Xref (reportId, mimeTypeId)
      SELECT DISTINCT ${reportId}, mt.id FROM Storage_Report_User_Files AS csruf
      LEFT JOIN MimeType_Types AS mt
      ON csruf.mimeType = mt.name
      WHERE csruf.reportId = ${reportId}
      AND mt.name IS NOT NULL;
    `,
      (err) => {
        if (err) {
          console.error(err);
          reject({
            message: "Failed to insert Mime Type(s): Unexpected database error",
          });
        } else {
          resolve(true);
        }
      }
    );
  });
};

module.exports = mimeType;
