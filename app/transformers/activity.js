"use strict";

const camelcase = require("camelcase");
const util = require("../helpers/utils");

exports.transformMeetingItems = async function (meetingItems) {
  let items = [];
  for (let meetingItem of meetingItems) {
    let item = {};
    let time = null;
    if (meetingItem.id.time) {
      time = util.splitDateTime(meetingItem.id.time);
    }
    item.time = time;
    item.callerType = meetingItem.actor.callerType;
    item.email = meetingItem.actor.email;
    for (let param of meetingItem.events[0].parameters) {
      let value = param[Object.keys(param)[1]];
      switch (Object.keys(param)[1]) {
        case "intValue":
          value = parseInt(value);
          break;
        case "boolValue":
          value = +value;
        default:
          break;
      }
      item[camelcase(param.name)] = value;
    }
    items.push(item);
  }
  return items;
};
