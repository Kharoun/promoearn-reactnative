/**
 * PromoEarn Auth Service
 * Drop this file into your React Native project at: services/authService.js
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://promoearn-backend.onrender.com/api/v1/auth"

// ─── Token Management ─────────────────────────────────────────────────────────

const TokenStore = {
  async save(accessToken, refreshToken) {
    await AsyncStorage.multiSet([
      ["@pe_access_token", accessToken],
      ["@pe_refresh_token", refreshToken],
    ]);
  },
  async getAccess() {
    return AsyncStorage.getItem("@pe_access_token");
  },
  async getRefresh() {
    return AsyncStorage.getItem("@pe_refresh_token");
  },
  async clear() {
    await AsyncStorage.multiRemove(["@pe_access_token", "@pe_refresh_token"]);
  },
};

// ─── HTTP Client ──────────────────────────────────────────────────────────────

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (options.auth !== false) {
    const token = await TokenStore.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  // Auto-retry once with refreshed token if access token expired
  if (!res.ok && data.code === "TOKEN_EXPIRED") {
    const refreshed = await AuthService.refreshToken();
    if (refreshed) {
      const newToken = await TokenStore.getAccess();
      headers.Authorization = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      return retryRes.json();
    }
    // Refresh failed — token is gone, treat as logged out
    return { success: false, message: "Session expired. Please log in again.", code: "SESSION_EXPIRED" };
  }

  if (!res.ok) {
    return { success: false, message: data.message || `Error ${res.status}`, errors: data.errors };
  }

  return data;
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

const AuthService = {

  // ── Google ──────────────────────────────────────────────────────────────────
  async googleSignIn(idToken) {
    const data = await request("/google", {
      method: "POST",
      body: { idToken },
      auth: false,
    });
    if (data.success && data.data?.accessToken) {
      await TokenStore.save(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  },

  async completeProfile(profileData) {
    return request("/complete-profile", { method: "PATCH", body: profileData });
  },

  // ── Registration & Login ────────────────────────────────────────────────────
  async register(formData) {
    return request("/register", { method: "POST", body: formData, auth: false });
  },

  async login(identifier, password) {
    const data = await request("/login", {
      method: "POST",
      body: { identifier, password },
      auth: false,
    });
    if (data.success && data.data?.accessToken) {
      await TokenStore.save(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  },

  // ── OTP / Verification ──────────────────────────────────────────────────────
  async verifyEmail(email, otp) {
    const data = await request("/verify-email", {
      method: "POST",
      body: { email, otp },
      auth: false,
    });
    if (data.success && data.data?.accessToken) {
      await TokenStore.save(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  },

  async verifyPhone(phone, otp) {
    const data = await request("/verify-phone", {
      method: "POST",
      body: { phone, otp },
      auth: false,
    });
    if (data.success && data.data?.accessToken) {
      await TokenStore.save(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  },

  async resendOtp(identifier, type) {
    return request("/resend-otp", {
      method: "POST",
      body: { identifier, type },
      auth: false,
    });
  },

  // ── Password ────────────────────────────────────────────────────────────────
  async forgotPassword(identifier) {
    return request("/forgot-password", {
      method: "POST",
      body: { identifier },
      auth: false,
    });
  },

  async resetPassword(identifier, otp, newPassword) {
    return request("/reset-password", {
      method: "POST",
      body: { identifier, otp, newPassword },
      auth: false,
    });
  },

  // ── NEW: Change password (authenticated) ────────────────────────────────────
  async changePassword(currentPassword, newPassword) {
    return request("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  async saveTokens(accessToken, refreshToken) {
    await TokenStore.save(accessToken, refreshToken);
  },
  // ── NEW: Change username (authenticated) ────────────────────────────────────
  async changeUsername(username) {
    return request("/change-username", {
      method: "POST",
      body: { username },
    });
  },

  // ── NEW: Toggle 2FA (authenticated) — wire backend when ready ───────────────
  async toggleTwoFA(enabled) {
    return request("/toggle-2fa", {
      method: "POST",
      body: { enabled },
    });
  },

  // ── Token Management ────────────────────────────────────────────────────────
  async refreshToken() {
    try {
      const refreshToken = await TokenStore.getRefresh();
      if (!refreshToken) return false;
      const data = await request("/refresh-token", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      });
      if (data.success && data.data?.accessToken) {
        const existingRefresh = await TokenStore.getRefresh();
        await TokenStore.save(data.data.accessToken, existingRefresh);
        return true;
      }
      return false;
    } catch {
      await TokenStore.clear();
      return false;
    }
  },

  // ── User ────────────────────────────────────────────────────────────────────
  async getMe() {
    return request("/me", { method: "GET" });
  },

  async logout() {
    await TokenStore.clear();
  },
  
  async isLoggedIn() {
    const token = await TokenStore.getAccess();
    return !!token;
  },

  async getToken() {
    return TokenStore.getAccess();
  },
};

export default AuthService;
export { TokenStore };