const admin = require("firebase-admin");

// Initialize firebase admin SDK

<<<<<<< HEAD
const serviceAccount = require("../beefoodconsole-firebase-adminsdk-xv6qz-c89d2d9af7.json");
=======
const serviceAccount = require("../beefoodconsole-firebase-adminsdk-xv6qz-75951e7233.json");
>>>>>>> cd437cc27f49bf5fea4edc8269c078b467411d33
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "beefoodconsole.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};