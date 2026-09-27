// backend/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { passport } = require("./middleware/authentication");
const errorHandler = require("./middleware/errorHandler");

// Routers
const authRouter = require("./routes/auth.routes");
const tipsRouter = require("./routes/tips.routes");
const statsRouter = require("./routes/stats.routes");
const productsRouter = require("./routes/products.routes");
const subscriptionsRouter = require("./routes/subscriptions.routes");
const adminRouter = require("./routes/admin.routes");

const app = express();

// CORS configuration – driven by CORS_ORIGIN env (comma‑separated list)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non‑browser tools (curl, Postman, server‑to‑server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Static assets (e.g., uploaded avatars)
app.use("/public", express.static("public"));

// Health check / root endpoint
app.get("/", (req, res) =>
  res.json({ status: 200, message: "The Expertise Wins API is ready for development." })
);

// API routes – all prefixed with /api
app.use("/api/auth", authRouter);
app.use("/api/tips", tipsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/products", productsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/admin", adminRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎯 The Expertise Wins API running on port ${PORT}`);
});