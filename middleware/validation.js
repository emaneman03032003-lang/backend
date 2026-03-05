// Input Validation Middleware
// XSS Protection and input sanitization

const { body, validationResult } = require('express-validator');

// Sanitize inputs
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove HTML tags and encode dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Product validation rules
const validateProduct = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters')
    .customSanitizer(sanitizeInput),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .customSanitizer(sanitizeInput),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
  
  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
    .customSanitizer(sanitizeInput)
];

// Order validation rules
const validateOrder = [
  body('customerName')
    .notEmpty().withMessage('Customer name required')
    .isLength({ min: 2 }).withMessage('Customer name must be at least 2 characters')
    .customSanitizer(sanitizeInput),
  body('items').isArray().notEmpty().withMessage('Order items required'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be valid'),
  body('shippingAddress')
    .notEmpty().withMessage('Shipping address required')
    .customSanitizer(sanitizeInput),
  body('customerEmail')
    .notEmpty().withMessage('Customer email required')
    .isEmail().withMessage('Invalid email address'),
  body('customerPhone')
    .notEmpty().withMessage('Customer phone required')
    .customSanitizer(sanitizeInput),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method required')
    .isIn(['COD', 'EASYPAISA', 'JAZZCASH', 'ONLINE_TRANSFER']).withMessage('Invalid payment method')
];

// Contact form validation
const validateContact = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .customSanitizer(sanitizeInput),
  
  body('email')
    .isEmail().withMessage('Invalid email address'),
  
  body('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
    .customSanitizer(sanitizeInput)
];

module.exports = {
  sanitizeInput,
  handleValidationErrors,
  validateProduct,
  validateOrder,
  validateContact
};
