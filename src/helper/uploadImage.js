// helpers/uploadImage.js
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const CLOUD_NAME = "dhs48crvv";            // তোমার cloud name
const UPLOAD_PRESET = "qcommerce_product"; // unsigned preset

async function compressIfNeeded(uri) {
  // Android-এ বড় ফাইল হলে আপলোডে Network Error হতে পারে
  try {
    const { width } = await ImageManipulator.manipulateAsync(uri, [], { compress: 1 });
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

  // 1) compress (optional but helps Android stability)
  const compressedUri = await compressIfNeeded(imageFile.uri);

  // 2) multipart upload via FileSystem (Android-safe)
  try {
    const res = await FileSystem.uploadAsync(url, compressedUri, {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file", // Cloudinary expects 'file'
      parameters: {
        upload_preset: UPLOAD_PRESET,
      },
      headers: {
        Accept: "application/json",
      },
    });

    // res.body is string
    const data = JSON.parse(res.body || "{}");
    if (data?.secure_url) {
      return data; // { secure_url, public_id, ... }
    }
    return { error: true, message: "Upload failed", raw: data };
  } catch (err) {
    // console.log("uploadImage-error(FileSystem):", err);
    return { error: true, message: "Upload failed (Android FS)" };
  }
};

export default uploadImage;
