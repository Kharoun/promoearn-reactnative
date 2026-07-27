import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const BiometricAuth = {
  async isSupported() {
    if (Platform.OS === "web") return false;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate() {
    if (Platform.OS === "web") return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Log in to PromoEarn",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
    });
    return result.success;
  },

  async enableForUser(refreshToken) {
    if (Platform.OS === "web") return;
    await SecureStore.setItemAsync("pe_biometric_refresh_token", refreshToken);
  },

  async isEnabled() {
    if (Platform.OS === "web") return false;
    const token = await SecureStore.getItemAsync("pe_biometric_refresh_token");
    return !!token;
  },

  async getStoredToken() {
    if (Platform.OS === "web") return null;
    return SecureStore.getItemAsync("pe_biometric_refresh_token");
  },

  async disable() {
    if (Platform.OS === "web") return;
    await SecureStore.deleteItemAsync("pe_biometric_refresh_token");
  },
};