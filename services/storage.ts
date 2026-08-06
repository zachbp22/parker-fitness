import AsyncStorage from '@react-native-async-storage/async-storage';

const FOOD_STORAGE_KEY = '@parker_fitness_foods';
const ACTIVE_PROFILE_KEY = '@parker_fitness_active_profile';

export type ProfileId = 'zach' | 'wife';

export type StoredFood = {
  id: string;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: string;
  date?: string;
  profileId?: ProfileId;
};

export type Profile = {
  id: ProfileId;
  name: string;
  calorieGoal: number;
  proteinGoal: number;
};

export const PROFILES: Record<ProfileId, Profile> = {
  zach: {
    id: 'zach',
    name: 'Zach',
    calorieGoal: 2000,
    proteinGoal: 160,
  },

  wife: {
    id: 'wife',
    name: 'Wife',
    calorieGoal: 1600,
    proteinGoal: 120,
  },
};

export function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    today.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function saveFoods<T>(
  foods: T[]
): Promise<void> {
  try {
    const jsonValue = JSON.stringify(foods);

    await AsyncStorage.setItem(
      FOOD_STORAGE_KEY,
      jsonValue
    );
  } catch (error) {
    console.error('Error saving foods:', error);
    throw error;
  }
}

export async function loadFoods<T>(): Promise<T[] | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(
      FOOD_STORAGE_KEY
    );

    if (jsonValue === null) {
      return null;
    }

    return JSON.parse(jsonValue) as T[];
  } catch (error) {
    console.error('Error loading foods:', error);
    throw error;
  }
}

export async function loadFoodsForDate<
  T extends {
    date?: string;
  }
>(
  date: string
): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    return foods.filter(
      (food) => food.date === date
    );
  } catch (error) {
    console.error(
      'Error loading foods for date:',
      error
    );

    throw error;
  }
}

export async function loadFoodsForProfile<
  T extends {
    profileId?: ProfileId;
  }
>(
  profileId: ProfileId
): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    return foods.filter(
      (food) => food.profileId === profileId
    );
  } catch (error) {
    console.error(
      'Error loading foods for profile:',
      error
    );

    throw error;
  }
}

export async function loadFoodsForProfileAndDate<
  T extends {
    profileId?: ProfileId;
    date?: string;
  }
>(
  profileId: ProfileId,
  date: string
): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    return foods.filter(
      (food) =>
        food.profileId === profileId &&
        food.date === date
    );
  } catch (error) {
    console.error(
      'Error loading foods for profile and date:',
      error
    );

    throw error;
  }
}

export async function addDateToExistingFoods<
  T extends {
    date?: string;
  }
>(): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    const today = getTodayDate();

    let changed = false;

    const updatedFoods = foods.map((food) => {
      if (food.date) {
        return food;
      }

      changed = true;

      return {
        ...food,
        date: today,
      };
    });

    if (changed) {
      await saveFoods(updatedFoods);
    }

    return updatedFoods;
  } catch (error) {
    console.error(
      'Error migrating existing food dates:',
      error
    );

    throw error;
  }
}

export async function addProfileToExistingFoods<
  T extends {
    profileId?: ProfileId;
  }
>(): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    let changed = false;

    const updatedFoods = foods.map((food) => {
      if (food.profileId) {
        return food;
      }

      changed = true;

      return {
        ...food,
        profileId: 'zach' as ProfileId,
      };
    });

    if (changed) {
      await saveFoods(updatedFoods);
    }

    return updatedFoods;
  } catch (error) {
    console.error(
      'Error migrating existing food profiles:',
      error
    );

    throw error;
  }
}

export async function migrateExistingFoods(): Promise<void> {
  try {
    await addDateToExistingFoods();
    await addProfileToExistingFoods();
  } catch (error) {
    console.error(
      'Error migrating existing foods:',
      error
    );

    throw error;
  }
}

export async function saveActiveProfile(
  profileId: ProfileId
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ACTIVE_PROFILE_KEY,
      profileId
    );
  } catch (error) {
    console.error(
      'Error saving active profile:',
      error
    );

    throw error;
  }
}

export async function loadActiveProfile(): Promise<ProfileId> {
  try {
    const savedProfile =
      await AsyncStorage.getItem(
        ACTIVE_PROFILE_KEY
      );

    if (
      savedProfile === 'zach' ||
      savedProfile === 'wife'
    ) {
      return savedProfile;
    }

    return 'zach';
  } catch (error) {
    console.error(
      'Error loading active profile:',
      error
    );

    return 'zach';
  }
}

export async function clearFoods(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      FOOD_STORAGE_KEY
    );
  } catch (error) {
    console.error('Error clearing foods:', error);
    throw error;
  }
}
