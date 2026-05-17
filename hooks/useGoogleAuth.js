import { useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AuthService from "../services/authService";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef   = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current   = onError;   }, [onError]);

  // ✅ Pass all three — Expo selects the right one per platform automatically
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      handleGoogleResponse(response.authentication.accessToken);
    } else if (response.type === "error") {
      setLoading(false);
      onErrorRef.current?.("Google sign-in failed. Please try again.");
    } else if (response.type === "cancel" || response.type === "dismiss") {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await userInfoRes.json();

      const res = await fetch("https://promoearn-backend.onrender.com/api/v1/auth/google", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId:  googleUser.id,
          email:     googleUser.email,
          firstName: googleUser.given_name,
          lastName:  googleUser.family_name,
          picture:   googleUser.picture,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await AuthService.saveTokens(data.data.accessToken, data.data.refreshToken);
        onSuccessRef.current?.();
      } else {
        onErrorRef.current?.(data.message || "Google login failed.");
      }
    } catch (err) {
      onErrorRef.current?.("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setLoading(false);
      onErrorRef.current?.("Failed to open Google sign-in.");
    }
  };

  return { signInWithGoogle, loading, ready: !!request };
}