import * as Linking from 'expo-linking';

const handleWhatsApp = (data ) => {
  const message = `Hi, I'm interested in this product: ${data?.productName}`;
  const phone = "+817045439721"; // ⬅️ Replace with your number
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url);
};

export default handleWhatsApp


