import apiClient from "../lib/axios";

export const productsApi = {
  // List all active products
  async getProducts() {
    const { data } = await apiClient.get("/products");
    return data;
  },

  // Get the free product
  async getFreeProduct() {
    const { data } = await apiClient.get("/products/free");
    return data;
  },

  // Get the VIP product
  async getVipProduct() {
    const { data } = await apiClient.get("/products/vip");
    return data;
  },

  // Get the MaxBet product
  async getMaxbetProduct() {
    const { data } = await apiClient.get("/products/maxbet");
    return data;
  },

  // Get a single product by id
  async getProductById(id) {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  // List products the current user can access
  async getMyProducts() {
    const { data } = await apiClient.get("/products/my-access");
    return data;
  },
};