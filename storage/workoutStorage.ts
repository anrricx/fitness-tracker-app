import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUT_SCHEDULE_KEY = '@workout_schedule';
const EXERCISE_WEIGHTS_KEY = '@exercise_weights';
const WORKOUT_LOGS_KEY = '@workout_logs';

export interface Exercise {
  id: string;
  name: string;
  weight?: number;
  sets?: number;
  reps?: number;
}

export interface DayWorkout {
  day: string; // 'Monday', 'Tuesday', etc.
  exercises: Exercise[];
}

export interface WorkoutSchedule {
  [day: string]: Exercise[];
}

export interface ExerciseWeights {
  [exerciseName: string]: number; // Latest weight used for each exercise
}

export interface WorkoutLog {
  date: string; // YYYY-MM-DD
  day: string;
  exercises: Exercise[];
}

// Get workout schedule
export async function getWorkoutSchedule(): Promise<WorkoutSchedule> {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_SCHEDULE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default empty schedule
    return {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
  } catch (error) {
    console.error('Error getting workout schedule:', error);
    return {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
  }
}

// Save workout schedule
export async function saveWorkoutSchedule(schedule: WorkoutSchedule): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUT_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error('Error saving workout schedule:', error);
    throw error;
  }
}

// Get exercises for a specific day
export async function getExercisesForDay(day: string): Promise<Exercise[]> {
  try {
    const schedule = await getWorkoutSchedule();
    return schedule[day] || [];
  } catch (error) {
    console.error('Error getting exercises for day:', error);
    return [];
  }
}

// Save exercises for a specific day
export async function saveExercisesForDay(day: string, exercises: Exercise[]): Promise<void> {
  try {
    const schedule = await getWorkoutSchedule();
    schedule[day] = exercises;
    await saveWorkoutSchedule(schedule);
  } catch (error) {
    console.error('Error saving exercises for day:', error);
    throw error;
  }
}

// Get latest weight for an exercise
export async function getExerciseWeight(exerciseName: string): Promise<number | undefined> {
  try {
    const data = await AsyncStorage.getItem(EXERCISE_WEIGHTS_KEY);
    if (data) {
      const weights: ExerciseWeights = JSON.parse(data);
      return weights[exerciseName];
    }
    return undefined;
  } catch (error) {
    console.error('Error getting exercise weight:', error);
    return undefined;
  }
}

// Save latest weight for an exercise
export async function saveExerciseWeight(exerciseName: string, weight: number): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(EXERCISE_WEIGHTS_KEY);
    let weights: ExerciseWeights = {};
    if (data) {
      weights = JSON.parse(data);
    }
    weights[exerciseName] = weight;
    await AsyncStorage.setItem(EXERCISE_WEIGHTS_KEY, JSON.stringify(weights));
  } catch (error) {
    console.error('Error saving exercise weight:', error);
    throw error;
  }
}

// Get all exercise weights
export async function getAllExerciseWeights(): Promise<ExerciseWeights> {
  try {
    const data = await AsyncStorage.getItem(EXERCISE_WEIGHTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error getting all exercise weights:', error);
    return {};
  }
}

// Save workout log
export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(WORKOUT_LOGS_KEY);
    let logs: WorkoutLog[] = [];
    if (data) {
      logs = JSON.parse(data);
    }
    logs.push(log);
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving workout log:', error);
    throw error;
  }
}

// Add exercise to a day (if it doesn't exist)
export async function addExerciseToDay(day: string, exerciseName: string): Promise<void> {
  try {
    const exercises = await getExercisesForDay(day);
    const existingExercise = exercises.find((e) => e.name === exerciseName);
    
    if (!existingExercise) {
      const latestWeight = await getExerciseWeight(exerciseName);
      const newExercise: Exercise = {
        id: `${Date.now()}-${Math.random()}`,
        name: exerciseName,
        weight: latestWeight,
        sets: 3,
        reps: 10,
      };
      exercises.push(newExercise);
      await saveExercisesForDay(day, exercises);
    }
  } catch (error) {
    console.error('Error adding exercise to day:', error);
    throw error;
  }
}

