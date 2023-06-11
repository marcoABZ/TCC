/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";

import functions = require("firebase-functions");
import express = require("express");
import {FieldValue} from "firebase-admin/firestore";
import crypto = require("crypto");
import {generateJWT, getCollection, validateJWT} from "./helpers";

const app = express();
const INVALID_REQUEST = 400;
const UNAUTHORIZED = 401;
const INTERNAL_SERVER_ERROR = 500;
// const HOTP_TOLERANCE = 5;

interface UserCredentials {
  passwordHash: string;
  publicKey: string;
  salt: string;
}

app.get("/helloW", (request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

app.post("/login", async (req, res) => {
  const {login, password} = req.body;
  const usersCollection = getCollection("users");
  const docRef = usersCollection.doc(login);

  docRef.get()
    .then((doc) => {
      if (doc.exists) {
        const {passwordHash, salt} = doc.data() as UserCredentials;
        const hashed = crypto.createHash("sha1")
          .update(password + salt)
          .digest("hex");
        if (hashed == passwordHash) {
          const privateKey = crypto.randomBytes(20).toString("hex");
          const hotpStart = 0;
          const token = generateJWT(login);
          const message = {
            "success": true,
            "data": {
              "hotpKey": privateKey,
              "hotpStart": hotpStart,
              "jwtToken": token,
            },
          };

          docRef.set({
            "hotpKey": privateKey,
            "hoptStart": hotpStart,
          }, {
            merge: true,
          });

          res.status(200).send(message);
        } else {
          const message = {
            "success": false,
            "error": {
              "code": UNAUTHORIZED,
              "message": "Invalid credentials",
            },
          };
          res.status(401).send(message);
        }
      } else {
        const message = {
          "success": false,
          "error": {
            "code": UNAUTHORIZED,
            "message": "Invalid credentials",
          },
        };
        res.status(401).send(message);
      }
    })
    .catch((error) => {
      const message = {
        "success": false,
        "error": {
          "code": INTERNAL_SERVER_ERROR,
          "message": error,
        },
      };
      res.status(500).send(message);
    });
});

app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization;

  if (token) {
    try {
      validateJWT(token!.substring(7));
    } catch {
      const message = {
        "success": false,
        "error": {
          "code": UNAUTHORIZED,
          "message": "Invalid credentials",
        },
      };
      res.status(401).send(message);
    }
  } else {
    const message = {
      "success": false,
      "error": {
        "code": UNAUTHORIZED,
        "message": "Authorization required",
      },
    };
    res.status(401).send(message);
  }

  // const db = getFirestore();
  const collection = getCollection("logs");

  const docRef = collection.doc(userId);
  try {
    if ((await docRef.get()).exists) {
      await docRef.update({
        registros: FieldValue.arrayUnion(Date.now()),
      });
    } else {
      docRef.set({
        registros: [Date.now()],
      });
    }
  } catch (error) {
    res.status(500).send(`{${error}}`);
  }

  res.status(200);
  res.send("{'success': true}");
});

app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const collection = getCollection("logs");

  const docRef = collection.doc(userId);
  docRef.get()
    .then((doc) => {
      if (doc.exists) {
        const message = {
          "success": true,
          "data": JSON.stringify(doc.data()),
        };
        res.status(200).send(message);
      } else {
        const message = {
          "success": false,
          "error": {
            "code": INVALID_REQUEST,
            "message": "Invalid user ID",
          },
        };
        res.status(400).send(message);
      }
    })
    .catch((error) => {
      const message = {
        "success": false,
        "error": {
          "code": INTERNAL_SERVER_ERROR,
          "message": error,
        },
      };
      res.status(500).send(message);
    });
});

exports.app = functions.https.onRequest(app);
