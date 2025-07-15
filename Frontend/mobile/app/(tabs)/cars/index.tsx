import { View, StyleSheet, FlatList, Text, Alert } from 'react-native';
import { Card, Button, ActivityIndicator } from 'react-native-paper';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../../_components/context/AuthContext';
import * as particulierApi from '../../_components/api/particulier';
import { Car } from '@/app/_components/types';
import Toast from 'react-native-toast-message';


export default function ListCarScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const fetchCars = async () => {
        try {
          const data = await particulierApi.getCars();
          setCars(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load cars');
        } finally {
          setLoading(false);
        }
      };
      
      if (user) {
        fetchCars();
      }
    }, [user])
  );

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this car?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: async () => {
          try {            
            await particulierApi.deleteCar(id);
            setCars(cars.filter(car => car.id !== id));
            Toast.show({ type: 'success', text1: 'Car deleted successfully' });
          } catch (error) {            
            alert(error instanceof Error ? error.message : 'Failed to delete car');
            Toast.show({ type: 'error', text1: error instanceof Error ? error.message : 'Failed to delete car' });
          }
        }},
      ]
    );    
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
        data={cars}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title 
              title={`${item.make} ${item.model}`} 
              subtitle={`License: ${item.licensePlate}`} 
            />
            <Card.Content>
              <Text>Year: {item.year}</Text>
              <Text>VIN: {item.vin_number}</Text>
              <Text>Mileage: {item.initial_mileage} km</Text>
            </Card.Content>
            <Card.Actions>
              <Link 
                href={{
                  pathname: `/cars/[id]`,
                  params: { 
                    id: item.id, 
                    car: JSON.stringify(item) 
                  }
                }}  
              asChild>
                <Button>Edit</Button>                
              </Link>
              <Button onPress={() => handleDelete(item.id)}>Delete</Button>
            </Card.Actions>
          </Card>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      
      <Link href="/cars/create" asChild>
        <Button 
          mode="contained" 
          style={styles.addButton}
          icon="plus"
        >
          Add New Car
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