import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthService from "../services/authService";
import FeatureAnnouncementModal, { shouldShowVtuAnnouncement } from "../Screens/FeatureAnnouncementModal";
import { BiometricAuth } from "../services/biometricAuth";

// import SplashScreen         from "../Screens/SplashScreen";
import LoginScreen          from "../Screens/LoginScreen";
import SignUpScreen         from "../Screens/SignUpScreen";
import VerifyOTPScreen      from "../Screens/VerifyOTPScreen";
import ForgotPasswordScreen from "../Screens/ForgotPasswordScreen";
import CommunityPopup from "../Screens/Communitypopup";
import Mainapp              from "../Screens/Mainapp";
import * as ExpoSplashScreen from "expo-splash-screen";

type Screen = "splash" | "signup" | "login" | "verify" | "app" | "forgot";

export default function RootLayout() {
  const [screen, setScreen] = useState<Screen>("app");
  const [authChecked, setAuthChecked] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [showVtuAnnouncement, setShowVtuAnnouncement] = useState(false);
  const [pendingVtuAction, setPendingVtuAction] = useState<"airtime" | "data" | null>(null);
  const [verifyMode,  setVerifyMode]  = useState<"email" | "phone">("email");
  const [showCommunity, setShowCommunity] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  // Chain: after the community popup closes, check if the VTU announcement is due
  const handleCommunityClose = async () => {
    setShowCommunity(false);
    const due = await shouldShowVtuAnnouncement();
    if (due) setShowVtuAnnouncement(true);
  };

  useEffect(() => {
    ExpoSplashScreen.hideAsync();
    (async () => {
      const loggedIn = await AuthService.isLoggedIn();
      if (!loggedIn) {
        const bioEnabled = await BiometricAuth.isEnabled();
        if (bioEnabled) {
          const success = await BiometricAuth.authenticate();
          if (success) {
            const token = await BiometricAuth.getStoredToken();
            const refreshed = await AuthService.refreshSessionWithToken?.(token);
            if (refreshed) { setScreen("app"); setAuthChecked(true); return; }
          }
        }
        setScreen("login"); setAuthChecked(true); return;
      }
      const expired = await AuthService.isSessionExpired();
      if (expired) {
        await AuthService.clearSession();
        setScreen("login");
        setAuthChecked(true);
        return;
      }
      setScreen("app");
      setAuthChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (screen === "app") {
      setShowCommunity(true);
    } else {
      setShowCommunity(false);
    }
  }, [screen]);

  useEffect(() => {
    const { AppState } = require("react-native");
    const sub = AppState.addEventListener("change", async (nextState: string) => {
      if (nextState === "active" && screen === "app") {
        const expired = await AuthService.isSessionExpired();
        if (expired) {
          await AuthService.clearSession();
          setScreen("login");
          return;
        }
        setShowCommunity(true);
      }
    });
    return () => sub.remove();
  }, [screen]);

  if (!fontsLoaded || !authChecked) {
    return (
      <SafeAreaProvider>
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor:"#F8FAFF" }}>
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    if (screen === "signup") {
      return (
        <SignUpScreen
          onSignUp={(email: string, phone: string, mode: "email" | "phone") => {
            if (!email && !phone) { setScreen("app"); return; }
            setVerifyEmail(email || "");
            setVerifyPhone(phone || "");
            setVerifyMode(mode || "email");
            setScreen("verify");
          }}
          onLogin={() => setScreen("login")}
        />
      );
    }

    if (screen === "login") {
      return (
        <LoginScreen
          onLogin={() => setScreen("app")}
          onSignUp={() => setScreen("signup")}
          onForgot={() => setScreen("forgot")}
        />
      );
    }

    if (screen === "forgot") {
      return (
        <ForgotPasswordScreen
          onBack={() => setScreen("login")}
          onSuccess={() => setScreen("login")}
        />
      );
    }

    if (screen === "verify") {
      return (
        <VerifyOTPScreen
          email={verifyEmail}
          phone={verifyPhone}
          mode={verifyMode}
          onVerified={() => setScreen("app")}
        />
      );
    }

    if (screen === "app") {
      return (
        <Mainapp
          onLogout={async () => {
            await AuthService.logout();
            await AsyncStorage.removeItem("pe_cached_user");
            setScreen("login");
          }}
          pendingVtuAction={pendingVtuAction}
          onConsumePendingVtuAction={() => setPendingVtuAction(null)}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}

      <CommunityPopup
        visible={showCommunity && screen === "app"}
        onClose={handleCommunityClose}
      />

      <FeatureAnnouncementModal
        visible={showVtuAnnouncement}
        onClose={() => setShowVtuAnnouncement(false)}
        onOpenAirtime={() => {
          setShowVtuAnnouncement(false);
          setPendingVtuAction("airtime");
        }}
        onOpenData={() => {
          setShowVtuAnnouncement(false);
          setPendingVtuAction("data");
        }}
      />
    </SafeAreaProvider>
  );
}