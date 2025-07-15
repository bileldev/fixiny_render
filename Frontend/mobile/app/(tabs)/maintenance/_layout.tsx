import { Stack } from 'expo-router';

export default function MaintenanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ title: "Add Maintenance" }} />
      <Stack.Screen name="[id]" options={{ title: "Edit Maintenance" }} />
    </Stack>
  );
}