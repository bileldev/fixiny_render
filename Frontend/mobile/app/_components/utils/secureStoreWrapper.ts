import * as SecureStore from 'expo-secure-store';

export const setSecureItem = async (key: string, value: any) => {
  if (typeof value !== 'string') {
    try {
      value = JSON.stringify(value);
    } catch (e) {
      throw new Error(`Failed to stringify value for key ${key}: ${e}`);
    }
  }
  
  if (value === undefined || value === null) {
    throw new Error(`Cannot store undefined/null value for key ${key}`);
  }

  await SecureStore.setItemAsync(key, value);
};

export const getSecureItem = async (key: string) => {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value; // Return as-is if not JSON
  }
};

export const deleteSecureItem = async (key: string) => {
  await SecureStore.deleteItemAsync(key);
};