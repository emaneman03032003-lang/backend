const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  name: String,
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' },
  customerName: { type: String, required: true },
  items: { type: [orderItemSchema], default: [] },
  totalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  couponCode: { type: String, default: null },
  shippingAddress: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  paymentMethod: { type: String, enum: ['COD', 'EASYPAISA', 'JAZZCASH', 'ONLINE_TRANSFER'] },
  paymentScreenshot: { type: String, default: null }, // Base64 or URL
  status: { type: String, enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  trackingNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
