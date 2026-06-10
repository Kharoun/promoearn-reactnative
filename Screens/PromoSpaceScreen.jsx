/**
 * PromoSpaceScreen.jsx — PromoEarn
 * Full Paystack payment flow for campaigns (same pattern as activation).
 * Campaign submission attaches userDisplayName so admin sees real name.
 */
import { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Platform, Alert, ActivityIndicator, Image,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from "react-native-svg";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";
import { Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const BASE_URL = "https://promoearn-backend.onrender.com/api/v1"       // ✅

const DEFAULT_C = {
  blue: "#1A56DB", blueSoft: "#EEF4FF", dark: "#0F172A", white: "#FFFFFF",
  green: "#10B981", greenSoft: "#F0FDF4", gold: "#F59E0B", goldSoft: "#FFFBEB",
  red: "#EF4444", purple: "#8B5CF6", purpleSoft: "#F5F3FF", orange: "#F97316",
  light: "#F8FAFF", muted: "#64748B", border: "#E2E8F0", slate: "#94A3B8",
  bg: "#F8FAFF", card: "#FFFFFF", input: "#F8FAFF",
};

const PRICING = {
  likes:     0.027,
  followers: 0.04,
  views:     0.027,
  signup:    0.027,
  comments:  0.027,
  shares:    0.027,
  downloads: 0.04,
  clicks:    0.027,
};
const FEE_PCT = 0.15;

const calcQuote = (taskType, slots) => {
  const s = parseInt(slots) || 0;
  const base = (PRICING[taskType] || 0.35) * s;
  const fee = base * FEE_PCT;
  return { base, fee, total: base + fee };
};

const TASK_TYPES = [
  { key: "likes",     label: "Likes",       icon: "👍", desc: "Get people to like your post or page",   color: "#EF4444", bg: "#FFF5F5" },
  { key: "followers", label: "Followers",   icon: "👥", desc: "Grow your follower count",               color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "views",     label: "Views",       icon: "👁️", desc: "Increase views on your content",         color: "#1A56DB", bg: "#EEF4FF" },
  { key: "signup",    label: "Sign Ups",    icon: "✍️", desc: "Get users to register on your platform", color: "#10B981", bg: "#F0FDF4" },
  { key: "comments",  label: "Comments",   icon: "💬", desc: "Boost engagement with comments",          color: "#F97316", bg: "#FFF7ED" },
  { key: "shares",    label: "Shares",     icon: "🔁", desc: "Amplify reach through sharing",           color: "#06B6D4", bg: "#ECFEFF" },
  { key: "downloads", label: "Downloads",  icon: "⬇️", desc: "Drive app or file downloads",             color: "#F59E0B", bg: "#FFFBEB" },
  { key: "clicks",    label: "Link Clicks", icon: "🔗", desc: "Send traffic to your link",              color: "#EC4899", bg: "#FDF2F8" },
];

const FILTER_TABS = [
  { key: "all",    label: "All",    icon: "⚡" },
  { key: "social", label: "Social", icon: "📱" },
  { key: "video",  label: "Video",  icon: "🎬" },
  { key: "share",  label: "Share",  icon: "🔁" },
  { key: "review", label: "Review", icon: "⭐" },
  { key: "survey", label: "Survey", icon: "📋" },
];

const TYPE_META = {
  social: { bg: "#EEF4FF", color: "#1A56DB", label: "Social" },
  video:  { bg: "#FFF7ED", color: "#F97316", label: "Video"  },
  share:  { bg: "#F0FDF4", color: "#10B981", label: "Share"  },
  review: { bg: "#F5F3FF", color: "#8B5CF6", label: "Review" },
  survey: { bg: "#FFFBEB", color: "#F59E0B", label: "Survey" },
};

const STEP_INFO = [
  { n: 1, label: "Details",  emoji: "📋" },
  { n: 2, label: "Media",    emoji: "🖼️" },
  { n: 3, label: "Review",   emoji: "🚀" },
];

const FAKE_TASKS = [
  { id:"demo_1", type:"social", brand:"Nike",    title:"Follow Nike's official Instagram page",          reward:"2.15", slots:500, filled:312, time:"1 min",  color:"#EF4444" },
  { id:"demo_2", type:"video",  brand:"Samsung", title:"Watch the Samsung Galaxy S25 launch video",       reward:"2.20", slots:300, filled:187, time:"2 min",  color:"#1A56DB" },
  { id:"demo_3", type:"share",  brand:"Jumia",   title:"Share Jumia Black Friday sale to WhatsApp",       reward:"1.18", slots:200, filled:94,  time:"1 min",  color:"#F97316" },
  { id:"demo_4", type:"review", brand:"Konga",   title:"Leave a 5-star review on the Konga app",          reward:"3.25", slots:150, filled:55,  time:"3 min",  color:"#10B981" },
  { id:"demo_5", type:"survey", brand:"MTN",     title:"Complete MTN customer satisfaction survey",       reward:"1.30", slots:100, filled:23,  time:"4 min",  color:"#F59E0B" },
];

// ── API helpers ────────────────────────────────────────────────────────────
const api = async (endpoint, options = {}) => {
  const token = await AuthService.getToken();
  if (!token) {
    throw new Error("Not authenticated — no token available");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

const apiFormData = async (endpoint, formData) => {
  const token = await AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

// ── Icons ──────────────────────────────────────────────────────────────────
const I = {
  Check:  ({ s=14, c="#10B981" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>,
  Lock:   ({ s=18, c="#64748B" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="11" width="18" height="11" rx="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>,
  Crown:  ({ s=18, c="#F59E0B" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/></Svg>,
  Link:   ({ s=14, c="#64748B" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>,
  Img:    ({ s=20, c="#94A3B8" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></Svg>,
  Vid:    ({ s=20, c="#94A3B8" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/></Svg>,
  X:      ({ s=14, c="#64748B" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  Zap:    ({ s=14, c="#F59E0B" }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>,
};

// ── Slot Full Modal ────────────────────────────────────────────────────────
const SlotFullModal = ({ visible, task, onClose, C }) => {
  if (!visible || !task) return null;
  return (
    <Modal visible animationType="fade" transparent>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", alignItems:"center", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:C.card, borderRadius:24, padding:28, alignItems:"center", width:"100%" }}>
          <Text style={{ fontSize:30, marginBottom:12 }}>🔒</Text>
          <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, textAlign:"center", marginBottom:8 }}>All Slots Taken</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", lineHeight:20, marginBottom:20 }}>
            All {task.slots} spots are filled. Check back soon!
          </Text>
          <TouchableOpacity style={{ backgroundColor:C.blue, borderRadius:14, height:50, alignItems:"center", justifyContent:"center", width:"100%" }} onPress={onClose} activeOpacity={0.85}>
            <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFF" }}>Browse other tasks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Task Card ──────────────────────────────────────────────────────────────
const TaskCard = ({ task, locked, onStart, completedIds, C, onSlotsFull }) => {
  const tm   = TYPE_META[task.type] || TYPE_META.social;
  const done = completedIds.includes(task.id) || task.status === "completed";
  const col  = task.color || C.blue;
  const isFull = task.slots > 0 && (task.filled||0) >= task.slots && !done;
  const pct    = task.slots > 0 ? Math.min(((task.filled||0)/task.slots)*100, 100) : 0;
  const [step, setStep] = useState("idle");

  const handleStart = () => {
    if (isFull) { onSlotsFull?.(task); return; }
    if (task.link) { Linking.openURL(task.link); setStep("opened"); }
    else onStart(task);
  };
  const handleConfirm = () => { setStep("confirming"); onStart(task, () => setStep("idle")); };

  return (
    <View style={[TC.card, { backgroundColor:C.card }, (done||isFull) && { opacity:0.65 }]}>
      <View style={{ width:4, borderRadius:4, backgroundColor:col, alignSelf:"stretch", marginRight:12, flexShrink:0 }}/>
      <View style={[TC.avatar, { backgroundColor:col+"20" }]}>
        <Text style={{ fontFamily:fonts.black, fontSize:13, color:col }}>
          {(task.brand||"PE").slice(0,2).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex:1, gap:4 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <View style={[TC.tag, { backgroundColor:tm.bg }]}>
            <Text style={[TC.tagTxt, { color:tm.color }]}>{tm.label}</Text>
          </View>
          {task.time && <Text style={{ fontSize:10, color:C.slate }}>⏱ {task.time}</Text>}
          {isFull && <View style={[TC.tag, { backgroundColor:"#FFF5F5", borderWidth:1, borderColor:"#FECACA" }]}><Text style={[TC.tagTxt, { color:"#EF4444" }]}>FULL</Text></View>}
        </View>
        <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:C.dark, lineHeight:20 }} numberOfLines={2}>{task.title}</Text>
        {task.slots > 0 && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginTop:2 }}>
            <View style={{ flex:1, height:3, backgroundColor:C.border, borderRadius:2, overflow:"hidden" }}>
              <View style={{ width:`${pct}%`, height:"100%", backgroundColor:isFull?"#EF4444":C.green, borderRadius:2 }}/>
            </View>
            <Text style={{ fontSize:9, color:C.slate }}>{task.filled||0}/{task.slots}</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems:"flex-end", justifyContent:"space-between", gap:8, flexShrink:0 }}>
        <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.green }}>+${parseFloat(task.reward||0).toFixed(2)}</Text>
        {done ? (
  <View style={[TC.actionBtn, { backgroundColor:C.border }]}>
    <I.Lock s={13} c={C.muted}/>
  </View>
        ) : isFull ? (
          <TouchableOpacity style={TC.fullBtn} onPress={() => onSlotsFull?.(task)} activeOpacity={0.8}>
            <Text style={{ fontSize:9, color:"#EF4444", fontFamily:fonts.bold }}>Full</Text>
          </TouchableOpacity>
        ) : locked ? (
          <View style={[TC.actionBtn, { backgroundColor:C.border }]}><I.Lock s={12} c={C.white}/></View>
        ) : step==="idle" ? (
          <TouchableOpacity style={[TC.actionBtn, { backgroundColor:col }]} onPress={handleStart} activeOpacity={0.85}>
            <Text style={TC.actionBtnTxt}>Start</Text>
          </TouchableOpacity>
        ) : step==="opened" ? (
          <TouchableOpacity style={[TC.actionBtn, { backgroundColor:C.green }]} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={[TC.actionBtnTxt, { fontSize:10 }]}>Done?</Text>
          </TouchableOpacity>
        ) : (
          <View style={[TC.actionBtn, { backgroundColor:C.muted }]}><ActivityIndicator size="small" color="#FFF"/></View>
        )}
      </View>
    </View>
  );
};

// ── Filter Tab Bar ─────────────────────────────────────────────────────────
const FilterTabBar = ({ filter, onFilter, C }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
    style={{ maxHeight:62 }}
    contentContainerStyle={{ paddingHorizontal:16, paddingVertical:8, gap:8 }}>
    {FILTER_TABS.map(f => {
      const active = filter === f.key;
      return (
        <TouchableOpacity key={f.key} onPress={() => onFilter(f.key)} activeOpacity={0.8}
          style={{
            flexDirection:"row", alignItems:"center", gap:6,
            paddingHorizontal:14, paddingVertical:8,
            borderRadius:22, borderWidth:1.5, flexShrink:0,
            backgroundColor: active ? C.blue : C.card,
            borderColor: active ? C.blue : C.border,
          }}>
          <Text style={{ fontSize:14 }}>{f.icon}</Text>
          <Text style={{ fontFamily:fonts.semibold, fontSize:12, color: active ? "#FFF" : C.muted }}>
            {f.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ── Step Progress ──────────────────────────────────────────────────────────
const StepProgress = ({ step, C }) => (
  <View style={{ marginBottom:24 }}>
    <View style={{ flexDirection:"row", alignItems:"center", marginBottom:10 }}>
      {STEP_INFO.map((s, i) => {
        const done   = step > s.n;
        const active = step === s.n;
        return (
          <View key={s.n} style={{ flexDirection:"row", alignItems:"center", flex: i < STEP_INFO.length - 1 ? 1 : 0 }}>
            <View style={{
              width:36, height:36, borderRadius:18,
              backgroundColor: done ? C.green : active ? C.blue : C.border,
              alignItems:"center", justifyContent:"center",
            }}>
              {done
                ? <Text style={{ fontSize:14 }}>✓</Text>
                : <Text style={{ fontFamily:fonts.bold, fontSize:13, color: active ? "#FFF" : C.muted }}>{s.n}</Text>
              }
            </View>
            {i < STEP_INFO.length - 1 && (
              <View style={{ flex:1, height:3, marginHorizontal:4, borderRadius:2, backgroundColor: step > s.n ? C.green : C.border }}/>
            )}
          </View>
        );
      })}
    </View>
    <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
      {STEP_INFO.map((s, i) => {
        const done   = step > s.n;
        const active = step === s.n;
        return (
          <View key={s.n} style={{ alignItems: i === 0 ? "flex-start" : i === STEP_INFO.length - 1 ? "flex-end" : "center", flex:1 }}>
            <Text style={{ fontSize:11, fontFamily: active ? fonts.bold : fonts.regular, color: active ? C.blue : done ? C.green : C.slate }}>
              {s.emoji} {s.label}
            </Text>
          </View>
        );
      })}
    </View>
    <View style={{ backgroundColor:C.blueSoft, borderRadius:10, paddingHorizontal:14, paddingVertical:8, marginTop:12, alignSelf:"flex-start" }}>
      <Text style={{ fontFamily:fonts.semibold, fontSize:12, color:C.blue }}>
        Step {step} of {STEP_INFO.length} — {STEP_INFO[step-1]?.label}
      </Text>
    </View>
  </View>
);

// ── Task Type Grid ─────────────────────────────────────────────────────────
const TaskTypeGrid = ({ selected, onSelect, C }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={[FF.label, { color:C.muted, marginBottom:12 }]}>What should users do? *</Text>
    <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
      {TASK_TYPES.map(t => {
        const active = selected === t.key;
        return (
          <TouchableOpacity key={t.key} onPress={() => onSelect(t.key)} activeOpacity={0.8}
            style={{
              width:"47%", borderRadius:14, padding:12, gap:8,
              backgroundColor: active ? t.color + "12" : C.card,
              borderWidth: active ? 2 : 1.5,
              borderColor: active ? t.color : C.border,
              position:"relative",
            }}>
            {active && (
              <View style={{ position:"absolute", top:8, right:8, width:18, height:18, borderRadius:9, backgroundColor:t.color, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontSize:10, color:"#FFF" }}>✓</Text>
              </View>
            )}
            <View style={{ width:40, height:40, borderRadius:12, backgroundColor: active ? t.color + "25" : t.bg, alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:18 }}>{t.icon}</Text>
            </View>
            <Text style={{ fontSize:13, fontFamily: active ? fonts.bold : fonts.semibold, color: active ? t.color : C.dark }}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
    {selected && (
      <View style={{ backgroundColor:C.blueSoft, borderRadius:12, padding:12, marginTop:12, flexDirection:"row", gap:8, alignItems:"center" }}>
        <Text style={{ fontSize:18 }}>{TASK_TYPES.find(t=>t.key===selected)?.icon}</Text>
        <Text style={{ fontSize:13, color:C.blue, flex:1 }}>{TASK_TYPES.find(t=>t.key===selected)?.desc}</Text>
      </View>
    )}
  </View>
);

// ── Media Picker ───────────────────────────────────────────────────────────
const MediaPicker = ({ files, onAdd, onRemove, C }) => {
  const isWeb = Platform.OS === "web";
  const fmtSize = b => b < 1024*1024 ? `${(b/1024).toFixed(0)}KB` : `${(b/(1024*1024)).toFixed(1)}MB`;

  

  const pickMobile = async () => {
    try {
      // No permission request needed — system picker handles it
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.85,
      });
      if (!r.canceled && r.assets?.length) {
        onAdd(r.assets.map(a => ({
          uri:     a.uri,
          name:    a.fileName || `media_${Date.now()}`,
          type:    a.type === "video" ? "video/mp4" : "image/jpeg",
          size:    a.fileSize || 0,
          isVideo: a.type === "video",
        })));
      }
    } catch {
      Alert.alert("Not available", "Media picker unavailable.");
    }
  };

  return (
    <View style={{ marginBottom:16 }}>
      <Text style={[FF.label, { color:C.muted }]}>Photos / Videos (optional)</Text>
      {files.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }} contentContainerStyle={{ gap:8, paddingVertical:2 }}>
          {files.map((f,i) => (
            <View key={i} style={{ position:"relative", width:76, height:76 }}>
              {f.isVideo
                ? <View style={{ width:76, height:76, borderRadius:12, backgroundColor:C.dark+"CC", alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:C.border }}><I.Vid s={22} c={C.white}/></View>
                : <Image source={{ uri:f.uri }} style={{ width:76, height:76, borderRadius:12, borderWidth:1, borderColor:C.border }} resizeMode="cover"/>
              }
              <TouchableOpacity onPress={() => onRemove(i)} activeOpacity={0.9}
                style={{ position:"absolute", top:-5, right:-5, width:20, height:20, borderRadius:10, backgroundColor:"#EF4444", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:C.card }}>
                <I.X s={9} c="#FFF"/>
              </TouchableOpacity>
              {f.size>0 && (
                <View style={{ position:"absolute", bottom:4, left:4, right:4, backgroundColor:"rgba(0,0,0,0.55)", borderRadius:4, paddingVertical:1 }}>
                  <Text style={{ fontSize:8, color:"#FFF", textAlign:"center" }}>{fmtSize(f.size)}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
        style={{ backgroundColor:C.card, borderRadius:14, borderWidth:2, borderColor:C.border, borderStyle:"dashed", padding:files.length?14:22, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 }}
        onPress={pickMobile}>
        <I.Img s={files.length?16:24} c={C.slate}/>
        <I.Vid s={files.length?14:20} c={C.slate}/>
        <View>
          <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.muted }}>{files.length?"Add more files":"Upload photos or videos"}</Text>
          {!files.length && <Text style={{ fontSize:11, color:C.slate, marginTop:1 }}>JPG, PNG, MP4, MOV · Max 10 MB</Text>}
        </View>
      </TouchableOpacity>
      {files.length > 0 && <Text style={{ fontSize:11, color:C.muted, marginTop:5 }}>{files.length} file{files.length!==1?"s":""} attached</Text>}
    </View>
  );
};

// ── Field ──────────────────────────────────────────────────────────────────
const Field = ({ label, placeholder, value, onChange, numeric, icon, multi, hint, C }) => (
  <View style={{ marginBottom:16 }}>
    {label && <Text style={[FF.label, { color:C.muted }]}>{label}</Text>}
    <View style={[FF.box, { backgroundColor:C.card, borderColor:C.border }, multi&&{ height:undefined, paddingVertical:12, alignItems:"flex-start" }, !multi&&{ height:50 }]}>
      {icon && <View style={{ marginRight:8 }}>{icon}</View>}
      <TextInput
        style={{ flex:1, fontFamily:fonts.medium, fontSize:14, color:C.dark, minHeight:multi?80:undefined, textAlignVertical:multi?"top":"center" }}
        placeholder={placeholder} placeholderTextColor={C.slate} value={value}
        onChangeText={onChange} keyboardType={numeric?"numeric":"default"} multiline={multi}
      />
    </View>
    {hint && <Text style={{ fontSize:11, color:C.muted, marginTop:4 }}>{hint}</Text>}
  </View>
);

// ══════════════════════════════════════════════════════════════════════════
// CAMPAIGN PAYSTACK MODAL
// Same pattern as the activation PaystackModal — no page redirect.
// On web: opens Paystack in a new tab, polls localStorage for completion.
// On mobile: shows WebView.
// ══════════════════════════════════════════════════════════════════════════
function CampaignPaymentModal({ visible, campaignId, quote, email, userId, onSuccess, onClose, C }) {
  const [loading,    setLoading]    = useState(false);
  const [verifying,  setVerifying]  = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [reference,  setReference]  = useState(null);
  const [error,      setError]      = useState(null);
  const isWeb = Platform.OS === "web";

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setLoading(false); setVerifying(false);
      setPaymentUrl(null); setReference(null); setError(null);
    }
  }, [visible]);

  // Web: poll localStorage for payment completion
  useEffect(() => {
    if (!isWeb || !paymentUrl || !reference) return;
    const interval = setInterval(() => {
      try {
        const done = localStorage.getItem("pe_campaign_payment_done");
        if (done === reference) {
          clearInterval(interval);
          localStorage.removeItem("pe_campaign_payment_done");
          verifyPayment(reference);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [paymentUrl, reference]);

  // Step 1: create payment link
  const handlePay = async () => {
    setLoading(true); setError(null);
    try {
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/campaigns/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campaignId, amount: quote?.total, email, userId }),
      });
      const data = await res.json();
      if (!data.success || !data.data?.url) {
        setError(data.message || "Could not start payment. Try again.");
        return;
      }
      setReference(data.data.reference);
      try { localStorage.setItem("pe_campaign_ref", data.data.reference); localStorage.setItem("pe_campaign_id", campaignId); } catch {}

      if (isWeb) {
        window.open(data.data.url, "_blank");
        setPaymentUrl(data.data.url);
      } else {
        setPaymentUrl(data.data.url);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify
  const verifyPayment = async (ref) => {
    if (verifying) return;
    setVerifying(true); setError(null);
    const refToUse = ref || reference;
    try {
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/campaigns/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference: refToUse, campaignId }),
      });
      const data = await res.json();
      if (data.success) {
        try { localStorage.removeItem("pe_campaign_ref"); localStorage.removeItem("pe_campaign_id"); } catch {}
        setPaymentUrl(null);
        onSuccess();
      } else {
        setError(data.message || "Payment not confirmed yet. Wait a moment and try again.");
      }
    } catch {
      setError("Verification failed. If you paid, tap the button again or contact support.");
    } finally {
      setVerifying(false);
    }
  };

  // Mobile: watch WebView navigation
  const handleWebViewNav = async (navState) => {
    const url = navState.url || "";
    const isComplete = url.includes("/payment-success") || url.includes("paystack.com/close") || url.includes("standard.paystack.com/close");
    if (isComplete) {
      try {
        const parsed = new URL(url);
        const urlRef = parsed.searchParams.get("reference") || parsed.searchParams.get("trxref");
        if (urlRef) { setReference(urlRef); await verifyPayment(urlRef); return; }
      } catch {}
      await verifyPayment(reference);
    }
  };

  // ── Web: waiting screen after tab opened ──────────────────────────────
  if (isWeb && paymentUrl) {
    return (
      <Modal visible animationType="slide" transparent>
        <View style={CPM.overlay}>
          <View style={CPM.sheet}>
            <View style={CPM.handle}/>
            <View style={CPM.header}>
              <View>
                <Text style={CPM.title}>{verifying ? "Activating your campaign…" : "Complete Payment"}</Text>
                <Text style={CPM.sub}>{verifying ? "Please wait" : "Paystack opened in a new tab"}</Text>
              </View>
              {!verifying && (
                <TouchableOpacity style={CPM.closeBtn} onPress={() => { setPaymentUrl(null); setError(null); }} activeOpacity={0.7}>
                  <Text style={{ fontSize:18, color:"#64748B" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ padding:20 }}>
              {verifying ? (
                <View style={{ alignItems:"center", paddingVertical:28 }}>
                  <ActivityIndicator color={C.blue} size="large"/>
                  <Text style={{ marginTop:14, fontFamily:fonts.bold, fontSize:15, color:C.dark, textAlign:"center" }}>Verifying your payment…</Text>
                  <Text style={{ marginTop:6, fontSize:13, color:C.muted, textAlign:"center" }}>Marking your campaign as paid</Text>
                </View>
              ) : (
                <>
                  <View style={{ backgroundColor:C.blueSoft, borderRadius:14, padding:16, marginBottom:18 }}>
                    {["Complete payment in the new tab that opened","Come back to this screen when done","Tap the button below to confirm your campaign"].map((s,i) => (
                      <View key={i} style={{ flexDirection:"row", gap:10, marginBottom:i<2?10:0 }}>
                        <View style={{ width:22, height:22, borderRadius:11, backgroundColor:C.blue, alignItems:"center", justifyContent:"center" }}>
                          <Text style={{ fontFamily:fonts.black, fontSize:11, color:"#FFF" }}>{i+1}</Text>
                        </View>
                        <Text style={{ flex:1, fontSize:13, color:C.dark, lineHeight:20 }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => window.open(paymentUrl,"_blank")} style={{ alignItems:"center", marginBottom:14 }} activeOpacity={0.7}>
                    <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.blue }}>Tab didn't open? Tap here ↗</Text>
                  </TouchableOpacity>
                  {error && (
                    <View style={{ backgroundColor:"#FFF5F5", borderRadius:10, padding:12, marginBottom:14, borderWidth:1, borderColor:"#FECACA" }}>
                      <Text style={{ fontSize:13, color:C.red, textAlign:"center" }}>⚠️ {error}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ backgroundColor:C.green, borderRadius:14, height:52, alignItems:"center", justifyContent:"center" }}
                    onPress={() => verifyPayment(reference)} activeOpacity={0.85}>
                    <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFF" }}>✅  I've completed payment</Text>
                  </TouchableOpacity>
                </>
              )}
              <Text style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:14 }}>Secured by Paystack · No recurring charges</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Mobile: WebView ───────────────────────────────────────────────────
  if (!isWeb && paymentUrl) {
    const { WebView } = require("react-native-webview");
    return (
      <Modal visible animationType="slide">
        <View style={{ flex:1, backgroundColor:"#FFF" }}>
          <View style={{ flexDirection:"row", alignItems:"center", paddingTop:Platform.OS==="ios"?56:40, paddingHorizontal:16, paddingBottom:12, borderBottomWidth:1, borderBottomColor:"#E2E8F0" }}>
            <TouchableOpacity onPress={() => { setPaymentUrl(null); setError(null); }} style={{ marginRight:16 }} activeOpacity={0.7}>
              <Text style={{ fontSize:16, color:"#64748B" }}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily:fonts.bold, fontSize:16, color:"#0F172A", flex:1 }}>Campaign Payment · Paystack</Text>
            {verifying && <ActivityIndicator color={C.blue}/>}
          </View>
          <WebView source={{ uri:paymentUrl }} onNavigationStateChange={handleWebViewNav} startInLoadingState renderLoading={() => (
            <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, alignItems:"center", justifyContent:"center", backgroundColor:"#FFF" }}>
              <ActivityIndicator size="large" color={C.blue}/>
              <Text style={{ marginTop:12, color:"#64748B", fontSize:14 }}>Loading payment page...</Text>
            </View>
          )}/>
          {verifying ? (
            <View style={{ padding:20, alignItems:"center" }}>
              <ActivityIndicator color={C.blue}/>
              <Text style={{ marginTop:8, color:"#64748B", fontSize:13 }}>Confirming payment…</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => verifyPayment(reference)} style={{ margin:16, backgroundColor:C.green, borderRadius:14, height:52, alignItems:"center", justifyContent:"center" }} activeOpacity={0.85}>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFF" }}>✅  I've completed payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    );
  }

  // ── Summary sheet (before payment starts) ────────────────────────────
  if (!visible) return null;
  return (
    <Modal visible animationType="slide" transparent>
      <View style={CPM.overlay}>
        <View style={CPM.sheet}>
          <View style={CPM.handle}/>
          <View style={CPM.header}>
            <View>
              <Text style={CPM.title}>Confirm & Pay</Text>
              <Text style={CPM.sub}>One last step to launch your campaign</Text>
            </View>
            <TouchableOpacity style={CPM.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ fontSize:18, color:"#64748B" }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding:20 }}>
            {/* Quote breakdown */}
            <View style={{ backgroundColor:"#F8FAFF", borderRadius:16, padding:16, marginBottom:16, borderWidth:1, borderColor:"#E2E8F0" }}>
              {[
                { lbl:"Campaign total", val:`$${quote?.total?.toFixed(2)}` },
              ].map((r,i) => (
                <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:8, borderBottomWidth:1, borderBottomColor:"#E2E8F0" }}>
                  <Text style={{ fontSize:13, color:r.dim?"#64748B":"#0F172A" }}>{r.lbl}</Text>
                  <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:r.dim?"#64748B":"#0F172A" }}>{r.val}</Text>
                </View>
              ))}
              <View style={{ flexDirection:"row", justifyContent:"space-between", paddingTop:12 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#0F172A" }}>Total Due</Text>
                <Text style={{ fontFamily:fonts.bold, fontSize:20, color:C.blue }}>${quote?.total?.toFixed(2)}</Text>
              </View>
            </View>

            {/* Guarantees */}
            {[
              { icon:"🔒", text:"Secured by Paystack — no card details stored" },
              { icon:"💰", text:"Refundable if campaign is rejected by admin" },
              { icon:"⚡", text:"Campaign goes live within 24 hours of approval" },
            ].map((g,i) => (
              <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 }}>
                <Text style={{ fontSize:16 }}>{g.icon}</Text>
                <Text style={{ fontSize:12, color:"#64748B", flex:1 }}>{g.text}</Text>
              </View>
            ))}

            {error && (
              <View style={{ backgroundColor:"#FFF5F5", borderRadius:10, padding:12, marginBottom:14, borderWidth:1, borderColor:"#FECACA" }}>
                <Text style={{ fontSize:13, color:C.red, textAlign:"center" }}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={{ backgroundColor:"#00C3F7", borderRadius:14, height:54, alignItems:"center", justifyContent:"center", opacity:loading?0.7:1 }}
              onPress={handlePay} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#FFF"/>
                : <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFF" }}>💳  Pay ${quote?.total?.toFixed(2)} via Paystack</Text>
              }
            </TouchableOpacity>
            <Text style={{ fontSize:11, color:"#64748B", textAlign:"center", marginTop:12 }}>No recurring charges</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CPM = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" },
  sheet:    { backgroundColor:"#FFF", borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:Platform.OS==="ios"?40:28 },
  handle:   { width:40, height:4, backgroundColor:"#E2E8F0", borderRadius:2, alignSelf:"center", marginTop:12 },
  header:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:"#E2E8F0" },
  title:    { fontFamily:fonts.bold, fontSize:17, color:"#0F172A" },
  sub:      { fontFamily:fonts.regular, fontSize:12, color:"#64748B", marginTop:2 },
  closeBtn: { width:36, height:36, borderRadius:18, backgroundColor:"#F8FAFF", alignItems:"center", justifyContent:"center" },
});

// ══════════════════════════════════════════════════════════════════════════
// ADVERTISE SECTION
// ══════════════════════════════════════════════════════════════════════════
function AdvertiseSection({ user, C }) {
  const empty = { brandName:"", targetCount:"", slots:"", pageLink:"", description:"", mediaNote:"", contactEmail:user?.email||"" };
  const [form,       setForm]     = useState(empty);
  const [step,       setStep]     = useState(1);
  const [selType,    setSelType]  = useState(null);
  const [mediaFiles, setMedia]    = useState([]);
  const [submitting, setSub]      = useState(false);
  const [showPay,    setShowPay]  = useState(false);
  const [campaignId, setCId]      = useState(null);
  const [done,       setDone]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const set   = (k,v) => setForm(p => ({...p,[k]:v}));
  const quote = selType && form.slots ? calcQuote(selType, form.slots) : null;

  const uploadMedia = async () => {
    if (!mediaFiles.length) return [];
    const fd = new FormData();
    mediaFiles.forEach(f => {
      if (f.raw) fd.append("files", f.raw, f.name);
      else fd.append("files", { uri:f.uri, type:f.type, name:f.name });
    });
    try { const r = await apiFormData("/campaigns/upload-media", fd); return r.success ? (r.data?.urls||[]) : []; }
    catch { return []; }
  };

  // ── Submit campaign metadata, then open payment modal ─────────────────
  const handleSubmit = async () => {
    if (!form.brandName || !selType || !form.pageLink || !form.slots || !form.contactEmail) {
      Alert.alert("Missing fields", "Please fill in all required fields."); return;
    }
    setSub(true);
    try {
      const mediaUrls = await uploadMedia();

      // Build userDisplayName from user object so admin sees real name
      const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.email || "Unknown";

      const res = await api("/campaigns/submit", {
        method: "POST",
        body: {
          brandName:       form.brandName,
          taskType:        selType,
          targetCount:     parseInt(form.targetCount) || 0,
          slots:           parseInt(form.slots),
          pageLink:        form.pageLink,
          description:     form.description,
          mediaNote:       form.mediaNote,
          contactEmail:    form.contactEmail,
          mediaUrls,
          mediaCount:      mediaFiles.length,
          quotedTotal:     quote?.total,
          quotedPerUser:   PRICING[selType] || 0.35,
          status:          "pending_payment",
          submittedBy:     user?.uid,
          userDisplayName, // ← admin sees this in CampaignsScreen
          userEmail:       user?.email,
          userUsername:    user?.username,
        },
      });

      if (res.success) {
        setCId(res.data.campaignId);
        setShowPay(true); // open CampaignPaymentModal instead of navigating away
      } else {
        Alert.alert("Error", res.message || "Submission failed.");
      }
    } catch {
      Alert.alert("Error", "Network error.");
    } finally {
      setSub(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPay(false);
    setDone(true);
  };

  const reset = () => {
    setForm(empty); setStep(1); setSelType(null); setMedia([]);
    setShowPay(false); setDone(false); setCId(null);
  };

  // ── Success screen ────────────────────────────────────────────────────
  if (done) return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:32 }}>
      <Text style={{ fontSize:56, marginBottom:16 }}>🚀</Text>
      <Text style={{ fontFamily:fonts.black, fontSize:24, color:C.dark, textAlign:"center", marginBottom:8 }}>Campaign Submitted!</Text>
      <View style={{ backgroundColor:C.greenSoft, borderRadius:16, padding:16, width:"100%", marginBottom:24 }}>
        {[
          { icon:"✅", text:"Payment confirmed via Paystack" },
          { icon:"👀", text:"Our team is reviewing your campaign" },
          { icon:"⚡", text:"Goes live within 24 hours of approval" },
          { icon:"📧", text:`Updates sent to ${form.contactEmail}` },
        ].map((it,i) => (
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:10, paddingVertical:8, borderBottomWidth:i<3?1:0, borderBottomColor:C.border }}>
            <Text style={{ fontSize:16 }}>{it.icon}</Text>
            <Text style={{ fontSize:13, color:C.dark, flex:1 }}>{it.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={{ backgroundColor:C.blue, borderRadius:14, paddingHorizontal:32, paddingVertical:14 }} onPress={reset} activeOpacity={0.85}>
        <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFF" }}>Start Another Campaign</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:60 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom:20, marginTop:8 }}>
          <Text style={{ fontFamily:fonts.black, fontSize:22, color:C.dark, letterSpacing:-0.5 }}>Advertise With Us</Text>
          <Text style={{ fontSize:13, color:C.muted, marginTop:4 }}>Reach thousands of active PromoEarn users.</Text>
        </View>

        {/* Stats */}
        <View style={{ backgroundColor:"#0F172A", borderRadius:20, padding:20, marginBottom:22, flexDirection:"row", overflow:"hidden" }}>
          <View style={{ position:"absolute", width:160, height:160, borderRadius:80, backgroundColor:C.blue, opacity:0.15, top:-40, right:-30 }}/>
          {[{v:"10K+",l:"Active Users"},{v:"95%",l:"Task Rate"},{v:"24h",l:"Go Live"}].map((s,i)=>(
            <View key={i} style={{ flex:1, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:"rgba(255,255,255,0.1)" }}>
              <Text style={{ fontFamily:fonts.black, fontSize:22, color:"#FFF" }}>{s.v}</Text>
              <Text style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        <StepProgress step={step} C={C}/>

        {/* ─ STEP 1 ─ */}
        {step===1 && (
          <View>
            <Field label="Brand / Product Name *" placeholder="e.g. MyApp, Nike" value={form.brandName} onChange={v=>set("brandName",v)} C={C}/>
            <Field label="Contact Email *" placeholder="you@company.com" value={form.contactEmail} onChange={v=>set("contactEmail",v)} hint="We'll send campaign updates here" C={C}/>
            <TaskTypeGrid selected={selType} onSelect={setSelType} C={C}/>
            <View style={{ flexDirection:"row", gap:12 }}>
  <View style={{ flex:1 }}>
    <Field
      label="Target Count"
      placeholder="e.g. 500"
      value={form.targetCount}
      onChange={v => {
        set("targetCount", v);
        const n = parseInt(v) || 0;
        setFieldErrors(p => ({
          ...p,
          targetCount: v && n < 100 ? "Minimum is 100" : null,
        }));
      }}
      numeric
      hint={fieldErrors.targetCount
        ? undefined
        : "Your goal"}
      C={C}
    />
    {fieldErrors.targetCount && (
      <Text style={{ fontSize:11, color:"#EF4444", marginTop:-10, marginBottom:8 }}>
        ⚠ {fieldErrors.targetCount}
      </Text>
    )}
  </View>
  <View style={{ flex:1 }}>
    <Field
      label="No. of Slots *"
      placeholder="Min. 100"
      value={form.slots}
      onChange={v => {
        set("slots", v);
        const n = parseInt(v) || 0;
        setFieldErrors(p => ({
          ...p,
          slots: n > 0 && n < 100 ? "Minimum is 100" : null,
        }));
      }}
      numeric
      hint={fieldErrors.slots
        ? undefined
        : "Users who will do it"}
      C={C}
    />
    {fieldErrors.slots && (
      <Text style={{ fontSize:11, color:"#EF4444", marginTop:-10, marginBottom:8 }}>
        ⚠ {fieldErrors.slots}
      </Text>
    )}
  </View>
</View>
            {quote && (
              <View style={{ backgroundColor:C.goldSoft, borderRadius:14, padding:16, marginBottom:20, borderWidth:1.5, borderColor:"#FDE68A" }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:7, marginBottom:10 }}>
                  <I.Zap s={15}/>
                  <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>Pricing Preview</Text>
                </View>
                {[{l:`${form.slots} slots × $${(PRICING[selType]||0.35).toFixed(2)}`, v:`$${quote.total.toFixed(2)}`}].map((r,i)=>(
                  <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:4 }}>
                    <Text style={{ fontSize:12, color:C.muted }}>{r.l}</Text>
                    <Text style={{ fontFamily:fonts.semibold, fontSize:12, color:C.dark }}>{r.v}</Text>
                  </View>
                ))}
                <View style={{ height:1, backgroundColor:"#FDE68A", marginVertical:8 }}/>
                <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.dark }}>Total</Text>
                  <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.blue }}>${quote.total.toFixed(2)}</Text>
                </View>
              </View>
            )}
          <TouchableOpacity
  style={[FF.nextBtn, { backgroundColor:C.blue },
    (!form.brandName || !selType || !form.slots || !form.contactEmail ||
     fieldErrors.slots || fieldErrors.targetCount) && { opacity:0.45 }
  ]}
  onPress={() => {
    if (!form.brandName || !selType || !form.slots || !form.contactEmail) return;
    if (fieldErrors.slots || fieldErrors.targetCount) return;
    if ((parseInt(form.slots) || 0) < 100) {
      setFieldErrors(p => ({ ...p, slots: "Minimum is 100" })); return;
    }
    setStep(2);
  }}
  activeOpacity={0.85}>
  <Text style={FF.nextBtnTxt}>Continue →</Text>
</TouchableOpacity>
          </View>
        )}

        {/* ─ STEP 2 ─ */}
        {step===2 && (
          <View>
            <Field label="Link to your page / post *" placeholder="https://instagram.com/yourbrand" value={form.pageLink} onChange={v=>set("pageLink",v)} icon={<I.Link s={14} c={C.muted}/>} C={C}/>
            <Field label="Campaign Description" placeholder="Describe what users should do…" value={form.description} onChange={v=>set("description",v)} multi C={C}/>
            <MediaPicker files={mediaFiles} onAdd={f=>setMedia(p=>[...p,...f])} onRemove={i=>setMedia(p=>p.filter((_,j)=>j!==i))} C={C}/>
            <Field label="Additional Notes" placeholder="Any special instructions…" value={form.mediaNote} onChange={v=>set("mediaNote",v)} multi C={C}/>
            <View style={{ flexDirection:"row", gap:10, marginTop:4 }}>
            <TouchableOpacity style={[FF.backBtn, { borderColor:C.border }]} onPress={()=>setStep(1)} activeOpacity={0.8}><Text style={[FF.backBtnTxt, { color:C.dark }]}>← Back</Text></TouchableOpacity>
              <TouchableOpacity style={[FF.nextBtn, { flex:1, backgroundColor:C.blue }, !form.pageLink&&{opacity:0.45}]} onPress={()=>{ if(form.pageLink) setStep(3); }} activeOpacity={0.85}>
                <Text style={FF.nextBtnTxt}>Review →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─ STEP 3 ─ */}
        {step===3 && (
          <View>
            <View style={{ backgroundColor:C.card, borderRadius:18, padding:18, borderWidth:1, borderColor:C.border, marginBottom:14 }}>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.dark, marginBottom:14 }}>Campaign Summary</Text>
              {[
                {l:"Brand",        v:form.brandName},
                {l:"Task Type",    v:TASK_TYPES.find(t=>t.key===selType)?.label||"—"},
                {l:"Slots",        v:form.slots||"—"},
                {l:"Target Count", v:form.targetCount||"Not specified"},
                {l:"Page Link",    v:form.pageLink},
                {l:"Contact",      v:form.contactEmail},
              ].map((r,i)=>(
                <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:9, borderBottomWidth:i<5?1:0, borderBottomColor:C.border }}>
                  <Text style={{ fontSize:13, color:C.muted }}>{r.l}</Text>
                  <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.dark, flex:1, textAlign:"right", marginLeft:12 }} numberOfLines={1}>{r.v}</Text>
                </View>
              ))}
              {mediaFiles.length>0 && (
                <View style={{ paddingTop:10 }}>
                  <Text style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Media ({mediaFiles.length} file{mediaFiles.length!==1?"s":""})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6 }}>
                    {mediaFiles.map((f,i)=>(
                      <View key={i} style={{ width:48, height:48 }}>
                        {f.isVideo
                          ? <View style={{ width:48, height:48, borderRadius:8, backgroundColor:C.dark+"BB", alignItems:"center", justifyContent:"center" }}><I.Vid s={16} c={C.white}/></View>
                          : <Image source={{ uri:f.uri }} style={{ width:48, height:48, borderRadius:8 }} resizeMode="cover"/>
                        }
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Payment summary */}
            {quote && (
              <View style={{ backgroundColor:C.blueSoft, borderRadius:14, padding:16, marginBottom:14, borderWidth:1.5, borderColor:"#BFDBFE" }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.dark, marginBottom:10 }}>💳 Payment Required</Text>
                {[
                 {l:`${form.slots} slots × $${(PRICING[selType]||0.35).toFixed(2)}`, v:`$${quote.total.toFixed(2)}`}
                ].map((r,i)=>(
                  <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:5 }}>
                    <Text style={{ fontSize:13, color:C.muted }}>{r.l}</Text>
                    <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.dark }}>{r.v}</Text>
                  </View>
                ))}
                <View style={{ height:1, backgroundColor:"#BFDBFE", marginVertical:8 }}/>
                <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.dark }}>Total</Text>
                  <Text style={{ fontFamily:fonts.bold, fontSize:20, color:C.blue }}>${quote.total.toFixed(2)}</Text>
                </View>
                <Text style={{ fontSize:11, color:C.muted, marginTop:6 }}>Refundable if rejected · Paystack secured</Text>
              </View>
            )}

            <View style={{ flexDirection:"row", gap:10 }}>
            <TouchableOpacity style={[FF.backBtn, { borderColor:C.border }]} onPress={()=>setStep(2)} activeOpacity={0.8}>
  <Text style={[FF.backBtnTxt, { color:C.dark }]}>← Back</Text>
</TouchableOpacity>
              <TouchableOpacity
                style={[FF.nextBtn, { flex:1, backgroundColor:C.blue }, submitting&&{opacity:0.7}]}
                onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color="#FFF"/> : <Text style={FF.nextBtnTxt}>🚀 Submit & Pay</Text>}
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:10 }}>
              By submitting you agree to our advertising terms
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Campaign Payment Modal ─────────────────────────────────────── */}
      <CampaignPaymentModal
        visible={showPay}
        campaignId={campaignId}
        quote={quote}
        email={form.contactEmail}
        userId={user?.uid}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPay(false)}
        C={C}
      />
    </>
  );
}
// ── My Campaigns Status Map ────────────────────────────────────────────────
const MY_STATUS = {
  pending_payment: { label:"Awaiting Payment", color:"#92600A", bg:"#FFF3CD", dot:"#F59E0B", icon:"⏳" },
  paid:            { label:"Paid · In Review",  color:"#1A56DB", bg:"#EEF4FF", dot:"#1A56DB", icon:"👀" },
  approved:        { label:"Approved",          color:"#065F46", bg:"#D1FAE5", dot:"#10B981", icon:"✅" },
  rejected:        { label:"Rejected",          color:"#7F1D1D", bg:"#FEE2E2", dot:"#EF4444", icon:"❌" },
  live:            { label:"Live",              color:"#4C1D95", bg:"#EDE9FE", dot:"#8B5CF6", icon:"🔴" },
  completed:       { label:"Completed",         color:"#475569", bg:"#F1F5F9", dot:"#94A3B8", icon:"🏁" },
};

function MyCampaignsSection({ user, C }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  useEffect(() => { fetchMyCampaigns(); }, []);

  const fetchMyCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api("/campaigns/my");
      if (res.success) setCampaigns(res.data.campaigns || []);
    } catch {}
    finally { setLoading(false); }
  };

  const fmtDate = ts => {
    if (!ts) return "—";
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  };

  if (loading) return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingVertical:60 }}>
      <ActivityIndicator color={C.blue} size="large"/>
      <Text style={{ fontSize:13, color:C.muted, marginTop:12 }}>Loading your campaigns…</Text>
    </View>
  );

  if (campaigns.length === 0) return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:32 }}>
      <Text style={{ fontSize:52, marginBottom:16 }}>📋</Text>
      <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, textAlign:"center", marginBottom:8 }}>No Campaigns Yet</Text>
      <Text style={{ fontSize:13, color:C.muted, textAlign:"center", lineHeight:20 }}>
        Switch to the Advertise tab to submit your first campaign.
      </Text>
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingTop:14, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.muted, marginBottom:12 }}>
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} submitted
        </Text>
        {campaigns.map(c => {
          const st  = MY_STATUS[c.status] || MY_STATUS.pending_payment;
          const tt  = TASK_TYPES.find(t => t.key === c.taskType) || { icon:"📋", label:c.taskType, color:C.muted };
          return (
            <TouchableOpacity key={c.id} onPress={() => setSelected(c)} activeOpacity={0.85}
              style={{ backgroundColor:C.card, borderRadius:18, padding:16, marginBottom:12, borderWidth:1.5, borderColor:C.border }}>
              {/* Top row */}
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <View style={{ flex:1, marginRight:10 }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.dark }} numberOfLines={1}>{c.brandName}</Text>
                  <Text style={{ fontSize:12, color:C.muted, marginTop:2 }}>{tt.icon} {tt.label} · {c.slots} slots</Text>
                </View>
                <View style={{ backgroundColor:st.bg, borderRadius:20, paddingHorizontal:10, paddingVertical:4, flexDirection:"row", alignItems:"center", gap:5 }}>
                  <View style={{ width:6, height:6, borderRadius:3, backgroundColor:st.dot }}/>
                  <Text style={{ fontSize:11, fontWeight:"700", color:st.color }}>{st.label}</Text>
                </View>
              </View>

              {/* Rejection note */}
              {c.status === "rejected" && c.adminNote && (
                <View style={{ backgroundColor:"#FFF5F5", borderRadius:10, padding:10, marginBottom:10, borderLeftWidth:3, borderLeftColor:"#EF4444" }}>
                  <Text style={{ fontSize:12, color:"#991B1B" }}>⚠️ {c.adminNote}</Text>
                </View>
              )}

              {/* Bottom row */}
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                <Text style={{ fontSize:11, color:C.slate }}>📅 {fmtDate(c.createdAt)}</Text>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
                  <View style={{ backgroundColor: c.paymentStatus==="paid" ? "#DCFCE7" : "#FEF3C7", borderRadius:20, paddingHorizontal:8, paddingVertical:3 }}>
                    <Text style={{ fontSize:10, fontWeight:"700", color: c.paymentStatus==="paid" ? "#166534" : "#92400E" }}>
                      {c.paymentStatus==="paid" ? "● Paid" : "◌ Unpaid"}
                    </Text>
                  </View>
                  <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.green }}>${parseFloat(c.quotedTotal||0).toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Detail modal */}
      {selected && (
        <Modal visible animationType="slide" transparent>
          <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" }}>
            <View style={{ backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:Platform.OS==="ios"?40:28, maxHeight:"85%" }}>
              <View style={{ width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12 }}/>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:17, color:C.dark }}>{selected.brandName}</Text>
                <TouchableOpacity onPress={() => setSelected(null)} style={{ width:36, height:36, borderRadius:18, backgroundColor:C.bg, alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding:20 }}>
                {/* Status */}
                {(() => { const st = MY_STATUS[selected.status] || MY_STATUS.pending_payment; return (
                  <View style={{ backgroundColor:st.bg, borderRadius:14, padding:14, marginBottom:16, flexDirection:"row", alignItems:"center", gap:10 }}>
                    <Text style={{ fontSize:22 }}>{st.icon}</Text>
                    <View>
                      <Text style={{ fontFamily:fonts.bold, fontSize:14, color:st.color }}>{st.label}</Text>
                      <Text style={{ fontSize:12, color:st.color, opacity:0.8, marginTop:2 }}>
                        {selected.status==="pending_payment" && "Waiting for your payment to complete"}
                        {selected.status==="paid"            && "Our team is reviewing your campaign"}
                        {selected.status==="approved"        && "Campaign approved and ready to go live"}
                        {selected.status==="rejected"        && (selected.adminNote || "Please contact support for details")}
                        {selected.status==="live"            && "Your campaign is currently running"}
                        {selected.status==="completed"       && "Campaign has finished"}
                      </Text>
                    </View>
                  </View>
                ); })()}

                {/* Details */}
                {[
                  { l:"Task Type",    v:`${TASK_TYPES.find(t=>t.key===selected.taskType)?.icon||""} ${TASK_TYPES.find(t=>t.key===selected.taskType)?.label||selected.taskType}` },
                  { l:"Slots",        v:`${selected.slots} users` },
                  { l:"Target Count", v:selected.targetCount||"Not specified" },
                  { l:"Page Link",    v:selected.pageLink },
                  { l:"Contact",      v:selected.contactEmail },
                  { l:"Submitted",    v:(() => { if (!selected.createdAt) return "—"; const d = selected.createdAt._seconds ? new Date(selected.createdAt._seconds*1000) : new Date(selected.createdAt); return d.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}); })() },
                  { l:"Amount Paid",  v:`$${parseFloat(selected.quotedTotal||0).toFixed(2)}` },
                  { l:"Payment",      v:selected.paymentStatus==="paid" ? "✅ Confirmed" : "⏳ Pending" },
                ].map((r,i) => (
                  <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:10, borderBottomWidth:i<7?1:0, borderBottomColor:C.border }}>
                    <Text style={{ fontSize:13, color:C.muted, flex:1 }}>{r.l}</Text>
                    <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.dark, flex:2, textAlign:"right" }} numberOfLines={1}>{r.v}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
// ── Marketplace Coming Soon ────────────────────────────────────────────────
function MarketplaceLocked({ C }) {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:32, paddingTop:40 }}>
      <View style={{ width:"100%", borderRadius:20, overflow:"hidden", marginBottom:32, opacity:0.3 }}>
        {[1,2,3].map(i=>(
          <View key={i} style={{ backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:8, flexDirection:"row", gap:12 }}>
            <View style={{ width:46, height:46, borderRadius:14, backgroundColor:C.border }}/>
            <View style={{ flex:1, gap:8 }}>
              <View style={{ width:"70%", height:11, backgroundColor:C.border, borderRadius:6 }}/>
              <View style={{ width:"45%", height:9, backgroundColor:C.border, borderRadius:6 }}/>
            </View>
          </View>
        ))}
      </View>
      <View style={{ width:72, height:72, borderRadius:36, backgroundColor:C.dark, alignItems:"center", justifyContent:"center", marginBottom:18 }}>
        <Text style={{ fontSize:32 }}>🛍️</Text>
      </View>
      <Text style={{ fontFamily:fonts.black, fontSize:24, color:C.dark, textAlign:"center", marginBottom:8 }}>Marketplace</Text>
      <View style={{ backgroundColor:"#FFF3CD", borderRadius:20, paddingHorizontal:16, paddingVertical:5, marginBottom:14 }}>
        <Text style={{ fontFamily:fonts.bold, fontSize:12, color:"#92600A" }}>🚧 Coming Soon</Text>
      </View>
      <Text style={{ fontSize:14, color:C.muted, textAlign:"center", lineHeight:22, marginBottom:28 }}>
        A full ecosystem where brands and creators connect, trade services, and grow together.
      </Text>
      <View style={{ width:"100%", backgroundColor:C.card, borderRadius:20, padding:20, borderWidth:1, borderColor:C.border }}>
        <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.dark, marginBottom:12 }}>What's Coming</Text>
        {[{e:"🛍️",t:"Buy & sell promotional services"},{e:"🤝",t:"Direct brand-creator collaboration"},{e:"📊",t:"Analytics & performance tracking"},{e:"💎",t:"Premium verified brand badges"}].map((it,i)=>(
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:9, borderBottomWidth:i<3?1:0, borderBottomColor:C.border }}>
            <Text style={{ fontSize:18 }}>{it.e}</Text>
            <Text style={{ fontSize:13, color:C.muted, flex:1 }}>{it.t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function PromoSpaceScreen({ user, setUser, onUpgrade, C:CProp, language, t }) {
  const C = CProp || DEFAULT_C;
  const [tab,      setTab]      = useState("tasks");
  const [filter,   setFilter]   = useState("all");
  const [tasks,    setTasks]    = useState([]);
  const [doneIds,  setDoneIds]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [slotTask, setSlotTask] = useState(null);
  const [showSlot, setShowSlot] = useState(false);
  const locked = !(user?.isActivated || user?.isAdmin);

  useEffect(() => { fetchTasks(); loadDone(); }, []);

  const loadDone = async () => {
    try { const s = await AsyncStorage.getItem(`pe_completed_${user?.uid}`); if (s) setDoneIds(JSON.parse(s)); } catch {}
  };
  const saveDone = async id => {
    try {
      const key = `pe_completed_${user?.uid}`;
      const raw = await AsyncStorage.getItem(key);
          const cur = JSON.parse(raw || "[]");
         await AsyncStorage.setItem(key, JSON.stringify([...new Set([...cur, id])]));
      setDoneIds(p => [...new Set([...p, id])]);
    } catch {}
  };
  const fetchTasks = async () => {
    setLoading(true);
    try { const r = await api("/tasks"); if (r.success) setTasks(r.data.tasks); } catch {}
    finally { setLoading(false); }
  };
  const handleStart = async (task, cb) => {
    try {
      const r = await api(`/tasks/${task.id}/complete`, { method:"POST" });
      if (r.success) {
        saveDone(task.id);
        const ur = await AuthService.getMe();
        if (ur.success && setUser) setUser(ur.data.user);
        Alert.alert("🎉 Task Complete!", `+$${parseFloat(task.reward).toFixed(2)} added to your balance!`);
      } else {
        Alert.alert("Oops", r.message||"Failed.");
      }
    } catch { Alert.alert("Error","Failed to complete task."); }
    finally { cb?.(); }
  };

  const list   = filter==="all" ? tasks : tasks.filter(t=>t.type===filter);
  const earn   = tasks.reduce((s,t)=>s+parseFloat(t.reward||0),0);
  const done   = tasks.filter(t=>doneIds.includes(t.id)).length;
  const sorted = [
    ...list.filter(t=>!doneIds.includes(t.id)&&!(t.slots>0&&(t.filled||0)>=t.slots)),
    ...list.filter(t=>!doneIds.includes(t.id)&&t.slots>0&&(t.filled||0)>=t.slots),
    ...list.filter(t=>doneIds.includes(t.id)),
  ];

  const TABS = [
    { key:"tasks",        label:"Earn"      },
    { key:"advertise",    label:"Advertise" },
    { key:"my-campaigns", label:"My Ads"    },
    { key:"marketplace",  label:"Market"    },
  ];

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      {/* Header */}
      <View style={[PS.header, { backgroundColor:C.card, borderBottomColor:C.border }]}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <View>
            <Text style={[PS.title, { color:C.dark }]}>PromoSpace</Text>
            <Text style={[PS.subtitle, { color:C.muted }]}>Earn · Advertise · Grow</Text>
          </View>
          {!locked && tab==="tasks" && (
            <View style={{ backgroundColor:C.greenSoft, borderRadius:12, paddingHorizontal:14, paddingVertical:8, alignItems:"center" }}>
              <Text style={{ fontFamily:fonts.black, fontSize:16, color:C.green }}>{done}/{tasks.length}</Text>
              <Text style={{ fontSize:10, color:C.green }}>Done</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection:"row", backgroundColor:C.bg, borderRadius:14, padding:3 }}>
          {TABS.map(tb => (
            <TouchableOpacity key={tb.key} onPress={()=>setTab(tb.key)} activeOpacity={0.8}
            style={[PS.tab, tab===tb.key&&PS.tabActive, tab===tb.key&&{ backgroundColor:C.card }, { flex:1 }]}>
              <Text style={[PS.tabTxt, { color:tab===tb.key?C.dark:C.muted }, tab===tb.key&&PS.tabTxtActive]}>{tb.label}</Text>
              {tb.key==="marketplace" && (
                <View style={{ backgroundColor:C.gold, borderRadius:5, paddingHorizontal:4, paddingVertical:1, marginLeft:4 }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:8, color:"#FFF" }}>SOON</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earn tab */}
      {tab==="tasks" && (
        <View style={{ flex:1 }}>
          {!locked && (
            <View style={[PS.banner, { backgroundColor:C.blue }]}>
              <View style={{ position:"absolute", width:120, height:120, borderRadius:60, backgroundColor:"rgba(255,255,255,0.08)", top:-30, right:-10 }}/>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:13, color:"rgba(255,255,255,0.85)" }}>Today's Potential</Text>
                <Text style={{ fontFamily:fonts.black, fontSize:20, color:"#FFF", marginTop:2 }}>${earn.toFixed(2)} available</Text>
              </View>
              <View style={PS.progressCircle}>
                <Text style={{ fontFamily:fonts.black, fontSize:16, color:C.blue }}>{Math.round((done/Math.max(tasks.length,1))*100)}%</Text>
                <Text style={{ fontSize:9, color:C.blue, marginTop:1 }}>done</Text>
              </View>
            </View>
          )}

          <FilterTabBar filter={filter} onFilter={setFilter} C={C}/>

          <ScrollView contentContainerStyle={{ paddingHorizontal:16, paddingBottom:32, paddingTop:6 }} showsVerticalScrollIndicator={false}>
          {loading ? (
  <View style={{ alignItems:"center", paddingVertical:48 }}>
    <ActivityIndicator color={C.blue} size="large"/>
    <Text style={{ fontSize:13, color:C.muted, marginTop:12 }}>Loading tasks…</Text>
  </View>
) : locked ? (
  // Show fake tasks for unactivated users
  FAKE_TASKS.map(task => (
    <TaskCard key={task.id} task={task} locked={true} completedIds={[]} onStart={()=>{}} onSlotsFull={()=>{}} C={C}/>
  ))
) : sorted.length===0 ? (
  <View style={{ alignItems:"center", paddingVertical:48 }}>
    <Text style={{ fontSize:40, marginBottom:10 }}>📭</Text>
    <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark }}>No tasks found</Text>
    <Text style={{ fontSize:13, color:C.muted, marginTop:4 }}>Check back soon</Text>
  </View>
) : sorted.map(task=>(
  <TaskCard key={task.id} task={task} locked={false} completedIds={doneIds} onStart={handleStart} onSlotsFull={t=>{setSlotTask(t);setShowSlot(true);}} C={C}/>
))}
          </ScrollView>

          {locked && (
            <View style={PS.gate}>
              <View style={[PS.gateBg, { backgroundColor:(C.bg)+"F0" }]}/>
              <View style={[PS.gateCard, { backgroundColor:C.card }]}>
                <View style={{ width:60, height:60, borderRadius:30, backgroundColor:C.goldSoft, alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                  <I.Crown s={28}/>
                </View>
                <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, marginBottom:8 }}>Unlock All Tasks</Text>
                <Text style={{ fontSize:13, color:C.muted, textAlign:"center", lineHeight:20, marginBottom:22 }}>
                  Activate your account with a one-time $3.00 fee to start earning.
                </Text>
                <TouchableOpacity style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:C.gold, borderRadius:14, paddingHorizontal:28, paddingVertical:14 }} onPress={onUpgrade} activeOpacity={0.85}>
                  <I.Crown s={15} c={C.dark}/>
                  <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.dark }}>Activate · $3.00</Text>
                </TouchableOpacity>
                <Text style={{ fontSize:11, color:C.muted, marginTop:10 }}>One-time · Unlock 5 earning tasks instantly</Text>
              </View>
            </View>
          )}
        </View>
      )}

{tab==="advertise"    && <AdvertiseSection user={user} C={C}/>}
{tab==="my-campaigns" && <MyCampaignsSection user={user} C={C}/>}
{tab==="marketplace"  && <ScrollView contentContainerStyle={{ paddingBottom:40 }}><MarketplaceLocked C={C}/></ScrollView>}
      <SlotFullModal visible={showSlot} task={slotTask} onClose={()=>{setShowSlot(false);setSlotTask(null);}} C={C}/>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const PS = StyleSheet.create({
  header:        { paddingHorizontal:20, paddingTop:Platform.OS==="ios"?56:40, paddingBottom:14, borderBottomWidth:1 },
  title:         { fontFamily:fonts.black, fontSize:26, letterSpacing:-0.5 },
  subtitle:      { fontSize:13, marginTop:2 },
  tab:           { flexDirection:"row", alignItems:"center", justifyContent:"center", paddingVertical:9, borderRadius:11 },
  tabActive:     { shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.07, shadowRadius:4, elevation:2 },
  tabTxt:        { fontFamily:fonts.semibold, fontSize:12 },
  tabTxtActive:  { fontFamily:fonts.bold },
  banner:        { marginHorizontal:16, marginTop:14, marginBottom:4, borderRadius:18, padding:18, flexDirection:"row", alignItems:"center", gap:14, overflow:"hidden" },
  progressCircle:{ width:54, height:54, borderRadius:27, backgroundColor:"rgba(255,255,255,0.95)", alignItems:"center", justifyContent:"center" },
  gate:          { ...StyleSheet.absoluteFillObject, alignItems:"center", justifyContent:"center", zIndex:10, paddingHorizontal:28 },
  gateBg:        { ...StyleSheet.absoluteFillObject },
  gateCard:      { borderRadius:24, padding:28, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.12, shadowRadius:24, elevation:12, width:"100%" },
});

const TC = StyleSheet.create({
  card:        { flexDirection:"row", borderRadius:16, padding:14, marginBottom:10, shadowColor:"#0F172A", shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  avatar:      { width:44, height:44, borderRadius:13, alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:12 },
  tag:         { paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  tagTxt:      { fontSize:10, fontWeight:"700", letterSpacing:0.3 },
  actionBtn:   { borderRadius:10, paddingHorizontal:14, paddingVertical:8, alignItems:"center", justifyContent:"center", minWidth:56 },
  actionBtnTxt:{ fontSize:12, fontWeight:"700", color:"#FFF" },
  doneBtn:     { flexDirection:"row", alignItems:"center", gap:4, borderRadius:10, paddingHorizontal:10, paddingVertical:7, backgroundColor:"#F0FDF4" },
  fullBtn:     { backgroundColor:"#FFF5F5", borderRadius:10, paddingHorizontal:10, paddingVertical:7, alignItems:"center", borderWidth:1.5, borderColor:"#FECACA", minWidth:56 },
});

const FF = StyleSheet.create({
  label:     { fontSize:11, fontWeight:"600", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 },
  box:       { flexDirection:"row", alignItems:"center", borderRadius:14, borderWidth:1.5, paddingHorizontal:14 },
  nextBtn:   { borderRadius:14, height:52, alignItems:"center", justifyContent:"center" },
  nextBtnTxt:{ fontFamily:"System", fontSize:15, fontWeight:"700", color:"#FFF" },
  backBtn:   { borderRadius:14, height:52, alignItems:"center", justifyContent:"center", paddingHorizontal:20, borderWidth:1.5 },
  backBtnTxt:{ fontFamily:"System", fontSize:14, fontWeight:"600" },
});