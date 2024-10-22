const admin = require("firebase-admin");

// Initialize firebase admin SDK

const serviceAccount = require("../beefood-adminkey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "datn-de212.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};
