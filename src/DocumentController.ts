/// <reference path="../typings/index.d.ts"/>
import MongoDB = require('mongodb');
import MongoClient = MongoDB.Client;
import Database = MongoDB.DB;

export class DocumentController {

	private const databaseUrl = "https:8080/"

	private dbClient: MongoClient;

	constructor(){
		MongoClient.connect(databaseUrl, (err, db) => {
				if (err == null && db != nul){
					this.database = db;
					console.log("The DocumentDB has connected to the database.");
				}  else {
					console.log("The DocumentDB encountered an error while connecting to the ")
				}
			});
	}

	public 

}
