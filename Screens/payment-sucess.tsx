import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

const BASE_URL = "http://localhost:5000/api/v1";

export default function PaymentSuccess() {
  const router    = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [success,   setSuccess]   = useState(false);
  const [message,   setMessage]   = useState("");

  useEffect(() => { verifyPayment(); }, []);

  const verifyPayment = async () => {
    try {
      const params    = new URLSearchParams(window.location.search);
      const reference = params.get("reference") || params.get("trxref");

      if (!reference) {
        setMessage("No payment reference found. Please contact support.");
        setVerifying(false);
        return;
      }

      const res  = await fetch(`${BASE_URL}/payments/verify-payment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setMessage(data.message || "Payment verification failed.");
      }
    } catch {
      setMessage("Network error. Please contact support.");
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    router.replace("/");
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        {verifying ? (
          <>
            <ActivityIndicator size="large" color="#1A56DB" style={{ marginBottom:20 }} />
            <Text style={s.title}>Verifying Payment...</Text>
            <Text style={s.sub}>Please wait while we confirm your payment.</Text>
          </>
        ) : success ? (
          <>
            <Text style={s.emoji}>🎉</Text>
            <Text style={s.title}>Account Activated!</Text>
            <Text style={s.sub}>
              Your $0.33 (₦500) welcome bonus has been added to your balance. Start earning now!
            </Text>
            <TouchableOpacity style={s.btn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={s.btnTxt}>Start Earning →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.emoji}>❌</Text>
            <Text style={s.title}>Payment Failed</Text>
            <Text style={s.sub}>{message}</Text>
            <TouchableOpacity style={[s.btn, { backgroundColor:"#64748B" }]} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={s.btnTxt}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:"#F8FAFF", alignItems:"center", justifyContent:"center", padding:32 },
  card:      { backgroundColor:"#ffffff", borderRadius:24, padding:32, alignItems:"center", width:"100%", maxWidth:400, shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.1, shadowRadius:24, elevation:10 },
  emoji:     { fontSize:48, marginBottom:16 },
  title:     { fontSize:22, fontWeight:"800", color:"#0F172A", marginBottom:10, textAlign:"center" },
  sub:       { fontSize:14, color:"#64748B", textAlign:"center", lineHeight:22, marginBottom:24 },
  btn:       { backgroundColor:"#1A56DB", borderRadius:14, height:52, paddingHorizontal:32, alignItems:"center", justifyContent:"center" },
  btnTxt:    { fontSize:15, fontWeight:"700", color:"#ffffff" },
});