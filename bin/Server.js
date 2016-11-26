"use strict";
var express = require("express");
var bodyparser = require("body-parser");
var DocumentController_1 = require("./DocumentController");
var UserController_1 = require("./UserController");
var Server = (function () {
    function Server() {
    }
    Server.prototype.run = function () {
        var _this = this;
        this.app = express();
        this.userController = new UserController_1.UserController();
        this.documentController = new DocumentController_1.DocumentController(this.userController);
        this.app.use(bodyparser.json());
        this.app.post("/user", function (req, res) {
            var newAuthority = req.body;
            _this.userController.createUser(newAuthority.username, newAuthority.password, function (status, result, error) {
                res.set("error", error).status(status).send(result);
            });
        });
        this.app.post("/documents", function (req, res) {
            var documentRequest = req.body;
            var ownerName = documentRequest.authority.username;
            var password = documentRequest.authority.password;
            var name = documentRequest.name;
            var body = documentRequest.body;
            _this.documentController.createDocument(name, body, ownerName, password, function (status, result, error) {
                res.set("error", error).status(status).json(result);
            });
        });
        this.app.get("/documents/:documentName", function (req, res) {
            _this.documentController.getDocument(req.params.documentName, function (status, document, error) {
                res.set("error", error).status(status).json(document);
            });
        });
        this.app.post("/documents/:documentName/Voters", function (req, res) {
            var newVoter = req.body;
            var documentName = req.params.documentName;
            var voterName = newVoter.voterName;
            var voterRequired = newVoter.voterRequired;
            var ownerName = newVoter.authority.username;
            var password = newVoter.authority.password;
            _this.documentController.addVoter(voterName, voterRequired, documentName, ownerName, password, function (status, error) {
                res.set("error", error).status(status).send("");
            });
        });
        this.app.post("/documents/:documentName/patch", function (req, res) {
            var patch = req.body;
            var documentName = req.body.documentName;
            var patchName = patch.name;
            var patchBody = patch.body;
            var username = patch.authority.username;
            var password = patch.authority.password;
            _this.documentController.submitPatch(documentName, patchName, patchBody, username, password, function (status, error) {
                res.set("error", error).status(status).send("");
            });
        });
        this.app.get("/documents/:documentName/patch/:patchName", function (req, res) {
            _this.documentController.getPatch(req.params.documentName, req.params.patchName, function (status, patch, error) {
                res.set("error", error).status(status).json(patch);
            });
        });
        this.app.listen(8080, function () {
            console.log("Constitution now active on port 8080");
        });
    };
    return Server;
}());
exports.Server = Server;
