var historyModel = require("../models/history");
const ProductModel = require("../models/product.model");
const mongoose = require("mongoose");
var userController = require("../models/users.model");
var voucherModel = require("../models/voucher.model.js");
var apiVoucher = require("../controllers/voucher.controller");
var apiNotify = require("../controllers/notify.controller.js");
const { History } = require("../models/history.js");

const moment = require("moment");
const { restaurantModel } = require("../models/restaurant.model.js");
const { notifyModel } = require("../models/notify.model.js");
const Notify = require("../models/notify.model.js"); // Import mô hình Notify
exports.createOrderSuccess = async (req, res, next) => {
  try {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    const OrderSuccess = new historyModel.History({
      ...req.body,
      deliveryFee: req.body.deliveryFee || 0,
      time: date,
    });
    const voucherId = req.body.voucherId;

    // Lưu đơn hàng thành công
    const new_OrderSuccess = await OrderSuccess.save();

    // Tạo thông báo liên kết với đơn hàng mới
    await Notify.create({
      idUser: req.body.userId,
      orderId: new_OrderSuccess._id,
      money: req.body.toltalprice,
      status: 0, // Trạng thái ban đầu của đơn hàng
    });

    // Xử lý voucher nếu có
    if (voucherId && voucherId !== "") {
      const data = await apiVoucher.handleDecreseVoucher(req, res, next);
      if (data == 1) {
        return res.status(200).json({ OrderSuccess: new_OrderSuccess });
      } else {
        return res.status(500).json({ err: "Có lỗi xảy ra" });
      }
    } else {
      return res.status(200).json({ OrderSuccess: new_OrderSuccess });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};

exports.getDonHangChiTiet = async (id) => {
  const data = await historyModel.History.findOne({ _id: id });
  const user = await userController.userModel.findOne({
    _id: new mongoose.Types.ObjectId(data?.userId),
  });
  const { username, phone } = user;
  const dataConcat = {
    product: data.products,
    _id: data?._id,
    username,
    phone,
    address: data.address,
    totalPrice: data.toltalprice,
    deliveryFee: data.deliveryFee,
  };
  return dataConcat;
};

exports.getSanPhamChiTiet = async (id) => {
  const data = await historyModel.History.findOne({ _id: id });
  const user = await userController.userModel.findOne({
    _id: new mongoose.Types.ObjectId(data?.userId),
  });
  const { username, phone } = user;
  const dataConcat = {
    product: data.products,
    _id: data?._id,
    username,
    phone,
    address: data.address,
    phuongthucthanhtoan: data.phuongthucthanhtoan,
    status: data.status,
    notes: data.notes,
    voucherId: data.voucherId,
    price: data.price,
    totalPrice: data.toltalprice,
    deliveryFee: data.deliveryFee,
    time: data.time
  };
  return dataConcat;
};

exports.getChiTiet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    const chiTietDonHang = await historyModel.History.findOne({
      _id: id,
    })
      .populate({
        path: "products.restaurantId",
        select: "name",
        model: "restaurantModel",
      })
      .populate({ path: "voucherId", select: "money", model: "voucherModel" });
    if (!chiTietDonHang) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
    res.json({
      ...chiTietDonHang.toObject(),
      deliveryFee: chiTietDonHang.deliveryFee || 0, // Thêm phí giao hàng
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
exports.getHistory = async (req, res) => {
  try {
    const history = await historyModel.History.find();
    res.status(200).json(
      history.map((order) => ({
        ...order.toObject(),
        deliveryFee: order.deliveryFee || 0, // Thêm phí giao hàng
      }))
    );
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ msg: "ID người dùng không hợp lệ" });
    }

    const userHistory = await historyModel.History.find({ userId });

    if (!userHistory || userHistory.length === 0) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy lịch sử mua hàng cho người dùng này" });
    }

    res.json(
      userHistory.map((order) => ({
        ...order.toObject(),
        deliveryFee: order.deliveryFee || 0, // Thêm phí giao hàng
      }))
    );
  } catch (error) {
    console.error("Lỗi khi truy vấn lịch sử mua hàng:", error);
    return res.status(500).json({ msg: "Lỗi máy chủ nội bộ" });
  }
};

exports.deleteHistory = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const deleted = await History.findOneAndDelete({ orderId });
    if (!deleted) {
      return res.status(404).json({ msg: "Không tìm thấy lịch sử mua hàng" });
    }
    res.json(deleted);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.deleteHistoryAll = async (req, res) => {
  try {
    await historyModel.History.deleteMany({});
    res.json({ msg: "Tất cả lịch sử mua hàng đã được xóa" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getOrdersByRestaurant = async (req, res) => {
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

// controllers/historyOrderController.js

exports.updateOrderStatusByRestaurant = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;

  try {
    const updatedOrder = await historyModel.History.findByIdAndUpdate(
      orderId,
      { $set: { status: newStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
    }

    let statusMessage = "";
    switch (newStatus) {
      case 1:
        statusMessage = "Đã xác nhận";
        break;
      case 2:
        statusMessage = "Đang giao";
        break;
      case 3:
        statusMessage = "Đã giao";
        break;
      case 4:
        statusMessage = "Đã huỷ";
        break;
      default:
        statusMessage = "Chờ xác nhận";
    }

    // Tạo thông báo cho người dùng khi trạng thái đơn hàng thay đổi
    await Notify.create({
      idUser: updatedOrder.userId, // Giả sử `userId` là trường trong đơn hàng
      orderId: updatedOrder._id,
      money: updatedOrder.toltalprice,
      status: newStatus,
    });

    res.json({ msg: statusMessage });
  } catch (error) {
    console.error("Error:", error);

    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ msg: "ID đơn hàng không hợp lệ." });
    }

    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const userIdFromRequest = req.body.userId;
    const order = await historyModel.History.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
    }
    if (order.userId !== userIdFromRequest) {
      return res
        .status(403)
        .json({ msg: "Bạn không có quyền hủy đơn hàng này." });
    }
    if (order.status === 0) {
      const updatedOrder = await historyModel.History.findByIdAndUpdate(
        orderId,
        { $set: { status: 4 } },
        { new: true }
      );
      return res.json({ msg: "Đơn hàng đã được hủy." });
    } else {
      return res
        .status(400)
        .json({ msg: "Không thể hủy đơn hàng ở trạng thái khác 0." });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getDoanhThuTheoDieuKien = async (req) => {
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
      status: 3,
    });
    return orders;
  } catch (error) {
    console.error(error);
  }
};

exports.getOrders = async (req, res) => {
  var slug = req.params.slug;
  let value = 3;
  if (slug == "huy") {
    console.log("vao day");
    value = 4;
  } else {
    value = 3;
  }
  try {
    const user = req.session.user;
    const restaurantId = user._id;

    const soluongdahuy = await historyModel.History.countDocuments({
      status: 4,
      "products.restaurantId": restaurantId,
    });
    const soluongthanhcong = await historyModel.History.countDocuments({
      status: 3,
      "products.restaurantId": restaurantId,
    });

    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
      status: value,
    });
    console.log(orders);
    res.json({
      orders,
      soluongdahuy,
      soluongthanhcong,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.getTopRestaurants = async (req, res) => {
  try {
    const topRestaurants = await historyModel.History.aggregate([
      {
        $match: {
          "products.restaurantId": { $exists: true },
          status: 3,
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          "products.restaurantId": { $toObjectId: "$products.restaurantId" },
        },
      },
      {
        $group: {
          _id: "$products.restaurantId",
        },
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurantInfo",
        },
      },
      {
        $unwind: "$restaurantInfo",
      },
      {
        $project: {
          role: "$restaurantInfo.role",
          _id: "$_id",
          restaurantName: "$restaurantInfo.name",
          email: { $ifNull: ["$restaurantInfo.email", ""] },
          phone: { $ifNull: ["$restaurantInfo.phone", ""] },
          timeon: { $ifNull: ["$restaurantInfo.timeon", ""] },
          timeoff: { $ifNull: ["$restaurantInfo.timeoff", ""] },
          image: { $ifNull: ["$restaurantInfo.image", ""] },
          address: { $ifNull: ["$restaurantInfo.address", ""] },
          totalRevenue: 1,
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    console.log("After Match:", topRestaurants);
    console.log("After Unwind:", topRestaurants);
    console.log("After Group:", topRestaurants);
    console.log("After Lookup:", topRestaurants);
    console.log("After Unwind:", topRestaurants);
    console.log("After Project:", topRestaurants);
    console.log("After Sort:", topRestaurants);
    console.log("Final Result:", topRestaurants);

    res.status(200).json({
      data: topRestaurants,
      msg: "Lấy dữ liệu top nhà hàng thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.getRevenueRestaurant = async (req, res, next) => {
  const currentDate = moment().startOf("day");
  const startOfToday = moment().startOf("day").toISOString();
  const startOfThisMonth = moment().startOf("month").toISOString();
  const startOfThisYear = moment().startOf("year").toISOString();
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const bills = await History.find({ status: 3 });
    const billsToday = await historyModel.History.find({
      time: { $gte: startOfToday },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const dataForChartToday = organizeDataByHour(billsToday);
    console.log("start today", startOfToday);
    const billsThisMonth = await historyModel.History.find({
      time: { $gte: startOfThisMonth },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const dataForChartMonth = organizeDataByMonth(billsThisMonth);
    const billsThisYear = await historyModel.History.find({
      time: { $gte: startOfThisYear },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const userIdsToday = Array.from(
      new Set(billsToday.map((bill) => bill.userId))
    );
    const userIdsThisMonth = Array.from(
      new Set(billsThisMonth.map((bill) => bill.userId))
    );
    const userIdsThisYear = Array.from(
      new Set(billsThisYear.map((bill) => bill.userId))
    );
    const totalRevenueToday = billsToday.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    const totalRevenueThisMonth = billsThisMonth.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    const totalRevenueThisYear = billsThisYear.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    console.log("data", billsToday);
    res.render("revenue/showrevenue", {
      req: req,
      bills: billsToday,
      billsThisMonth: billsThisMonth,
      billsThisYear: billsThisYear,
      userIdsToday: userIdsToday,
      userIdsThisMonth: userIdsThisMonth,
      userIdsThisYear: userIdsThisYear,
      totalRevenueToday: totalRevenueToday,
      totalRevenueThisMonth: totalRevenueThisMonth,
      totalRevenueThisYear: totalRevenueThisYear,

      categoriesToday: dataForChartToday.categories,
      dataToday: dataForChartToday.data,
      revenueToday: dataForChartToday.revenue,

      categoriesMonth: dataForChartMonth.categories,
      dataMonth: dataForChartMonth.data,
      revenueMonth: dataForChartMonth.revenue,

      topSelling: topSelling(bills, restaurantId),
      recent: await recent(bills, restaurantId),
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ bảng Bill:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu từ bảng Bill");
  }
};

// function topSelling(bills) {
//   const productInfo = {};

//   // Lặp qua tất cả các hóa đơn
//   for (const bill of bills) {
//     // Lặp qua tất cả các sản phẩm trong hóa đơn
//     for (const product of bill.products) {
//       const productId = product.productId.toString(); // Chuyển ObjectId thành chuỗi để sử dụng làm khóa

//       // Tăng số lần xuất hiện của productId
//       if (productInfo[productId]) {
//         productInfo[productId].quantity += product.quantity;
//         productInfo[productId].totalRevenue += product.price * product.quantity;
//       } else {
//         productInfo[productId] = {
//           name: product.name,
//           quantity: product.quantity,
//           totalRevenue: product.price * product.quantity,
//           imageURL: product.image, // Thêm link ảnh
//           price: product.price, // Thêm giá tiền
//         };
//       }
//     }
//   }

//   // Sắp xếp productInfo theo số lần xuất hiện giảm dần
//   const sortedProducts = Object.keys(productInfo).sort(
//     (a, b) => productInfo[b].quantity - productInfo[a].quantity
//   );

//   // Lấy ra thông tin của 10 sản phẩm xuất hiện nhiều nhất
//   const topProducts = sortedProducts.slice(0, 10).map((productId) => ({
//     name: productInfo[productId].name,
//     quantity: productInfo[productId].quantity,
//     totalRevenue: productInfo[productId].totalRevenue,
//     imageURL: productInfo[productId].imageURL, // Link ảnh
//     price: productInfo[productId].price, // Giá tiền
//   }));
//   return topProducts;
// }

function topSelling(bills, restaurantId) {
  const productInfo = {};

  // Lặp qua tất cả các hóa đơn
  for (const bill of bills) {
    // Lặp qua tất cả các sản phẩm trong hóa đơn
    for (const product of bill.products) {
      if (product.restaurantId.toString() !== restaurantId.toString()) continue;

      const productId = product.productId.toString(); // Chuyển ObjectId thành chuỗi để sử dụng làm khóa

      // Tăng số lần xuất hiện của productId
      if (productInfo[productId]) {
        productInfo[productId].quantity += product.quantity;
        productInfo[productId].totalRevenue += product.price * product.quantity;
      } else {
        productInfo[productId] = {
          name: product.name,
          quantity: product.quantity,
          totalRevenue: product.price * product.quantity,
          imageURL: product.image, // Thêm link ảnh
          price: product.price, // Thêm giá tiền
        };
      }
    }
  }

  // Sắp xếp productInfo theo số lần xuất hiện giảm dần
  const sortedProducts = Object.keys(productInfo).sort(
    (a, b) => productInfo[b].quantity - productInfo[a].quantity
  );

  // Lấy ra thông tin của 10 sản phẩm xuất hiện nhiều nhất
  const topProducts = sortedProducts.slice(0, 10).map((productId) => ({
    name: productInfo[productId].name,
    quantity: productInfo[productId].quantity,
    totalRevenue: productInfo[productId].totalRevenue,
    imageURL: productInfo[productId].imageURL, // Link ảnh
    price: productInfo[productId].price, // Giá tiền
  }));
  return topProducts;
}


// async function recent(bills) {
//   try {
//     // Sắp xếp mảng bills theo thời gian giảm dần
//     const sortedBills = bills.sort(
//       (a, b) => new Date(b.time) - new Date(a.time)
//     );

//     // Chọn 6 phần tử đầu tiên
//     const recentBills = sortedBills.slice(0, 6);

//     // Lấy thông tin cần thiết từ mỗi đơn hàng
//     const result = await Promise.all(
//       recentBills.map(async (bill) => {
//         // Lấy tên món ăn từ sản phẩm đầu tiên của đơn hàng
//         const productName = bill.products[0].name;

//         // Lấy thông tin người dùng từ userModel
//         const user = await userModel.userModel.findById(bill.userId);
//         const userName = user ? user.username : null;

//         // Lấy thông tin nhà hàng từ restaurantsModel
//         const restaurant = await restaurantModel.restaurantModel.findById(
//           bill.products[0].restaurantId
//         );
//         const restaurantName = restaurant ? restaurant.name : null;

//         // Định dạng thời gian
//         const timeAgo = getTimeAgo(bill.time);

//         return {
//           productName,
//           restaurantName,
//           userName,
//           time: timeAgo,
//         };
//       })
//     );
//     console.log(result);
//     return result;
//   } catch (error) {
//     console.error("Error in recent function:", error);
//     return [];
//   }
// }


async function recent(bills, restaurantId) {
  try {
    // Lọc các hóa đơn liên quan đến restaurantId
    const filteredBills = bills.filter((bill) =>
      bill.products.some(
        (product) => product.restaurantId.toString() === restaurantId.toString()
      )
    );

    // Sắp xếp mảng bills theo thời gian giảm dần
    const sortedBills = filteredBills.sort(
      (a, b) => new Date(b.time) - new Date(a.time)
    );

    // Chọn 6 phần tử đầu tiên
    const recentBills = sortedBills.slice(0, 6);

    // Lấy thông tin cần thiết từ mỗi đơn hàng
    const result = await Promise.all(
      recentBills.map(async (bill) => {
        // Lấy tên món ăn từ sản phẩm đầu tiên của đơn hàng
        const productName = bill.products[0].name;

        // Lấy thông tin người dùng từ userModel
        const user = await userController.userModel.findById(bill.userId);
        const userName = user ? user.username : null;

        // Lấy thông tin nhà hàng từ restaurantsModel
        const restaurant = await restaurantModel.findById(
          bill.products[0].restaurantId
        );
        const restaurantName = restaurant ? restaurant.name : null;

        // Định dạng thời gian
        const timeAgo = getTimeAgo(bill.time);

        return {
          productName,
          restaurantName,
          userName,
          time: timeAgo,
        };
      })
    );
    console.log(result);
    return result;
  } catch (error) {
    console.error("Error in recent function:", error);
    return [];
  }
}

function getTimeAgo(time) {
  const now = new Date();
  const past = new Date(time);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'năm', seconds: 31536000 },
    { label: 'tháng', seconds: 2592000 },
    { label: 'tuần', seconds: 604800 },
    { label: 'ngày', seconds: 86400 },
    { label: 'giờ', seconds: 3600 },
    { label: 'phút', seconds: 60 },
    { label: 'giây', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label} trước`;
    }
  }
  return 'vừa xong';
}


function organizeDataByHour(bills) {
  const roundedTimes = bills.map((bill) => {
    const time = new Date(bill.time);
    const roundedTime = new Date(
      time.getFullYear(),
      time.getMonth(),
      time.getDate(),
      Math.floor(time.getHours() / 2) * 2
    );
    const revenue = parseFloat(bill.toltalprice) || 0; // Chuyển đổi thành số và mặc định là 0 nếu không phải số
    return { time: roundedTime, revenue, count: 1 };
  });

  roundedTimes.sort((a, b) => a.time - b.time);

  const data = [];

  roundedTimes.forEach((roundedTime) => {
    const hourKey = roundedTime.time.toISOString();
    const existingData = data.find((item) => item.time === hourKey);

    if (existingData) {
      existingData.count += roundedTime.count;
      existingData.revenue += roundedTime.revenue;
    } else {
      data.push({
        time: hourKey,
        count: roundedTime.count,
        revenue: roundedTime.revenue,
      });
    }
  });

  data.sort((a, b) => new Date(a.time) - new Date(b.time));
  const valuesForChart = data.map((item) => item.count);

  return {
    categories: data.map((item) => item.time),
    data: valuesForChart,
    revenue: data.map((item) => item.revenue),
  };
}

function organizeDataByMonth(bills) {
  // Lấy ra các ngày (không bao gồm giờ) duy nhất từ danh sách hóa đơn
  const uniqueDays = [
    ...new Set(
      bills.map((bill) =>
        new Date(bill.time).toISOString().split("T")[0].trim()
      )
    ),
  ];

  // Sắp xếp ngày tăng dần
  const categories = uniqueDays.sort();

  // Tính số lượng hóa đơn cho mỗi ngày
  const data = categories.map(
    (day) =>
      bills.filter((bill) => {
        const billDate = new Date(bill.time).toISOString().split("T")[0].trim();
        return billDate === day;
      }).length
  );

  // Tính tổng doanh thu cho mỗi ngày
  const revenue = categories.map((day) =>
    bills
      .filter(
        (bill) => new Date(bill.time).toISOString().split("T")[0].trim() === day
      )
      .reduce((total, bill) => total + bill.toltalprice, 0)
  );
  return { categories, data, revenue };
}

// Hàm để thêm ngày vào một ngày cụ thể
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

exports.getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ msg: "Cần cung cấp ngày bắt đầu và ngày kết thúc." });
    }

    const user = req.session.user;
    if (!user || !user._id) {
      return res.status(401).json({ msg: "Người dùng chưa được xác thực." });
    }

    const restaurantId = user._id;

    // Chuyển đổi startDate và endDate thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Tạo ngày tiếp theo của endDate
    const endNextDay = addDays(end, 1);

    // Lọc hóa đơn
    const orders = await historyModel.History.find({
      time: { $gte: start, $lt: endNextDay },
      status: 3,
      "products.restaurantId": restaurantId,
    });

    console.log("Orders fetched:", JSON.stringify(orders, null, 2));

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce(
      (total, order) => total + (order.toltalprice || 0),
      0
    );

    console.log("Total revenue calculated:", totalRevenue);

    // Chuẩn bị dữ liệu cho biểu đồ
    const categories = [];
    const revenues = [];
    const sales = [];

    orders.forEach((order) => {
      const date = new Date(order.time).toLocaleDateString("vi-VN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const index = categories.indexOf(date);

      if (index === -1) {
        categories.push(date);
        revenues.push(order.toltalprice || 0);
        sales.push(1);
      } else {
        revenues[index] += order.toltalprice || 0;
        sales[index] += 1;
      }
    });

    console.log("Categories:", categories);
    console.log("Revenues:", revenues);
    console.log("Sales:", sales);

    res.status(200).json({
      orders,
      totalRevenue,
      categories,
      revenues,
      sales,
    });
  } catch (error) {
    console.error("Lỗi khi lọc doanh thu:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
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

    // Chuyển đổi startDate và endDate thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Tạo ngày tiếp theo của endDate
    const endNextDay = addDays(end, 1);
    // Lọc hóa đơn
    const orders = await historyModel.History.find({
      time: { $gte: start, $lt: endNextDay },
      status: 3,
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




// Thêm hàm này vào historyOrderController.js

exports.getTotalRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ msg: "Cần cung cấp ngày bắt đầu và ngày kết thúc." });
    }

    // Chuyển đổi startDate và endDate thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);
    const endNextDay = addDays(end, 1);

    // Tìm tất cả các đơn hàng hoàn thành trong khoảng thời gian
    const orders = await historyModel.History.find({
      time: { $gte: start, $lt: endNextDay },
      status: 3, // Giả sử status 3 là hoàn thành
    });

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce(
      (total, order) => total + (order.toltalprice || 0),
      0
    );

    // Chuẩn bị dữ liệu cho biểu đồ
    const categories = [];
    const revenues = [];
    const sales = [];

    orders.forEach((order) => {
      const date = new Date(order.time).toLocaleDateString("vi-VN", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const index = categories.indexOf(date);

      if (index === -1) {
        categories.push(date);
        revenues.push(order.toltalprice || 0);
        sales.push(1);
      } else {
        revenues[index] += order.toltalprice || 0;
        sales[index] += 1;
      }
    });

    res.status(200).json({
      orders,
      totalRevenue,
      categories,
      revenues,
      sales,
    });
  } catch (error) {
    console.error("Lỗi khi lọc doanh thu cho tất cả chi nhánh:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra xem `userId` có hợp lệ không
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ msg: "ID người dùng không hợp lệ" });
    }

    // Truy vấn lịch sử đơn hàng của người dùng
    const userOrders = await historyModel.History.find({ userId })
      .populate({
        path: "products.productId",
        select: "name price image", // Lấy các trường cần thiết từ sản phẩm
      })
      .populate({
        path: "products.restaurantId",
        select: "name address", // Lấy thông tin nhà hàng
      });

    if (!userOrders || userOrders.length === 0) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy lịch sử đơn hàng cho người dùng này" });
    }

    // Trả về dữ liệu
    res.status(200).json(userOrders);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng của người dùng:", error);
    return res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};


exports.getFilteredOrders = async (req, res) => {
  try {
    // Lấy các tham số từ query
    // Ví dụ: /api/orders/filter?startDate=2025-01-01&endDate=2025-01-07
    const { startDate, endDate } = req.query;

    // Chuẩn bị object filter
    const filter = {};

    // Nếu startDate, endDate được truyền lên thì lọc theo khoảng ngày
    if (startDate || endDate) {
      filter.time = {};
      if (startDate) {
        filter.time.$gte = new Date(startDate);
      }
      if (endDate) {
        // Tạo một ngày ngay sau endDate
        const endNextDay = new Date(endDate);
        endNextDay.setDate(endNextDay.getDate() + 1);
        filter.time.$lt = endNextDay;
      }
    }

    // Bạn có thể thêm các điều kiện lọc khác tại đây
    // Ví dụ filter.status = 3, hay filter.userId = ...
    filter.status = 3; // Lấy đơn hàng status=3 (hoàn thành) chẳng hạn.

    console.log("Filter conditions:", filter);

    // Truy vấn từ DB
    const orders = await historyModel.History.find(filter)
      .populate({
        path: "userId",          // userId là trường trong historyModel
        select: "username",      // Lấy trường username (và các trường khác nếu cần)
      })
      // .populate({ ... nếu muốn populate thêm fields khác ... })
      .populate({
        path: "voucherId",
        select: "money name", // Lấy trường money và name từ voucher
      })
      .exec();

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy đơn hàng nào với điều kiện lọc." });
    }

    // Trả về mảng đơn hàng
    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lọc đơn hàng:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ" });
  }
};


