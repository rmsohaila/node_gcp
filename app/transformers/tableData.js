"use strict";

exports.formatResults = function (resultsFromDb, returnObject = {}) {
  let table = {};
  table.data = [];
  if (resultsFromDb.length > 0) {
    if (resultsFromDb[0][0]) {
      table.count = resultsFromDb[0][0]["count"];
      for (let resultFromDb of resultsFromDb[1]) {
        if (returnObject.length) {
          table.data.push(new returnObject(resultFromDb));
        } else {
          table.data.push(resultFromDb);
        }
      }
    } else {
      for (let resultFromDb of resultsFromDb) {
        if (returnObject.length) {
          table.data.push(new returnObject(resultFromDb));
        } else {
          table.data.push(resultFromDb);
        }
      }
    }
  }
  return table;
};
