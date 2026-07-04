import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const skinTypeOptions = [
  { label: "Oily", value: "oily" },
  { label: "Dry", value: "dry" },
  { label: "Combination", value: "combination" },
  { label: "Normal", value: "normal" },
  { label: "Sensitive", value: "sensitive" },
  { label: "Not sure", value: "not_sure" },
];

const skinConcernOptions = [
  { label: "Acne / ব্রণ", value: "acne" },
  { label: "Dark spot / দাগ", value: "dark_spot" },
  { label: "Melasma / মেছতা", value: "melasma" },
  { label: "Dull skin", value: "dull_skin" },
  { label: "Dryness", value: "dryness" },
  { label: "Excess oil", value: "excess_oil" },
  { label: "Blackheads", value: "blackheads" },
  { label: "Large pores", value: "large_pores" },
  { label: "Redness", value: "redness" },
  { label: "Sun tan", value: "sun_tan" },
];

const skinGoalOptions = [
  { label: "Brightening", value: "brightening" },
  { label: "Acne care", value: "acne_care" },
  { label: "Dark spot care", value: "dark_spot_care" },
  { label: "Melasma care", value: "melasma_care" },
  { label: "Oil control", value: "oil_control" },
  { label: "Hydration", value: "hydration" },
  { label: "Glow", value: "glow" },
  { label: "Soothing", value: "soothing" },
];

const wantedProductTypeOptions = [
  { label: "Cleanser", value: "cleanser" },
  { label: "Toner", value: "toner" },
  { label: "Serum", value: "serum" },
  { label: "Moisturizer", value: "moisturizer" },
  { label: "Sunscreen", value: "sunscreen" },
  { label: "Mask", value: "mask" },
  { label: "Face Wash", value: "faceWash" },
];

const routineOptions = [
  { label: "Cleanser", value: "cleanser" },
  { label: "Toner", value: "toner" },
  { label: "Serum", value: "serum" },
  { label: "Moisturizer", value: "moisturizer" },
  { label: "Sunscreen", value: "sunscreen" },
  { label: "Mask", value: "mask" },
  { label: "Nothing", value: "nothing" },
];

const budgetOptions = [
  { label: "Budget", value: "budget" },
  { label: "Medium", value: "medium" },
  { label: "Premium", value: "premium" },
  { label: "Any", value: "any" },
];

const ageOptions = [
  { label: "18 এর নিচে", value: "under_18" },
  { label: "18–24", value: "18_24" },
  { label: "25–34", value: "25_34" },
  { label: "35+", value: "35_plus" },
  { label: "বলতে চাই না", value: "prefer_not_to_say" },
];

const getProductImage = (item = {}) => {
  return (
    item?.productImg?.[0] ||
    item?.img ||
    item?.image ||
    item?.variants?.[0]?.images?.[0] ||
    item?.variants?.[0]?.image ||
    ""
  );
};

const normalizeType = (value = "") => {
  const text = String(value).toLowerCase().replace(/\s+/g, "");

  if (text.includes("facewash") || text.includes("facecleanser")) {
    return "faceWash";
  }

  if (text.includes("cleanser")) return "cleanser";
  if (text.includes("toner")) return "toner";
  if (text.includes("serum")) return "serum";
  if (text.includes("moisturizer") || text.includes("cream")) {
    return "moisturizer";
  }
  if (text.includes("sunscreen") || text.includes("sunblock")) {
    return "sunscreen";
  }
  if (text.includes("mask")) return "mask";

  return "other";
};

const hasSkincareKeyword = (item = {}) => {
  const text = `${item.category || ""} ${item.subCategory || ""} ${
    item.productName || ""
  } ${item.description || ""} ${item?.skinCareInfo?.productType || ""}`
    .toLowerCase()
    .replace(/\s+/g, "");

  return [
    "skin",
    "skincare",
    "face",
    "facewash",
    "cleanser",
    "toner",
    "serum",
    "moisturizer",
    "sunscreen",
    "sunblock",
    "cream",
    "mask",
    "acne",
    "bright",
    "darkspot",
  ].some((key) => text.includes(key));
};

const buildWebsiteProducts = (products = [], selectedTypes = []) => {
  return products
    .filter((item) => Number(item?.totalStock || item?.stock || 0) > 0)
    .filter((item) => hasSkincareKeyword(item))
    .map((item) => {
      const productType = normalizeType(
        item?.skinCareInfo?.productType ||
          item?.productType ||
          item?.subCategory ||
          item?.category ||
          item?.productName,
      );

      return {
        productId: item?._id,
        productName: item?.productName || "",
        category: item?.category || "",
        subCategory: item?.subCategory || "",
        productType,
        description: item?.description || "",
        ingredients: item?.skinCareInfo?.ingredients || item?.ingredients || [],
        suitableSkinTypes:
          item?.skinCareInfo?.suitableSkinTypes ||
          item?.suitableSkinTypes ||
          [],
        targetConcerns:
          item?.skinCareInfo?.targetConcerns || item?.targetConcerns || [],
        avoidFor: item?.skinCareInfo?.avoidFor || item?.avoidFor || [],
        usageTime: item?.skinCareInfo?.usageTime || item?.usageTime || "",
        price: item?.selling || item?.price || 0,
        stock: item?.totalStock || item?.stock || 0,
        image: getProductImage(item),
      };
    })
    .filter((item) => selectedTypes.includes(item.productType))
    .slice(0, 40);
};

const MultiChip = ({ options, values, onToggle }) => {
  return (
    <View style={styles.chipRow}>
      {options.map((item) => {
        const active = values.includes(item.value);

        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.85}
            onPress={() => onToggle(item.value)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.chipText, active && styles.activeChipText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const SingleChip = ({ options, value, onChange }) => {
  return (
    <View style={styles.chipRow}>
      {options.map((item) => {
        const active = value === item.value;

        return (
          <TouchableOpacity
            key={item.value}
            activeOpacity={0.85}
            onPress={() => onChange(item.value)}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.chipText, active && styles.activeChipText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const AiSkinCareHelper = ({ websiteProductList = [] }) => {
  const [showBox, setShowBox] = useState(false);

  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState([]);
  const [skinGoals, setSkinGoals] = useState([]);
  const [wantedProductTypes, setWantedProductTypes] = useState([]);
  const [hasSensitiveSkin, setHasSensitiveSkin] = useState("not_sure");
  const [irritationHistory, setIrritationHistory] = useState("not_sure");
  const [allergyIngredients, setAllergyIngredients] = useState("");
  const [currentRoutine, setCurrentRoutine] = useState([]);
  const [ageRange, setAgeRange] = useState("prefer_not_to_say");
  const [budget, setBudget] = useState("any");
  const [expectedResult, setExpectedResult] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [skinImageBase64, setSkinImageBase64] = useState("");

  const [loading, setLoading] = useState(false);
  const [skinCareError, setSkinCareError] = useState("");
  const [skinCareResult, setSkinCareResult] = useState(null);

  const websiteProducts = useMemo(
    () => buildWebsiteProducts(websiteProductList, wantedProductTypes),
    [websiteProductList, wantedProductTypes],
  );

  const toggleMulti = (setter) => (value) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }

      return [...prev, value];
    });
  };

  const toggleRoutine = (value) => {
    setCurrentRoutine((prev) => {
      if (value === "nothing") {
        return prev.includes("nothing") ? [] : ["nothing"];
      }

      const withoutNothing = prev.filter((item) => item !== "nothing");

      if (withoutNothing.includes(value)) {
        return withoutNothing.filter((item) => item !== value);
      }

      return [...withoutNothing, value];
    });
  };

  const pickSkinImage = async () => {
    try {
      setSkinCareError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setSkinCareError("Image upload করার permission দরকার।");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || "image/jpeg";

        setSkinImageBase64(`data:${mimeType};base64,${asset.base64}`);
      }
    } catch (error) {
      setSkinCareError("Image select করতে সমস্যা হয়েছে।");
    }
  };

  const removeSkinImage = () => {
    setSkinImageBase64("");
  };

  const handleSubmit = async () => {
    if (!skinType) {
      setSkinCareError("আপনার skin type select করুন।");
      return;
    }

    if (skinConcerns.length === 0) {
      setSkinCareError("আপনার skin concern অন্তত ১টি select করুন।");
      return;
    }

    if (skinGoals.length === 0) {
      setSkinCareError("আপনার skin goal অন্তত ১টি select করুন।");
      return;
    }

    if (wantedProductTypes.length === 0) {
      setSkinCareError("আপনি কোন type product চান অন্তত ১টি select করুন।");
      return;
    }

    if (websiteProducts.length === 0) {
      setSkinCareError(
        "আপনার selected product type অনুযায়ী stock থাকা skincare product পাওয়া যায়নি।",
      );
      return;
    }

    console.log("🦌◆🦌websiteProducts◆", websiteProducts);
    return;

  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.toggleBtn}
        onPress={() => setShowBox((prev) => !prev)}
      >
        <View style={styles.toggleLeft}>
          <Ionicons name="sparkles-outline" size={19} color="#7c2d12" />

          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>AI Skin Care Helper</Text>
            <Text style={styles.toggleSub}>
              আপনার skin profile অনুযায়ী suitable skincare product suggestion
              নিন
            </Text>
          </View>
        </View>

        <Ionicons
          name={showBox ? "chevron-up" : "chevron-down"}
          size={20}
          color="#7c2d12"
        />
      </TouchableOpacity>

      {showBox && (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>আপনার skin type কী?</Text>
            <SingleChip
              options={skinTypeOptions}
              value={skinType}
              onChange={setSkinType}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনার skin concern কী?</Text>
            <Text style={styles.hint}>একাধিক select করতে পারবেন</Text>
            <MultiChip
              options={skinConcernOptions}
              values={skinConcerns}
              onToggle={toggleMulti(setSkinConcerns)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনি কী result চান?</Text>
            <Text style={styles.hint}>একাধিক select করতে পারবেন</Text>
            <MultiChip
              options={skinGoalOptions}
              values={skinGoals}
              onToggle={toggleMulti(setSkinGoals)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              আপনার skin এর জন্য কী type product চান?
            </Text>
            <Text style={styles.hint}>একাধিক select করতে পারবেন</Text>
            <MultiChip
              options={wantedProductTypeOptions}
              values={wantedProductTypes}
              onToggle={toggleMulti(setWantedProductTypes)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনি কী ধরনের result আশা করছেন?</Text>
            <TextInput
              style={styles.input}
              value={expectedResult}
              onChangeText={setExpectedResult}
              placeholder="যেমন: oil control, glow, acne care, dark spot care"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              আপনার current skin image upload করুন
            </Text>
            <Text style={styles.hint}>
              Optional, দিলে AI general visual observation করতে পারবে
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickSkinImage}
              style={styles.imagePickBtn}
            >
              <Ionicons name="image-outline" size={16} color="#7c2d12" />
              <Text style={styles.imagePickText}>
                {skinImageBase64
                  ? "Image selected - change image"
                  : "Upload skin image"}
              </Text>
            </TouchableOpacity>

            {skinImageBase64 ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: skinImageBase64 }}
                  style={styles.previewImage}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={removeSkinImage}
                  style={styles.removeImageBtn}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনার skin sensitive কি?</Text>
            <SingleChip
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                { label: "Not sure", value: "not_sure" },
              ]}
              value={hasSensitiveSkin}
              onChange={setHasSensitiveSkin}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              কোনো product use করলে জ্বালা/itching/redness হয়?
            </Text>
            <SingleChip
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                { label: "Not sure", value: "not_sure" },
              ]}
              value={irritationHistory}
              onChange={setIrritationHistory}
            />
          </View>

          {irritationHistory === "yes" && (
            <View style={styles.field}>
              <Text style={styles.label}>
                কোন ingredient/product এ problem হয়?
              </Text>
              <TextInput
                style={styles.input}
                value={allergyIngredients}
                onChangeText={setAllergyIngredients}
                placeholder="যেমন: fragrance, alcohol, vitamin C"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>
              আপনি এখন কোন skincare product use করেন?
            </Text>
            <Text style={styles.hint}>একাধিক select করতে পারবেন</Text>
            <MultiChip
              options={routineOptions}
              values={currentRoutine}
              onToggle={toggleRoutine}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনার বয়স কত?</Text>
            <SingleChip
              options={ageOptions}
              value={ageRange}
              onChange={setAgeRange}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আপনার budget কেমন?</Text>
            <SingleChip
              options={budgetOptions}
              value={budget}
              onChange={setBudget}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>আর কিছু জানাতে চান?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={extraNote}
              onChangeText={setExtraNote}
              multiline
              placeholder="যেমন: আগে vitamin C use করলে জ্বালা করেছে, sunscreen sticky লাগে..."
              placeholderTextColor="#9ca3af"
            />
          </View>

          {wantedProductTypes.length > 0 ? (
            <View style={styles.stockInfoBox}>
              <Text style={styles.stockInfoText}>
                Selected type অনুযায়ী stock product পাওয়া গেছে:{" "}
                {websiteProducts.length}
              </Text>
            </View>
          ) : null}

          {skinCareError ? (
            <Text style={styles.error}>{skinCareError}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleSubmit}
            style={[styles.submitBtn, loading && styles.disabledBtn]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sparkles" size={16} color="#fff" />
            )}

            <Text style={styles.submitText}>
              {loading ? "AI suggestion তৈরি করছে..." : "Get AI Suggestion"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.safetyText}>
            এই suggestion শুধুমাত্র general skincare guidance। severe acne,
            allergy, burning বা redness থাকলে dermatologist-এর পরামর্শ নিন।
          </Text>
        </View>
      )}

      {skinCareResult ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {skinCareResult?.skinSummary?.title || "AI Skin Suggestion"}
            </Text>

            <Text style={styles.statusBadge}>AI</Text>
          </View>

          {/* 1. Skin Summary + Image Observation */}
          {skinCareResult?.skinSummary ? (
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Skin Summary</Text>

              {skinCareResult.skinSummary.summary ? (
                <Text style={styles.resultText}>
                  {skinCareResult.skinSummary.summary}
                </Text>
              ) : null}

              {skinCareResult.skinSummary.imageObservation ? (
                <View style={styles.observationBox}>
                  <Text style={styles.observationTitle}>
                    AI image observation
                  </Text>
                  <Text style={styles.resultText}>
                    {skinCareResult.skinSummary.imageObservation}
                  </Text>
                </View>
              ) : null}

              {Array.isArray(skinCareResult.skinSummary.acknowledgedConcerns) &&
              skinCareResult.skinSummary.acknowledgedConcerns.length > 0 ? (
                <View style={styles.miniListBox}>
                  <Text style={styles.miniListTitle}>AI যা বুঝেছে</Text>

                  {skinCareResult.skinSummary.acknowledgedConcerns.map(
                    (item, index) => (
                      <Text key={index} style={styles.stepText}>
                        • {item}
                      </Text>
                    ),
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* 2. Product Check */}
          {skinCareResult?.productCheck ? (
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Product Check</Text>

              {skinCareResult.productCheck.checkedMessage ? (
                <Text style={styles.resultText}>
                  {skinCareResult.productCheck.checkedMessage}
                </Text>
              ) : null}

              <View style={styles.checkRow}>
                <Text style={styles.checkLabel}>Checked products</Text>
                <Text style={styles.checkValue}>
                  {skinCareResult.productCheck.totalCheckedProducts || 0}
                </Text>
              </View>

              {Array.isArray(skinCareResult.productCheck.matchedProductTypes) &&
              skinCareResult.productCheck.matchedProductTypes.length > 0 ? (
                <Text style={styles.resultText}>
                  Matched types:{" "}
                  {skinCareResult.productCheck.matchedProductTypes.join(", ")}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* 3. Recommended Products */}
          {Array.isArray(skinCareResult?.recommendedProducts) &&
          skinCareResult.recommendedProducts.length > 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Recommended Products</Text>

              {skinCareResult.recommendedProducts.map((group, groupIndex) => (
                <View
                  key={`${group.productType}_${groupIndex}`}
                  style={styles.recGroup}
                >
                  <Text style={styles.recType}>{group.productType}</Text>

                  {group.message ? (
                    <Text style={styles.resultText}>{group.message}</Text>
                  ) : null}

                  {Array.isArray(group.products) &&
                    group.products.map((item, index) => (
                      <View
                        key={`${item.productId}_${index}`}
                        style={styles.recFullBox}
                      >
                        <View style={styles.recTopRow}>
                          <Text style={styles.recName}>{item.productName}</Text>

                          {item.price ? (
                            <Text style={styles.recPrice}>৳{item.price}</Text>
                          ) : null}
                        </View>

                        {item.whyGood ? (
                          <View style={styles.reasonBox}>
                            <Text style={styles.reasonTitle}>
                              কেন আপনার জন্য ভালো হতে পারে
                            </Text>
                            <Text style={styles.recReason}>{item.whyGood}</Text>
                          </View>
                        ) : null}

                        {item.description ? (
                          <Text style={styles.recReason}>
                            {item.description}
                          </Text>
                        ) : null}

                        {Array.isArray(item.ingredients) &&
                        item.ingredients.length > 0 ? (
                          <View style={styles.ingredientBox}>
                            <Text style={styles.ingredientTitle}>
                              Useful ingredients
                            </Text>
                            <Text style={styles.recReason}>
                              {item.ingredients.join(", ")}
                            </Text>
                          </View>
                        ) : null}

                        {item.carefulNote ? (
                          <Text style={styles.warningText}>
                            {item.carefulNote}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                </View>
              ))}
            </View>
          ) : null}

          {/* 4. Extra Suggestion - Before / After Product */}
          {Array.isArray(skinCareResult?.extraSuggestion) &&
          skinCareResult.extraSuggestion.length > 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Extra Suggestion</Text>

              {skinCareResult.extraSuggestion.map((item, index) => (
                <View key={index} style={styles.extraBox}>
                  <Text style={styles.extraTitle}>
                    {item.title || `For ${item.forProductType}`}
                  </Text>

                  {item.beforeUse?.productName ? (
                    <View style={styles.extraMiniBox}>
                      <Text style={styles.extraLabel}>Before use</Text>
                      <Text style={styles.extraProductName}>
                        {item.beforeUse.productName}
                      </Text>

                      {item.beforeUse.reason ? (
                        <Text style={styles.recReason}>
                          {item.beforeUse.reason}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {item.afterUse?.productName ? (
                    <View style={styles.extraMiniBox}>
                      <Text style={styles.extraLabel}>After / Together</Text>
                      <Text style={styles.extraProductName}>
                        {item.afterUse.productName}
                      </Text>

                      {item.afterUse.reason ? (
                        <Text style={styles.recReason}>
                          {item.afterUse.reason}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* 5. Avoid List */}
          {Array.isArray(skinCareResult?.avoidList) &&
          skinCareResult.avoidList.length > 0 ? (
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Avoid / Careful</Text>

              {skinCareResult.avoidList.map((item, index) => (
                <Text key={index} style={styles.stepText}>
                  • {item.item}: {item.reason}
                </Text>
              ))}
            </View>
          ) : null}

          {skinCareResult?.customerMessage ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                {skinCareResult.customerMessage}
              </Text>
            </View>
          ) : null}

          {skinCareResult?.warning ? (
            <Text style={styles.warningText}>{skinCareResult.warning}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    marginHorizontal: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    overflow: "hidden",
  },

  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff7ed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  toggleTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#7c2d12",
  },

  toggleSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#9a3412",
    lineHeight: 17,
  },

  form: {
    padding: 12,
    gap: 12,
    backgroundColor: "#fff",
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
  },

  hint: {
    fontSize: 11,
    color: "#6b7280",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#eadfd5",
    backgroundColor: "#fff",
  },

  activeChip: {
    borderColor: "#ea580c",
    backgroundColor: "#ffedd5",
  },

  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },

  activeChipText: {
    color: "#7c2d12",
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#eadfd5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    backgroundColor: "#fafafa",
    fontSize: 13,
  },

  textArea: {
    minHeight: 82,
    textAlignVertical: "top",
  },

  imagePickBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  imagePickText: {
    color: "#7c2d12",
    fontSize: 13,
    fontWeight: "800",
  },

  previewWrap: {
    marginTop: 8,
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
  },

  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  stockInfoBox: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  stockInfoText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
  },

  error: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    color: "#b42318",
    fontSize: 12,
    fontWeight: "700",
  },

  submitBtn: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#ea580c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  disabledBtn: {
    opacity: 0.65,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },

  safetyText: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 17,
  },

  resultCard: {
    margin: 12,
    marginTop: 0,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fffaf5",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  resultTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#7c2d12",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ffedd5",
    color: "#7c2d12",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  resultText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#374151",
  },

  infoBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3e7da",
    backgroundColor: "#fff",
  },

  boxTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 4,
  },

  recGroup: {
    marginTop: 10,
  },

  recFullBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },

  recType: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#fed7aa",
    color: "#7c2d12",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    textTransform: "uppercase",
  },

  recName: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },

  recPrice: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
  },

  recReason: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "#4b5563",
  },

  useWithBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3e7da",
  },

  useWithTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 3,
  },

  stepText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#374151",
  },

  messageBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3e7da",
  },

  messageText: {
    color: "#374151",
    lineHeight: 20,
    fontSize: 13,
  },

  warningText: {
    marginTop: 10,
    color: "#b45309",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  observationBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },

  observationTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 3,
  },

  miniListBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },

  miniListTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 4,
  },

  checkRow: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  checkLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7c2d12",
  },

  checkValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ea580c",
  },

  recTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  reasonBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3e7da",
  },

  reasonTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 3,
  },

  ingredientBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3e7da",
  },

  ingredientTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ea580c",
    marginBottom: 3,
  },

  extraBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },

  extraTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7c2d12",
    marginBottom: 8,
  },

  extraMiniBox: {
    marginTop: 8,
    padding: 9,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3e7da",
  },

  extraLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ea580c",
    marginBottom: 3,
  },

  extraProductName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 2,
  },
});

export default AiSkinCareHelper;
