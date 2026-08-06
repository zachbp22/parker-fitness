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
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: MealType;
};

const mealTypes: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

const startingFoods: FoodItem[] = [
  {
    id: '1',
    name: 'Protein Shake',
    servingSize: '1',
    servingUnit: 'bottle',
    calories: 220,
    protein: 30,
    carbs: 8,
    fat: 4,
    meal: 'Breakfast',
  },
  {
    id: '2',
    name: 'Chicken Rice Bowl',
    servingSize: '1',
    servingUnit: 'bowl',
    calories: 510,
    protein: 45,
    carbs: 55,
    fat: 14,
    meal: 'Lunch',
  },
];

export default function MealsScreen() {
  const [foods, setFoods] = useState<FoodItem[]>(startingFoods);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] =
    useState<MealType>('Breakfast');

  const [editingFoodId, setEditingFoodId] =
    useState<string | null>(null);

  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [servingUnit, setServingUnit] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const totalCalories = foods.reduce(
    (total, food) => total + food.calories,
    0
  );

  const totalProtein = foods.reduce(
    (total, food) => total + food.protein,
    0
  );

  const totalCarbs = foods.reduce(
    (total, food) => total + food.carbs,
    0
  );

  const totalFat = foods.reduce(
    (total, food) => total + food.fat,
    0
  );

  function resetForm() {
    setFoodName('');
    setServingSize('');
    setServingUnit('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setEditingFoodId(null);
  }

  function openAddFood(meal: MealType) {
    resetForm();
    setSelectedMeal(meal);
    setModalVisible(true);
  }

  function openEditFood(food: FoodItem) {
    setEditingFoodId(food.id);
    setSelectedMeal(food.meal);

    setFoodName(food.name);
    setServingSize(food.servingSize);
    setServingUnit(food.servingUnit);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());

    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    resetForm();
  }

  function saveFood() {
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFat = Number(fat);

    if (!foodName.trim()) {
      Alert.alert('Food name required', 'Enter a food name.');
      return;
    }

    if (!servingSize.trim()) {
      Alert.alert(
        'Serving size required',
        'Enter a serving size.'
      );
      return;
    }

    if (!servingUnit.trim()) {
      Alert.alert(
        'Serving unit required',
        'Enter a serving unit.'
      );
      return;
    }

    if (
      !calories.trim() ||
      Number.isNaN(parsedCalories) ||
      parsedCalories < 0
    ) {
      Alert.alert(
        'Invalid calories',
        'Enter valid calories.'
      );
      return;
    }

    if (
      !protein.trim() ||
      Number.isNaN(parsedProtein) ||
      parsedProtein < 0
    ) {
      Alert.alert(
        'Invalid protein',
        'Enter valid protein.'
      );
      return;
    }

    if (
      !carbs.trim() ||
      Number.isNaN(parsedCarbs) ||
      parsedCarbs < 0
    ) {
      Alert.alert(
        'Invalid carbs',
        'Enter valid carbohydrates.'
      );
      return;
    }

    if (
      !fat.trim() ||
      Number.isNaN(parsedFat) ||
      parsedFat < 0
    ) {
      Alert.alert(
        'Invalid fat',
        'Enter valid fat.'
      );
      return;
    }

    const foodData: FoodItem = {
      id: editingFoodId ?? Date.now().toString(),
      name: foodName.trim(),
      servingSize: servingSize.trim(),
      servingUnit: servingUnit.trim(),
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fat: parsedFat,
      meal: selectedMeal,
    };

    if (editingFoodId) {
      setFoods((currentFoods) =>
        currentFoods.map((food) =>
          food.id === editingFoodId ? foodData : food
        )
      );
    } else {
      setFoods((currentFoods) => [
        ...currentFoods,
        foodData,
      ]);
    }

    closeModal();
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
              currentFoods.filter(
                (food) => food.id !== id
              )
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

        <View style={styles.calorieCard}>
          <Text style={styles.summaryLabel}>
            CALORIES LOGGED
          </Text>

          <Text style={styles.calorieValue}>
            {totalCalories}
          </Text>
        </View>

        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            value={`${totalProtein}g`}
          />

          <MacroCard
            label="Carbs"
            value={`${totalCarbs}g`}
          />

          <MacroCard
            label="Fat"
            value={`${totalFat}g`}
          />
        </View>

        {mealTypes.map((meal) => {
          const mealFoods = foods.filter(
            (food) => food.meal === meal
          );

          const mealCalories = mealFoods.reduce(
            (total, food) =>
              total + food.calories,
            0
          );

          return (
            <View key={meal} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>
                  {meal}
                </Text>

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
                  <View
                    key={food.id}
                    style={styles.foodRow}
                  >
                    <View
                      style={styles.foodInformation}
                    >
                      <Text style={styles.foodName}>
                        {food.name}
                      </Text>

                      <Text
                        style={styles.servingText}
                      >
                        {food.servingSize}{' '}
                        {food.servingUnit}
                      </Text>

                      <Text
                        style={styles.foodDetails}
                      >
                        {food.calories} cal •{' '}
                        {food.protein}g protein •{' '}
                        {food.carbs}g carbs •{' '}
                        {food.fat}g fat
                      </Text>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() =>
                          openEditFood(food)
                        }
                        hitSlop={8}
                      >
                        <Text style={styles.editText}>
                          Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          deleteFood(food.id)
                        }
                        hitSlop={8}
                      >
                        <Text
                          style={styles.deleteText}
                        >
                          Delete
                        </Text>
                      </Pressable>
                    </View>
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
        onRequestClose={closeModal}
      >
        <ScrollView
          style={styles.modalScreen}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>
            {editingFoodId
              ? 'Edit Food'
              : 'Add Food'}
          </Text>

          <Text style={styles.modalMeal}>
            {selectedMeal}
          </Text>

          <FormInput
            label="Food name"
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Example: Greek yogurt"
          />

          <FormInput
            label="Serving size"
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="Example: 1"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Serving unit"
            value={servingUnit}
            onChangeText={setServingUnit}
            placeholder="Example: cup, oz, bottle"
          />

          <FormInput
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            placeholder="Example: 150"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Protein (g)"
            value={protein}
            onChangeText={setProtein}
            placeholder="Example: 20"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Carbs (g)"
            value={carbs}
            onChangeText={setCarbs}
            placeholder="Example: 12"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Fat (g)"
            value={fat}
            onChangeText={setFat}
            placeholder="Example: 4"
            keyboardType="decimal-pad"
          />

          <Pressable
            style={styles.saveButton}
            onPress={saveFood}
          >
            <Text style={styles.saveButtonText}>
              {editingFoodId
                ? 'Save Changes'
                : 'Save Food'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={closeModal}
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

type MacroCardProps = {
  label: string;
  value: string;
};

function MacroCard({
  label,
  value,
}: MacroCardProps) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>
        {label}
      </Text>

      <Text style={styles.macroValue}>
        {value}
      </Text>
    </View>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'decimal-pad'
    | 'numeric';
};

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: FormInputProps) {
  return (
    <>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA39E"
        keyboardType={keyboardType}
      />
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

  calorieCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 24,
    padding: 22,
    marginBottom: 12,
  },

  summaryLabel: {
    color: '#C8D6CE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  calorieValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },

  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },

  macroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },

  macroLabel: {
    color: '#6D7972',
    fontSize: 12,
    fontWeight: '700',
  },

  macroValue: {
    color: '#17211C',
    fontSize: 20,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEA',
  },

  foodInformation: {
    paddingRight: 8,
  },

  foodName: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '800',
  },

  servingText: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  foodDetails: {
    color: '#77817C',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },

  editText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
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
    marginBottom: 18,
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