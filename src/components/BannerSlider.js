import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import { setBanarList } from "../store/banarSlice";

const screenWidth = Dimensions.get("window").width;

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
    const dispatch = useDispatch();

    const getBanarListFromStore = useSelector(
    (state) => state.banarState.banarList
  );

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(SummaryApi.get_banner.url);
        if (res.data.success) {
          dispatch(setBanarList(res.data.data));
          setBanners(res.data.data); // ✅ only array
        }
      } catch (err) {
        // console.log("❌ API Error:", err); // full error object
        // console.log("📛 Error Message:", err.message); // specific error message
        if (err.response) {
          // console.log("🚫 Backend Response:", err.response.data);
          // console.log("🔢 Status Code:", err.response.status);
        }
      }
    };
    if (getBanarListFromStore.length > 0) {
      setBanners(getBanarListFromStore); 
    } else {
      fetchBanners();
    }
  }, []);
  

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
    }, 3000); // auto-slide every 3 sec

    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  const renderItem = ({ item }) => (
    <Image
      source={{ uri: item.imageUrl.replace("http://", "https://") }} // ✅ corrected here
      style={styles.bannerImage}
    />
  );
  // console.log("✅ Banners:", banners);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
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
