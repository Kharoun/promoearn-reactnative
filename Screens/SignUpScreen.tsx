/**
 * SignUpScreen.jsx
 * Landing page → Email form OR Phone form (separate flows)
 * Blue theme throughout — professional icons, no emojis
 */

import { useState, useRef } from "react";
import { fonts } from "../utils/typography";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  Animated, KeyboardAvoidingView, Platform, StyleSheet,
  Modal, FlatList, Alert, ActivityIndicator, Dimensions,
} from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line, G } from "react-native-svg";
import AuthService from "../services/authService";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

const { height } = Dimensions.get("window");
const BLUE = "#1A56DB";
const DARK = "#0F172A";
const WHITE = "#FFFFFF";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - 18 - i));
const DAYS  = Array.from({ length: 31  }, (_, i) => String(i + 1).padStart(2, "0"));

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  User: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Mail: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.38 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
    </Svg>
  ),
  Lock: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  Tag: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Line x1="7" y1="7" x2="7.01" y2="7" />
    </Svg>
  ),
  Eye: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ size = 18, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  ),
  ChevronDown: ({ size = 12, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  ),
  Check: ({ size = 12, color = WHITE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
  ArrowLeft: ({ size = 20, color = DARK }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  ),
  AlertTriangle: ({ size = 16, color = "#DC2626" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  X: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  Shield: ({ size = 14, color = "#94A3B8" }) => (
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
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function LogoBadge({ size = "md" }) {
  const dim = size === "sm" ? 32 : 44;
  return (
    <Image
      source={require("../assets/logo.png")}
      style={{ width: dim, height: dim }}
      resizeMode="contain"
    />
  );
}

function LogoRow({ size = "md" }) {
  const fs = size === "sm" ? 17 : 20;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <LogoBadge size={size} />
      <Text style={{ fontFamily: fonts.extrabold, fontSize: fs, color: DARK, letterSpacing: -0.5 }}>
        Promo<Text style={{ color: BLUE }}>Earn</Text>
      </Text>
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, placeholder, value, onChangeText, keyboardType = "default",
  autoCapitalize = "none", secureTextEntry = false, focused, onFocus, onBlur,
  iconComponent, rightElement }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.row, focused && f.rowFocused]}>
        {iconComponent ? <View style={f.iconWrap}>{iconComponent}</View> : null}
        <TextInput style={f.input} placeholder={placeholder} placeholderTextColor="#94A3B8"
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry}
          onFocus={onFocus} onBlur={onBlur} />
        {rightElement}
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:       { marginBottom: 14 },
  label:      { fontFamily: fonts.bold, fontSize: 12, color: "#475569", marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  row:        { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 14, borderWidth: 1.5, borderColor: "transparent", paddingHorizontal: 14, height: 52 },
  rowFocused: { borderColor: BLUE, backgroundColor: "#EEF4FF" },
  iconWrap:   { marginRight: 10 },
  input:      { fontFamily: fonts.medium, flex: 1, fontSize: 15, color: DARK },
});

// ─── DOB Picker ───────────────────────────────────────────────────────────────
function DOBPicker({ day, month, year, onDayChange, onMonthChange, onYearChange }) {
  const [modal, setModal] = useState(null);
  const options    = modal === "day" ? DAYS : modal === "month" ? MONTHS : YEARS;
  const onSelect   = modal === "day" ? onDayChange : modal === "month" ? onMonthChange : onYearChange;
  const currentVal = modal === "day" ? day : modal === "month" ? month : year;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={f.label}>Date of Birth *</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[
          { val: day,   placeholder: "DD",    onPress: () => setModal("day"),   flex: 0.8 },
          { val: month, placeholder: "Month", onPress: () => setModal("month"), flex: 1.4 },
          { val: year,  placeholder: "YYYY",  onPress: () => setModal("year"),  flex: 1 },
        ].map((seg, i) => (
          <TouchableOpacity key={i} onPress={seg.onPress} activeOpacity={0.8}
            style={[f.row, { flex: seg.flex, justifyContent: "space-between" }]}>
            <Text style={{ fontSize: 14, color: seg.val ? DARK : "#94A3B8", fontFamily: fonts.medium }}>
              {seg.val || seg.placeholder}
            </Text>
            <Icon.ChevronDown />
          </TouchableOpacity>
        ))}
      </View>
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModal(null)}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select {modal === "day" ? "Day" : modal === "month" ? "Month" : "Year"}</Text>
              <TouchableOpacity onPress={() => setModal(null)} style={{ padding: 4 }}>
                <Icon.X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList data={options} keyExtractor={(item) => item} showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.modalOption, item === currentVal && s.modalOptionActive]}
                  onPress={() => { onSelect(item); setModal(null); }} activeOpacity={0.75}>
                  <Text style={[s.modalOptionText, item === currentVal && s.modalOptionTextActive]}>{item}</Text>
                  {item === currentVal && <Icon.Check size={14} color={BLUE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Gender ───────────────────────────────────────────────────────────────────
function GenderPicker({ value, onChange }) {
  const opts = [
    { label: "Male",   initial: "M" },
    { label: "Female", initial: "F" },
    { label: "Other",  initial: "O" },
  ];
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={f.label}>Gender *</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {opts.map((opt) => {
          const active = value === opt.label;
          return (
            <TouchableOpacity key={opt.label} onPress={() => onChange(opt.label)} activeOpacity={0.8}
              style={[f.row, { flex: 1, justifyContent: "center", gap: 6 },
                active && { borderColor: BLUE, backgroundColor: "#EEF4FF" }]}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: active ? BLUE : "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, fontFamily: fonts.black, color: active ? WHITE : "#94A3B8" }}>{opt.initial}</Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: fonts.semibold, color: active ? BLUE : "#475569" }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const strength = password.length < 6
    ? { label: "Weak",   color: "#EF4444", w: "30%" }
    : password.length < 10
    ? { label: "Fair",   color: "#F59E0B", w: "60%" }
    : { label: "Strong", color: "#10B981", w: "100%" };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
      <View style={{ flex: 1, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, overflow: "hidden" }}>
        <View style={{ width: strength.w, height: "100%", backgroundColor: strength.color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: strength.color, width: 44 }}>{strength.label}</Text>
    </View>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionLabel({ title, style }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 4 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: BLUE, letterSpacing: 1, textTransform: "uppercase" }}>{title}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
    </View>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────
function CommonFields({ firstName, setFirstName, lastName, setLastName, dobDay, setDobDay,
  dobMonth, setDobMonth, dobYear, setDobYear, gender, setGender, username, setUsername,
  referralCode, setReferralCode,
  password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword,
  showConfirm, setShowConfirm, agreed, setAgreed, focused, setFocused }) {
  const fo = (field) => () => setFocused(field);
  const bl = () => setFocused(null);

  return (
    <>
      <SectionLabel title="Personal Info" style={{ marginTop: 8 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="First Name *" placeholder="First" value={firstName} onChangeText={setFirstName}
            autoCapitalize="words" iconComponent={<Icon.User color={focused === "fn" ? BLUE : "#94A3B8"} />}
            focused={focused === "fn"} onFocus={fo("fn")} onBlur={bl} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Last Name *" placeholder="Last" value={lastName} onChangeText={setLastName}
            autoCapitalize="words" iconComponent={<Icon.User color={focused === "ln" ? BLUE : "#94A3B8"} />}
            focused={focused === "ln"} onFocus={fo("ln")} onBlur={bl} />
        </View>
      </View>
      <DOBPicker day={dobDay} month={dobMonth} year={dobYear}
        onDayChange={setDobDay} onMonthChange={setDobMonth} onYearChange={setDobYear} />
      <GenderPicker value={gender} onChange={setGender} />

      <SectionLabel title="Account Setup" style={{ marginTop: 8 }} />
      <Field label="Username *" placeholder="Choose a username" value={username} onChangeText={setUsername}
        iconComponent={<Icon.Tag color={focused === "un" ? BLUE : "#94A3B8"} />}
        focused={focused === "un"} onFocus={fo("un")} onBlur={bl} />
<Field label="Referral Code (optional)" placeholder="Enter referral code e.g @john123" value={referralCode} onChangeText={setReferralCode}
  iconComponent={<Icon.Tag color={focused === "rc" ? BLUE : "#94A3B8"} />}
  focused={focused === "rc"} onFocus={fo("rc")} onBlur={bl} />
      {/* Password */}
      <View style={f.wrap}>
        <Text style={f.label}>Password *</Text>
        <View style={[f.row, focused === "pw" && f.rowFocused]}>
          <View style={f.iconWrap}><Icon.Lock color={focused === "pw" ? BLUE : "#94A3B8"} /></View>
          <TextInput style={f.input} placeholder="Min. 6 characters" placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
            onFocus={fo("pw")} onBlur={bl} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
            {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
          </TouchableOpacity>
        </View>
        <PasswordStrength password={password} />
      </View>

      {/* Confirm */}
      <View style={f.wrap}>
        <Text style={f.label}>Confirm Password *</Text>
        <View style={[f.row, focused === "cp" && f.rowFocused,
          confirmPassword.length > 0 && password !== confirmPassword && { borderColor: "#EF4444", backgroundColor: "#FFF5F5" }]}>
          <View style={f.iconWrap}><Icon.Lock color="#94A3B8" /></View>
          <TextInput style={f.input} placeholder="Re-enter password" placeholderTextColor="#94A3B8"
            secureTextEntry={!showConfirm} value={confirmPassword} onChangeText={setConfirmPassword}
            onFocus={fo("cp")} onBlur={bl} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 4 }}>
            {showConfirm ? <Icon.EyeOff /> : <Icon.Eye />}
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && password !== confirmPassword &&
          <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4, fontFamily: fonts.medium }}>Passwords do not match</Text>}
        {confirmPassword.length > 0 && password === confirmPassword &&
          <Text style={{ fontSize: 12, color: "#10B981", marginTop: 4, fontFamily: fonts.semibold }}>Passwords match</Text>}
      </View>

      {/* Terms */}
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8, marginBottom: 8 }}
        onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
        <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2,
          borderColor: agreed ? BLUE : "#E2E8F0", backgroundColor: agreed ? BLUE : "transparent",
          alignItems: "center", justifyContent: "center", marginTop: 1 }}>
          {agreed && <Icon.Check />}
        </View>
        <Text style={{ flex: 1, fontSize: 13, color: "#64748B", lineHeight: 20, fontFamily: fonts.regular }}>
          I agree to the <Text style={{ color: BLUE, fontFamily: fonts.bold }}>Terms of Service</Text> and <Text style={{ color: BLUE, fontFamily: fonts.bold }}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
    </>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onEmail, onGoogle, googleLoading, googleReady, onLogin }) {
  return (
    <View style={{ flex: 1, backgroundColor: WHITE }}>
      {/* Hero */}
      <View style={{ height: height * 0.50, overflow: "hidden" }}>
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "#0A1628" }} />
        <View style={{ position: "absolute", width: 280, height: 280, borderRadius: 999, backgroundColor: "#1A56DB", opacity: 0.7, top: -80, left: -60 }} />
        <View style={{ position: "absolute", width: 220, height: 220, borderRadius: 999, backgroundColor: "#3B82F6", opacity: 0.5, top: 40, right: -60 }} />
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 999, backgroundColor: "#06B6D4", opacity: 0.4, bottom: -40, left: 80 }} />
        <View style={{ position: "absolute", width: 140, height: 140, borderRadius: 999, backgroundColor: "#818CF8", opacity: 0.5, bottom: 20, right: 30 }} />
        <View style={{ flex: 1, justifyContent: "flex-end", padding: 32, paddingBottom: 44 }}>
          {/* Logo in hero */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }}>
              <Text style={{ color: WHITE, fontFamily: fonts.black, fontSize: 14, letterSpacing: 0.5 }}>PE</Text>
            </View>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 20, color: WHITE, letterSpacing: -0.3, opacity: 0.9 }}>
              Promo<Text style={{ opacity: 0.7 }}>Earn</Text>
            </Text>
          </View>
          <Text style={{ fontSize: 38, fontFamily: fonts.black, color: WHITE, lineHeight: 44, marginBottom: 8, letterSpacing: -1 }}>
            A space just{"\n"}for you.
          </Text>
          <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", fontFamily: fonts.medium }}>
            Earn from tasks. Grow every day.
          </Text>
        </View>
      </View>

{/* Buttons */}
<View style={{ flex: 1, padding: 24, paddingTop: 28, gap: 12 }}>

  {/* Email — primary blue */}
  <TouchableOpacity onPress={onEmail} activeOpacity={0.85}
    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
      backgroundColor: BLUE, borderRadius: 16, height: 56,
      shadowColor: BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}>
    <Icon.Mail size={18} color={WHITE} />
    <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: WHITE, letterSpacing: 0.2 }}>Continue with Email</Text>
  </TouchableOpacity>

  {/* Google */}
  <TouchableOpacity onPress={onGoogle} disabled={!googleReady || googleLoading} activeOpacity={0.85}
    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
      backgroundColor: WHITE, borderRadius: 16, height: 56, borderWidth: 1.5, borderColor: "#E2E8F0",
      opacity: (!googleReady || googleLoading) ? 0.6 : 1 }}>
    {googleLoading
      ? <ActivityIndicator size="small" color="#64748B" />
      : <>
          <Icon.Google size={18} />
          <Text style={{ fontSize: 15, fontFamily: fonts.semibold, color: "#334155" }}>Continue with Google</Text>
        </>
    }
  </TouchableOpacity>

  {/* Login */}
  <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 4 }}>
    <Text style={{ fontSize: 14, color: "#64748B", fontFamily: fonts.regular }}>Already have an account? </Text>
    <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
      <Text style={{ fontSize: 14, color: BLUE, fontFamily: fonts.bold }}>Login</Text>
    </TouchableOpacity>
  </View>
</View>
    </View>
  );
}

// ─── Form Screen (email or phone) ─────────────────────────────────────────────
function FormScreen({ mode, onBack, onSubmit, loading, onLogin, submitError, submitSuccess, onClearError }) {
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]        = useState("");
  const [dobDay,          setDobDay]          = useState("");
  const [dobMonth,        setDobMonth]        = useState("");
  const [dobYear,         setDobYear]         = useState("");
  const [gender,          setGender]          = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [username,        setUsername]        = useState("");
  const [referralCode,    setReferralCode]    = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [focused,         setFocused]         = useState(null);

  const fo = (field) => () => setFocused(field);
  const bl = () => setFocused(null);

  const isValid = firstName.trim() && lastName.trim() && dobDay && dobMonth && dobYear &&
    gender && username.trim() && password.length >= 6 && password === confirmPassword && agreed &&
    (mode === "email" ? email.trim() : phone.trim());

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFF" }}
        contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.formHeader}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Icon.ArrowLeft size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <LogoRow size="sm" />
            <Text style={s.formSub}>
              {mode === "email" ? "Sign up with your email address" : "Sign up with your phone number"}
            </Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center" }}>
            {mode === "email" ? <Icon.Mail size={20} color={BLUE} /> : <Icon.Phone size={20} color={BLUE} />}
          </View>
        </View>

        <View style={s.formCard}>

          {/* Error banner */}
          {submitError ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFF5F5", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#FECACA" }}>
              <Icon.AlertTriangle size={16} color="#DC2626" />
              <Text style={{ flex: 1, fontSize: 13, color: "#DC2626", fontFamily: fonts.medium, lineHeight: 19 }}>{submitError}</Text>
              <TouchableOpacity onPress={onClearError} style={{ padding: 2 }}>
                <Icon.X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Contact field */}
          <SectionLabel title={mode === "email" ? "Email Address" : "Phone Number"} />
          {mode === "email" ? (
            <Field label="Email Address *" placeholder="you@example.com" value={email} onChangeText={setEmail}
              keyboardType="email-address"
              iconComponent={<Icon.Mail color={focused === "email" ? BLUE : "#94A3B8"} />}
              focused={focused === "email"} onFocus={fo("email")} onBlur={bl} />
          ) : (
            <Field label="Phone Number *" placeholder="07015662471" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad"
              iconComponent={<Icon.Phone color={focused === "phone" ? BLUE : "#94A3B8"} />}
              focused={focused === "phone"} onFocus={fo("phone")} onBlur={bl} />
          )}

          <CommonFields
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            dobDay={dobDay} setDobDay={setDobDay}
            dobMonth={dobMonth} setDobMonth={setDobMonth}
            dobYear={dobYear} setDobYear={setDobYear}
            gender={gender} setGender={setGender}
            username={username} setUsername={setUsername}
            referralCode={referralCode} setReferralCode={setReferralCode}
            password={password} setPassword={setPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            agreed={agreed} setAgreed={setAgreed}
            focused={focused} setFocused={setFocused}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, (!isValid || loading) && s.submitBtnDisabled]}
            onPress={() => onSubmit({ firstName, lastName, dobDay, dobMonth, dobYear, gender, email, phone, username, referralCode, password, confirmPassword, mode })}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={WHITE} />
              : <Text style={s.submitBtnText}>Create Account</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            <Text style={{ fontSize: 12, color: "#CBD5E1", fontFamily: fonts.medium }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
          </View>


          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
            <Text style={{ fontSize: 14, color: "#64748B", fontFamily: fonts.regular }}>Already have an account? </Text>
            <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, color: BLUE, fontFamily: fonts.bold }}>Log In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
            <Icon.Shield size={13} color="#CBD5E1" />
            <Text style={{ fontSize: 12, color: "#CBD5E1", fontFamily: fonts.regular }}>Your data is safe and encrypted</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SignUpScreen({ onSignUp, onLogin }) {
  const [view,         setView]         = useState("landing");
  const [loading,      setLoading]      = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [submitSuccess,setSubmitSuccess]= useState("");

  const { signInWithGoogle, loading: googleLoading, ready: googleReady } = useGoogleAuth({
    onSuccess: () => onSignUp("", "", "google"),  // pass a flag
    onError: (msg) => setSubmitError(msg),
  });

  const handleSubmit = async ({ firstName, lastName, dobDay, dobMonth, dobYear, gender,
    email, phone, username, referralCode, password, confirmPassword, mode }) => {
    setSubmitError(""); setSubmitSuccess("");
    try {
      setLoading(true);
      const payload = {
        firstName,
        lastName,
        email,
        phone:        phone || undefined,
        password,
        confirmPassword,
        username,
        referralCode: referralCode?.replace("@", "").trim() || undefined,
        dob:          `${dobYear}-${String(MONTHS.indexOf(dobMonth) + 1).padStart(2, "0")}-${dobDay}`,
        gender,
      };
      const result = await AuthService.register(payload);
  
      if (result.success) {
        onSignUp(email, phone, mode);
      } else {
        // Show field-level errors if available (most specific)
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(e => `• ${e.message}`).join("\n");
          setSubmitError(errorMessages);
        } else {
          const msg = result.message || "";
          if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("exists")) {
            setSubmitError("An account with this email, phone, or username already exists. Try logging in instead.");
          } else if (msg.toLowerCase().includes("validation")) {
            setSubmitError("Some fields are invalid. Please check your details and try again.");
          } else {
            setSubmitError(msg || "Registration failed. Please try again.");
          }
        }
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
        setSubmitError("Cannot connect to server. Make sure the backend is running.");
      } else {
        setSubmitError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (view === "landing") {
    return (
      <LandingPage
        onEmail={() => setView("email")}
        onGoogle={signInWithGoogle}
        googleLoading={googleLoading}
        googleReady={googleReady}
        onLogin={onLogin}
      />
    );
  }

  return (
    <FormScreen
      mode={view}
      onBack={() => setView("landing")}
      onSubmit={handleSubmit}
      loading={loading}
      onLogin={onLogin}
      submitError={submitError}
      submitSuccess={submitSuccess}
      onClearError={() => setSubmitError("")}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  formHeader:      { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 56, gap: 12, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backBtn:         { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  formSub:         { fontFamily: fonts.regular, fontSize: 13, color: "#64748B", marginTop: 3 },
  formCard:        { margin: 16, backgroundColor: WHITE, borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  submitBtn:       { backgroundColor: BLUE, borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center", marginTop: 8, shadowColor: BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  submitBtnDisabled:{ backgroundColor: "#93AAED", shadowOpacity: 0 },
  submitBtnText:   { fontFamily: fonts.bold, color: WHITE, fontSize: 16, letterSpacing: 0.4 },
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:      { backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "65%", paddingBottom: 40 },
  modalHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalTitle:      { fontFamily: fonts.extrabold, fontSize: 17, color: DARK },
  modalOption:     { paddingHorizontal: 24, paddingVertical: 15, flexDirection: "row", alignItems: "center" },
  modalOptionActive:    { backgroundColor: "#EEF4FF" },
  modalOptionText:      { fontFamily: fonts.medium, flex: 1, fontSize: 15, color: "#475569" },
  modalOptionTextActive:{ fontFamily: fonts.bold, color: BLUE },
});