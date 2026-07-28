import { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { apiClient } from "../services/apiClient";
import { fonts } from "../utils/typography";

const CATEGORY_META = {
  task:        { icon: "📋", color: "#1A56DB", label: "Task" },
  transaction: { icon: "💳", color: "#10B981", label: "Transaction" },
  campaign:    { icon: "📣", color: "#8B5CF6", label: "Campaign" },
  session:     { icon: "🔐", color: "#F59E0B", label: "Login" },
  vtu:         { icon: "📶", color: "#0EA5E9", label: "Airtime & Data" },
};

const fmtDate = (d) => {
  if (!d) return "—";
  const ms = d?._seconds ? d._seconds * 1000 : new Date(d).getTime();
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export default function ActivityHistoryScreen({ visible, onClose, C }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => { if (visible) fetchHistory(); }, [visible]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/activity-history");
      if (res.success) setItems(res.data.items);
    } catch (err) {
      console.error("Activity history fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          maxHeight: "90%", paddingBottom: Platform.OS === "ios" ? 44 : 24,
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 12 }} />

          <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
          }}>
            <Text style={{ fontFamily: fonts.black, fontSize: 18, color: C.dark }}>Activity History</Text>
            <TouchableOpacity onPress={onClose} style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: C.input || C.bg,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
            {[
              { key: "all", label: "All" },
              { key: "task", label: "Tasks" },
              { key: "transaction", label: "Transactions" },
              { key: "vtu", label: "Airtime & Data" },
              { key: "campaign", label: "Campaigns" },
              { key: "session", label: "Logins" },
            ].map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                    backgroundColor: active ? C.blue : C.card, borderColor: active ? C.blue : C.border,
                  }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: active ? "#FFF" : C.muted }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            {loading ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <ActivityIndicator color={C.blue} size="large" />
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>Loading activity…</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>No activity yet</Text>
              </View>
            ) : (
              filtered.map((item, i) => {
                const meta = CATEGORY_META[item.category] || CATEGORY_META.transaction;
                const isPending = item.status === "pending_topup" || item.status === "pending";
                return (
                  <View key={item.id + i} style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 12, borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: C.border,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 12, backgroundColor: meta.color + "18",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        <Text style={{ fontSize: 12, color: C.muted }}>
                          {meta.label} · {fmtDate(item.date)}
                        </Text>
                        {isPending && (
                          <View style={{
                            backgroundColor: "#FFFBEB", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
                            borderWidth: 1, borderColor: "#FDE68A",
                          }}>
                            <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: "#B45309", letterSpacing: 0.3 }}>
                              PENDING
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {item.amount != null && item.amount !== 0 && (
                      <Text style={{
                        fontFamily: fonts.bold, fontSize: 13,
                        color: item.amount > 0 ? C.green : C.red,
                      }}>
                        {item.amount > 0 ? "+" : ""}${Math.abs(item.amount).toFixed(2)}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}