var express = require("express");
const session = require("express-session");
const { yeu_cau_dang_nhap } = require("../middleware/checklogin");
var product = require("../controllers/product.controller");
var productModel = require("../models/product.model");

var router = express.Router();

/* GET home page. */
router.get("/", yeu_cau_dang_nhap);
router.get("/home", function (req, res, next) {
  res.render("home", { title: "Express" });
});

router.get("/home", function (req, res, next) {
  res.render("home", { title: "Express" });
});

//Product
router.get("/addProduct", function (req, res, next) {
  res.render("product/addProduct", { title: "Express", req: req });
});

router.get("/showProduct", async function (req, res, next) {
  const data = await product.dataProductRestaurant(req, res);
  res.render("product/showProduct", {
    list: data,
    req: req,
  });
});

// Lấy sản phẩm để chỉnh sửa
router.get("/editProduct/:id", async function (req, res, next) {
  try {
    console.log(req.params.id);
    const data = await productModel.productModel.findById({ _id: req.params.id });
    if (!data) {
      return res.status(404).send("Product not found");
    }
    res.render("product/editProduct", {
      product: data,
      req: req,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// // Cập nhật sản phẩm
// router.post("/editProduct/:id", async function (req, res, next) {
//   try {
//     const productId = req.params.id;
//     const updatedProductData = req.body;
//     const data = await productModel.findByIdAndUpdate(productId, updatedProductData, { new: true });

//     if (!data) {
//       return res.status(404).send("Product not found");
//     }
//     res.redirect("/showProduct"); // Chuyển hướng sau khi cập nhật
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });

router.get("/listproduct", product.getListProduct);

module.exports = router;
