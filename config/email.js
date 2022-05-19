//npm install postmark --save
// Require:
var postmark = require("postmark");
const config = require('./config.js');

// Send an email:
var client = new postmark.ServerClient(config.email.api.key);

module.exports = client;