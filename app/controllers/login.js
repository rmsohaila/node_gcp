"use strict";

const authController = require("./auth");
const domainsModel = require("../models/domains");
const usersModel = require("../models/users");
const loginModel = require("../models/login");
const customerModel = require("../models/customer/customer");
const contactModel = require("../models/customer/contact");
const userLogModel = require("../models/userLogs");
const enums = require("../helpers/enums");

exports.getUserModules = async function (req, results) {
  //Authorize the request
  const payload = await authController.getAuth(req).catch((error) => {
    results.send(error);
    return;
  });

  if (payload) {
    var userModules = {
      result: 1,
      message: "Modules retrieved",
      userModules: [],
      customerID: "",
      exp: payload.exp,
    };
    //using the authorization results... get domain data
    var domainName = payload["email"].substring(payload["email"].lastIndexOf("@") + 1);
    const domain = await domainsModel.getDomain(domainName).catch((error) => {
      results.status(500).json(error);
    });

    if (!domain) {
      return;
    }

    if (domain.id == 0) {
      results.json({ message: "Domain is not registered" });
      return;
    }

    const customer = await customerModel.getCustomer(domain.customerId).catch((error) => {
      results.status(500).json(error);
    });
    if (customer) {
      if (!customer.subscription.expired) {
        userModules.customer = customer;

        // get user
        let user = await usersModel.getUser(payload["sub"]).catch((error) => {
          //no need to do anything here --- really the code will keep going and add the user.
          //results.status(500).json(error);
        });

        if (!user) {
          let userId = await usersModel.addUser(payload).catch((error) => {
            results.status(500).json(error);
          });
          user = await usersModel.getUserById(userId).catch((error) => {
            results.status(500).json(error);
          });
        }

        user["photoUrl"] = payload.picture;

        userModules["user"] = user;

        //check if TOS = required
        const approvedContacts = await contactModel.getTosApproved(domain.customerId).catch((error) => {
          results.status(500).json(error);
        });

        if (approvedContacts.length) {
          userModules["tos"] = "accepted";
        } else {
          const custContact = await contactModel.getCustomerContact(user.email).catch((error) => {
            results.status(500).json(error);
          });

          if (custContact.id == 0) {
            userModules["tos"] = "required";
          } else {
            userModules["tos"] = "available";
          }
        }

        userModules["modules"] = await loginModel.getUserModules(user.id).catch((error) => {
          results.status(500).json(error);
        });

        var scopes = await loginModel.getUserModuleScopes(user.id).catch((error) => {
          results.status(500).json(error);
        });

        if (scopes) {
          userModules["scopes"] = scopes;

          results.json(userModules);

          await userLogModel.addUserLog(user.id, enums.UserLogType.LOGIN).catch((error) => {
            console.error(error);
          });
        }
      } else {
        let message = "Your subscription " + (!customer.subscription.id ? "has not been setup yet" : "has expired");
        message += ".  Please contact help@example.com for further assistance";
        results.status(500).json({ message: message });
      }
    }
  }
};

exports.approveTos = async function (req, results) {
  //Authorize the request
  const payload = await authController.getAuth(req).catch((error) => {
    results.status(500).json(error);
  });

  if (payload) {
    //using the authorization results... get domain data
    var domainName = payload["email"].substring(payload["email"].lastIndexOf("@") + 1);
    const domain = await domainsModel.getDomainByName(domainName).catch((error) => {
      results.status(500).json(error);
    });

    if (domain) {
      const user = await usersModel.getUser(payload.sub).catch((error) => {
        results.status(500).json(error);
      });

      if (user) {
        //check if TOS = required
        const approvedContacts = await contactModel.getTosApproved(domain.customerId).catch((error) => {
          results.status(500).json(error);
        });

        if (approvedContacts) {
          if (!approvedContacts.length) {
            const approved = await contactModel
              .approveTos(domain.customerId, user.email, req.query.signature)
              .catch((error) => {
                results.status(500).json(error);
              });

            if (approved) {
              //Still need to update the subscriptionExpires on the customers table
              var customerUpdated = await customerModel.updateSubscriptionApproveTos(domain.customerId).catch((error) => {
                results.status(500).json(error);
              });

              if (customerUpdated) {
                results.json(approved);
              }
            }
          } else {
            results.json({ message: "Organization has already been approved" });
          }
        }
      }
    }
  }
};

exports.approveEua = async function (req, results) {
  //Authorize the request
  const payload = await authController.getAuth(req).catch((error) => {
    results.send(error);
    return;
  });

  //using the authorization results... get domain data
  var domainName = payload["email"].substring(payload["email"].lastIndexOf("@") + 1);
  const domain = await domainsModel.getDomain(domainName).catch((error) => {
    results.status(500).json(error);
  });

  if (!domain) {
    return;
  }

  if (domain.id == 0) {
    results.json({ message: "Domain is not registered" });
    return;
  }

  const user = await usersModel.getUser(payload.sub).catch((error) => {
    results.status(500).json(error);
    return;
  });

  if (!user) {
    results.json({ message: "User not found in user modules" });
    return;
  }

  //check if TOS = required
  const approved = await usersModel.approveEua(user.id).catch((error) => {
    results.status(500).json(error);
  });

  results.json(approved);
};

exports.getUserInfo = async function (req, res) {
  const payload = await authController.getAuth(req).catch((error) => {
    results.status(500).json(error);
  });

  if (payload) {
    res.json(payload);
  } else {
    res.json(null);
  }
};

exports.createUserAuthCode = async function (req, res) {
  /*userAuthCode = {
    code: 123,
    redirectUrl: "https://"
  }*/
  const userAuthCode = req.body;

  console.log(userAuthCode);

  const setRefreshToken = await authController.setRefreshToken(userAuthCode).catch((error) => {
    console.error(error);
    res.json(false);
  });

  if (setRefreshToken) {
    res.json(true);
  } else {
    res.json(false);
  }
};
