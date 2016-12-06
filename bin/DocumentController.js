"use strict";
var MongoDB = require("mongodb");
var MongoClient = MongoDB.MongoClient;
var Diff = require("diff");
var databaseUrl = "mongodb://localhost:27017/Constitution";
var DOCUMENT_COLLECTION = "document";
var DocumentController = (function () {
    function DocumentController(inUserController) {
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
        this.userController = inUserController;
    }
    DocumentController.prototype.createDocument = function (name, body, ownerName, password, callback) {
        var _this = this;
        this.getDocument(name, function (status, document) {
            if (status == 404) {
                _this.userController.authenticateUser(ownerName, password, function (code, result, error) {
                    if (code == 200) {
                        var history_1 = [];
                        var patches = [];
                        var voters = [];
                        var required = [];
                        var document_1 = {
                            name: name,
                            body: body,
                            history: history_1,
                            patches: patches,
                            owner: result.username,
                            voters: voters,
                            required: required
                        };
                        _this.database.collection(DOCUMENT_COLLECTION).insertOne(document_1, function (error, result) {
                            if (error == null) {
                                callback(201, document_1);
                            }
                            else {
                                callback(501, null, "Internal Failure: " + error.message);
                            }
                        });
                    }
                    else {
                        callback(code, null, "Authentication Failure: " + error);
                    }
                });
            }
            else {
                callback(409, null, "A document with that name already exists");
            }
        });
    };
    DocumentController.prototype.getDocument = function (documentName, callback) {
        this.database.collection(DOCUMENT_COLLECTION).findOne({ name: documentName }, function (error, result) {
            if (error != null) {
                callback(501, null, "Internal Failure: " + error.message);
            }
            else if (result == null) {
                callback(404, null);
            }
            else {
                callback(200, result);
            }
        });
    };
    DocumentController.prototype.addVoter = function (voterName, required, documentName, username, password, callback) {
        var _this = this;
        this.userController.doesUserExist(voterName, function (result) {
            _this.userController.authenticateUser(username, password, function (code, user, error) {
                if (code == 200) {
                    _this.database.collection(DOCUMENT_COLLECTION).findOne({
                        name: documentName
                    }, function (error, result) {
                        if (error != null) {
                            callback(501, "Internal Failure: " + error.message);
                        }
                        else if (result == null) {
                            callback(404);
                        }
                        else {
                            var document_2 = result;
                            if (document_2.owner == user.username) {
                                document_2.voters.push(voterName);
                                if (required) {
                                    document_2.required.push(voterName);
                                }
                                _this.database.collection(DOCUMENT_COLLECTION).updateOne({
                                    _id: document_2._id
                                }, document_2, function (error) {
                                    if (error == null) {
                                        return callback(200);
                                    }
                                    else {
                                        callback(501, "Internal Failure while updating: " + error.message);
                                    }
                                });
                            }
                            else {
                                callback(401, "You do not own that document");
                            }
                        }
                    });
                }
                else {
                    callback(code, error);
                }
            });
        });
    };
    DocumentController.prototype.submitPatch = function (documentName, patchName, patchBody, username, password, callback) {
        var _this = this;
        this.database.collection(DOCUMENT_COLLECTION).findOne({
            name: documentName
        }, function (error, result) {
            var document = result;
            if (error != null) {
                callback(501, "Internal Failure: " + error.message);
            }
            else if (result == null) {
                callback(404);
            }
            else {
                _this.userController.authenticateUser(username, password, function (code, user, error) {
                    if (code == 200) {
                        if (username == document.owner || document.voters.indexOf(username) > -1) {
                            var votes = [];
                            var patch = {
                                author: username,
                                name: patchName,
                                body: patchBody,
                                votes: votes
                            };
                            document.patches.push(patch);
                            _this.database.collection(DOCUMENT_COLLECTION).updateOne({
                                _id: document._id
                            }, document, function (error) {
                                if (error == null) {
                                    return callback(200);
                                }
                                else {
                                    callback(501, "Internal Failure while updating: " + error.message);
                                }
                            });
                        }
                        else {
                            callback(401, "You cannot do that.");
                        }
                    }
                    else {
                        callback(code, error);
                    }
                });
            }
        });
    };
    DocumentController.prototype.getPatch = function (documentName, patchName, callback) {
        var _this = this;
        this.getDocument(documentName, function (status, document, error) {
            if (status == 200) {
                for (var _i = 0, _a = document.patches; _i < _a.length; _i++) {
                    var patch = _a[_i];
                    if (patch.name == patchName) {
                        patch.result = _this.getBodyAfterPatch(document, patch);
                        patch.changes = Diff.diffWords(document.body, patch.body);
                        callback(200, patch);
                        return;
                    }
                }
                callback(404, null, "No such patch");
            }
            else {
                callback(501, null, "Internal Failure: " + error);
            }
        });
    };
    DocumentController.prototype.voteOnPatch = function (documentName, patchName, username, password, vote, callback) {
        var _this = this;
        this.getDocument(documentName, function (status, document, error) {
            if (status == 200) {
                _this.userController.authenticateUser(username, password, function (status, user, error) {
                    if (document.voters.indexOf(user.username) > -1) {
                        if (status == 200) {
                            for (var _i = 0, _a = document.patches; _i < _a.length; _i++) {
                                var item = _a[_i];
                                var patch = item;
                                if (patch.name == patchName) {
                                    patch.votes.push({
                                        name: user.username,
                                        vote: vote
                                    });
                                    callback(200);
                                }
                            }
                        }
                        else {
                            callback(status, error);
                        }
                    }
                    else {
                        callback(401, "You are not a voter on that document.");
                    }
                });
            }
            else {
                callback(status, error);
            }
        });
    };
    DocumentController.prototype.getBodyAfterPatch = function (document, patch) {
        var uniDiff = Diff.createPatch("", document.body, patch.body, "", "");
        return Diff.applyPatch(document.body, uniDiff);
    };
    return DocumentController;
}());
exports.DocumentController = DocumentController;
