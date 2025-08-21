import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SummaryApi from "../common/SummaryApi";
import { trackBasic } from "../helper/trackBasic";

const PLACEHOLDER_COLOR = "#999";

const SearchBar = () => {
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
          style={[styles.searchIcon, isSearching && styles.searchIconDisabled]}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    zIndex: 99,
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
    backgroundColor: "#fff",
    elevation: 3,
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 200,
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
});

export default SearchBar;
