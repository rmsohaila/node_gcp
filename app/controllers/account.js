"use strict";

const config = require("../../config/config");
const authController = require("./auth");
const domainsModel = require("../models/domains");
const usersModel = require("../models/users");
const customerModel = require("../models/customer/customer");
const contactModel = require('../models/customer/contact');

exports.getAccount = async function (req, results) {
  //Authorize the request
  const payload = await authController.getAuth(req).catch((error) => {
    results.send(error);
  });

  //using the authorization results... get domain data
  var domainName = payload["email"].substring(payload["email"].lastIndexOf("@") + 1);
  const domain = await domainsModel.getDomain(domainName).catch((error) => {
    results.send(error);
  });

  //using the authorization results... get user data
  var googleID = payload["sub"];
  const user = await usersModel.getUser(googleID).catch((error) => {
    results.send(error);
  });

  const approvedContacts = await contactModel.getTosApproved(domain.customerId).catch((error) => {
    results.status(500).json(error);
  });

  const customer = await customerModel.getCustomer(domain.customerId).catch((error) => {
    results.status(500).json(error);
  });

  if (customer) {
    //build the response object
    var returnResponse = {
      domain: domain,
      customer: customer,
      user: user,
      tos: approvedContacts,
    };

    results.json(returnResponse);
  }
};
