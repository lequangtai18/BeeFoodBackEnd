const { default: mongoose } = require("mongoose");
var db = require("./db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Định nghĩa secret
const secret = 'secret';
const restaurantSchema = new mongoose.Schema(
  {
    name: String,
    account: String,
    password: { type: String, required: true },
    image: String,
    role: { type: String, required: false, default: "user" },
    address: String,
    timeon: String,
    timeoff: String,
    email: String,
    phone: String,
    totalEvaluate: { type: Number, default: 0 },
    totalStar: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
  },
  {
    collection: "restaurants",
    timestamps: true,
  }
);

/**
 * Hàm tạo token để đăng nhập với API
 * @returns {Promise<*>}
 */
restaurantSchema.methods.generateAuthToken = async function () {
  const restaurant = this;

  console.log(restaurant);

  // Tạo token sử dụng secret
  const token = jwt.sign(
    { _id: restaurant._id, account: restaurant.account },
    secret // Sử dụng secret ở đây
  );

  restaurant.token = token;
  await restaurant.save();
  return token;
};

restaurantSchema.statics.findByCredentials = async (account, password) => {
  const restaurant = await restaurantModel.findOne({ account });
  if (!restaurant) {
    throw new Error({ error: "Không tồn tại nhà hàng" });
  }
  const isPasswordMatch = await bcrypt.compare(password, restaurant.password);
  if (!isPasswordMatch) {
    throw new Error({ error: "Sai password" });
  }
  return restaurant;
};

const restaurantModel = db.mongoose.model("restaurantModel", restaurantSchema);
module.exports = {
  restaurantModel,
};
