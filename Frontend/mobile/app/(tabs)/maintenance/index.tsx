import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Card, Button, ActivityIndicator, Text } from 'react-native-paper';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../../_components/context/AuthContext';
import * as particulierApi from '../../_components/api/particulier';
import { Maintenance } from '@/app/_components/types';
import Toast from 'react-native-toast-message';

export default function MaintenanceScreen() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const fetchMaintenances = async () => {
        try {
          const data = await particulierApi.getMaintenances();
          setMaintenances(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load maintenance records');
        } finally {
          setLoading(false);
        }
      };
      
      if (user) {
        fetchMaintenances();
      }
    }, [user])
  );

  const handleDeleteMaintenance = async (id: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this maintenance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: async () => {
          try {
            await particulierApi.deleteMaintenance(id);
            setMaintenances(maintenances.filter(m => m.id !== id));
            Toast.show({ type: 'success', text1: 'Maintenance deleted successfully' });
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete maintenance');
            Toast.show({ type: 'error', text1: error instanceof Error ? error.message : 'Failed to delete maintenance' });
          }
        }},
      ]
    )    
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Link href="/(tabs)/home" asChild>
          <Button>Go Back</Button>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={maintenances}
        renderItem={({ item }) => (          
            <Card style={styles.card}>
              <Card.Title 
                title={item.type} 
                subtitle={`${item.car.make} ${item.car.model}`} 
              />
              <Card.Content>
                <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
                <Text>Mileage: {item.recordedMileage} km</Text>
                <Text>Cost: {item.cost.toFixed(2)} TND</Text>
                <Text>Status: {item.status}</Text>
              </Card.Content>
              <Card.Actions>
                <Link 
                  href={{
                    pathname: `/maintenance/[id]`,
                     params: { id: item.id ,maintenance: JSON.stringify(item) }
                    }} 
                  asChild>
                  <Button>Edit</Button>
                </Link>
                <Button onPress={() => handleDeleteMaintenance(item.id)}>Delete</Button>
              </Card.Actions>
            </Card>       
                    
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      
      <Link href="/maintenance/create" asChild>
        <Button 
          mode="contained" 
          style={styles.addButton}
          icon="plus"
        >
          Add Maintenance
        </Button>
      </Link>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
  },
});