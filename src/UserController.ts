/// <reference path="../typings/index.d.ts"/>
import MongoDB = require('mongodb');
import MongoClient = MongoDB.MongoClient;
import MongoDatabase = MongoDB.Db;
import { User } from "./Models";
import crypto = require('crypto');

const USER_COLLECTION = "users";

export class UserController {

  private database: MongoDatabase;

  constructor(inDatabase: MongoDatabase){
    this.database = inDatabase
  }

  public createUser(username: string, password: string, callback: (code: number, message: string)){
    // Create Salt
    crypto.randomBytes(256, (err, buf) => {
      if (err == null){
        let salt = buf.toString();
        //Generate Secret
        let secret = crypto.pbkdf2(password, salt, 10000, 512, 'sha512', (err, result) => {
          if (err == null){
            let secret =  result.toString();
            let user: User = {
              username: username,
              salt: salt,
              secret: secret
            }
            this.database.collection(USER_COLLECTION).insertOne(
              user,
              (err, result) => {
                if (error == null) {
                  callback(201, "Successfully created user ${ username }");
                }
              }
            );
          } else {
            callback(501, "Internal failure");
          }
        });
      } else {
        callback(501, "Internal Failure");
      }
    });
  }

  public authenticateUser(username: string, password: string,
    callback: (code: number, user: User) => void){
      this.database.collection(USER_COLLECTION).findOne(
        {
          username: username
        },
        (err, result) => {
          if (err == null){
            let user: User = <User> result;
            let salt = user.salt;
            crypto.pbkdf2(password, salt, 10000, 512, 'sha512', (err, result) => {
              if (err == null) {
                let hash = result.toString();
                if (hash == user.secret){
                  // User successfully authenticated.
                  callback(true, user);
                } else {
                  // Authentication failed.
                  callback(false, null);
                }
              }
            });
          } else {
            callback(false, null);
          }
        }
      )
  }

}
