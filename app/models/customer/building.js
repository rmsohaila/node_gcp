"use strict";

const tableDataTransformer = require("../../transformers/tableData");
const mysql = require("mysql");

let building = function (building) {
  this.id = building.id;
  this.created = building.created;
  this.customerId = building.customerId;
  this.googleId = building.googleId;
  this.name = building.name;
  this.description = building.description;
  this.ou = building.ou;
  this.groupKey = building.groupKey;
};

const selectString = `
SELECT 
  id,
  created,
  customerId,
  googleId,
  name,
  description,
  ou,
  groupKey
FROM Buildings`;

building.getBuildings = function (db, customerId, query) {
  const limit = query.limit ? ` LIMIT ${parseInt(query.limit)}` : "";
  const offset = query.offset ? ` OFFSET ${parseInt(query.offset)}` : "";
  let search = ` WHERE customerId = ${customerId}`;

  search += query.name && query.name !== "" ? ` AND name LIKE ${mysql.escape(query.name + `%`)}` : ``;

  const countSelect = `
    SELECT
     COUNT(DISTINCT id) count
    FROM Buildings
    ${search};
  `;

  let sqlString = (query.getCount == "true" ? countSelect : "") + selectString + search + limit + offset;

  return new Promise((resolve, reject) => {
    db.query(sqlString, [customerId], (err, results) => {
      if (err) {
        console.error(err);
        reject({ message: "Failed to get buildings - database error" });
      } else {
        let buildings = tableDataTransformer.formatResults(results, building);
        resolve(buildings);
      }
    });
  });
};

building.createBuilding = function (db, customerId, building) {
  //including customerId removes the requirement
  //  of checking if the user is owner the building before delete
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Buildings (
        customerId,
        googleId,
        name,
        description,
        ou,
        groupKey
      ) VALUES (
        ?,?,?,?,?,?
      )`,
      [
        customerId,
        building.googleId.trim().substring(0, 512),
        building.name.trim().substring(0, 128),
        building.description.trim().substring(0, 512),
        building.ou.trim().substring(0, 1024),
        building.groupKey.trim().substring(0, 512),
      ],
      (err, results) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to insert building: Unexpected database error" });
        } else {
          building.id = results.insertId;
          resolve(building);
        }
      }
    );
  });
};

building.updateBuilding = function (db, customerId, building) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE Buildings SET
        name = ?,
        description = ?,
        ou = ?,
        groupKey = ?
      WHERE customerId = ?
      AND id = ?`,
      [
        building.name ? building.name.trim().substring(0, 128) : null,
        building.description ? building.description.trim().substring(0, 512) : null,
        building.ou ? building.ou.trim().substring(0, 1024) : null,
        building.groupKey ? building.groupKey.trim().substring(0, 512) : null,
        customerId,
        building.id,
      ],
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to update building: Unexpected database error" });
        } else {
          resolve(building);
        }
      }
    );
  });
};

building.deleteBuilding = function (db, customerId, buildingId) {
  //including customerId removes the requirement
  //  of checking if the user is owner the building before delete
  return new Promise((resolve, reject) => {
    db.query(
      `DELETE FROM Buildings
      WHERE customerId = ?
      AND id = ?`,
      [customerId, buildingId],
      (err) => {
        if (err) {
          console.error(err);
          reject({ message: "Failed to delete building: Unexpected database error" });
        } else {
          resolve(true);
        }
      }
    );
  });
};

module.exports = building;
