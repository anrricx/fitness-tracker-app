import React, { useEffect, useState } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  StyleSheet 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RingChart } from "@/components/RingChart";

const NutritionScreen: React.FC = () => {
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2400);
  const [proteinGoal, setProteinGoal] = useState(180);

  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");

  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    try {
      const stored = await AsyncStorage.getItem(`nutrition-${todayKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCalories(parsed.calories ?? 0);
        setProtein(parsed.protein ?? 0);
        setCalorieGoal(parsed.calorieGoal ?? 2400);
        setProteinGoal(parsed.proteinGoal ?? 180);
      } else {
        // new day, start at 0
        setCalories(0);
        setProtein(0);
      }
    } catch (e) {
      console.log("Error loading today:", e);
    }
  };

  const saveToday = async (newCalories: number, newProtein: number) => {
    try {
      const payload = {
        calories: newCalories,
        protein: newProtein,
        calorieGoal,
        proteinGoal,
      };
      await AsyncStorage.setItem(`nutrition-${todayKey}`, JSON.stringify(payload));
    } catch (e) {
      console.log("Error saving today:", e);
    }
  };

  const addMeal = () => {
    const c = Number(mealCalories) || 0;
    const p = Number(mealProtein) || 0;

    const newCalories = calories + c;
    const newProtein = protein + p;

    setCalories(newCalories);
    setProtein(newProtein);
    saveToday(newCalories, newProtein);

    setMealCalories("");
    setMealProtein("");
  };

  const resetToday = () => {
    Alert.alert(
      "Reset today's nutrition?",
      "This will clear today's calories and protein.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`nutrition-${todayKey}`);
            } catch (e) {
              console.log("Error clearing:", e);
            }
            setCalories(0);
            setProtein(0);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Today</Text>

        {/* RING CENTERED */}
        <View style={styles.ringWrapper}>
          <RingChart
            currentCalories={calories}
            calorieGoal={calorieGoal}
            currentProtein={protein}
            proteinGoal={proteinGoal}
          />
        </View>

        {/* TOTALS */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Calories</Text>
            <Text style={styles.totalValue}>
              {calories} / {calorieGoal}
            </Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Protein</Text>
            <Text style={styles.totalValue}>
              {protein}g / {proteinGoal}g
            </Text>
          </View>
        </View>

        {/* GOALS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calorie goal</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(calorieGoal)}
                onChangeText={(text) => setCalorieGoal(Number(text) || 0)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein goal (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(proteinGoal)}
                onChangeText={(text) => setProteinGoal(Number(text) || 0)}
              />
            </View>
          </View>
        </View>

        {/* ADD MEAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Meal</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={mealCalories}
                onChangeText={setMealCalories}
                placeholder="e.g. 450"
                placeholderTextColor="#9da4b2"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={mealProtein}
                onChangeText={setMealProtein}
                placeholder="e.g. 35"
                placeholderTextColor="#9da4b2"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addMeal}>
            <Text style={styles.addButtonText}>Add to today</Text>
          </TouchableOpacity>
        </View>

        {/* RESET BUTTON */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToday}>
          <Text style={styles.resetButtonText}>Reset Today</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NutritionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0c10", // dark background, change if you want
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  totalBox: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#141820",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  totalLabel: {
    fontSize: 13,
    color: "#9da4b2",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  section: {
    backgroundColor: "#141820",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: "#9da4b2",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#1b2029",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 15,
  },
  addButton: {
    marginTop: 14,
    backgroundColor: "#4f46e5",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButton: {
    alignSelf: "center",
    marginTop: 4,
    backgroundColor: "#1b2029",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 30,
  },
  resetButtonText: {
    color: "#9da4b2",
    fontSize: 13,
    fontWeight: "500",
  },
});
