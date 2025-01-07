// controllers/notify.controller.js

const Notify = require("../models/notify.model"); // Import đúng cách và đổi tên biến thành Notify

// Hàm lấy thông báo theo userId
exports.getNotifyById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const listNoti = await Notify.find({ idUser: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ listNotify: listNoti });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ msg: error.message });
  }
};

// Hàm tạo thông báo mới
exports.postNotify = async (req, res) => {
  const { userId, orderId, toltalprice, status } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!userId || !orderId || !toltalprice) {
    return res.status(400).json({ msg: "Missing required fields: userId, orderId, toltalprice" });
  }

  const newNotification = {
    idUser: userId,
    orderId: orderId,
    money: toltalprice,
    status: status || 0, // Nếu không có status, mặc định là 0
  };

  try {
    const createdNotify = await Notify.create(newNotification);
    return res.status(201).json(createdNotify);
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ msg: error.message });
  }
};
