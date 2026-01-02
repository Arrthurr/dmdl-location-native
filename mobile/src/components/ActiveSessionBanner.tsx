import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Session, formatDuration } from '@dmdl/shared';

interface ActiveSessionBannerProps {
  session: Session;
}

export function ActiveSessionBanner({ session }: ActiveSessionBannerProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(session.checkInTime).getTime();
      const now = Date.now();
      return Math.floor((now - start) / 60000);
    };

    setElapsedMinutes(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedMinutes(calculateElapsed());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.checkInTime]);

  const handlePress = () => {
    router.push(`/school/${session.schoolId}`);
  };

  return (
    <TouchableOpacity style={styles.banner} onPress={handlePress}>
      <View style={styles.content}>
        <View style={styles.indicator} />
        <View style={styles.info}>
          <Text style={styles.label}>Currently checked in at</Text>
          <Text style={styles.schoolName} numberOfLines={1}>
            {session.schoolName}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color="#ffffff" />
          <Text style={styles.timer}>{formatDuration(elapsedMinutes)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
});
