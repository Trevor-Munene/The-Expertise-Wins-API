const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create an error with an HTTP status the error handler can read
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.status = statusCode;
  err.statusCode = statusCode;
  return err;
};

// Register a new user after checking required and unique fields
const registerUser = async (userData = {}) => {
  const { email, username, password, firstName, lastName } = userData;
  if (!email || !username || !password) {
    throw createError("Email, username and password are required.");
  }

  // Check that the email and username are not already taken
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { id: true },
  });
  if (existing) {
    throw createError("Email or username already in use.", 409);
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashed,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      role: "USER",
      status: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
    },
  });
  return user;
};

// Sign a JWT for an authenticated user
const loginUser = async (user) => {
  const payload = { id: user.id, role: user.role };
  const secret = process.env.JWT_SECRET || "default_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const token = jwt.sign(payload, secret, { expiresIn });

  // Return user data without the password
  const userInfo = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
  return { token, user: userInfo };
};

// Return a logout message since JWT logout happens on the client
const logoutUser = async () => {
  return { message: "Logged out successfully." };
};

// Get the current user's profile
const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw createError("User not found.", 404);
  return user;
};

// Change a user's password after verifying the current one
const updatePassword = async (userId, passwordData = {}) => {
  const { oldPassword, newPassword } = passwordData;
  if (!oldPassword || !newPassword) {
    throw createError("Both oldPassword and newPassword are required.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) throw createError("User not found.", 404);

  // Reject accounts that have no password set
  if (!user.password) throw createError("This account has no password set.", 400);

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw createError("Current password is incorrect.", 401);

  const hashed = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
    select: { id: true, email: true, username: true },
  });
  return { message: "Password updated successfully.", user: updated };
};

// Update allowed profile fields after checking unique values
const updateProfile = async (userId, profileData = {}) => {
  const allowedFields = [
    "email",
    "username",
    "firstName",
    "lastName",
    "avatarUrl",
    "telegramUsername",
    "telegramUserId",
    "status",
    "role",
  ];
  const data = {};
  for (const field of allowedFields) {
    if (profileData[field] !== undefined) data[field] = profileData[field];
  }
  if (Object.keys(data).length === 0) {
    throw createError("No profile fields provided for update.");
  }

  // Check unique fields only when they are being changed
  const conflictChecks = [];
  if (data.email) {
    conflictChecks.push(
      prisma.user.findFirst({ where: { email: data.email, NOT: { id: userId } }, select: { id: true } })
    );
  }
  if (data.username) {
    conflictChecks.push(
      prisma.user.findFirst({ where: { username: data.username, NOT: { id: userId } }, select: { id: true } })
    );
  }
  if (data.telegramUserId) {
    conflictChecks.push(
      prisma.user.findFirst({ where: { telegramUserId: data.telegramUserId, NOT: { id: userId } }, select: { id: true } })
    );
  }
  const conflicts = await Promise.all(conflictChecks);
  if (conflicts.some((c) => c)) {
    throw createError("Email, username, or Telegram user ID already in use.", 409);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, username: true, avatarUrl: true, firstName: true, lastName: true },
  });
  return updated;
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updatePassword,
  updateProfile,
};