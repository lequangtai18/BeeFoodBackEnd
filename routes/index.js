var express = require("express");
const session = require("express-session");
const { yeu_cau_dang_nhap } = require("../middleware/checklogin");
var product = require("../controllers/product.controller");
var productModel = require("../models/product.model");
const history = require("../controllers/historyOderControllers");

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

router.get("/revenue", function (req, res, next) {
  res.render("revenue/showrevenue", { title: "Express", req: req });
});

router.get("/listproduct", product.getListProduct);
router.get("/adminRevenue", product.getRevenue);
router.get("/showrevenue", history.getRevenueRestaurant);


module.exports = router;
