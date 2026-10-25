// components/SuccessModal.js

import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SuccessModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.circle}>
            <Text style={styles.check}>✔</Text>
          </View>

          <Text style={styles.title}>Thank You!</Text>

          <Text style={styles.message}>
            Your order has been placed successfully.
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.okBtn}>
            <Text style={styles.okText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  container: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
  },

  circle: {
    backgroundColor: "#4CAF50",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  check: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },

  message: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },

  okBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 6,
  },

  okText: {
    color: "#fff",
  },
});
