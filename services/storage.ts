import AsyncStorage from '@react-native-async-storage/async-storage';

const FOOD_STORAGE_KEY = '@parker_fitness_foods';
const ACTIVE_PROFILE_KEY = '@parker_fitness_active_profile';
const WORKOUT_STORAGE_KEY = '@parker_fitness_workouts';
const FAVORITE_FOODS_STORAGE_KEY =
  '@parker_fitness_favorite_foods';

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

export type FavoriteFood = {
  id: string;
  profileId: ProfileId;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
 source?: 'manual' | 'usda' | 'barcode';
  usdaFoodId?: string;
};

export type Profile = {
  id: ProfileId;
  name: string;
  calorieGoal: number;
  proteinGoal: number;
};

export type StoredWorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};

export type StoredWorkoutExercise = {
  id: number;
  name: string;
  muscle: string;
  sets: StoredWorkoutSet[];
};

export type StoredWorkout = {
  id: string;
  profileId: ProfileId;
  date: string;
  completedAt: string;
  workoutName: string;
  workoutType: string;
  durationSeconds: number;
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  exercises: StoredWorkoutExercise[];
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

/*
 * ============================================================
 * FOOD STORAGE
 * ============================================================
 */

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
    console.error(
      'Error saving foods:',
      error
    );

    throw error;
  }
}

export async function loadFoods<T>(): Promise<
  T[] | null
> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        FOOD_STORAGE_KEY
      );

    if (jsonValue === null) {
      return null;
    }

    return JSON.parse(jsonValue) as T[];
  } catch (error) {
    console.error(
      'Error loading foods:',
      error
    );

    throw error;
  }
}

export async function loadFoodsForDate<
  T extends {
    date?: string;
  },
>(date: string): Promise<T[]> {
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
  },
>(profileId: ProfileId): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    return foods.filter(
      (food) =>
        food.profileId === profileId
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
  },
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
  },
>(): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    const today = getTodayDate();

    let changed = false;

    const updatedFoods = foods.map(
      (food) => {
        if (food.date) {
          return food;
        }

        changed = true;

        return {
          ...food,
          date: today,
        };
      }
    );

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
  },
>(): Promise<T[]> {
  try {
    const foods = await loadFoods<T>();

    if (!foods) {
      return [];
    }

    let changed = false;

    const updatedFoods = foods.map(
      (food) => {
        if (food.profileId) {
          return food;
        }

        changed = true;

        return {
          ...food,
          profileId: 'zach' as ProfileId,
        };
      }
    );

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

export async function clearFoods(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      FOOD_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      'Error clearing foods:',
      error
    );

    throw error;
  }
}

/*
 * ============================================================
 * FAVORITE FOOD STORAGE
 * ============================================================
 */

export async function saveFavoriteFoods(
  favorites: FavoriteFood[]
): Promise<void> {
  try {
    const jsonValue =
      JSON.stringify(favorites);

    await AsyncStorage.setItem(
      FAVORITE_FOODS_STORAGE_KEY,
      jsonValue
    );
  } catch (error) {
    console.error(
      'Error saving favorite foods:',
      error
    );

    throw error;
  }
}

export async function loadFavoriteFoods(): Promise<
  FavoriteFood[]
> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        FAVORITE_FOODS_STORAGE_KEY
      );

    if (jsonValue === null) {
      return [];
    }

    return JSON.parse(
      jsonValue
    ) as FavoriteFood[];
  } catch (error) {
    console.error(
      'Error loading favorite foods:',
      error
    );

    return [];
  }
}

export async function loadFavoriteFoodsForProfile(
  profileId: ProfileId
): Promise<FavoriteFood[]> {
  try {
    const favorites =
      await loadFavoriteFoods();

    return favorites.filter(
      (favorite) =>
        favorite.profileId === profileId
    );
  } catch (error) {
    console.error(
      'Error loading favorite foods for profile:',
      error
    );

    return [];
  }
}

export async function addFavoriteFood(
  favorite: FavoriteFood
): Promise<void> {
  try {
    const favorites =
      await loadFavoriteFoods();

    const alreadyExists =
      favorites.some(
        (item) =>
          item.profileId ===
            favorite.profileId &&
          favoriteFoodKey(item) ===
            favoriteFoodKey(favorite)
      );

    if (alreadyExists) {
      return;
    }

    await saveFavoriteFoods([
      favorite,
      ...favorites,
    ]);
  } catch (error) {
    console.error(
      'Error adding favorite food:',
      error
    );

    throw error;
  }
}

export async function removeFavoriteFood(
  favoriteId: string
): Promise<void> {
  try {
    const favorites =
      await loadFavoriteFoods();

    const updatedFavorites =
      favorites.filter(
        (favorite) =>
          favorite.id !== favoriteId
      );

    await saveFavoriteFoods(
      updatedFavorites
    );
  } catch (error) {
    console.error(
      'Error removing favorite food:',
      error
    );

    throw error;
  }
}

export async function clearFavoriteFoods(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      FAVORITE_FOODS_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      'Error clearing favorite foods:',
      error
    );

    throw error;
  }
}

function favoriteFoodKey(
  food: Pick<
    FavoriteFood,
    | 'name'
    | 'servingSize'
    | 'servingUnit'
    | 'usdaFoodId'
  >
): string {
  return [
    food.usdaFoodId ?? '',
    food.name.trim().toLowerCase(),
    food.servingSize
      .trim()
      .toLowerCase(),
    food.servingUnit
      .trim()
      .toLowerCase(),
  ].join('|');
}

/*
 * ============================================================
 * ACTIVE PROFILE STORAGE
 * ============================================================
 */

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

/*
 * ============================================================
 * WORKOUT STORAGE
 * ============================================================
 */

export async function saveWorkouts(
  workouts: StoredWorkout[]
): Promise<void> {
  try {
    const jsonValue =
      JSON.stringify(workouts);

    await AsyncStorage.setItem(
      WORKOUT_STORAGE_KEY,
      jsonValue
    );
  } catch (error) {
    console.error(
      'Error saving workouts:',
      error
    );

    throw error;
  }
}

export async function loadWorkouts(): Promise<
  StoredWorkout[]
> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        WORKOUT_STORAGE_KEY
      );

    if (jsonValue === null) {
      return [];
    }

    return JSON.parse(
      jsonValue
    ) as StoredWorkout[];
  } catch (error) {
    console.error(
      'Error loading workouts:',
      error
    );

    throw error;
  }
}

export async function addWorkout(
  workout: StoredWorkout
): Promise<void> {
  try {
    const workouts =
      await loadWorkouts();

    const updatedWorkouts = [
      workout,
      ...workouts,
    ];

    await saveWorkouts(
      updatedWorkouts
    );
  } catch (error) {
    console.error(
      'Error adding workout:',
      error
    );

    throw error;
  }
}

export async function loadWorkoutsForProfile(
  profileId: ProfileId
): Promise<StoredWorkout[]> {
  try {
    const workouts =
      await loadWorkouts();

    return workouts.filter(
      (workout) =>
        workout.profileId === profileId
    );
  } catch (error) {
    console.error(
      'Error loading workouts for profile:',
      error
    );

    throw error;
  }
}

export async function loadWorkoutsForProfileAndDate(
  profileId: ProfileId,
  date: string
): Promise<StoredWorkout[]> {
  try {
    const workouts =
      await loadWorkouts();

    return workouts.filter(
      (workout) =>
        workout.profileId === profileId &&
        workout.date === date
    );
  } catch (error) {
    console.error(
      'Error loading workouts for profile and date:',
      error
    );

    throw error;
  }
}

export async function loadLatestWorkoutForProfile(
  profileId: ProfileId
): Promise<StoredWorkout | null> {
  try {
    const workouts =
      await loadWorkoutsForProfile(
        profileId
      );

    if (workouts.length === 0) {
      return null;
    }

    const sortedWorkouts = [
      ...workouts,
    ].sort(
      (a, b) =>
        new Date(
          b.completedAt
        ).getTime() -
        new Date(
          a.completedAt
        ).getTime()
    );

    return sortedWorkouts[0];
  } catch (error) {
    console.error(
      'Error loading latest workout:',
      error
    );

    throw error;
  }
}

export async function deleteWorkout(
  workoutId: string
): Promise<void> {
  try {
    const workouts =
      await loadWorkouts();

    const updatedWorkouts =
      workouts.filter(
        (workout) =>
          workout.id !== workoutId
      );

    await saveWorkouts(
      updatedWorkouts
    );
  } catch (error) {
    console.error(
      'Error deleting workout:',
      error
    );

    throw error;
  }
}

export async function clearWorkouts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      WORKOUT_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      'Error clearing workouts:',
      error
    );

    throw error;
  }
}
export async function loadLastExercisePerformance(
  profileId: ProfileId,
  exerciseName: string
): Promise<StoredWorkoutExercise | null> {
  try {
    const workouts =
      await loadWorkoutsForProfile(
        profileId
      );

    const sortedWorkouts = [
      ...workouts,
    ].sort(
      (a, b) =>
        new Date(
          b.completedAt
        ).getTime() -
        new Date(
          a.completedAt
        ).getTime()
    );

    for (const workout of sortedWorkouts) {
      const exercise =
        workout.exercises.find(
          (item) =>
            item.name === exerciseName &&
            item.sets.some(
              (set) => set.completed
            )
        );

      if (exercise) {
        return exercise;
      }
    }

    return null;
  } catch (error) {
    console.error(
      'Error loading last exercise performance:',
      error
    );

    throw error;
  }
}