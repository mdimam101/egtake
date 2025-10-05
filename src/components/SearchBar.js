import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import { trackBasic } from "../helper/trackBasic";

const PLACEHOLDER_COLOR = "#999";

// ---- Support config

const WHATSAPP_MSG = "Hi EgTake";

async function openWhats(phone, message = WHATSAPP_MSG) {
  try {
    const clean = String(phone).replace(/[^\d+]/g, "");
    const appUrl = `whatsapp://send?phone=${clean}&text=${encodeURIComponent(
      message
    )}`;
    const webUrl = `https://wa.me/${clean.replace(
      /^\+/,
      ""
    )}?text=${encodeURIComponent(message)}`;
    const can = await Linking.canOpenURL(appUrl);
    if (can) return Linking.openURL(appUrl);
    return Linking.openURL(webUrl);
  } catch {
    Toast.show({ type: "error", text1: "WhatsApp not available" });
  }
}

// ---- Dialer & WhatsApp helpers ----
async function openDialer(phone) {
  try {
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) return Linking.openURL(url);
    Toast.show({
      type: "error",
      text1: "Calling not supported on this device",
    });
  } catch {
    Toast.show({ type: "error", text1: "Unable to open dialer" });
  }
}

const SearchBar = ({ onOpenSupport }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeQuery = route.params?.query;

  const [searchQuery, setSearchQuery] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // 🔒 prevent double press

  useEffect(() => {
    if (routeQuery) {
      setSearchQuery(decodeURIComponent(routeQuery));
      setIsUserTyping(false);
      setIsSearching(false); // ✅ ensure button re-enables on route-driven fill
    }
  }, [routeQuery]);

  const handleSearch = () => {
    // 🔒 guard: ignore if already searching
    if (isSearching) return;

    const term = searchQuery.trim();
    if (!term) return;

    setIsSearching(true); // disable button immediately
    setSuggestions([]);
    setIsUserTyping(false);
    Keyboard.dismiss();

    navigation.navigate("SearchResult", {
      query: encodeURIComponent(term),
    });

    trackBasic("search", { term });

    // 👉 Re-enable will happen when user edits text next time.
    // (No logic change to navigation or tracking.)
  };

  const handleSuggestionClick = (text) => {
    setSearchQuery(text);
    setSuggestions([]);
    setIsUserTyping(false);
    setIsSearching(true); // prevent quick double tap after suggestion
    Keyboard.dismiss();
    navigation.navigate("SearchResult", {
      query: encodeURIComponent(text),
    });
    trackBasic("search", { term: text });
  };

  useEffect(() => {
    if (!isUserTyping || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(
          `${SummaryApi.searchSuggestion.url}?q=${searchQuery}`
        );
        if (res.data.success) {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        // silent
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, isUserTyping]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={searchQuery}
            placeholder="Search..."
            placeholderTextColor={PLACEHOLDER_COLOR}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsUserTyping(true);
              setIsSearching(false); // ✳️ editing re-enables the button
            }}
            onSubmitEditing={() => {
              if (!isSearching) handleSearch(); // ⛔ block while locked
            }}
            style={styles.input}
          />

          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setIsSearching(false); // re-enable after clear
              }}
              style={styles.clearIcon}
            >
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching} // 🔒 disable while searching
            style={[
              styles.searchIcon,
              isSearching && styles.searchIconDisabled,
            ]}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={styles.chatBtnInHome}
            onPress={onOpenSupport}
            activeOpacity={0.85}
          >
            <MaterialIcons name="support-agent" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      {suggestions.length > 0 && (
        <FlatList
          style={styles.suggestionList}
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSuggestionClick(item.productName)}
              style={styles.suggestionItem}
            >
              <Ionicons name="search-outline" size={16} color="#333" />
              <Text style={styles.suggestionText}>{item.productName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default SearchBar;

// Bottom sheet: Support (Call / WhatsApp)
export const SupportSheet = ({ visible, onClose }) => {
  const commonInfo = useSelector((s) => s.commonState.commonInfoList);
  const SUPPORT_PHONE = commonInfo[0]?.whatsAppNumber;
  const WHATSAPP_PHONE = commonInfo[0]?.supportCallNumber;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Support</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#222" />
            </TouchableOpacity>
          </View>

          <View style={styles.supportCard}>
            <TouchableOpacity
              style={styles.supportRow}
              onPress={() => openDialer(SUPPORT_PHONE)}
              activeOpacity={0.9}
            >
              <View style={styles.supportRowLeft}>
                <Ionicons name="call-outline" size={20} color="#222" />
                <View>
                  <Text style={styles.supportTitle}>Call Support</Text>
                  <Text style={styles.supportSub}>{SUPPORT_PHONE}</Text>
                </View>
              </View>
              <Ionicons name="call-outline" size={18} color="#1976d2" />
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.supportRow}
              onPress={() => {
                openWhats(WHATSAPP_PHONE);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.supportRowLeft}>
                <Ionicons name="logo-whatsapp" size={20} color="#222" />
                <View>
                  <Text style={styles.supportTitle}>WhatsApp Chat</Text>
                  <Text style={styles.supportSub}>{WHATSAPP_PHONE}</Text>
                </View>
              </View>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
          </View>

          <Text style={styles.supportNote}>
            Our support is available 09:00–21:00 (GMT+6).
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative", // ✅ anchor for absolute child
    zIndex: 1000,
    padding: 6,
    // backgroundColor: "#fff",
    marginTop: -45,
  },
  inputWrapper: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 40,
    backgroundColor: "#fff",
    width: '88%',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  clearIcon: {
    position: "absolute",
    right: 35,
    padding: 8,
  },
  searchIcon: {
    position: "absolute",
    right: 2,
    backgroundColor: "#333",
    padding: 7,
    borderRadius: 50,
  },
  searchIconDisabled: {
    opacity: 0.5, // visual feedback when disabled
  },
  suggestionList: {
    position: "absolute", // ✅ overlay
    top: 48, // ⬅️ input height + margin (মিলে না গেলে 44~56 টিউন করো)
    left: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 6,
    maxHeight: 240,
    zIndex: 2000, // ✅ iOS
    elevation: 20, // ✅ Android draw on top
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
    color: "#000",
  },
  topRow: {
    flexDirection: "row",
    // alignItems: "center",
    // paddingHorizontal: 12,
    // marginBottom: 6,
  },
  chatBtnInHome: {
    flexDirection: "row",
    alignItems: "center",
    //  gap: 4,
    height: 32.4,
    paddingHorizontal: 4,
    borderRadius: 60,
    backgroundColor: "green",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    //  shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    //  elevation: 2,
    //  bottom:35,

    marginRight: 10,
    marginLeft: 5,
    marginTop: 3,
  },

  // ---- Support sheet styles (profile-এর মতো) ----
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetBody: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: "#222" },
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  supportRow: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  supportRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  supportTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  supportSub: { fontSize: 12, color: "#666", marginTop: 2 },
  sheetDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 4,
  },
  supportNote: { marginTop: 10, fontSize: 12, color: "#666" },
});
