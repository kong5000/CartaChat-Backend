/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


exports.chatMessageSent = functions.firestore
    .document("messages/{userId}/{partnerId}/{messageId}")
    .onCreate(async (snapshot, context) => {
        try {
            const message = snapshot.data();
            const fromId = message.fromId
            const recipientId = message.toId;
            const userId = context.params.userId;

            //Dont send push notification to author of message
            if (fromId == userId) {
                return
            }

            const tokenDoc = await db.collection("fcmtokens").doc(recipientId).get();

            if (!tokenDoc.exists) {
                console.log("FCM token not found for recipient: " + recipientId);
                return null;
            }

            const token = tokenDoc.data().token;
            const payload = {
                notification: {
                    title: String(message.fromId),
                    body: String(message.messageText),
                    sound: "default",
                },
            };
            await admin.messaging().sendToDevice(token, payload);
        } catch (error) {
            console.error("Error in chatMessageSent function:", error);
        }
    });