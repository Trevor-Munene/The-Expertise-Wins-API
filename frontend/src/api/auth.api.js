// frontend/src/api/auth.api.js
import apiClient from "../lib/axios";

export const authApi = {
  async register(payload) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },

  async login(payload) {
    const { data } = await apiClient.post("/auth/login", payload);
    return data; // { message, token, user }
  },

  async logout() {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  },

  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data.user;
  },

  async updatePassword(payload) {
    const { data } = await apiClient.patch("/auth/password", payload);
    return data;
  },

  async updateAvatar(file) {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await apiClient.patch("/auth/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
