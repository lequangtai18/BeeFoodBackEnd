// models/notify.model.js

const mongoose = require('mongoose');

const NotifySchema = new mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'History', required: true }, // Thêm trường orderId
  money: { type: Number, required: true },
  status: { type: Number, default: 0 }, // Trạng thái đơn hàng (tùy chọn)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model('Notify', NotifySchema);
