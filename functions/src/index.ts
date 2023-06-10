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
import {FieldValue, Firestore} from "firebase-admin/firestore";
const app = express();
const INVALID_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

app.get("/helloW", (request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  // const db = getFirestore();
  const db = new Firestore({
    projectId: "tccmarcoz",
  });

  const docRef = db.collection("logs").doc(userId);
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
  const db = new Firestore({
    projectId: "tccmarcoz",
  });

  const docRef = db.collection("logs").doc(userId);
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
