import AsyncStorage from '@react-native-async-storage/async-storage';

const FOOD_STORAGE_KEY = '@parker_fitness_foods';

export async function saveFoods<T>(foods: T[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(foods);
    await AsyncStorage.setItem(FOOD_STORAGE_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving foods:', error);
    throw error;
  }
}

export async function loadFoods<T>(): Promise<T[] | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(FOOD_STORAGE_KEY);

    if (jsonValue === null) {
      return null;
    }

    return JSON.parse(jsonValue) as T[];
  } catch (error) {
    console.error('Error loading foods:', error);
    throw error;
  }
}

export async function clearFoods(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FOOD_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing foods:', error);
    throw error;
  }
}