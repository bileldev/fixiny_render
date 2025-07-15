import { Stack } from 'expo-router';
import { useAuth } from '../_components/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Smooth transitions
        contentStyle: {
          backgroundColor: '#f5f5f5', // Light gray background
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          animation: 'slide_from_left',
        }}
      />
    </Stack>
  );
}