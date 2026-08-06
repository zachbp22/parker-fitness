import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  meal: MealType;
};

const mealTypes: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

export default function MealsScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([
    {
      id: '1',
      name: 'Protein Shake',
      calories: 220,
      protein: 30,
      meal: 'Breakfast',
    },
    {
      id: '2',
      name: 'Chicken Rice Bowl',
      calories: 510,
      protein: 45,
      meal: 'Lunch',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] =
    useState<MealType>('Breakfast');

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const totalCalories = foods.reduce(
    (total, food) => total + food.calories,
    0
  );

  const totalProtein = foods.reduce(
    (total, food) => total + food.protein,
    0
  );

  function openAddFood(meal: MealType) {
    setSelectedMeal(meal);
    setFoodName('');
    setCalories('');
    setProtein('');
    setModalVisible(true);
  }

  function saveFood() {
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);

    if (!foodName.trim()) {
      Alert.alert('Food name required', 'Enter a food name.');
      return;
    }

    if (!calories.trim() || Number.isNaN(parsedCalories)) {
      Alert.alert('Calories required', 'Enter valid calories.');
      return;
    }

    if (!protein.trim() || Number.isNaN(parsedProtein)) {
      Alert.alert('Protein required', 'Enter valid protein.');
      return;
    }

    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: parsedCalories,
      protein: parsedProtein,
      meal: selectedMeal,
    };

    setFoods((currentFoods) => [...currentFoods, newFood]);
    setModalVisible(false);
  }

  function deleteFood(id: string) {
    Alert.alert(
      'Delete food?',
      'This food will be removed from today.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFoods((currentFoods) =>
              currentFoods.filter((food) => food.id !== id)
            );
          },
        },
      ]
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.brand}>PARKER FITNESS</Text>

        <Text style={styles.title}>Meals</Text>

        <Text style={styles.subtitle}>
          Track today's nutrition.
        </Text>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>CALORIES</Text>
            <Text style={styles.summaryValue}>
              {totalCalories}
            </Text>
          </View>

          <View>
            <Text style={styles.summaryLabel}>PROTEIN</Text>
            <Text style={styles.summaryValue}>
              {totalProtein}g
            </Text>
          </View>
        </View>

        {mealTypes.map((meal) => {
          const mealFoods = foods.filter(
            (food) => food.meal === meal
          );

          const mealCalories = mealFoods.reduce(
            (total, food) => total + food.calories,
            0
          );

          return (
            <View key={meal} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>{meal}</Text>

                <Text style={styles.mealCalories}>
                  {mealCalories} cal
                </Text>
              </View>

              {mealFoods.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nothing logged
                </Text>
              ) : (
                mealFoods.map((food) => (
                  <View key={food.id} style={styles.foodRow}>
                    <View style={styles.foodInformation}>
                      <Text style={styles.foodName}>
                        {food.name}
                      </Text>

                      <Text style={styles.foodDetails}>
                        {food.calories} cal • {food.protein}g protein
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => deleteFood(food.id)}
                      hitSlop={10}
                    >
                      <Text style={styles.deleteText}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}

              <Pressable
                style={styles.addButton}
                onPress={() => openAddFood(meal)}
              >
                <Text style={styles.addButtonText}>
                  + Add Food
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView
          style={styles.modalScreen}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>
            Add Food
          </Text>

          <Text style={styles.modalMeal}>
            {selectedMeal}
          </Text>

          <Text style={styles.inputLabel}>
            Food name
          </Text>

          <TextInput
            style={styles.input}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Example: Greek yogurt"
            placeholderTextColor="#9AA39E"
          />

          <Text style={styles.inputLabel}>
            Calories
          </Text>

          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="Example: 150"
            placeholderTextColor="#9AA39E"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>
            Protein (grams)
          </Text>

          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            placeholder="Example: 20"
            placeholderTextColor="#9AA39E"
            keyboardType="numeric"
          />

          <Pressable
            style={styles.saveButton}
            onPress={saveFood}
          >
            <Text style={styles.saveButtonText}>
              Save Food
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 120,
  },

  brand: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  title: {
    color: '#17211C',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },

  subtitle: {
    color: '#6D7972',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 24,
  },

  summaryCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  summaryLabel: {
    color: '#C8D6CE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  summaryValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 5,
  },

  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  mealTitle: {
    color: '#17211C',
    fontSize: 21,
    fontWeight: '900',
  },

  mealCalories: {
    color: '#2D6B48',
    fontSize: 14,
    fontWeight: '800',
  },

  emptyText: {
    color: '#87918C',
    fontSize: 14,
    marginVertical: 8,
  },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEA',
  },

  foodInformation: {
    flex: 1,
    paddingRight: 12,
  },

  foodName: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '800',
  },

  foodDetails: {
    color: '#77817C',
    fontSize: 13,
    marginTop: 4,
  },

  deleteText: {
    color: '#B84A4A',
    fontSize: 13,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: '#EDF4EF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },

  addButtonText: {
    color: '#2D6B48',
    fontSize: 15,
    fontWeight: '800',
  },

  modalScreen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  modalContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },

  modalTitle: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '900',
  },

  modalMeal: {
    color: '#2D6B48',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
    marginBottom: 28,
  },

  inputLabel: {
    color: '#17211C',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#17211C',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  saveButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 30,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  cancelButton: {
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },

  cancelButtonText: {
    color: '#6D7972',
    fontSize: 15,
    fontWeight: '700',
  },
});