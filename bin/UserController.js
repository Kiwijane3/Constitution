"use strict";
var MongoDB = require("mongodb");
var MongoClient = MongoDB.MongoClient;
var crypto = require("crypto");
var USER_COLLECTION = "users";
var databaseUrl = "mongodb://localhost:27017/Constitution";
var UserController = (function () {
    function UserController() {
        var _this = this;
        MongoClient.connect(databaseUrl, function (err, db) {
            if (err == null && db != null) {
                _this.database = db;
                console.log("The DocumentDB has connected to the database.");
            }
            else {
                console.log("The DocumentDB encountered an error while connecting to the database");
            }
        });
    }
    UserController.prototype.createUser = function (username, password, callback) {
        var _this = this;
        this.database.collection(USER_COLLECTION).findOne({
            username: username
        }, function (error, result) {
            if (error != null) {
                callback(501, "Internal failure: " + error.message);
            }
            else if (result != null) {
                callback(409, null, "Username is taken");
            }
            else {
                crypto.randomBytes(256, function (error, buf) {
                    if (error == null) {
                        var salt_1 = buf.toString();
                        var secret = crypto.pbkdf2(password, salt_1, 10000, 512, 'sha512', function (error, result) {
                            if (error == null) {
                                var secret_1 = result.toString();
                                var user = {
                                    username: username,
                                    salt: salt_1,
                                    secret: secret_1
                                };
                                _this.database.collection(USER_COLLECTION).insertOne(user, function (error, result) {
                                    if (error == null) {
                                        callback(201, { username: username });
                                    }
                                    else {
                                        callback(501, null, "Internal failure: " + error.message);
                                    }
                                });
                            }
                            else {
                                callback(501, null, "Internal failure: " + error.message);
                            }
                        });
                    }
                    else {
                        callback(501, null, "Internal failure: " + error.message);
                    }
                });
            }
        });
    };
    UserController.prototype.authenticateUser = function (username, password, callback) {
        this.database.collection(USER_COLLECTION).findOne({
            username: username
        }, function (error, result) {
            if (error != null) {
                callback(501, null, "Internal failure: " + error.message);
            }
            else if (result == null) {
                callback(404, null, "User not found");
            }
            else {
                var user_1 = result;
                var salt = user_1.salt;
                crypto.pbkdf2(password, salt, 10000, 512, 'sha512', function (error, result) {
                    if (error == null) {
                        var hash = result.toString();
                        if (hash == user_1.secret) {
                            callback(200, user_1);
                        }
                        else {
                            callback(401, null, "Incorrect password");
                        }
                    }
                    else {
                        callback(501, null, "Internal Failure: " + error.message);
                    }
                });
            }
        });
    };
    UserController.prototype.doesUserExist = function (username, callback) {
        this.database.collection(USER_COLLECTION).findOne({
            username: username
        }, function (error, result) {
            if (error == null && result != null) {
                callback(true);
            }
            else {
                callback(false);
            }
        });
    };
    return UserController;
}());
exports.UserController = UserController;
