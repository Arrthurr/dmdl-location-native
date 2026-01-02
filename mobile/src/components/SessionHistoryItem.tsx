import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session, formatDate, formatDuration, formatTime12Hour } from '@dmdl/shared';

interface SessionHistoryItemProps {
  session: Session;
  onPress: () => void;
}

export function SessionHistoryItem({ session, onPress }: SessionHistoryItemProps) {
  const checkInDate = new Date(session.checkInTime);
  const checkInTime = checkInDate.toTimeString().slice(0, 5);

  const getStatusColor = () => {
    switch (session.status) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#6b7280';
      case 'auto_completed':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = () => {
    switch (session.status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'auto_completed':
        return 'Auto-completed';
      default:
        return session.status;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(checkInDate)}</Text>
          <Text style={styles.time}>{formatTime12Hour(checkInTime)}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.schoolContainer}>
          <Ionicons name="school-outline" size={18} color="#6b7280" />
          <Text style={styles.schoolName} numberOfLines={1}>
            {session.schoolName}
          </Text>
        </View>

        {session.durationMinutes != null && (
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={16} color="#9ca3af" />
            <Text style={styles.duration}>
              {formatDuration(session.durationMinutes)}
            </Text>
          </View>
        )}
      </View>

      {session.notes && (
        <View style={styles.notePreview}>
          <Ionicons name="document-text-outline" size={14} color="#9ca3af" />
          <Text style={styles.noteText} numberOfLines={1}>
            {session.notes}
          </Text>
        </View>
      )}

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9ca3af"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schoolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  schoolName: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  noteText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
});
