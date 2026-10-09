const passport = require("passport");
const authService = require("../services/auth.service");

// Extract request data, defaulting the body to an empty object
const getRequestData = (req) => ({
  params: req.params,
  query: req.query,
  body: req.body ?? {},
  userId: req.user?.id,
});

// Register a new user
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

// Authenticate with email and password and return a JWT
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

// Log out the current user
const logoutUser = async (req, res, next) => {
  try {
    const result = await authService.logoutUser();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get the current user's profile
const getCurrentUser = async (req, res, next) => {
  try {
    const { userId } = getRequestData(req);
    const user = await authService.getCurrentUser(userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Change the current user's password
const updatePassword = async (req, res, next) => {
  try {
    const { userId, body } = getRequestData(req);
    const result = await authService.updatePassword(userId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Update the current user's avatar from the uploaded file
const updateAvatar = async (req, res, next) => {
  try {
    const { userId } = getRequestData(req);
    const avatarUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/avatars/${encodeURIComponent(req.file.filename)}`
      : null;
    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar file is required." });
    }
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
