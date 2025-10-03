import * as Linking from "expo-linking";

const handleWhatsApp = (data) => {
  let message = "";
  if (data?.productName) {
    message = `Hi, I'm interested in this product: ${data?.productName}`;
  } else {
    message = `Hi...`;
  }

  const phone = "+817045439721"; // ⬅️ Replace with your number
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url);
};

export default handleWhatsApp;
