// helpers/uploadImage.js
import axios from "axios";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const CLOUD_NAME = "dhs48crvv";            // Cloudinary cloud name
const UPLOAD_PRESET = "qcommerce_product"; // unsigned upload preset

// optional: compress image before upload
async function compressIfNeeded(uri) {
  try {
    const { width } = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
    });
    const targetWidth = Math.min(width || 2000, 1280);
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: targetWidth } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri; // fallback
  }
}

const uploadImage = async (imageFile) => {
  // imageFile: { uri: "file://...", type?: "image/jpeg", name?: "..." }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // compress for stability
  const compressedUri = await compressIfNeeded(imageFile.uri);

  // 2) multipart upload via FileSystem (Android-safe)
  try {
    // ✅ Method 1: FileSystem upload (expo)
    const res = await FileSystem.uploadAsync(url, compressedUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file", // Cloudinary expects "file"
      parameters: {
        upload_preset: UPLOAD_PRESET,
      },
      headers: {
        Accept: "application/json",
      },
    });

    const data = JSON.parse(res.body || "{}");
    if (data?.secure_url) {
      return data; // { secure_url, public_id, ... }
    }
    // fallback if Cloudinary error
    return { error: true, message: "Upload failed", raw: data };
  } catch (err) {
    // ✅ Method 2: axios + FormData fallback
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: compressedUri,
        type: imageFile.type || "image/jpeg",
        name: imageFile.name || `upload_${Date.now()}.jpg`,
      });
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (fallbackErr) {
      return { error: true, message: "Upload failed (axios fallback)" };
    }
  }
};

export default uploadImage;
