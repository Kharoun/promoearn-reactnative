import { useState, useEffect, useRef } from "react";
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Image, Animated,
} from "react-native";
import { fonts } from "../utils/typography";
import { apiClient } from "../services/apiClient";

const NETWORKS = [
    { code: 1, key: "MTN",     label: "MTN",     color: "#FFCC00", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkosv41IjikLnMh4ycpBocWhnqjqlhIZ4Hwm2LWfJEqA&s=10" },
    { code: 2, key: "AIRTEL",  label: "Airtel",  color: "#EF4444", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQozjdJSl1ebT2ba4hYXL_gEWM1cCGMCk-JiXpCiP0Xw&s=10" },
    { code: 3, key: "GLO",     label: "Glo",     color: "#10B981", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQGoetYZoZS6V1d_KEIwFSah1NgC3VV6meiH6BKOorPA&s=10" },
    { code: 4, key: "9MOBILE", label: "9mobile", color: "#84CC16", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH3kFqYFWsakOjuQtc0cAlCUyi5S0LxMUPcVOzPGPQvA&s=10" },
  ];

const CATEGORY_META = {
  all:     { label: "All",     color: "#0F172A" },
  day:     { label: "Daily",   color: "#3B82F6" },
  week:    { label: "Weekly",  color: "#8B5CF6" },
  month:   { label: "Monthly", color: "#10B981" },
  year:    { label: "Yearly",  color: "#F59E0B" },
  special: { label: "Special", color: "#EC4899" },
};
const CATEGORY_ORDER = ["all", "day", "week", "month", "year", "special"];

function getPlanCategory(plan) {
  const text = `${plan.name || ""} ${plan.validity || ""} ${plan.networkType || ""}`.toLowerCase();
  if (/social|whatsapp|night|binge|unlimited|youtube|gift|stream/.test(text)) return "special";
  if (/\byear|365\s*days?|12\s*months?\b/.test(text)) return "year";
  if (/\bmonth|30\s*days?|31\s*days?\b/.test(text)) return "month";
  if (/\bweek|7\s*days?|14\s*days?\b/.test(text)) return "week";
  if (/\bday|24\s*hours?|1\s*day\b/.test(text)) return "day";
  return "special";
}

// ── Network logo with automatic fallback to a colored initials badge ──────
function NetworkBadge({ net, size = 44 }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: net.color, alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontFamily: fonts.black, fontSize: size * 0.32, color: "#FFFFFF" }}>
          {net.label.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFFFFF",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
      borderWidth: 1, borderColor: "#E2E8F0",
    }}>
      <Image
        source={{ uri: net.logo }}
        style={{ width: size * 0.62, height: size * 0.62 }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

// ── Animated success checkmark — circle pops in, then the check bounces in ─
function AnimatedSuccessCheck({ size = 84 }) {
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.spring(checkScale, { toValue: 1, friction: 3.5, tension: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ width: size + 24, height: size + 24, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{
        position: "absolute", width: size + 24, height: size + 24, borderRadius: (size + 24) / 2,
        borderWidth: 2, borderColor: "#BBF7D0", opacity: ringOpacity,
        transform: [{ scale: circleScale }],
      }} />
      <Animated.View style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: "#F0FDF4",
        alignItems: "center", justifyContent: "center",
        transform: [{ scale: circleScale }],
      }}>
        <Animated.Text style={{ fontSize: size * 0.48, transform: [{ scale: checkScale }] }}>✅</Animated.Text>
      </Animated.View>
    </View>
  );
}

// ── Pending badge — shown when the order is queued behind a mySubwallet
// topup rather than delivered yet. No animation — this isn't a moment of
// success, so it shouldn't feel like one.
function PendingBadge({ size = 84 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFFBEB",
      alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#FDE68A",
    }}>
      <Text style={{ fontSize: size * 0.48 }}>⏳</Text>
    </View>
  );
}

export default function DataPlanModal({ visible, onClose, onSuccess, C }) {
  const [network, setNetwork]     = useState(1);
  const [phone, setPhone]         = useState("");
  const [allPlans, setAllPlans]   = useState([]);
  const [loadingPlans, setLoadP]  = useState(true);
  const [category, setCategory]   = useState("all");
  const [selected, setSelected]   = useState(null);
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState(null);
  const [done, setDone]           = useState(false);
  const [pending, setPending]     = useState(false);

  useEffect(() => {
    if (visible) {
      setNetwork(1); setPhone(""); setSelected(null); setCategory("all");
      setError(null); setSub(false); setDone(false); setPending(false);
      fetchPlans();
    }
  }, [visible]);

  const fetchPlans = async () => {
    setLoadP(true);
    try {
      const res = await apiClient("/vtu/data-plans");
      if (res.success) setAllPlans(res.data.plans || []);
    } catch {}
    finally { setLoadP(false); }
  };

  const selectedNet = NETWORKS.find(n => n.code === network);
  const currentNetworkKey = selectedNet?.key;

  const plansForNetwork = allPlans
    .filter(p => p.network === currentNetworkKey)
    .map(p => ({ ...p, _cat: getPlanCategory(p) }));

  const countFor = (catKey) =>
    catKey === "all" ? plansForNetwork.length : plansForNetwork.filter(p => p._cat === catKey).length;

  const filteredPlans = category === "all"
    ? plansForNetwork
    : plansForNetwork.filter(p => p._cat === category);

  const validPhone = /^0\d{10}$/.test(phone.trim());
  const canSubmit  = selected && validPhone && !submitting;

  const handleSubmit = async () => {
    if (!validPhone) { setError("Enter a valid 11-digit phone number (e.g. 08012345678)."); return; }
    if (!selected)   { setError("Please select a data plan."); return; }
    setSub(true); setError(null);
    try {
      const res = await apiClient("/vtu/data", {
        method: "POST",
        body: {
          network,
          phone: phone.trim(),
          planId: selected.planId,
          costNgn: selected.costNgn,
        },
      });
      if (res.success && res.pending) {
        setPending(true);
      } else if (res.success) {
        setDone(true);
      } else {
        setError(res.message || "Purchase failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSub(false);
    }
  };

  // Reset back to plan selection without closing the modal
  const handleBuyMore = () => {
    setDone(false);
    setSelected(null);
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: "#F8FAFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: Platform.OS === "ios" ? 44 : 28, maxHeight: "94%",
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginTop: 12 }} />

          {/* Header */}
          <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#FFFFFF",
            borderBottomWidth: 1, borderBottomColor: "#EDF2F7",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF4FF",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 18 }}>📶</Text>
              </View>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: "#0F172A" }}>Buy Data</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: "#F8FAFF",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
            </TouchableOpacity>
          </View>

          {pending ? (
            /* ── Pending view — order queued behind a mySubwallet topup ── */
            <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 20 }}>
              <PendingBadge size={84} />
              <Text
                style={{
                  fontFamily: fonts.black, fontSize: 21, color: "#0F172A",
                  marginTop: 16, marginBottom: 8, textAlign: "center",
                }}
              >
                Order Received
              </Text>
              <Text
                style={{
                  fontSize: 14, color: "#64748B", textAlign: "center",
                  lineHeight: 21, marginBottom: 20, paddingHorizontal: 4,
                }}
              >
                Your data order to {phone} has been received and is being processed. We'll notify you the moment it's delivered.
              </Text>
              <View style={{
                flexDirection: "row", gap: 10, backgroundColor: "#FFFFFF",
                borderRadius: 14, padding: 14, width: "100%", marginBottom: 20,
                borderWidth: 1, borderColor: "#E2E8F0",
              }}>
                <Text style={{ color: "#1A56DB", fontSize: 14 }}>ℹ</Text>
                <Text style={{ fontSize: 12.5, color: "#0F172A", flex: 1, lineHeight: 18 }}>
                  Your balance has already been deducted for this order — no need to try again. Check its status anytime in Activity History.
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: "#1A56DB", borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", width: "100%" }}
                onPress={() => { onSuccess?.(); onClose(); }} activeOpacity={0.85}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFF" }}>Got it</Text>
              </TouchableOpacity>
            </View>
          ) : done ? (
            <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 20 }}>
              <AnimatedSuccessCheck size={84} />
              <Text style={{ fontFamily: fonts.black, fontSize: 21, color: "#0F172A", marginTop: 16, marginBottom: 8 }}>Data Sent!</Text>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF",
                borderRadius: 16, padding: 14, width: "100%", marginBottom: 16,
                borderWidth: 1, borderColor: "#E2E8F0",
              }}>
                <NetworkBadge net={selectedNet} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#0F172A" }} numberOfLines={2}>
                    {selected?.name}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    Sent to {phone}
                  </Text>
                </View>
              </View>

              {/* Buy more note */}
              <Text style={{ fontFamily: fonts.regular, fontSize: 12.5, color: "#94A3B8", textAlign: "center", marginBottom: 20 }}>
                Need more data?{" "}
                <Text
                  onPress={handleBuyMore}
                  style={{ fontFamily: fonts.bold, color: "#1A56DB" }}
                >
                  Buy another plan
                </Text>
              </Text>

              <TouchableOpacity
                style={{ backgroundColor: "#1A56DB", borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", width: "100%" }}
                onPress={() => { onSuccess?.(); onClose(); }} activeOpacity={0.85}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFF" }}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                {/* Network picker */}
                <Text style={s.sectionLbl}>Select Network</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                  {NETWORKS.map(n => {
                    const active = network === n.code;
                    return (
                      <TouchableOpacity
                        key={n.code}
                        onPress={() => { setNetwork(n.code); setSelected(null); setCategory("all"); }}
                        activeOpacity={0.85}
                        style={{
                          flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center",
                          backgroundColor: active ? n.color + "14" : "#FFFFFF",
                          borderWidth: active ? 2 : 1.5,
                          borderColor: active ? n.color : "#E2E8F0",
                        }}
                      >
                        <View>
                          <NetworkBadge net={n} size={44} />
                          {active && (
                            <View style={{
                              position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
                              backgroundColor: n.color, alignItems: "center", justifyContent: "center",
                              borderWidth: 2, borderColor: "#FFFFFF",
                            }}>
                              <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{
                          marginTop: 8, fontFamily: active ? fonts.bold : fonts.semibold,
                          fontSize: 12, color: active ? "#0F172A" : "#64748B",
                        }}>
                          {n.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Phone */}
                <Text style={s.sectionLbl}>Phone Number</Text>
                <View style={s.inputWrap}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>☎️</Text>
                  <TextInput
                    style={s.input}
                    placeholder="08012345678" placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad" maxLength={11}
                    value={phone} onChangeText={setPhone}
                  />
                </View>

                <Text style={[s.sectionLbl, { marginTop: 4 }]}>Filter Plans</Text>
              </View>

              {/* Category filter chips */}
             {/* Category filter chips */}
             <View style={{ height: 54, marginBottom: 10 }}>
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
                >
                {CATEGORY_ORDER.map(catKey => {
                  const meta = CATEGORY_META[catKey];
                  const active = category === catKey;
                  const count = countFor(catKey);
                  return (
                    <TouchableOpacity
                      key={catKey}
                      onPress={() => { setCategory(catKey); setSelected(null); }}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: active ? meta.color : "#FFFFFF",
                        borderWidth: 1.5, borderColor: active ? meta.color : "#E2E8F0",
                      }}
                    >
                      <Text style={{
                        fontFamily: active ? fonts.bold : fonts.semibold, fontSize: 12,
                        color: active ? "#FFFFFF" : "#334155",
                      }}>
                        {meta.label}
                      </Text>
                      <View style={{
                        backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                        borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
                      }}>
                        <Text style={{
                          fontFamily: fonts.bold, fontSize: 10,
                          color: active ? "#FFFFFF" : "#64748B",
                        }}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
              );
            })}
            </ScrollView>
          </View>

          {/* Plans list */}

              {/* Plans list */}
              <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                {loadingPlans ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <ActivityIndicator color="#1A56DB" />
                    <Text style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Loading plans…</Text>
                  </View>
                ) : filteredPlans.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
                    <Text style={{ fontSize: 13, color: "#94A3B8", textAlign: "center" }}>
                      No {category === "all" ? "" : CATEGORY_META[category].label.toLowerCase() + " "}plans available for {selectedNet?.label} right now.
                    </Text>
                  </View>
                ) : (
                  filteredPlans.map(p => {
                    const active = selected?.planId === p.planId;
                    const meta = CATEGORY_META[p._cat];
                    return (
                      <TouchableOpacity
                        key={p.planId}
                        onPress={() => setSelected(p)}
                        activeOpacity={0.85}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 12,
                          borderRadius: 14, borderWidth: active ? 2 : 1.5,
                          borderColor: active ? "#1A56DB" : "#E2E8F0",
                          backgroundColor: active ? "#EEF4FF" : "#FFFFFF",
                          padding: 14, marginBottom: 10,
                        }}
                      >
                        <View style={{
                          width: 22, height: 22, borderRadius: 11,
                          borderWidth: 2, borderColor: active ? "#1A56DB" : "#CBD5E1",
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: active ? "#1A56DB" : "transparent",
                        }}>
                          {active && <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#0F172A" }} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 }}>
                            <View style={{ backgroundColor: meta.color + "18", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: meta.color }}>{meta.label}</Text>
                            </View>
                            {p.networkType ? (
                              <Text style={{ fontSize: 11, color: "#94A3B8" }}>{p.networkType}</Text>
                            ) : null}
                          </View>
                        </View>
                        <Text style={{ fontSize: 15, fontFamily: fonts.black, color: "#1A56DB" }}>
                          ₦{p.chargeNgn.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                {error && (
                  <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#FECACA" }}>
                    <Text style={{ fontSize: 13, color: "#EF4444" }}>⚠️ {error}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    backgroundColor: canSubmit ? "#1A56DB" : "#CBD5E1", borderRadius: 14, height: 56,
                  }}
                  onPress={handleSubmit} disabled={!canSubmit} activeOpacity={canSubmit ? 0.85 : 1}>
                  {submitting
                    ? <ActivityIndicator color="#FFF" />
                    : (
                      <>
                        <NetworkBadge net={selectedNet} size={22} />
                        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFF" }}>
                          {selected ? `Pay ₦${selected.chargeNgn.toLocaleString()}` : "Select a plan"}
                        </Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = {
  sectionLbl: {
    fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, height: 52, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, fontFamily: fonts.medium, color: "#0F172A" },
};