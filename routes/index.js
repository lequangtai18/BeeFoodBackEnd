var express = require("express");
const session = require("express-session");
const { yeu_cau_dang_nhap } = require("../middleware/checklogin");
const mongoose = require("mongoose");
var product = require("../controllers/product.controller");
var productModel = require("../models/product.model");
var sanPhamDangDuyet = require("../controllers/sanPhamDangDuyet.controller");
var comment = require("../controllers/comment.controller");

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

router.get("/listproduct", product.getListProduct);

//Duyệt sản phẩm
router.get("/listCensor/:id", sanPhamDangDuyet.listForRes);
router.get("/listCensor/huy/:id", sanPhamDangDuyet.huy);
router.get("/censorship", sanPhamDangDuyet.getListProduct);
router.get("/censorship/duyet/:id", sanPhamDangDuyet.duyet);
router.get("/censorship/xoa/:id", sanPhamDangDuyet.xoa);

//FeedBack
router.get("/feedback", async function (req, res) {
  const data = await product.dataProductRestaurant(req, res);

  const getAllComment = await comment.getAllComment(req, res);
  const info = [];
  data.map((dt, index) => {
    const dataFilter = {};
    const objectId1 = new mongoose.Types.ObjectId(dt?._id);
    dataFilter.name = dt.name;
    dataFilter.image = dt.image;
    dataFilter.listComment = [];
    getAllComment.map((cm, index) => {
      const objectId2 = new mongoose.Types.ObjectId(cm?.idProduct?._id);
      if (objectId1.equals(objectId2)) {
        dataFilter.listComment.push({
          username: cm.idUser?.username,
          avatar: cm.idUser?.avatar,
          title: cm.title,
        });
      }
    });
    info.push(dataFilter);
  });
  console.log("bang comment", info);

  res.render("feedback/feedback", { req: req, data: info });
});

module.exports = router;
