// frontend/src/api/products.api.js
import apiClient from "../lib/axios";

export const productsApi = {
  async getProducts() {
    const { data } = await apiClient.get("/products");
    return data;
  },

  async getFreeProduct() {
    const { data } = await apiClient.get("/products/free");
    return data;
  },

  async getVipProduct() {
    const { data } = await apiClient.get("/products/vip");
    return data;
  },

  async getMaxbetProduct() {
    const { data } = await apiClient.get("/products/maxbet");
    return data;
  },

  async getProductById(id) {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  async getMyProducts() {
    const { data } = await apiClient.get("/products/my-access");
    return data;
  },
};
