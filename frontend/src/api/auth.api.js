import apiClient from "../lib/axios";

export const authApi = {
  // Register a new user
  async register(payload) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },

  // Log in and return { message, token, user }
  async login(payload) {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  },

  // Log out the current user
  async logout() {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  },

  // Get the current user's profile
  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data.user;
  },

  // Change the current user's password, expecting { oldPassword, newPassword }
  async updatePassword(payload) {
    const { data } = await apiClient.patch("/auth/password", payload);
    return data;
  },

  // Upload a new avatar and let the browser set the multipart boundary
  async updateAvatar(file) {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await apiClient.patch("/auth/me/avatar", form);
    return data;
  },
};