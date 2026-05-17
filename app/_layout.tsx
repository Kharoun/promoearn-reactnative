import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
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

import SplashScreen    from "../Screens/SplashScreen";
import LoginScreen     from "../Screens/LoginScreen";
import SignUpScreen    from "../Screens/SignUpScreen";
import VerifyOTPScreen from "../Screens/VerifyOTPScreen";
import ForgotPasswordScreen from "../Screens/ForgotPasswordScreen";
import Mainapp         from "../Screens/Mainapp";

type Screen = "splash" | "signup" | "login" | "verify" | "app" | "forgot";

export default function RootLayout() {
  const [screen,      setScreen]      = useState<Screen>("splash");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyMode,  setVerifyMode]  = useState<"email" | "phone">("email");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor:"#F8FAFF" }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  const renderScreen = () => {
    if (screen === "splash") {
      return <SplashScreen onFinish={async () => {
        const loggedIn = await AuthService.isLoggedIn();
        setScreen(loggedIn ? "app" : "login");
      }} />;
    }

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
        />
      );
    }

    return null;
  };

  return renderScreen();
}
 