// backend/services/auth.service.js
const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper to create HTTP‑style errors
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// ---------- Register ----------
const registerUser = async (userData) => {
  const { email, username, password, firstName, lastName } = userData;
  if (!email || !username || !password) {
    throw createError("Email, username and password are required.");
  }

  // Ensure unique email / username
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

// ---------- Login ----------
const loginUser = async (user) => {
  const payload = { id: user.id, role: user.role };
  const secret = process.env.JWT_SECRET || "default_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const token = jwt.sign(payload, secret, { expiresIn });
  // Return minimal user data (no password)
  const userInfo = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
  return { token, user: userInfo };
};

// ---------- Logout ----------
// In stateless JWT flow logout is a client‑side operation. We keep a placeholder.
const logoutUser = async () => {
  return { message: "Logged out successfully." };
};

// ---------- Get Current User ----------
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

// ---------- Update Password ----------
const updatePassword = async (userId, passwordData) => {
  const { oldPassword, newPassword } = passwordData;
  if (!oldPassword || !newPassword) {
    throw createError("Both oldPassword and newPassword are required.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) throw createError("User not found.", 404);

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

// ---------- Update Profile (e.g., avatar) ----------
const updateProfile = async (userId, profileData) => {
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

  // Ensure unique constraints for email/username/telegramUserId if they are being changed
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
