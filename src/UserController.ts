/// <reference path="../typings/index.d.ts"/>
import MongoDB = require('mongodb');
import MongoClient = MongoDB.MongoClient;
import MongoDatabase = MongoDB.Db;
import { User } from "./Models";
import crypto = require('crypto');

const USER_COLLECTION = "users";

const databaseUrl: string = "mongodb://localhost:27017/Constitution";

export class UserController {

  private database: MongoDatabase;

  constructor(){
    MongoClient.connect(databaseUrl, (err, db) => {
				if (err == null && db != null){
					this.database = db;
					console.log("The DocumentDB has connected to the database.");
				}  else {
					console.log("The DocumentDB encountered an error while connecting to the database")
				}
			});
  }

  public createUser(username: string, password: string, callback: (code: number, result: any, error?: string) => void){
    // Check that the user does not already exist.
    this.database.collection(USER_COLLECTION).findOne(
      {
        username: username
      },
      (error, result) => {
        // Create Salt
        if (error != null){
          callback(501, `Internal failure: ${error.message}`);
        } else if (result != null){
          callback(409, null, "Username is taken");
        } else {
          crypto.randomBytes(256, (error, buf) => {
            if (error == null){
              // Create Salt
              let salt = buf.toString();
              //Generate Secret
              let secret = crypto.pbkdf2(password, salt, 10000, 512, 'sha512', (error, result) => {
                if (error == null){
                  let secret =  result.toString();
                  let user: User = {
                    username: username,
                    salt: salt,
                    secret: secret
                  }
                  this.database.collection(USER_COLLECTION).insertOne(
                    user,
                    (error, result) => {
                      if (error == null) {
                        callback(201, { username: username });
                      } else {
                        callback(501, null, `Internal failure: ${error.message}`);
                      }
                  });
                } else {
                  callback(501, null, `Internal failure: ${error.message}`);
                }
              });
            } else {
              callback(501, null, `Internal failure: ${error.message}`)
            }
          });
        }
      }
    );
  }

  public authenticateUser(username: string, password: string,
    callback: (code: number, user: User, error?: string) => void){
      this.database.collection(USER_COLLECTION).findOne(
        {
          username: username
        },
        (error, result) => {
          if (error != null){
            callback(501, null, `Internal failure: ${error.message}`);
          } else if (result == null){
            callback(404, null, "User not found");
          } else {
            let user: User = <User> result;
            let salt = user.salt;
            crypto.pbkdf2(password, salt, 10000, 512, 'sha512', (error, result) => {
              if (error == null) {
                let hash = result.toString();
                if (hash == user.secret){
                  // User successfully authenticated.
                  callback(200, user);
                } else {
                  // Authentication failed.
                  callback(401, null, "Incorrect password");
                }
              } else {
                callback(501, null, `Internal Failure: ${error.message}`);
              }
            });
          }
        }
      );
  }

  public doesUserExist(username: string, callback: (string: boolean) => void){
    this.database.collection(USER_COLLECTION).findOne(
      {
        username: username
      },
      (error, result) => {
        if (error == null && result != null){
          callback(true);
        } else {
          callback(false);
        }
      }
    );
  }

}
