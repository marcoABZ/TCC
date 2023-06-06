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
import {FieldValue, getFirestore} from "firebase-admin/firestore";
const app = express();

app.get("/helloW", (request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const db = getFirestore();

  const docRef = db.collection("logs").doc(userId);

  await docRef.update({
    registros: FieldValue.arrayUnion(FieldValue.serverTimestamp()),
  });

  res.status(200);
  res.send("{'success': true}");
});

exports.app = functions.https.onRequest(app);