import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";       // your Cloudinary helper
import InAppCameraSheet from "../components/InAppCameraSheet"; // ⬅️ your in-app camera
import uploadImage from "../helper/uploadImage";

const ReviewModal = ({ visible, onClose, onSubmit, productName, productId, orderId, itemId }) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState([]); // [{ uri, uploading, uploadedUrl }]
  const [showCam, setShowCam] = useState(false); // ⬅️ in-app camera toggle

  // ⭐ Rating
  const renderStars = () => (
    <View style={{ flexDirection: "row", marginVertical: 5 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 2 }}>
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={28}
            color={star <= rating ? "#FFD700" : "#999"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  // 🖼 Gallery (multi)
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const selected = result.assets.map((a) => ({
        uri: a.uri,
        uploading: true,
        uploadedUrl: "",
      }));
      setImages((prev) => [...prev, ...selected]);
      selected.forEach((img) => handleUpload(img.uri));
    }
  };

  // ☁️ Upload to Cloudinary
  const handleUpload = async (uri) => {
    const file = { uri, type: "image/jpeg", name: "review.jpg" };
    const res = await uploadImage(file);
    setImages((prev) =>
      prev.map((img) =>
        img.uri === uri ? { ...img, uploading: false, uploadedUrl: res?.secure_url || "" } : img
      )
    );
  };

  // ❌ remove
  const removeImage = (uri) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

 const handleSubmit = () => {
    // if (!productId) {
    //   Alert.alert("Product missing", "Product ID পাওয়া যায়নি, আবার চেষ্টা করুন।");
    //   return;
    // }
    // if (!reviewText.trim()) {
    //   Alert.alert("Empty review", "রিভিউ লিখুন।");
    //   return;
    // }

    const uploadedUrls = images.map(i => i.uploadedUrl).filter(Boolean);

    onSubmit({
      text: reviewText.trim(),
      rating,
      images: uploadedUrls,
      // চাইলে এখান থেকেই দিতে পারো:
      // productId,
      // orderId,
      // itemId,
    });

    // reset + close
    setReviewText("");
    setImages([]);
    setRating(5);
    onClose();
  };


  // 🎥 InAppCameraSheet থেকে তোলা ছবির URL পেলে images-এ পুশ
  const handleCameraTaken = (url) => {
    if (!url) return;
    setImages((prev) => [
      ...prev,
      { uri: url, uploading: false, uploadedUrl: url }, // already uploaded by camera sheet
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Write a Review</Text>
          {renderStars()}

          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Write your review..."
            multiline
            style={styles.textArea}
          />

          {/* Image previews 70x70 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={styles.imageWrapper}>
                <Image source={{ uri: img.uploadedUrl || img.uri }} style={styles.image} />
                {img.uploading && (
                  <View style={styles.uploadingOverlay}>
                    <Text style={{ color: "#fff", fontSize: 10 }}>Uploading...</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => removeImage(img.uri)} style={styles.deleteBtn}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Add images buttons */}
          <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
            <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
              <Ionicons name="image" size={20} color="#fff" />
              <Text style={styles.pickBtnText}>Gallery</Text>
            </TouchableOpacity>

            {/* ⬇️ তোমার দেওয়া pattern: showCam + InAppCameraSheet */}
            <TouchableOpacity style={styles.pickBtn} onPress={() => setShowCam(true)}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.pickBtnText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#999" }]} onPress={onClose}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#1976d2" }]} onPress={handleSubmit}>
              <Text style={styles.actionText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ⬇️ In‑app camera sheet lives inside the same Modal tree */}
      <InAppCameraSheet
        visible={showCam}
        onClose={() => setShowCam(false)}
        onTaken={(url) => {
          setShowCam(false);
          handleCameraTaken(url); // push into images[]
        }}
      />
    </Modal>
  );
};

export default ReviewModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "90%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  textArea: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    height: 80,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  imageWrapper: {
    width: 70,
    height: 70,
    marginRight: 8,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },
  pickBtn: {
    flexDirection: "row",
    backgroundColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  pickBtnText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
