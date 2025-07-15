// src/components/ToastConfig.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

// Define types for our toast variants
type ToastVariant = 'success' | 'error';

const styles = StyleSheet.create({
  toastContainer: {
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successToast: {
    backgroundColor: '#4BB543',
  },
  errorToast: {
    backgroundColor: '#FF3333',
  },
  infoToast: {
    backgroundColor: '#3498db',
  },
  warningToast: {
    backgroundColor: '#f39c12',
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

// Create a Toast component with proper typing
const AppToast = ({ 
  type, 
  text1 
}: ToastConfigParams<ToastVariant>) => (
  <View style={[
    styles.toastContainer,
    type === 'success' ? styles.successToast : styles.errorToast
  ]}>
    <Text style={styles.toastText}>{text1}</Text>
  </View>
);

// Define the toast config with TypeScript
export const toastConfig: ToastConfig = {
  success: (props) => <AppToast {...props} />,
  error: (props) => <AppToast {...props} />,
  info: (props) => <AppToast {...props} />,
  warning: (props) => <AppToast {...props} />,
};

// Create a custom hook for toast notifications
export const useToast = () => {
  const showToast = (
    type: ToastVariant,
    message: string,
    position: 'top' | 'bottom' = 'bottom'
  ) => {
    Toast.show({
      type,
      text1: message,
      position,
    });
  };

  return { showToast };
};