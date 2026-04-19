/**
 * HelpFeedbackScreen.jsx — PromoEarn
 * Help & Feedback modal with: Help Centre, Contact Us,
 * Send Feedback, Terms & Privacy, Report a Problem, About
 */

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Platform,
  Alert, Linking,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { fonts } from "../utils/typography";

const C = {
  blue:   "#1A56DB",
  dark:   "#0F172A",
  white:  "#FFFFFF",
  green:  "#10B981",
  gold:   "#F59E0B",
  red:    "#EF4444",
  light:  "#F8FAFF",
  muted:  "#64748B",
  border: "#E2E8F0",
  slate:  "#94A3B8",
};

const APP_VERSION = "1.0.0";
const SUPPORT_EMAIL = "support@promoearn.com";
const TERMS_URL = "https://promoearn.com/terms";
const PRIVACY_URL = "https://promoearn.com/privacy";

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = {
  Help:      ({sz=20,cl=C.blue})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  Chat:      ({sz=20,cl=C.green})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>,
  Feedback:  ({sz=20,cl=C.gold})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  Shield:    ({sz=20,cl=C.blue})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
  Flag:      ({sz=20,cl=C.red})    => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><Line x1="4" y1="22" x2="4" y2="15"/></Svg>,
  Info:      ({sz=20,cl=C.muted})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="8" x2="12" y2="12"/><Line x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  ArrowLeft: ({sz=20,cl=C.dark})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>,
  ChevRight: ({sz=16,cl=C.border}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6"/></Svg>,
  Star:      ({sz=20,cl=C.gold})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>,
  StarEmpty: ({sz=20,cl=C.slate})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>,
  Mail:      ({sz=20,cl=C.blue})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="4" width="20" height="16" rx="2"/><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Svg>,
  External:  ({sz=14,cl=C.slate})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><Polyline points="15 3 21 3 21 9"/><Line x1="10" y1="14" x2="21" y2="3"/></Svg>,
  WhatsApp:  ({sz=20,cl="#25D366"})=> <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl}><Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></Svg>,
};

// ── FAQ Data ──────────────────────────────────────────────────────────────
const FAQS = [
  {
    category: "Getting Started",
    items: [
      { q: "How do I activate my account?", a: "Pay a one-time $3.00 registration fee via Paystack. After payment, your account is instantly activated and you receive a $0.33 welcome bonus." },
      { q: "What is the welcome bonus?", a: "All new users who activate their account receive a $0.33 welcome bonus automatically added to their balance." },
      { q: "How do I refer friends?", a: "Share your referral code (your username with @) with friends. When they sign up using your code and activate their account, you earn $1.00 instantly." },
    ],
  },
  {
    category: "Tasks & Earning",
    items: [
      { q: "How do I complete a task?", a: "Tap 'Start' on any task, complete the required action on the linked page, then come back and tap 'Done?' to confirm completion and receive your reward." },
      { q: "Why is my task showing as locked?", a: "Tasks are locked until you activate your account. Pay the $3.00 one-time fee to unlock all tasks and earning features." },
      { q: "How much can I earn per task?", a: "Each task pays $0.17. The first 2 tasks bonus adds $0.33 total. You can complete multiple tasks daily to maximize earnings." },
    ],
  },
  {
    category: "Withdrawals",
    items: [
      { q: "What is the minimum withdrawal?", a: "The minimum withdrawal amount is $3.50 (₦5,250). You must have at least this amount in your balance to request a withdrawal." },
      { q: "How long does withdrawal take?", a: "Withdrawals are processed within 24–48 hours after admin approval. You'll be notified once your withdrawal is approved or rejected." },
      { q: "Which bank accounts are supported?", a: "We support all Nigerian bank accounts. Make sure to enter your account number, bank name, and account name correctly when requesting a withdrawal." },
    ],
  },
  {
    category: "Account",
    items: [
      { q: "Can I change my username?", a: "Yes! Go to Profile → Account Settings → Change Username. Your referral code will also update to match your new username." },
      { q: "What happens if I forget my password?", a: "Use the 'Forgot Password' option on the login screen to reset your password via your registered email address." },
      { q: "Can I have multiple accounts?", a: "No. Each person is allowed only one PromoEarn account. Multiple accounts may result in permanent bans." },
    ],
  },
];

// ── Sub-screens ────────────────────────────────────────────────────────────

function HelpCentreScreen({ onBack }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="Help Centre" subtitle="Find answers to common questions" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {FAQS.map((section, si) => (
          <View key={si} style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 20, paddingVertical: 12 }}>
              {section.category}
            </Text>
            <View style={{ backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const open = expanded === key;
                return (
                  <View key={ii}>
                    <TouchableOpacity
                      onPress={() => setExpanded(open ? null : key)}
                      activeOpacity={0.7}
                      style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 }, ii < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                      <Text style={{ flex: 1, fontFamily: open ? fonts.bold : fonts.medium, fontSize: 14, color: open ? C.blue : C.dark, lineHeight: 20 }}>
                        {item.q}
                      </Text>
                      <Text style={{ color: C.slate, fontSize: 18, transform: [{ rotate: open ? "90deg" : "0deg" }] }}>›</Text>
                    </TouchableOpacity>
                    {open && (
                      <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 4, backgroundColor: "#F8FAFF", borderBottomWidth: 1, borderBottomColor: C.border }}>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 22 }}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: C.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark, marginBottom: 6 }}>Still need help?</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Can't find what you're looking for? Contact our support team directly.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 12, height: 46, alignItems: "center", justifyContent: "center" }}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.white }}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ContactUsScreen({ onBack }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="Contact Us" subtitle="We're here to help" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Response time banner */}
        <View style={{ backgroundColor: "#EEF4FF", borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Ico.Chat sz={22} cl={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }}>Quick Support</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
              We typically respond within 24 hours
            </Text>
          </View>
        </View>

        {/* Contact options */}
        {[
          {
            icon: <Ico.Mail sz={22} cl={C.blue} />,
            bg: "#EEF4FF",
            title: "Email Support",
            desc: SUPPORT_EMAIL,
            sub: "Best for detailed questions",
            onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PromoEarn Support Request`),
          },
          {
            icon: <Ico.WhatsApp sz={22} />,
            bg: "#F0FDF4",
            title: "WhatsApp Support",
            desc: "+234 000 000 0000",
            sub: "Mon–Fri, 9am–6pm WAT",
            onPress: () => Linking.openURL("https://wa.me/234000000000"),
          },
          {
            icon: <Ico.Chat sz={22} cl={C.gold} />,
            bg: "#FFFBEB",
            title: "In-App Chat",
            desc: "Chat with our support team",
            sub: "Coming soon",
            onPress: () => Alert.alert("Coming Soon", "In-app chat will be available in the next update."),
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.onPress}
            activeOpacity={0.8}
            style={{ backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: C.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
              {item.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>{item.title}</Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.blue, marginTop: 2 }}>{item.desc}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 1 }}>{item.sub}</Text>
            </View>
            <Ico.ChevRight />
          </TouchableOpacity>
        ))}

        <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 20, marginTop: 8, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark, marginBottom: 4 }}>Business Hours</Text>
          {[
            { day: "Monday – Friday", time: "9:00 AM – 6:00 PM WAT" },
            { day: "Saturday",        time: "10:00 AM – 2:00 PM WAT" },
            { day: "Sunday",          time: "Closed" },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.border }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted }}>{row.day}</Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: row.time === "Closed" ? C.red : C.dark }}>{row.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SendFeedbackScreen({ onBack }) {
  const [rating,   setRating]   = useState(0);
  const [category, setCategory] = useState("");
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  const CATEGORIES = ["Bug Report", "Feature Request", "UI/UX", "Performance", "Other"];

  const handleSend = async () => {
    if (rating === 0) { Alert.alert("Please rate your experience"); return; }
    if (!message.trim()) { Alert.alert("Please enter your feedback message"); return; }
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.light }}>
        <SubHeader title="Send Feedback" onBack={onBack} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
          </View>
          <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.dark, textAlign: "center", marginBottom: 10 }}>Thank You!</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
            Your feedback has been received. We read every message and use it to improve PromoEarn.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
            onPress={() => { setSent(false); setRating(0); setCategory(""); setMessage(""); }}
            activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>Send More Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="Send Feedback" subtitle="Help us improve PromoEarn" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Rating */}
        <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark, marginBottom: 6 }}>Rate your experience</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginBottom: 16 }}>How are you finding PromoEarn so far?</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
                {star <= rating ? <Ico.Star sz={36} cl={C.gold} /> : <Ico.StarEmpty sz={36} />}
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.gold, marginTop: 10 }}>
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </Text>
          )}
        </View>

        {/* Category */}
        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Feedback Category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              activeOpacity={0.8}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                backgroundColor: category === cat ? C.blue : C.white,
                borderColor: category === cat ? C.blue : C.border }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: category === cat ? C.white : C.muted }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Your Message *
        </Text>
        <View style={{ backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, marginBottom: 20 }}>
          <TextInput
            style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark, minHeight: 120, textAlignVertical: "top" }}
            placeholder="Tell us what you think, what's broken, or what you'd love to see..."
            placeholderTextColor="#CBD5E1"
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <TouchableOpacity
          style={{ backgroundColor: C.blue, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", opacity: sending ? 0.7 : 1 }}
          onPress={handleSend} disabled={sending} activeOpacity={0.85}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>
            {sending ? "Sending..." : "Send Feedback"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function TermsPrivacyScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("terms");

  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="Terms & Privacy" onBack={onBack} />

      {/* Tab switcher */}
      <View style={{ flexDirection: "row", backgroundColor: C.border, borderRadius: 12, margin: 16, padding: 3 }}>
        {["terms", "privacy"].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
            style={[{ flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 9 },
              activeTab === tab && { backgroundColor: C.white }]}>
            <Text style={[{ fontFamily: fonts.semibold, fontSize: 13, color: C.muted },
              activeTab === tab && { fontFamily: fonts.bold, color: C.dark }]}>
              {tab === "terms" ? "Terms of Service" : "Privacy Policy"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginBottom: 16 }}>
          Last updated: April 2026
        </Text>

        {activeTab === "terms" ? (
          <>
            {[
              { title: "1. Acceptance of Terms", body: "By creating a PromoEarn account, you agree to these Terms of Service. If you do not agree, please do not use our platform." },
              { title: "2. Account Registration", body: "You must provide accurate information when registering. A one-time $3.00 activation fee is required to access earning features. Each person may only hold one account." },
              { title: "3. Earning Tasks", body: "Tasks must be completed genuinely. Any attempt to cheat, use bots, or manipulate the system will result in immediate account termination and forfeiture of earnings." },
              { title: "4. Referral Program", body: "Referral bonuses are paid only when a referred user genuinely activates their account. Self-referrals or fraudulent referrals are prohibited." },
              { title: "5. Withdrawals", body: "Withdrawals are subject to a minimum threshold of $3.50. PromoEarn reserves the right to review withdrawal requests and may delay or deny withdrawals suspected of fraud." },
              { title: "6. Termination", body: "We reserve the right to suspend or terminate accounts that violate these terms, engage in fraud, or abuse the platform in any way." },
              { title: "7. Changes to Terms", body: "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms." },
            ].map((section, i) => (
              <View key={i} style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark, marginBottom: 8 }}>{section.title}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 22 }}>{section.body}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            {[
              { title: "Information We Collect", body: "We collect information you provide when registering (name, email, phone), usage data, and payment information processed securely through Paystack." },
              { title: "How We Use Your Data", body: "Your data is used to operate the platform, process payments, prevent fraud, and improve our services. We never sell your personal data to third parties." },
              { title: "Data Security", body: "All data is encrypted in transit and at rest. Passwords are hashed and never stored in plain text. We use Firebase with enterprise-grade security." },
              { title: "Cookies & Analytics", body: "We use minimal analytics to understand how the app is used and improve the experience. No advertising cookies or third-party tracking are used." },
              { title: "Your Rights", body: "You have the right to access, correct, or delete your personal data. Contact support@promoearn.com to exercise these rights." },
              { title: "Data Retention", body: "We retain your data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days." },
              { title: "Contact", body: "For privacy concerns, email us at support@promoearn.com. We will respond within 5 business days." },
            ].map((section, i) => (
              <View key={i} style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark, marginBottom: 8 }}>{section.title}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 22 }}>{section.body}</Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          onPress={() => Linking.openURL(activeTab === "terms" ? TERMS_URL : PRIVACY_URL)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
          activeOpacity={0.7}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.blue }}>
            View full {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"} online
          </Text>
          <Ico.External sz={14} cl={C.blue} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ReportProblemScreen({ onBack }) {
  const [type,     setType]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  const TYPES = [
    "App crash / freeze",
    "Payment issue",
    "Task not crediting",
    "Login problem",
    "Withdrawal issue",
    "Wrong balance",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!type) { Alert.alert("Please select a problem type"); return; }
    if (!desc.trim()) { Alert.alert("Please describe the problem"); return; }
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.light }}>
        <SubHeader title="Report a Problem" onBack={onBack} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF4FF", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>
          <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.dark, textAlign: "center", marginBottom: 10 }}>Report Submitted</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
            We've received your report and will investigate it. You may receive a follow-up email if we need more information.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
            onPress={onBack} activeOpacity={0.85}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="Report a Problem" subtitle="Tell us what went wrong" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Problem Type *
        </Text>
        <View style={{ backgroundColor: C.white, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border, marginBottom: 20 }}>
          {TYPES.map((t, i) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              activeOpacity={0.7}
              style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
                i < TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                type === t && { backgroundColor: "#F0F7FF" }]}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                borderColor: type === t ? C.blue : C.border,
                backgroundColor: type === t ? C.blue : "transparent",
                alignItems: "center", justifyContent: "center" }}>
                {type === t && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.white }} />}
              </View>
              <Text style={{ fontFamily: type === t ? fonts.semibold : fonts.medium, fontSize: 14,
                color: type === t ? C.blue : C.dark }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Describe the Problem *
        </Text>
        <View style={{ backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, marginBottom: 20 }}>
          <TextInput
            style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark, minHeight: 120, textAlignVertical: "top" }}
            placeholder="Please describe the problem in detail. Include steps to reproduce if possible..."
            placeholderTextColor="#CBD5E1"
            multiline
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <View style={{ backgroundColor: "#FFFBEB", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", gap: 10 }}>
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, flex: 1, lineHeight: 18 }}>
            For payment or withdrawal issues, please also email us at {SUPPORT_EMAIL} with your transaction reference for faster resolution.
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: C.red, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", opacity: sending ? 0.7 : 1 }}
          onPress={handleSubmit} disabled={sending} activeOpacity={0.85}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>
            {sending ? "Submitting..." : "Submit Report"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function AboutScreen({ onBack }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.light }}>
      <SubHeader title="About PromoEarn" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Logo card */}
        <View style={{ backgroundColor: C.dark, borderRadius: 24, padding: 32, alignItems: "center", marginBottom: 20, overflow: "hidden" }}>
          <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: C.blue, opacity: 0.15, top: -60, right: -40 }} />
          <View style={{ width: 70, height: 70, borderRadius: 20, backgroundColor: C.blue, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Text style={{ fontFamily: fonts.black, color: C.white, fontSize: 24, letterSpacing: 0.5 }}>PE</Text>
          </View>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 24, color: C.white, letterSpacing: -0.5 }}>
            Promo<Text style={{ color: C.blue }}>Earn</Text>
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
            Version {APP_VERSION}
          </Text>
        </View>

        {/* Mission */}
        <View style={{ backgroundColor: C.white, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark, marginBottom: 8 }}>Our Mission</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, lineHeight: 22 }}>
            PromoEarn empowers users to earn real money by completing simple promotional tasks and referring friends. We connect brands with genuine audiences and reward everyday users for their time and influence.
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {[
            { val: "10K+",  lbl: "Active Users"    },
            { val: "$50K+", lbl: "Paid Out"         },
            { val: "500+",  lbl: "Tasks Completed"  },
          ].map((st, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: C.blue }}>{st.val}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted, marginTop: 2, textAlign: "center" }}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Info rows */}
        <View style={{ backgroundColor: C.white, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
          {[
            { lbl: "Version",    val: APP_VERSION },
            { lbl: "Platform",   val: "Android & iOS" },
            { lbl: "Built with", val: "React Native (Expo)" },
            { lbl: "Backend",    val: "Node.js + Firebase" },
            { lbl: "Payments",   val: "Paystack" },
          ].map((row, i) => (
            <View key={i} style={[{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
              i < 4 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.muted }}>{row.lbl}</Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>{row.val}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 }}>
          © 2026 PromoEarn. All rights reserved.{"\n"}
          Made with ❤️ for the community.
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Shared Sub Header ──────────────────────────────────────────────────────
function SubHeader({ title, subtitle, onBack }) {
  return (
    <View style={{ backgroundColor: C.white, paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <TouchableOpacity onPress={onBack} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.light, alignItems: "center", justifyContent: "center" }} activeOpacity={0.7}>
        <Ico.ArrowLeft sz={18} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.black, fontSize: 18, color: C.dark }}>{title}</Text>
        {subtitle && <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1 }}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function HelpFeedbackScreen({ visible, onClose }) {
  const [subScreen, setSubScreen] = useState(null);

  const go   = (screen) => setSubScreen(screen);
  const back  = () => setSubScreen(null);

  const MENU = [
    {
      group: "Support",
      items: [
        { key: "help",    icon: <Ico.Help sz={20} cl={C.blue} />,     bg: "#EEF4FF", label: "Help Centre",          desc: "Frequently asked questions",         badge: null },
        { key: "contact", icon: <Ico.Chat sz={20} cl={C.green} />,    bg: "#F0FDF4", label: "Contact Us",           desc: "Chat with support or email us",       badge: null },
        { key: "feedback",icon: <Ico.Feedback sz={20} cl={C.gold} />, bg: "#FFFBEB", label: "Send Feedback",        desc: "Rate and share your thoughts",        badge: null },
        { key: "report",  icon: <Ico.Flag sz={20} cl={C.red} />,      bg: "#FFF5F5", label: "Report a Problem",     desc: "Technical issues, bugs and errors",   badge: null },
      ],
    },
    {
      group: "Legal",
      items: [
        { key: "terms",  icon: <Ico.Shield sz={20} cl={C.blue} />, bg: "#EEF4FF", label: "Terms & Privacy Policy", desc: "Read our terms of service and privacy policy", badge: null },
      ],
    },
    {
      group: "App Info",
      items: [
        { key: "about", icon: <Ico.Info sz={20} cl={C.muted} />, bg: C.light, label: "About PromoEarn", desc: `Version ${APP_VERSION}`, badge: null },
      ],
    },
  ];

  const renderSubScreen = () => {
    switch (subScreen) {
      case "help":     return <HelpCentreScreen    onBack={back} />;
      case "contact":  return <ContactUsScreen     onBack={back} />;
      case "feedback": return <SendFeedbackScreen  onBack={back} />;
      case "report":   return <ReportProblemScreen onBack={back} />;
      case "terms":    return <TermsPrivacyScreen  onBack={back} />;
      case "about":    return <AboutScreen         onBack={back} />;
      default: return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.sheet}>

          {subScreen ? (
            // Sub-screen
            renderSubScreen()
          ) : (
            // Main menu
            <>
              <View style={st.handle} />
              <View style={st.header}>
                <View>
                  <Text style={st.title}>Help & Feedback</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
                    We're here to help you succeed
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={st.closeBtn}>
                  <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Top banner */}
                <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8, backgroundColor: C.dark, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, overflow: "hidden" }}>
                  <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: C.blue, opacity: 0.15, top: -30, right: -20 }} />
                  <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(26,86,219,0.3)", alignItems: "center", justifyContent: "center" }}>
                    <Ico.Chat sz={22} cl={C.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.white }}>Need Help?</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                      Our support team typically responds within 24 hours
                    </Text>
                  </View>
                </View>

                {/* Menu groups */}
                {MENU.map((group, gi) => (
                  <View key={gi} style={{ marginTop: 16 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 8 }}>
                      {group.group}
                    </Text>
                    <View style={{ backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
                      {group.items.map((item, ii) => (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => go(item.key)}
                          activeOpacity={0.7}
                          style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
                            ii < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: item.bg, alignItems: "center", justifyContent: "center" }}>
                            {item.icon}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: C.dark }}>{item.label}</Text>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>{item.desc}</Text>
                          </View>
                          <Ico.ChevRight />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                {/* Version footer */}
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, textAlign: "center", marginTop: 28 }}>
                  PromoEarn v{APP_VERSION} · Built with ❤️
                </Text>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:    { backgroundColor: C.light, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "95%", overflow: "hidden" },
  handle:   { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white },
  title:    { fontFamily: fonts.black, fontSize: 20, color: C.dark },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.light, alignItems: "center", justifyContent: "center" },
});