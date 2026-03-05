# GN SONS Backend
Luxury E-Commerce Backend API

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` file (already setup with Firebase credentials)

3. Start development server:
```bash
npm run dev
```

Server runs on http://localhost:5000

## API Routes

### Products
- GET /api/products
- GET /api/products/:id
- POST /api/products (Admin)
- PUT /api/products/:id (Admin)
- DELETE /api/products/:id (Admin)

### Orders
- POST /api/orders
- GET /api/orders/:id
- GET /api/orders/user/:userId
- GET /api/orders/admin/all (Admin)
- PUT /api/orders/:id/status (Admin)

### Cart
- GET /api/cart/:userId
- POST /api/cart/add
- POST /api/cart/remove
- POST /api/cart/update
- POST /api/cart/clear/:userId

### Auth
- POST /api/auth/register
- POST /api/auth/admin/register
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/change-password

### Chat
- POST /api/chat/send
- GET /api/chat/conversation/:conversationId
- GET /api/chat/admin/conversations (Admin)
- PUT /api/chat/:messageId/read (Admin)
- DELETE /api/chat/:messageId (Admin)

### Contact
- POST /api/contact
- GET /api/contact/admin/all (Admin)
- PUT /api/contact/:id/status (Admin)

## Middleware

- Authentication (Firebase tokens)
- Role-based access control
- Input validation
- Rate limiting
- Error handling

## Technologies
- Node.js
- Express.js
- Firebase (Firestore, Auth, Storage)
- JWT
- Nodemailer

## Project Structure
```
backend/
├── config/
├── controllers/
├── middleware/
├── routes/
├── helpers/
├── utils/
├── server.js
├── package.json
└── .env
```
