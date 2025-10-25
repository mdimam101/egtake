// components/BenefitsBar.js
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🔒 Local image map (require must be static)
const ICONS = {
  cod: require("../../assets/images/icons8-cash-on-delivery-32.png"),
  return: require("../../assets/images/icons8-order-return-32.png"),
  points: require("../../assets/images/icons8-coming-soon-32.png"), // ← coin icon (create if not present)
  // fallback: if you don't have coin file yet, temporarily use return icon:
  // points: require("../../assets/images/icons8-order-return-32.png"),
};

export default function BenefitsBar({
  onPressCOD,
  onPressReturn,
  onPressPoints,
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      <BenefitItem
        iconSource={ICONS.cod}
        title="Cash On Delivery"
        onPress={onPressCOD}
      />

      <View style={styles.divider} />

      <BenefitItem
        iconSource={ICONS.return}
        title={"7 Days\nHappy Return"}
        onPress={onPressReturn}
      />

      <View style={styles.divider} />

      <BenefitItem
        iconSource={ICONS.points}
        title={'comming soon'}//{"Purchase and\nEarn point"}
        onPress={onPressPoints}
      />
    </View>
  );
}

function BenefitItem({ iconSource, title, onPress }) {
  const Content = (
    <View style={styles.itemInner}>
      <View style={styles.iconWrap}>
        <Image
          source={iconSource}
          style={styles.icon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.item}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {Content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.item}>{Content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  itemInner: {
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 44,
    height: 34,
    // borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 30,
    height: 30,
  },
  title: {
    textAlign: "center",
    color: "#535456ff",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 18,
    // paddingBottom:15
  },
  divider: {
    width: 1,
    backgroundColor: "#E6E7EA",
    marginVertical: 4,
  },
});
