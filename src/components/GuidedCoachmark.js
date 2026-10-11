import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const AUTO_DISMISS_MS = 9000;

const GuidedCoachmark = ({
  enabled,
  message,
  bottom = 76,
  right = 12,
  width = 250,
  targetRight = 0,
  delay = 450,
}) => {
  const [visible, setVisible] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const shownThisMount = useRef(false);

  useEffect(() => {
    let alive = true;
    let showTimer;
    let hideTimer;

    if (!enabled || shownThisMount.current) return undefined;

    showTimer = setTimeout(() => {
      if (!alive) return;
      shownThisMount.current = true;
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    }, delay);

    return () => {
      alive = false;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [delay, enabled]);

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      return undefined;
    }

    Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 65,
      useNativeDriver: true,
    }).start();

    return undefined;
  }, [entrance, visible]);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { bottom, right, width }]}
    >
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
              { scale: entrance },
            ],
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="hand-left-outline" size={21} color="#1d4ed8" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>সহজ ধাপ</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="সহায়তা বার্তা বন্ধ করুন"
          hitSlop={10}
          onPress={dismiss}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={17} color="#64748b" />
        </Pressable>
      </Animated.View>
      <View
        style={[styles.pointer, { right: Math.max(24, targetRight + 44) }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: { position: "absolute", zIndex: 5000, elevation: 30 },
  bubble: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#eff6ff",
  },
  copy: { flex: 1, marginHorizontal: 10 },
  eyebrow: {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  message: {
    color: "#1e293b",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  closeButton: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  pointer: {
    position: "absolute",
    bottom: -9,
    width: 18,
    height: 18,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#bfdbfe",
    transform: [{ rotate: "45deg" }],
  },
});

export default GuidedCoachmark;
