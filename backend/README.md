# The Expertise Wins — Express Backend API

The `backend` directory contains the production Node.js / Express REST API server and Prisma ORM database pipeline powering **The Expertise Wins**.

## 📌 Features & Responsibilities

- **Authentication & Authorization**: Passport Local strategy, JWT stateless session authentication, password hashing with bcrypt, and role-based access control (`USER`, `TIPSTER`, `EDITOR`, `ADMIN`).
- **Tips & Curation Engine**: Exposes endpoints for public free tips, protected VIP predictions, single tip detail views, and full CRUD curation.
- **Performance & Analytics Engine**: Calculates real-time win rates, estimated ROI, average odds, sport breakdowns, market performance, and time-based reports (today, week, 14 days, month, year, all-time).
- **Products & Subscriptions**: Manages free & premium product tiers (`Free`, `VIP Channel`, `MaxBet VIP Platinum`), access token generation, token redemption, and active subscription verification.
- **Admin Management API**: Restricted administration endpoints for bulk tip publication/unsettlement, access token generation (single & bulk), user role management, and status suspension.
- **Media Uploads**: Multer static file handler storing user avatar uploads under `/public/profiles`.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma ORM (SQLite / PostgreSQL)
- **Authentication**: Passport.js & JWT (`jsonwebtoken`)
- **Validation**: Joi validation schemas

## 📡 API Route Architecture

- `/api/auth`: User registration, login, logout, me, password updates, avatar upload.
- `/api/tips`: Public free tips (`/free`), VIP tips (`/vip`), MaxBet tips (`/maxbet`), tip details, and management.
- `/api/stats`: Comprehensive analytics, win rates, ROI, sport/market breakdowns, and time period statistics.
- `/api/products`: Public and authenticated product tier information.
- `/api/subscriptions`: Active subscriptions, token redemption (`/redeem`), token verification, and subscription history.
- `/api/admin`: Isolated admin endpoints for user role management, bulk tip publication/settlement, single/bulk access token generation, and product management.

## 🚀 Running the Backend API

From the project root:

```bash
# Start backend in development mode with nodemon
npm run dev:backend

# Start backend in production mode
npm run start:backend
```

From inside `backend`:

```bash
npm run dev
npm run start
```
