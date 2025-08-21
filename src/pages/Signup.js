

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import SummaryApi from '../common/SummaryApi';
import Toast from 'react-native-toast-message';

const SignupPage = () => {
  const navigation = useNavigation();

  const [data, setData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ simple email validator
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleOnChange = (key, value) => {
    // live updates
    setData((prev) => ({ ...prev, [key]: value }));

    // live error clear for the edited field
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // Optional: validate on blur (especially email)
  const handleBlur = (key) => {
    if (key === 'email') {
      const email = data.email.trim();
      if (!email) {
        setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      } else if (!isValidEmail(email)) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
      }
    }
    if (key === 'name' && !data.name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Full name is required' }));
    }
    if (key === 'password') {
      if (!data.password) {
        setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      } else if (data.password.length < 6) {
        setErrors((prev) => ({ ...prev, password: 'Minimum 6 characters' }));
      }
    }
    if (key === 'confirmPassword') {
      if (!data.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Confirm your password' }));
      } else if (data.password !== data.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Password does not match' }));
      }
    }
  };

  const handleSubmit = async () => {
    const trimmed = {
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
    };

    // ✅ final validation gate
    const nextErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!trimmed.name) nextErrors.name = 'Full name is required';
    if (!trimmed.email) nextErrors.email = 'Email is required';
    else if (!isValidEmail(trimmed.email)) nextErrors.email = 'Please enter a valid email';

    if (!trimmed.password) nextErrors.password = 'Password is required';
    else if (trimmed.password.length < 6) nextErrors.password = 'Minimum 6 characters';

    if (!trimmed.confirmPassword) nextErrors.confirmPassword = 'Confirm your password';
    else if (trimmed.password !== trimmed.confirmPassword)
      nextErrors.confirmPassword = 'Password does not match';

    // if any error, block submit
    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      setErrors(nextErrors);
      Toast.show({
        type: 'error',
        text1: 'Please fix the highlighted fields',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios({
        method: SummaryApi.signUp.method,
        url: SummaryApi.signUp.url,
        headers: { 'Content-Type': 'application/json' },
        data: {
          name: trimmed.name,
          email: trimmed.email,   // ✅ server-e always a valid email যাবে
          password: trimmed.password,
          confirmPassword: trimmed.confirmPassword,
        },
        withCredentials: true,
      });

      if (response?.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
        });
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: response?.data?.message || 'Signup failed',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollWrapper} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={[styles.input, !!errors.name && styles.inputError]}
            placeholder="Your full name"
            placeholderTextColor="#888"
            value={data.name}
            onChangeText={(text) => handleOnChange('name', text)}
            onBlur={() => handleBlur('name')}
            editable={!isSubmitting}
          />
          {!!errors.name && <Text style={styles.errText}>{errors.name}</Text>}

          <TextInput
            style={[styles.input, !!errors.email && styles.inputError]}
            placeholder="Email address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={data.email}
            onChangeText={(text) => handleOnChange('email', text)}
            onBlur={() => handleBlur('email')}
            editable={!isSubmitting}
          />
          {!!errors.email && <Text style={styles.errText}>{errors.email}</Text>}

          <TextInput
            style={[styles.input, !!errors.password && styles.inputError]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={data.password}
            onChangeText={(text) => handleOnChange('password', text)}
            onBlur={() => handleBlur('password')}
            editable={!isSubmitting}
          />
          {!!errors.password && <Text style={styles.errText}>{errors.password}</Text>}

          <TextInput
            style={[styles.input, !!errors.confirmPassword && styles.inputError]}
            placeholder="Confirm password"
            placeholderTextColor="#888"
            secureTextEntry
            value={data.confirmPassword}
            onChangeText={(text) => handleOnChange('confirmPassword', text)}
            onBlur={() => handleBlur('confirmPassword')}
            editable={!isSubmitting}
          />
          {!!errors.confirmPassword && <Text style={styles.errText}>{errors.confirmPassword}</Text>}

          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={isSubmitting ? 1 : 0.7}
          >
            <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
              {isSubmitting ? 'Creating...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => !isSubmitting && navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.linkText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: 'center', // vertical center
    alignItems: 'center',     // horizontal center
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errText: {
    color: '#e53935',
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
  },
  button: {
    backgroundColor: '#1e90ff',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 6,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
  linkText: {
    color: '#1e90ff',
    fontWeight: '600',
  },
});
