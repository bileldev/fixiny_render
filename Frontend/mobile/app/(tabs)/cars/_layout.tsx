import { Stack } from 'expo-router';

export default function CarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ title: "Add New Car" }} />
      <Stack.Screen name="[id]" options={{ title: "Edit Car" }} />
    </Stack>
  );
}