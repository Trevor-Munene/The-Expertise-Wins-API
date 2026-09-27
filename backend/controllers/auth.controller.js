// backend/controllers/auth.controller.js
const passport = require("passport");
const authService = require("../services/auth.service");

// Helper to extract request data consistently
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  body: req.body,
  userId: req.user?.id,
});

const registerUser = async (req, res, next) => {
  try {
    const { body } = getRequestData(req);
    const user = await authService.registerUser(body);
    res.status(201).json({
      message: "User registered successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (error, user, info) => {
      try {
        if (error) {
          return next(error);
        }
        if (!user) {
          return res.status(401).json({
            message: info?.message || "Invalid email or password.",
          });
        }
        const loginResult = await authService.loginUser(user);
        return res.status(200).json({
          message: "Login successful.",
          ...loginResult,
        });
      } catch (error) {
        next(error);
      }
    }
  )(req, res, next);
};

const logoutUser = async (req, res, next) => {
  try {
    const result = await authService.logoutUser();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const { userId } = getRequestData(req);
    const user = await authService.getCurrentUser(userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { userId, body } = getRequestData(req);
    const result = await authService.updatePassword(userId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// New avatar update endpoint
const updateAvatar = async (req, res, next) => {
  try {
    const { userId } = getRequestData(req);
    // Assuming the imageHandler middleware stores the file path in req.file.path
    const avatarUrl = req.file?.path;
    const result = await authService.updateProfile(userId, { avatarUrl });
    res.status(200).json({ message: "Avatar updated", result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updatePassword,
  updateAvatar,
};