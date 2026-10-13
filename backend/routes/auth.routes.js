const { Router } = require("express");

const authController = require("../controllers/auth.controller");
const { authenticateJWT } = require("../middleware/authentication");
const {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword,
} = require("../middleware/validation");
const upload = require("../middleware/imageHandler");

const authRouter = Router();

// Register, log in and log out
authRouter.post("/register", validateRegistration, authController.registerUser);
authRouter.post("/login", validateLogin, authController.loginUser);
authRouter.post("/logout", authController.logoutUser);

// Get the current user's profile
authRouter.get("/me", authenticateJWT, authController.getCurrentUser);
authRouter.patch("/me", authenticateJWT, validateUpdateProfile, authController.updateCurrentUserProfile);

// Upload a new avatar for the current user
authRouter.patch("/me/avatar", authenticateJWT, upload.single("avatar"), authController.updateAvatar);

// Change the current user's password
authRouter.patch("/password", authenticateJWT, validateUpdatePassword, authController.updatePassword);

module.exports = authRouter;
