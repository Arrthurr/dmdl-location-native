import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/contexts/LocationContext';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { SessionTimer } from '@/components/SessionTimer';
import { NoteEditor } from '@/components/NoteEditor';
import { useSchool } from '@/hooks/useSchool';
import { useSchedule } from '@/hooks/useSchedule';
import { formatDistance, isWithinSchoolRadius } from '@dmdl/shared';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { location } = useLocation();
  const { activeSession, checkIn, checkOut, isChecking } = useSession();
  const { school, isLoading: schoolLoading } = useSchool(id);
  const { todaySchedule, isWithinSchedule } = useSchedule(id);

  const isActiveSessionHere = activeSession?.schoolId === id;

  const distanceInfo =
    location && school
      ? isWithinSchoolRadius(location, school.location, school.checkInRadiusMeters)
      : null;

  const canCheckIn =
    distanceInfo?.isWithin &&
    !activeSession &&
    (user?.role === 'administrator' || isWithinSchedule);

  const handleCheckIn = async () => {
    if (!school || !location) return;

    try {
      await checkIn(school.id, location);
    } catch (error) {
      Alert.alert(
        'Check-in Failed',
        error instanceof Error ? error.message : 'Unable to check in'
      );
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession || !location) return;

    try {
      await checkOut(activeSession.id, location);
    } catch (error) {
      Alert.alert(
        'Check-out Failed',
        error instanceof Error ? error.message : 'Unable to check out'
      );
    }
  };

  const handleGetDirections = () => {
    if (!school) return;
    const url = `https://maps.google.com/maps?daddr=${school.location.latitude},${school.location.longitude}`;
    Linking.openURL(url);
  };

  if (schoolLoading || !school) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: school.name }} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* School Info */}
          <View style={styles.card}>
            <Text style={styles.schoolName}>{school.name}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <Text style={styles.address}>{school.address}</Text>
            </View>
            <Text style={styles.addressDetails}>
              {school.city}, {school.state} {school.zipCode}
            </Text>

            <TouchableOpacity
              style={styles.directionsButton}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate-outline" size={20} color="#1a56db" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Distance Status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Check-in Status</Text>
            {distanceInfo ? (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicator,
                    distanceInfo.isWithin
                      ? styles.statusGreen
                      : styles.statusGray,
                  ]}
                />
                <Text style={styles.statusText}>
                  {distanceInfo.isWithin
                    ? 'You are within check-in range'
                    : `${formatDistance(distanceInfo.distanceMeters)} away`}
                </Text>
              </View>
            ) : (
              <Text style={styles.statusText}>Location unavailable</Text>
            )}

            {user?.role === 'provider' && todaySchedule && (
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Today's Schedule:</Text>
                <Text style={styles.scheduleTime}>
                  {todaySchedule.startTime} - {todaySchedule.endTime}
                </Text>
                {!isWithinSchedule && (
                  <Text style={styles.scheduleWarning}>
                    Check-in only allowed during scheduled times
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Active Session */}
          {isActiveSessionHere && activeSession && (
            <View style={styles.card}>
              <SessionTimer
                startTime={new Date(activeSession.checkInTime)}
                schoolName={school.name}
              />
              <NoteEditor
                sessionId={activeSession.id}
                initialNotes={activeSession.notes}
              />
            </View>
          )}

          {/* Check-in/out Button */}
          {isActiveSessionHere ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkOutButton]}
              onPress={handleCheckOut}
              disabled={isChecking}
            >
              {isChecking ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={24} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Check Out</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                canCheckIn ? styles.checkInButton : styles.disabledButton,
              ]}
              onPress={handleCheckIn}
              disabled={!canCheckIn || isChecking}
            >
              {isChecking ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={24} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Check In</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {!canCheckIn && !isActiveSessionHere && (
            <Text style={styles.helpText}>
              {activeSession
                ? 'You must check out of your current session first'
                : !distanceInfo?.isWithin
                  ? `Move closer to check in (within ${school.checkInRadiusMeters}m)`
                  : !isWithinSchedule
                    ? 'Check-in not available outside scheduled times'
                    : 'Unable to check in'}
            </Text>
          )}

          {/* Contact Info */}
          {(school.contactName || school.contactPhone || school.contactEmail) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact</Text>
              {school.contactName && (
                <Text style={styles.contactText}>{school.contactName}</Text>
              )}
              {school.contactPhone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${school.contactPhone}`)}
                >
                  <Text style={styles.contactLink}>{school.contactPhone}</Text>
                </TouchableOpacity>
              )}
              {school.contactEmail && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${school.contactEmail}`)}
                >
                  <Text style={styles.contactLink}>{school.contactEmail}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  schoolName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  addressDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 26,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  directionsText: {
    color: '#1a56db',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusGreen: {
    backgroundColor: '#10b981',
  },
  statusGray: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
  },
  scheduleInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  scheduleWarning: {
    fontSize: 14,
    color: '#f59e0b',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  checkInButton: {
    backgroundColor: '#10b981',
  },
  checkOutButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  contactLink: {
    fontSize: 16,
    color: '#1a56db',
    marginBottom: 4,
  },
});
