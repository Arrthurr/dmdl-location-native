import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NoteEditor } from '@/components/NoteEditor';
import { useSessionDetails } from '@/hooks/useSessionDetails';
import { formatDateTime, formatDuration } from '@dmdl/shared';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, isLoading } = useSessionDetails(id);

  if (isLoading || !session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  const isActive = session.status === 'active';
  const canEditNotes = isActive ||
    (new Date().getTime() - new Date(session.checkInTime).getTime()) < 24 * 60 * 60 * 1000;

  return (
    <>
      <Stack.Screen
        options={{
          title: session.schoolName,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusActive : styles.statusCompleted,
              ]}
            >
              <Text style={styles.statusText}>
                {session.status === 'active'
                  ? 'Active'
                  : session.status === 'auto_completed'
                    ? 'Auto-completed'
                    : 'Completed'}
              </Text>
            </View>
          </View>

          {/* Session Info */}
          <View style={styles.card}>
            <Text style={styles.schoolName}>{session.schoolName}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="log-in-outline" size={20} color="#10b981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-in</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(new Date(session.checkInTime))}
                </Text>
              </View>
            </View>

            {session.checkOutTime && (
              <View style={styles.infoRow}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Check-out</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(new Date(session.checkOutTime))}
                  </Text>
                </View>
              </View>
            )}

            {session.durationMinutes && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#1a56db" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>
                    {formatDuration(session.durationMinutes)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Check-in Distance</Text>
                <Text style={styles.infoValue}>
                  {session.checkInDistanceMeters}m from school
                </Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            {canEditNotes ? (
              <NoteEditor
                sessionId={session.id}
                initialNotes={session.notes}
              />
            ) : session.notes ? (
              <Text style={styles.notes}>{session.notes}</Text>
            ) : (
              <Text style={styles.noNotes}>No notes added</Text>
            )}
            {!canEditNotes && (
              <Text style={styles.notesHelp}>
                Notes can only be edited within 24 hours
              </Text>
            )}
          </View>
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
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusCompleted: {
    backgroundColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  notes: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  noNotes: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  notesHelp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});
