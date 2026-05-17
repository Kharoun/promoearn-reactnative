/**
 * ForgotPasswordScreen.jsx — PromoEarn
 * Full-page screen (not overlay), fixed OTP layout,
 * proper email validation with user notification
 */

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { fonts } from "../utils/typography";

const BASE_URL = "https://promoearn-backend.onrender.com/api/v1"

const C = {
  blue:   "#1A56DB",
  dark:   "#0F172A",
  white:  "#FFFFFF",
  green:  "#10B981",
  red:    "#EF4444",
  muted:  "#64748B",
  border: "#E2E8F0",
  light:  "#F8FAFF",
  slate:  "#94A3B8",
  gold:   "#F59E0B",
};

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = {
  Mail:   ({sz=22,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="4" width="20" height="16" rx="2"/><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Svg>,
  Lock:   ({sz=22,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>,
  Eye:    ({sz=18,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></Svg>,
  EyeOff: ({sz=18,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><Line x1="1" y1="1" x2="23" y2="23"/></Svg>,
  Back:   ({sz=20,cl=C.dark})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>,
  Check:  ({sz=44,cl=C.green}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>,
};

// ── Password Strength ──────────────────────────────────────────────────────
function PwStrength({ password }) {
  if (!password) return null;
  const s = password.length < 6
    ? { label:"Weak",   color:C.red,   pct:"30%" }
    : password.length < 10
    ? { label:"Fair",   color:C.gold,  pct:"60%" }
    : { label:"Strong", color:C.green, pct:"100%" };
  return (
    <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginTop:6, marginBottom:8 }}>
      <View style={{ flex:1, height:4, backgroundColor:C.border, borderRadius:2, overflow:"hidden" }}>
        <View style={{ width:s.pct, height:"100%", backgroundColor:s.color, borderRadius:2 }}/>
      </View>
      <Text style={{ fontFamily:fonts.bold, fontSize:11, color:s.color, width:46 }}>{s.label}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function ForgotPasswordScreen({ onBack, onSuccess }) {
  const [step,        setStep]        = useState(1); // 1=email 2=otp 3=newpass 4=done
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState(["","","","","",""]);
  const [resetToken,  setResetToken]  = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [info,        setInfo]        = useState(""); // for non-error messages
  const [resendTimer, setResendTimer] = useState(0);
  const [resending,   setResending]   = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startResendTimer = () => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── OTP box handler ───────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError(""); setInfo("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Please enter your email address."); return; }
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Please enter a valid email address."); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (data.success) {
        // Check if backend explicitly said email not found
        if (data.emailFound === false || (data.message && data.message.toLowerCase().includes("not found"))) {
          setError("No PromoEarn account found with this email address. Please check and try again.");
          return;
        }
        setStep(2);
        startResendTimer();
        setInfo("A 6-digit code has been sent to your email.");
      } else {
        // Backend returned failure — could be email not found
        if (data.message?.toLowerCase().includes("not found") ||
            data.message?.toLowerCase().includes("no account") ||
            data.message?.toLowerCase().includes("does not exist")) {
          setError("No PromoEarn account found with this email address. Please check and try again.");
        } else {
          setError(data.message || "Failed to send reset code. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError(""); setInfo("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.data.resetToken);
        setStep(3);
      } else {
        setError(data.message || "Invalid or expired code. Please try again.");
        setOtp(["","","","","",""]);
        otpRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Resend OTP ────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true); setError(""); setInfo("");
    setOtp(["","","","","",""]);
    try {
      const res  = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        startResendTimer();
        setInfo("A new code has been sent to your email.");
        otpRefs.current[0]?.focus();
      } else {
        setError(data.message || "Failed to resend code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError(""); setInfo("");
    if (newPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), resetToken, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setError(data.message || "Failed to reset password. Please start again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Back navigation per step ──────────────────────────────────────────────
  const handleBack = () => {
    if (step === 1) { onBack(); return; }
    if (step === 2) { setStep(1); setOtp(["","","","","",""]); setError(""); setInfo(""); return; }
    if (step === 3) { setStep(2); setError(""); setInfo(""); return; }
    if (step === 4) { onSuccess(); }
  };

  // ── Progress dots ─────────────────────────────────────────────────────────
  const ProgressDots = () => (
    <View style={{ flexDirection:"row", justifyContent:"center", gap:8, marginBottom:32 }}>
      {[1,2,3].map(n => (
        <View key={n} style={{
          width: step > n ? 24 : step === n ? 32 : 8,
          height: 8, borderRadius: 4,
          backgroundColor: step >= n ? C.blue : C.border,
        }}/>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.light }}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":"height"}>

        {/* ── Header ── */}
        <View style={st.header}>
          <TouchableOpacity onPress={handleBack} style={st.backBtn} activeOpacity={0.7}>
            <Ico.Back sz={20}/>
          </TouchableOpacity>
          {/* Logo */}
          <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
            <View style={{ width:32, height:32, borderRadius:9, backgroundColor:C.blue, alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontFamily:fonts.black, color:C.white, fontSize:11, letterSpacing:0.5 }}>PE</Text>
            </View>
            <Text style={{ fontFamily:fonts.extrabold, fontSize:17, color:C.dark, letterSpacing:-0.4 }}>
              Promo<Text style={{ color:C.blue }}>Earn</Text>
            </Text>
          </View>
          <View style={{ width:42 }}/>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow:1, paddingHorizontal:24, paddingBottom:40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {step < 4 && <ProgressDots/>}

          {/* ══════════════════════════════════════════
              STEP 1 — Email Entry
          ══════════════════════════════════════════ */}
          {step === 1 && (
            <View style={{ flex:1 }}>
              {/* Icon */}
              <View style={st.iconWrap}>
                <Ico.Mail sz={32} cl={C.blue}/>
              </View>

              <Text style={st.title}>Forgot Password?</Text>
              <Text style={st.subtitle}>
                Enter the email address linked to your PromoEarn account and we'll send you a 6-digit reset code.
              </Text>

              {/* Email field */}
              <Text style={st.label}>Email Address</Text>
              <View style={[st.inputRow, error && { borderColor:C.red, backgroundColor:"#FFF5F5" }]}>
                <Ico.Mail sz={18} cl={error ? C.red : C.blue}/>
                <TextInput
                  style={[st.input, { marginLeft:10 }]}
                  placeholder="you@example.com"
                  placeholderTextColor={C.slate}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSendOtp}
                />
              </View>

              {/* Error */}
              {error ? (
                <View style={st.errorBox}>
                  <Text style={{ fontSize:16 }}>⚠️</Text>
                  <Text style={st.errorTxt}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[st.btn, { marginTop:24 }, (!email.trim() || loading) && st.btnDisabled]}
                onPress={handleSendOtp}
                disabled={!email.trim() || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={C.white}/>
                  : <Text style={st.btnTxt}>Send Reset Code</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={onBack} style={{ alignItems:"center", marginTop:20 }} activeOpacity={0.7}>
                <Text style={{ fontFamily:fonts.medium, fontSize:14, color:C.muted }}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════
              STEP 2 — OTP Entry
          ══════════════════════════════════════════ */}
          {step === 2 && (
            <View style={{ flex:1 }}>
              <View style={st.iconWrap}>
                <Text style={{ fontSize:32 }}>🔐</Text>
              </View>

              <Text style={st.title}>Enter Reset Code</Text>
              <Text style={st.subtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={{ fontFamily:fonts.bold, color:C.dark }}>{email}</Text>
              </Text>

              {/* Info banner */}
              {info ? (
                <View style={[st.infoBox, { marginBottom:16 }]}>
                  <Text style={{ fontSize:14 }}>✅</Text>
                  <Text style={st.infoTxt}>{info}</Text>
                </View>
              ) : null}

              {/* OTP boxes — 6 individual boxes */}
              <View style={st.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={ref => otpRefs.current[idx] = ref}
                    style={[st.otpBox, digit && { borderColor:C.blue, backgroundColor:"#EEF4FF" }, error && !digit && { borderColor:C.red }]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v, idx)}
                    onKeyPress={e => handleOtpKey(e, idx)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    caretHidden
                  />
                ))}
              </View>

              {/* Error */}
              {error ? (
                <View style={st.errorBox}>
                  <Text style={{ fontSize:16 }}>⚠️</Text>
                  <Text style={st.errorTxt}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[st.btn, { marginTop:24 }, (otp.join("").length < 6 || loading) && st.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={otp.join("").length < 6 || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={C.white}/>
                  : <Text style={st.btnTxt}>Verify Code</Text>
                }
              </TouchableOpacity>

              {/* Resend */}
              <View style={{ alignItems:"center", marginTop:20 }}>
                {resendTimer > 0 ? (
                  <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted }}>
                    Resend code in <Text style={{ fontFamily:fonts.bold, color:C.blue }}>{resendTimer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                    {resending
                      ? <ActivityIndicator size="small" color={C.blue}/>
                      : <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.blue }}>Resend Code</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>

              {/* Hint */}
              <View style={[st.infoBox, { marginTop:20 }]}>
                <Text style={{ fontSize:14 }}>💡</Text>
                <Text style={st.infoTxt}>
                  Check your spam or junk folder if you don't see the email. The code expires in 15 minutes.
                </Text>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════
              STEP 3 — New Password
          ══════════════════════════════════════════ */}
          {step === 3 && (
            <View style={{ flex:1 }}>
              <View style={st.iconWrap}>
                <Ico.Lock sz={32} cl={C.blue}/>
              </View>

              <Text style={st.title}>Create New Password</Text>
              <Text style={st.subtitle}>
                Choose a strong password for your PromoEarn account. It must be at least 6 characters.
              </Text>

              {/* New password */}
              <Text style={st.label}>New Password</Text>
              <View style={[st.inputRow, { marginBottom:4 }]}>
                <Ico.Lock sz={18} cl={C.blue}/>
                <TextInput
                  style={[st.input, { marginLeft:10 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.slate}
                  value={newPass}
                  onChangeText={v => { setNewPass(v); setError(""); }}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ padding:4 }}>
                  {showNew ? <Ico.EyeOff sz={18}/> : <Ico.Eye sz={18}/>}
                </TouchableOpacity>
              </View>
              <PwStrength password={newPass}/>

              {/* Confirm password */}
              <Text style={st.label}>Confirm Password</Text>
              <View style={[st.inputRow,
                confirmPass.length > 0 && newPass !== confirmPass && { borderColor:C.red, backgroundColor:"#FFF5F5" },
                confirmPass.length > 0 && newPass === confirmPass && { borderColor:C.green, backgroundColor:"#F0FDF4" },
              ]}>
                <Ico.Lock sz={18} cl={C.muted}/>
                <TextInput
                  style={[st.input, { marginLeft:10 }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={C.slate}
                  value={confirmPass}
                  onChangeText={v => { setConfirmPass(v); setError(""); }}
                  secureTextEntry={!showConf}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConf(!showConf)} style={{ padding:4 }}>
                  {showConf ? <Ico.EyeOff sz={18}/> : <Ico.Eye sz={18}/>}
                </TouchableOpacity>
              </View>
              {confirmPass.length > 0 && newPass !== confirmPass &&
                <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginTop:4 }}>Passwords do not match</Text>}
              {confirmPass.length > 0 && newPass === confirmPass &&
                <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.green, marginTop:4 }}>✓ Passwords match</Text>}

              {/* Error */}
              {error ? (
                <View style={[st.errorBox, { marginTop:12 }]}>
                  <Text style={{ fontSize:16 }}>⚠️</Text>
                  <Text style={st.errorTxt}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[st.btn, { marginTop:24 },
                  (newPass.length < 6 || newPass !== confirmPass || loading) && st.btnDisabled]}
                onPress={handleResetPassword}
                disabled={newPass.length < 6 || newPass !== confirmPass || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={C.white}/>
                  : <Text style={st.btnTxt}>Reset Password</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════
              STEP 4 — Success
          ══════════════════════════════════════════ */}
          {step === 4 && (
            <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingTop:40 }}>
              <View style={{ width:110, height:110, borderRadius:55, backgroundColor:"#F0FDF4",
                alignItems:"center", justifyContent:"center", marginBottom:28,
                borderWidth:3, borderColor:C.green }}>
                <Ico.Check sz={52} cl={C.green}/>
              </View>
              <Text style={[st.title, { textAlign:"center" }]}>Password Reset!</Text>
              <Text style={[st.subtitle, { textAlign:"center", marginBottom:40 }]}>
                Your password has been successfully reset. You can now log in with your new password.
              </Text>
              <TouchableOpacity style={[st.btn, { width:"100%" }]} onPress={onSuccess} activeOpacity={0.85}>
                <Text style={st.btnTxt}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header:   { flexDirection:"row", alignItems:"center", justifyContent:"space-between",
              paddingHorizontal:16, paddingTop:Platform.OS==="ios"?8:32, paddingBottom:16,
              backgroundColor:C.white, borderBottomWidth:1, borderBottomColor:C.border },
  backBtn:  { width:42, height:42, borderRadius:13, backgroundColor:C.light, alignItems:"center", justifyContent:"center" },
  iconWrap: { width:72, height:72, borderRadius:36, backgroundColor:"#EEF4FF",
              alignItems:"center", justifyContent:"center", alignSelf:"center",
              marginTop:24, marginBottom:20 },
  title:    { fontFamily:fonts.black, fontSize:26, color:C.dark, letterSpacing:-0.5, marginBottom:10 },
  subtitle: { fontFamily:fonts.regular, fontSize:14, color:C.muted, lineHeight:22, marginBottom:28 },
  label:    { fontFamily:fonts.bold, fontSize:11, color:"#475569", textTransform:"uppercase",
              letterSpacing:0.5, marginBottom:8, marginTop:4 },
  inputRow: { flexDirection:"row", alignItems:"center", backgroundColor:C.white, borderRadius:14,
              borderWidth:1.5, borderColor:C.border, paddingHorizontal:14, height:54, marginBottom:14 },
  input:    { flex:1, fontFamily:fonts.medium, fontSize:15, color:C.dark },
  // OTP row — 6 equal boxes side by side
  otpRow:   { flexDirection:"row", justifyContent:"space-between", gap:8, marginVertical:8 },
  otpBox:   { flex:1, aspectRatio:1, maxHeight:56, borderRadius:14, borderWidth:2, borderColor:C.border,
              backgroundColor:C.white, fontFamily:fonts.black, fontSize:22, color:C.dark,
              textAlign:"center", textAlignVertical:"center" },
  btn:      { backgroundColor:C.blue, borderRadius:16, height:56, alignItems:"center", justifyContent:"center",
              shadowColor:C.blue, shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:12, elevation:6 },
  btnDisabled: { backgroundColor:"#93AAED", shadowOpacity:0 },
  btnTxt:   { fontFamily:fonts.bold, fontSize:16, color:C.white, letterSpacing:0.3 },
  errorBox: { flexDirection:"row", gap:10, alignItems:"flex-start", backgroundColor:"#FFF5F5",
              borderRadius:12, padding:12, borderWidth:1, borderColor:"#FECACA", marginTop:4 },
  errorTxt: { fontFamily:fonts.medium, fontSize:13, color:C.red, flex:1, lineHeight:19 },
  infoBox:  { flexDirection:"row", gap:10, alignItems:"flex-start", backgroundColor:"#FFFBEB",
              borderRadius:12, padding:12, borderWidth:1, borderColor:"#FDE68A" },
  infoTxt:  { fontFamily:fonts.regular, fontSize:12, color:C.muted, flex:1, lineHeight:18 },
});