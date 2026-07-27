import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Modal, Platform,
  StyleSheet, ScrollView, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fonts } from "../utils/typography";

const STORAGE_KEY = "pe_vtu_announcement_tracker";
const MAX_PER_DAY = 2;

const todayStr = () => new Date().toISOString().slice(0, 10);

export const shouldShowVtuAnnouncement = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const today = todayStr();
    if (!raw) return true;
    const data = JSON.parse(raw);
    if (data.date !== today) return true;
    return data.count < MAX_PER_DAY;
  } catch {
    return false;
  }
};

const recordVtuAnnouncementShown = async () => {
  try {
    const today = todayStr();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { date: today, count: 0 };
    const nextCount = data.date === today ? data.count + 1 : 1;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: nextCount }));
  } catch {}
};

// Stable, hotlink-friendly network logo icons (flaticon CDN)
const NETWORK_LOGOS = [
  { name: "MTN", uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqMbUYQhKIoiKDwimRVejdx2ADbuYPTl3PApgudTM_Kw&s=10", bg: "#FFCC00" },
  { name: "Airtel", uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTICkXqu9YQ2VAvDroBy3v_e9AkSB6Od-uEHMNDn3z4Q&s=10", bg: "#EF4444" },
  { name: "Glo", uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSerEl0hXGovm97VyIMkqb6DGF5M3VQ37rkDuMZMlniQw&s=10", bg: "#10B981" },
  { name: "9mobile", uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH3kFqYFWsakOjuQtc0cAlCUyi5S0LxMUPcVOzPGPQvA&s=10", bg: "#84CC16" },
];

// A phone/signal illustration for the hero — swap this for your own hosted art anytime
const HERO_ILLUSTRATION_URI =
  "https://cdn-icons-png.flaticon.com/512/2921/2921222.png";

export default function FeatureAnnouncementModal({
  visible,
  onClose,
  onOpenAirtime,
  onOpenData,
}) {
  useEffect(() => {
    if (visible) recordVtuAnnouncementShown();
  }, [visible]);

  const handleClose = () => onClose();

  const handleAction = (which) => {
    onClose();
    if (which === "airtime" && onOpenAirtime) onOpenAirtime();
    if (which === "data" && onOpenData) onOpenData();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <View style={s.card}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn} activeOpacity={0.8}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>✕</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={s.hero}>
            <View style={[s.blob, { backgroundColor: "#3B82F6", top: -60, left: -30, width: 200, height: 200 }]} />
            <View style={[s.blob, { backgroundColor: "#06B6D4", bottom: -40, right: -20, width: 160, height: 160, opacity: 0.5 }]} />
            <View style={[s.blob, { backgroundColor: "#F59E0B", top: -20, right: 30, width: 100, height: 100, opacity: 0.4 }]} />

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <View style={s.newBadge}>
                  <Text style={s.newBadgeTxt}>✨ NEW</Text>
                </View>
                <Text style={s.heroTitle}>Airtime & Data{"\n"}are here!</Text>
                <Text style={s.heroSub}>Top up any network instantly, right from your balance.</Text>
              </View>
              <Image
                source={{ uri: HERO_ILLUSTRATION_URI }}
                style={{ width: 84, height: 84, marginLeft: 8 }}
                resizeMode="contain"
              />
            </View>

            {/* Network logo row */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
              {NETWORK_LOGOS.map((n) => (
                <View key={n.name} style={s.netLogoWrap}>
                  <Image source={{ uri: n.uri }} style={{ width: 22, height: 22 }} resizeMode="contain" />
                </View>
              ))}
            </View>
          </View>

          {/* Perks list */}
          <ScrollView
            style={{ maxHeight: 180 }}
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18 }}
            showsVerticalScrollIndicator={false}
          >
            {[
              { icon: "⚡", title: "Instant delivery", desc: "Airtime and data land in seconds, no waiting." },
              { icon: "💸", title: "Pay from your balance", desc: "No card needed — use what you've already earned." },
              { icon: "📶", title: "All 4 major networks", desc: "MTN, Airtel, Glo and 9mobile all supported." },
            ].map((p, i) => (
              <View key={i} style={s.perkRow}>
                <View style={s.perkIcon}>
                  <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.perkTitle}>{p.title}</Text>
                  <Text style={s.perkDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTAs */}
          <View style={{ padding: 20, paddingTop: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[s.ctaBtn, { backgroundColor: "#1A56DB" }]}
                onPress={() => handleAction("airtime")}
                activeOpacity={0.85}
              >
                <Text style={s.ctaBtnTxt}>📱 Buy Airtime</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.ctaBtn, { backgroundColor: "#10B981" }]}
                onPress={() => handleAction("data")}
                activeOpacity={0.85}
              >
                <Text style={s.ctaBtnTxt}>📶 Buy Data</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={{ alignItems: "center", paddingVertical: 6 }}>
              <Text style={{ color: "#94A3B8", fontFamily: fonts.medium, fontSize: 13 }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0F172A",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: "#1E293B",
    overflow: "hidden",
    position: "relative",
  },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.35 },
  newBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  newBadgeTxt: { fontFamily: fonts.bold, fontSize: 11, color: "#FDE68A", letterSpacing: 0.5 },
  heroTitle: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 29,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    lineHeight: 19,
  },
  netLogoWrap: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  perkRow: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  perkIcon: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: "#1F2A3D",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  perkTitle: { fontFamily: fonts.bold, fontSize: 14, color: "#FFFFFF" },
  perkDesc: { fontFamily: fonts.regular, fontSize: 12, color: "#8A97AC", marginTop: 2, lineHeight: 17 },
  ctaBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ctaBtnTxt: { fontFamily: fonts.bold, fontSize: 13, color: "#FFFFFF" },
});