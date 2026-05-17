import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { fonts } from "../utils/typography";
import { Image } from "react-native";

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.8)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const dotAnim1   = useRef(new Animated.Value(0.3)).current;
  const dotAnim2   = useRef(new Animated.Value(0.3)).current;
  const dotAnim3   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(taglineFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      const dotLoop = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ])
        ).start();

      dotLoop(dotAnim1, 0);
      dotLoop(dotAnim2, 200);
      dotLoop(dotAnim3, 400);

      setTimeout(() => onFinish(), 2800);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Image
  source={require("../assets/logo.png")}
  style={{ width: 84, height: 84, marginBottom: 20 }}
  resizeMode="contain"
/>
        <Text style={styles.appName}>
          Promo<Text style={styles.appNameAccent}>Earn</Text>
        </Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
        Promote. Complete. Earn.
      </Animated.Text>

      <View style={styles.dotsRow}>
        {[dotAnim1, dotAnim2, dotAnim3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle1: {
    position: "absolute",
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: "#EEF3FF", top: -70, right: -90,
  },
  bgCircle2: {
    position: "absolute",
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: "#F0F4FF", bottom: 80, left: -70,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontFamily: fonts.extrabold,
    fontSize: 38, color: "#0F172A", letterSpacing: -1,
  },
  appNameAccent: {
    fontFamily: fonts.extrabold,
    color: "#1A56DB",
  },
  tagline: {
    fontFamily: fonts.semibold,
    fontSize: 13, color: "#94A3B8",
    letterSpacing: 2.5, textTransform: "uppercase", marginTop: 8,
  },
  dotsRow: {
    flexDirection: "row", marginTop: 60, gap: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#1A56DB",
  },
});