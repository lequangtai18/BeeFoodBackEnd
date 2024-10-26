const admin = require("firebase-admin");

// Initialize firebase admin SDK

const serviceAccount = require("../datn-de212-15d26-firebase-adminsdk-y38me-464dec9913.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "datn-de212-15d26.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};
