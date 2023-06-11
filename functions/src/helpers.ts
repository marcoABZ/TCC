import {Firestore} from "firebase-admin/firestore";

const PROJECT_ID = "tccmarcoz";
const JWT_SECRET = "secretjwtstego";
import jwt = require("jsonwebtoken");
import crypto = require("crypto");

/**
 * Retrieves a collection from Firebase Firestore.
 *
 * @param {string} collection:
 *    The name of the collection to be retrieved.
 * @param {string} projectId:
 *    The ID of the project (optional). Default is "tccmarcoz".
 * @return {FirebaseFirestore.CollectionReference}:
 *    The collection.
 */
export function getCollection(
  collection: string,
  projectId: string=PROJECT_ID
): FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> {
  const db = new Firestore({
    projectId: projectId,
  });

  return db.collection(collection);
}

/**
 * Creates a new JWT token for the provided user.
 *
 * @param {string} user:
 *   The ID of the user that will receive the token.
 * @return {string}:
 *   The JWT token for the user. The token will be valid for 1h.
 */
export function generateJWT(user: string): string {
  return jwt.sign({"username": user}, JWT_SECRET, {expiresIn: "1h"});
}

/**
 * Checks if a JWT token is valid.
 *
 * @param {string} token:
 *   The token to be validated.
 * @return {string | jwt.JwtPayload}:
 *   Info about the token.
 */
export function validateJWT(token: string): string | jwt.JwtPayload {
  const decodedToken = jwt.verify(token, JWT_SECRET);
  return decodedToken;
}

/**
 * Generates an HOTP value.
 *
 * @param {string} secret:
 *   The private key that should be used to generate the token.
 * @param {number} counter:
 *   The counter value that should be used to generate the token.
 * @param {number} digits:
 *   How many digits the HOTP code should have (optional). Default value is 6.
 * @return {string}:
 *   The HOTP code.
 */
export function generateHOTP(
  secret: string,
  counter: number,
  digits = 6
): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(buffer);

  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);


  return (code % 10 ** digits).toString().padStart(digits, "0");
}
