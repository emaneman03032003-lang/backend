// Cart Controller (MongoDB)
const Cart = require('../models/Cart');

exports.getCart = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const cart = await Cart.findOne({ userId }).lean();
    if (!cart) return res.json({ success: true, cart: { items: [], total: 0 } });
    res.json({ success: true, cart });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch cart', message: error.message }); }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId;
    const { productId, quantity, productName, price, image } = req.body;
    if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing required fields' });

    const cart = await Cart.findOne({ userId });
    let cartData = cart || new Cart({ userId, items: [], total: 0 });

    const existing = cartData.items.find(i => String(i.productId) === String(productId));
    if (existing) existing.quantity += parseInt(quantity);
    else cartData.items.push({ productId, name: productName, price: parseFloat(price), quantity: parseInt(quantity) });

    cartData.total = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartData.updatedAt = new Date();
    await cartData.save();

    res.json({ success: true, message: 'Item added to cart', cart: cartData });
  } catch (error) { res.status(500).json({ error: 'Failed to add to cart', message: error.message }); }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId; const { productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'User ID and Product ID required' });
    const cart = await Cart.findOne({ userId }); if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.updatedAt = new Date(); await cart.save();
    res.json({ success: true, message: 'Item removed from cart', cart });
  } catch (error) { res.status(500).json({ error: 'Failed to remove from cart', message: error.message }); }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId; const { productId, quantity } = req.body;
    if (!userId || !productId || !quantity) return res.status(400).json({ error: 'Missing required fields' });
    const cart = await Cart.findOne({ userId }); if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const item = cart.items.find(i => String(i.productId) === String(productId)); if (!item) return res.status(404).json({ error: 'Product not in cart' });
    item.quantity = parseInt(quantity); cart.total = cart.items.reduce((sum, it) => sum + (it.price * it.quantity), 0); cart.updatedAt = new Date(); await cart.save();
    res.json({ success: true, message: 'Cart updated', cart });
  } catch (error) { res.status(500).json({ error: 'Failed to update cart', message: error.message }); }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user?.uid || req.body.userId; if (!userId) return res.status(400).json({ error: 'User ID required' });
    await Cart.findOneAndUpdate({ userId }, { items: [], total: 0, updatedAt: new Date() }, { upsert: true });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) { res.status(500).json({ error: 'Failed to clear cart', message: error.message }); }
};
