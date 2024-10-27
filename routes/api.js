var express = require("express");
const router = express.Router();
const moment = require("moment");
const multer = require("multer");

var apiU = require("../controllers/user.controllers");
var apiProduct = require("../controllers/product.controller");
var apiSanPhamDangDuyet = require("../controllers/sanPhamDangDuyet.controller");

const upload = multer({ storage: multer.memoryStorage() });

//User
router.get("/users", apiU.listUser);
router.get("/users/info/:id", apiU.infoUser);
router.post("/users/register", apiU.register);
router.post("/users/login", apiU.login);
router.post("/users/update/:id", apiU.update);

// Product
router.post(
    "/product/addProduct",
    upload.single("image"),
    apiSanPhamDangDuyet.addProduct
  );
  
router.post("/product/editProduct/:id", upload.single("image"),apiProduct.editDataProduct);

module.exports = router;
