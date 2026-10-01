const { Router } = require("express");

const authController = require("../controllers/auth.controller");
const { authenticateJWT } = require("../middleware/authentication");

const authRouter = Router();

// Authentication
authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.loginUser);
authRouter.post("/logout", authController.logoutUser);

// Protected routes
const upload = require("../middleware/imageHandler");

// Current user profile & avatar upload route
authRouter.get("/me", authenticateJWT, authController.getCurrentUser);
authRouter.patch("/me/avatar", authenticateJWT, upload.single("avatar"), authController.updateAvatar);
authRouter.patch("/password", authenticateJWT, authController.updatePassword);

module.exports = authRouter;