import { View, StyleSheet } from 'react-native';
import { Avatar, Text, Button } from 'react-native-paper';
import { useAuth } from '../../_components/context/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Avatar.Text 
          size={80} 
          label={`${user.first_name?.[0]}${user.last_name?.[0]}`} 
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.role}>Role: {user.role}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailItem}>
          Phone: {user.phone_number || 'Not provided'}
        </Text>
        <Text style={styles.detailItem}>
          Status: {user.status || 'Unknown'}
        </Text>
      </View>

      <Button 
        mode="contained" 
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    backgroundColor: '#6200ee',
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginBottom: 5,
  },
  role: {
    color: '#888',
    fontStyle: 'italic',
  },
  details: {
    marginBottom: 20,
  },
  detailItem: {
    fontSize: 16,
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 20,
  },
});