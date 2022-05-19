const customerModel = require("../models/customer/customer");
const tenantDatabaseModel = require("../models/customer/tenantDatabase");
const tenantDB = require("./tenant");

module.exports = msAuth;
//keeps the console.logs from getting too chatty
let bypassSecurityMessage = false;

async function msAuth(req, res, next) {

//Look for micro-services
if(req.path.startsWith("/micro-services")){
    //We need the customer info added to the request for the micro-service.
    const customerId = req.headers.authorization.split(" ")[2];
    if(customerId){
      const customer = await customerModel.getCustomer(customerId).catch((error) => {
        res.status(500).json(error);
        console.error(error);
      });

      if(customer){
        req.customer = customer;
  
        /* Look for tenant DB */
        let tenantDBConn = null;
        if (customer.tenantEnabled) {
          tenantDBConn = await tenantDatabaseModel
            .getTenantDatabase(customer.id, customer.tenantDatabase.id)
            .catch((error) => {
              //console.error(error);
            });
        }
    
        req.db = new tenantDB(tenantDBConn);

        if(!bypassSecurityMessage){
          //I still want to see this for now but not on every call.
          bypassSecurityMessage = true;
          console.log("Bypassing micro service security - dev");
        }
        
        return next();
      }
    }else{
      res.status(403).json({ message: "Missing customer Id" });
    }
  }else{
    return next();
  }
}