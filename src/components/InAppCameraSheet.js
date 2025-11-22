// InAppCameraSheet.js
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import uploadImage from "../helper/uploadImage";

export default function InAppCameraSheet({ visible, onClose, onTaken }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      setBusy(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      setBusy(false);
      setPreview(photo?.uri || "");
    } catch (e) {
      setBusy(false);
      Alert.alert("Camera error", "Could not take photo.");
    }
  };

  const upload = async () => {
    if (!preview) return;
    setBusy(true);
    const file = { uri: preview, type: "image/jpeg", name: "review.jpg" };
    const res = await uploadImage(file);
    setBusy(false);
    if (res?.secure_url) {
      onTaken(res.secure_url);
      setPreview("");
      onClose(); // ✅ close camera sheet → ReviewModal দেখা যাবে
    } else {
      Alert.alert("Upload failed", "Try again.");
    }
  };

  // ✅ এখান থেকে cross চাপলে ক্যামেরা বন্ধ হবে
  const handleCloseCamera = () => {
    setPreview(""); // clear preview if any
    onClose();      // close camera modal
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor:"#fff", padding:18, borderRadius:12, width:"85%" }}>
            <Text style={{ fontWeight:"700", fontSize:16, marginBottom:8 }}>Camera permission required</Text>
            <TouchableOpacity onPress={requestPermission} style={{ backgroundColor:"#1976d2", padding:10, borderRadius:8 }}>
              <Text style={{ color:"#fff", textAlign:"center" }}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCloseCamera} style={{ marginTop:10, padding:10 }}>
              <Text style={{ textAlign:"center" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCloseCamera}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.85)", justifyContent:"center" }}>
        <View style={{ margin:16, backgroundColor:"#000", borderRadius:12, overflow:"hidden" }}>

          {/* ✅ TOP-RIGHT CROSS — live camera + preview দুই অবস্থাতেই */}
          <TouchableOpacity
            onPress={handleCloseCamera}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 20,
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: 6,
            }}
          >
            <Ionicons name="close" size={20} color="#d32f2f" />
          </TouchableOpacity>

          {preview ? (
            <View style={{ backgroundColor:"#000" }}>
              <Image source={{ uri: preview }} style={{ width:"100%", height:420 }} contentFit="cover" />
              <View style={{ flexDirection:"row", padding:12, gap:8, backgroundColor:"#111" }}>
                <TouchableOpacity
                  onPress={() => setPreview("")}
                  style={{ flex:1, backgroundColor:"#444", padding:12, borderRadius:8 }}
                  disabled={busy}
                >
                  <Text style={{ color:"#fff", textAlign:"center" }}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={upload}
                  style={{ flex:1, backgroundColor:"#1976d2", padding:12, borderRadius:8, opacity:busy?0.6:1 }}
                  disabled={busy}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", textAlign:"center" }}>Upload</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor:"#000" }}>
              <CameraView ref={cameraRef} style={{ width:"100%", height:420 }} facing="back" />
              <View style={{ flexDirection:"row", padding:12, gap:8, backgroundColor:"#111" }}>
                <TouchableOpacity onPress={handleCloseCamera} style={{ flex:1, backgroundColor:"#444", padding:12, borderRadius:8 }}>
                  <Text style={{ color:"#fff", textAlign:"center" }}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={takePhoto}
                  style={{ flex:1, backgroundColor:"#1976d2", padding:12, borderRadius:8, opacity:busy?0.6:1 }}
                  disabled={busy}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", textAlign:"center" }}>Take Photo</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
