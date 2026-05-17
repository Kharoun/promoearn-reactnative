/**
 * AccountSettingsScreen.jsx — PromoEarn
 * Fixed: double /auth/ route bug, delete account modal, removed phone row, 2FA API connected
 */

import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Platform, Alert, Switch, ActivityIndicator,
  StatusBar,
} from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";

const BASE_URL = "https://promoearn-backend.onrender.com/api/v1/auth";
const PREFS_KEY = "pe_user_preferences";

// ── Themes ────────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:"#F8FAFF", card:"#FFFFFF", dark:"#0F172A", muted:"#64748B",
  border:"#E2E8F0", input:"#F1F5F9", slate:"#94A3B8",
  blue:"#1A56DB", green:"#10B981", red:"#EF4444",
  gold:"#F59E0B", purple:"#8B5CF6", orange:"#F97316",
  white:"#FFFFFF", statusBar:"dark-content",
};
export const DARK = {
  bg:"#0F172A", card:"#1E293B", dark:"#F1F5F9", muted:"#94A3B8",
  border:"#334155", input:"#0F172A", slate:"#64748B",
  blue:"#3B82F6", green:"#10B981", red:"#EF4444",
  gold:"#F59E0B", purple:"#A78BFA", orange:"#FB923C",
  white:"#FFFFFF", statusBar:"light-content",
};

export const LANGUAGES = [
  { code:"en", label:"English",    flag:"🇬🇧" },
  { code:"yo", label:"Yoruba",     flag:"🇳🇬" },
  { code:"ha", label:"Hausa",      flag:"🇳🇬" },
  { code:"ig", label:"Igbo",       flag:"🇳🇬" },
  { code:"fr", label:"French",     flag:"🇫🇷" },
  { code:"ar", label:"Arabic",     flag:"🇸🇦" },
  { code:"pt", label:"Portuguese", flag:"🇵🇹" },
  { code:"es", label:"Spanish",    flag:"🇪🇸" },
];

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = {
  Back:      ({sz=20,cl="#0F172A"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>,
  User:      ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>,
  Lock:      ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>,
  Eye:       ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></Svg>,
  EyeOff:    ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><Line x1="1" y1="1" x2="23" y2="23"/></Svg>,
  Moon:      ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>,
  Sun:       ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="5"/><Line x1="12" y1="1" x2="12" y2="3"/><Line x1="12" y1="21" x2="12" y2="23"/><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><Line x1="1" y1="12" x2="3" y2="12"/><Line x1="21" y1="12" x2="23" y2="12"/><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Svg>,
  Shield:    ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
  Globe:     ({sz=17,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>,
  Check:     ({sz=14,cl="#10B981"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>,
  ChevRight: ({sz=15,cl="#E2E8F0"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6"/></Svg>,
  Info:      ({sz=15,cl="#64748B"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  Trash:     ({sz=17,cl="#EF4444"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="3 6 5 6 21 6"/><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><Path d="M10 11v6"/><Path d="M14 11v6"/><Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>,
  Out:       ({sz=17,cl="#EF4444"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7"/><Line x1="21" y1="12" x2="9" y2="12"/></Svg>,
  Warning:   ({sz=24,cl="#EF4444"}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><Line x1="12" y1="9" x2="12" y2="13"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
};

// ── Password Strength Bar ─────────────────────────────────────────────────
function PwStrength({ password, C }) {
  if (!password) return null;
  const s = password.length < 6 ? { label:"Weak", color:C.red, w:"30%" }
    : password.length < 10 ? { label:"Fair", color:C.gold, w:"60%" }
    : { label:"Strong", color:C.green, w:"100%" };
  return (
    <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginTop:6, marginBottom:6 }}>
      <View style={{ flex:1, height:4, backgroundColor:C.border, borderRadius:2, overflow:"hidden" }}>
        <View style={{ width:s.w, height:"100%", backgroundColor:s.color, borderRadius:2 }}/>
      </View>
      <Text style={{ fontFamily:fonts.bold, fontSize:11, color:s.color, width:46 }}>{s.label}</Text>
    </View>
  );
}

// ── Shared Input Row ──────────────────────────────────────────────────────
function InputRow({ C, label, value, onChange, placeholder, secure, showToggle, onToggle, icon, autoCapitalize="none", maxLength, keyboardType }) {
  return (
    <View style={{ marginBottom:14 }}>
      <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>{label}</Text>
      <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:C.input, borderRadius:14, borderWidth:1.5, borderColor:C.border, paddingHorizontal:14, height:52 }}>
        {icon && <View style={{ marginRight:8 }}>{icon}</View>}
        <TextInput
          style={{ flex:1, fontFamily:fonts.medium, fontSize:15, color:C.dark }}
          placeholder={placeholder}
          placeholderTextColor={C.slate}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          keyboardType={keyboardType}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding:4 }}>
            {secure ? <Ico.Eye sz={17} cl={C.slate}/> : <Ico.EyeOff sz={17} cl={C.slate}/>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Change Username Modal ─────────────────────────────────────────────────
function ChangeUsernameModal({ visible, onClose, user, C, onSuccess }) {
  const [val,     setVal]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => { if (visible) { setVal(""); setError(""); } }, [visible]);

  const save = async () => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) { setError("Min. 3 characters."); return; }
    if (!/^[a-z0-9_]+$/.test(trimmed))  { setError("Only letters, numbers and underscores."); return; }
    if (trimmed === user?.username)      { setError("This is already your username."); return; }
    setLoading(true); setError("");
    try {
      const token = await AuthService.getToken();
      // FIX: was ${BASE_URL}/auth/change-username (double /auth/)
      const res   = await fetch(`${BASE_URL}/change-username`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify({ username: trimmed })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(trimmed);
        onClose();
        Alert.alert("Done!", `Username updated to @${trimmed}`);
      } else {
        setError(data.message || "Failed to update username.");
      }
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor:C.card }]}>
          <View style={[m.handle, { backgroundColor:C.border }]}/>
          <Text style={[m.title, { color:C.dark }]}>Change Username</Text>
          <Text style={[m.sub, { color:C.muted }]}>Your referral code will also update to match.</Text>

          <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Current</Text>
          <View style={{ backgroundColor:C.input, borderRadius:12, paddingHorizontal:14, height:48, justifyContent:"center", marginBottom:16, borderWidth:1, borderColor:C.border }}>
            <Text style={{ fontFamily:fonts.medium, fontSize:14, color:C.slate }}>@{user?.username}</Text>
          </View>

          <InputRow
            C={C} label="New Username"
            value={val}
            onChange={v => { setVal(v.toLowerCase().replace(/[^a-z0-9_]/g,"")); setError(""); }}
            placeholder="new_username"
            icon={<Text style={{ fontFamily:fonts.bold, color:C.muted }}>@</Text>}
            maxLength={30}
          />
          {error ? <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginBottom:10 }}>{error}</Text> : null}
          <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.slate, marginBottom:20 }}>
            Lowercase letters, numbers and underscores only. 3–30 characters.
          </Text>

          <TouchableOpacity style={[m.btn, { backgroundColor:C.blue, opacity: loading||!val.trim() ? 0.6 : 1 }]}
            onPress={save} disabled={loading || !val.trim()} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={m.btnTxt}>Save Username</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[m.ghost, { borderColor:C.border }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={[m.ghostTxt, { color:C.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose, C }) {
  const [cur,     setCur]     = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [conf,    setConf]    = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (visible) { setCur(""); setNewPw(""); setConf(""); setError(""); setShowCur(false); setShowNew(false); setShowCon(false); }
  }, [visible]);

  const save = async () => {
    setError("");
    if (!cur)             { setError("Enter your current password."); return; }
    if (newPw.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPw !== conf)   { setError("New passwords do not match."); return; }
    if (newPw === cur)    { setError("New password must differ from current."); return; }
    setLoading(true);
    try {
      const token = await AuthService.getToken();
      // FIX: was ${BASE_URL}/auth/change-password (double /auth/)
      const res   = await fetch(`${BASE_URL}/change-password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify({ currentPassword:cur, newPassword:newPw }),
      });
      const data = await res.json();
      if (data.success) {
        onClose();
        Alert.alert("Password Updated", "Your password has been changed successfully.");
      } else {
        setError(data.message || "Failed to update password.");
      }
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor:C.card }]}>
          <View style={[m.handle, { backgroundColor:C.border }]}/>
          <Text style={[m.title, { color:C.dark }]}>Change Password</Text>
          <Text style={[m.sub, { color:C.muted }]}>Choose a strong password of at least 6 characters.</Text>

          <InputRow C={C} label="Current Password" value={cur} onChange={v=>{setCur(v);setError("");}}
            placeholder="Current password" secure={!showCur} showToggle onToggle={()=>setShowCur(!showCur)}
            icon={<Ico.Lock sz={16} cl={C.slate}/>}/>

          <InputRow C={C} label="New Password" value={newPw} onChange={v=>{setNewPw(v);setError("");}}
            placeholder="Min. 6 characters" secure={!showNew} showToggle onToggle={()=>setShowNew(!showNew)}
            icon={<Ico.Lock sz={16} cl={C.slate}/>}/>
          <PwStrength password={newPw} C={C}/>

          <InputRow C={C} label="Confirm New Password" value={conf} onChange={v=>{setConf(v);setError("");}}
            placeholder="Re-enter new password" secure={!showCon} showToggle onToggle={()=>setShowCon(!showCon)}
            icon={<Ico.Lock sz={16} cl={C.slate}/>}/>

          {conf.length > 0 && newPw === conf && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginBottom:8 }}>
              <Ico.Check sz={13} cl={C.green}/>
              <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.green }}>Passwords match</Text>
            </View>
          )}
          {error ? <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginBottom:12 }}>{error}</Text> : null}

          <TouchableOpacity style={[m.btn, { backgroundColor:C.blue, opacity:loading?0.6:1 }]}
            onPress={save} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={m.btnTxt}>Update Password</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[m.ghost, { borderColor:C.border }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={[m.ghostTxt, { color:C.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Language Modal ────────────────────────────────────────────────────────
function LanguageModal({ visible, onClose, current, onSelect, C }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor:C.card, maxHeight:"70%" }]}>
          <View style={[m.handle, { backgroundColor:C.border }]}/>
          <Text style={[m.title, { color:C.dark }]}>Select Language</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang, i) => (
              <TouchableOpacity key={lang.code} onPress={() => { onSelect(lang.code); onClose(); }} activeOpacity={0.7}
                style={{ flexDirection:"row", alignItems:"center", paddingHorizontal:20, paddingVertical:15, gap:14,
                  borderBottomWidth:i < LANGUAGES.length-1 ? 1 : 0, borderBottomColor:C.border,
                  backgroundColor: current===lang.code ? C.blue+"15" : "transparent" }}>
                <Text style={{ fontSize:24 }}>{lang.flag}</Text>
                <Text style={{ flex:1, fontFamily:current===lang.code?fonts.bold:fonts.medium, fontSize:15,
                  color:current===lang.code?C.blue:C.dark }}>{lang.label}</Text>
                {current===lang.code && <Ico.Check sz={16} cl={C.blue}/>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── 2FA Modal ─────────────────────────────────────────────────────────────
function TwoFAModal({ visible, onClose, enabled, onConfirmToggle, C }) {
  const [step,    setStep]    = useState(1);
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => { if (visible) { setStep(1); setCode(""); setError(""); } }, [visible]);

  const handleEnable = async () => {
    if (code.length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setLoading(true); setError("");
    try {
      // FIX: actually calls the backend API now
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/toggle-2fa`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify({ enabled: true, code }),
      });
      const data = await res.json();
      if (data.success) {
        onConfirmToggle(true);
        setStep(3);
      } else {
        setError(data.message || "Verification failed. Try again.");
      }
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(false); }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/toggle-2fa`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body:JSON.stringify({ enabled: false }),
      });
      const data = await res.json();
      if (data.success) {
        onConfirmToggle(false);
        onClose();
        Alert.alert("2FA Disabled", "Two-factor authentication has been turned off.");
      } else {
        Alert.alert("Error", data.message || "Failed to disable 2FA.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally   { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor:C.card }]}>
          <View style={[m.handle, { backgroundColor:C.border }]}/>

          {enabled && step === 1 && (
            <>
              <View style={{ alignItems:"center", marginBottom:20 }}>
                <View style={{ width:64, height:64, borderRadius:32, backgroundColor:"#F0FDF4", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <Ico.Shield sz={26} cl={C.green}/>
                </View>
                <Text style={[m.title, { color:C.dark }]}>2FA is Active</Text>
                <Text style={[m.sub, { color:C.muted }]}>Your account has extra protection. Disable with caution.</Text>
              </View>
              <TouchableOpacity style={[m.btn, { backgroundColor:C.red, opacity:loading?0.6:1 }]} onPress={handleDisable} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={m.btnTxt}>Disable 2FA</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[m.ghost, { borderColor:C.border }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={[m.ghostTxt, { color:C.muted }]}>Keep It On</Text>
              </TouchableOpacity>
            </>
          )}

          {!enabled && step === 1 && (
            <>
              <View style={{ alignItems:"center", marginBottom:16 }}>
                <View style={{ width:64, height:64, borderRadius:32, backgroundColor:"#EEF4FF", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <Ico.Shield sz={26} cl={C.blue}/>
                </View>
                <Text style={[m.title, { color:C.dark }]}>Enable 2FA</Text>
                <Text style={[m.sub, { color:C.muted }]}>Add a second layer of security to your account.</Text>
              </View>
              {[
                { icon:"📧", t:"Email Verification",    d:"A code is sent to your email on every login." },
                { icon:"🔒", t:"Extra Security",        d:"Protects your account even if password is leaked." },
                { icon:"⚡", t:"Quick Setup",           d:"Takes less than a minute to activate." },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection:"row", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                  <Text style={{ fontSize:20 }}>{item.icon}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>{item.t}</Text>
                    <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>{item.d}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[m.btn, { backgroundColor:C.blue, marginTop:12 }]} onPress={() => setStep(2)} activeOpacity={0.85}>
                <Text style={m.btnTxt}>Enable 2FA →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[m.ghost, { borderColor:C.border }]} onPress={onClose} activeOpacity={0.8}>
                <Text style={[m.ghostTxt, { color:C.muted }]}>Not Now</Text>
              </TouchableOpacity>
            </>
          )}

          {!enabled && step === 2 && (
            <>
              <Text style={[m.title, { color:C.dark }]}>Enter Verification Code</Text>
              <Text style={[m.sub, { color:C.muted }]}>We've sent a 6-digit code to your registered email address.</Text>
              <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
                6-Digit Code
              </Text>
              <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:C.input, borderRadius:14, borderWidth:1.5,
                borderColor: error ? C.red : C.border, paddingHorizontal:14, height:56, marginBottom:8 }}>
                <TextInput
                  style={{ flex:1, fontFamily:fonts.black, fontSize:24, color:C.dark, textAlign:"center", letterSpacing:10 }}
                  placeholder="000000" placeholderTextColor={C.slate}
                  value={code} onChangeText={v => { setCode(v.replace(/\D/g,"").slice(0,6)); setError(""); }}
                  keyboardType="numeric" maxLength={6}
                />
              </View>
              {error ? <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginBottom:10 }}>{error}</Text> : null}
              <TouchableOpacity style={[m.btn, { backgroundColor:C.blue, marginTop:8, opacity:loading?0.6:1 }]}
                onPress={handleEnable} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={m.btnTxt}>Verify & Enable</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[m.ghost, { borderColor:C.border }]} onPress={() => setStep(1)} activeOpacity={0.8}>
                <Text style={[m.ghostTxt, { color:C.muted }]}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <View style={{ alignItems:"center", paddingVertical:20 }}>
              <View style={{ width:80, height:80, borderRadius:40, backgroundColor:"#F0FDF4", alignItems:"center", justifyContent:"center", marginBottom:16, borderWidth:3, borderColor:C.green }}>
                <Text style={{ fontSize:42 }}>✅</Text>
              </View>
              <Text style={[m.title, { color:C.dark }]}>2FA Enabled!</Text>
              <Text style={[m.sub, { color:C.muted, marginBottom:28 }]}>Your account now has two-factor authentication protection.</Text>
              <TouchableOpacity style={[m.btn, { backgroundColor:C.green, width:"100%" }]} onPress={onClose} activeOpacity={0.85}>
                <Text style={m.btnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Delete Account Modal (NEW — designed, calls API) ──────────────────────
function DeleteAccountModal({ visible, onClose, C, onDeleted }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => { if (visible) { setConfirm(""); setError(""); } }, [visible]);

  const handleDelete = async () => {
    if (confirm !== "DELETE") { setError('Type DELETE in capitals to confirm.'); return; }
    setLoading(true); setError("");
    try {
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await AuthService.logout();
        onClose();
        onDeleted?.();
      } else {
        setError(data.message || "Failed to delete account. Please try again.");
      }
    } catch { setError("Network error. Please try again."); }
    finally   { setLoading(false); }
  };

  const ready = confirm === "DELETE";

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:C.card, borderRadius:24, padding:28, width:"100%", maxWidth:400 }}>

          {/* Warning Icon */}
          <View style={{ alignItems:"center", marginBottom:20 }}>
            <View style={{ width:72, height:72, borderRadius:36, backgroundColor:"#FFF1F1", alignItems:"center", justifyContent:"center", marginBottom:14, borderWidth:2, borderColor:"#FECACA" }}>
              <Ico.Warning sz={30} cl="#EF4444"/>
            </View>
            <Text style={{ fontFamily:fonts.black, fontSize:22, color:"#EF4444", textAlign:"center", marginBottom:6 }}>
              Delete Account?
            </Text>
            <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", lineHeight:20 }}>
              This is permanent and cannot be undone. Everything will be erased.
            </Text>
          </View>

          {/* What gets deleted */}
          <View style={{ backgroundColor:"#FFF5F5", borderRadius:14, padding:14, marginBottom:20, borderWidth:1, borderColor:"#FECACA" }}>
            {[
              "Your account and profile",
              "All earnings and balance",
              "Task history and referrals",
              "Payout methods and records",
            ].map((item, i) => (
              <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:i<3?8:0 }}>
                <View style={{ width:6, height:6, borderRadius:3, backgroundColor:"#EF4444" }}/>
                <Text style={{ fontFamily:fonts.medium, fontSize:13, color:"#7F1D1D" }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Confirmation input */}
          <Text style={{ fontFamily:fonts.semibold, fontSize:12, color:C.muted, marginBottom:8 }}>
            Type <Text style={{ fontFamily:fonts.black, color:"#EF4444" }}>DELETE</Text> to confirm
          </Text>
          <View style={{ backgroundColor:C.input, borderRadius:14, borderWidth:1.5,
            borderColor: error ? "#EF4444" : confirm === "DELETE" ? "#10B981" : C.border,
            paddingHorizontal:14, height:52, justifyContent:"center", marginBottom:8 }}>
            <TextInput
              style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark, letterSpacing:2 }}
              placeholder="DELETE"
              placeholderTextColor={C.slate}
              value={confirm}
              onChangeText={v => { setConfirm(v.toUpperCase()); setError(""); }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          {error ? <Text style={{ fontFamily:fonts.medium, fontSize:12, color:"#EF4444", marginBottom:10 }}>{error}</Text> : null}

          {/* Buttons */}
          <TouchableOpacity
            style={{ backgroundColor: ready ? "#EF4444" : "#FECACA", borderRadius:14, height:54,
              alignItems:"center", justifyContent:"center", marginBottom:10, marginTop:4 }}
            onPress={handleDelete}
            disabled={loading || !ready}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#fff" }}>
                  Yes, Delete My Account
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={{ borderRadius:14, height:50, alignItems:"center", justifyContent:"center",
              borderWidth:1.5, borderColor:C.border }}
            onPress={onClose}
            activeOpacity={0.8}>
            <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:C.muted }}>Cancel — Keep My Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Modal Styles ──────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" },
  sheet:    { borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:Platform.OS==="ios"?44:28 },
  handle:   { width:40, height:4, borderRadius:2, alignSelf:"center", marginBottom:16 },
  title:    { fontFamily:fonts.black, fontSize:20, textAlign:"center", marginBottom:6 },
  sub:      { fontFamily:fonts.regular, fontSize:13, textAlign:"center", lineHeight:20, marginBottom:20 },
  btn:      { borderRadius:14, height:54, alignItems:"center", justifyContent:"center", marginBottom:10 },
  btnTxt:   { fontFamily:fonts.bold, fontSize:15, color:"#fff" },
  ghost:    { borderRadius:14, height:50, alignItems:"center", justifyContent:"center", borderWidth:1.5 },
  ghostTxt: { fontFamily:fonts.semibold, fontSize:14 },
});

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function AccountSettingsScreen({
  visible, onClose, user, onLogout,
  darkMode: darkModeProp,
  language: languageProp,
  onDarkModeChange,
  onLanguageChange,
}) {
  const isControlled = darkModeProp !== undefined;

  const [darkModeLocal,  setDarkModeLocal]  = useState(false);
  const [languageLocal,  setLanguageLocal]  = useState("en");
  const [twoFA,          setTwoFA]          = useState(false);
  const [loaded,         setLoaded]         = useState(false);
  const [localUser,      setLocalUser]      = useState(user);

  const darkMode = isControlled ? darkModeProp  : darkModeLocal;
  const language = isControlled ? languageProp  : languageLocal;

  const [showUsername, setShowUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [show2FA,      setShow2FA]      = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);   // NEW

  useEffect(() => { setLocalUser(user); }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (!isControlled) {
            if (prefs.darkMode  !== undefined) setDarkModeLocal(prefs.darkMode);
            if (prefs.language  !== undefined) setLanguageLocal(prefs.language);
          }
          if (prefs.twoFA !== undefined) setTwoFA(prefs.twoFA);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = async (updates) => {
    try {
      const raw     = await AsyncStorage.getItem(PREFS_KEY);
      const current = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {}
  };

  const handleDarkMode = async (v) => {
    if (isControlled && onDarkModeChange) { onDarkModeChange(v); }
    else { setDarkModeLocal(v); await save({ darkMode: v }); }
  };

  const handleLanguage = async (v) => {
    if (isControlled && onLanguageChange) { onLanguageChange(v); }
    else { setLanguageLocal(v); await save({ language: v }); }
  };

  const handleTwoFA = async (v) => { setTwoFA(v); await save({ twoFA: v }); };

  const C        = darkMode ? DARK : LIGHT;
  const currLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  if (!loaded) return null;

  const Row = ({ iconEl, iconBg, label, sub, right, onPress, danger, last }) => (
    <TouchableOpacity
      onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, gap:14,
        borderBottomWidth:last?0:1, borderBottomColor:C.border }}>
      <View style={{ width:40, height:40, borderRadius:12, backgroundColor:iconBg, alignItems:"center", justifyContent:"center" }}>
        {iconEl}
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:danger?C.red:C.dark }}>{label}</Text>
        {sub ? <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:1 }}>{sub}</Text> : null}
      </View>
      {right !== undefined ? right : (onPress ? <Ico.ChevRight sz={15} cl={C.border}/> : null)}
    </TouchableOpacity>
  );

  const Sec = ({ title }) => (
    <Text style={{ fontFamily:fonts.bold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.6,
      paddingHorizontal:20, paddingTop:24, paddingBottom:8 }}>{title}</Text>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle={C.statusBar}/>
      <View style={{ flex:1, backgroundColor:C.bg }}>

        {/* Header */}
        <View style={{ flexDirection:"row", alignItems:"center", paddingHorizontal:16,
          paddingTop:Platform.OS==="ios"?56:40, paddingBottom:16,
          backgroundColor:C.card, borderBottomWidth:1, borderBottomColor:C.border, gap:12 }}>
          <TouchableOpacity onPress={onClose}
            style={{ width:40, height:40, borderRadius:12, backgroundColor:C.bg, alignItems:"center", justifyContent:"center" }}
            activeOpacity={0.7}>
            <Ico.Back sz={18} cl={C.dark}/>
          </TouchableOpacity>
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:fonts.black, fontSize:18, color:C.dark }}>Account Settings</Text>
            <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:1 }}>@{localUser?.username}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDarkMode(!darkMode)}
            style={{ width:38, height:38, borderRadius:11, backgroundColor:darkMode?C.blue+"30":C.bg, alignItems:"center", justifyContent:"center" }}
            activeOpacity={0.8}>
            {darkMode ? <Ico.Sun sz={16} cl={C.blue}/> : <Ico.Moon sz={16} cl={C.muted}/>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>

          {/* Profile Card */}
          <View style={{ marginHorizontal:20, marginTop:20 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:14, backgroundColor:C.card,
              borderRadius:18, padding:16, borderWidth:1, borderColor:C.border }}>
              <View style={{ width:56, height:56, borderRadius:16, backgroundColor:C.blue, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontFamily:fonts.black, fontSize:22, color:"#fff" }}>
                  {localUser?.firstName?.[0]}{localUser?.lastName?.[0]}
                </Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark }}>{localUser?.firstName} {localUser?.lastName}</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginTop:2 }}>@{localUser?.username}</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.slate, marginTop:1 }}>{localUser?.email}</Text>
              </View>
              {(localUser?.isActivated || localUser?.isAdmin) && (
                <View style={{ backgroundColor:"#FFFBEB", borderRadius:10, paddingHorizontal:8, paddingVertical:4 }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:10, color:C.gold }}>Active ✅</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Account ── */}
          <Sec title="Account"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            <Row iconEl={<Ico.User sz={17} cl={C.blue}/>}   iconBg={C.blue+"18"}   label="Change Username" sub={`@${localUser?.username}`} onPress={() => setShowUsername(true)}/>
            <Row iconEl={<Ico.Lock sz={17} cl={C.purple}/>} iconBg={C.purple+"18"} label="Change Password"  sub="Update your login password"  onPress={() => setShowPassword(true)} last/>
          </View>

          {/* ── Appearance ── */}
          <Sec title="Appearance"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            <Row
              iconEl={darkMode ? <Ico.Moon sz={17} cl={C.gold}/> : <Ico.Sun sz={17} cl={C.orange}/>}
              iconBg={darkMode ? C.gold+"20" : C.orange+"20"}
              label="Dark Mode"
              sub={darkMode ? "Dark theme active" : "Light theme active"}
              right={
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkMode}
                  trackColor={{ false:C.border, true:C.blue }}
                  thumbColor="#fff"
                  ios_backgroundColor={C.border}
                />
              }
              last
            />
          </View>

          {/* ── Language ── */}
          <Sec title="Language"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            <Row
              iconEl={<Ico.Globe sz={17} cl={C.green}/>}
              iconBg={C.green+"20"}
              label="Display Language"
              sub={`${currLang.flag} ${currLang.label}`}
              onPress={() => setShowLanguage(true)}
              last
            />
          </View>

          {/* ── Security ── */}
          <Sec title="Security"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            <Row
              iconEl={<Ico.Shield sz={17} cl={twoFA?C.green:C.muted}/>}
              iconBg={twoFA ? C.green+"20" : C.border}
              label="Two-Factor Authentication"
              sub={twoFA ? "Your account is protected 🔐" : "Add extra security to your login"}
              right={
                <Switch
                  value={twoFA}
                  onValueChange={() => setShow2FA(true)}
                  trackColor={{ false:C.border, true:C.green }}
                  thumbColor="#fff"
                  ios_backgroundColor={C.border}
                />
              }
              last
            />
          </View>

          <View style={{ marginHorizontal:20, marginTop:8, backgroundColor:C.blue+"12", borderRadius:14,
            padding:14, flexDirection:"row", gap:10, borderWidth:1, borderColor:C.blue+"30" }}>
            <Ico.Info sz={15} cl={C.blue}/>
            <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, flex:1, lineHeight:18 }}>
              2FA sends a verification code to your email every time you log in, keeping your earnings safe.
            </Text>
          </View>

          {/* ── Account Info — phone row removed ── */}
          <Sec title="Account Info"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            {[
              { lbl:"Member Since", val: localUser?.createdAt?._seconds
                  ? new Date(localUser.createdAt._seconds * 1000).toLocaleDateString("en-US",{ month:"long", year:"numeric" })
                  : "—"
              },
              { lbl:"Account Status", val:(localUser?.isActivated||localUser?.isAdmin) ? "Active ✅" : "Not Activated" },
              { lbl:"Email",          val:localUser?.email || "—" },
              { lbl:"Referral Code",  val:`@${localUser?.referralCode || localUser?.username || "—"}` },
              { lbl:"User ID",        val:localUser?.uid ? localUser.uid.slice(0,14)+"..." : "—" },
            ].map((row, i, arr) => (
              <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center",
                paddingHorizontal:16, paddingVertical:13,
                borderBottomWidth:i<arr.length-1?1:0, borderBottomColor:C.border }}>
                <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.muted }}>{row.lbl}</Text>
                <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.dark, maxWidth:"55%", textAlign:"right" }} numberOfLines={1}>
                  {row.val}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Danger Zone ── */}
          <Sec title="Danger Zone"/>
          <View style={{ marginHorizontal:20, backgroundColor:C.card, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
            <Row
              iconEl={<Ico.Out sz={17} cl={C.red}/>} iconBg="#FFF5F5"
              label="Log Out" sub="Sign out of your PromoEarn account"
              danger onPress={() => Alert.alert("Log Out?", "Are you sure you want to log out?", [
                { text:"Cancel", style:"cancel" },
                { text:"Log Out", style:"destructive", onPress:() => { onClose(); onLogout?.(); } },
              ])}
            />
            {/* NEW: opens designed delete modal instead of plain alert */}
            <Row
              iconEl={<Ico.Trash sz={17} cl={C.red}/>} iconBg="#FFF5F5"
              label="Delete Account" sub="Permanently erase all your data"
              danger onPress={() => setShowDelete(true)}
              last
            />
          </View>

          <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.slate, textAlign:"center", marginTop:28, marginHorizontal:32 }}>
            PromoEarn v1.0.0 · Preferences saved automatically
          </Text>
        </ScrollView>

        {/* ── All Modals ── */}
        <ChangeUsernameModal
          visible={showUsername} onClose={() => setShowUsername(false)}
          user={localUser} C={C}
          onSuccess={u => setLocalUser(prev => ({ ...prev, username:u, referralCode:u }))}
        />
        <ChangePasswordModal visible={showPassword} onClose={() => setShowPassword(false)} C={C}/>
        <LanguageModal visible={showLanguage} onClose={() => setShowLanguage(false)} current={language} onSelect={handleLanguage} C={C}/>
        <TwoFAModal visible={show2FA} onClose={() => setShow2FA(false)} enabled={twoFA} onConfirmToggle={handleTwoFA} C={C}/>
        <DeleteAccountModal
          visible={showDelete}
          onClose={() => setShowDelete(false)}
          C={C}
          onDeleted={() => { onLogout?.(); }}
        />
      </View>
    </Modal>
  );
}
