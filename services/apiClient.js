import Constants from "expo-constants";
import { Platform } from "react-native";
import AuthService from "./authService";

const BASE_URL = "https://promoearn-backend.onrender.com/api/v1";

export const apiClient = async (endpoint, options = {}) => {
  const token = await AuthService.getToken();
  const headers = {
    "Content-Type": "application/json",
    "x-app-version": Constants.expoConfig?.version || "1.0.0",
    "x-platform": Platform.OS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

export const apiFormData = async (endpoint, formData) => {
  const token = await AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-app-version": Constants.expoConfig?.version || "1.0.0",
      "x-platform": Platform.OS,
    },
    body: formData,
  });
  return res.json();
};

export { BASE_URL };