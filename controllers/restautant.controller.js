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
  try {
    const id = req.session.user?._id; // ID của người dùng từ session
    if (!id) {
      return res.status(401).json({ message: "Người dùng chưa đăng nhập" });
    }

    const nameFile = req.file?.originalname; // Lấy tên file từ request (nếu có file)
    let imageUrl;

    // Nếu có file, upload file lên Firebase Storage
    if (nameFile) {
      const blob = firebase.bucket.file(nameFile);
      const blobWriter = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobWriter.on("finish", resolve);
        blobWriter.on("error", reject);
        blobWriter.end(req.file.buffer);
      });

      imageUrl = `https://firebasestorage.googleapis.com/v0/b/beefoodconsole.appspot.com/o/${nameFile}?alt=media`;
    }

    // Chuẩn bị dữ liệu cập nhật
    const profileRestaurant = {
      name: req.body.name, // Cập nhật tên nhà hàng
      address: req.body.address, // Cập nhật địa chỉ
      timeon: req.body.timeon, // Thời gian mở
      timeoff: req.body.timeoff, // Thời gian đóng
      address: req.body.address, // Địa chỉ
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    };

    // Nếu có file ảnh, thêm URL ảnh vào dữ liệu
    if (imageUrl) {
      profileRestaurant.image = imageUrl;
    }

    // Cập nhật thông tin trong cơ sở dữ liệu
    const updatedRestaurant = await restaurantModel.restaurantModel.findByIdAndUpdate(
      { _id: id },
      profileRestaurant,
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ message: "Nhà hàng không tồn tại" });
    }

    // Chuyển hướng sau khi cập nhật thành công
    res.redirect("/");
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
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

exports.searchProductOnListProduct = async (req, res, next) => { };

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


exports.getRevenueByBranch = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.body;

    // Kiểm tra đầu vào
    if (!restaurantId || !startDate || !endDate) {
      return res.status(400).json({ msg: "Thiếu dữ liệu đầu vào: restaurantId, startDate, hoặc endDate." });
    }

    console.log("Input Data:", { restaurantId, startDate, endDate });

    // Lấy dữ liệu đơn hàng theo khoảng thời gian và nhà hàng
    const orders = await historyModel.History.find({
      time: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: 3, // Đơn hàng đã hoàn thành
      "products.restaurantId": restaurantId,
    });

    console.log("Fetched Orders:", orders);

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce(
      (total, order) => total + (order.toltalprice || 0),
      0
    );

    console.log("Total Revenue:", totalRevenue);

    // Chuẩn bị dữ liệu cho biểu đồ
    const dailyData = {};

    orders.forEach((order) => {
      const date = new Date(order.time).toLocaleDateString("vi-VN");

      if (!dailyData[date]) {
        dailyData[date] = {
          revenue: order.toltalprice || 0,
          sales: 1,
        };
      } else {
        dailyData[date].revenue += order.toltalprice || 0;
        dailyData[date].sales += 1;
      }
    });

    // Chuyển đổi dữ liệu thành danh sách để vẽ biểu đồ
    const categories = Object.keys(dailyData);
    const revenues = categories.map((date) => dailyData[date].revenue);
    const sales = categories.map((date) => dailyData[date].sales);

    console.log("Categories:", categories);
    console.log("Revenues:", revenues);
    console.log("Sales:", sales);

    // Trả về dữ liệu
    res.status(200).json({
      totalRevenue,
      categories,
      revenues,
      sales,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê chi nhánh:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};



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



exports.getCoordinatesByRestaurantId = async (req, res, next) => {
  const restaurantId = req.params.id;

  try {
    const restaurant = await restaurantModel.restaurantModel.findById(restaurantId).select('latitude longitude');

    if (!restaurant) {
      return res.status(404).json({ msg: 'Nhà hàng không tồn tại' });
    }

    return res.status(200).json({
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      msg: 'Lấy tọa độ nhà hàng thành công',
    });
  } catch (error) {
    console.error('Lỗi khi lấy tọa độ nhà hàng:', error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.lockRestaurants = async (req, res) => {
  console.log('Locking restaurant with ID:', req.params.id); // Log ID
  try {
    const restaurantId = req.params.id;
    const restaurant = await restaurantModel.restaurantModel.findById(restaurantId);

    if (!restaurant) return res.status(404).json({ success: false, message: 'Nhà hàng không tồn tại!' });

    restaurant.isLocked = true;
    await restaurant.save();

    res.json({ success: true, message: 'Nhà hàng đã bị khóa!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};

exports.unlockRestaurants = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await restaurantModel.restaurantModel.findById(restaurantId);

    if (!restaurant) return res.status(404).json({ success: true, message: 'Nhà hàng không tồn tại!' });

    restaurant.isLocked = false;
    await restaurant.save();

    res.json({ success: true, message: 'Tài khoản đã được mở khóa!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
};