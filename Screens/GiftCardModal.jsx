import { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Platform, Alert, ActivityIndicator, Image, StyleSheet, Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fonts } from "../utils/typography";
import { apiClient, apiFormData } from "../services/apiClient";

const DENOMS = [10, 25, 50, 100, 200];

const COUNTRIES = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "OT", name: "Other", flag: "🌍" },
];

// ── Animated success checkmark (dark theme) ───────────────────────────────
function AnimatedSuccessCheck({ size = 80 }) {
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
        borderWidth: 2, borderColor: "#1F6B3F", opacity: ringOpacity,
        transform: [{ scale: circleScale }],
      }} />
      <Animated.View style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: "#0F2A1D",
        alignItems: "center", justifyContent: "center",
        transform: [{ scale: circleScale }],
      }}>
        <Animated.Text style={{ fontSize: size * 0.48, transform: [{ scale: checkScale }] }}>✅</Animated.Text>
      </Animated.View>
    </View>
  );
}

export default function GiftCardModal({ visible, onClose, onSubmitted, user, C }) {
  const [step, setStep] = useState("select"); // select | form | submitted
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [search, setSearch] = useState("");

  const [brand, setBrand] = useState(null);
  const [cardType, setCardType] = useState("ecode");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [cardUri, setCardUri] = useState(null);
  const [cardFile, setCardFile] = useState(null);
  const [backUri, setBackUri] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setStep("select");
      setBrand(null);
      setCardType("ecode");
      setCountry(COUNTRIES[0]);
      setFaceValue("");
      setCode("");
      setPin("");
      setCardUri(null);
      setCardFile(null);
      setBackUri(null);
      setBackFile(null);
      setError("");
      fetchRates();
    }
  }, [visible]);

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const res = await apiClient("/giftcards/rates");
      if (res.success) setRates(res.data.rates);
    } catch {
      setError("Could not load current rates.");
    } finally {
      setLoadingRates(false);
    }
  };

  // Group rates by brand for the list — show the brand's best available rate
  const brandList = Object.values(
    rates.reduce((acc, r) => {
      if (!acc[r.brand] || r.ratePercent > acc[r.brand].ratePercent) acc[r.brand] = r;
      return acc;
    }, {})
  ).filter((r) => r.brand.toLowerCase().includes(search.toLowerCase()));

  const typesForBrand = rates.filter((r) => r.brand === brand);
  const activeRate = rates.find((r) => r.brand === brand && r.cardType === cardType);
  const face = parseFloat(faceValue) || 0;
  const quoted = activeRate && face > 0 ? +(face * (activeRate.ratePercent / 100)).toFixed(2) : 0;

  const selectBrand = (r) => {
    setBrand(r.brand);
    setCardType(r.cardType);
    setStep("form");
  };

  const pickPhoto = async (which, fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }
    const opts = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.4, exif: false,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    let file;
    if (Platform.OS === "web") {
      // On web, expo-image-picker returns a blob: URI. A plain {uri,name,type}
      // object (which works fine on native) is silently dropped by the browser's
      // FormData — it needs an actual File/Blob, so we fetch the blob and wrap it.
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      file = new File([blob], `${which}.jpg`, { type: blob.type || "image/jpeg" });
    } else {
      file = { uri: asset.uri, name: `${which}.jpg`, type: "image/jpeg" };
    }

    if (which === "card") { setCardUri(asset.uri); setCardFile(file); }
    else { setBackUri(asset.uri); setBackFile(file); }
  };
  
  const canSubmit = () => {
    if (!face || face <= 0) return false;
    if (!code.trim()) return false;
    if (cardType === "physical") return !!cardFile && !!backFile;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    console.log("🔍 Submit debug:", {
      cardType,
      hasCardFile: !!cardFile, cardFileUri: cardFile?.uri,
      hasBackFile: !!backFile, backFileUri: backFile?.uri,
    });
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("brand", brand);
      form.append("cardType", cardType);
      form.append("country", country.name);
      form.append("faceValue", faceValue);
      form.append("code", code);
      if (pin) form.append("pin", pin);
      if (cardType === "ecode") {
        if (cardFile) form.append("front", cardFile); // optional photo of an e-code receipt/screenshot
      } else {
        form.append("front", cardFile);
        form.append("back", backFile);
      }
      const res = await apiFormData("/giftcards/submit", form);
      if (res.success) setStep("submitted");
      else setError(res.message || "Submission failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: "#0B1220", borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: Platform.OS === "ios" ? 34 : 20, maxHeight: "94%", overflow: "hidden",
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#243044", borderRadius: 2, alignSelf: "center", marginTop: 12 }} />

          {/* ── STEP: Brand list ── */}
          {step === "select" && (
            <>
              <View style={hd.wrap}>
                <View>
                  <Text style={hd.title}>Sell Gift Card</Text>
                  <Text style={hd.sub}>Instant quotes · Secure review</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={hd.closeBtn}>
                  <Text style={{ color: "#fff", fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <View style={search_.wrap}>
                  <Text style={{ color: "#5B6B85", marginRight: 8 }}>🔍</Text>
                  <TextInput
                    style={search_.input}
                    placeholder="Search brand..."
                    placeholderTextColor="#5B6B85"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
              </View>

              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
                {loadingRates ? (
                  <ActivityIndicator color="#3B82F6" style={{ marginTop: 30 }} />
                ) : brandList.length === 0 ? (
                  <Text style={{ color: "#5B6B85", textAlign: "center", padding: 30 }}>
                    No gift card brands available right now.
                  </Text>
                ) : (
                  brandList.map((r) => (
                    <TouchableOpacity key={r.brand} onPress={() => selectBrand(r)} style={row.wrap} activeOpacity={0.8}>
                      <View style={row.logoWrap}>
                        {r.logoUrl ? (
                          <Image source={{ uri: r.logoUrl }} style={{ width: 30, height: 30, borderRadius: 8 }} resizeMode="contain" />
                        ) : (
                          <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>{r.brand[0]}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={row.name}>{r.brand}</Text>
                        <Text style={row.type}>{typesForBrand.length > 1 ? "Multiple types" : (r.cardType === "ecode" ? "E-Code" : "Physical")}</Text>
                      </View>
                      <View style={row.rateBadge}>
                        <Text style={row.rateTxt}>{r.ratePercent}%</Text>
                      </View>
                      <Text style={{ color: "#3B4A63", fontSize: 18, marginLeft: 8 }}>›</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </>
          )}

          {/* ── STEP: Form ── */}
          {step === "form" && (
            <>
              <View style={hd.wrap}>
                <TouchableOpacity onPress={() => setStep("select")} style={hd.backBtn}>
                  <Text style={{ color: "#fff", fontSize: 16 }}>‹</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={hd.title}>{brand}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={hd.closeBtn}>
                  <Text style={{ color: "#fff", fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
                {/* Type toggle */}
                {typesForBrand.length > 1 && (
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                    {typesForBrand.map((r) => (
                      <TouchableOpacity
                        key={r.cardType}
                        onPress={() => setCardType(r.cardType)}
                        style={[seg.btn, cardType === r.cardType && seg.btnActive]}
                      >
                        <Text style={[seg.txt, cardType === r.cardType && seg.txtActive]}>
                          {r.cardType === "ecode" ? "💻 E-Code" : "💳 Physical"}
                        </Text>
                        <Text style={[seg.rate, cardType === r.cardType && { color: "#22C55E" }]}>{r.ratePercent}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Country */}
                <Text style={frm.lbl}>Country</Text>
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(true)}
                  style={[frm.inputWrap, { justifyContent: "space-between" }]}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{country.flag}</Text>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: "#fff" }}>{country.name}</Text>
                  </View>
                  <Text style={{ color: "#5B6B85" }}>▼</Text>
                </TouchableOpacity>

                <Text style={frm.lbl}>Face Value</Text>
                <View style={frm.inputWrap}>
                  <Text style={{ color: "#5B6B85", fontSize: 18, fontWeight: "800", marginRight: 6 }}>$</Text>
                  <TextInput
                    style={frm.input}
                    placeholder="0.00"
                    placeholderTextColor="#3B4A63"
                    keyboardType="numeric"
                    value={faceValue}
                    onChangeText={setFaceValue}
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  {DENOMS.map((d) => (
                    <TouchableOpacity key={d} onPress={() => setFaceValue(String(d))} style={chip.btn}>
                      <Text style={chip.txt}>${d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Code + PIN — shown for BOTH e-code and physical cards */}
                <Text style={frm.lbl}>Card Code</Text>
                <View style={frm.inputWrap}>
                  <TextInput
                    style={frm.input} placeholder="Enter card code" placeholderTextColor="#3B4A63"
                    value={code} onChangeText={setCode} autoCapitalize="characters"
                  />
                </View>
                <Text style={frm.lbl}>PIN (optional)</Text>
                <View style={frm.inputWrap}>
                  <TextInput
                    style={frm.input} placeholder="Enter PIN if any" placeholderTextColor="#3B4A63"
                    value={pin} onChangeText={setPin}
                  />
                </View>

                {cardType === "ecode" ? (
                  <>
                    <Text style={frm.lbl}>Photo (optional — receipt or screenshot)</Text>
                    <PhotoPicker uri={cardUri} onPick={(cam) => pickPhoto("card", cam)} onClear={() => { setCardUri(null); setCardFile(null); }} />
                  </>
                ) : (
                  <>
                    <Text style={frm.lbl}>Front of Card</Text>
                    <PhotoPicker uri={cardUri} onPick={(cam) => pickPhoto("card", cam)} onClear={() => { setCardUri(null); setCardFile(null); }} />
                    <Text style={frm.lbl}>Back of Card (scratched)</Text>
                    <PhotoPicker uri={backUri} onPick={(cam) => pickPhoto("back", cam)} onClear={() => { setBackUri(null); setBackFile(null); }} />
                  </>
                )}

                <View style={warn.wrap}>
                  <Text style={warn.txt}>
                    ⚠️ Only submit cards you own and haven't redeemed. We verify the balance before
                    crediting — invalid or used cards will be rejected.
                  </Text>
                </View>

                {error ? (
                  <View style={{ backgroundColor: "#3A1414", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <Text style={{ color: "#F87171", fontSize: 13 }}>⚠️ {error}</Text>
                  </View>
                ) : null}
              </ScrollView>

              {/* Sticky settlement footer */}
              <View style={foot.wrap}>
                <View>
                  <Text style={foot.lbl}>Settlement Amount</Text>
                  <Text style={foot.amt}>${quoted.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!canSubmit() || submitting}
                  style={[foot.btn, (!canSubmit() || submitting) && { opacity: 0.4 }]}
                >
                  {submitting ? <ActivityIndicator color="#0B1220" /> : <Text style={foot.btnTxt}>Sell</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── STEP: Submitted ── */}
          {step === "submitted" && (
            <View style={{ alignItems: "center", padding: 32, paddingTop: 44 }}>
              <AnimatedSuccessCheck size={80} />
              <Text style={{ fontFamily: fonts.black, fontSize: 20, color: "#fff", marginTop: 16, marginBottom: 8, textAlign: "center" }}>
                Submitted for Review!
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#8A97AC", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
                We're verifying your {brand} card balance. If approved, ${quoted.toFixed(2)} will be added
                to your wallet — usually within 24 hours.
              </Text>
              <TouchableOpacity
                style={[foot.btn, { width: "100%" }]}
                onPress={() => { onSubmitted && onSubmitted(); onClose(); }}
              >
                <Text style={foot.btnTxt}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Country picker modal ── */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#0B1220", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "75%", paddingBottom: Platform.OS === "ios" ? 34 : 20 }}>
            <View style={{ width: 40, height: 4, backgroundColor: "#243044", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 17, color: "#fff" }}>Select Country</Text>
              <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }} style={hd.closeBtn}>
                <Text style={{ color: "#fff", fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
              <View style={search_.wrap}>
                <Text style={{ color: "#5B6B85", marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={search_.input}
                  placeholder="Search country..."
                  placeholderTextColor="#5B6B85"
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {filteredCountries.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => { setCountry(c); setShowCountryPicker(false); setCountrySearch(""); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#1F2A3D",
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{c.flag}</Text>
                  <Text style={{ flex: 1, fontFamily: country.code === c.code ? fonts.bold : fonts.medium, fontSize: 14, color: country.code === c.code ? "#3B82F6" : "#fff" }}>
                    {c.name}
                  </Text>
                  {country.code === c.code && <Text style={{ color: "#3B82F6" }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function PhotoPicker({ uri, onPick, onClear }) {
  if (uri) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Image source={{ uri }} style={{ width: "100%", height: 150, borderRadius: 14 }} resizeMode="cover" />
        <TouchableOpacity onPress={onClear} style={{
          position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
          backgroundColor: "rgba(239,68,68,0.9)", alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ color: "#fff", fontSize: 13 }}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
      <TouchableOpacity onPress={() => onPick(true)} style={ph.btn}>
        <Text style={{ fontSize: 20 }}>📷</Text>
        <Text style={ph.txt}>Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onPick(false)} style={ph.btn}>
        <Text style={{ fontSize: 20 }}>🖼️</Text>
        <Text style={ph.txt}>Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const hd = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontFamily: fonts.black, fontSize: 17, color: "#fff" },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: "#5B6B85", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#1A2536", alignItems: "center", justifyContent: "center" },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#1A2536", alignItems: "center", justifyContent: "center" },
});

const search_ = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#141D2E", borderRadius: 14, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, color: "#fff", fontFamily: fonts.medium, fontSize: 14 },
});

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#141D2E",
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 12,
  },
  logoWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#1F2A3D",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  name: { fontFamily: fonts.bold, fontSize: 14, color: "#fff" },
  type: { fontFamily: fonts.regular, fontSize: 11, color: "#5B6B85", marginTop: 2 },
  rateBadge: { backgroundColor: "#0F2A1D", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  rateTxt: { fontFamily: fonts.black, fontSize: 13, color: "#22C55E" },
});

const seg = StyleSheet.create({
  btn: {
    flex: 1, backgroundColor: "#141D2E", borderRadius: 14, padding: 14,
    alignItems: "center", borderWidth: 1.5, borderColor: "#1F2A3D",
  },
  btnActive: { borderColor: "#3B82F6", backgroundColor: "#111C33" },
  txt: { fontFamily: fonts.semibold, fontSize: 13, color: "#8A97AC" },
  txtActive: { color: "#fff" },
  rate: { fontFamily: fonts.bold, fontSize: 12, color: "#5B6B85", marginTop: 4 },
});

const frm = StyleSheet.create({
  lbl: { fontFamily: fonts.semibold, fontSize: 11, color: "#5B6B85", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#141D2E",
    borderRadius: 14, paddingHorizontal: 16, height: 54, marginBottom: 14, borderWidth: 1.5, borderColor: "#1F2A3D",
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: "#fff" },
});

const chip = StyleSheet.create({
  btn: { backgroundColor: "#141D2E", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#1F2A3D" },
  txt: { fontFamily: fonts.semibold, fontSize: 12, color: "#8A97AC" },
});

const warn = StyleSheet.create({
  wrap: { backgroundColor: "#2A2007", borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: "#4A3B10" },
  txt: { fontSize: 12, color: "#FBBF24", lineHeight: 18 },
});

const ph = StyleSheet.create({
  btn: {
    flex: 1, height: 80, backgroundColor: "#141D2E", borderRadius: 14, borderWidth: 1.5,
    borderColor: "#1F2A3D", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4,
  },
  txt: { fontSize: 11, color: "#8A97AC", fontFamily: fonts.semibold },
});

const foot = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0B1220",
    borderTopWidth: 1, borderTopColor: "#1F2A3D", flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  lbl: { fontFamily: fonts.medium, fontSize: 11, color: "#5B6B85" },
  amt: { fontFamily: fonts.black, fontSize: 22, color: "#22C55E", marginTop: 2 },
  btn: { backgroundColor: "#22C55E", borderRadius: 14, paddingHorizontal: 36, paddingVertical: 14 },
  btnTxt: { fontFamily: fonts.black, fontSize: 15, color: "#0B1220" },
});