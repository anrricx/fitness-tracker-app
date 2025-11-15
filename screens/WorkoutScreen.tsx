import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  getWorkoutSchedule,
  getExercisesForDay,
  saveExercisesForDay,
  saveExerciseWeight,
  saveWorkoutLog,
  getAllExerciseWeights,
  type Exercise,
  type WorkoutSchedule,
} from '@/storage/workoutStorage';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREVIATIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutScreen() {
  const [schedule, setSchedule] = useState<WorkoutSchedule>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseWeights, setExerciseWeights] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadSchedule();
    loadExerciseWeights();
  }, []);

  const loadSchedule = async () => {
    const workoutSchedule = await getWorkoutSchedule();
    setSchedule(workoutSchedule);
  };

  const loadExerciseWeights = async () => {
    const weights = await getAllExerciseWeights();
    setExerciseWeights(weights);
  };

  const handleDayPress = async (day: string) => {
    setSelectedDay(day);
    const dayExercises = await getExercisesForDay(day);
    // Load latest weights for each exercise
    const exercisesWithWeights = await Promise.all(
      dayExercises.map(async (exercise) => {
        const latestWeight = exerciseWeights[exercise.name] || exercise.weight;
        return {
          ...exercise,
          weight: latestWeight || exercise.weight,
        };
      })
    );
    setExercises(exercisesWithWeights);
    setShowExerciseModal(true);
  };

  const handleExerciseUpdate = async (
    exerciseId: string,
    field: 'weight' | 'sets' | 'reps',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    const updatedExercises = exercises.map((exercise) => {
      if (exercise.id === exerciseId) {
        const updated = {
          ...exercise,
          [field]: numValue,
        };
        // Save weight when it's updated
        if (field === 'weight') {
          saveExerciseWeight(exercise.name, numValue);
          setExerciseWeights((prev) => ({
            ...prev,
            [exercise.name]: numValue,
          }));
        }
        return updated;
      }
      return exercise;
    });

    setExercises(updatedExercises);
  };

  const handleSaveWorkout = async () => {
    if (!selectedDay) return;

    try {
      // Save exercises for the day
      await saveExercisesForDay(selectedDay, exercises);

      // Save workout log
      const today = new Date().toISOString().split('T')[0];
      await saveWorkoutLog({
        date: today,
        day: selectedDay,
        exercises: exercises,
      });

      // Update schedule state
      const updatedSchedule = { ...schedule };
      updatedSchedule[selectedDay] = exercises;
      setSchedule(updatedSchedule);

      Alert.alert('Success', 'Workout saved successfully!');
      setShowExerciseModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const handleAddExercise = () => {
    Alert.prompt(
      'Add Exercise',
      'Enter exercise name:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: async (exerciseName) => {
            if (exerciseName && exerciseName.trim()) {
              const latestWeight = exerciseWeights[exerciseName.trim()];
              const newExercise: Exercise = {
                id: `${Date.now()}-${Math.random()}`,
                name: exerciseName.trim(),
                weight: latestWeight,
                sets: 3,
                reps: 10,
              };
              setExercises([...exercises, newExercise]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteExercise = (exerciseId: string) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = exercises.filter((e) => e.id !== exerciseId);
            setExercises(updatedExercises);
          },
        },
      ]
    );
  };

  const getDayAbbreviation = (day: string) => {
    const index = DAYS_OF_WEEK.indexOf(day);
    return index !== -1 ? DAY_ABBREVIATIONS[index] : day.substring(0, 3);
  };

  const getExerciseCount = (day: string) => {
    return schedule[day]?.length || 0;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.background}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Workout
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Weekly Schedule
            </ThemedText>
          </View>

          {/* Weekly Schedule */}
          <View style={styles.scheduleContainer}>
            {DAYS_OF_WEEK.map((day) => {
              const exerciseCount = getExerciseCount(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayCard}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}>
                  <View style={styles.dayCardContent}>
                    <ThemedText style={styles.dayAbbreviation}>
                      {getDayAbbreviation(day)}
                    </ThemedText>
                    <ThemedText style={styles.dayName}>{day}</ThemedText>
                    {exerciseCount > 0 && (
                      <View style={styles.exerciseBadge}>
                        <ThemedText style={styles.exerciseBadgeText}>
                          {exerciseCount}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Exercise Modal */}
          <Modal
            visible={showExerciseModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowExerciseModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {selectedDay}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowExerciseModal(false)}
                    style={styles.closeButton}
                    activeOpacity={0.6}>
                    <MaterialIcons name="close" size={22} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.exercisesList}
                  showsVerticalScrollIndicator={false}>
                  {exercises.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIconContainer}>
                        <MaterialIcons name="fitness-center" size={40} color="#C7C7CC" />
                      </View>
                      <ThemedText style={styles.emptyStateTitle}>
                        No Exercises
                      </ThemedText>
                      <ThemedText style={styles.emptyStateText}>
                        Add your first exercise to get started
                      </ThemedText>
                    </View>
                  ) : (
                    exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                          <TouchableOpacity
                            onPress={() => handleDeleteExercise(exercise.id)}
                            style={styles.deleteButton}
                            activeOpacity={0.6}>
                            <MaterialIcons name="delete-outline" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.exerciseInputs}>
                          <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                              <MaterialIcons name="fitness-center" size={18} color="#8E8E93" />
                            </View>
                            <ThemedText style={styles.inputLabel}>Weight</ThemedText>
                            <TextInput
                              style={styles.input}
                              value={exercise.weight?.toString() || ''}
                              onChangeText={(value) =>
                                handleExerciseUpdate(exercise.id, 'weight', value)
                              }
                              placeholder="0"
                              placeholderTextColor="#C7C7CC"
                              keyboardType="numeric"
                            />
                            <ThemedText style={styles.inputUnit}>lbs</ThemedText>
                          </View>

                          <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                              <MaterialIcons name="repeat" size={18} color="#8E8E93" />
                            </View>
                            <ThemedText style={styles.inputLabel}>Sets</ThemedText>
                            <TextInput
                              style={styles.input}
                              value={exercise.sets?.toString() || ''}
                              onChangeText={(value) =>
                                handleExerciseUpdate(exercise.id, 'sets', value)
                              }
                              placeholder="0"
                              placeholderTextColor="#C7C7CC"
                              keyboardType="numeric"
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <View style={styles.inputIconContainer}>
                              <MaterialIcons name="replay" size={18} color="#8E8E93" />
                            </View>
                            <ThemedText style={styles.inputLabel}>Reps</ThemedText>
                            <TextInput
                              style={styles.input}
                              value={exercise.reps?.toString() || ''}
                              onChangeText={(value) =>
                                handleExerciseUpdate(exercise.id, 'reps', value)
                              }
                              placeholder="0"
                              placeholderTextColor="#C7C7CC"
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.pillButton}
                    onPress={handleAddExercise}
                    activeOpacity={0.7}>
                    <LinearGradient
                      colors={['rgba(78, 205, 196, 0.1)', 'rgba(68, 160, 141, 0.1)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.pillButtonGradient}>
                      <MaterialIcons name="add" size={20} color="#4ECDC4" />
                      <ThemedText style={styles.pillButtonText}>Add Exercise</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pillButton}
                    onPress={handleSaveWorkout}
                    activeOpacity={0.7}>
                    <LinearGradient
                      colors={['rgba(78, 205, 196, 0.15)', 'rgba(68, 160, 141, 0.15)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.pillButtonGradient}>
                      <MaterialIcons name="check" size={20} color="#4ECDC4" />
                      <ThemedText style={[styles.pillButtonText, styles.pillButtonTextPrimary]}>
                        Save
                      </ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    paddingTop: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1.5,
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.4,
  },
  scheduleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  dayCard: {
    width: '30.5%',
    minWidth: 110,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  dayCardContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  dayAbbreviation: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dayName: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  exerciseBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -1,
    color: '#000000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  exercisesList: {
    maxHeight: 480,
    marginBottom: 24,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(199, 199, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.5,
    color: '#000000',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 16,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 16,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#FAFAFA',
    fontWeight: '400',
    textAlign: 'center',
    width: '100%',
    color: '#000000',
  },
  inputUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pillButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  pillButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4ECDC4',
    letterSpacing: -0.2,
  },
  pillButtonTextPrimary: {
    fontWeight: '600',
  },
});
