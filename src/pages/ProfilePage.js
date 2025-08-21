// Profile page with Settings sheet (Logout moved inside Settings)
// All your earlier rules preserved:
// - Shipping (Confirmed → only Track; no item buttons)
// - Delivered (per item: Return + Add Review; order-level Return hidden; Return Pending badge)
// - Return tab (only Return Confirmed items)
// - Review tab (only Review Confirmed items; no Track)
// - Item action buttons moved UNDER item details

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import LottieView from "lottie-react-native";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

import SummaryApi from "../common/SummaryApi";
import ReviewModal from "../components/ReviewModal";
import Context from "../context";
import { setUserDetails } from "../store/userSlice";

// 🆕 Support config (replace with your real numbers)
const SUPPORT_PHONE = "+8801712345678";
const WHATSAPP_PHONE = "+817045439721";
const WHATSAPP_MSG =
  "Hi EgTake";

// ---------- Status constants ----------
const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed", // change to "Processing" if your backend uses that
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN: "Return",
  CANCELLED: "Cancelled",
};

const ITEM_STATUS = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN_PENDING: "Return Pending",
  RETURN_CONFIRMED: "Return Confirmed",
};

const REVIEW_STATUS = {
  NONE: "None",
  PENDING: "Review Pending",
  CONFIRMED: "Review Confirmed",
};

// ---------- Normalizers ----------
const normalizeItemStatus = (s = "") => {
  const t = String(s).toLowerCase().replace(/\s+/g, "");
  if (t === "returnpending" || t === "return") return ITEM_STATUS.RETURN_PENDING;
  if (t === "returnconfirmed") return ITEM_STATUS.RETURN_CONFIRMED;
  if (t === "shipped") return ITEM_STATUS.SHIPPED;
  if (t === "delivered") return ITEM_STATUS.DELIVERED;
  if (t === "pending") return ITEM_STATUS.PENDING;
  return s || ITEM_STATUS.PENDING;
};

const normalizeReviewStatus = (it = {}) => {
  const raw =
    it.reviewStatus ??
    it.reviewTag ??
    (it.hasReview ? "Review Confirmed" : "") ??
    "";
  const t = String(raw).toLowerCase().replace(/\s+/g, "");
  if (t === "reviewconfirmed") return REVIEW_STATUS.CONFIRMED;
  if (t === "reviewpending") return REVIEW_STATUS.PENDING;
  return REVIEW_STATUS.NONE;
};

// 🆕 Dialer & WhatsApp helpers (deep-link flow)
async function openDialer(phone) {
  try {
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) return Linking.openURL(url);
    Toast.show({ type: "error", text1: "Calling not supported on this device" });
  } catch {
    Toast.show({ type: "error", text1: "Unable to open dialer" });
  }
}

async function openWhats(phone, message = WHATSAPP_MSG) {
  try {
    const clean = String(phone).replace(/[^\d+]/g, "");
    const appUrl = `whatsapp://send?phone=${clean}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${clean.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
    const can = await Linking.canOpenURL(appUrl);
    if (can) return Linking.openURL(appUrl);
    return Linking.openURL(webUrl);
  } catch {
    Toast.show({ type: "error", text1: "WhatsApp not available" });
  }
}

// ---------- UI atoms ----------
const Header = ({ cartCount = 0, onSettings, navigation }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Profile</Text>
    <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
      <TouchableOpacity onPress={onSettings} hitSlop={12}>
        <Ionicons name="settings-outline" size={22} color="#222" />
      </TouchableOpacity>
      <View>
        <TouchableOpacity
                  onPress={() => navigation.navigate("CartPage")}
                  
                >
        <Ionicons name="cart-outline" size={22} color="#222" />
        </TouchableOpacity>
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);

const StatPill = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
    <MaterialCommunityIcons name={icon} size={22} color="#1976d2" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
    <MaterialCommunityIcons name={icon} size={22} color="#222" />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, active ? styles.chipActive : null]}
    activeOpacity={0.9}
  >
    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
  </TouchableOpacity>
);

const ConfirmModal = ({ visible, title, cancelText = "Cancel", okText = "Confirm", onCancel, onOk }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#999" }]} onPress={onCancel}>
            <Text style={styles.modalBtnText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#d32f2f" }]} onPress={onOk}>
            <Text style={styles.modalBtnText}>{okText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const TrackOrderModal = ({ visible, status, onClose }) => {
  const steps = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED];
  const currentIndex = Math.max(0, steps.indexOf(status));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tracking Order</Text>
          <LottieView
            source={require("../../assets/animations/delivery.json")}
            autoPlay
            loop
            style={{ width: 90, height: 90, alignSelf: "center", marginVertical: 8 }}
          />
          <View style={styles.statusRow}>
            {steps.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              return (
                <View key={step} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && { backgroundColor: "#4caf50" },
                      isActive && { borderColor: "#1976d2", borderWidth: 2 },
                    ]}
                  >
                    {isCompleted ? <Ionicons name="checkmark" size={18} color="#fff" /> : (
                      <Text style={{ fontSize: 10, color: "#999" }}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isActive && { color: "#1976d2", fontWeight: "700" }]}>{step}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#1976d2", marginTop: 16 }]} onPress={onClose}>
            <Text style={styles.modalBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// -------- Settings Sheet (Logout lives here) --------
const SettingsRow = ({ icon, label, danger, onPress, right }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.settingRowLeft}>
      <Ionicons name={icon} size={20} color={danger ? "#d32f2f" : "#222"} />
      <Text style={[styles.settingLabel, danger && { color: "#d32f2f" }]}>{label}</Text>
    </View>
    {right ?? <Ionicons name="chevron-forward" size={18} color="#777" />}
  </TouchableOpacity>
);

// 🆕 SupportSheet rows
const SupportRow = ({ icon, title, subtitle, onPress, right }) => (
  <TouchableOpacity style={styles.supportRow} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.supportRowLeft}>
      <Ionicons name={icon} size={20} color="#222" />
      <View>
        <Text style={styles.supportTitle}>{title}</Text>
        {subtitle ? <Text style={styles.supportSub}>{subtitle}</Text> : null}
      </View>
    </View>
    {right ?? <Ionicons name="chevron-forward" size={18} color="#777" />}
  </TouchableOpacity>
);

// 🆕 Support bottom sheet
const SupportSheet = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheetBody}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Support</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={styles.supportCard}>
          <SupportRow
            icon="call-outline"
            title="Call Support"
            subtitle={SUPPORT_PHONE}
            onPress={() => openDialer(SUPPORT_PHONE)}
            right={<Ionicons name="call-outline" size={18} color="#1976d2" />}
          />
          <View style={styles.sheetDivider} />
          <SupportRow
            icon="logo-whatsapp"
            title="WhatsApp Chat"
            subtitle={WHATSAPP_PHONE}
            onPress={() => openWhats(WHATSAPP_PHONE)}
            right={<Ionicons name="logo-whatsapp" size={18} color="#25D366" />}
          />
        </View>

        <Text style={styles.supportNote}>
          Our support is available 09:00–21:00 (GMT+6).
        </Text>
      </View>
    </View>
  </Modal>
);

// 🔧 SettingsSheet gets onOpenSupport to open SupportSheet
const SettingsSheet = ({ visible, onClose, onLogout, navigateTo, onOpenSupport }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheetBody}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={styles.sheetList}>
          <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => { onClose(); Toast.show({type:"info", text1:"Edit profile coming soon"}); }} />
          <SettingsRow icon="map-outline" label="Addresses" onPress={() => { onClose(); Toast.show({type:"info", text1:"Addresses coming soon"}); }} />
          <SettingsRow icon="notifications-outline" label="Notifications" onPress={() => { onClose(); Toast.show({type:"info", text1:"Notifications coming soon"}); }} />
          <SettingsRow icon="language-outline" label="Language" onPress={() => { onClose(); Toast.show({type:"info", text1:"Language setting coming soon"}); }} />
          <SettingsRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => { onClose(); onOpenSupport?.(); }}
          />
          <View style={styles.sheetDivider} />
          <SettingsRow
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={() => { onClose(); onLogout(); }}
            right={<Ionicons name="log-out-outline" size={18} color="#d32f2f" />}
          />
        </View>
      </View>
    </View>
  </Modal>
);

// ---------- Order Item Row (actions below) ----------
const OrderItemRow = ({
  item,
  showReturnButton,
  showReviewButton,
  showReturnPendingBadge,
  showReviewConfirmedBadge,
  onReturnItem,
  onAddReview,
}) => {
  const img = item?.image ? item.image.replace("http://", "https://") : null;

  return (
    <View style={styles.itemRow}>
      <View style={{ flexDirection: "row" }}>
        {img ? (
          <Image source={{ uri: img }} style={styles.itemImg} />
        ) : (
          <View style={[styles.itemImg, styles.noImg]}>
            <Text style={{ color: "#999", fontSize: 10 }}>No Image</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item?.productName || "Product"}
          </Text>
          {item?.color ? <Text style={styles.itemMeta}>Color: {item.color}</Text> : null}
          {item?.size ? <Text style={styles.itemMeta}>Size: {item.size}</Text> : null}
          <Text style={styles.itemMeta}>Qty: {item?.quantity || 1}</Text>
          <Text style={styles.itemMeta}>Price: {item?.price ?? "-"}</Text>
        </View>
      </View>

      {/* Actions row under details */}
      <View style={styles.itemActionsRow}>
        {showReturnPendingBadge ? (
          <View style={[styles.tag, { backgroundColor: "#EEE" }]}>
            <Text style={[styles.tagText, { color: "#333" }]}>Return Pending</Text>
          </View>
        ) : null}

        {showReviewConfirmedBadge ? (
          <View style={[styles.tag, { backgroundColor: "#E9F7EF" }]}>
            <Text style={[styles.tagText, { color: "#1B5E20" }]}>Review Confirmed</Text>
          </View>
        ) : null}

        {showReturnButton ? (
          <TouchableOpacity style={[styles.actionGhost]} onPress={onReturnItem}>
            <Text style={styles.actionGhostText}>Return</Text>
          </TouchableOpacity>
        ) : null}

        {showReviewButton ? (
          <TouchableOpacity
            style={[styles.actionGhost, { backgroundColor: "#FFD700" }]}
            onPress={onAddReview}
          >
            <Text style={[styles.actionGhostText, { color: "#000" }]}>Add Review</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

// ---------- Main Screen ----------
const ProfilePage = () => {
  const user = useSelector((state) => state.userState.user);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { cartCountProduct = 0, setCartCountProduct } = useContext(Context);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedTab, setSelectedTab] = useState("All");

  const [logoutAsk, setLogoutAsk] = useState(false);
  const [trackVisible, setTrackVisible] = useState(false);
  const [trackStatus, setTrackStatus] = useState(ORDER_STATUS.PENDING);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false); // NEW: settings sheet state
  const [supportOpen, setSupportOpen] = useState(false);   // 🆕 support sheet state

  // Fetch Orders
  const fetchUserOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get(SummaryApi.get_user_orders.url, { withCredentials: true });
      if (res.data?.success) {
        const normalized = (res.data.data || []).map((o) => ({
          ...o,
          items: (o.items || []).map((it) => ({
            ...it,
            itemStatus: normalizeItemStatus(it.itemStatus),
            reviewStatus: normalizeReviewStatus(it),
          })),
        }));
        setOrders(normalized);
      } else {
        Toast.show({ type: "error", text1: res.data?.message || "Failed to load orders" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Network error while loading orders" });
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // Filters per tab
  const filteredOrders = useMemo(() => {
    const base = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (selectedTab === "Pending") {
      return base.filter((o) => o.status === ORDER_STATUS.PENDING);
    }

    if (selectedTab === "Shipping") {
      return base.filter((o) => [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED].includes(o.status));
    }

    if (selectedTab === "Delivered") {
      return base
        .filter((o) => o.status === ORDER_STATUS.DELIVERED)
        .map((o) => ({
          ...o,
          items: (o.items || []).filter(
            (it) => it.itemStatus !== ITEM_STATUS.RETURN_CONFIRMED
          ),
        }))
        .filter((o) => (o.items || []).length > 0);
    }

    if (selectedTab === "Return") {
      return base
        .map((o) => ({
          ...o,
          items: (o.items || []).filter(
            (it) => it.itemStatus === ITEM_STATUS.RETURN_CONFIRMED
          ),
        }))
        .filter((o) => (o.items || []).length > 0);
    }

    if (selectedTab === "Review") {
      // Only review confirmed items
      return base
        .map((o) => ({
          ...o,
          items: (o.items || []).filter(
            (it) => it.reviewStatus === REVIEW_STATUS.CONFIRMED
          ),
        }))
        .filter((o) => (o.items || []).length > 0);
    }

    return base; // All
  }, [orders, selectedTab]);

  // Actions
  const handleLogout = async () => {
    try {
      const res = await axios({
        method: SummaryApi.logout_user.method,
        url: SummaryApi.logout_user.url,
        withCredentials: true,
      });
      if (res.data?.success) {
        dispatch(setUserDetails(null));
        setCartCountProduct?.(0);
        Toast.show({ type: "success", text1: res.data?.message || "Logged out" });
        navigation.navigate("Home");
      } else {
        Toast.show({ type: "error", text1: res.data?.message || "Logout failed" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Network error" });
    } finally {
      setLogoutAsk(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await axios.delete(`${SummaryApi.cancel_user_order.url}/${orderId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        Toast.show({ type: "success", text1: "Order cancelled" });
      } else {
        Toast.show({ type: "error", text1: res.data?.message || "Cancel failed" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Network error" });
    }
  };

  const handleReturnOrder = async (orderId) => {
    try {
      const res = await axios.put(`${SummaryApi.return_user_order.url}/${orderId}`, {}, { withCredentials: true });
      if (res.data?.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: ORDER_STATUS.RETURN } : o)));
        Toast.show({ type: "success", text1: "Return requested" });
      } else {
        Toast.show({ type: "error", text1: res.data?.message || "Return failed" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Network error" });
    }
  };

  const handleReturnItem = async (orderId, itemId) => {
    try {
      const res = await axios.put(
        `${SummaryApi.return_user_order_item.url}/${orderId}/${itemId}`,
        {},
        { withCredentials: true }
      );
    if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  items: o.items.map((it) =>
                    it._id === itemId ? { ...it, itemStatus: ITEM_STATUS.RETURN_PENDING } : it
                  ),
                }
              : o
          )
        );
        Toast.show({ type: "success", text1: "Item marked for return" });
      } else {
        Toast.show({ type: "error", text1: res.data?.message || "Return failed" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Network error" });
    }
  };

  const openTrack = (status) => {
    setTrackStatus(status || ORDER_STATUS.PENDING);
    setTrackVisible(true);
  };

  const openReview = (order, item) => {
    setSelectedReviewItem({ ...item, orderId: order._id });
    setReviewVisible(true);
  };

  // Stats (unchanged)
  const stats = useMemo(() => {
    const all = orders.length;
    const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    const returnConfirmed =
      orders.reduce(
        (acc, o) => acc + (o.items || []).filter((it) => it.itemStatus === ITEM_STATUS.RETURN_CONFIRMED).length,
        0
      );
    return { all, delivered, returnConfirmed };
  }, [orders]);

  // Renderers
  const renderOrder = ({ item: order, index }) => {
    const ship = order?.shippingDetails || {};
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;

    const isPending = order.status === ORDER_STATUS.PENDING;
    const isConfirmed = order.status === ORDER_STATUS.CONFIRMED;
    const isShipped = order.status === ORDER_STATUS.SHIPPED;
    const isDelivered = order.status === ORDER_STATUS.DELIVERED;

    const shippingTabOnlyTrack = selectedTab === "Shipping" && isConfirmed; // only Track
    const deliveredTab = selectedTab === "Delivered";
    const returnTab = selectedTab === "Return";
    const reviewTab = selectedTab === "Review";

    return (
      <View style={styles.orderCard}>
        {/* Order summary */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Order #{index + 1}</Text>
          <View style={[styles.statusChip, getStatusChipStyle(order.status)]}>
            <Text style={styles.statusChipText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaText}>
            Order ID: <Text style={styles.orderMetaValue}>{order?._id}</Text>
          </Text>
          <Text style={styles.orderMetaText}>
            Ship to:{" "}
            <Text style={styles.orderMetaValue}>
              {(ship.address || "-") + (ship.district ? `, ${ship.district}` : "")}
            </Text>
          </Text>
          <Text style={styles.orderMetaText}>
            Phone: <Text style={styles.orderMetaValue}>{ship.phone || "-"}</Text>
          </Text>
          <Text style={styles.orderMetaText}>
            Total: <Text style={styles.orderMetaValue}>৳{order?.totalAmount ?? "-"}</Text>
          </Text>
          <Text style={styles.orderMetaText}>
            Placed:{" "}
            <Text style={styles.orderMetaValue}>
              {createdAt ? createdAt.toLocaleString() : "-"}
            </Text>
          </Text>
        </View>

        {/* Items */}
        {(order.items || []).map((raw) => {
          const item = {
            ...raw,
            itemStatus: normalizeItemStatus(raw.itemStatus),
            reviewStatus: normalizeReviewStatus(raw),
          };

          let showReturnBtn = false;
          let showReviewBtn = false;
          let showReturnPendingBadge = false;
          let showReviewConfirmedBadge = false;

          // Delivered tab:
          if (deliveredTab) {
            if (item.itemStatus === ITEM_STATUS.RETURN_PENDING) {
              showReturnPendingBadge = true;
              showReturnBtn = false;
              showReviewBtn = true;
            } else {
              showReturnBtn = true;
              showReviewBtn = true;
            }
          }

          // Shipping tab + Confirmed: no item actions
          if (shippingTabOnlyTrack) {
            showReturnBtn = false;
            showReviewBtn = false;
            showReturnPendingBadge = false;
          }

          // Return tab: view only
          if (returnTab) {
            showReturnBtn = false;
            showReviewBtn = false;
            showReturnPendingBadge = false;
          }

          // Review tab: only review confirmed items (badge only)
          if (reviewTab) {
            showReturnBtn = false;
            showReviewBtn = false;
            showReturnPendingBadge = false;
            if (item.reviewStatus === REVIEW_STATUS.CONFIRMED) {
              showReviewConfirmedBadge = true;
            }
          }

          return (
            <OrderItemRow
              key={item._id}
              item={item}
              showReturnButton={showReturnBtn}
              showReviewButton={showReviewBtn}
              showReturnPendingBadge={showReturnPendingBadge}
              showReviewConfirmedBadge={showReviewConfirmedBadge}
              onReturnItem={() => handleReturnItem(order._id, item._id)}
              onAddReview={() => openReview(order, item)}
            />
          );
        })}

        {/* Order-level actions */}
        {(() => {
          if (reviewTab) return null; // NO track in Review tab
          return (
            <View style={styles.orderActionsRow}>
              {isPending ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#d32f2f" }]}
                  onPress={() => handleCancelOrder(order._id)}
                >
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#1976d2" }]}
                  onPress={() => openTrack(order.status)}
                >
                  <Text style={styles.actionBtnText}>Track</Text>
                </TouchableOpacity>
              )}

              {/* Hide in Delivered; Confirmed = only Track; Shipped can Return */}
              {(() => {
                if (selectedTab === "Delivered") return null;
                if (shippingTabOnlyTrack) return null;
                if (isShipped) {
                  return (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#ffa000" }]}
                      onPress={() => handleReturnOrder(order._id)}
                    >
                      <Text style={styles.actionBtnText}>
                        {(order.items || []).length > 1 ? "Return All" : "Return"}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
            </View>
          );
        })()}
      </View>
    );
  };

  const keyExtractor = (order) => order._id;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header (Settings opens sheet) */}
      <Header
        cartCount={cartCountProduct}
        navigation={navigation}
        onSettings={() => setSettingsOpen(true)} // 👈 open settings
      />

      <FlatList
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{user?.name || "User"}</Text>
                <Text style={styles.email} numberOfLines={1}>{user?.email || "-"}</Text>
                <View style={styles.memberBadge}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#1976d2" />
                  <Text style={styles.memberBadgeText}>Member</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => Toast.show({ type: "info", text1: "Edit profile coming soon" })}
              >
                <Ionicons name="create-outline" size={16} color="#1976d2" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatPill icon="clipboard-text-outline" label="Orders" value={stats.all} onPress={() => setSelectedTab("All")} />
              <StatPill icon="truck-delivery-outline" label="Delivered" value={stats.delivered} onPress={() => setSelectedTab("Delivered")} />
              <StatPill icon="autorenew" label="Return" value={stats.returnConfirmed} onPress={() => setSelectedTab("Return")} />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickGrid}>
              <QuickAction icon="package-variant-closed" label="My Orders" onPress={() => setSelectedTab("All")} />
              <QuickAction icon="map-marker-outline" label="Addresses" onPress={() => Toast.show({ type: "info", text1: "Addresses coming soon" })} />
              {/* 🆕 Support opens bottom sheet */}
              <QuickAction icon="headset" label="Support" onPress={() => setSupportOpen(true)} />
              <QuickAction icon="bell-outline" label="Notifications" onPress={() => Toast.show({ type: "info", text1: "Notifications coming soon" })} />
              <QuickAction icon="wallet-outline" label="Payments" onPress={() => Toast.show({ type: "info", text1: "Payment methods coming soon" })} />
              <QuickAction icon="help-circle-outline" label="Help" onPress={() => Toast.show({ type: "info", text1: "Help center coming soon" })} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              {["All", "Pending", "Shipping", "Delivered", "Return", "Review"].map((t) => (
                <Chip key={t} label={t} active={selectedTab === t} onPress={() => setSelectedTab(t)} />
              ))}
            </View>

            {/* Section title */}
            <Text style={styles.sectionTitle}>
              {selectedTab === "All" ? "Recent Orders" : `${selectedTab} Orders`}
            </Text>

            {/* Loading / Empty */}
            {loadingOrders ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" />
                <Text style={{ marginTop: 6, color: "#666" }}>Loading orders…</Text>
              </View>
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cube-outline" size={28} color="#999" />
                <Text style={styles.emptyText}>No orders found</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Home")}>
                  <Text style={styles.shopBtnText}>Go Shopping</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        data={loadingOrders ? [] : filteredOrders}
        keyExtractor={keyExtractor}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent} // 🔧 reduced bottom padding (no footer logout)
      />

      {/* Settings Sheet (Logout here) */}
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => setLogoutAsk(true)}
        navigateTo={(route) => navigation.navigate(route)}
        onOpenSupport={() => setSupportOpen(true)} // 🆕
      />

      {/* 🆕 Support Sheet */}
      <SupportSheet
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
      />

      {/* Confirm Logout */}
      <ConfirmModal
        visible={logoutAsk}
        title="Are you sure you want to logout?"
        onCancel={() => setLogoutAsk(false)}
        onOk={handleLogout}
      />

      {/* Track Modal */}
      <TrackOrderModal
        visible={trackVisible}
        status={trackStatus}
        onClose={() => setTrackVisible(false)}
      />

      {/* Review Modal */}
      {reviewVisible && (
        <ReviewModal
          visible={reviewVisible}
          onClose={() => setReviewVisible(false)}
          productName={selectedReviewItem?.productName}
          productId={selectedReviewItem?.productId}
          orderId={selectedReviewItem?.orderId}
          itemId={selectedReviewItem?._id}
          onSubmit={async (payload) => {
            try {
              const res = await axios({
                method: SummaryApi.create_review.method,
                url: SummaryApi.create_review.url,
                withCredentials: true,
                data: {
                  productId: selectedReviewItem?.productId,
                  orderId: selectedReviewItem?.orderId,
                  itemId: selectedReviewItem?._id,
                  comment: payload?.text,
                  rating: payload?.rating,
                  images: payload?.images,
                },
              });
              if (res.data?.success) {
                Toast.show({ type: "success", text1: "Review submitted!" });
              } else {
                Toast.show({ type: "error", text1: res.data?.message || "Failed to submit review" });
              }
            } catch {
              Toast.show({ type: "error", text1: "Network error" });
            } finally {
              setReviewVisible(false);
              setSelectedReviewItem(null);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfilePage;

// ---------- Helpers ----------
function getStatusChipStyle(status) {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return { backgroundColor: "#FFF4E5" };
    case ORDER_STATUS.CONFIRMED:
      return { backgroundColor: "#E6F2FF" };
    case ORDER_STATUS.SHIPPED:
      return { backgroundColor: "#E6F2FF" };
    case ORDER_STATUS.DELIVERED:
      return { backgroundColor: "#E9F7EF" };
    case ORDER_STATUS.RETURN:
      return { backgroundColor: "#FFF4F4" };
    case ORDER_STATUS.CANCELLED:
      return { backgroundColor: "#F3F3F3" };
    default:
      return { backgroundColor: "#EEE" };
  }
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fb",marginBottom:60 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingTop:50
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 4,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  listContent: { paddingHorizontal: 14, paddingBottom: 24 }, // 🔧 no footer logout now

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#1976d2",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "700", color: "#222" },
  email: { fontSize: 13, color: "#666", marginTop: 2 },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
    alignSelf: "flex-start", backgroundColor: "#EAF3FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  memberBadgeText: { color: "#1976d2", fontSize: 12, fontWeight: "600" },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#EAF3FF",
  },
  editBtnText: { color: "#1976d2", fontWeight: "700", fontSize: 12 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    alignItems: "flex-start", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#222" },
  statLabel: { fontSize: 12, color: "#666" },

  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  quickAction: {
    width: "31.8%", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
  },
  quickActionLabel: { marginTop: 6, fontSize: 12, color: "#333", fontWeight: "600" },

  // Tabs
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#EDEDED" },
  chipActive: { backgroundColor: "#1976d2" },
  chipText: { fontSize: 12, color: "#333", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 16, fontWeight: "800", color: "#222" },

  // Loading / Empty
  loadingBox: {
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 20, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 8,
  },
  emptyBox: {
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 24, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 8, gap: 6,
  },
  emptyText: { color: "#666", marginTop: 6 },
  shopBtn: { marginTop: 8, backgroundColor: "#1976d2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  shopBtnText: { color: "#fff", fontWeight: "700" },

  // Order card
  orderCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 12,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderTitle: { fontSize: 15, fontWeight: "800", color: "#222" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusChipText: { fontSize: 12, fontWeight: "700", color: "#222" },
  orderMeta: { marginTop: 4 },
  orderMetaText: { fontSize: 13, color: "#666", marginVertical: 1 },
  orderMetaValue: { color: "#222", fontWeight: "600" },

  // Item
  itemRow: {
    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 8, marginTop: 8, backgroundColor: "#fff",
  },
  itemImg: { width: 60, height: 60, borderRadius: 6 },
  noImg: { backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  itemName: { fontWeight: "700", color: "#222" },
  itemMeta: { color: "#666", fontSize: 12, marginTop: 1 },

  // Item actions (below)
  itemActionsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontWeight: "700", fontSize: 12 },

  orderActionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: "#fff", fontWeight: "800" },

  actionGhost: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#EDEDED" },
  actionGhostText: { color: "#000", fontWeight: "700", fontSize: 12 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", paddingHorizontal: 18,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 18, width: "100%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#222" },

  statusRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 10 },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#ccc",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  stepLabel: { fontSize: 12, color: "#888" },

  // Settings sheet styles
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
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
  sheetList: { marginTop: 6 },
  settingRow: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingLabel: { fontSize: 14, color: "#222", fontWeight: "600" },
  sheetDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.08)", marginVertical: 8 },

  // 🆕 Support sheet styles
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
  supportNote: { marginTop: 10, fontSize: 12, color: "#666" },
});
