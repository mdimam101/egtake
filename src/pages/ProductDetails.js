// ✅ Final best-practice version with scroll-to-top and slide-in behavior + shipping info
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SummaryApi from "../common/SummaryApi";
import UserProductCart from "../components/UserProductCart";
import Context from "../context";
import addToCart from "../helper/addToCart";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import FullscreenImageModal from "../components/FullscreenImageModal";
import ImageWithSkeleton from "../components/ImageWithSkeleton";
import handleWhatsApp from "../helper/handleWhatsApp";
import { increaseUserInterest } from "../helper/userInterestHelper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import isEqual from "lodash.isequal";
import Toast from "react-native-toast-message";
import { canon, ensureHttps } from "../common/urlUtils";
import { pushGuestCartUnique } from "../helper/guestCart";
import { trackBasic } from "../helper/trackBasic";
import { generateOptimizedVariants } from "../helper/variantUtils";

const Stars = ({ value = 0, size = 14 }) => (
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

const { width: screenWidth } = Dimensions.get("window");
const SIZE_TYPE_LETTER = ["S", "M", "L", "XL", "XXL"];
const SIZE_TYPE_NUMBER = [
  "22",
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
];

const ProductDetails = ({ route }) => {
  const { id, variantColor, variantSize, image } = route.params;
  const { image: passedImage } = route.params; //add

  const { fetchUserAddToCart, cartCountProduct } = useContext(Context);
  const navigation = useNavigation();

  const [data, setData] = useState({
    productName: "",
    brandName: "",
    category: "",
    subCategory: "",
    variants: [],
    description: "",
    price: 0,
    selling: 0,
  });
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [imageVariantMap, setImageVariantMap] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState({
    title: "",
    detail: "",
  });
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state?.userState?.user);

  const imageSliderRef = useRef();
  const scrollRef = useRef();

  // review details
  const [reviews, setReviews] = useState([]); // ← আগের undefined থেকে [] করলাম

  const previewReviews = useMemo(
    () => (Array.isArray(reviews) ? reviews.slice(0, 3) : []),
    [reviews]
  );

  const { avgRating, reviewCount } = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return { avgRating: 0, reviewCount: 0 };
    }
    const total = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    return {
      avgRating: Math.round((total / reviews.length) * 10) / 10,
      reviewCount: reviews.length,
    };
  }, [reviews]);

  // component এর স্টেটে যোগ করো:
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImages, setViewerImages] = useState([]); // string[]
  const [viewerIndex, setViewerIndex] = useState(0);

  // helper: viewer খুলবে
  const openViewer = (imagesArr, startIndex = 0, title = "") => {
    if (!Array.isArray(imagesArr) || imagesArr.length === 0) return;
    setViewerImages(imagesArr);
    setViewerIndex(Math.max(0, Math.min(startIndex, imagesArr.length - 1)));
    setShowImageViewer(true);
  };

  // 1st render er somuy cache use kore
  const getCachedProduct = async (productId) => {
    try {
      const raw = await AsyncStorage.getItem("productListCache");
      if (raw) {
        const list = JSON.parse(raw);
        return list.find((p) => p._id === productId) || null;
      }
    } catch (err) {
      // console.log("❌ Cache read error", err);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateUI = async (productData) => {
      if (!isMounted) return;

      setData(productData); // 🧠 show product

      // 🔧 route থেকে আসা image (Home এ https) আর backend-এর image (http) – protocol agnostic করে মিলাও
      const passedImage = route.params?.image || "";
      const passedKey = canon(passedImage);
      const variantIndexFromImage = productData.variants.findIndex((variant) =>
        (variant.images || []).some((u) => canon(u) === passedKey)
      );
      const finalVariantIndex =
        variantIndexFromImage !== -1 ? variantIndexFromImage : 0;

      setSelectedVariantIndex(finalVariantIndex);
      setSelectedSize(null);

      // 🔁 Image map
      const imageVariantMap = [];
      const displayImages = [];
      const keys = [];

      productData.variants.forEach((variant, vIndex) => {
        (variant.images || []).forEach((raw) => {
          const show = ensureHttps(raw);
          const key = canon(raw);
          imageVariantMap.push({ key, variantIndex: vIndex });
          displayImages.push(show);
          keys.push(key);
        });
      });

      setAllImages(displayImages);
      setImageVariantMap(imageVariantMap);

      // যদি passedImage থাকে → ওটাই নাও, না হলে fallback
      const selectedKey =
        passedImage ||
        canon(productData.variants[finalVariantIndex]?.images?.[0]);

      const scrollToIndex = keys.findIndex((k) => k === selectedKey);

      if (scrollToIndex !== -1 && imageSliderRef.current) {
        requestAnimationFrame(() => {
          imageSliderRef.current.scrollTo({
            x: screenWidth * scrollToIndex,
            animated: false,
          });
        });
      }

      const initIdxFromPassed = passedImage
        ? keys.findIndex((k) => k === passedImage)
        : -1;
      const initIndex = initIdxFromPassed >= 0 ? initIdxFromPassed : 0;

      //const initialImg = passedImage || displayImages[initIndex] || null;
      setSelectedImg(ensureHttps(passedImage));
      setCurrentIndex(initIndex);

      // recommendProduct
      const raw = await AsyncStorage.getItem("productListCache");
      if (raw) {
        const list = JSON.parse(raw);
        const reco =
          list.filter((p) => p.category === productData.category) || null;
        if (reco) {
          setRecommendedProducts(reco);
        }
      }
    };

    const fetchData = async () => {
      setLoading(true);

      // 1️⃣ Cached
      const cached = await getCachedProduct(id);
      if (cached) {
        hydrateUI(cached);
        setLoading(false);
      }

      // 2️⃣ API
      try {
        const res = await axios({
          method: SummaryApi.product_details.method,
          url: SummaryApi.product_details.url,
          headers: { "Content-Type": "application/json" },
          data: { productId: id },
        });

        if (res.data.success) {
          const fresh = res.data.data;

          if (!isEqual(fresh, cached)) {
            hydrateUI(fresh); // only if changed
          }
          // tracking
          trackBasic("product_view", { subCategory: fresh.subCategory });

          // 🔁 recommendations
          // const reco = await axios({
          //   method: SummaryApi.category_wish_product.method,
          //   url: SummaryApi.category_wish_product.url,
          //   headers: { "Content-Type": "application/json" },
          //   data: { category: fresh.category },
          // });
          // if (reco.data.success) {
          // console.log("🦌◆recoreco.data.data",reco.data.data);
          // setRecommendedProducts(reco.data.data || []);
          // }
        }
      } catch {} 
      
      finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [id]);

  //show categoru wise products
  const optimizedProducts = useMemo(() => {
    const optimizedProductsResult =
      generateOptimizedVariants(recommendedProducts);
    return optimizedProductsResult;
  }, [recommendedProducts]);

  // 1️⃣ After getting `data.variants`, dynamically check:
  const isColorAvailable = data.variants?.some((v) => v.color?.trim());
  const selectedVariant = data.variants[selectedVariantIndex] || {};
  const variantSizes = selectedVariant.sizes || [];
  const isSizeAvailable = variantSizes.some((s) => s.size?.trim());

  let isNumberType = false;
  // check Size tyep(Number Or Letter)
  if (data.variants.length > 1) {
    const isNumeric = (v) =>
      v?.toString().trim() !== "" && Number.isFinite(Number(v));
    isNumberType = isNumeric(data.variants[0]?.sizes[0]?.size);
  }

  const SelectTSizeType = isNumberType ? SIZE_TYPE_NUMBER : SIZE_TYPE_LETTER;

  const getStockBySize = (size) => {
    const sizeObjWithStk = variantSizes.find((s) => s.size === size);
    return sizeObjWithStk ? sizeObjWithStk.stock : 0;
  };

  const discount =
    data.price && data.selling
      ? Math.floor(((data.price - data.selling) / data.price) * 100)
      : 0;

  const totalStock = variantSizes.reduce((sum, s) => sum + s.stock, 0);
  const isAddToCartDisabled = () => {
    if (isSizeAvailable) {
      // Size ase, kintu select hoy nai or stock 0
      const selectedSizeStock =
        variantSizes.find((s) => s.size === selectedSize)?.stock || 0;
      return !selectedSize || selectedSizeStock <= 0;
    } else if (!totalStock) {
      return totalStock <= 0;
    }

    // Size nai → always allow
    return false;
  };

  // ✅ Only validate size if sizes are available
  const handleAddToCart = async () => {
    if (isSizeAvailable && !selectedSize) {
      Alert.alert("Please select a size.");
      return;
    } else if (isColorAvailable && data.variants.length < 1) {
      Alert.alert("Please select a color.");
      return;
    }

    const payload = {
      productId: data._id,
      productName: data.productName,
      size: isSizeAvailable ? selectedSize : "",
      color: isColorAvailable ? selectedVariant?.color : "",
      image: (selectedImg || "").replace("https://", "http://"),
      price: data.price,
      selling: data.selling,
    };

    // ✅ Not logged in → guest cart (duplicate block)
    if (!user?._id) {
      // payload.isStoreData = true
      const res = await pushGuestCartUnique(payload);
      if (res.added) {
        fetchUserAddToCart(false);
        trackBasic("add_to_cart", { subCategory: data?.subCategory, count: 1 });
        Toast.show({ type: "success", text1: "Added to cart" });
      } else {
        Toast.show({ type: "info", text1: "Already in cart" }); // duplicate হলে
      }
    } else {
      // ✅ Logged-in → server cart as-is
      await addToCart(payload);
      fetchUserAddToCart(true);
      trackBasic("add_to_cart", { subCategory: data?.subCategory, count: 1 });
      Toast.show({ type: "success", text1: "Added to cart" });
    }
  };

  const openCommitmentModal = (title, detail) => {
    setSelectedCommitment({ title, detail });
    setModalVisible(true);
  };
  // console.log("🦌🦌🦌🦌SelectedSize", selectedSize);

  // status stock check
  let stockMessage = "";

  if (isSizeAvailable) {
    if (!selectedSize) {
      const hasStock = variantSizes.some((s) => s.stock > 0);
      stockMessage = hasStock ? "Please select a size" : "Sold out";
    } else {
      const selectedSizeObj = variantSizes.find((s) => s.size === selectedSize);
      stockMessage =
        selectedSizeObj?.stock > 0
          ? `Only ${selectedSizeObj.stock} left`
          : "Sold out";
    }
  } else {
    // Size not available: count total stock directly from sizes
    stockMessage = totalStock > 0 ? `Only ${totalStock} left` : "Sold out";
  }

  useEffect(() => {
    if (data?.subCategory) {
      increaseUserInterest(data.subCategory);
    }
  }, [data?.subCategory]);

  const selectedVariantDetails = selectedVariant.sizes || [
    { size: "S", stock: 5, length: 32, chest: 38, sleeve: 22 },
    { size: "M", stock: 3, length: 33, chest: 40, sleeve: 23 },
    { size: "L", stock: 0, length: 34, chest: 42, sleeve: 24 },
  ];

  const handleWhatsChat = () => {
    handleWhatsApp(data);
  };

  // get product review
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await axios.get(SummaryApi.get_product_reviews(data._id));
        if (res.data.success) {
          setReviews(res.data.data || []);
          // console.log("🦌details◆", res.data.data);
        }
      } catch (e) {
        // console.log("🦌detailserror◆", e?.message);
      }
    }
    if (data?._id) fetchReviews();
  }, [data?._id]);

  const ACTION_BAR_HEIGHT = 105;

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Back Button fixed top-left */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={25} color="#000" />
      </TouchableOpacity>

      <ScrollView
        style={styles.container}
        ref={scrollRef}
        contentContainerStyle={{
          paddingBottom: ACTION_BAR_HEIGHT,
        }}
      >
        <View>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            snapToInterval={screenWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            ref={imageSliderRef}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / screenWidth);
              const currentImage = allImages[index]; // https display

              setSelectedImg(currentImage);
              setCurrentIndex(index);

              // currentImage কে canonical key বানিয়ে map-এ খুঁজি
              const currentKey = canon(currentImage);
              const found = imageVariantMap.find(
                (item) => item.key === currentKey
              );

              if (found && found.variantIndex !== selectedVariantIndex) {
                setSelectedVariantIndex(found.variantIndex);
                setSelectedSize(null); // Reset size if variant changed
              }
            }}
          >
            {loading && (
              <ImageWithSkeleton
                key={1}
                uri={"img"}
                style={styles.sliderImage}
              />
            )}

            {allImages.map((img, index) => (
              // <Image
              //   key={index}
              //   source={{ uri: img.replace("http://", "https://") }}
              //   style={styles.sliderImage}
              // />
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => openViewer(allImages, index, data?.productName)}
              >
                <Image
                  key={index}
                  source={{
                    uri:
                      currentIndex === index
                        ? ensureHttps(selectedImg) || ensureHttps(img)
                        : ensureHttps(img),
                  }}
                  style={styles.sliderImage}
                />
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
          <Text style={styles.imageCountText}>
            {currentIndex + 1}/{allImages.length}
          </Text>
        </View>

        {data.variants.length > 1 && (
          <Text style={styles.variantCounter}>
            Variant {selectedVariantIndex + 1}/{data.variants.length}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.sellingPrice}>৳{data.selling}</Text>
          {discount > 0 && (
            <Text style={styles.discount}>Save {discount}%</Text>
          )}
          <Text style={styles.originalPrice}>৳{data.price}</Text>
        </View>

        <Text style={styles.productName}>{data.productName}</Text>

        {/* ⭐ Short average review chip */}
        {reviewCount > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Reviews", {
                productId: data?._id,
                productName: data?.productName,
              })
            }
            style={styles.avgChip}
          >
            {/* rivew average rating */}
            <Text style={styles.avgChipText}>{avgRating.toFixed(1)}</Text>
            {/* rivew stars */}
            <Stars value={avgRating} size={14} />
            {/* total rivewer */}
            <Text style={styles.avgChipCount}>· {reviewCount} reviews</Text>
          </TouchableOpacity>
        )}

        {selectedVariant.color && data.variants.length > 1 && (
          <Text style={styles.colorInfo}>Color: {selectedVariant.color}</Text>
        )}

        {data.variants.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailRow}
          >
            {data.variants.map((variant, idx) => {
              const thumbImage = variant.images?.[0];
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedVariantIndex(idx);
                    setSelectedSize(null);
                    const newImg = variant.images?.[0];
                    setSelectedImg(ensureHttps(newImg)); //setSelectedImg(newImg);
                    const imgIndex = allImages.findIndex(
                      (img) => canon(img) === canon(newImg) //(img) => img === newImg
                    );
                    if (imgIndex !== -1 && imageSliderRef.current) {
                      imageSliderRef.current.scrollTo({
                        x: screenWidth * imgIndex,
                        animated: true,
                      });
                    }
                  }}
                  style={[
                    styles.thumbnailBox,
                    idx === selectedVariantIndex && styles.activeThumbnailBox,
                  ]}
                >
                  {thumbImage && (
                    <Image
                      source={{
                        uri: ensureHttps(thumbImage),
                      }}
                      style={styles.thumbnailImage}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ✅ Only show size options if available */}
        {isSizeAvailable && (
          <>
            <Text style={styles.sizeLabel}>Select Size</Text>
            <View style={styles.sizeOptions}>
              {SelectTSizeType.map((size) => {
                const stock = getStockBySize(size);
                const disabled = stock === 0;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => !disabled && setSelectedSize(size)}
                    disabled={disabled}
                    style={[
                      styles.sizeBox,
                      selectedSize === size && styles.activeSizeBox,
                      disabled && styles.disabledBox,
                    ]}
                  >
                    <Text>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
        <Text style={styles.stockInfo}>{stockMessage}</Text>
        {/* sizeDetailBox */}
        {selectedSize && (
          <View style={styles.sizeDetailBox}>
            <Text style={styles.sizeDetailTitle}>
              Size: {selectedSize} Details
            </Text>
            {(() => {
              const selected = selectedVariantDetails.find(
                (s) => s.size === selectedSize
              );
              if (!selected) return null;
              return (
                <>
                  <Text style={styles.sizeDetailText}>
                    Length: {selected.length || "-"}
                  </Text>
                  <Text style={styles.sizeDetailText}>
                    Chest: {selected.chest || "-"}
                  </Text>
                  <Text style={styles.sizeDetailText}>
                    Sleeve: {selected.sleeve || "-"}
                  </Text>
                </>
              );
            })()}
          </View>
        )}

        <View>
          <View style={styles.commitHeaderWrapper}>
            <LinearGradient
              colors={["#FFF39C", "#fffce5"]} // উপরে গাঢ়, নিচে হালকা
              style={styles.commitHeaderWrapper}
            >
              <Text style={styles.commitHeaderText}>EgTake Commitment</Text>
            </LinearGradient>
          </View>

          <View style={styles.policyCard}>
            {/* Shipping */}
            <TouchableOpacity
              style={styles.policyItem}
              onPress={() =>
                openCommitmentModal(
                  "Free Delivery",
                  `✓নারায়ণগঞ্জে ৪৯৯ টাকা বা তার বেশি অর্ডার করলে ফ্রি ডেলিভারি।
                  \n✓Narayanganj Express delivery within 3 hours`
                )
              }
            >
              <View>
                <View style={styles.policyRowJustify}>
                  <Text style={styles.policyTitle}>🚚 Free delivery</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
                {/* <Text style={[styles.policySubText, {paddingLeft:20}]}>
                </Text> */}
                <Text style={styles.policyCheck}>
                  <Text style={{ color: "green" }}>✓</Text> when eligible—tap
                  here for details.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delivery Commitment */}
            <TouchableOpacity
              style={styles.policyItem}
              onPress={() =>
                openCommitmentModal(
                  "Delivery Commitment",
                  `✓ 150円 coupon code if delayed\n✓ Refund if items damaged\n✓ Refund if package lost\n✓ Refund if no delivery`
                )
              }
            >
              <View>
                <View style={styles.policyRowJustify}>
                  <Text style={styles.policyTitle}>📦 Delivery Commitment</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> ৳150 coupon code
                    if delayed
                  </Text>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Refund if items
                    damaged
                  </Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Refund if wrong
                    items delivery
                  </Text>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Refund if no
                    delivery
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/*🛡️ Free Returns Commitment */}
            <TouchableOpacity
              style={styles.policyItem}
              onPress={() =>
                openCommitmentModal(
                  "Free Return Commitment",
                  `✓ অর্ডার করা পণ্যের পরিবর্তে ভিন্ন কিছু এসেছে।\n✓ পণ্যটি পৌঁছানোর সময় ভাঙা, ফাটা, বা কাজ করছে না।\n✓ প্রয়োজনীয় পার্টস বা এক্সেসরিজ নেই (যেমন চার্জার, কভার, ক্যাবল ইত্যাদি)।\n✓ অর্ডার অনুযায়ী সাইজ বা কালার আসেনি।
                  \n✓ অর্ডার অনুযায়ী সংখ্যা ঠিকমতো আসেনি।\n✓ ইলেকট্রনিক আইটেম চালু হয় না বা সমস্যা করে।`
                )
              }
            >
              <View>
                <View style={styles.policyRowJustify}>
                  <Text style={styles.policyTitle}>
                    🔁 Free Return Commitment
                  </Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Wrong Item
                    Delivered
                  </Text>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Damaged or
                    Defective Product
                  </Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> Size/Color
                    Mismatch
                  </Text>
                  <Text style={styles.policyCheck}>
                    <Text style={{ color: "green" }}>✓</Text> For more details
                    click here
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Return Policy */}
            {/* <TouchableOpacity
              style={styles.policyItem}
              onPress={() =>
                openCommitmentModal(
                  "Return Policy",
                  "You can return items within 15 days of receiving your order."
                )
              }
            >
              <View style={styles.policyRowJustify}>
                <Text style={styles.policyTitle}>
                  🔁 Returns within 15 days
                </Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity> */}
          </View>
        </View>

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedCommitment.title}</Text>
              <Text style={styles.modalDetail}>
                {selectedCommitment.detail}
              </Text>
              <Pressable
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Text style={styles.descLabel}>Product Details</Text>
        <TouchableOpacity
          onPress={() =>
            openCommitmentModal("Product Details", data.description)
          }
        >
          <View style={styles.policyRowJustify}>
            <Text style={{ paddingTop: 10, color: "green" }}>
              Specification ›
            </Text>
          </View>
        </TouchableOpacity>

        {/* 🔰 Reviews area */}
        <View style={styles.reviewPreview}>
          <View style={styles.reviewPreviewHeader}>
            <Text style={styles.reviewTitle}>Customer Reviews</Text>
          </View>

          {/* No review state */}
          {(!reviews || reviews.length === 0) && (
            <Text style={{ color: "#666" }}>No reviews yet.</Text>
          )}

          {/*show Top 3 rivews*/}
          {previewReviews.map((rv) => (
            <View key={rv._id} style={styles.reviewItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewUser}>{rv.userName || "User"}</Text>
                <Stars value={rv.rating} />
                {rv.comment ? (
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {rv.comment}
                  </Text>
                ) : null}

                {/* thumbs (70×70) */}
                {Array.isArray(rv.images) && rv.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {rv.images.slice(0, 5).map((u, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.9}
                        onPress={() =>
                          openViewer(rv.images, idx, "Review photos")
                        }
                        style={styles.thumbBox}
                      >
                        <Image source={{ uri: u }} style={styles.thumbImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          ))}

          {/* যদি রিভিউ <= 3 হয় কিন্তু সব দেখতে চাও */}
          {Array.isArray(reviews) && reviews.length > 0 ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Reviews", {
                  productId: data?._id,
                  productName: data?.productName,
                })
              }
              style={{
                alignSelf: "flex-start",
                marginTop: 10,
                backgroundColor: "#111",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="chatbubbles" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                View more reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <FullscreenImageModal
          visible={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={viewerImages}
          initialIndex={viewerIndex}
          title={data?.productName || "Photos"}
        />

        <View style={{ marginTop: 40, marginBottom: -60 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
            Recommended Products
          </Text>
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {optimizedProducts
                .filter((_, idx) => idx % 2 === 0)
                .map((item, index) => (
                  <View key={index} style={styles.cardWrapper}>
                    <UserProductCart productData={item} fromDetails={true} />
                  </View>
                ))}
            </View>
            <View style={styles.column}>
              {optimizedProducts
                .filter((_, idx) => idx % 2 !== 0)
                .map((item, index) => (
                  <View key={index} style={styles.cardWrapper}>
                    <UserProductCart productData={item} fromDetails={true} />
                  </View>
                ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.fixedActionRow, { paddingBottom: 8 }]}>
        {/* cart icone btn */}
        <TouchableOpacity
          onPress={() => navigation.navigate("CartPage")}
          style={styles.detailsCartWrapper}
        >
          <View style={{ alignItems: "center" }}>
            <Ionicons name="cart-outline" size={30} color="#333" />
          </View>
          {cartCountProduct > 0 && (
            <View style={styles.detailsBadge}>
              <Text style={styles.detailsBadgeText}>{cartCountProduct}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* WhatsApp Button */}
        <TouchableOpacity
          style={styles.whatsappRowBtn}
          onPress={handleWhatsChat}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[styles.cartRowBtn, isAddToCartDisabled() && { opacity: 0.4 }]}
          disabled={isAddToCartDisabled()}
          onPress={handleAddToCart}
        >
          <Text style={styles.cartRowText}>
            {(totalStock ?? 0) <= 0
              ? "Out of Stock"
              : isSizeAvailable
              ? !selectedSize
                ? "Select Size"
                : variantSizes.find((s) => s.size === selectedSize)?.stock > 0
                ? "Add to Cart"
                : "Out of Stock"
              : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 6, backgroundColor: "#fff", marginBottom: 25 }, //marginBottom: 75
  backButton: {
    position: "absolute",
    top: 45,
    left: 16,
    zIndex: 9999,
    backgroundColor: "rgba(0,0,0,0.3)", // transparent white
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sliderImage: {
    width: screenWidth,
    height: 500,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },
  imageCountText: {
    position: "absolute",
    bottom: 15,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 14,
  },
  variantCounter: { textAlign: "center", marginVertical: 6, color: "#444" },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  sellingPrice: { fontSize: 22, fontWeight: "bold", color: "#222" },
  discount: {
    backgroundColor: "#e53935",
    color: "#fff",
    fontSize: 12,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  originalPrice: { textDecorationLine: "line-through", color: "#888" },
  productName: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  colorInfo: { fontSize: 14, marginTop: 4, color: "#555" },
  thumbnailRow: { flexDirection: "row", marginTop: 12 },
  thumbnailBox: {
    width: 50,
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 12,
    overflow: "hidden",
  },
  activeThumbnailBox: { borderColor: "#ff5722", borderWidth: 2 },
  thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },
  sizeLabel: { fontSize: 16, fontWeight: "600", marginTop: 20 },
  sizeOptions: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  sizeBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
    marginBottom: 10,
  },
  activeSizeBox: { borderColor: "#000", borderWidth: 2 },
  disabledBox: { opacity: 0.4 },
  stockInfo: { color: "red", fontSize: 12, marginTop: 8 },
  // sizeDetailBox
  sizeDetailBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderColor: "#eee",
    borderWidth: 1,
  },
  sizeDetailTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  sizeDetailText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 2,
  },

  descLabel: { fontSize: 16, fontWeight: "600", marginTop: 20 },
  description: { fontSize: 14, marginTop: 8, color: "#555" },
  addToCartWrapper: { marginTop: 24, marginBottom: 40 },
  fixedAddToCartWrapper: {
    position: "absolute",
    width: 250,
    bottom: 0,
    left: 120,
    right: 50,
    padding: 6,
    backgroundColor: "#ff2c55", //"#ff2c55",
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    zIndex: 999,
  },
  masonryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    backgroundColor: "#EBEBEB",
  },

  //delivery return style
  commitHeaderWrapper: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  commitHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#222",
  },
  policyCard: {
    marginTop: -20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
    gap: 0,
    paddingBottom: 0,
  },
  policyItem: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 12,
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 14,
    // fontWeight: "bold",
    color: "#3BAF4E",
  },
  policySubText: {
    color: "#444",
    fontSize: 12,
    marginTop: 4,
  },
  boldText: {
    fontWeight: "bold",
    color: "#000",
  },
  policyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  policyCheck: {
    color: "gray",
    fontSize: 10.7,
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: "#888",
    marginLeft: 10,
  },

  policyRowJustify: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // modal style
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalDetail: { fontSize: 16, marginBottom: 20 },
  modalButton: {
    backgroundColor: "#ff5722",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: { fontWeight: "bold", color: "#fff", fontSize: 16 },
  cardWrapper: {},
  column: {
    width: "49.5%",
    gap: 4,
  },

  //

  fixedActionRow: {
    position: "absolute",
    bottom: 1, // ✅ was 20
    left: 0, // ✅ keep space for mini cart footer
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff", // ✅ solid bg so overlay না লাগে
    // borderTopLeftRadius: 16,
    // borderTopRightRadius: 16,
    zIndex: 9999,
    elevation: 12, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },

  detailsCartWrapper: { position: "relative", paddingLeft: 20 },

  detailsBadge: {
    position: "absolute",
    top: -6,
    right: -12,
    backgroundColor: "#e91e63",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  detailsBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  whatsappRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    width: 60,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 30,
    left: 8,
    // flex: 0,
  },

  whatsappText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },

  cartRowBtn: {
    backgroundColor: "#ff2c55",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    // flex: 1,
    height: 38,
    width: 180,
    alignItems: "center",
  },

  cartRowText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // rivews style

  avgChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  avgChipText: { fontWeight: "700", color: "#222" },
  avgChipCount: { color: "#666", marginLeft: 2, fontSize: 12 },

  reviewPreview: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  reviewPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  moreBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  moreBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  reviewItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#F1F1F1",
  },
  reviewUser: { fontWeight: "700", color: "#333", marginBottom: 2 },
  reviewText: { color: "#333", marginTop: 4, lineHeight: 18 },

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

export default ProductDetails;
