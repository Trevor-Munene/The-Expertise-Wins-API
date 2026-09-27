// backend/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/** Register a new user */
async function registerUser(data) {
  const { email, password, name } = data;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}

/** Login user and issue JWT */
async function loginUser(user) {
  // user comes from passport local strategy (contains id, email, name, role)
  const payload = { sub: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  return { token, user };
}

/** Logout placeholder (stateless JWT) */
async function logoutUser() {
  return { message: 'Logout successful (client should discard token)' };
}

/** Get current user info */
async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, username: true, firstName: true, lastName: true, telegramUsername: true },
  });
  return user;
}

/** Update password */
async function updatePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error('Current password incorrect');
  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: newHash } });
  return { message: 'Password updated successfully' };
}

/** Update profile fields */
async function updateProfile(userId, updates) {
  const allowed = ['name', 'username', 'firstName', 'lastName', 'telegramUsername', 'avatarUrl'];
  const data = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  if (Object.keys(data).length === 0) {
    throw new Error('No valid profile fields provided');
  }
  const user = await prisma.user.update({ where: { id: userId }, data, select: { id: true, email: true, name: true, username: true, firstName: true, lastName: true, telegramUsername: true } });
  return { message: 'Profile updated', user };
}

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser, updatePassword, updateProfile };
