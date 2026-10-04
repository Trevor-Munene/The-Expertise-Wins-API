// backend/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { passport } = require("./middleware/authentication");
const errorHandler = require("./middleware/errorHandler");

const authRouter = require("./routes/auth.routes");
const tipsRouter = require("./routes/tips.routes");
const statsRouter = require("./routes/stats.routes");
const productsRouter = require("./routes/products.routes");
const subscriptionsRouter = require("./routes/subscriptions.routes");
const adminRouter = require("./routes/admin.routes");
const prisma = require("./lib/prisma");

// Record a usage event for every finished API request
const appUsageTracker = (req, res, next) => {
  res.on("finish", () => {
    // Read the full path because mounted routers strip their prefix from req.path
    const path = req.originalUrl.split("?")[0];
    if (!path.startsWith("/api")) return;

    // Never let analytics break a real API response: guard the model and
    // swallow every failure, otherwise a stale or unreachable database
    // raises an unhandled rejection that can take the whole process down.
    Promise.resolve()
      .then(() => {
        if (typeof prisma.usageEvent?.create !== "function") return;
        return prisma.usageEvent.create({
          data: {
            event: `${req.method} ${path}`,
            path,
            userId: req.user?.id || null,
            metadata: { statusCode: res.statusCode },
          },
        });
      })
      .catch(() => {});
  });
  next();
};

const app = express();

// Read allowed origins from CORS_ORIGIN as a comma separated list
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Allow listed origins and non browser tools, and reject others without a server error
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  })
);

// Parse JSON and form request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialise Passport for JWT and local strategies
app.use(passport.initialize());

// Serve uploaded files such as avatars
app.use("/public", express.static("public"));

// Respond to the health check
app.get("/", (req, res) =>
  res.json({ status: 200, message: "The Expertise Wins API is ready for development." })
);

// Track usage, then mount all API routes under /api
app.use(appUsageTracker);
app.use("/api/auth", authRouter);
app.use("/api/tips", tipsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/products", productsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/admin", adminRouter);

// Return 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Handle errors from every route
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎯 The Expertise Wins API running on port ${PORT}`);
});