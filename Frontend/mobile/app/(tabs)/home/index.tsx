import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuth } from '../../_components/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as particulierApi from '../../_components/api/particulier';
import { useCallback, useState } from 'react';

interface Stats {
  carCount: number;
  maintenanceCount: number;
  upcomingMaintenance: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    carCount: 0,
    maintenanceCount: 0,
    upcomingMaintenance: 0,
  });

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const cars = await particulierApi.getCars();
          const maintenances = await particulierApi.getMaintenances();
          
          setStats({
            carCount: cars.length,
            maintenanceCount: maintenances.length,
            upcomingMaintenance: maintenances.filter(m => m.status === 'UPCOMING').length,
          });
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      };
      
      fetchStats();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Welcome, {user?.first_name}!</Text>
      
      <View style={styles.cardRow}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>{stats.carCount}</Text>
            <Text variant="bodyMedium">Your Cars</Text>
          </Card.Content>
          <Card.Actions>
            <Link href="/cars" asChild>
              <Button>View</Button>
            </Link>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>{stats.maintenanceCount}</Text>
            <Text variant="bodyMedium">Maintenances</Text>
          </Card.Content>
          <Card.Actions>
            <Link href="/maintenance" asChild>
              <Button>View</Button>
            </Link>
          </Card.Actions>
        </Card>
      </View>

      <Card style={styles.highlightCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.highlightTitle}>Upcoming</Text>
          <Text variant="bodyMedium" style={styles.highlightText}>
            You have {stats.upcomingMaintenance} pending maintenance{stats.upcomingMaintenance !== 1 ? 's' : ''}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Link href="/maintenance" asChild>
            <Button>Check Now</Button>
          </Link>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  highlightCard: {
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  highlightTitle: {
    color: '#6200ee',
  },
  highlightText: {
    fontSize: 16,
  },
});