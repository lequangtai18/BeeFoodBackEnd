var express = require("express");
const router = express.Router();
const moment = require("moment");
const multer = require("multer");
var apiU = require("../controllers/user.controllers");

const upload = multer({ storage: multer.memoryStorage() });

//User
router.get("/users", apiU.listUser);
router.get("/users/info/:id", apiU.infoUser);
router.post("/users/register", apiU.register);
router.post("/users/login", apiU.login);
router.post("/users/update/:id", apiU.update);

module.exports = router;
