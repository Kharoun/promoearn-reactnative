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

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

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

export default function AirtimeModal({ visible, onClose, onSuccess, C }) {
  const [network, setNetwork]   = useState(1);
  const [phone, setPhone]       = useState("");
  const [amount, setAmount]     = useState("");
  const [markupPct, setMarkup]  = useState(10);
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (visible) {
      setNetwork(1); setPhone(""); setAmount("");
      setError(null); setSub(false); setDone(false);
      fetchConfig();
    }
  }, [visible]);

  const fetchConfig = async () => {
    try {
      const res = await apiClient("/vtu/config");
      if (res.success) setMarkup(res.data.airtimeMarkupPercent);
    } catch {}
  };

  const selectedNet = NETWORKS.find(n => n.code === network);
  const face  = parseFloat(amount) || 0;
  const total = +(face * (1 + markupPct / 100)).toFixed(2);

  const validPhone = /^0\d{10}$/.test(phone.trim());
  const canSubmit  = face >= 50 && validPhone && !submitting;

  const handleSubmit = async () => {
    if (!validPhone) { setError("Enter a valid 11-digit phone number (e.g. 08012345678)."); return; }
    if (face < 50)   { setError("Minimum airtime amount is ₦50."); return; }
    setSub(true); setError(null);
    try {
      const res = await apiClient("/vtu/airtime", {
        method: "POST",
        body: { network, phone: phone.trim(), faceValueNgn: face },
      });
      if (res.success) {
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

  // Reset back to the purchase form without closing the modal
  const handleBuyMore = () => {
    
    setDone(false);
    setAmount("");
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
                <Text style={{ fontSize: 18 }}>📱</Text>
              </View>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: "#0F172A" }}>Buy Airtime</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{
              width: 34, height: 34, borderRadius: 17, backgroundColor: "#F8FAFF",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
            {done ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <AnimatedSuccessCheck size={84} />
                <Text style={{ fontFamily: fonts.black, fontSize: 21, color: "#0F172A", marginTop: 16, marginBottom: 8 }}>
                  Airtime Sent!
                </Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF",
                  borderRadius: 16, padding: 14, width: "100%", marginBottom: 16,
                  borderWidth: 1, borderColor: "#E2E8F0",
                }}>
                  <NetworkBadge net={selectedNet} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#0F172A" }}>
                      ₦{face.toLocaleString()} to {phone}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {selectedNet?.label} · Delivered instantly
                    </Text>
                  </View>
                </View>

                {/* Buy more note */}
                <Text style={{ fontFamily: fonts.regular, fontSize: 12.5, color: "#94A3B8", textAlign: "center", marginBottom: 20 }}>
                  Need to top up again?{" "}
                  <Text
                    onPress={handleBuyMore}
                    style={{ fontFamily: fonts.bold, color: "#1A56DB" }}
                  >
                    Buy more airtime
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
                {/* Network picker */}
                <Text style={s.sectionLbl}>Select Network</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
                  {NETWORKS.map(n => {
                    const active = network === n.code;
                    return (
                      <TouchableOpacity
                        key={n.code}
                        onPress={() => setNetwork(n.code)}
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

                {/* Amount */}
                <Text style={[s.sectionLbl, { marginTop: 4 }]}>Amount</Text>
                <View style={s.inputWrap}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#64748B", marginRight: 6 }}>₦</Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. 1000" placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount} onChangeText={setAmount}
                  />
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 20 }}>
                  {QUICK_AMOUNTS.map(a => {
                    const active = amount === String(a);
                    return (
                      <TouchableOpacity key={a} onPress={() => setAmount(String(a))} activeOpacity={0.8}
                        style={{
                          borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
                          backgroundColor: active ? "#1A56DB" : "#FFFFFF",
                          borderWidth: 1.5, borderColor: active ? "#1A56DB" : "#E2E8F0",
                        }}>
                        <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: active ? "#FFFFFF" : "#1A56DB" }}>
                          ₦{a.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live total */}
                {face > 0 && (
                  <View style={{
                    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 20,
                    borderWidth: 1.5, borderColor: "#E2E8F0",
                  }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: "#64748B" }}>Airtime value</Text>
                      <Text style={{ fontSize: 13, color: "#0F172A", fontFamily: fonts.semibold }}>₦{face.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={{ fontSize: 13, color: "#64748B" }}>Service fee ({markupPct}%)</Text>
                      <Text style={{ fontSize: 13, color: "#0F172A", fontFamily: fonts.semibold }}>₦{(total - face).toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: "#E2E8F0", marginBottom: 10 }} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#0F172A" }}>You'll pay</Text>
                      <Text style={{ fontSize: 20, fontFamily: fonts.black, color: "#1A56DB" }}>₦{total.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {error && (
                  <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FECACA" }}>
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
                          {face > 0 ? `Pay ₦${total.toLocaleString()}` : "Buy Airtime"}
                        </Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
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