/**
 * PromoSpaceScreen.jsx — PromoEarn
 * 3 Tabs: Earn Tasks | Advertise | Marketplace (locked)
 * ✅ Dark/light mode via C prop (from MainApp.jsx LIGHT/DARK)
 * ✅ Slots-full state: task visible but unclickable, popup modal explains
 */

import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Platform, Alert, ActivityIndicator,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";

const BASE_URL = "http://localhost:5000/api/v1";

// Fallback colors (used only if C prop is not passed)
const DEFAULT_C = {
  blue:       "#1A56DB",
  blueSoft:   "#EEF4FF",
  dark:       "#0F172A",
  white:      "#FFFFFF",
  green:      "#10B981",
  greenSoft:  "#F0FDF4",
  gold:       "#F59E0B",
  goldSoft:   "#FFFBEB",
  red:        "#EF4444",
  purple:     "#8B5CF6",
  purpleSoft: "#F5F3FF",
  orange:     "#F97316",
  light:      "#F8FAFF",
  muted:      "#64748B",
  border:     "#E2E8F0",
  slate:      "#94A3B8",
  // Theme-aware extras (light defaults)
  bg:         "#F8FAFF",
  card:       "#FFFFFF",
  input:      "#F8FAFF",
};

const TYPE_STYLE = {
  social: { bg: "#EEF4FF", color: "#1A56DB", label: "Social"  },
  video:  { bg: "#FFF7ED", color: "#F97316", label: "Video"   },
  share:  { bg: "#F0FDF4", color: "#10B981", label: "Share"   },
  review: { bg: "#F5F3FF", color: "#8B5CF6", label: "Review"  },
  survey: { bg: "#FFFBEB", color: "#F59E0B", label: "Survey"  },
};

const TASK_TYPES = [
  { key: "likes",     label: "Likes",       icon: "👍", desc: "Get people to like your post or page" },
  { key: "followers", label: "Followers",   icon: "👥", desc: "Grow your follower count" },
  { key: "views",     label: "Views",       icon: "👁️", desc: "Increase views on your content" },
  { key: "signup",    label: "Sign Ups",    icon: "✍️", desc: "Get users to register on your platform" },
  { key: "comments",  label: "Comments",   icon: "💬", desc: "Boost engagement with comments" },
  { key: "shares",    label: "Shares",     icon: "🔁", desc: "Amplify reach through sharing" },
  { key: "downloads", label: "Downloads",  icon: "⬇️", desc: "Drive app or file downloads" },
  { key: "clicks",    label: "Link Clicks", icon: "🔗", desc: "Send traffic to your link" },
];

const PRICING = {
  likes: 0.35, followers: 0.55, views: 0.25, signup: 0.75,
  comments: 0.40, shares: 0.45, downloads: 0.65, clicks: 0.30,
};
const PLATFORM_FEE_PCT = 0.15;

const calcQuote = (taskType, slots) => {
  const s    = parseInt(slots) || 0;
  const base = (PRICING[taskType] || 0.35) * s;
  const fee  = base * PLATFORM_FEE_PCT;
  return { base, fee, total: base + fee, perUser: PRICING[taskType] || 0.35 };
};

// ── API helper ─────────────────────────────────────────────────────────────
const api = async (endpoint, options = {}) => {
  const token = await AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = {
  Check:     ({ sz = 14, cl = "#10B981" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12" /></Svg>,
  Lock:      ({ sz = 18, cl = "#64748B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>,
  Crown:     ({ sz = 18, cl = "#F59E0B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 20h20M4 20l2-8 6 4 6-4 2 8" /></Svg>,
  Store:     ({ sz = 20, cl = "#64748B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><Path d="M2 7h20" /><Path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></Svg>,
  Task:      ({ sz = 20, cl = "#1A56DB" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Svg>,
  Link:      ({ sz = 14, cl = "#64748B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>,
  Image:     ({ sz = 18, cl = "#94A3B8" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Polyline points="21 15 16 10 5 21" /></Svg>,
  Star:      ({ sz = 14, cl = "#F59E0B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg>,
  Megaphone: ({ sz = 20, cl = "#1A56DB" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m3 11 18-5v12L3 14v-3z" /><Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Svg>,
  Shield:    ({ sz = 16, cl = "#10B981" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>,
  Zap:       ({ sz = 16, cl = "#F59E0B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>,
  Users:     ({ sz = 22, cl = "#64748B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M23 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>,
  X:         ({ sz = 16, cl = "#64748B" }) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>,
};

// ── Slots-full popup modal ─────────────────────────────────────────────────
const SlotFullModal = ({ visible, task, onClose, C }) => {
  if (!visible || !task) return null;
  const slots  = task.slots  || 0;
  const filled = task.filled || 0;
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 28, alignItems: "center", width: "100%", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 14 }}>

          {/* Icon */}
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "#FFF5F5", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 32 }}>🔒</Text>
          </View>

          {/* Title */}
          <Text style={{ fontFamily: fonts.black, fontSize: 20, color: C.dark, textAlign: "center", marginBottom: 8 }}>
            Slots Filled Up
          </Text>

          {/* Task name */}
          <View style={{ backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.blue, textAlign: "center" }} numberOfLines={2}>
              {task.title}
            </Text>
          </View>

          {/* Slots counter */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20, width: "100%" }}>
            <View style={{ flex: 1, backgroundColor: "#FFF5F5", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#FECACA" }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 22, color: "#EF4444" }}>{filled}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 2 }}>Slots filled</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.muted }}>{slots}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 2 }}>Total slots</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ width: "100%", height: 8, backgroundColor: C.border, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
            <View style={{ width: "100%", height: "100%", backgroundColor: "#EF4444", borderRadius: 4 }} />
          </View>

          {/* Explanation */}
          <View style={{ backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14, marginBottom: 20, width: "100%", borderWidth: 1, borderColor: "#FDE68A" }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#92600A", marginBottom: 4 }}>
              ℹ️ What does this mean?
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#78350F", lineHeight: 20 }}>
              This task had a limited number of available spots. All {slots} slots have been filled by other users.{"\n\n"}
              New tasks are added regularly — check back soon or browse other available tasks to keep earning!
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", width: "100%" }}
            onPress={onClose} activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFFFFF" }}>Got it, browse other tasks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Task Card ──────────────────────────────────────────────────────────────
// Accepts C (theme colors) and onSlotsFull callback
const TaskCard = ({ task, locked, onStart, completedIds, C, onSlotsFull }) => {
  const ts    = TYPE_STYLE[task.type] || TYPE_STYLE.social;
  const done  = completedIds.includes(task.id) || task.status === "completed";
  const logo  = task.brand?.slice(0, 2).toUpperCase() || "PE";
  const color = task.color || C.blue;
  const [step, setStep] = useState("idle");

  // Slots-full detection: task has a slots limit AND it's been reached
  const isFull = task.slots > 0 && (task.filled || 0) >= task.slots && !done;

  const handleStart = () => {
    if (isFull) { onSlotsFull && onSlotsFull(task); return; }
    if (task.link && typeof window !== "undefined") {
      window.open(task.link, "_blank");
      setStep("opened");
    } else {
      onStart(task);
    }
  };

  const handleConfirm = () => {
    setStep("confirming");
    onStart(task, () => setStep("idle"));
  };

  return (
    <View style={[
      { flexDirection: "row", backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 10, gap: 12,
        shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
      (done || isFull) && { opacity: isFull ? 0.75 : 0.55 },
    ]}>
      <View style={[{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 }, { backgroundColor: color + "20" }]}>
        <Text style={{ fontFamily: fonts.black, fontSize: 15, color, letterSpacing: 0.5 }}>{logo}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: ts.bg }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: ts.color, letterSpacing: 0.3 }}>{ts.label}</Text>
          </View>
          {task.time && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 10, color: C.muted }}>⏱</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted }}>{task.time}</Text>
            </View>
          )}
          {/* Slots-full badge */}
          {isFull && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FECACA" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: "#EF4444" }}>FULL</Text>
            </View>
          )}
        </View>

        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark, lineHeight: 20, marginBottom: 3 }} numberOfLines={2}>{task.title}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.slate }}>{task.brand}</Text>
        {task.description ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 16 }} numberOfLines={2}>{task.description}</Text>
        ) : null}

        {/* Slot progress bar (visible when slots are set) */}
        {task.slots > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" }}>
              <View style={{
                width: `${Math.min(((task.filled || 0) / task.slots) * 100, 100)}%`,
                height: "100%",
                backgroundColor: isFull ? "#EF4444" : C.green,
                borderRadius: 2,
              }} />
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: C.muted, marginTop: 3 }}>
              {task.filled || 0} / {task.slots} slots filled
            </Text>
          </View>
        )}
      </View>

      <View style={{ alignItems: "flex-end", justifyContent: "space-between", minWidth: 72 }}>
        <Text style={{ fontFamily: fonts.extrabold, fontSize: 16, color: C.green }}>+${parseFloat(task.reward).toFixed(2)}</Text>

        {done ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.greenSoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Ico.Check sz={12} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: C.green }}>Done</Text>
          </View>
        ) : isFull ? (
          // Slots-full button — tappable to show popup
          <TouchableOpacity
            onPress={() => onSlotsFull && onSlotsFull(task)}
            activeOpacity={0.8}
            style={{ backgroundColor: "#FFF5F5", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#FECACA", minWidth: 58 }}>
            <Ico.Users sz={12} cl="#EF4444" />
            <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: "#EF4444", marginTop: 2, textAlign: "center" }}>Limit{"\n"}reached</Text>
          </TouchableOpacity>
        ) : locked ? (
          <View style={{ backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignItems: "center", justifyContent: "center", minWidth: 58 }}>
            <Ico.Lock sz={12} cl={C.white} />
          </View>
        ) : step === "idle" ? (
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignItems: "center", justifyContent: "center", minWidth: 58 }}
            onPress={handleStart} activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#FFFFFF" }}>Start</Text>
          </TouchableOpacity>
        ) : step === "opened" ? (
          <TouchableOpacity
            style={{ backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, alignItems: "center", justifyContent: "center" }}
            onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: "#FFFFFF" }}>Done?</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ backgroundColor: C.muted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignItems: "center", justifyContent: "center", minWidth: 58 }}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </View>
    </View>
  );
};

// ── Filter Chip ────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress, C }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}
    style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
      active && { backgroundColor: C.blue, borderColor: C.blue }]}>
    <Text style={[{ fontFamily: fonts.semibold, fontSize: 12, color: C.muted },
      active && { color: "#FFFFFF" }]}>{label}</Text>
  </TouchableOpacity>
);

// ── Form Field Helper ──────────────────────────────────────────────────────
const FormField = ({ label, placeholder, value, onChange, numeric, icon, multiline, hint, C }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</Text>
    <View style={[{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: multiline ? 12 : 0 },
      !multiline && { height: 50 }]}>
      {icon && <View style={{ marginRight: 8, marginTop: multiline ? 2 : 0 }}>{icon}</View>}
      <TextInput
        style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: C.dark, minHeight: multiline ? 80 : undefined, textAlignVertical: multiline ? "top" : "center" }}
        placeholder={placeholder}
        placeholderTextColor={C.slate}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        multiline={multiline}
      />
    </View>
    {hint ? <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 5 }}>{hint}</Text> : null}
  </View>
);

// ── Campaign Payment Modal ─────────────────────────────────────────────────
const CampaignPaymentModal = ({ visible, campaign, quote, onPay, onClose, paying, C }) => {
  if (!visible || !campaign) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.dark, letterSpacing: -0.5 }}>Campaign Quote</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4 }}>Review your pricing before launching</Text>
          </View>
          <View style={{ marginHorizontal: 20, backgroundColor: C.bg, borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 14, color: "#FFFFFF" }}>{campaign.brandName?.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }}>{campaign.brandName}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
                {TASK_TYPES.find(t => t.key === campaign.taskType)?.icon}{" "}
                {TASK_TYPES.find(t => t.key === campaign.taskType)?.label} · {campaign.slots} slots
              </Text>
            </View>
          </View>
          <View style={{ marginHorizontal: 20, backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark, marginBottom: 14 }}>Pricing Breakdown</Text>
            {[
              { lbl: `Base cost (${campaign.slots} slots × $${quote?.perUser?.toFixed(2)}/user)`, val: `$${quote?.base?.toFixed(2)}` },
              { lbl: "Platform fee (15%)", val: `$${quote?.fee?.toFixed(2)}`, muted: true },
            ].map((r, i) => (
              <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: r.muted ? C.muted : C.dark, flex: 1 }}>{r.lbl}</Text>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: r.muted ? C.muted : C.dark }}>{r.val}</Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>Total Due</Text>
              <Text style={{ fontFamily: fonts.extrabold, fontSize: 18, color: C.blue }}>${quote?.total?.toFixed(2)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 20 }}>
            {[
              { icon: <Ico.Shield sz={13} />, txt: "Secured by Paystack" },
              { icon: <Ico.Zap sz={13} />,   txt: "Goes live in 24h"    },
              { icon: <Ico.Check sz={13} />,  txt: "Refundable if rejected" },
            ].map((b, i) => (
              <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 }}>
                {b.icon}
                <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: C.muted, flex: 1 }} numberOfLines={2}>{b.txt}</Text>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            <TouchableOpacity style={[{ backgroundColor: "#00C3F7", borderRadius: 16, height: 56, alignItems: "center", justifyContent: "center" }, paying && { opacity: 0.7 }]}
              onPress={onPay} disabled={paying} activeOpacity={0.85}>
              {paying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#FFFFFF" }}>💳 Pay ${quote?.total?.toFixed(2)} with Paystack</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: C.bg, borderRadius: 16, height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.border }}
              onPress={onClose} activeOpacity={0.8}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.muted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Advertise Section ──────────────────────────────────────────────────────
function AdvertiseSection({ user, C }) {
  const [form, setForm] = useState({
    brandName: "", taskType: "", targetCount: "", slots: "",
    pageLink: "", description: "", mediaNote: "", budget: "",
    contactEmail: user?.email || "",
  });
  const [step,        setStep]        = useState(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [selectedType,setSelectedType]= useState(null);
  const [campaignId,  setCampaignId]  = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const quote = selectedType && form.slots ? calcQuote(selectedType, form.slots) : null;

  const handleSubmit = async () => {
    if (!form.brandName || !selectedType || !form.pageLink || !form.slots || !form.contactEmail) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api("/campaigns/submit", {
        method: "POST",
        body: {
          brandName: form.brandName, taskType: selectedType,
          targetCount: parseInt(form.targetCount) || 0,
          slots: parseInt(form.slots), pageLink: form.pageLink,
          description: form.description, mediaNote: form.mediaNote,
          contactEmail: form.contactEmail,
          quotedTotal: quote?.total, quotedPerUser: quote?.perUser,
          status: "pending_payment", submittedBy: user?.uid,
        },
      });
      if (res.success) { setCampaignId(res.data.campaignId); setSubmitted(true); setShowPayment(true); }
      else Alert.alert("Error", res.message || "Failed to submit campaign.");
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await api("/campaigns/create-payment", {
        method: "POST",
        body: { campaignId, amount: quote?.total, email: form.contactEmail, userId: user?.uid },
      });
      if (res.data?.url) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pe_campaign_ref", res.data.reference);
          localStorage.setItem("pe_campaign_id", campaignId);
        }
        if (typeof window !== "undefined") window.location.href = res.data.url;
        else Alert.alert("Redirect", "Opening payment page...");
      } else Alert.alert("Error", res.message || "Could not start payment.");
    } catch { Alert.alert("Error", "Payment initiation failed."); }
    finally { setPaying(false); }
  };

  const resetForm = () => {
    setForm({ brandName: "", taskType: "", targetCount: "", slots: "", pageLink: "", description: "", mediaNote: "", budget: "", contactEmail: user?.email || "" });
    setStep(1); setSelectedType(null); setSubmitted(false);
    setCampaignId(null); setShowPayment(false); setPaymentDone(false);
  };

  if (paymentDone) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 42 }}>🚀</Text>
        </View>
        <Text style={{ fontFamily: fonts.black, fontSize: 24, color: C.dark, textAlign: "center", marginBottom: 10 }}>Campaign Live!</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          Payment confirmed. Your campaign is under review and will go live within 24 hours.
        </Text>
        <TouchableOpacity style={{ backgroundColor: C.blue, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 }} onPress={resetForm} activeOpacity={0.85}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFFFFF" }}>Start New Campaign</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const StepDot = ({ n }) => (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: step >= n ? C.blue : C.border, alignItems: "center", justifyContent: "center" }}>
        {step > n
          ? <Ico.Check sz={14} cl="#FFFFFF" />
          : <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: step >= n ? "#FFFFFF" : C.muted }}>{n}</Text>
        }
      </View>
    </View>
  );

  const sectionLbl = { fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 };
  const nextBtn    = { backgroundColor: C.blue, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" };
  const nextBtnTxt = { fontFamily: fonts.bold, fontSize: 15, color: "#FFFFFF" };
  const backBtn    = { backgroundColor: C.bg, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, borderWidth: 1.5, borderColor: C.border };
  const backBtnTxt = { fontFamily: fonts.semibold, fontSize: 14, color: C.muted };

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 20, marginTop: 8 }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.dark, letterSpacing: -0.5 }}>Advertise With Us</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4 }}>Reach thousands of active PromoEarn users.</Text>
        </View>

        {/* Stats banner */}
        <View style={{ backgroundColor: C.dark, borderRadius: 20, padding: 20, marginBottom: 24, overflow: "hidden", flexDirection: "row" }}>
          <View style={{ position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: C.blue, opacity: 0.15, top: -40, right: -30 }} />
          {[{ val: "10K+", lbl: "Active Users" }, { val: "95%", lbl: "Task Rate" }, { val: "24h", lbl: "Go Live" }].map((s, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.1)" }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 22, color: "#FFFFFF", letterSpacing: -0.5 }}>{s.val}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          {[1, 2, 3].map((n, i) => (
            <View key={n} style={{ flexDirection: "row", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
              <StepDot n={n} />
              {i < 2 && <View style={{ flex: 1, height: 2, backgroundColor: step > n ? C.blue : C.border, marginHorizontal: 4 }} />}
            </View>
          ))}
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: C.blue }}>
              Step {step} of 3 — {step === 1 ? "Campaign Details" : step === 2 ? "Platform & Links" : "Review & Pay"}
            </Text>
          </View>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View>
            <FormField label="Brand / Product Name *" placeholder="e.g. MyApp, Nike" value={form.brandName} onChange={v => set("brandName", v)} C={C} />
            <FormField label="Contact Email *" placeholder="you@email.com" value={form.contactEmail} onChange={v => set("contactEmail", v)} hint="We'll send your quote and campaign updates here" C={C} />

            <Text style={sectionLbl}>What do you want users to do? *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {TASK_TYPES.map(t => (
                <TouchableOpacity key={t.key} onPress={() => { setSelectedType(t.key); set("taskType", t.key); }} activeOpacity={0.8}
                  style={[{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: C.border },
                    selectedType === t.key && { borderColor: C.blue, backgroundColor: C.blueSoft }]}>
                  <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                  <Text style={[{ fontFamily: fonts.medium, fontSize: 13, color: C.muted }, selectedType === t.key && { color: C.blue, fontFamily: fonts.bold }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedType && (
              <View style={{ backgroundColor: C.blueSoft, borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 20 }}>{TASK_TYPES.find(t => t.key === selectedType)?.icon}</Text>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.blue, flex: 1 }}>{TASK_TYPES.find(t => t.key === selectedType)?.desc}</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}><FormField label="Target Count" placeholder="e.g. 500" value={form.targetCount} onChange={v => set("targetCount", v)} numeric hint="Goal (likes, views, etc.)" C={C} /></View>
              <View style={{ flex: 1 }}><FormField label="No. of Slots *" placeholder="e.g. 100" value={form.slots} onChange={v => set("slots", v)} numeric hint="Users who will do the task" C={C} /></View>
            </View>

            {/* Live pricing */}
            {quote && (
              <View style={{ backgroundColor: C.goldSoft, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: "#FDE68A" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Ico.Zap sz={16} />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.dark }}>Instant Pricing Preview</Text>
                </View>
                {[
                  { lbl: `${form.slots} slots × $${quote.perUser.toFixed(2)}/user`, val: `$${quote.base.toFixed(2)}` },
                  { lbl: "Platform fee (15%)", val: `$${quote.fee.toFixed(2)}` },
                ].map((r, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted }}>{r.lbl}</Text>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: C.dark }}>{r.val}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: "#FDE68A", marginVertical: 8 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }}>Total</Text>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 16, color: C.blue }}>${quote.total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={[nextBtn, (!form.brandName || !selectedType || !form.slots || !form.contactEmail) && { opacity: 0.5 }]}
              onPress={() => { if (form.brandName && selectedType && form.slots && form.contactEmail) setStep(2); }} activeOpacity={0.85}>
              <Text style={nextBtnTxt}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View>
            <FormField label="Link to your page / post *" placeholder="https://instagram.com/yourbrand" value={form.pageLink} onChange={v => set("pageLink", v)} icon={<Ico.Link sz={14} cl={C.muted} />} C={C} />
            <FormField label="Campaign Description" placeholder="Describe what users should do..." value={form.description} onChange={v => set("description", v)} multiline C={C} />
            <Text style={sectionLbl}>Media (optional)</Text>
            <TouchableOpacity style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 2, borderColor: C.border, borderStyle: "dashed", padding: 24, alignItems: "center", gap: 8, marginBottom: 16 }}
              activeOpacity={0.8} onPress={() => Alert.alert("Coming Soon", "Media upload will be available soon.")}>
              <Ico.Image sz={28} cl={C.slate} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.muted }}>Upload Image or Video</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.slate }}>JPG, PNG, MP4 · Max 10MB</Text>
            </TouchableOpacity>
            <FormField label="Additional Notes" placeholder="Any special requirements..." value={form.mediaNote} onChange={v => set("mediaNote", v)} multiline C={C} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              <TouchableOpacity style={backBtn} onPress={() => setStep(1)} activeOpacity={0.8}><Text style={backBtnTxt}>← Back</Text></TouchableOpacity>
              <TouchableOpacity style={[nextBtn, { flex: 1 }, !form.pageLink && { opacity: 0.5 }]} onPress={() => { if (form.pageLink) setStep(3); }} activeOpacity={0.85}>
                <Text style={nextBtnTxt}>Review →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View>
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: C.dark, marginBottom: 16 }}>Campaign Summary</Text>
              {[
                { lbl: "Brand", val: form.brandName },
                { lbl: "Task Type", val: TASK_TYPES.find(t => t.key === selectedType)?.label || "—" },
                { lbl: "Target Count", val: form.targetCount || "Not specified" },
                { lbl: "Slots", val: form.slots || "—" },
                { lbl: "Page Link", val: form.pageLink },
                { lbl: "Contact", val: form.contactEmail },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: C.border }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted }}>{row.lbl}</Text>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, flex: 1, textAlign: "right", marginLeft: 12 }} numberOfLines={1}>{row.val}</Text>
                </View>
              ))}
            </View>
            {quote && (
              <View style={{ backgroundColor: C.blueSoft, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: "#BFDBFE" }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark, marginBottom: 12 }}>💳 Payment Due</Text>
                {[
                  { lbl: `${form.slots} slots × $${quote.perUser.toFixed(2)}/user`, val: `$${quote.base.toFixed(2)}` },
                  { lbl: "Platform fee (15%)", val: `$${quote.fee.toFixed(2)}` },
                ].map((r, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted }}>{r.lbl}</Text>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark }}>{r.val}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: "#BFDBFE", marginVertical: 10 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>Total</Text>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 20, color: C.blue }}>${quote.total.toFixed(2)}</Text>
                </View>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 8 }}>Refundable if rejected · Goes live within 24h after payment</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={backBtn} onPress={() => setStep(2)} activeOpacity={0.8}><Text style={backBtnTxt}>← Back</Text></TouchableOpacity>
              <TouchableOpacity style={[nextBtn, { flex: 1, backgroundColor: C.green }, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={nextBtnTxt}>🚀 Submit & Pay</Text>}
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, textAlign: "center", marginTop: 12 }}>By submitting you agree to our advertising terms</Text>
          </View>
        )}
      </ScrollView>

      <CampaignPaymentModal
        visible={showPayment}
        campaign={{ ...form, taskType: selectedType }}
        quote={quote}
        onPay={handlePay}
        onClose={() => setShowPayment(false)}
        paying={paying}
        C={C}
      />
    </>
  );
}

// ── Marketplace Locked ─────────────────────────────────────────────────────
function MarketplaceLocked({ C }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, paddingTop: 40 }}>
      <View style={{ width: "100%", borderRadius: 20, overflow: "hidden", marginBottom: 32, opacity: 0.35 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 8, flexDirection: "row", gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.border }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ width: "70%", height: 12, backgroundColor: C.border, borderRadius: 6 }} />
              <View style={{ width: "50%", height: 10, backgroundColor: C.border, borderRadius: 6 }} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.dark, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Ico.Lock sz={32} cl="#FFFFFF" />
      </View>
      <Text style={{ fontFamily: fonts.black, fontSize: 24, color: C.dark, textAlign: "center", letterSpacing: -0.5, marginBottom: 10 }}>Marketplace</Text>
      <View style={{ backgroundColor: "#FFF3CD", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#92600A" }}>🚧 Coming Soon</Text>
      </View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
        The PromoEarn Marketplace is our next big feature — a full ecosystem where brands and creators connect.
      </Text>
      <View style={{ width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark, marginBottom: 14 }}>What's Coming</Text>
        {[
          { icon: "🛍️", text: "Buy & sell promotional services"   },
          { icon: "🤝", text: "Direct brand-creator collaboration" },
          { icon: "📊", text: "Analytics & performance tracking"   },
          { icon: "💎", text: "Premium verified brand badges"      },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted, flex: 1 }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function PromoSpaceScreen({ user, setUser, onUpgrade, C: CProp, language, t }) {
  // Use passed C (from MainApp dark/light) or fall back to defaults
  const C = CProp || DEFAULT_C;

  const [activeTab,     setActiveTab]     = useState("tasks");
  const [filter,        setFilter]        = useState("all");
  const [tasks,         setTasks]         = useState([]);
  const [completedIds,  setCompletedIds]  = useState([]);
  const [loadingTasks,  setLoadingTasks]  = useState(true);
  // Slots-full modal state
  const [slotFullTask,  setSlotFullTask]  = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);

  const locked  = !(user?.isActivated || user?.isAdmin);
  const FILTERS = ["all", "social", "video", "share", "review", "survey"];

  useEffect(() => {
    fetchTasks();
    loadCompletedIds();
  }, []);

  const loadCompletedIds = () => {
    try {
      const stored = localStorage.getItem(`pe_completed_${user?.uid}`);
      if (stored) setCompletedIds(JSON.parse(stored));
    } catch {}
  };

  const saveCompletedId = (id) => {
    try {
      const key     = `pe_completed_${user?.uid}`;
      const stored  = localStorage.getItem(key);
      const current = stored ? JSON.parse(stored) : [];
      const updated = [...new Set([...current, id])];
      localStorage.setItem(key, JSON.stringify(updated));
      setCompletedIds(updated);
    } catch {}
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api("/tasks");
      if (res.success) setTasks(res.data.tasks);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleStart = async (task, onDone) => {
    try {
      const res = await api(`/tasks/${task.id}/complete`, { method: "POST" });
      if (res.success) {
        saveCompletedId(task.id);
        const userRes = await AuthService.getMe();
        if (userRes.success && setUser) setUser(userRes.data.user);
        Alert.alert("🎉 Task Complete!", `+$${parseFloat(task.reward).toFixed(2)} added to your balance!`);
      } else {
        Alert.alert("Oops", res.message || "Failed to complete task.");
      }
    } catch {
      Alert.alert("Error", "Failed to complete task.");
    } finally {
      if (onDone) onDone();
    }
  };

  const handleSlotsFull = (task) => {
    setSlotFullTask(task);
    setShowSlotModal(true);
  };

  const filtered      = filter === "all" ? tasks : tasks.filter(task => task.type === filter);
  const totalEarnable = tasks.reduce((s, task) => s + parseFloat(task.reward || 0), 0);
  const doneCount     = tasks.filter(task => completedIds.includes(task.id)).length;

  // Sort: available → slots-full → completed (slots-full stays visible but at bottom before done)
  const sortedTasks = [
    ...filtered.filter(task => !completedIds.includes(task.id) && !(task.slots > 0 && (task.filled || 0) >= task.slots)),
    ...filtered.filter(task => !completedIds.includes(task.id) && task.slots > 0 && (task.filled || 0) >= task.slots),
    ...filtered.filter(task => completedIds.includes(task.id)),
  ];

  const TABS = [
    { key: "tasks",       label: t ? t("earn") : "Earn",         icon: <Ico.Task      sz={15} cl={activeTab === "tasks"       ? C.blue : C.muted} /> },
    { key: "advertise",   label: t ? t("advertise") : "Advertise", icon: <Ico.Megaphone sz={15} cl={activeTab === "advertise"   ? C.blue : C.muted} /> },
    { key: "marketplace", label: t ? t("marketplace") : "Marketplace", icon: <Ico.Store sz={15} cl={activeTab === "marketplace" ? C.blue : C.muted} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg || C.light }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontFamily: fonts.black, fontSize: 26, color: C.dark, letterSpacing: -0.5 }}>PromoSpace</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 2 }}>
              {t ? `${t("earn")} · ${t("advertise")} · Grow` : "Earn · Advertise · Grow"}
            </Text>
          </View>
          {!locked && activeTab === "tasks" && (
            <View style={{ backgroundColor: C.greenSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 16, color: C.green }}>{doneCount}/{tasks.length}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: C.green }}>{t ? t("completed") : "Completed"}</Text>
            </View>
          )}
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: "row", backgroundColor: C.bg || C.light, borderRadius: 14, padding: 3, marginTop: 16 }}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}
              style={[{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 11 },
                activeTab === tab.key && { backgroundColor: C.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
              {tab.icon}
              <Text style={[{ fontFamily: fonts.semibold, fontSize: 12, color: C.muted },
                activeTab === tab.key && { fontFamily: fonts.bold, color: C.dark }]}>{tab.label}</Text>
              {tab.key === "marketplace" && (
                <View style={{ backgroundColor: C.gold, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 8, color: "#FFFFFF" }}>SOON</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── EARN TASKS TAB ── */}
      {activeTab === "tasks" && (
        <View style={{ flex: 1 }}>
          {!locked && (
            <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: C.blue, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" }}>
              <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.08)", top: -30, right: -10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#FFFFFF" }}>{t ? t("todayPotential") : "Today's Potential"}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                  {t ? t("earnUpTo") : "Earn up to"} <Text style={{ fontFamily: fonts.bold, color: "#FFFFFF" }}>${totalEarnable.toFixed(2)}</Text> {t ? t("completing") : "completing all tasks"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.black, fontSize: 22, color: "#FFFFFF" }}>{Math.round((doneCount / Math.max(tasks.length, 1)) * 100)}%</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{t ? t("done") : "done"}</Text>
              </View>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
            {FILTERS.map(f => (
              <FilterChip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onPress={() => setFilter(f)} C={C} />
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {loadingTasks ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <ActivityIndicator color={C.blue} size="large" />
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 12 }}>
                  {t ? t("loadingTasks") : "Loading tasks..."}
                </Text>
              </View>
            ) : sortedTasks.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: C.dark }}>{t ? t("noTasksFound") : "No tasks found"}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4 }}>{t ? t("checkBackLater") : "Check back later for new tasks"}</Text>
              </View>
            ) : (
              sortedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  locked={locked}
                  completedIds={completedIds}
                  onStart={handleStart}
                  onSlotsFull={handleSlotsFull}
                  C={C}
                />
              ))
            )}
          </ScrollView>

          {/* Gate overlay for locked users */}
          {locked && (
            <View style={{ ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 10, paddingHorizontal: 28 }}>
              <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: (C.bg || "#F8FAFF") + "EF" }} />
              <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 28, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12, width: "100%" }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.goldSoft, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Ico.Crown sz={28} />
                </View>
                <Text style={{ fontFamily: fonts.black, fontSize: 20, color: C.dark, marginBottom: 8 }}>
                  {t ? t("unlockAllTasks") : "Unlock All Tasks"}
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 22 }}>
                  {t ? t("unlockSubtitle") : "Activate your account with a one-time $3.00 fee to access all earning tasks."}
                </Text>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
                  onPress={onUpgrade} activeOpacity={0.85}>
                  <Ico.Crown sz={15} cl={C.dark} />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>{t ? t("activate") : "Activate · $3.00"}</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 10 }}>
                  {t ? t("oneTimeFee") : "One-time · $0.33 welcome bonus"}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── ADVERTISE TAB ── */}
      {activeTab === "advertise" && <AdvertiseSection user={user} C={C} />}

      {/* ── MARKETPLACE TAB ── */}
      {activeTab === "marketplace" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <MarketplaceLocked C={C} />
        </ScrollView>
      )}

      {/* ── Slots-full popup ── */}
      <SlotFullModal
        visible={showSlotModal}
        task={slotFullTask}
        onClose={() => { setShowSlotModal(false); setSlotFullTask(null); }}
        C={C}
      />
    </View>
  );
}