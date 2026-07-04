// export default uploadImage;
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import SummaryApi from "../common/SummaryApi";

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getAuthHeaders = async () => {
  // তোমার app-এ token যে key দিয়ে save করো সেটি আগে পাওয়া যাবে
  const token =
    (await AsyncStorage.getItem("authToken")) ||
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("userToken"));

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const compressIfNeeded = async (uri) => {
  try {
    const original = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
    });

    const targetWidth = Math.min(Number(original?.width) || 1280, 1280);

    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: targetWidth,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return compressed.uri;
  } catch (error) {
    console.warn(
      "Image compression skipped:",
      error?.message || "Unknown error",
    );

    return uri;
  }
};

const uploadImage = async (
  imageFile,
  { mediaType = "review-image", productId } = {},
) => {
  try {
    if (!imageFile?.uri) {
      return {
        error: true,
        message: "No image selected",
      };
    }

    if (!productId) {
      return {
        error: true,
        message: "Product ID is required",
      };
    }

    // Compression-এর পরে file JPEG হবে
    const compressedUri = await compressIfNeeded(imageFile.uri);

    const fileInfo = await FileSystem.getInfoAsync(compressedUri, {
      size: true,
    });

    if (!fileInfo?.exists || !Number(fileInfo?.size)) {
      return {
        error: true,
        message: "Could not read image file",
      };
    }

    const fileSize = Number(fileInfo.size);

    if (fileSize > IMAGE_MAX_BYTES) {
      return {
        error: true,
        message: "Image must be smaller than 10 MB",
      };
    }

    const contentType = "image/jpeg";
    const fileName = `review_${Date.now()}.jpg`;
    const authHeaders = await getAuthHeaders();

    // 1. Backend থেকে presigned S3 URL নেওয়া
    const presignedResponse = await fetch(
      SummaryApi.media_presigned_upload.url,
      {
        method:
          SummaryApi.media_presigned_upload.method?.toUpperCase() || "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          fileName,
          contentType,
          fileSize,
          mediaType,
          productId,
        }),
      },
    );

    const presignedResult = await parseJsonResponse(presignedResponse);

    const presignedData = presignedResult?.data;

    if (
      !presignedResponse.ok ||
      !presignedResult?.success ||
      !presignedData?.uploadUrl ||
      !presignedData?.key
    ) {
      console.warn("Presigned request failed:", presignedResponse.status);

      return {
        error: true,
        message: presignedResult?.message || "Could not create upload URL",
      };
    }

    // 2. Image সরাসরি S3-তে binary PUT করা
    const s3Response = await FileSystem.uploadAsync(
      presignedData.uploadUrl,
      compressedUri,
      {
        httpMethod: (presignedData.method || "PUT").toUpperCase(),

        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,

        // Backend যে headers signed করেছে ঠিক সেগুলোই যাবে
        headers: presignedData.headers || {
          "Content-Type": contentType,
        },
      },
    );

    if (s3Response.status < 200 || s3Response.status >= 300) {
      console.warn("S3 upload failed:", s3Response.status);

      return {
        error: true,
        message: "Image upload failed",
      };
    }

    // 3. Backend দিয়ে uploaded object verify করা
    const confirmResponse = await fetch(SummaryApi.media_confirm_upload.url, {
      method: SummaryApi.media_confirm_upload.method?.toUpperCase() || "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        key: presignedData.key,
        expectedContentType: contentType,
        expectedMaxSize: IMAGE_MAX_BYTES,
      }),
    });

    const confirmResult = await parseJsonResponse(confirmResponse);

    const confirmedData = confirmResult?.data;

    if (!confirmResponse.ok || !confirmResult?.success || !confirmedData?.url) {
      console.warn("Upload confirmation failed:", confirmResponse.status);

      return {
        error: true,
        message: confirmResult?.message || "Upload confirmation failed",
      };
    }

    return {
      error: false,

      // New AWS response
      url: confirmedData.url,

      // Existing component compatibility
      secure_url: confirmedData.url,

      key: confirmedData.key,
      contentType: confirmedData.contentType,
      size: confirmedData.size,
      etag: confirmedData.etag,
    };
  } catch (error) {
    console.error("uploadImage-error:", error?.message || error);

    return {
      error: true,
      message: "Upload failed",
    };
  }
};

export default uploadImage;
