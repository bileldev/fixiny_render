import { Slot } from 'expo-router';
import { AuthProvider } from './_components/context/AuthContext';
import  LoadingScreen  from './_components/LoadingScreen';
import Toast from 'react-native-toast-message';
import { toastConfig } from './_components/UI/ToastConfig';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
      <Toast config={toastConfig} position="bottom" bottomOffset={50} visibilityTime={3000}/>
    </AuthProvider>
  );
}