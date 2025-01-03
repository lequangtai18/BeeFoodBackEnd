const admin = require("firebase-admin");

// Initialize firebase admin SDK

const serviceAccount = require("../beefoodconsole-firebase-adminsdk-xv6qz-043c10b90c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "beefoodconsole.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};