const express = require("express");
const app = express();
const cors = require("cors");
const srAuth = require("./app/helpers/auth-storage-reports");
const msAuth = require("./app/helpers/auth-micro-services");
const saAuth = require("./app/helpers/auth-super-admin");

const config = require("./config/config.js");

const PORT = process.env.PORT || config.app.port;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

//Basic auth for the storage-reports
app.use(srAuth);

//Basic auth for the micro-services
//  (srAuth allows /micro-services to bypass checks)
app.use(msAuth);

//Basic auth for Google Admin only routes
app.use(saAuth);

const home = require("./app/routes/home"); //importing route
home(app); //register the route

const login = require("./app/routes/login");
login(app);

const account = require("./app/routes/account");
account(app);

const reports = require("./app/routes/reports");
reports(app);

const emails = require("./app/routes/emails");
emails(app);

const files = require("./app/routes/files");
files(app);

const drives = require("./app/routes/drives");
drives(app);

const freeTrial = require("./app/routes/freeTrial");
freeTrial(app);

const remote = require("./app/routes/remote");
remote(app);

/* NEW ROUTE CONTROLLERS */
const storage = require("./app/routes/reports/storage");
storage(app);

const customer = require("./app/routes/customer");
customer(app);

const jobs = require("./app/routes/jobs");
jobs(app);

const microServices = require("./app/routes/micro-services");
microServices(app);

const analytics = require("./app/routes/analytics");
analytics(app);

const chromeOsDevices = require("./app/routes/analytics/chromeOsDevice");
chromeOsDevices(app);

const meetings = require("./app/routes/analytics/meeting");
meetings(app);

const classroom = require("./app/routes/classroom");
classroom(app);

const automation = require("./app/routes/automation");
automation(app);