// ✅ CheckoutPage — Delivery Option (Narayanganj + Upazila thresholds) + Payment (COD)
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import CheckoutItemCard from "../components/CheckoutItemCard";
import CustomDropdown from "../components/CustomDropdown"; // keep your existing component
import SuccessModal from "../components/SuccessModal";
import Context from "../context";
import deleteCartItemWhenOrderplace from "../helper/deleteCartItemWhenOrderplace";
import { GUEST_CART_KEY } from "../helper/guestCart";
import updateProductStock from "../helper/updateProductStock";

const PLACEHOLDER_COLOR = "#999";
// payment gat way server coast etc
const PROCESSING_FEE = 5;

// 🔽 New: Upazila options (only for Narayanganj)
const NARAYANGANJ_UPAZILAS = [
  "Narayanganj Sodor",
  "Bandar",
  "Shonargaon",
  "Others Upazila",
];

const CheckoutPage = () => {
  const navigation = useNavigation();
  const { fetchUserAddToCart } = useContext(Context);
  const route = useRoute();
  const selectedItems = route.params?.selectedItemsDetails || [];

  const [errors, setErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);

  // ⏳ submit locking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false); // extra guard against rapid taps
  const user = useSelector((state) => state?.userState?.user);

  const commonInfo = useSelector((s) => s.commonState.commonInfoList);

  const MIN_FREE_NAR = commonInfo[0]?.nrGanjMiniOrdr
    ? Number(commonInfo[0]?.nrGanjMiniOrdr)
    : 999; // fallback — used if upazila absent
  const MIN_FREE_DHK = commonInfo[0]?.DhakaMiniOrdr
    ? Number(commonInfo[0]?.DhakaMiniOrdr)
    : 1190;
  const MIN_FREE_OTH = commonInfo[0]?.OthersAreaMiniOrdr
    ? Number(commonInfo[0]?.OthersAreaMiniOrdr)
    : 1500;

  const handlingCharge = commonInfo[0]?.handlingCharge
    ? Number(commonInfo[0]?.handlingCharge)
    : 15;

  // ✅ shipping form + NEW: upazila (only for Narayanganj)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    district: "", // Dhaka | Narayanganj | Others
    upazila: "", // only for Narayanganj
  });

  // ✅ delivery option: "FREE" | "EXPRESS" | "NAR120" | "STD"
  //  - STD: non-Narayanganj standard (Dhaka/Others) under threshold
  const [deliveryOption, setDeliveryOption] = useState("FREE");
  const [userTouchedDelivery, setUserTouchedDelivery] = useState(false);

  // ✅ payment option (for now only COD)
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [couponMeta, setCouponMeta] = useState(null);

  // Prefill shipping if available (now also accept saved upazila if backend sends it)
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(SummaryApi.current_user.url, {
          withCredentials: true,
        });
        const ship = res?.data?.data?.shipping;
        if (ship) {
          setFormData((prev) => ({
            ...prev,
            name: ship.name || "",
            phone: ship.phone || "",
            address: ship.address || "",
            district: ship.district || "",
            upazila: ship.upazila || "",
          }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // district base charges (unchanged for non-Narayanganj)
  const districtCharge = (district) => {
    if (district === "Narayanganj") return 0;
    if (district === "Dhaka") return 50;
    if (district === "Others") return 130;
    return 0;
  };

  const baseTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = item.selling || item?.productId?.selling;
      return acc + price * item.quantity;
    }, 0);
  }, [selectedItems]);

  // 🔽 Upazila-wise free threshold (only if district === Narayanganj)
  const getNarUpazilaThreshold = (upazila) => {
    if (upazila === "Narayanganj Sodor" || upazila === "Bandar") return MIN_FREE_NAR;
    if (upazila === "Shonargaon") return MIN_FREE_DHK;
    if (upazila === "Others Upazila") return MIN_FREE_OTH;
    // fallback if not selected yet
    return MIN_FREE_NAR;
  };

  // ✅ Free threshold helpers (all districts, Narayanganj depends on upazila)
  const getFreeThreshold = (district, upazila) => {
    if (district === "Narayanganj") return getNarUpazilaThreshold(upazila);
    if (district === "Dhaka") return MIN_FREE_DHK;
    if (district === "Others") return MIN_FREE_OTH;
    return Infinity;
  };

  const currentThreshold = getFreeThreshold(
    formData.district,
    formData.upazila
  );

  const freeEligible = formData.district ? baseTotal >= currentThreshold : true;

  const freeDisabled = !!formData.district && !freeEligible;

  const remainingForFree = formData.district
    ? Math.max(0, currentThreshold - baseTotal)
    : 0;

  // ✅ Narayanganj-only guard: under threshold হলে FREE থাকলে NAR120-এ ফোর্স
  useEffect(() => {
    if (
      formData.district === "Narayanganj" &&
      baseTotal < currentThreshold &&
      deliveryOption === "FREE"
    ) {
      setDeliveryOption("NAR120");
    }
  }, [
    formData.district,
    formData.upazila,
    baseTotal,
    currentThreshold,
    deliveryOption,
  ]);

  // ✅ Disallow EXPRESS outside Sodor/Bandar
  useEffect(() => {
    if (
      formData.district === "Narayanganj" &&
      deliveryOption === "EXPRESS" &&
      !["Narayanganj Sodor", "Bandar"].includes(formData.upazila)
    ) {
      setDeliveryOption("NAR120");
      setUserTouchedDelivery(false);
    }
  }, [formData.district, formData.upazila, deliveryOption]);

  // ✅ District switch normalization (keep your previous logic + upazila reset)
  useEffect(() => {
    const d = formData.district;
    if (!d) return;

    if (d === "Narayanganj") {
      // when user changes to Narayanganj, ensure upazila is empty (forces user to choose)
      if (!formData.upazila) {
        setDeliveryOption("NAR120"); // a sensible default
      }
      if (deliveryOption === "STD") {
        setDeliveryOption(baseTotal >= currentThreshold ? "FREE" : "NAR120");
        setUserTouchedDelivery(false);
      }
      return;
    }

    // leaving Narayanganj → clear upazila & normalize delivery option
    if (formData.upazila) setFormData((p) => ({ ...p, upazila: "" }));

    if (deliveryOption === "EXPRESS" || deliveryOption === "NAR120") {
      setDeliveryOption(freeEligible ? "FREE" : "STD");
      setUserTouchedDelivery(false);
    }
  }, [
    formData.district,
    baseTotal,
    freeEligible,
    currentThreshold,
    deliveryOption,
  ]);

  // ✅ Dhaka/Others: subtotal crossing threshold → auto toggle STD ↔ FREE
  useEffect(() => {
    if (
      !userTouchedDelivery &&
      (formData.district === "Dhaka" || formData.district === "Others")
    ) {
      if (!freeEligible && deliveryOption === "FREE") {
        setDeliveryOption("STD");
      }
      if (freeEligible && deliveryOption === "STD") {
        setDeliveryOption("FREE");
      }
    }
  }, [formData.district, freeEligible, deliveryOption, userTouchedDelivery]);

  // ✅ delivery charge depends on district + selection
  const computeDeliveryCharge = (district, option) => {
    if (district === "Narayanganj") {
      if (option === "EXPRESS") return 150; // only visible for Sodor/Bandar
      if (option === "NAR120") return 120; // standard inside Narayanganj
      return 0; // FREE
    }
    if (district === "Dhaka") {
      return baseTotal >= MIN_FREE_DHK ? 0 : districtCharge(district);
    }
    if (district === "Others") {
      return baseTotal >= MIN_FREE_OTH ? 0 : districtCharge(district);
    }
    return districtCharge(district);
  };

  const deliveryCharge = computeDeliveryCharge(
    formData.district,
    deliveryOption
  );

  const Subtotal =
    baseTotal + deliveryCharge + handlingCharge + PROCESSING_FEE - discount;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      Toast.show({ type: "error", text1: "Please enter a coupon" });
      return;
    }
    try {
      const { data } = await axios.post(
        SummaryApi.coupon_apply.url,
        { code, subtotal: baseTotal },
        { withCredentials: true }
      );
      if (data?.success) {
        const d = data?.totals?.discount || 0;
        setDiscount(d);
        setCouponCode(code);
        setCouponMeta(data?.coupon || { code });
        Toast.show({
          type: "success",
          text1: `Coupon applied: ${code}`,
          text2: `৳${d} off`,
        });
      } else {
        setDiscount(0);
        setCouponMeta(null);
        Toast.show({ type: "error", text1: data?.message || "Invalid coupon" });
      }
    } catch (err) {
      setDiscount(0);
      setCouponMeta(null);
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Invalid coupon",
      });
    }
  };

  // Save/update default shipping silently (now also upazila)
  const upsertUserShipping = async () => {
    try {
      const { name, phone, address, district, upazila } = formData;
      if (!name || !phone || !address || !district) return;
      await axios.put(
        SummaryApi.update_shipping.url,
        { name, phone, address, district, upazila },
        { withCredentials: true }
      );
    } catch {
      /* ignore */
    }
  };

  // Memoize selectedItems mapping for order payload
  const orderPayloadItems = useMemo(
    () =>
      selectedItems.map((item) => ({
        productId: item.productId._id,
        productName: item?.productName || item.productId.productName,
        quantity: item.quantity,
        price: ( item?.selling || item?.productId?.selling ) * item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        productCodeNumber: item.productId?.productCodeNumber
      })),
    [selectedItems]
  );

  const handleSubmitOrder = async () => {
    if (!user?._id) {
      navigation.navigate("Signup");
      return;
    }
    if (isSubmitting || submitLockRef.current) return;

    const { name, phone, address, district, upazila } = formData;
    const newErrors = {};
    if (!name) newErrors.name = "Full name is required";
    if (!phone) newErrors.phone = "Phone number is required";
    if (!district) newErrors.district = "Please select your district";
    if (district === "Narayanganj" && !upazila)
      newErrors.upazila = "Please select your upazila";
    if (!address) newErrors.address = "Full address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Please fill up shipping details");
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    submitLockRef.current = true;

    try {
      await upsertUserShipping();

      const deliveryTimeline =
        deliveryOption === "EXPRESS" ? "Express" : "Normal";

      const orderPayload = {
        items: orderPayloadItems,
        shippingDetails: { name, phone, address, district, upazila },
        deliveryType: deliveryTimeline,
        deliveryCharge,
        paymentMethod,
        totalAmount: Subtotal,
        discount,
        couponCode,
      };

      const response = await axios.post(SummaryApi.orders.url, orderPayload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (response?.data?.success) {
        const idArray = selectedItems
          .filter((item) => item._id && !item?.isStoreData)
          .map((item) => item._id);

        await Promise.all(
          selectedItems.map((item) =>
            updateProductStock(
              item.productId._id,
              item.image,
              item.size,
              item.quantity
            )
          )
        );

        if (couponCode && discount > 0) {
          try {
            await axios.post(
              SummaryApi.coupon_commit.url,
              { code: couponCode, orderId: response?.data?.orderId },
              { withCredentials: true }
            );
          } catch (err) {
            // console.log("❌ Coupon commit failed", err);
          }
        }

        setModalVisible(true);
        // যেখানে order confirm success হয়:
        await clearGuestCart(); // ✅ guest cart মুছে যাবে
        await handleRemove(idArray);
        setModalVisible(true);
      } else {
        Toast.show({ type: "error", text1: "Order failed" });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  // delete local (add to cart data)
  const clearGuestCart = async () => {
    await AsyncStorage.removeItem(GUEST_CART_KEY);
    fetchUserAddToCart(false);
  };

  const handleRemove = async (productIdArray) => {
    const result = await deleteCartItemWhenOrderplace(productIdArray);
    if (result?.success) {
      fetchUserAddToCart(true);
    }
  };

  const BUTTON_H = 56;

  const deliveryLabelValue =
    deliveryCharge === 0 ? "FREE" : `৳${deliveryCharge}`;

  // ✅ FREE কার্ডের জন্য আলাদা লেবেল: সবসময় FREE দেখাবে
  const freeCardPriceLabel = "FREE";

  // helper labels for FREE card header line
  const freeTitleByArea = () => {
    if (formData.district === "Narayanganj") {
      const th = currentThreshold;
      return `Free Delivery ৳${th}+`;
    }
    if (formData.district === "Dhaka") return `Free Delivery ৳${MIN_FREE_DHK}+`;
    if (formData.district === "Others")
      return `Free Delivery ৳${MIN_FREE_OTH}+`;
    return "Delivery commitment";
  };

  const showExpress =
    formData.district === "Narayanganj" &&
    ["Narayanganj Sodor", "Bandar"].includes(formData.upazila);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerTitle}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
          disabled={isSubmitting}
        >
          <Ionicons name="chevron-back" size={25} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Confirmation</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BUTTON_H }}
        scrollEnabled={!isSubmitting}
      >
        <Text style={{ paddingTop: 10, fontWeight: "bold" }}>
          Order Items ({selectedItems.length})
        </Text>

        {/* Horizontal items preview */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.productScroll}
        >
          {selectedItems.map((item, index) => (
            <CheckoutItemCard key={index} item={item} />
          ))}
        </ScrollView>

        {/* Shipping form */}
        <View style={styles.shippingSection}>
          <Text style={styles.sectionTitle}>🚚 Shipping Details</Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={formData.name}
            onChangeText={(val) => handleInputChange("name", val)}
            style={[styles.input, errors.name && styles.inputError]}
            editable={!isSubmitting}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            placeholder="Phone"
            placeholderTextColor={PLACEHOLDER_COLOR}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(val) => handleInputChange("phone", val)}
            style={[styles.input, errors.phone && styles.inputError]}
            editable={!isSubmitting}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* District dropdown (existing CustomDropdown) */}
          <CustomDropdown
            selected={formData.district}
            onSelect={(val) => {
              handleInputChange("district", val);
              // reset upazila when district changes
              if (val !== "Narayanganj" && formData.upazila) {
                handleInputChange("upazila", "");
              }
              setUserTouchedDelivery(false);
            }}
            style={[styles.input, errors.district && styles.inputError]}
            disabled={isSubmitting}
          />
          {errors.district && (
            <Text style={styles.errorText}>{errors.district}</Text>
          )}

          {/* 🔽 Upazila dropdown (only when Narayanganj) */}
          {formData.district === "Narayanganj" && (
            <>
              <TouchableOpacity
                style={[
                  styles.input,
                  { flexDirection: "row", justifyContent: "space-between" },
                  errors.upazila && styles.inputError,
                ]}
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={() =>
                  handleInputChange(
                    "_toggleUpazilaOpen",
                    !formData._toggleUpazilaOpen
                  )
                }
              >
                <Text
                  style={{
                    color: formData.upazila ? "#111" : PLACEHOLDER_COLOR,
                  }}
                >
                  {formData.upazila || "Select Upazila (Narayanganj)"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              {errors.upazila && (
                <Text style={styles.errorText}>{errors.upazila}</Text>
              )}

              {/* simple inline dropdown list */}
              {formData._toggleUpazilaOpen && (
                <View style={styles.dropdownList}>
                  {NARAYANGANJ_UPAZILAS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleInputChange("upazila", u);
                        handleInputChange("_toggleUpazilaOpen", false);
                        setUserTouchedDelivery(false);
                      }}
                    >
                      <Text style={{ color: "#111" }}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <TextInput
            placeholder="Full Address"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={formData.address}
            onChangeText={(val) => handleInputChange("address", val)}
            style={[styles.input, errors.address && styles.inputError]}
            editable={!isSubmitting}
          />
          {errors.address && (
            <Text style={styles.errorText}>{errors.address}</Text>
          )}
        </View>

        {/* Delivery Options (after district selected) */}
        {formData.district && (
          <View style={styles.optionSection}>
            {formData.district === "Narayanganj" && (
              <Text style={styles.sectionTitle}>📦 Delivery Option</Text>
            )}

            {/* FREE (always shown; may be locked below threshold) */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                deliveryOption === "FREE" && styles.optionCardActive,
                (isSubmitting || freeDisabled) && styles.disabledCard, // locked look
              ]}
              onPress={() => {
                if (isSubmitting || freeDisabled) return;
                setDeliveryOption("FREE");
                setUserTouchedDelivery(true);
              }}
              disabled={isSubmitting || freeDisabled}
            >
              <View style={styles.radioDotWrap}>
                <View
                  style={[
                    styles.radioDot,
                    deliveryOption === "FREE" && styles.radioDotActive,
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{freeTitleByArea()}</Text>
                <Text style={styles.optionSub}>
                  {formData.district === "Narayanganj"
                    ? "Delivery time 3–36 hours"
                    : formData.district === "Dhaka"
                    ? "Delivery time within 48 hours"
                    : "Delivery time within 1–3 days"}
                </Text>

                {freeDisabled && (
                  <Text style={styles.lockHint}>
                    Add ৳{remainingForFree} more to unlock FREE
                  </Text>
                )}
              </View>
              <Text style={styles.optionPrice}>{freeCardPriceLabel}</Text>

              {/* small lock badge when locked */}
              {freeDisabled && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#555" />
                  <Text style={styles.lockBadgeText}>Locked</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ✅ Narayanganj Standard (৳120) — for all Upazilas in Narayanganj */}
            {formData.district === "Narayanganj" && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryOption === "NAR120" && styles.optionCardActive,
                  isSubmitting && styles.disabledCard,
                ]}
                onPress={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("NAR120");
                  setUserTouchedDelivery(true);
                }}
                disabled={isSubmitting}
              >
                <View style={styles.radioDotWrap}>
                  <View
                    style={[
                      styles.radioDot,
                      deliveryOption === "NAR120" && styles.radioDotActive,
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Standard Delivery</Text>
                  <Text style={styles.optionSub}>Delivery time 3–24 hours</Text>
                </View>
                <Text style={styles.optionPrice}>৳120</Text>
              </TouchableOpacity>
            )}

            {/* EXPRESS — only for Narayanganj Sodor / Bandar */}
            {showExpress && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryOption === "EXPRESS" && styles.optionCardActive,
                  isSubmitting && styles.disabledCard,
                ]}
                onPress={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("EXPRESS");
                  setUserTouchedDelivery(true);
                }}
                disabled={isSubmitting}
              >
                <View style={styles.radioDotWrap}>
                  <View
                    style={[
                      styles.radioDot,
                      deliveryOption === "EXPRESS" && styles.radioDotActive,
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Express Delivery</Text>
                  <Text style={styles.optionSub}>Delivery within 3 hours</Text>
                </View>
                <Text style={styles.optionPrice}>৳150</Text>
              </TouchableOpacity>
            )}

            {/* ✅ Dhaka Standard (৳50) — only when < threshold */}
            {formData.district === "Dhaka" && !freeEligible && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryOption === "STD" && styles.optionCardActive,
                  isSubmitting && styles.disabledCard,
                ]}
                onPress={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                  setUserTouchedDelivery(true);
                }}
                disabled={isSubmitting}
              >
                <View style={styles.radioDotWrap}>
                  <View
                    style={[
                      styles.radioDot,
                      deliveryOption === "STD" && styles.radioDotActive,
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Standard Delivery</Text>
                  <Text style={styles.optionSub}>
                    Delivery time within 48 hours
                  </Text>
                </View>
                <Text style={styles.optionPrice}>
                  ৳{districtCharge("Dhaka")}
                </Text>
              </TouchableOpacity>
            )}

            {/* ✅ Others Standard (৳130) — only when < threshold */}
            {formData.district === "Others" && !freeEligible && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  deliveryOption === "STD" && styles.optionCardActive,
                  isSubmitting && styles.disabledCard,
                ]}
                onPress={() => {
                  if (isSubmitting) return;
                  setDeliveryOption("STD");
                  setUserTouchedDelivery(true);
                }}
                disabled={isSubmitting}
              >
                <View style={styles.radioDotWrap}>
                  <View
                    style={[
                      styles.radioDot,
                      deliveryOption === "STD" && styles.radioDotActive,
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Standard Delivery</Text>
                  <Text style={styles.optionSub}>
                    Delivery time within 1–3 days
                  </Text>
                </View>
                <Text style={styles.optionPrice}>
                  ৳{districtCharge("Others")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Option (only COD) */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>💳 Payment Option</Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              paymentMethod === "COD" && styles.optionCardActive,
              isSubmitting && styles.disabledCard,
            ]}
            onPress={() => !isSubmitting && setPaymentMethod("COD")}
            disabled={isSubmitting}
          >
            <View style={styles.radioDotWrap}>
              <View
                style={[
                  styles.radioDot,
                  paymentMethod === "COD" && styles.radioDotActive,
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Cash on Delivery</Text>
              <Text style={styles.optionSub}>Pay when you receive</Text>
            </View>
            <Text style={styles.optionPrice}>—</Text>
          </TouchableOpacity>
        </View>

        {/* Coupon */}
        <View style={styles.couponSection}>
          <TextInput
            placeholder="Enter coupon"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={couponCode}
            onChangeText={setCouponCode}
            style={styles.couponInput}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[styles.couponBtn, isSubmitting && { opacity: 0.5 }]}
            onPress={handleApplyCoupon}
            disabled={isSubmitting}
          >
            <Text style={{ color: "#fff" }}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.labelText}>Item(s) Total</Text>
            <Text style={styles.amountText}>
              ৳
              {selectedItems.reduce((acc, item) => {
                const original = item.price || item.productId?.price 
                return acc + original * item.quantity;
              }, 0)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.labelText}>Item(s) Discount</Text>
            <Text style={styles.amountText}>
              -৳
              {selectedItems.reduce((acc, item) => {
                const original = item.price || item.productId?.price;
                const selling = item.selling || item.productId?.selling;
                return acc + (original - selling) * item.quantity;
              }, 0)}
            </Text>
          </View>

          <View className="summaryRow" style={styles.summaryRow}>
            <Text style={styles.labelText}>
              Delivery Charge (
              {deliveryOption === "EXPRESS"
                ? "Express"
                : formData.district === "Narayanganj"
                ? "Narayanganj Std/Free"
                : "Standard"}
              )
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={styles.oldAmount}>৳150</Text>
              <Text
                style={[
                  styles.amountText,
                  deliveryCharge === 0 && { color: "green" },
                ]}
              >
                {deliveryLabelValue}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.labelText}>Handling Charge</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={styles.oldAmount}>৳25</Text>
              <Text style={styles.amountText}>৳{handlingCharge}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.labelText}>Processing Fee</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={styles.oldAmount}>৳9</Text>
              <Text style={styles.amountText}>৳{PROCESSING_FEE}</Text>
            </View>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.labelText, { color: "green" }]}>Coupon</Text>
              <Text style={[styles.amountText, { color: "green" }]}>
                -৳{discount}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, { marginTop: 10 }]}>
            <Text
              style={[styles.labelText, { fontWeight: "bold", color: "red" }]}
            >
              Subtotal
            </Text>
            <Text style={styles.subtotalText}>৳{Subtotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom fixed submit button */}
      <View style={{ position: "absolute", left: 14, right: 14, bottom: 8 }}>
        <TouchableOpacity
          style={[styles.orderBtn]}
          onPress={handleSubmitOrder}
          activeOpacity={isSubmitting ? 1 : 0.7}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator size="small" />
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                Placing order...
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Submit order
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={isModalVisible}
        onClose={() => {
          setModalVisible(false);
          navigation.navigate("Home");
        }}
      />
    </View>
  );
};

export default CheckoutPage;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: "#fff" },

  headerTitle: {
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  backIcon: {
    position: "absolute",
    top: 42,
    left: 10,
    zIndex: 10,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#222", marginTop: 35 },

  productScroll: { flexDirection: "row", marginBottom: 16, marginTop: 15 },

  shippingSection: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e3e3e3",
    paddingBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  // 🔽 simple inline dropdown list style (for Upazila)
  dropdownList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginTop: -6,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginBottom: 8, marginLeft: 4 },

  optionSection: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  optionCardActive: {
    borderColor: "#0ea5e9",
  },
  disabledCard: {
    opacity: 0.6,
  },
  radioDotWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  radioDotActive: {
    backgroundColor: "#0ea5e9",
  },
  optionTitle: { fontSize: 15, fontWeight: "600", color: "#222" },
  optionSub: { fontSize: 12, color: "#666", marginTop: 2 },
  optionPrice: { fontSize: 14, fontWeight: "600", color: "#222" },

  couponSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  couponBtn: {
    backgroundColor: "#006400",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },

  summaryBox: {
    padding: 16,
    backgroundColor: "#fffdf5",
    borderRadius: 8,
    borderColor: "#eee",
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  labelText: { fontSize: 14, color: "#555" },
  amountText: { fontSize: 14, fontWeight: "bold" },
  oldAmount: {
    textDecorationLine: "line-through",
    color: "#999",
    fontSize: 13,
    marginRight: 4,
    opacity: 0.6,
  },
  subtotalText: { fontSize: 18, fontWeight: "bold", color: "red" },

  orderBtn: {
    backgroundColor: "#ff2c55",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 0,
    bottom: 0,
    zIndex: 999,
  },
  orderBtnDisabled: {
    opacity: 0.7,
  },

  // 🔒 free-locked hint/badge
  lockHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#b45309",
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 11,
    color: "#555",
  },
});
