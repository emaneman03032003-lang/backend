// Order Controller (MongoDB)
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
});

exports.createOrder = async (req, res) => {
  try {
    const { userId, customerName, items, totalPrice, couponCode, discountAmount, shippingAddress, customerEmail, customerPhone, paymentMethod, paymentScreenshot } = req.body;
    
    // Validate required fields
    const missingFields = [];
    if (!customerName) missingFields.push('customerName');
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items');
    if (!totalPrice || isNaN(totalPrice)) missingFields.push('totalPrice');
    if (!shippingAddress) missingFields.push('shippingAddress');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!customerPhone) missingFields.push('customerPhone');
    if (!paymentMethod) missingFields.push('paymentMethod');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields', 
        missing: missingFields 
      });
    }

    // Validate payment method
    const validMethods = ['COD', 'EASYPAISA', 'JAZZCASH', 'ONLINE_TRANSFER'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid payment method', 
        valid: validMethods 
      });
    }

    // Check for duplicate orders (same customer email + items + total within 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const duplicateOrder = await Order.findOne({
      customerEmail,
      totalPrice: parseFloat(totalPrice),
      createdAt: { $gte: thirtySecondsAgo }
    });

    if (duplicateOrder) {
      return res.status(409).json({ 
        success: false,
        error: 'Duplicate order detected. Please wait before placing another order.', 
        existingOrderId: duplicateOrder._id 
      });
    }

    // Create order
    const finalPrice = parseFloat(totalPrice) - (discountAmount || 0);
    const trackingNumber = `GN-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    
    const order = await Order.create({
      userId: userId || 'guest',
      customerName,
      items,
      totalPrice: parseFloat(totalPrice),
      discountAmount: discountAmount || 0,
      finalPrice,
      couponCode: couponCode || null,
      shippingAddress,
      customerEmail,
      customerPhone,
      paymentMethod,
      paymentScreenshot: paymentScreenshot || null,
      status: 'Pending',
      trackingNumber
    });

    // Send confirmation email (best-effort, non-blocking)
    sendOrderConfirmationEmail(customerEmail, order, order._id).catch(e => {
      console.error('Order confirmation email failed:', e.message);
    });

    // Clear cart
    if (userId) {
      await Cart.findOneAndUpdate(
        { userId }, 
        { items: [], total: 0, updatedAt: new Date() }, 
        { upsert: true }
      ).catch(e => {
        console.error('Cart clear failed:', e.message);
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully', 
      orderId: order._id, 
      trackingNumber: order.trackingNumber,
      order 
    });

  } catch (error) {
    console.error('Order creation error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order', 
      message: error.message 
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID required' 
      });
    }


    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json({ 
      success: true, 
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Fetch user orders error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders', 
      message: error.message 
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }


    res.json({ 
      success: true, 
      order 
    });
  } catch (error) {
    console.error('Get order error:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch order', 
      message: error.message 
    });
  }
};

exports.getAllOrders = async (req, res) => {
  const logPrefix = '📋 [GET ALL ORDERS]';
  try {
    console.log(`${logPrefix} Admin fetching all orders`, {
      timestamp: new Date().toISOString(),
      userId: req.user?.uid || 'unknown'
    });

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`${logPrefix} Successfully retrieved orders`, {
      totalOrders: orders.length,
      latestOrder: orders[0]?._id,
      dateRange: orders.length > 0 ? {
        oldest: orders[orders.length - 1]?.createdAt,
        newest: orders[0]?.createdAt
      } : 'N/A'
    });

    res.json({ 
      success: true, 
      orders, 
      total: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`${logPrefix} Failed to fetch orders`, {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch orders', 
      message: error.message 
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const logPrefix = '🔄 [UPDATE ORDER STATUS]';
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status parameter
    if (!status) {
      console.warn(`${logPrefix} Status not provided`);
      return res.status(400).json({ 
        success: false,
        error: 'Status required' 
      });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      console.warn(`${logPrefix} Invalid status provided`, {
        providedStatus: status,
        validStatuses
      });
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status', 
        valid: validStatuses 
      });
    }

    // Find order first to verify it exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      console.warn(`${logPrefix} Order not found`, { orderId: id });
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    console.log(`${logPrefix} Updating order status`, {
      orderId: id,
      customerName: existingOrder.customerName,
      currentStatus: existingOrder.status,
      newStatus: status,
      adminUser: req.user?.uid || 'unknown'
    });

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      { 
        status, 
        updatedAt: new Date() 
      },
      { new: true }
    );

    console.log(`${logPrefix} Order status updated successfully`, {
      orderId: id,
      status,
      timestamp: updatedOrder.updatedAt
    });

    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error(`${logPrefix} Failed to update order status`, {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order', 
      message: error.message 
    });
  }
};

// Delete order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const logPrefix = '🗑️ [DELETE ORDER]';
    console.log(`${logPrefix} Attempting to delete order ID:`, req.params.id);
    
    const id = req.params.id;
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      console.warn(`${logPrefix} Order not found:`, id);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    console.log(`${logPrefix} Order deleted successfully`, {
      orderId: order._id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      totalAmount: order.totalPrice
    });
    
    res.json({ 
      success: true, 
      message: `Order ${order._id} deleted successfully`,
      deletedOrder: {
        _id: order._id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    console.error(`🗑️ [DELETE ORDER] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

async function sendOrderConfirmationEmail(customerEmail, orderData, orderId) {
  if (!customerEmail) return;
  const emailContent = `<div><h1>Order Confirmed</h1><p>Order ID: ${orderId}</p><p>Status: ${orderData.status}</p><p>Total: ${orderData.finalPrice}</p></div>`;
  await transporter.sendMail({ from: `GN SONS <${process.env.EMAIL_USER}>`, to: customerEmail, subject: `Order Confirmed - GN SONS | Order #${orderId}`, html: emailContent });
}

module.exports = {
  createOrder: exports.createOrder,
  getUserOrders: exports.getUserOrders,
  getOrderById: exports.getOrderById,
  getAllOrders: exports.getAllOrders,
  updateOrderStatus: exports.updateOrderStatus,
  deleteOrder: exports.deleteOrder
};
