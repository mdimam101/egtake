// components/ProductVideoSection.js
// ✅ Temu-style inline product video using expo-video (no fullscreen)

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";
import { VideoView, useVideoPlayer } from "expo-video";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const toHttps = (url = "") =>
  typeof url === "string" ? url.replace("http://", "https://") : "";

const formatMillis = (ms = 0) => {
  const totalSec = Math.floor((ms || 0) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const ProductVideoSection = ({ productVideo }) => {
  const videoUri = toHttps(productVideo?.url || "");
  const thumbUri = toHttps(productVideo?.thumbnail || "");
  const hasVideo = !!videoUri && !!thumbUri;

  //const autoplay = !!productVideo?.autoplay;
  const initialMuted =
    typeof productVideo?.muted === "boolean" ? productVideo.muted : true;

  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  //const [isPlaying, setIsPlaying] = useState(autoplay);
  // new – always start paused, but first tap e amra play korbo
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [videoHeight, setVideoHeight] = useState(200);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ create expo-video player
  const player = useVideoPlayer(videoUri, (playerInstance) => {
    playerInstance.loop = false;
    // timeUpdateEventInterval is in ms (0 = off)
    playerInstance.timeUpdateEventInterval = 250;
    playerInstance.muted = initialMuted;
  });

  // 🔹 calculate video height from first frame (like Image.getSize version)
  useEffect(() => {
    let cancelled = false;

    if (!productVideo?.url) return;

    (async () => {
      try {
        const { width, height } = await VideoThumbnails.getThumbnailAsync(
          productVideo.url,
          { time: 0 }
        );
        if (!cancelled && width && height) {
          const screenWidth = Dimensions.get("window").width;
          setVideoHeight((height / width) * screenWidth);
        }
      } catch (e) {
        // fallback height
        if (!cancelled) setVideoHeight(220);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productVideo?.url]);

  // 🔹 fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 🔹 pause when screen blur / unmount
  const pauseInline = useCallback(() => {
    try {
      if (player) {
        player.pause();
      }
    } catch (e) {}
    setIsPlaying(false);
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        pauseInline();
      };
    }, [pauseInline])
  );

  useEffect(() => {
    return () => {
      pauseInline();
    };
  }, [pauseInline]);

  // 🔹 track time & duration using requestAnimationFrame
  useEffect(() => {
    if (!player) return;

    let frameId;

    const updateTime = () => {
      if (player) {
        const t = player.currentTime ?? 0; // seconds
        const d =
          typeof player.duration === "number" ? player.duration : 0;

        setCurrentTime(t);
        setDuration(d);

        // if reached end → mark as stopped
        if (d > 0 && t >= d) {
          setIsPlaying(false);
        }
      }
      frameId = requestAnimationFrame(updateTime);
    };

    frameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(frameId);
  }, [player]);

  // 🔹 sync playing state from player
  useEffect(() => {
    if (!player) return;
    setIsPlaying(!!player.playing);
  }, [player?.playing]);

const handleOpenInlinePlayer = () => {
  if (!hasVideo) return;

  // 1️⃣ video view show
  setShowInlinePlayer(true);

  // 2️⃣ immediately play on first tap
  if (player) {
    try {
      // jodi agey sesh hoye thake, abar 0 theke shuru
      if (duration > 0 && currentTime >= duration - 0.1) {
        player.currentTime = 0;
      }
      player.play();
      setIsPlaying(true);
    } catch (e) {
     // console.log("inline open/play error", e);
    }
  } else {
    // player hook ekhono ready na thakle, state ta set kore rakhi
    setIsPlaying(true);
  }
};


  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      // finished → restart from beginning
      if (duration > 0 && currentTime >= duration - 0.1) {
        player.currentTime = 0;
      }
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted((prev) => !prev);
  };

  const progressPercent =
    duration > 0 ? currentTime / duration : 0;

  if (!hasVideo) return null;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.tagWrapper}>
        <Text style={styles.tagText}>Product Video</Text>
      </View>

      {/* dynamic height from video aspect ratio */}
      <View style={{ width: "100%", height: videoHeight }}>
        {!showInlinePlayer && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleOpenInlinePlayer}
            style={styles.thumbTouchable}
          >
            <ExpoImage
              source={{ uri: thumbUri }}
              style={styles.thumbnail}
              cachePolicy="disk"
            />
            <View style={styles.thumbOverlay} />

            <View style={styles.playButtonWrapper}>
              <View style={styles.playButtonCircle}>
                <Ionicons
                  name="play"
                  size={30}
                  color="#ff2c55"
                  style={{ marginLeft: 3 }}
                />
              </View>
              <Text style={styles.playLabel}>Tap to watch</Text>
            </View>
          </TouchableOpacity>
        )}

        {showInlinePlayer && (
          <View style={styles.videoContainer}>
            {/* tap anywhere on video to play/pause */}
            <TouchableWithoutFeedback onPress={togglePlayPause}>
              <View style={{ flex: 1 }}>
                <VideoView
                  player={player}
                  style={styles.inlineVideo}
                  nativeControls={false}
                //   allowsFullscreen={false}
                  allowsPictureInPicture={false}
                />

                {/* center play icon only when paused */}
                {!isPlaying && (
                  <View style={styles.centerPlayOverlay}>
                    <View style={styles.playButtonCircle}>
                      <Ionicons
                        name="play"
                        size={30}
                        color="#ff2c55"
                        style={{ marginLeft: 3 }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* bottom control bar */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                onPress={toggleMute}
                style={styles.muteCircle}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isMuted ? "volume-mute" : "volume-high"}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>

              <Text style={styles.timeText}>
                {formatMillis(currentTime * 1000)}
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(progressPercent || 0) * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.timeText}>
                {formatMillis(duration * 1000)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  tagWrapper: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },
  thumbTouchable: {
    flex: 1,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playButtonWrapper: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
    alignItems: "center",
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  playLabel: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  inlineVideo: {
    width: "100%",
    height: "100%",
  },
  centerPlayOverlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    alignItems: "center",
  },
  muteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff9c34",
  },
});

export default ProductVideoSection;
