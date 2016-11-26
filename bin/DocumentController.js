"use strict";
var MongoDB = require("mongodb");
var MongoClient = MongoDB.MongoClient;
var databaseUrl = "https:8080/";
var DocumentController = (function () {
    function DocumentController() {
        var _this = this;
        MongoClient.connect(databaseUrl, function (err, db) {
            if (err == null && db != null) {
                _this.client = db;
                console.log("The DocumentDB has connected to the database.");
            }
            else {
                console.log("The DocumentDB encountered an error while connecting to the database");
            }
        });
    }
    DocumentController.prototype.createDocument = function (name, body, ownerName, password, callback) {
        var user;
    };
    return DocumentController;
}());
exports.DocumentController = DocumentController;
