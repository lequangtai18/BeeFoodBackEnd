const { default: mongoose } = require("mongoose");
const { restaurantModel } = require("../models/restaurant.model");

const bcrypt = require("bcrypt");
const { render } = require("ejs");
const firebase = require("../firebase/index.js");
const productModel = require("../models/product.model.js");

exports.getBranches = async (req, res) => {
  try {
    console.log("Restaurant Model:", restaurantModel); // Kiểm tra model
    const branches = await restaurantModel.find({}, "_id name");
    res.status(200).json(branches);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi nhánh:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};

// exports.getBranches = async (req, res) => {
//   try {
//     console.log("Restaurant Model:", restaurantModel); // Kiểm tra model
//     const branches = await restaurantModel.find({}, "_id name");
//     res.status(200).json(branches);
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách chi nhánh:", error);
//     res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
//   }
// };
