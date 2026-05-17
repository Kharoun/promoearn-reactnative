import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Platform, RefreshControl,
} from "react-native";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";


const BASE_URL = "https://promoearn-backend.onrender.com/api/v1";


const api = async (endpoint, options = {}) => {
  // STEP 3: await the token — AuthService.getToken() is async
  const token = await AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

const TYPE_ICON = {
  taskAlerts:     { emoji:"✅", bg:"#F0FDF4", color:"#10B981" },
  referralAlerts: { emoji:"👥", bg:"#EEF4FF", color:"#1A56DB" },
  paymentAlerts:  { emoji:"💰", bg:"#FFFBEB", color:"#F59E0B" },
  promoAlerts:    { emoji:"🎯", bg:"#F5F3FF", color:"#8B5CF6" },
  default:        { emoji:"🔔", bg:"#F8FAFF", color:"#64748B" },
};

export default function NotificationsListScreen({ visible, onClose, onUnreadChange, C, darkMode }) {

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  useEffect(() => {
    if (visible) fetchNotifications();
  }, [visible]);

  const fetchNotifications = async () => {
    try {
      const res = await api("/notifications");
      if (res.success) {
        setNotifications(res.data.notifications);
        if (onUnreadChange) onUnreadChange(res.data.unreadCount);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api("/notifications/read-all", { method:"PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, read:true })));
      if (onUnreadChange) onUnreadChange(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method:"PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read:true } : n));
      const unread = notifications.filter(n => !n.read && n.id !== id).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const formatTime = (ts) => {
    if (!ts?._seconds) return "—";
    const diff = Date.now() - ts._seconds * 1000;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return "Just now";
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        {/* STEP 5: Replace hardcoded color values with C.whatever */}
        <View style={[st.sheet, { backgroundColor: C.card }]}>
          <View style={[st.handle, { backgroundColor: C.border }]}/>
          <View style={[st.header, { borderBottomColor: C.border }]}>
            <View>
              <Text style={[st.title, { color: C.dark }]}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>
                  {unreadCount} unread
                </Text>
              )}
            </View>
            <View style={{ flexDirection:"row", gap:10, alignItems:"center" }}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
                  <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.blue }}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={[st.closeBtn, { backgroundColor: C.bg }]}>
                <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom:40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
                tintColor={C.blue}
              />
            }
          >
            {loading ? (
              <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", paddingVertical:40 }}>
                Loading...
              </Text>
            ) : notifications.length === 0 ? (
              <View style={{ alignItems:"center", paddingVertical:60 }}>
                <Text style={{ fontSize:48, marginBottom:16 }}>🔔</Text>
                <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark }}>No notifications yet</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginTop:4, textAlign:"center", paddingHorizontal:32 }}>
                  You'll be notified about tasks, referrals and payments here.
                </Text>
              </View>
            ) : (
              notifications.map((notif, i) => {
                const icon = TYPE_ICON[notif.type] || TYPE_ICON.default;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    onPress={() => { if (!notif.read) handleMarkRead(notif.id); }}
                    activeOpacity={0.7}
                    style={[
                      st.notifRow,
                      // STEP 5 continued: use darkMode for conditional colors too
                      !notif.read && { backgroundColor: darkMode ? "#1A2F5E" : "#F0F7FF" },
                      i < notifications.length - 1 && { borderBottomWidth:1, borderBottomColor:C.border },
                    ]}
                  >
                    <View style={[st.notifIcon, { backgroundColor:icon.bg }]}>
                      <Text style={{ fontSize:20 }}>{icon.emoji}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <Text style={{ fontFamily:notif.read ? fonts.medium : fonts.bold, fontSize:14, color:C.dark, flex:1, marginRight:8 }}>
                          {notif.title}
                        </Text>
                        <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, flexShrink:0 }}>
                          {formatTime(notif.createdAt)}
                        </Text>
                      </View>
                      <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginTop:3, lineHeight:19 }}>
                        {notif.body}
                      </Text>
                    </View>
                    {!notif.read && (
                      <View style={{ width:8, height:8, borderRadius:4, backgroundColor:C.blue, marginLeft:8, marginTop:4, flexShrink:0 }} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// STEP 6: StyleSheet only keeps layout/structure — no colors here
// Colors that need to theme must move inline (as done above) so C can be used
const st = StyleSheet.create({
  overlay:   { flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" },
  sheet:     { borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"85%", paddingBottom:Platform.OS==="ios"?44:28 },
  handle:    { width:40, height:4, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 },
  header:    { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1 },
  title:     { fontFamily:fonts.black, fontSize:18 },
  closeBtn:  { width:34, height:34, borderRadius:17, alignItems:"center", justifyContent:"center" },
  notifRow:  { flexDirection:"row", alignItems:"flex-start", paddingHorizontal:20, paddingVertical:16, gap:14 },
  notifIcon: { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center", flexShrink:0 },
});