import * as functions from "firebase-functions";

// Cloud Functions for Chatbot de Protocolos
// TODO: Implement API endpoints

export const api = functions.https.onRequest(async (req, res) => {
  res.status(200).json({ status: "ok", message: "Chatbot de Protocolos API" });
});
