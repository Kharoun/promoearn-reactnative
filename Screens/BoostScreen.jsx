/**
 * BoostScreen.jsx — PromoEarn
 * Order followers, likes or views without leaving the app.
 * Pay from your PromoEarn balance OR with Flutterwave (card / bank transfer).
 *
 * Backend: GET /boost/services · POST /boost/order · POST /boost/order/card
 *          POST /boost/order/card/verify · GET /boost/orders
 * Props:   user, setUser, C (theme colors), onRefreshUser (optional),
 *          onClose (optional — shows a close button when opened as a modal)
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, RefreshControl, Platform, StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { fonts } from "../utils/typography";
import { apiClient } from "../services/apiClient";

const DEFAULT_C = {
  blue: "#1A56DB", blueSoft: "#EEF4FF", dark: "#0F172A", white: "#FFFFFF",
  green: "#10B981", greenSoft: "#F0FDF4", gold: "#F59E0B", goldSoft: "#FFFBEB",
  red: "#EF4444", muted: "#64748B", border: "#E2E8F0", slate: "#94A3B8",
  bg: "#F8FAFF", card: "#FFFFFF",
};

const PLATFORMS = {
  instagram: { label: "Instagram", icon: "📸" },
  tiktok:    { label: "TikTok",    icon: "🎵" },
  youtube:   { label: "YouTube",   icon: "▶️" },
  facebook:  { label: "Facebook",  icon: "📘" },
  twitter:   { label: "X / Twitter", icon: "🐦" },
  telegram:  { label: "Telegram",  icon: "✈️" },
  spotify:   { label: "Spotify",   icon: "🎧" },
  other:     { label: "Other",     icon: "✨" },
};

const STATUS_META = {
  awaiting_payment: { label: "Awaiting payment",   color: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
  pending:     { label: "Pending",              color: "#92600A", bg: "#FFF3CD", dot: "#F59E0B" },
  in_progress: { label: "In progress",          color: "#1A56DB", bg: "#EEF4FF", dot: "#1A56DB" },
  completed:   { label: "Completed",            color: "#065F46", bg: "#D1FAE5", dot: "#10B981" },
  partial:     { label: "Partly delivered",     color: "#9A3412", bg: "#FFEDD5", dot: "#F97316" },
  canceled:    { label: "Canceled, refunded",   color: "#7F1D1D", bg: "#FEE2E2", dot: "#EF4444" },
  failed:      { label: "Failed, refunded",     color: "#7F1D1D", bg: "#FEE2E2", dot: "#EF4444" },
  refunded:    { label: "Refunded",             color: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
};

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;
const n0 = (n) => Number(n || 0).toLocaleString();

// Estimate only — the server calculates the final charge.
const estimate = (svc, qty) =>
  svc && qty > 0
    ? Math.max(0.01, Math.ceil(((svc.pricePer1000Usd * qty) / 1000) * 100 - 1e-6) / 100)
    : 0;

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " +
         d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const shortLink = (l = "") => l.replace(/^https?:\/\/(www\.)?/, "").slice(0, 38);

// ═════════════════════════════════════════════════════════════════════════
export default function BoostScreen({ user, setUser, C: CProp, onClose, onRefreshUser }) {
  // Missing theme keys fall back to the defaults so dark/light themes never break this screen
  const C = { ...DEFAULT_C, ...(CProp || {}) };

  const [tab, setTab]             = useState("order");
  const [services, setServices]   = useState([]);
  const [enabled, setEnabled]     = useState(true);
  const [ngnRate, setNgnRate]     = useState(1500);
  const [minCardNgn, setMinCardNgn] = useState(100);
  const [loading, setLoading]     = useState(true);
  const [platform, setPlatform]   = useState(null);
  const [svc, setSvc]             = useState(null);
  const [link, setLink]           = useState("");
  const [qty, setQty]             = useState("");
  const [confirming, setConfirming] = useState(false);
  const [payMethod, setPayMethod] = useState("balance"); // "balance" | "card"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [placed, setPlaced]       = useState(null);
  const [orders, setOrders]       = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Flutterwave checkout state
  const [pay, setPay]             = useState(null);        // { url, reference, amountNgn, name, qty }
  const [payStep, setPayStep]     = useState("webview");   // "webview" | "verifying"
  const [payError, setPayError]   = useState("");
  const verifyingRef              = useRef(false);

  // ── Load services ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient("/boost/services");
        if (r?.success) {
          setServices(r.data.services || []);
          setEnabled(r.data.enabled !== false);
          if (r.data.ngnRate) setNgnRate(r.data.ngnRate);
          if (r.data.minCardNgn) setMinCardNgn(r.data.minCardNgn);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const platforms = useMemo(() => [...new Set(services.map((s) => s.platform))], [services]);

  useEffect(() => {
    if (!platform && platforms.length) setPlatform(platforms[0]);
  }, [platforms, platform]);

  const platformServices = useMemo(
    () => services.filter((s) => s.platform === platform),
    [services, platform]
  );

  // ── Load orders (auto-refresh every 30s while the tab is open) ──────────
  const loadOrders = useCallback(async (silent) => {
    if (!silent) setOrdersLoading(true);
    try {
      const r = await apiClient("/boost/orders");
      if (r?.success) setOrders(r.data.orders || []);
    } catch {}
    finally { setOrdersLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (tab !== "orders") return;
    loadOrders();
    const id = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(id);
  }, [tab, loadOrders]);

  // ── Derived order values ────────────────────────────────────────────────
  const qtyNum    = parseInt(qty) || 0;
  const qtyOk     = !!svc && qtyNum >= svc.min && qtyNum <= svc.max;
  const cost      = estimate(svc, qtyNum);
  const costNgn   = Math.ceil(cost * ngnRate);
  const balance   = Number(user?.balance) || 0;
  const canBalance = qtyOk && cost <= balance;
  const canCard    = qtyOk && costNgn >= minCardNgn;
  const canOrder  = !!svc && qtyOk && link.trim().length > 8;

  const quickQty = svc
    ? [...new Set([svc.min, 500, 1000, 5000, 10000].filter((q) => q >= svc.min && q <= svc.max))].slice(0, 4)
    : [];

  const pickPlatform = (p) => { setPlatform(p); setSvc(null); setQty(""); setError(""); };

  const openConfirm = () => {
    setError("");
    setPayMethod(canBalance ? "balance" : "card");
    setConfirming(true);
  };

  const finishPlaced = (title, text, note) => {
    setPlaced({ title, text, note });
    setLink(""); setQty(""); setSvc(null);
    loadOrders(true);
  };

  // ── Pay from balance ────────────────────────────────────────────────────
  const placeOrder = async () => {
    setSubmitting(true); setError("");
    try {
      const res = await apiClient("/boost/order", {
        method: "POST",
        body: { serviceId: svc.id, link: link.trim(), quantity: qtyNum },
      });
      if (res?.success) {
        if (res.data?.newBalance != null && setUser) setUser({ ...user, balance: res.data.newBalance });
        finishPlaced(
          "Order placed",
          `${n0(qtyNum)} × ${svc.name}${res.data?.chargeUsd != null ? ` · ${money(res.data.chargeUsd)}` : ""}`,
          null
        );
      } else {
        setError(res?.message || "We couldn't place this order. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setConfirming(false);
      setSubmitting(false);
    }
  };

  // ── Pay with Flutterwave ────────────────────────────────────────────────
  const startCardPayment = async () => {
    setSubmitting(true); setError("");
    try {
      const res = await apiClient("/boost/order/card", {
        method: "POST",
        body: { serviceId: svc.id, link: link.trim(), quantity: qtyNum },
      });
      if (res?.success && res.data?.url) {
        verifyingRef.current = false;
        setPayError("");
        setPayStep("webview");
        setPay({
          url: res.data.url,
          reference: res.data.reference,
          amountNgn: res.data.amountNgn,
          name: svc.name,
          qty: qtyNum,
        });
        if (Platform.OS === "web") window.open(res.data.url, "_blank");
      } else {
        setError(res?.message || "We couldn't start the payment. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setConfirming(false);
      setSubmitting(false);
    }
  };

  const verifyCard = async () => {
    if (!pay || verifyingRef.current) return;
    verifyingRef.current = true;
    setPayStep("verifying");
    setPayError("");
    try {
      const res = await apiClient("/boost/order/card/verify", {
        method: "POST",
        body: { reference: pay.reference },
      });
      if (res?.success) {
        const done = pay;
        setPay(null);
        finishPlaced("Payment received", `${n0(done.qty)} × ${done.name} · ₦${n0(done.amountNgn)}`, res.message);
        if (onRefreshUser) onRefreshUser();
      } else {
        setPayError(res?.message || "Payment not confirmed yet. If you completed it, wait a moment and tap again.");
        setPayStep("webview");
        verifyingRef.current = false;
      }
    } catch {
      setPayError("Network error while checking the payment. Tap again.");
      setPayStep("webview");
      verifyingRef.current = false;
    }
  };

  const closePay = () => {
    setPay(null);
    setPayError("");
    // If the user already paid, the order is still processed automatically.
    setTab("orders");
  };

  const onConfirmPress = () => (payMethod === "balance" ? placeOrder() : startCardPayment());

  const ctaLabel =
    link.trim().length <= 8 ? "Enter your link" : !qtyOk ? "Enter a quantity" : "Review order";

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <View>
            <Text style={{ fontFamily: fonts.black, fontSize: 24, color: C.dark, letterSpacing: -0.5 }}>Boost</Text>
            <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Grow your social accounts</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ backgroundColor: C.greenSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: C.green }}>Balance</Text>
              <Text style={{ fontFamily: fonts.black, fontSize: 15, color: C.green }}>{money(balance)}</Text>
            </View>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={[S.closeBtn, { backgroundColor: C.bg }]}>
                <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: C.bg, borderRadius: 14, padding: 3 }}>
          {[{ k: "order", l: "New order" }, { k: "orders", l: "My orders" }].map((t) => (
            <TouchableOpacity key={t.k} onPress={() => setTab(t.k)} activeOpacity={0.8}
              style={[S.tab, tab === t.k && { backgroundColor: C.card }]}>
              <Text style={{ fontFamily: tab === t.k ? fonts.bold : fonts.semibold, fontSize: 12, color: tab === t.k ? C.dark : C.muted }}>
                {t.l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── NEW ORDER ─── */}
      {tab === "order" && (
        loading ? (
          <View style={S.center}><ActivityIndicator color={C.blue} size="large" /></View>
        ) : !enabled || services.length === 0 ? (
          <View style={S.center}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🛠️</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: C.dark, marginBottom: 6 }}>Boost isn't available right now</Text>
            <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 }}>
              We're getting services ready. Check back soon.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {placed && (
              <View style={[S.banner, { backgroundColor: C.greenSoft, borderColor: "#A7F3D0" }]}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#065F46" }}>{placed.title}</Text>
                <Text style={{ fontSize: 12, color: "#065F46", marginTop: 3, lineHeight: 18 }}>{placed.text}</Text>
                {!!placed.note && (
                  <Text style={{ fontSize: 12, color: "#065F46", marginTop: 3, lineHeight: 18 }}>{placed.note}</Text>
                )}
                <TouchableOpacity onPress={() => { setPlaced(null); setTab("orders"); }} style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: C.blue }}>Track this order</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Platform */}
            <Text style={[S.label, { color: C.muted }]}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 16 }}>
              {platforms.map((p) => {
                const on = platform === p;
                const meta = PLATFORMS[p] || PLATFORMS.other;
                return (
                  <TouchableOpacity key={p} onPress={() => pickPlatform(p)} activeOpacity={0.8}
                    style={[S.chip, { backgroundColor: on ? C.blue : C.card, borderColor: on ? C.blue : C.border }]}>
                    <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: on ? "#FFF" : C.muted }}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Service */}
            <Text style={[S.label, { color: C.muted }]}>Service</Text>
            {platformServices.map((s) => {
              const on = svc?.id === s.id;
              return (
                <TouchableOpacity key={s.id} onPress={() => { setSvc(s); setQty(""); setError(""); }} activeOpacity={0.85}
                  style={[S.svcCard, { backgroundColor: on ? C.blueSoft : C.card, borderColor: on ? C.blue : C.border }]}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark, lineHeight: 19 }}>{s.name}</Text>
                    <Text style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                      {n0(s.min)} to {n0(s.max)}{s.refill ? "  ·  Refill included" : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.green }}>{money(s.pricePer1000Usd)}</Text>
                    <Text style={{ fontSize: 10, color: C.slate }}>per 1,000</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Link + quantity */}
            {svc && (
              <View style={{ marginTop: 10 }}>
                <Text style={[S.label, { color: C.muted }]}>Link</Text>
                <View style={[S.input, { backgroundColor: C.card, borderColor: C.border }]}>
                  <TextInput
                    style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: C.dark }}
                    placeholder={`Paste your ${(PLATFORMS[svc.platform] || PLATFORMS.other).label} link`}
                    placeholderTextColor={C.slate}
                    value={link} onChangeText={(v) => { setLink(v); setError(""); }}
                    autoCapitalize="none" autoCorrect={false} keyboardType="url"
                  />
                </View>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 14 }}>
                  The account or post must be public.
                </Text>

                <Text style={[S.label, { color: C.muted }]}>Quantity</Text>
                <View style={[S.input, { backgroundColor: C.card, borderColor: qty && !qtyOk ? C.red : C.border }]}>
                  <TextInput
                    style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: C.dark }}
                    placeholder={`${n0(svc.min)} to ${n0(svc.max)}`}
                    placeholderTextColor={C.slate}
                    value={qty} onChangeText={(v) => { setQty(v.replace(/[^0-9]/g, "")); setError(""); }}
                    keyboardType="numeric"
                  />
                </View>
                {qty !== "" && !qtyOk && (
                  <Text style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
                    Enter a quantity between {n0(svc.min)} and {n0(svc.max)}.
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {quickQty.map((q) => (
                    <TouchableOpacity key={q} onPress={() => { setQty(String(q)); setError(""); }}
                      style={[S.qChip, { backgroundColor: C.card, borderColor: C.border }]}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: C.dark }}>{n0(q)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Total */}
                {qtyOk && (
                  <View style={[S.summary, { backgroundColor: C.goldSoft, borderColor: "#FDE68A" }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }}>Estimated total</Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontFamily: fonts.black, fontSize: 20, color: C.blue }}>{money(cost)}</Text>
                        <Text style={{ fontSize: 11, color: C.muted }}>≈ ₦{n0(costNgn)}</Text>
                      </View>
                    </View>
                    {!canBalance && (
                      <Text style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 18 }}>
                        Your balance ({money(balance)}) is lower than this order. You can pay with a card or bank transfer instead.
                      </Text>
                    )}
                  </View>
                )}

                {!!error && (
                  <View style={[S.banner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA", marginTop: 12 }]}>
                    <Text style={{ fontSize: 13, color: "#B91C1C", lineHeight: 19 }}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[S.cta, { backgroundColor: canOrder ? C.blue : "#CBD5E1" }]}
                  disabled={!canOrder} activeOpacity={0.85} onPress={openConfirm}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFF" }}>{ctaLabel}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 17 }}>
                  Delivery times vary and results aren't guaranteed. Undelivered amounts are refunded to your balance.
                </Text>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* ─── MY ORDERS ─── */}
      {tab === "orders" && (
        ordersLoading && orders.length === 0 ? (
          <View style={S.center}><ActivityIndicator color={C.blue} size="large" /></View>
        ) : orders.length === 0 ? (
          <View style={S.center}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: C.dark, marginBottom: 6 }}>No orders yet</Text>
            <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 }}>
              Place your first order from the New order tab.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(true); }} />}>
            {orders.map((o) => {
              const st = STATUS_META[o.status] || STATUS_META.pending;
              const meta = PLATFORMS[o.platform] || PLATFORMS.other;
              return (
                <View key={o.id} style={[S.orderCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }} numberOfLines={2}>{o.serviceName}</Text>
                      <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{meta.icon} {n0(o.quantity)}</Text>
                    </View>
                    <View style={{ backgroundColor: st.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.dot }} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: st.color }}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: C.slate, marginBottom: 8 }} numberOfLines={1}>{shortLink(o.link)}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: C.slate }}>{fmtDate(o.createdAt)}</Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.dark }}>
                        {o.paymentMethod === "card" && o.chargeNgn ? `₦${n0(o.chargeNgn)}` : money(o.chargeUsd)}
                      </Text>
                      {o.refundedUsd > 0 && (
                        <Text style={{ fontSize: 11, color: C.green }}>{money(o.refundedUsd)} refunded to balance</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )
      )}

      {/* ─── CONFIRM SHEET ─── */}
      <Modal visible={confirming} animationType="slide" transparent onRequestClose={() => !submitting && setConfirming(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Platform.OS === "ios" ? 40 : 26 }}>
            <Text style={{ fontFamily: fonts.black, fontSize: 19, color: C.dark, marginBottom: 14 }}>Confirm your order</Text>
            {svc && [
              { l: "Service",  v: svc.name },
              { l: "Quantity", v: n0(qtyNum) },
              { l: "Link",     v: shortLink(link) },
              { l: "Total",    v: payMethod === "card" ? `₦${n0(costNgn)}` : money(cost) },
            ].map((r, i, a) => (
              <View key={r.l} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: i < a.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 13, color: C.muted }}>{r.l}</Text>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.dark, flex: 1, textAlign: "right", marginLeft: 12 }} numberOfLines={2}>{r.v}</Text>
              </View>
            ))}

            {/* Payment method */}
            <Text style={[S.label, { color: C.muted, marginTop: 16 }]}>Pay with</Text>
            {[
              {
                k: "balance", title: "PromoEarn balance",
                sub: canBalance ? `Available ${money(balance)}` : `Balance too low (${money(balance)})`,
                amt: money(cost), off: !canBalance,
              },
              {
                k: "card", title: "Card or bank transfer",
                sub: canCard ? "Secure checkout by Flutterwave" : `Card payments start at ₦${n0(minCardNgn)}`,
                amt: `₦${n0(costNgn)}`, off: !canCard,
              },
            ].map((m) => {
              const on = payMethod === m.k;
              return (
                <TouchableOpacity key={m.k} disabled={m.off} activeOpacity={0.85}
                  onPress={() => { setPayMethod(m.k); setError(""); }}
                  style={[S.payOpt, {
                    borderColor: on ? C.blue : C.border,
                    backgroundColor: on ? C.blueSoft : C.card,
                    opacity: m.off ? 0.45 : 1,
                  }]}>
                  <View style={[S.radio, { borderColor: on ? C.blue : C.slate }]}>
                    {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>{m.title}</Text>
                    <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.sub}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: C.dark }}>{m.amt}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 17 }}>
              {payMethod === "balance"
                ? "The amount is taken from your balance now. "
                : "You'll pay on the next screen. If we can't deliver, the refund goes to your PromoEarn balance. "}
              Check the link before you confirm, because orders can't be edited.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity disabled={submitting} onPress={() => setConfirming(false)}
                style={[S.backBtn, { borderColor: C.border }]}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.dark }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={submitting} onPress={onConfirmPress} activeOpacity={0.85}
                style={[S.cta, { flex: 1, marginTop: 0, backgroundColor: C.blue, opacity: submitting ? 0.7 : 1 }]}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFF" }}>
                    {payMethod === "balance" ? "Place order" : "Continue to payment"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── FLUTTERWAVE CHECKOUT ─── */}
      <Modal visible={!!pay} animationType="slide" transparent onRequestClose={closePay}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: "92%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontFamily: fonts.black, fontSize: 17, color: C.dark }}>Pay for your boost</Text>
                {pay && (
                  <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }} numberOfLines={1}>
                    {n0(pay.qty)} × {pay.name} · ₦{n0(pay.amountNgn)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closePay} style={[S.closeBtn, { backgroundColor: C.bg }]}>
                <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {pay && payStep === "verifying" && (
              <View style={S.center}>
                <ActivityIndicator size="large" color={C.blue} />
                <Text style={{ marginTop: 12, color: C.muted }}>Confirming your payment…</Text>
              </View>
            )}

            {pay && payStep === "webview" && Platform.OS !== "web" && (
              <>
                <WebView
                  source={{ uri: pay.url }}
                  style={{ flex: 1 }}
                  startInLoadingState
                  onNavigationStateChange={(nav) => {
                    // Flutterwave sends the user to <CLIENT_URL>/payment-success when done
                    if (nav?.url && nav.url.includes("payment-success")) verifyCard();
                  }}
                />
                {!!payError && (
                  <Text style={{ color: C.red, textAlign: "center", paddingHorizontal: 16, paddingTop: 8, fontSize: 12 }}>{payError}</Text>
                )}
                <TouchableOpacity onPress={verifyCard}
                  style={{ margin: 16, backgroundColor: C.blue, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#FFF", fontFamily: fonts.bold, fontSize: 15 }}>I've completed payment</Text>
                </TouchableOpacity>
              </>
            )}

            {pay && payStep === "webview" && Platform.OS === "web" && (
              <View style={S.center}>
                <Text style={{ textAlign: "center", color: C.muted, marginBottom: 16, lineHeight: 20 }}>
                  Complete your payment in the tab that opened. When you're done, tap below.
                </Text>
                {!!payError && <Text style={{ color: C.red, textAlign: "center", marginBottom: 12, fontSize: 12 }}>{payError}</Text>}
                <TouchableOpacity onPress={verifyCard}
                  style={{ backgroundColor: C.blue, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}>
                  <Text style={{ color: "#FFF", fontFamily: fonts.bold }}>I've completed payment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  header:    { paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 56 : 40, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn:  { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tab:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 11 },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  label:     { fontSize: 11, fontWeight: "600", letterSpacing: 0.4, marginBottom: 8 },
  chip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1.5 },
  svcCard:   { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  input:     { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14 },
  qChip:     { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7 },
  summary:   { borderRadius: 14, borderWidth: 1.5, padding: 16, marginTop: 16 },
  banner:    { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  cta:       { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 16 },
  backBtn:   { height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  orderCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  payOpt:    { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});