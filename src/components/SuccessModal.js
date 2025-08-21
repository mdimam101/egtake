// components/SuccessModal.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const SuccessModal = ({ visible, onClose }) => {
  return (
    <Modal isVisible={visible}>
      <View style={styles.container}>
        <View style={styles.circle}>
          <Text style={styles.check}>✔</Text>
        </View>
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.message}>Your order has been placed successfully.</Text>
        <TouchableOpacity onPress={onClose} style={styles.okBtn}>
          <Text style={{ color: '#fff' }}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#4CAF50',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  check: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  okBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 6,
  },
});
