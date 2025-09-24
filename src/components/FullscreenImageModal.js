// FullscreenImageModal.js
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const normalizeUri = (u = "") =>
  u.replace(/^http:\/\//i, "https://").replace(/ /g, "%20");

// ---- Single zoomable slide (unchanged logic)
const ZoomableSlide = ({ uri, onZoomingChange = () => {}, resetToken, panEnabled }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const MAX = 4, MIN = 1;

  useEffect(() => {
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    onZoomingChange(false);
  }, [resetToken]);

  const tellZoomJS = (v) => onZoomingChange(v);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((_e, ok) => {
      if (!ok) return;
      if (scale.value > 1.01) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        runOnJS(tellZoomJS)(false);
      } else {
        scale.value = withTiming(2);
        runOnJS(tellZoomJS)(true);
      }
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => { savedScale.value = scale.value; })
    .onChange((e) => {
      const next = Math.min(MAX, Math.max(MIN, savedScale.value * e.scale));
      scale.value = next;
      runOnJS(tellZoomJS)(next > 1.01);
    })
    .onEnd(() => {
      if (scale.value < MIN + 0.01) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        runOnJS(tellZoomJS)(false);
      }
    });

  const pan = Gesture.Pan()
    .enabled(panEnabled) // ✅ only when zoomed
    .minDistance(2)
    .onBegin(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onChange((e) => {
      if (scale.value <= 1.01) return;
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    });

  const composed = Gesture.Simultaneous(doubleTap, pinch, pan);
  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <View style={styles.slide}>
      <GestureDetector gesture={composed}>
        <Animated.View style={rStyle}>
          <Image source={{ uri }} style={styles.fullImage} contentFit="contain" transition={80} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const FullscreenImageModal = ({ visible, onClose, images = [], initialIndex = 0 }) => {
  const listRef = useRef(null);
  const [index, setIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  // const insets = useSafeAreaInsets();                         // ✅

  useEffect(() => {
    if (visible && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
        setIndex(initialIndex);
        setResetToken((n) => n + 1);
        setIsZoomed(false);
      }, 0);
    }
  }, [visible, initialIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const i = viewableItems[0].index ?? 0;
      setIndex(i);
      setResetToken((n) => n + 1);
      setIsZoomed(false);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

const renderItem = ({ item }) => (
  <ZoomableSlide
    // uri={normalizeUri(item)}   
    uri={normalizeUri(item.replace("http://", "https://"))}        // ✅ http → https
    resetToken={resetToken}
    panEnabled={isZoomed}
    onZoomingChange={(z) => setIsZoomed(z)}
  />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      {/* ✅ Keep status bar visible with light icons while modal is open */}
      {/* <StatusBar style="light" backgroundColor="rgba(0,0,0,0.001)" translucent /> */}

      <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <View style={{height:40, backfaceVisibility:"#000"}}></View> */}
        <View style={styles.overlay}>
          {/* top bar */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <Text style={styles.counter}>{index + 1} / {images.length}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(u, i) => `${u}-${i}`}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEnabled={!isZoomed}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default FullscreenImageModal;

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: "#000" },
  topBar: {
    paddingBottom: 10,
    paddingTop:50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  counter: { color: "#fff", fontSize: 12, opacity: 0.85, marginRight: 8 },
  closeBtn: { backgroundColor: "rgba(255,255,255,0.18)", padding: 8, borderRadius: 16 },
  slide: { width: SCREEN_W, height: SCREEN_H, justifyContent: "center", alignItems: "center" },
  fullImage: { width: SCREEN_W, height: SCREEN_H * 0.86 }, // same ratio as before
});
