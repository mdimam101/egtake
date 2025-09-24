import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import { setBanarList } from "../store/banarSlice";

const screenWidth = Dimensions.get("window").width;
const BANNER_CACHE_KEY = "bannerListCacheV1";

// ✅ normalize http → https
const normalizeBanners = (arr = []) =>
  arr.map((b) => ({
    ...b,
    imageUrl: (b?.imageUrl || "").replace("http://", "https://"),
  }));

// ✅ convert timestamp safely
const toTs = (v) => {
  if (!v) return 0;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  const d = new Date(v).getTime();
  return Number.isNaN(d) ? 0 : d;
};

// ✅ make map of _id → updatedAt
const mapUpdatedAtById = (arr = []) => {
  const m = new Map();
  for (let i = 0; i < (arr?.length || 0); i++) {
    const p = arr[i];
    m.set(p?._id, toTs(p?.updatedAt) || toTs(p?.createdAt) || 0);
  }
  return m;
};

// ✅ check if update needed (length / new id / updatedAt change)
const needUpdateByUpdatedAt = (oldArr, newArr) => {
  if (!Array.isArray(oldArr)) return true;
  if ((oldArr?.length || 0) !== (newArr?.length || 0)) return true;

  const oldMap = mapUpdatedAtById(oldArr);
  for (let i = 0; i < (newArr?.length || 0); i++) {
    const p = newArr[i];
    const prevTs = oldMap.get(p?._id);
    const currTs = toTs(p?.updatedAt) || toTs(p?.createdAt) || 0;
    if (!prevTs) return true;
    if (prevTs !== currTs) return true;
  }
  return false;
};

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const dispatch = useDispatch();

  const getBanarListFromStore = useSelector(
    (state) => state.banarState.banarList
  );

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      // 1) Redux
      if (getBanarListFromStore?.length) {
        setBanners(getBanarListFromStore);
      } else {
        // 2) Cache
        const raw = await AsyncStorage.getItem(BANNER_CACHE_KEY);
        if (raw) {
          try {
            const cached = JSON.parse(raw);
            if (mounted && Array.isArray(cached)) {
              const norm = normalizeBanners(cached);
              setBanners(norm);
              dispatch(setBanarList(norm));
            }
          } catch {}
        }
      }

      // 3) API
      try {
        const res = await axios.get(SummaryApi.get_banner.url);
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const fresh = normalizeBanners(res.data.data);

          const current = getBanarListFromStore?.length
            ? getBanarListFromStore
            : banners;

          if (needUpdateByUpdatedAt(current, fresh)) {
            if (!mounted) return;
            dispatch(setBanarList(fresh));
            setBanners(fresh);
            await AsyncStorage.setItem(
              BANNER_CACHE_KEY,
              JSON.stringify(fresh)
            );
          }
        }
      } catch {}
    };

    hydrate();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⏱️ Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      if (banners.length > 0) {
        const nextIndex = (currentIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  const renderItem = ({ item }) => (
    <Image
      source={{ uri: (item?.imageUrl || "").replace("http://", "https://") }}
      style={styles.bannerImage}
    />
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerImage: {
    width: screenWidth,
    height: 180,
    resizeMode: "cover",
  },
});

export default BannerSlider;
