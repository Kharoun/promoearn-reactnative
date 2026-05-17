import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Modal, Platform, Alert,
} from "react-native";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";
const BASE_URL = "https://promoearn-backend.onrender.com/api/v1/auth"

const api = async (endpoint, options = {}) => {
  const token = AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

const DEFAULT_PREFS = {
  taskAlerts:     true,
  referralAlerts: true,
  paymentAlerts:  true,
  promoAlerts:    false,
  weeklyReport:   true,
  appUpdates:     false,
};

export default function NotificationsScreen({ visible, onClose, user, C: CProp }) {
  const C = CProp || { blue:"#1A56DB", dark:"#0F172A", white:"#FFFFFF", light:"#F8FAFF", muted:"#64748B", border:"#E2E8F0" };
  const st = makeStyles(C);
  const [settings, setSettings] = useState(DEFAULT_PREFS);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (visible && user?.notificationPreferences) {
      setSettings({ ...DEFAULT_PREFS, ...user.notificationPreferences });
    }
  }, [visible, user]);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api("/notifications/preferences", {
        method: "POST",
        body:   { preferences: settings },
      });
      if (res.success) {
        Alert.alert("✅ Saved", "Your notification preferences have been updated.");
        onClose();
      } else {
        Alert.alert("Error", res.message || "Failed to save preferences.");
      }
    } catch {
      Alert.alert("Error", "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const groups = [
    {
      title: "Earning Alerts",
      items: [
        { key:"taskAlerts",     label:"New Tasks Available",     desc:"Get notified when new tasks are added" },
        { key:"referralAlerts", label:"Referral Bonuses",        desc:"When someone joins using your code" },
        { key:"paymentAlerts",  label:"Payment Updates",         desc:"Withdrawal approvals and rejections" },
      ],
    },
    {
      title: "General",
      items: [
        { key:"promoAlerts",  label:"Promotions & Offers",   desc:"Special campaigns and bonuses" },
        { key:"weeklyReport", label:"Weekly Earnings Report", desc:"Summary of your weekly earnings" },
        { key:"appUpdates",   label:"App Updates",            desc:"New features and improvements" },
      ],
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.sheet}>
          <View style={st.handle}/>
          <View style={st.header}>
            <Text style={st.title}>Notification Settings</Text>
            <TouchableOpacity onPress={onClose} style={st.closeBtn}>
              <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:40 }}>
            <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginBottom:20, marginTop:4 }}>
              Choose which notifications you want to receive on your device.
            </Text>

            {groups.map((group, gi) => (
              <View key={gi} style={{ marginBottom:24 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 }}>
                  {group.title}
                </Text>
                <View style={{ backgroundColor:C.card||C.white||"#FFF", borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:C.border }}>
                  {group.items.map((item, ii) => (
                    <View key={item.key} style={[{ flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, gap:12 }, ii < group.items.length-1 && { borderBottomWidth:1, borderBottomColor:C.border }]}>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:C.dark }}>{item.label}</Text>
                        <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={settings[item.key]}
                        onValueChange={() => toggle(item.key)}
                        trackColor={{ false:C.border, true:"#BFDBFE" }}
                        thumbColor={settings[item.key] ? C.blue : "#f4f3f4"}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={{ backgroundColor:C.blue, borderRadius:14, height:52, alignItems:"center", justifyContent:"center", opacity:saving?0.7:1 }}
              onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.white }}>{saving ? "Saving..." : "Save Preferences"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (C) => ({
  overlay:  { flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" },
  sheet:    { backgroundColor:C.bg||C.card||"#F8FAFF", borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"90%", paddingBottom:Platform.OS==="ios"?44:28 },
  handle:   { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 },
  header:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:C.card||"#FFF" },
  title:    { fontFamily:fonts.black, fontSize:18, color:C.dark },
  closeBtn: { width:34, height:34, borderRadius:17, backgroundColor:C.bg||"#F8FAFF", alignItems:"center", justifyContent:"center" },
});