/**
 * CommunityPopup.jsx — PromoEarn
 * Modal prompting users to join WhatsApp/Telegram community.
 * Drop this file into your Screens/ or components/ folder.
 */

import { useEffect, useRef } from "react";
import { BlurView } from "expo-blur";
import {
  Modal, View, Text, TouchableOpacity, Linking, StyleSheet, Animated,
} from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";

const BLUE  = "#1A56DB";
const GREEN = "#16A34A";
const DARK  = "#0F172A";
const WHITE = "#FFFFFF";

// Replace these with your real invite links
const WHATSAPP_LINK = "https://whatsapp.com/channel/0029VbCdoLV3wtbI99MIvv1N";
const TELEGRAM_LINK = "https://t.me/promoearnhub";

const Icon = {
  X: ({ size = 16, color = "#94A3B8" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  ChevronRight: ({ size = 16, color = WHITE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  ),
  Bubble: ({ size = 26, color = "#EF4444" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </Svg>
  ),
};

export default function CommunityPopup({ visible, onClose }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible]);

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  return (
    
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
          <BlurView intensity={40} tint="dark" style={s.overlay}>
            <View style={s.dimLayer} />
            <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon.X size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Icon.Bubble />
            </View>
            <View style={s.iconDot} />
          </View>

          <Text style={s.title}>Join the community</Text>
          <Text style={s.subtitle}>
            Connect with thousands of smart earners and get instant updates directly.
          </Text>

          <TouchableOpacity
            style={[s.linkBtn, s.whatsappBtn]}
            onPress={() => openLink(WHATSAPP_LINK)}
            activeOpacity={0.85}
          >
            <Text style={[s.linkText, { color: GREEN }]}>WhatsApp Group</Text>
            <Icon.ChevronRight color={GREEN} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.linkBtn, s.telegramBtn]}
            onPress={() => openLink(TELEGRAM_LINK)}
            activeOpacity={0.85}
          >
            <Text style={[s.linkText, { color: BLUE }]}>Telegram Channel</Text>
            <Icon.ChevronRight color={BLUE} />
          </TouchableOpacity>

          <Text style={s.footer}>Already joined over 10k+ earners</Text>
          </Animated.View>
    </BlurView>
  </Modal>
);


}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: { marginBottom: 16 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GREEN,
    borderWidth: 3,
    borderColor: WHITE,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  linkBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  whatsappBtn: { backgroundColor: "#F0FDF4" },
  telegramBtn: { backgroundColor: "#EEF4FF" },
  linkText: { fontSize: 15, fontWeight: "700" },
  footer: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 4,
  },
});
