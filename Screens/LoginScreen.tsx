/**
 * LoginScreen.jsx — PromoEarn
 * Fixed: ForgotPassword as full page, Google error shown properly
 */

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import AuthService from "../services/authService";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { fonts } from "../utils/typography";

const BLUE  = "#1A56DB";
const DARK  = "#0F172A";
const WHITE = "#FFFFFF";

const Icon = {
  User: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Mail: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.38 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
    </Svg>
  ),
  Lock: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  Eye: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  ),
  Alert: ({ size = 16, color = "#DC2626" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" /><Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  CheckCircle: ({ size = 16, color = "#15803D" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
  ),
  Shield: ({ size = 14, color = "#CBD5E1" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  ),
  Google: ({ size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  ),
  Info: ({ size = 16, color = "#1A56DB" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/>
    </Svg>
  ),
};

export default function LoginScreen({ onLogin, onSignUp, onForgot }) {
  const [identifier,      setIdentifier]      = useState("");
  const [password,        setPassword]        = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [focused,         setFocused]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError,   setPasswordError]   = useState("");
  const [success,         setSuccess]         = useState("");
  const [googleInfo,      setGoogleInfo]      = useState(""); // info (not error) for google

  const fo = (f) => () => setFocused(f);
  const bl = () => setFocused(null);

  const getType = () => {
    if (!identifier.trim()) return null;
    if (identifier.includes("@")) return "email";
    if (/^\+?[\d\s\-()]{6,}$/.test(identifier)) return "phone";
    return null;
  };
  const idType = getType();

  const { signInWithGoogle, loading: googleLoading, ready: googleReady } = useGoogleAuth({
    onSuccess: () => {
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => onLogin(), 600);
    },
    onError: (msg) => setGoogleInfo(msg),
  });

  const validate = () => {
    let valid = true;
    setIdentifierError(""); setPasswordError(""); setError("");
    if (!identifier.trim()) { setIdentifierError("Please enter your email or phone number."); valid = false; }
    if (!password.trim())   { setPasswordError("Please enter your password."); valid = false; }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true); setError("");
      const result = await AuthService.login(identifier.trim(), password);
      if (result.success) {
        await AuthService.recordLoginTime();
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => onLogin(), 600);
      
      } else {
        const msg = result.message || "";
        if (msg.toLowerCase().includes("password"))
          setPasswordError("Incorrect password. Please try again.");
        else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no user"))
          setIdentifierError("No account found with this email or phone.");
        else if (msg.toLowerCase().includes("banned"))
          setError("Your account has been suspended. Contact support.");
        else
          setError(msg || "Login failed. Please check your details and try again.");
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch"))
        setError("Cannot connect to server. Make sure the backend is running on port 5000.");
      else
        setError(msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || googleLoading;
  const canSubmit  = identifier.trim().length > 0 && password.length > 0 && !anyLoading;
  const IdIcon = idType === "email" ? Icon.Mail : idType === "phone" ? Icon.Phone : Icon.User;

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScrollView style={st.container} contentContainerStyle={{ paddingBottom:48 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={st.topBar}/>

        {/* Header */}
        <View style={st.header}>
        <View style={st.logoRow}>
  <Image
    source={require("../assets/logo.png")}
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
  <Text style={st.logoLabel}>Promo<Text style={{ color:BLUE, fontFamily:fonts.extrabold }}>Earn</Text></Text>
</View>
          <Text style={st.heading}>Welcome back</Text>
          <Text style={st.sub}>Sign in to continue earning from promotional tasks</Text>
        </View>

        {/* Card */}
        <View style={st.card}>

          {/* Generic error */}
          {error ? (
            <View style={st.errorBanner}>
              <Icon.Alert size={16} color="#DC2626"/>
              <Text style={st.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Success */}
          {success ? (
            <View style={st.successBanner}>
              <Icon.CheckCircle size={16} color="#15803D"/>
              <Text style={st.successBannerText}>{success}</Text>
            </View>
          ) : null}

          {/* Identifier field */}
          <View style={st.fieldWrap}>
            <Text style={st.label}>Email Address</Text>
            <View style={[st.inputRow, focused==="id"&&st.inputFocused, identifierError&&st.inputError]}>
              <View style={{ marginRight:10 }}>
                <IdIcon size={18} color={focused==="id"?BLUE:"#94A3B8"}/>
              </View>
              <TextInput
                style={st.input}
                placeholder="you@example.com"
                placeholderTextColor="#CBD5E1"
                value={identifier}
                onChangeText={t => { setIdentifier(t); setIdentifierError(""); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={fo("id")} onBlur={bl}
              />
              {idType && (
                <View style={[st.typeBadge, idType==="email"?st.typeBadgeEmail:st.typeBadgePhone]}>
                  <Text style={st.typeBadgeText}>{idType==="email"?"Email":"Phone"}</Text>
                </View>
              )}
            </View>
            {identifierError
              ? <Text style={st.fieldError}>{identifierError}</Text>
              : <Text style={st.hint}>Enter your email address (e.g. you@example.com)</Text>
            }
          </View>

          {/* Password field */}
          <View style={st.fieldWrap}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <Text style={st.label}>Password</Text>
              {/* Forgot password — calls onForgot prop (navigates to full page) */}
              <TouchableOpacity onPress={onForgot} activeOpacity={0.7}>
                <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:BLUE }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[st.inputRow, focused==="pw"&&st.inputFocused, passwordError&&st.inputError]}>
              <View style={{ marginRight:10 }}>
                <Icon.Lock size={18} color={focused==="pw"?BLUE:"#94A3B8"}/>
              </View>
              <TextInput
                style={st.input}
                placeholder="Enter your password"
                placeholderTextColor="#CBD5E1"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={t => { setPassword(t); setPasswordError(""); setError(""); }}
                onFocus={fo("pw")} onBlur={bl}
                onSubmitEditing={canSubmit?handleLogin:undefined}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding:6 }}>
                {showPassword ? <Icon.EyeOff size={18}/> : <Icon.Eye size={18}/>}
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={st.fieldError}>{passwordError}</Text> : null}
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[st.cta, !canSubmit&&st.ctaDisabled]}
            onPress={handleLogin} disabled={!canSubmit} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={WHITE}/>
              : <Text style={st.ctaText}>Log In</Text>
            }
          </TouchableOpacity>
{/* 
          Divider
          <View style={st.divider}>
            <View style={st.dividerLine}/>
            <Text style={st.dividerText}>or continue with</Text>
            <View style={st.dividerLine}/>
          </View> */}

          {/* Google button */}
          {/* <TouchableOpacity
            style={[st.googleBtn, (!googleReady||anyLoading)&&{ opacity:0.6 }]}
            onPress={() => { setGoogleInfo(""); signInWithGoogle(); }}
            disabled={!googleReady||anyLoading} activeOpacity={0.85}>
            {googleLoading
              ? <ActivityIndicator size="small" color="#4285F4"/>
              : <>
                  <Icon.Google size={18}/>
                  <Text style={st.googleText}>Continue with Google</Text>
                </>
            }
          </TouchableOpacity> */}

          {/* Google info message (not an error — it's an explanation) */}
          {googleInfo ? (
            <View style={[st.infoBanner, { marginTop:12 }]}>
              <Icon.Info size={15} color={BLUE}/>
              <Text style={st.infoBannerText}>{googleInfo}</Text>
            </View>
          ) : null}

          {/* Sign up link */}
          <View style={{ flexDirection:"row", justifyContent:"center", marginTop:24 }}>
            <Text style={st.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSignUp} activeOpacity={0.7}>
              <Text style={st.switchLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, marginTop:20 }}>
          <Icon.Shield size={13} color="#CBD5E1"/>
          <Text style={st.footer}>Your data is safe and encrypted</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container:         { flex:1, backgroundColor:"#F8FAFF" },
  topBar:            { height:4, backgroundColor:BLUE },
  header:            { paddingHorizontal:24, paddingTop:40, paddingBottom:28 },
  logoRow:           { flexDirection:"row", alignItems:"center", marginBottom:28, gap:10 },
  logoBadge:         { width:36, height:36, borderRadius:10, backgroundColor:BLUE, alignItems:"center", justifyContent:"center" },
  logoBadgeText:     { fontFamily:fonts.black, color:WHITE, fontSize:13, letterSpacing:0.5 },
  logoLabel:         { fontFamily:fonts.extrabold, fontSize:20, color:DARK, letterSpacing:-0.5 },
  heading:           { fontFamily:fonts.black, fontSize:30, color:DARK, letterSpacing:-0.5, marginBottom:8 },
  sub:               { fontFamily:fonts.regular, fontSize:15, color:"#64748B", lineHeight:22 },
  card:              { backgroundColor:WHITE, marginHorizontal:16, borderRadius:24, padding:24, shadowColor:BLUE, shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:20, elevation:6 },
  errorBanner:       { flexDirection:"row", alignItems:"flex-start", gap:10, backgroundColor:"#FFF5F5", borderRadius:12, padding:14, marginBottom:16, borderWidth:1, borderColor:"#FECACA" },
  errorBannerText:   { fontFamily:fonts.medium, flex:1, fontSize:13, color:"#DC2626", lineHeight:19 },
  successBanner:     { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#F0FDF4", borderRadius:12, padding:14, marginBottom:16, borderWidth:1, borderColor:"#BBF7D0" },
  successBannerText: { fontFamily:fonts.semibold, flex:1, fontSize:13, color:"#15803D" },
  infoBanner:        { flexDirection:"row", alignItems:"flex-start", gap:10, backgroundColor:"#EEF4FF", borderRadius:12, padding:14, borderWidth:1, borderColor:"#BFDBFE" },
  infoBannerText:    { fontFamily:fonts.medium, flex:1, fontSize:12, color:"#1E40AF", lineHeight:18 },
  fieldWrap:         { marginBottom:18 },
  label:             { fontFamily:fonts.semibold, fontSize:13, color:"#475569", letterSpacing:0.2 },
  inputRow:          { flexDirection:"row", alignItems:"center", backgroundColor:"#F8FAFF", borderRadius:13, borderWidth:1.5, borderColor:"#E2E8F0", paddingHorizontal:14, height:54 },
  inputFocused:      { borderColor:BLUE, backgroundColor:"#EEF4FF" },
  inputError:        { borderColor:"#EF4444", backgroundColor:"#FFF5F5" },
  input:             { fontFamily:fonts.medium, flex:1, fontSize:15, color:DARK },
  fieldError:        { fontFamily:fonts.medium, fontSize:12, color:"#EF4444", marginTop:5 },
  hint:              { fontFamily:fonts.regular, fontSize:11, color:"#94A3B8", marginTop:5 },
  typeBadge:         { paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  typeBadgeEmail:    { backgroundColor:"#EEF4FF" },
  typeBadgePhone:    { backgroundColor:"#F0FDF4" },
  typeBadgeText:     { fontFamily:fonts.bold, fontSize:10, color:BLUE },
  cta:               { backgroundColor:BLUE, borderRadius:14, height:56, alignItems:"center", justifyContent:"center", marginTop:4, shadowColor:BLUE, shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:14, elevation:8 },
  ctaDisabled:       { backgroundColor:"#93AAED", shadowOpacity:0 },
  ctaText:           { fontFamily:fonts.bold, color:WHITE, fontSize:16, letterSpacing:0.4 },
  divider:           { flexDirection:"row", alignItems:"center", marginVertical:22, gap:10 },
  dividerLine:       { flex:1, height:1, backgroundColor:"#E2E8F0" },
  dividerText:       { fontFamily:fonts.medium, fontSize:12, color:"#CBD5E1" },
  googleBtn:         { flexDirection:"row", alignItems:"center", justifyContent:"center", backgroundColor:WHITE, borderRadius:14, height:54, borderWidth:1.5, borderColor:"#E2E8F0", gap:10 },
  googleText:        { fontFamily:fonts.semibold, fontSize:15, color:"#334155" },
  switchText:        { fontFamily:fonts.regular, fontSize:14, color:"#64748B" },
  switchLink:        { fontFamily:fonts.bold, fontSize:14, color:BLUE },
  footer:            { fontFamily:fonts.regular, fontSize:12, color:"#CBD5E1" },
});