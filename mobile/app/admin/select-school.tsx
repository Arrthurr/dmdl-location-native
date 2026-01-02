import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/contexts/LocationContext';
import { useAllSchools } from '@/hooks/useAllSchools';
import { formatDistance, isWithinSchoolRadius } from '@dmdl/shared';

export default function AdminSelectSchoolScreen() {
  const { location } = useLocation();
  const { schools, isLoading, refetch } = useAllSchools();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by distance
  const sortedSchools = [...filteredSchools].sort((a, b) => {
    if (!location) return 0;
    const distA = isWithinSchoolRadius(location, a.location).distanceMeters;
    const distB = isWithinSchoolRadius(location, b.location).distanceMeters;
    return distA - distB;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSchoolSelect = (schoolId: string) => {
    router.push(`/school/${schoolId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sortedSchools}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const distanceInfo = location
            ? isWithinSchoolRadius(location, item.location, item.checkInRadiusMeters)
            : null;

          return (
            <TouchableOpacity
              style={styles.schoolItem}
              onPress={() => handleSchoolSelect(item.id)}
            >
              <View style={styles.schoolInfo}>
                <Text style={styles.schoolName}>{item.name}</Text>
                <Text style={styles.schoolAddress}>{item.address}</Text>
                <Text style={styles.schoolCity}>
                  {item.city}, {item.state}
                </Text>
              </View>
              <View style={styles.distanceContainer}>
                {distanceInfo ? (
                  <>
                    <Text
                      style={[
                        styles.distance,
                        distanceInfo.isWithin && styles.withinRange,
                      ]}
                    >
                      {formatDistance(distanceInfo.distanceMeters)}
                    </Text>
                    {distanceInfo.isWithin && (
                      <View style={styles.withinBadge}>
                        <Text style={styles.withinText}>In range</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.distance}>--</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No schools found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  schoolAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  schoolCity: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  distanceContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  withinRange: {
    color: '#10b981',
  },
  withinBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    marginBottom: 4,
  },
  withinText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
