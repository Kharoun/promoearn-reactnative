// PayoutMethodsscreen.jsx
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Platform, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Line, Polyline } from "react-native-svg";
import { fonts } from "../utils/typography";


const Ico = {
  Bank: ({ sz = 20, cl = "#64748B" }) => (
    <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="3" y1="22" x2="21" y2="22" /><Line x1="6" y1="18" x2="6" y2="11" />
      <Line x1="10" y1="18" x2="10" y2="11" /><Line x1="14" y1="18" x2="14" y2="11" />
      <Line x1="18" y1="18" x2="18" y2="11" /><Polyline points="12 2 2 7 22 7" />
    </Svg>
  ),
  Plus: ({ sz = 18, cl = "#FFFFFF" }) => (
    <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  ),
  Trash: ({ sz = 16, cl = "#EF4444" }) => (
    <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  ),
  Check: ({ sz = 16, cl = "#10B981" }) => (
    <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers — used by WithdrawForm inside MainApp.jsx
// ─────────────────────────────────────────────────────────────────────────────
export const PAYOUT_KEY = (uid) => `pe_payout_accounts_${uid}`;

export const loadSavedAccounts = async (uid) => {
  if (!uid) return [];
  try {
    const raw = await AsyncStorage.getItem(PAYOUT_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const persistAccounts = async (uid, accounts) => {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(PAYOUT_KEY(uid), JSON.stringify(accounts));
  } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PayoutMethodsScreen({ visible, onClose, user, C: CProp }) {
  const C = CProp || { blue:"#1A56DB", dark:"#0F172A", white:"#FFFFFF", green:"#10B981", gold:"#F59E0B", red:"#EF4444", light:"#F8FAFF", muted:"#64748B", border:"#E2E8F0" };
  const st = makeStyles(C);
  const [accounts, setAccounts] = useState([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ accountNumber: "", bankName: "", accountName: "" });
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const uid = user?.uid;

  useEffect(() => {
    if (!visible) return;
    if (!uid) return;
    setLoading(true);
    loadSavedAccounts(uid).then((accs) => {
      setAccounts(accs);
      setLoading(false);
    });
  }, [visible, uid]);

  const handleAdd = async () => {
    const { accountNumber, bankName, accountName } = form;
    if (!accountNumber || !bankName || !accountName) {
      Alert.alert("Missing Fields", "Please fill in all three fields."); return;
    }
    if (accountNumber.length < 10) {
      Alert.alert("Invalid Number", "Account number must be 10 digits."); return;
    }
    if (accounts.find(a => a.accountNumber === accountNumber)) {
      Alert.alert("Already Saved", "This account number is already saved."); return;
    }
    setSaving(true);
    try {
      const newAcc = {
        id: Date.now().toString(),
        accountNumber,
        bankName,
        accountName,
        isDefault: accounts.length === 0,
        addedAt: new Date().toISOString(),
      };
      const updated = [...accounts, newAcc];
      await persistAccounts(uid, updated);
      setAccounts(updated);
      setForm({ accountNumber: "", bankName: "", accountName: "" });
      setShowAdd(false);
      Alert.alert("✅ Saved", `${bankName} account saved. Select it in the withdrawal form.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    const acc = accounts.find(a => a.id === id);
    Alert.alert("Remove Account", `Remove ${acc?.bankName} ···${acc?.accountNumber?.slice(-4)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          let updated = accounts.filter(a => a.id !== id);
          if (acc?.isDefault && updated.length > 0) updated[0].isDefault = true;
          await persistAccounts(uid, updated);
          setAccounts(updated);
        },
      },
    ]);
  };

  const handleSetDefault = async (id) => {
    const updated = accounts.map(a => ({ ...a, isDefault: a.id === id }));
    await persistAccounts(uid, updated);
    setAccounts(updated);
  };

  const mask = (num) => num ? `${"•".repeat(num.length - 4)}${num.slice(-4)}` : "";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.sheet}>
          <View style={st.handle} />
          <View style={st.header}>
            <Text style={st.title}>Payout Methods</Text>
            <TouchableOpacity onPress={onClose} style={st.closeBtn}>
              <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: C.blue+"18", borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: "row", gap: 10 }}>
              <Ico.Bank sz={18} cl={C.blue} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.dark }}>Save Bank Accounts</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 18 }}>
                  Saved accounts appear in the withdrawal form — no need to retype details each time.
                </Text>
              </View>
            </View>

            {loading ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", paddingVertical: 30 }}>
                Loading...
              </Text>
            ) : accounts.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                               <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.blue+"18", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Ico.Bank sz={28} cl={C.blue} />
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: C.dark }}>No accounts yet</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, marginTop: 4, textAlign: "center", lineHeight: 20 }}>
                  Tap the button below to add your{"\n"}first bank account.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12, marginBottom: 20 }}>
                {accounts.map(acc => (
                  <View key={acc.id} style={{
                    backgroundColor: C.card||C.white||"#FFF", borderRadius: 16, padding: 16,
                    borderWidth: acc.isDefault ? 2 : 1,
                    borderColor: acc.isDefault ? C.blue : C.border,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.blue + "18", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        <Text style={{ fontFamily: fonts.black, fontSize: 12, color: C.blue }}>
                          {acc.bankName.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>{acc.bankName}</Text>
                          {acc.isDefault && (
                             <View style={{ backgroundColor: C.blue+"18", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                              <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: C.blue }}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted }}>{acc.accountName}</Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2, letterSpacing: 1 }}>
                          {mask(acc.accountNumber)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(acc.id)} style={{ padding: 6 }}>
                        <Ico.Trash />
                      </TouchableOpacity>
                    </View>
                    {!acc.isDefault ? (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(acc.id)}
                        style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, alignItems: "center" }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.blue }}>Set as Default</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Ico.Check sz={13} cl={C.green} />
                        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: C.green }}>Used by default in withdrawals</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={{ backgroundColor: C.blue, borderRadius: 14, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
              onPress={() => setShowAdd(true)} activeOpacity={0.85}>
              <Ico.Plus />
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>Add Bank Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Add Account Sheet */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={st.overlay}>
          <View style={[st.sheet, { paddingHorizontal: 20, paddingBottom: 40 }]}>
            <View style={st.handle} />
            <View style={st.header}>
              <Text style={st.title}>Add Bank Account</Text>
              <TouchableOpacity onPress={() => { setShowAdd(false); setForm({ accountNumber: "", bankName: "", accountName: "" }); }} style={st.closeBtn}>
                <Text style={{ fontSize: 18, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              { lbl: "Account Number", key: "accountNumber", numeric: true,  placeholder: "10-digit account number", maxLen: 10 },
              { lbl: "Bank Name",      key: "bankName",      numeric: false, placeholder: "e.g. GTBank, Access Bank, Opay" },
              { lbl: "Account Name",   key: "accountName",   numeric: false, placeholder: "As it appears on your bank account" },
            ].map((field, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {field.lbl}
                </Text>
                <View style={{ backgroundColor: C.light, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, height: 50, paddingHorizontal: 14, justifyContent: "center" }}>
                  <TextInput
                    style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark }}
                    placeholder={field.placeholder}
                    placeholderTextColor="#CBD5E1"
                    keyboardType={field.numeric ? "numeric" : "default"}
                    maxLength={field.maxLen}
                    value={form[field.key]}
                    onChangeText={v =>
                      setForm(prev => ({ ...prev, [field.key]: field.numeric ? v.replace(/\D/g, "") : v }))
                    }
                  />
                </View>
                {field.key === "accountNumber" && form.accountNumber.length > 0 && form.accountNumber.length < 10 && (
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.gold, marginTop: 4 }}>
                    {10 - form.accountNumber.length} more digit{10 - form.accountNumber.length !== 1 ? "s" : ""} needed
                  </Text>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={{
                backgroundColor: form.accountNumber.length === 10 && form.bankName && form.accountName && !saving
                  ? C.green : C.border,
                borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", marginTop: 8,
              }}
              onPress={handleAdd}
              disabled={saving || form.accountNumber.length !== 10 || !form.bankName || !form.accountName}
              activeOpacity={0.85}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.white }}>
                {saving ? "Saving..." : "Save Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const makeStyles = (C) => ({
  overlay: { flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" },
  sheet:   { backgroundColor:C.card||C.white||"#FFFFFF", borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"92%", paddingBottom:Platform.OS==="ios"?44:28 },
  handle:  { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 },
  header:  { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  title:   { fontFamily:fonts.black, fontSize:18, color:C.dark },
  closeBtn:{ width:34, height:34, borderRadius:17, backgroundColor:C.bg||C.light||"#F8FAFF", alignItems:"center", justifyContent:"center" },
});