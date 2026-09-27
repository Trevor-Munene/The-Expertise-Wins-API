// frontend/src/lib/auth.js
import Cookies from "js-cookie";

const TOKEN_KEY = "tekw_token";
const USER_KEY = "tekw_user";

export const auth = {
  setToken(token) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "Lax" });
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) || Cookies.get(TOKEN_KEY) || null;
  },

  setUser(user) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    Cookies.remove(TOKEN_KEY);
  },

  isAdmin(user) {
    const u = user || this.getUser();
    return u?.role === "ADMIN" || u?.role === "TIPSTER" || u?.role === "EDITOR";
  },

  isSuperAdmin(user) {
    const u = user || this.getUser();
    return u?.role === "ADMIN";
  },
};
