import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useSession } from '@/contexts/SessionContext';
import { SchoolCard } from '@/components/SchoolCard';
import { ActiveSessionBanner } from '@/components/ActiveSessionBanner';
import { useSchools } from '@/hooks/useSchools';

export default function SchoolsScreen() {
  const { user } = useAuth();
  const { location, requestPermission } = useLocation();
  const { activeSession } = useSession();
  const { schools, isLoading, refetch } = useSchools();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSchoolPress = (schoolId: string) => {
    router.push(`/school/${schoolId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {activeSession && <ActiveSessionBanner session={activeSession} />}

      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SchoolCard
            school={item}
            userLocation={location}
            onPress={() => handleSchoolPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {user?.displayName?.split(' ')[0]}
            </Text>
            <Text style={styles.subtitle}>Your assigned schools</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No schools assigned</Text>
              <Text style={styles.emptySubtext}>
                Contact your administrator to get assigned to schools
              </Text>
            </View>
          ) : null
        }
      />

      {user?.role === 'administrator' && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push('/admin/select-school')}
        >
          <Text style={styles.adminButtonText}>Check in to any school</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  adminButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1a56db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
