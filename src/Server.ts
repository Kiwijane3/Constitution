/// <reference path="../typings/index.d.ts"/>
/// <reference path="../typings/globals/express-serve-static-core/index.d.ts"/>
import * as express from 'express';
import bodyparser = require('body-parser');
import { DocumentController } from "./DocumentController";
import { UserController } from "./UserController";
import { Authority, DocumentRequest, AddVoterRequest, PatchRequest } from "./Models"

export class Server {

  private documentController: DocumentController;
  private userController: UserController;

  private app: express.Application;

  constructor(){
  }

  public run(){
    this.app = express();
    this.userController = new UserController();
    this.documentController = new DocumentController(this.userController);
    this.app.use(bodyparser.json());
    this.app.post("/user", (req: any, res: express.Response) => {
      let newAuthority: Authority = req.body;
      this.userController.createUser(newAuthority.username, newAuthority.password, (status, result, error) => {
        res.set("error", error).status(status).send(result);
      })
    });
    this.app.post("/documents", (req: any, res: express.Response) => {
      let documentRequest = <DocumentRequest> req.body;
      let ownerName = documentRequest.authority.username;
      let password = documentRequest.authority.password;
      let name = documentRequest.name;
      let body = documentRequest.body
      this.documentController.createDocument(name, body, ownerName, password, (status, result, error) => {
        res.set("error", error).status(status).json(result);
      })
    });
    this.app.get("/documents/:documentName", (req: any, res: express.Response) => {
      this.documentController.getDocument(req.params.documentName, (status, document, error) => {
        res.set("error", error).status(status).json(document);
      });
    });
    this.app.post("/documents/:documentName/Voters", (req: any, res: express.Response) => {
      let newVoter = <AddVoterRequest> req.body;
      let documentName = req.params.documentName;
      let voterName = newVoter.voterName;
      let voterRequired =  newVoter.voterRequired;
      let ownerName = newVoter.authority.username;
      let password = newVoter.authority.password;
      this.documentController.addVoter(voterName, voterRequired, documentName, ownerName, password, (status, error) => {
        res.set("error", error).status(status).send("");
      });
    });
    this.app.post("/documents/:documentName/patch", (req: any, res: express.Response) => {
      let patch = <PatchRequest> req.body;
      let documentName = req.body.documentName;
      let patchName = patch.name;
      let patchBody = patch.body;
      let username = patch.authority.username;
      let password =  patch.authority.password
      this.documentController.submitPatch(documentName, patchName, patchBody, username, password, (status, error) => {
        res.set("error", error).status(status).send("");
      });
    });
    this.app.get("/documents/:documentName/patch/:patchName", (req: any, res: express.Response) => {
      this.documentController.getPatch(req.params.documentName, req.params.patchName, (status, patch, error) => {
        res.set("error", error).status(status).json(patch);
      })
    });
    this.app.listen(8080, () => {
      console.log("Constitution now active on port 8080");
    });
  }



}
