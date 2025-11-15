import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface WorkoutCardProps {
  title: string;
  duration?: number;
  exercises?: number;
  onPress?: () => void;
}

export function WorkoutCard({ title, duration, exercises, onPress }: WorkoutCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        {(duration || exercises) && (
          <View style={styles.metaContainer}>
            {duration && (
              <ThemedText style={styles.meta}>
                ⏱ {duration} min
              </ThemedText>
            )}
            {exercises && (
              <ThemedText style={styles.meta}>
                💪 {exercises} exercises
              </ThemedText>
            )}
          </View>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  meta: {
    fontSize: 14,
    opacity: 0.7,
  },
});

