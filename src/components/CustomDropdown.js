// ✅ Custom Dropdown component
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AREA = [
  { label: "Dhaka", value: "Dhaka", priority: true },
  { label: "Narayanganj", value: "Narayanganj", priority: true },
  ...[
    "Bagerhat",
    "Bandarban",
    "Barguna",
    "Barisal",
    "Bhola",
    "Bogra",
    "Brahmanbaria",
    "Chandpur",
    "Chapainawabganj",
    "Chittagong",
    "Chuadanga",
    "Comilla",
    "Cox's Bazar",
    "Dinajpur",
    "Faridpur",
    "Feni",
    "Gaibandha",
    "Gazipur",
    "Gopalganj",
    "Habiganj",
    "Jamalpur",
    "Jessore",
    "Jhalokati",
    "Jhenaidah",
    "Joypurhat",
    "Khagrachhari",
    "Khulna",
    "Kishoreganj",
    "Kurigram",
    "Kushtia",
    "Lakshmipur",
    "Lalmonirhat",
    "Madaripur",
    "Magura",
    "Manikganj",
    "Maulvibazar",
    "Meherpur",
    "Munshiganj",
    "Mymensingh",
    "Naogaon",
    "Narail",
    "Narsingdi",
    "Natore",
    "Netrokona",
    "Nilphamari",
    "Noakhali",
    "Pabna",
    "Panchagarh",
    "Patuakhali",
    "Pirojpur",
    "Rajbari",
    "Rajshahi",
    "Rangamati",
    "Rangpur",
    "Satkhira",
    "Shariatpur",
    "Sherpur",
    "Sirajganj",
    "Sunamganj",
    "Sylhet",
    "Tangail",
    "Thakurgaon",
  ].map((district) => ({ label: district, value: district })),
];

const CustomDropdown = ({ selected, onSelect, style, disabled = false }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[
          styles.dropdownContainer,
          style,
          disabled && styles.dropdownDisabled,
        ]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Select delivery area"
        accessibilityState={{ disabled, expanded: visible }}
      >
        <View style={styles.dropdownIcon}>
          <Ionicons name="map-outline" size={18} color="#64748b" />
        </View>
        <Text
          style={[styles.dropdownText, !selected && styles.placeholderText]}
        >
          {selected || "Choose your delivery area"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select delivery area</Text>
            <FlatList
              data={AREA}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator
              persistentScrollbar
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selected === item.value && styles.selectedItem,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#1d4ed8"
                    />
                  </View>
                  <Text style={styles.itemText}>{item.label}</Text>
                  {item.priority && selected !== item.value && (
                    <Text style={styles.priorityText}>Popular</Text>
                  )}
                  {selected === item.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#1d4ed8"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  dropdownContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dropdownDisabled: { opacity: 0.65 },
  dropdownIcon: { marginRight: 10 },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
  },
  placeholderText: { color: "#999" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    maxHeight: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    elevation: 12,
  },
  modalHandle: {
    width: 42,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  listContent: { paddingBottom: 8 },
  item: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  selectedItem: { backgroundColor: "#eff6ff", borderRadius: 12 },
  itemIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#eff6ff",
    marginRight: 10,
  },
  itemText: { flex: 1, color: "#1e293b", fontSize: 15, fontWeight: "600" },
  priorityText: {
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "700",
    marginRight: 8,
  },
});
