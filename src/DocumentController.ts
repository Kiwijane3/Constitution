/// <reference path="../typings/index.d.ts"/>
import MongoDB = require('mongodb');
import MongoClient = MongoDB.MongoClient;
import MongoDatabase = MongoDB.Db;
import { UserController } from "./UserController";
import { Document, Patch, Vote } from "./Models";
import Diff = require('diff');

const databaseUrl: string =  "mongodb://localhost:27017/Constitution";

const DOCUMENT_COLLECTION = "document";

export class DocumentController {

	private database: MongoDatabase;

	private userController: UserController;

	constructor(inUserController: UserController){
		MongoClient.connect(databaseUrl, (err, db) => {
				if (err == null && db != null){
					this.database = db;
					console.log("The DocumentDB has connected to the database.");
				}  else {
					console.log("The DocumentDB encountered an error while connecting to the database")
				}
			});
			this.userController = inUserController;
	}

	public createDocument(name: string, body: string, ownerName: string, password: string,
		 callback: (code: number, result: Document, error?: string) => void) {
			 // Check that the document name is unique
			 this.getDocument(name, (status, document) => {
				 if (status == 404){
					 // Authenticate the user.
					 this.userController.authenticateUser(ownerName, password, (code, result, error) => {
						 if (code == 200){
							 // We're good, create the document.
							 let history: string[] = [];
							 let patches: Patch[] = [];
							 let voters: string[] = [];
							 let required: string[] = [];
							 let document: Document = {
								 name: name,
								 body: body,
								 history: history,
								 patches: patches,
								 owner: result.username,
								 voters: voters,
								 required: required
							 }
							 this.database.collection(DOCUMENT_COLLECTION).insertOne(document, (error, result) => {
								 if (error == null){
									 callback(201, document);
								 } else {
									 callback(501, null, `Internal Failure: ${error.message}`);
								 }
							 });
						 } else {
							 callback(code, null, `Authentication Failure: ${error}`);
						 }
					 });
				 } else {
					 // A document with that name already exists.
					 callback(409, null, "A document with that name already exists");
				 }
			 });
	}

	public getDocument(documentName: string, callback: (status: number, document: Document, error?: string) => void){
		this.database.collection(DOCUMENT_COLLECTION).findOne(
			{ name: documentName},
			(error, result) => {
				if (error != null){
					callback(501, null, `Internal Failure: ${error.message}`);
				} else if (result == null){
					callback(404, null);
				} else {
					callback(200, <Document> result);
				}
			}
		);
	}

	public addVoter(voterName: string, required: boolean, documentName: string, username: string, password: string, callback: (status: number, error?: string) => void){
		// Check that the voter exists
		this.userController.doesUserExist(voterName, (result) => {
			this.userController.authenticateUser(username, password, (code, user, error) => {
				if (code  == 200){
					// We have authenticated the user.
					// Find the document.
					this.database.collection(DOCUMENT_COLLECTION).findOne(
						{
							name: documentName
						},
						(error, result) => {
							if (error != null){
								callback(501, `Internal Failure: ${error.message}`);
							} else if (result == null){
								callback(404);
							} else {
								//We have the document, check the user is correct.
								let document = <Document> result;
								if (document.owner == user.username){
									// This is the correct user, proceed to add voter.
									document.voters.push(voterName);
									// If this voter is a required voter, add them to required as well.
									if (required){
										document.required.push(voterName);
									}
									this.database.collection(DOCUMENT_COLLECTION).updateOne(
										{
											_id: document._id
										},
										document,
										(error) => {
											if (error == null){
												return callback(200);
											} else {
												callback(501, `Internal Failure while updating: ${error.message}`);
											}
										}
									);
								} else {
									callback(401, "You do not own that document");
								}
							}
						}
					);
				} else {
					callback(code, error);
				}
			});
		});
	}

	public submitPatch(documentName: string, patchName: string, patchBody: string, username: string, password: string, callback: (status: number, error?: string) => void){
		// Find the document.
		this.database.collection(DOCUMENT_COLLECTION).findOne(
			{
				name: documentName
			},
			(error, result) => {
				let document = <Document> result;
				if (error != null){
					callback(501, `Internal Failure: ${error.message}`);
				} else if (result == null){
					callback(404);
				} else {
					//Authenticate the user.
					this.userController.authenticateUser(username, password, (code, user, error) => {
						if (code == 200){
							// Check that the user is the owner of a voter on the document.
							if (username == document.owner || document.voters.indexOf(username) > -1){
								let votes: Vote[] = [];
								let patch: Patch = {
									author: username,
									name: patchName,
									body: patchBody,
									votes: votes
								};
								document.patches.push(patch);
								this.database.collection(DOCUMENT_COLLECTION).updateOne(
									{
										_id: document._id
									},
									document,
									(error) => {
										if (error == null){
											return callback(200);
										} else {
											callback(501, `Internal Failure while updating: ${error.message}`);
										}
									}
								);
							} else {
								// Does not have permission.
								callback(401, "You cannot do that.");
							}
						} else {
							callback(code, error);
						}
					});
				}
			}
		)
	}

	public getPatch(documentName: string, patchName: string, callback: (status: number, patch: Patch, error?: string) => void){
		this.getDocument(documentName, (status, document, error) => {
			if (status == 200) {
				// Find the patch and return it.
				for (let patch of document.patches){
					if (patch.name == patchName){
						// Calculate the current result of the patch.
						patch.result = this.getBodyAfterPatch(document, patch);
						patch.changes = Diff.diffWords(document.body, patch.body);
						callback(200, patch);
						return;
					}
				}
				callback(404, null, "No such patch");
			} else {
				callback(501, null,  `Internal Failure: ${error}`);
			}
		});
	}

	public voteOnPatch(documentName: string, patchName: string, username: string, password: string, vote: boolean, callback: (status: number, error?: string) => void) {
		this.getDocument(documentName, (status, document, error) => {
			if (status == 200){
				// Authenticate the user.
				this.userController.authenticateUser(username, password, (status, user, error) => {
					// Check that the user is a voter.
					if (document.voters.indexOf(user.username) > -1){
						if (status == 200){
							for (let item of document.patches) {
								let patch: Patch = item;
								if (patch.name == patchName){
									patch.votes.push(
										{
											name: user.username,
											vote: vote
										}
									);
									// Voting is done.
									// TODO: Check if patch has passed and apply.
									callback(200);
								}
							}
						} else {
							callback(status, error);
						}
					} else {
						callback(401, "You are not a voter on that document.");
					}
				});
			} else {
				callback(status, error);
			}
		});
	}

	private getBodyAfterPatch(document: Document, patch: Patch): string{
		let uniDiff = Diff.createPatch("", document.body, patch.body, "", "");
		return Diff.applyPatch(document.body, uniDiff);
	}

}
