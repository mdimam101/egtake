// components/ProductQualityViz.js
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const TIERS = ["normal", "good", "premium", "luxury"];
const LABELS = ["Normal", "Good", "Premium", "Luxury"];
const ICONS  = ["●", "★", "✨", "👑"];

// Colors
const GREEN = "#1E8E3E";
const GREEN_BG = "rgba(30,142,62,0.5)";
const GRAY = "#E5E8EC";
const LABEL_INACTIVE = "#9AA0A6";
const LABEL_ACTIVE = GREEN;

export default function ProductQualityViz({
  PQualityType,
  style,
  trackHeight = 8,
}) {
  // active index same as before
  const activeIndex = useMemo(() => {
    const i = TIERS.indexOf(String(PQualityType).toLowerCase());
    return i >= 0 ? i : 2; // default premium
  }, [PQualityType]);

  // animations (keep pulse + label pop)
  const pulse = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // pulse loop for active dot
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // label bounce
    labelScale.setValue(0.92);
    Animated.spring(labelScale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, pulse, labelScale]);

  const micro =
    activeIndex === 0 ? "● Made for daily use — reliable basics." :
    activeIndex === 1 ? "★ Good materials and cleaner finishing." :
    activeIndex === 2 ? "✨ High-quality materials with better finishing and \n　　comfortable." :
                        "👑 Super high-quality materials with careful,\n　　expert finishing.";

  // halo anim values
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.3] });

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.heading}>Quality Visualization</Text>

      {/* Track: revert to old segmented style (static fill per segment) */}
      <View style={styles.trackWrap}>
        <View style={[styles.track, { height: trackHeight }]}>
          {LABELS.map((_, idx) => {
            const filled = idx <= activeIndex;
            return (
              <View
                key={`seg-${idx}`}
                style={[
                  styles.segment,
                  {
                    backgroundColor: filled ? GREEN : GRAY,
                    height: trackHeight,
                    marginHorizontal: 6 / 2, // small gap like before
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Stops + labels + pulse on active */}
        <View style={styles.stopsRow}>
          {LABELS.map((label, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View key={`stop-${idx}`} style={styles.stopCell}>
                {/* Dot with pulsing halo only for active */}
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  {isActive && (
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: GREEN_BG,
                        transform: [{ scale: haloScale }],
                        opacity: haloOpacity,
                      }}
                    />
                  )}
                  <View
                    style={[
                      styles.stopDot,
                      {
                        borderColor: isActive ? GREEN : GRAY,
                        backgroundColor: isActive ? GREEN_BG : "#fff",
                      },
                    ]}
                  />
                </View>

                {/* Icon + label (active scales up) */}
                <Animated.Text
                  numberOfLines={1}
                  style={[
                    styles.stopLabel,
                    {
                      color: isActive ? LABEL_ACTIVE : LABEL_INACTIVE,
                      transform: [{ scale: isActive ? labelScale : 1 }],
                    },
                  ]}
                >
                  {ICONS[idx]} {label}
                </Animated.Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Microcopy */}
      <Text style={styles.micro}>{micro}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // premium-looking card
  card: {
    padding:10,
    borderRadius: 14,
    backgroundColor: "#fefff5ff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 8,
  },
  heading: { fontSize: 16, fontWeight: "700", color: "#1C1D1F" },

  trackWrap: { marginTop: 4 },
  track: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  segment: { flex: 1, borderRadius: 999 },

  // stops & labels
  stopsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stopCell: { width: "25%", alignItems: "center" },
  stopDot: { width: 12, height: 12, borderRadius: 999, borderWidth: 2 },
  stopLabel: { marginTop: 6, fontSize: 12, fontWeight: "700", letterSpacing: 0.2 },

  micro: { marginTop: 8, color: "#3A3D40", fontSize: 13 },
});
