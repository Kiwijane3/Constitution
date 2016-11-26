/// <reference path="../typings/index.d.ts"/>
import MongoDB = require('mongodb');
import MongoClient = MongoDB.MongoClient;
import MongoDatabase = MongoDB.Db

const databaseUrl: string = "https:8080/";

export class DocumentController {

	private client: MongoDatabase;

	private userController: UserController

	constructor(){
		MongoClient.connect(databaseUrl, (err, db) => {
				if (err == null && db != null){
					this.client = db;
					console.log("The DocumentDB has connected to the database.");
				}  else {
					console.log("The DocumentDB encountered an error while connecting to the database")
				}
			});
	}

	public createDocument(name: string, body: string, ownerName: string, password: string,
		 callback: (code: number, message: string) => void) {
			 	let user 
	}

}
