const { google } = require("googleapis");
const https = require("https");

class googleAuth {
  constructor() {}

  static getAccessToken(credentials, scopes) {
    //Old code could have an access key that starts and end with quotes...
    let accessKey = credentials.accessKey ? credentials.accessKey[0] == "\"" ? credentials.accessKey.substring(1, credentials.accessKey.length - 1) : credentials.accessKey : null;
    return new Promise((resolve, reject) => {
      const jwtClient = new google.auth.JWT(
        credentials.serviceEmail,
        null,
        accessKey,
        scopes,
        credentials.delegateEmail
      );
      jwtClient.authorize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(jwtClient);
        }
      });
    });
  }

  static googleReq(accessToken, host, path, method = "GET") {
    return new Promise((resolve, reject) => {
      let options = {
        host: host,
        port: 443,
        path: path,
        method: method,
        headers: { Authorization: "Bearer " + accessToken },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (d) => {
          data += d;
        });

        res.on("end", () => {
          if (res["statusCode"] == 200) {
            resolve(JSON.parse(data));
          } else {
            reject(data);
          }
        });
      });

      req.on("error", (error) => {
        reject({ message: error });
        console.error(error);
      });

      req.end();
    });
  }
}

module.exports = googleAuth;
