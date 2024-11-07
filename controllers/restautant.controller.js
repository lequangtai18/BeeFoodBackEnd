const { default: mongoose } = require("mongoose");
var restaurantModel = require("../models/restaurant.model");
const bcrypt = require("bcrypt");
const { render } = require("ejs");
const firebase = require("../firebase/index.js");
const productModel = require("../models/product.model.js");

exports.getRestaurants = async (req, res, next) => {
  try {
    let list = await restaurantModel.restaurantModel.find();
    if (list) {
      return res
        .status(200)
        .json({ data: list, msg: "Lấy  dữ liệu restaurant thành công" });
    } else {
      return res.status(400).json({ msg: "Không có dữ liệu restaurant" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.editProfile = async (req, res, next) => {
  const id = req.session.user?._id;
  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("finish", () => {
    const profileRestaurant = {
      ...req.body,
      image: `https://firebasestorage.googleapis.com/v0/b/datn-de212-15d26.appspot.com/o/${nameFile}?alt=media`,
    };
    restaurantModel.restaurantModel
      .findByIdAndUpdate({ _id: id }, profileRestaurant)
      .then(() => {
        res.redirect("/");
      });
  });
  blobWriter.end(req.file.buffer);
};
exports.getInfoRestaurantById = async (req, res, next) => {
  const restaurantId = req.params.id;

  try {
    let info = await restaurantModel.restaurantModel.find({
      _id: restaurantId,
    });
    if (info) {
      return res
        .status(200)
        .json({ data: info, msg: "Lấy  dữ liệu restaurant thành công" });
    } else {
      return res.status(400).json({ msg: "Không có dữ liệu restaurant" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.createRestaurant = async (req, res, next) => {
  try {
    let list = await restaurantModel.restaurantModel.create(req.body);
    console.log(req.body);
    if (list) {
      return res
        .status(200)
        .json({ data: list, msg: "Thêm dữ liệu  restaurant thành công" });
    } else {
      return res.status(400).json({ msg: "thêm restaurant thất bại" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  let idRestaurant = req.params.id.replace(":", "");
  idRestaurant = new mongoose.Types.ObjectId(idRestaurant);
  try {
    let deleteRestaurant =
      await restaurantModel.restaurantModel.findByIdAndDelete({
        _id: idRestaurant,
      });
    if (deleteRestaurant) {
      return res.status(200).json({ msg: "Xóa dữ liệu restaurant thành công" });
    } else {
      return res.status(400).json({ msg: "xóa restaurant thất bại" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// for website
exports.webregister = async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const restaurant = new restaurantModel.restaurantModel(req.body);
    restaurant.password = await bcrypt.hash(req.body.password, salt);
    await restaurant.generateAuthToken();
    let new_u = await restaurant.save();
    console.log(new_u);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

exports.checkRegister = async (req, res, next) => {
  const { account, email } = req.body;

  try {
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await restaurantModel.restaurantModel.findOne({
      account,
    });

    // Kiểm tra xem email đã tồn tại chưa
    const existingEmail = await restaurantModel.restaurantModel.findOne({
      email,
    });

    const result = {
      accountExists: !!existingUser,
      emailExists: !!existingEmail,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi kiểm tra đăng ký:", error);
    res.status(500).json({ error: "Có lỗi khi kiểm tra đăng ký." });
  }
};

exports.weblogin = async (req, res, next) => {
  try {
    const restaurant = await restaurantModel.restaurantModel.findOne({
      account: req.body.username,
    });

    if (!restaurant) {
      return res.status(401).json({ msg: "Không tồn tại tài khoản" });
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      restaurant.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({ msg: "Sai mật khẩu" });
    }

    // Thiết lập thông tin nhà hàng vào session
    req.session.user = restaurant;

    res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(401).json({ msg: "Sai tài khoản hoặc mật khẩu" });
  }
};

exports.weblogout = async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
};

exports.getListRestaurant = async (req, res, next) => {
  const ITEMS_PER_PAGE = 5;
  try {
    const page = +req.query.page || 1;
    const restaurants = await restaurantModel.restaurantModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const currentDate = new Date();
    restaurants.forEach((restaurant) => {
      const createdAtDate = new Date(restaurant.createdAt);
      const timeDifference = currentDate - createdAtDate;
      const daysDifference = timeDifference / (1000 * 3600 * 24);
      restaurant.daysSinceCreation = Math.round(daysDifference);
    });

    const totalRestaurants =
      await restaurantModel.restaurantModel.countDocuments();

    const totalPages = Math.ceil(totalRestaurants / ITEMS_PER_PAGE);

    res.render("restaurant/res", {
      list: restaurants,
      req: req,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    res.redirect("/", { req: req });
  }
};

exports.searchRestaurant = async (req, res, next) => {
  try {
    const ITEMS_PER_PAGE = 10;
    const page = +req.query.page || 1;
    let regex = new RegExp(req.query.name, "i");

    const searchQuery = { name: regex };

    const restaurants = await restaurantModel.restaurantModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const currentDate = new Date();
    restaurants.forEach((restaurant) => {
      const createdAtDate = new Date(restaurant.createdAt);
      const timeDifference = currentDate - createdAtDate;
      const daysDifference = timeDifference / (1000 * 3600 * 24);
      restaurant.daysSinceCreation = Math.round(daysDifference);
    });

    const totalRestaurants =
      await restaurantModel.restaurantModel.countDocuments(searchQuery);

    const totalPages = Math.ceil(totalRestaurants / ITEMS_PER_PAGE);

    let msg = "";
    if (restaurants.length === 0) {
      msg = "Không có nhà hàng: " + req.query.name;
    }

    res.render("restaurant/res", {
      list: restaurants,
      msg: msg,
      req: req,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/"); // Nếu có lỗi, chuyển hướng về trang chủ
  }
};

exports.searchProductOnListProduct = async (req, res, next) => {};

exports.getProfile = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;

    // Lấy thông tin nhà hàng
    const restaurant = await restaurantModel.restaurantModel.findById(
      restaurantId
    );

    // Lấy danh sách món ăn theo restaurantId
    const products = await productModel.productModel.find({
      restaurantId: restaurantId,
    });
    console.log(products);
    res.render("restaurant/resProfile", {
      req: req,
      restaurant: restaurant,
      products: products,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhà hàng:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi lấy thông tin nhà hàng" });
  }
};
