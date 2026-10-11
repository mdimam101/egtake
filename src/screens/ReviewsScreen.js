// ✅ ReviewsScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SummaryApi from "../common/SummaryApi";
import FullscreenImageModal from "../components/FullscreenImageModal";

const Stars = ({ value = 0, size = 16 }) => (
  <View style={{ flexDirection: "row" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(value) ? "star" : "star-outline"}
        size={size}
        color={i <= Math.round(value) ? "#FFD700" : "#BDBDBD"}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  } catch {
    return "";
  }
};

const PAGE_SIZE = 20; // চাইলে বদলাও

export default function ReviewsScreen({ route, navigation }) {
  const { productId, productName } = route.params || {};

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // simple pagination (client-side OR server-side)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // server paging থাকলে ইউজফুল

  // fullscreen viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (imagesArr, idx = 0, _title = "") => {
    if (!Array.isArray(imagesArr) || imagesArr.length === 0) return;
    setViewerImages(imagesArr);
    setViewerIndex(idx);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

  // --- Fetch ---
  const fetchReviews = useCallback(
    async (nextPage = 1) => {
      try {
        // 🔸 যদি SummaryApi.get_product_reviews ফাংশন হয় (id থেকে url দেয়)
        // const url = SummaryApi.get_product_reviews(productId, nextPage, PAGE_SIZE)
        //   অথবা
        // const url = SummaryApi.get_product_reviews(productId);  // simple

        // নিচের উদাহরণ: যদি SummaryApi.get_product_reviews একটি helper হয় যা URL রিটার্ন করে:
        const url =
          typeof SummaryApi.get_product_reviews === "function"
            ? SummaryApi.get_product_reviews(productId, nextPage, PAGE_SIZE)
            : `${SummaryApi.get_product_reviews.url}?productId=${productId}&page=${nextPage}&limit=${PAGE_SIZE}`;

        const res = await axios.get(url, { withCredentials: true });

        // ✅ two patterns support:
        // 1) { success, data: [], hasMore }
        // 2) { reviews: [], hasMore } – যেটা আছে ইউজ করো
        const list = res.data?.data || res.data?.reviews || [];
        const more =
          typeof res.data?.hasMore === "boolean"
            ? res.data.hasMore
            : list.length === PAGE_SIZE;

        setReviews((prev) => (nextPage === 1 ? list : [...prev, ...list]));
        setHasMore(more);
      } catch {
        // Keep the current list visible when loading another page fails.
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchReviews(1);
  }, [productId, fetchReviews]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  // avg, count, distribution
  const { avg, count, dist } = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
    }
    const total = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const a = Math.round((total / reviews.length) * 10) / 10;
    const d = [1, 2, 3, 4, 5].map(
      (star) => reviews.filter((r) => Math.round(r.rating) === star).length,
    );
    return { avg: a, count: reviews.length, dist: d };
  }, [reviews]);

  const renderItem = ({ item }) => {
    const images = Array.isArray(item.images) ? item.images : [];
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.userName || "User"}</Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <Stars value={item.rating} />
        </View>

        {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}

        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
          >
            {images.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.thumbBox}
                activeOpacity={0.9}
                onPress={() => openViewer(images, idx, "Review photos")}
              >
                <Image source={{ uri: url }} style={styles.thumbImg} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {/* Reviews{productName ? ` · ${productName}` : ""} */}
          Item reviews
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Text style={styles.avgText}>{avg.toFixed(1)}</Text>
          <Stars value={avg} size={18} />
          <Text style={styles.countText}>{count} reviews</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 16 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const idx = star - 1;
            const totalCount = count || 1;
            const pct = Math.round(((dist[idx] || 0) / totalCount) * 100);
            return (
              <View key={star} style={styles.distRow}>
                <Text style={styles.distLabel}>{star}★</Text>
                <View style={styles.distBarBg}>
                  <View style={[styles.distBarFg, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.distCount}>{dist[idx] || 0}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* List */}
      {loading && reviews.length === 0 ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          style={styles.reviewsList}
          data={reviews}
          keyExtractor={(it, i) => it._id || String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.reviewsListContent}
          showsVerticalScrollIndicator
          persistentScrollbar
          nestedScrollEnabled
          bounces
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            hasMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#666" }}>No reviews yet.</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Fullscreen viewer */}
      <FullscreenImageModal
        visible={viewerOpen}
        onClose={closeViewer}
        images={viewerImages}
        initialIndex={viewerIndex}
        title={productName || "Photos"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  reviewsList: {
    flex: 1,
  },
  reviewsListContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "#111",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  avgText: { fontSize: 28, fontWeight: "800", color: "#111", marginBottom: 4 },
  countText: { color: "#666", marginTop: 2, fontSize: 12 },
  distRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  distLabel: { width: 26, color: "#333" },
  distBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  distBarFg: { height: 8, backgroundColor: "#FFB300" },
  distCount: { width: 24, textAlign: "right", color: "#555" },

  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
    backgroundColor: "#fff",
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  userName: { fontWeight: "600", color: "#222" },
  dateText: { color: "#888", fontSize: 12 },
  comment: { marginTop: 6, color: "#333", lineHeight: 18 },
  thumbBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
    backgroundColor: "#f2f2f2",
  },
  thumbImg: { width: "100%", height: "100%" },
});
