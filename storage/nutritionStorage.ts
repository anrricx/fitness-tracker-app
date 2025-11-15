import AsyncStorage from '@react-native-async-storage/async-storage';

const GOALS_STORAGE_KEY = '@nutrition_goals';

export interface NutritionData {
  calories: number;
  protein: number;
  date?: string; // YYYY-MM-DD format
}

export interface NutritionGoals {
  calorieGoal: number;
  proteinGoal: number;
}

// Get today's date as YYYY-MM-DD
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

// Get storage key for a specific date
function getDateKey(date: string): string {
  return `@nutrition_${date}`;
}

// Save today's nutrition data
export async function saveTodayNutritionData(data: NutritionData): Promise<void> {
  try {
    const todayKey = getTodayKey();
    const storageKey = getDateKey(todayKey);
    // Always include the date when saving
    const dataWithDate: NutritionData = {
      ...data,
      date: todayKey,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(dataWithDate));
  } catch (error) {
    console.error('Error saving nutrition data:', error);
    throw error;
  }
}

// Get today's nutrition data
export async function getTodayNutritionData(): Promise<NutritionData> {
  try {
    const todayKey = getTodayKey();
    const storageKey = getDateKey(todayKey);
    const data = await AsyncStorage.getItem(storageKey);
    
    if (data) {
      const parsedData: NutritionData = JSON.parse(data);
      // Check if the stored date matches today's date
      if (parsedData.date === todayKey) {
        // Date matches, return the stored data
        return parsedData;
      } else {
        // Date doesn't match, reset to zero for new day
        const resetData: NutritionData = { calories: 0, protein: 0, date: todayKey };
        // Save the reset data
        await AsyncStorage.setItem(storageKey, JSON.stringify(resetData));
        return resetData;
      }
    }
    
    // No data exists, return zeros
    const newData: NutritionData = { calories: 0, protein: 0, date: todayKey };
    // Save the initial data
    await AsyncStorage.setItem(storageKey, JSON.stringify(newData));
    return newData;
  } catch (error) {
    console.error('Error getting nutrition data:', error);
    return { calories: 0, protein: 0, date: getTodayKey() };
  }
}

// Add meal to today's data
export async function addMeal(calories: number, protein: number): Promise<void> {
  try {
    const currentData = await getTodayNutritionData();
    const newData: NutritionData = {
      calories: currentData.calories + calories,
      protein: currentData.protein + protein,
    };
    await saveTodayNutritionData(newData);
  } catch (error) {
    console.error('Error adding meal:', error);
    throw error;
  }
}

// Save goals
export async function saveGoals(goals: NutritionGoals): Promise<void> {
  try {
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goals:', error);
    throw error;
  }
}

// Get goals
export async function getGoals(): Promise<NutritionGoals> {
  try {
    const data = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default goals
    return { calorieGoal: 2000, proteinGoal: 150 };
  } catch (error) {
    console.error('Error getting goals:', error);
    return { calorieGoal: 2000, proteinGoal: 150 };
  }
}

// Reset today's nutrition data
export async function resetToday(): Promise<void> {
  try {
    const todayKey = getTodayKey();
    const storageKey = getDateKey(todayKey);
    // Remove today's data from AsyncStorage
    await AsyncStorage.removeItem(storageKey);
    // Initialize with zeros for today
    const resetData: NutritionData = { calories: 0, protein: 0, date: todayKey };
    await AsyncStorage.setItem(storageKey, JSON.stringify(resetData));
  } catch (error) {
    console.error('Error resetting today\'s data:', error);
    throw error;
  }
}

