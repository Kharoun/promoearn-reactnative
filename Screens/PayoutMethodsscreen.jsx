import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Platform, Alert,
} from "react-native";
import Svg, { Path, Line, Polyline, Circle } from "react-native-svg";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";

const BASE_URL = "http://localhost:5000/api/v1";
const C = {
  blue:"#1A56DB", dark:"#0F172A", white:"#FFFFFF", green:"#10B981",
  gold:"#F59E0B", red:"#EF4444", light:"#F8FAFF", muted:"#64748B", border:"#E2E8F0",
};

const api = async (endpoint, options = {}) => {
  const token = AuthService.getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

const Ico = {
  Bank: ({sz=20,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="3" y1="22" x2="21" y2="22"/><Line x1="6" y1="18" x2="6" y2="11"/><Line x1="10" y1="18" x2="10" y2="11"/><Line x1="14" y1="18" x2="14" y2="11"/><Line x1="18" y1="18" x2="18" y2="11"/><Polyline points="12 2 2 7 22 7"/></Svg>,
  Plus: ({sz=18,cl=C.white}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="12" y1="5" x2="12" y2="19"/><Line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  Trash: ({sz=16,cl=C.red}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="3 6 5 6 21 6"/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Svg>,
  Check: ({sz=16,cl=C.green}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>,
};

export default function PayoutMethodsScreen({ visible, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ accountNumber:"", bankName:"", accountName:"" });
  const [saving,   setSaving]   = useState(false);

  const handleAdd = async () => {
    if (!form.accountNumber || !form.bankName || !form.accountName) {
      Alert.alert("Please fill all fields"); return;
    }
    setSaving(true);
    try {
      // Save locally for now — can be saved to backend
      setAccounts(prev => [...prev, { ...form, id: Date.now().toString(), isDefault: prev.length === 0 }]);
      setForm({ accountNumber:"", bankName:"", accountName:"" });
      setShowAdd(false);
      Alert.alert("✅ Account Added", "Your payout account has been saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Remove Account", "Are you sure?", [
      { text:"Cancel", style:"cancel" },
      { text:"Remove", style:"destructive", onPress: () => setAccounts(prev => prev.filter(a => a.id !== id)) },
    ]);
  };

  const handleSetDefault = (id) => {
    setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.overlay}>
        <View style={st.sheet}>
          <View style={st.handle}/>
          <View style={st.header}>
            <Text style={st.title}>Payout Methods</Text>
            <TouchableOpacity onPress={onClose} style={st.closeBtn}>
              <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:40 }}>
            {/* Info banner */}
            <View style={{ backgroundColor:"#EEF4FF", borderRadius:14, padding:14, marginBottom:20, flexDirection:"row", gap:10 }}>
              <Ico.Bank sz={18} cl={C.blue}/>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>Nigerian Bank Accounts</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>
                  Add your bank account to receive withdrawals. Min. withdrawal is $3.50 (₦5,250).
                </Text>
              </View>
            </View>

            {/* Accounts list */}
            {accounts.length === 0 ? (
              <View style={{ alignItems:"center", paddingVertical:40 }}>
                <View style={{ width:64, height:64, borderRadius:32, backgroundColor:"#EEF4FF", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                  <Ico.Bank sz={28} cl={C.blue}/>
                </View>
                <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark }}>No accounts yet</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginTop:4, textAlign:"center" }}>
                  Add a bank account to start withdrawing your earnings.
                </Text>
              </View>
            ) : (
              <View style={{ gap:12, marginBottom:20 }}>
                {accounts.map(acc => (
                  <View key={acc.id} style={{ backgroundColor:C.white, borderRadius:16, padding:16, borderWidth:acc.isDefault?2:1, borderColor:acc.isDefault?C.blue:C.border }}>
                    <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:4 }}>
                          <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.dark }}>{acc.bankName}</Text>
                          {acc.isDefault && (
                            <View style={{ backgroundColor:"#EEF4FF", paddingHorizontal:8, paddingVertical:2, borderRadius:6 }}>
                              <Text style={{ fontFamily:fonts.bold, fontSize:10, color:C.blue }}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.muted }}>{acc.accountName}</Text>
                        <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>
                          {acc.accountNumber.replace(/(\d{4})/g, "$1 ").trim()}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(acc.id)} style={{ padding:4 }}>
                        <Ico.Trash/>
                      </TouchableOpacity>
                    </View>
                    {!acc.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(acc.id)}
                        style={{ marginTop:12, borderTopWidth:1, borderTopColor:C.border, paddingTop:10 }}>
                        <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.blue, textAlign:"center" }}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Add button */}
            <TouchableOpacity
              style={{ backgroundColor:C.blue, borderRadius:14, height:52, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}
              onPress={() => setShowAdd(true)} activeOpacity={0.85}>
              <Ico.Plus/>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.white }}>Add Bank Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Add Account Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={st.overlay}>
          <View style={[st.sheet, { paddingHorizontal:20, paddingBottom:40 }]}>
            <View style={st.handle}/>
            <View style={st.header}>
              <Text style={st.title}>Add Bank Account</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={st.closeBtn}>
                <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              { lbl:"Account Number", key:"accountNumber", numeric:true,  placeholder:"0123456789" },
              { lbl:"Bank Name",      key:"bankName",      numeric:false, placeholder:"e.g. GTBank, Access Bank" },
              { lbl:"Account Name",   key:"accountName",   numeric:false, placeholder:"As on your bank account" },
            ].map((field, i) => (
              <View key={i} style={{ marginBottom:16 }}>
                <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:0.4 }}>{field.lbl}</Text>
                <View style={{ backgroundColor:C.light, borderRadius:12, borderWidth:1.5, borderColor:C.border, height:50, paddingHorizontal:14, justifyContent:"center" }}>
                  <TextInput
                    style={{ fontFamily:fonts.medium, fontSize:14, color:C.dark }}
                    placeholder={field.placeholder} placeholderTextColor="#CBD5E1"
                    keyboardType={field.numeric?"numeric":"default"}
                    value={form[field.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [field.key]:v }))}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={{ backgroundColor:C.green, borderRadius:14, height:52, alignItems:"center", justifyContent:"center", marginTop:8, opacity:saving?0.7:1 }}
              onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.white }}>{saving?"Saving...":"Save Account"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" },
  sheet:    { backgroundColor:C.white, borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"90%", paddingBottom: Platform.OS==="ios"?44:28 },
  handle:   { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 },
  header:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  title:    { fontFamily:fonts.black, fontSize:18, color:C.dark },
  closeBtn: { width:34, height:34, borderRadius:17, backgroundColor:C.light, alignItems:"center", justifyContent:"center" },
});