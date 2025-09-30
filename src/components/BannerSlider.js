import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import axios from "axios";
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import { setBanarList } from "../store/banarSlice";

const screenWidth = Dimensions.get("window").width;
const BANNER_CACHE_KEY = "bannerListCacheV1";

const normalizeBanners = (arr = []) =>
  arr.map((b) => ({
    ...b,
    imageUrl: (b?.imageUrl || "").replace("http://", "https://"),
  }));

const toTs = (v) => {
  if (!v) return 0;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  const d = new Date(v).getTime();
  return Number.isNaN(d) ? 0 : d;
};

const mapUpdatedAtById = (arr = []) => {
  const m = new Map();
  for (let i = 0; i < (arr?.length || 0); i++) {
    const p = arr[i];
    m.set(p?._id, toTs(p?.updatedAt) || toTs(p?.createdAt) || 0);
  }
  return m;
};

const needUpdateByUpdatedAt = (oldArr, newArr) => {
  if (!Array.isArray(oldArr)) return true;
  if ((oldArr?.length || 0) !== (newArr?.length || 0)) return true;
  const oldMap = mapUpdatedAtById(oldArr);
  for (let i = 0; i < (newArr?.length || 0); i++) {
    const p = newArr[i];
    const prevTs = oldMap.get(p?._id);
    const currTs = toTs(p?.updatedAt) || toTs(p?.createdAt) || 0;
    if (!prevTs || prevTs !== currTs) return true;
  }
  return false;
};

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const flatListRef = useRef(null);
  const indexRef = useRef(0);         // ✅ state নয়, ref
  const timerRef = useRef(null);
  const viewableIndexRef = useRef(0); // ✅ দৃশ্যমান index (ref only)
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const bannersFromStore = useSelector((s) => s.banarState.banarList);

  // hydrate: Redux → Cache → API (AbortController সহ)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      if (bannersFromStore?.length) {
        setBanners(bannersFromStore);
      } else {
        const raw = await AsyncStorage.getItem(BANNER_CACHE_KEY);
        if (raw && mounted) {
          try {
            const cached = JSON.parse(raw);
            if (Array.isArray(cached)) {
              const norm = normalizeBanners(cached);
              setBanners(norm);
              dispatch(setBanarList(norm));
            }
          } catch {}
        }
      }

      if (banners?.length) return false

      try {
        const res = await axios.get(SummaryApi.get_banner.url, {
          signal: controller.signal,
        });
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const fresh = normalizeBanners(res.data.data);
          const current = bannersFromStore?.length ? bannersFromStore : banners;
          if (needUpdateByUpdatedAt(current, fresh)) {
            if (!mounted) return;
            dispatch(setBanarList(fresh));
            setBanners(fresh);
            await AsyncStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(fresh));
          }
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ইচ্ছাকৃতভাবে one-time

  // 🔄 Auto-slide (focus থাকলেই), কোনো setState নয় → re-render কম
  useEffect(() => {
    if (!isFocused || banners.length === 0) return;
    // বর্তমান দৃশ্যমান index থেকে শুরু
    indexRef.current = viewableIndexRef.current;

    timerRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      indexRef.current = next;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isFocused, banners.length]);

  // কোন স্লাইড দেখা যাচ্ছে — শুধু ref আপডেট (re-render নয়)
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first?.index != null) {
      viewableIndexRef.current = first.index;
      indexRef.current = first.index;
    }
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  });

  // renderItem memo (inline new fn এড়াতে)
  const renderItem = useCallback(({ item }) => {
    const uri = item?.imageUrl || "";
    return (
      <ExpoImage
        source={{ uri }}
        style={styles.bannerImage}
        contentFit="cover"
        cachePolicy="disk"
        allowDownscaling
        recycleMemory
        transition={100}
      />
    );
  }, []);

  const keyExtractor = useCallback(
    (item, index) => item?._id || item?.imageUrl || String(index),
    []
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    []
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={2}
        removeClippedSubviews
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        // Android scroll perf
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerImage: {
    width: screenWidth,
    height: 180,
  },
});

export default BannerSlider;
