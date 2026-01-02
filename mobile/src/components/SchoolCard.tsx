import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  School,
  GeoPoint,
  isWithinSchoolRadius,
  formatDistance,
} from '@dmdl/shared';

interface SchoolCardProps {
  school: School;
  userLocation: GeoPoint | null;
  onPress: () => void;
}

export function SchoolCard({ school, userLocation, onPress }: SchoolCardProps) {
  const distanceInfo = userLocation
    ? isWithinSchoolRadius(userLocation, school.location, school.checkInRadiusMeters)
    : null;

  const isWithinRange = distanceInfo?.isWithin ?? false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={24} color="#1a56db" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {school.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {school.address}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.distanceContainer}>
            {distanceInfo ? (
              <>
                <View
                  style={[
                    styles.statusDot,
                    isWithinRange ? styles.statusGreen : styles.statusGray,
                  ]}
                />
                <Text
                  style={[
                    styles.distanceText,
                    isWithinRange && styles.distanceTextGreen,
                  ]}
                >
                  {isWithinRange
                    ? 'In range'
                    : formatDistance(distanceInfo.distanceMeters)}
                </Text>
              </>
            ) : (
              <Text style={styles.distanceText}>Location unavailable</Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusGreen: {
    backgroundColor: '#10b981',
  },
  statusGray: {
    backgroundColor: '#9ca3af',
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  distanceTextGreen: {
    color: '#10b981',
    fontWeight: '600',
  },
});
