'use strict';

const db = require('../../config/db');

var userlog = function(userlog) {
    this.id            = userlog.id;
    this.userID        = user.userID;
    this.userLogTypeID = user.userLogTypeID;
}

userlog.addUserLog = function(userID, userLogTypeID) {
    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO User_Logs (userID, userLogTypeID) VALUES (?, ?)', 
            [userID, userLogTypeID],
            (err, results) => {
                if(err){
                    reject({ message: 'Failed to add user log: Unexpected database error' });
                }else{
                    resolve(results);
                }
            }
        );
    });
}

module.exports = userlog;