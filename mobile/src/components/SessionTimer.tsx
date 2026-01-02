import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SessionTimerProps {
  startTime: Date;
  schoolName: string;
}

export function SessionTimer({ startTime, schoolName }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateElapsed = () => {
      const start = startTime.getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);

      return {
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      };
    };

    setElapsed(calculateElapsed());

    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pulsingDot} />
        <Text style={styles.label}>Session in progress</Text>
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{formatNumber(elapsed.hours)}</Text>
          <Text style={styles.timeLabel}>hours</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{formatNumber(elapsed.minutes)}</Text>
          <Text style={styles.timeLabel}>min</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeValue}>{formatNumber(elapsed.seconds)}</Text>
          <Text style={styles.timeLabel}>sec</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="location" size={16} color="#10b981" />
        <Text style={styles.schoolName}>{schoolName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  separator: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
});
