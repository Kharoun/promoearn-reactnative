/**
 * VerifyOTPScreen.tsx — Fixed:
 * 1. Error message shown for wrong OTP
 * 2. Skip button removed (OTP is mandatory)
 * 3. Correct user redirected to their own app on success
 */

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated,
} from "react-native";
import AuthService from "../services/authService";
import { fonts } from "../utils/typography";

type Mode = "email" | "phone";

type Props = {
  onVerified: () => void;
  email: string;
  phone: string;
  mode: Mode;
};

const BLUE  = "#1A56DB";
const DARK  = "#0F172A";
const WHITE = "#FFFFFF";
const GREEN = "#10B981";
const RED   = "#EF4444";

// ─── OTP Box Input ────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled, hasError }: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(6, " ").split("");

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "center", marginVertical: 8 }}>
        {digits.map((d, i) => (
          <View key={i} style={[
            otp.box,
            value.length === i && otp.boxActive,
            value.length > i && otp.boxFilled,
            hasError && otp.boxError,  // ← red border on wrong OTP
          ]}>
            <Text style={[otp.digit, hasError && { color: RED }]}>{d.trim()}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
        editable={!disabled}
        autoFocus
      />
    </TouchableOpacity>
  );
}

const otp = StyleSheet.create({
  box:       { width: 48, height: 58, borderRadius: 14, borderWidth: 2, borderColor: "#E2E8F0", backgroundColor: "#F8FAFF", alignItems: "center", justifyContent: "center" },
  boxActive: { borderColor: BLUE, backgroundColor: "#EEF4FF" },
  boxFilled: { borderColor: BLUE, backgroundColor: "#EEF4FF" },
  boxError:  { borderColor: RED, backgroundColor: "#FFF5F5" },
  digit:     { fontFamily: fonts.extrabold, fontSize: 24, color: DARK },
});

// ─── Shake Animation ──────────────────────────────────────────────────────────
function useShake() {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  return { shakeAnim, shake };
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);
  const reset = () => setTimeLeft(seconds);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  return { timeLeft, label: `${mm}:${ss}`, reset };
}

// ─── Single OTP Panel ─────────────────────────────────────────────────────────
function OtpPanel({
  type, target, onVerified,
}: {
  type: Mode;
  target: string;
  onVerified: () => void;
}) {
  const [code,      setCode]      = useState("");
  const [verified,  setVerified]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState("");   // ← error message state
  const [attempts,  setAttempts]  = useState(0);   // ← track wrong attempts
  const countdown = useCountdown(600);
  const { shakeAnim, shake } = useShake();

  const masked = type === "email"
    ? (target ? `${target[0]}***@${target.split("@")[1]}` : "")
    : (target ? `+***${target.slice(-4)}` : "");

  const handleVerify = async () => {
    if (code.length < 6) return;
    setError(""); // clear previous error
    try {
      setLoading(true);
      const result = type === "email"
        ? await AuthService.verifyEmail(target, code)
        : await AuthService.verifyPhone(target, code);

      if (result.success) {
        setVerified(true);
        setError("");
      } else {
        // ── Wrong OTP — show error, shake, clear code ──
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        const errorMsg = newAttempts >= 3
          ? `Incorrect code. ${newAttempts} failed attempts. Please request a new code.`
          : result.message || "Incorrect code. Please check and try again.";

        setError(errorMsg);
        shake();                      // ← shake the boxes
        setCode("");                  // ← clear the input so user can retry
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      shake();
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify();
    }
  }, [code]);

  const handleResend = async () => {
    try {
      setResending(true);
      setError("");
      setAttempts(0);
      await AuthService.resendOtp(target, type);
      setCode("");
      countdown.reset();
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (verified) {
    return (
      <View style={p.verifiedBox}>
        <Text style={p.verifiedIcon}>✅</Text>
        <Text style={p.verifiedTitle}>
          {type === "email" ? "Email Verified!" : "Phone Verified!"}
        </Text>
        <Text style={p.verifiedSub}>
          Your {type} has been successfully verified.
        </Text>
        <TouchableOpacity style={p.continueBtn} onPress={onVerified} activeOpacity={0.85}>
          <Text style={p.continueBtnText}>Continue to App 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {/* Destination info */}
      <View style={p.infoBox}>
        <Text style={p.infoIcon}>{type === "email" ? "✉️" : "📱"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={p.infoTitle}>Code sent to</Text>
          <Text style={p.infoTarget}>{masked}</Text>
        </View>
      </View>

      {/* OTP boxes with shake animation */}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <OtpInput
          value={code}
          onChange={(val) => {
            setCode(val);
            if (error) setError(""); // clear error when user starts typing again
          }}
          disabled={loading}
          hasError={!!error}
        />
      </Animated.View>

      {/* ── Error message ── */}
      {error ? (
        <View style={p.errorBox}>
          <Text style={p.errorIcon}>⚠️</Text>
          <Text style={p.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Timer */}
      <View style={{ alignItems: "center", marginTop: error ? 8 : 12, marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: "#94A3B8", fontFamily: fonts.regular }}>
          {countdown.timeLeft > 0
            ? `Code expires in ${countdown.label}`
            : "Code expired — please request a new one"}
        </Text>
      </View>

      {/* Verify button */}
      <TouchableOpacity
        style={[p.verifyBtn, (code.length < 6 || loading) && p.verifyBtnDisabled]}
        onPress={handleVerify}
        disabled={code.length < 6 || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={p.verifyBtnText}>
              Verify {type === "email" ? "Email" : "Phone"} ✓
            </Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        style={{ alignItems: "center", marginTop: 16, padding: 8 }}
        onPress={handleResend}
        disabled={countdown.timeLeft > 540 || resending}
        activeOpacity={0.7}
      >
        {resending
          ? <ActivityIndicator size="small" color={BLUE} />
          : <Text style={{
              fontSize: 14,
              fontFamily: fonts.semibold,
              color: countdown.timeLeft > 540 ? "#CBD5E1" : BLUE,
            }}>
              {countdown.timeLeft > 540
                ? `Resend available in ${countdown.timeLeft - 540}s`
                : "Didn't receive a code? Resend"}
            </Text>
        }
      </TouchableOpacity>

      {/* ── Skip button REMOVED — verification is mandatory ── */}
    </View>
  );
}

const p = StyleSheet.create({
  infoBox:          { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8FAFF", borderRadius: 14, padding: 16, marginBottom: 8 },
  infoIcon:         { fontSize: 28 },
  infoTitle:        { fontSize: 12, color: "#94A3B8", fontFamily: fonts.semibold, textTransform: "uppercase", letterSpacing: 0.5 },
  infoTarget:       { fontSize: 15, fontFamily: fonts.bold, color: DARK, marginTop: 2 },

  // ── Error styles ──
  errorBox:         { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFF5F5", borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorIcon:        { fontSize: 14 },
  errorText:        { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: RED, lineHeight: 18 },

  verifyBtn:        { backgroundColor: BLUE, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 20, shadowColor: BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  verifyBtnDisabled:{ backgroundColor: "#93AAED", shadowOpacity: 0 },
  verifyBtnText:    { color: WHITE, fontSize: 16, fontFamily: fonts.bold, letterSpacing: 0.4 },

  verifiedBox:      { alignItems: "center", paddingVertical: 16 },
  verifiedIcon:     { fontSize: 52, marginBottom: 12 },
  verifiedTitle:    { fontSize: 22, fontFamily: fonts.black, color: GREEN, marginBottom: 8 },
  verifiedSub:      { fontSize: 14, fontFamily: fonts.regular, color: "#64748B", textAlign: "center", marginBottom: 24 },
  continueBtn:      { backgroundColor: GREEN, borderRadius: 14, height: 54, width: "100%", alignItems: "center", justifyContent: "center", shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  continueBtnText:  { color: WHITE, fontSize: 16, fontFamily: fonts.bold },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VerifyOTPScreen({ onVerified, email, phone, mode }: Props) {
  const showEmail = !!email && !email.startsWith("ph_");
  const showPhone = !!phone;

  const title = mode === "email" ? "Check your email 📬" : "Check your phone 📱";
  const subtitle = mode === "email"
    ? "We sent a 6-digit code to your email address. Enter it below to verify your account."
    : "We sent a 6-digit code to your phone via SMS. Enter it below to verify your account.";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFF" }}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 4, backgroundColor: BLUE }} />

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: WHITE, fontSize: 13, fontFamily: fonts.black }}>PE</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: fonts.extrabold, color: DARK, letterSpacing: -0.5 }}>
              Promo<Text style={{ color: BLUE }}>Earn</Text>
            </Text>
          </View>
          <Text style={{ fontSize: 26, fontFamily: fonts.black, color: DARK, letterSpacing: -0.5, marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: "#64748B", lineHeight: 22 }}>
            {subtitle}
          </Text>

          {/* ── Mandatory notice — replaces the skip button ── */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: "#FED7AA" }}>
            <Text style={{ fontSize: 14 }}>🔒</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: "#9A3412", flex: 1, lineHeight: 17 }}>
              Verification is required to protect your account and access your earnings.
            </Text>
          </View>
        </View>

        {/* Card */}
        <View style={{ backgroundColor: WHITE, marginHorizontal: 16, borderRadius: 24, padding: 24, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 }}>

          {mode === "email" && showEmail && (
            <OtpPanel
              type="email"
              target={email}
              onVerified={onVerified}
            />
          )}

          {mode === "phone" && showPhone && (
            <OtpPanel
              type="phone"
              target={phone}
              onVerified={onVerified}
            />
          )}

          {/* Fallback */}
          {!showEmail && !showPhone && (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text style={{ fontSize: 16, fontFamily: fonts.regular, color: "#64748B", textAlign: "center", marginBottom: 20 }}>
                Your account has been created!
              </Text>
              <TouchableOpacity style={p.continueBtn} onPress={onVerified} activeOpacity={0.85}>
                <Text style={p.continueBtnText}>Continue to App 🚀</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={{ textAlign: "center", fontSize: 12, fontFamily: fonts.regular, color: "#CBD5E1", marginTop: 24, paddingHorizontal: 40, lineHeight: 18 }}>
          {mode === "email"
            ? "Check your spam folder if you don't see the email 📬"
            : "SMS may take a few seconds to arrive 📱"}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}