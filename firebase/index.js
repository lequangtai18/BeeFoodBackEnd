const admin = require("firebase-admin");

// Initialize firebase admin SDK

const serviceAccount = require("../beefoodconsole-firebase-adminsdk-xv6qz-2192d49f86.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "beefoodconsole.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};