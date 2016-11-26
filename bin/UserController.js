"use strict";
var crypto = require("crypto");
var USER_COLLECTION = "users";
var UserController = (function () {
    function UserController(inDatabase) {
        this.database = inDatabase;
    }
    UserController.prototype.createUser = function (username, password, callback) {
        var _this = this;
        crypto.randomBytes(256, function (err, buf) {
            if (err == null) {
                var salt_1 = buf.toString();
                var secret = crypto.pbkdf2(password, salt_1, 10000, 512, 'sha512', function (err, result) {
                    if (err == null) {
                        var secret_1 = result.toString();
                        var user = {
                            username: username,
                            salt: salt_1,
                            secret: secret_1
                        };
                        _this.database.collection(USER_COLLECTION).insertOne(user, function (err, result) {
                            if (error == null) {
                                callback(201, "Successfully created user ${ username }");
                            }
                        });
                    }
                    else {
                        callback(501, "Internal failure");
                    }
                });
            }
            else {
                callback(501, "Internal Failure");
            }
        });
    };
    UserController.prototype.authenticateUser = function (username, password, callback) {
        this.database.collection(USER_COLLECTION).findOne({
            username: username
        }, function (err, result) {
            if (err == null) {
                var user_1 = result;
                var salt = user_1.salt;
                crypto.pbkdf2(password, salt, 10000, 512, 'sha512', function (err, result) {
                    if (err == null) {
                        var hash = result.toString();
                        if (hash == user_1.secret) {
                            callback(true, user_1);
                        }
                        else {
                            callback(false, null);
                        }
                    }
                });
            }
            else {
                callback(false, null);
            }
        });
    };
    return UserController;
}());
exports.UserController = UserController;
