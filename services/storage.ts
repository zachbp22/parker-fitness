import {
  getCurrentUserCloudProfile,
  supabase,
} from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
const FOOD_STORAGE_KEY = '@parker_fitness_foods';
const ACTIVE_PROFILE_KEY = '@parker_fitness_active_profile';
const WORKOUT_STORAGE_KEY = '@parker_fitness_workouts';
const WORKOUT_DRAFT_STORAGE_KEY =
  '@parker_fitness_workout_draft';
const PROFILE_STORAGE_KEY =
  '@parker_fitness_profiles';
const FAVORITE_FOODS_STORAGE_KEY =
  '@parker_fitness_favorite_foods';
const WATER_STORAGE_KEY =
  '@parker_fitness_water';
  const WEIGHT_STORAGE_KEY =
  '@parker_fitness_weight';
export type ProfileId = string;

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
 source?: 'manual' | 'usda' | 'barcode';
usdaFoodId?: string; 
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
  weightGoal?: number;
  cloudProfileId?: string;
};
export type StoredWater = {
  profileId: ProfileId;
  date: string;
  ounces: number;
};
export type StoredWeight = {
  profileId: ProfileId;
  date: string;
  weight: number;
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
export type StoredWorkoutDraft = {
  profileId: ProfileId;
  date: string;
  workoutName: string;
  workoutType: string;
  durationSeconds: number;
  exercises: StoredWorkoutExercise[];
  savedAt: string;
};
export const PROFILES: Record<string, Profile> = {
  zach: {
    id: 'zach',
    name: 'Zach',
    calorieGoal: 2000,
    proteinGoal: 160,
    weightGoal: 200,
    cloudProfileId: '44fb0eec-3ed6-434c-a80c-ea0f35456c69',
  },

  wife: {
    id: 'wife',
    name: 'Jodi',
    calorieGoal: 1600,
    proteinGoal: 120,
    weightGoal: 150,
    cloudProfileId: 'ed1a2c1f-0f4a-48cd-85a9-21e7b997e62b',
  },
};
export function getCloudProfileId(
  profileId: ProfileId
): string | undefined {
  return PROFILES[profileId]?.cloudProfileId;
}

export function getLocalProfileIdFromCloudProfileId(
  cloudProfileId: string
): ProfileId {
  const matchingProfile =
    Object.values(PROFILES).find(
      (profile) =>
        profile.cloudProfileId ===
        cloudProfileId
    );

  if (!matchingProfile) {
    throw new Error(
      `No local profile mapping found for cloud profile ${cloudProfileId}.`
    );
  }

  return matchingProfile.id;
}
export async function saveProfiles(
  profiles: Profile[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profiles)
    );
  } catch (error) {
    console.error(
      'Error saving profiles:',
      error
    );

    throw error;
  }
}

export async function loadProfiles(): Promise<Profile[]> {
  try {
    const savedProfiles =
      await AsyncStorage.getItem(
        PROFILE_STORAGE_KEY
      );

    if (savedProfiles) {
  const parsedProfiles =
    JSON.parse(savedProfiles) as Profile[];

  if (
    Array.isArray(parsedProfiles) &&
    parsedProfiles.length > 0
  ) {
    const migratedProfiles =
      parsedProfiles.map((profile) =>
        profile.id === 'wife' &&
        profile.name === 'Wife'
          ? {
              ...profile,
              name: 'Jodi',
            }
          : profile
      );

    const needsMigration =
      migratedProfiles.some(
        (profile, index) =>
          profile.name !==
          parsedProfiles[index].name
      );

    if (needsMigration) {
      await saveProfiles(
        migratedProfiles
      );
    }

    return migratedProfiles;
  }
}

    const legacyProfiles =
      Object.values(PROFILES);

    await saveProfiles(legacyProfiles);

    return legacyProfiles;
  } catch (error) {
    console.error(
      'Error loading profiles:',
      error
    );

    return Object.values(PROFILES);
  }
}

export async function getProfile(
  profileId: ProfileId
): Promise<Profile | null> {
  const profiles = await loadProfiles();

  return (
    profiles.find(
      (profile) => profile.id === profileId
    ) ?? null
  );
}
export async function addProfile(
  profile: Profile
): Promise<void> {
  const profiles = await loadProfiles();

  const profileExists = profiles.some(
    (existingProfile) =>
      existingProfile.id === profile.id
  );

  if (profileExists) {
    throw new Error(
      `Profile with id "${profile.id}" already exists.`
    );
  }

  await saveProfiles([
    ...profiles,
    profile,
  ]);
}
export async function updateProfile(
  updatedProfile: Profile
): Promise<void> {
  const profiles = await loadProfiles();

  const profileExists = profiles.some(
    (profile) =>
      profile.id === updatedProfile.id
  );

  if (!profileExists) {
    throw new Error(
      `Profile with id "${updatedProfile.id}" was not found.`
    );
  }

  const updatedProfiles = profiles.map(
    (profile) =>
      profile.id === updatedProfile.id
        ? updatedProfile
        : profile
  );

  await saveProfiles(updatedProfiles);
}
export async function deleteProfile(
  profileId: ProfileId
): Promise<void> {
  const profiles = await loadProfiles();

  if (profiles.length <= 1) {
    throw new Error(
      'At least one profile must remain.'
    );
  }

  const profileExists = profiles.some(
    (profile) => profile.id === profileId
  );

  if (!profileExists) {
    throw new Error(
      `Profile with id "${profileId}" was not found.`
    );
  }

  // Load all profile-specific data before deleting.
  const [
    water,
    weights,
    foods,
    favorites,
    workouts,
    workoutDraft,
  ] = await Promise.all([
    loadWater(),
    loadWeights(),
    loadFoods(),
    loadFavoriteFoods(),
    loadWorkouts(),
    loadWorkoutDraft(profileId),
  ]);

  // Keep only data belonging to other profiles.
  const remainingWater = water.filter(
    (entry) => entry.profileId !== profileId
  );

  const remainingWeights = weights.filter(
    (entry) => entry.profileId !== profileId
  );

const remainingFoods = (
  (foods ?? []) as StoredFood[]
).filter(
  (entry) => entry.profileId !== profileId
);

  const remainingFavorites = favorites.filter(
    (entry) => entry.profileId !== profileId
  );

  const remainingWorkouts = workouts.filter(
    (entry) => entry.profileId !== profileId
  );

  const remainingProfiles = profiles.filter(
    (profile) => profile.id !== profileId
  );

  // Save the cleaned data.
  await Promise.all([
    saveWater(remainingWater),
    saveWeights(remainingWeights),
    saveFoods(remainingFoods),
    saveFavoriteFoods(remainingFavorites),
    saveWorkouts(remainingWorkouts),
  ]);

// Clear only the deleted profile's workout draft.
if (workoutDraft) {
  await clearWorkoutDraft(profileId);
}

  await saveProfiles(remainingProfiles);

  const activeProfile =
    await loadActiveProfile();

  if (activeProfile === profileId) {
    await saveActiveProfile(
      remainingProfiles[0].id
    );
  }
}
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
 * WATER STORAGE
 * ============================================================
 */

export async function loadWater(): Promise<StoredWater[]> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(WATER_STORAGE_KEY);

    if (!jsonValue) {
      return [];
    }

    return JSON.parse(jsonValue) as StoredWater[];
  } catch (error) {
    console.error(
      'Unable to load water:',
      error
    );

    return [];
  }
}

export async function saveWater(
  water: StoredWater[]
): Promise<void> {
  try {
    const jsonValue = JSON.stringify(water);

    await AsyncStorage.setItem(
      WATER_STORAGE_KEY,
      jsonValue
    );
  } catch (error) {
    console.error(
      'Unable to save water:',
      error
    );

    throw error;
  }
}

export async function getWaterForDate(
  profileId: ProfileId,
  date: string
): Promise<number> {
  const water = await loadWater();

  const record = water.find(
    (item) =>
      item.profileId === profileId &&
      item.date === date
  );

  return record?.ounces ?? 0;
}

export async function setWaterForDate(
  profileId: ProfileId,
  date: string,
  ounces: number
): Promise<void> {
  const water = await loadWater();

  const safeOunces = Math.max(
    0,
    Math.round(ounces)
  );

  const existingIndex = water.findIndex(
    (item) =>
      item.profileId === profileId &&
      item.date === date
  );

  if (existingIndex >= 0) {
    water[existingIndex] = {
      ...water[existingIndex],
      ounces: safeOunces,
    };
  } else {
    water.push({
      profileId,
      date,
      ounces: safeOunces,
    });
  }

  await saveWater(water);
}
export async function syncWaterToCloud(
  date: string,
  ounces: number
): Promise<void> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const safeOunces = Math.max(
    0,
    Math.round(ounces)
  );

  const { error } = await supabase
    .from('water_entries')
    .upsert(
      {
        profile_id: cloudProfile.id,
        entry_date: date,
        ounces: safeOunces,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'profile_id,entry_date',
      }
    );

  if (error) {
    console.error(
      'Unable to sync water to cloud:',
      error
    );

    throw error;
  }
}
export async function loadWaterFromCloud(): Promise<
  StoredWater[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const { data, error } = await supabase
    .from('water_entries')
    .select(`
      entry_date,
      ounces
    `)
    .eq('profile_id', cloudProfile.id)
    .order('entry_date', {
      ascending: true,
    });

  if (error) {
    console.error(
      'Unable to load water from cloud:',
      error
    );

    throw error;
  }

  const localProfileId: ProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  return (data ?? []).map(
    (row): StoredWater => ({
      profileId: localProfileId,
      date: row.entry_date,
      ounces: Number(row.ounces),
    })
  );
}
export async function restoreWaterFromCloud(): Promise<
  StoredWater[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const localProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  const cloudWater =
    await loadWaterFromCloud();

  const localWater =
    await loadWater();

  const preservedOtherProfiles =
    localWater.filter(
      (entry) =>
        entry.profileId !== localProfileId
    );

  const mergedWater = [
    ...preservedOtherProfiles,
    ...cloudWater,
  ];

  await saveWater(mergedWater);

  return mergedWater;
}
export async function syncWeightToCloud(
  date: string,
  weight: number
): Promise<void> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const { error } = await supabase
    .from('weight_entries')
    .upsert(
      {
        profile_id: cloudProfile.id,
        entry_date: date,
        weight,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'profile_id,entry_date',
      }
    );

  if (error) {
    console.error(
      'Unable to sync weight to cloud:',
      error
    );

    throw error;
  }
}
/*
 * ============================================================
 * WEIGHT STORAGE
 * ============================================================
 */

export async function loadWeights(): Promise<StoredWeight[]> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        WEIGHT_STORAGE_KEY
      );

    if (!jsonValue) {
      return [];
    }

    return JSON.parse(
      jsonValue
    ) as StoredWeight[];
  } catch (error) {
    console.error(
      'Unable to load weights:',
      error
    );

    return [];
  }
}

export async function saveWeights(
  weights: StoredWeight[]
): Promise<void> {
  try {
    const jsonValue =
      JSON.stringify(weights);

    await AsyncStorage.setItem(
      WEIGHT_STORAGE_KEY,
      jsonValue
    );
  } catch (error) {
    console.error(
      'Unable to save weights:',
      error
    );

    throw error;
  }
}
export async function setWeightForDate(
  profileId: ProfileId,
  date: string,
  weight: number
): Promise<void> {
  const weights = await loadWeights();

  const existingIndex = weights.findIndex(
    (entry) =>
      entry.profileId === profileId &&
      entry.date === date
  );

  if (existingIndex >= 0) {
    weights[existingIndex] = {
      profileId,
      date,
      weight,
    };
  } else {
    weights.push({
      profileId,
      date,
      weight,
    });
  }

  await saveWeights(weights);
}
export async function deleteWeightForDate(
  profileId: ProfileId,
  date: string
): Promise<void> {
  const weights = await loadWeights();

  const updatedWeights = weights.filter(
    (entry) =>
      !(
        entry.profileId === profileId &&
        entry.date === date
      )
  );

  await saveWeights(updatedWeights);
}

export async function getWeightForDate(
  profileId: ProfileId,
  date: string
): Promise<number | null> {
  const weights = await loadWeights();

  const entry = weights.find(
    (item) =>
      item.profileId === profileId &&
      item.date === date
  );

  return entry?.weight ?? null;
}
export async function loadWeightsFromCloud(): Promise<StoredWeight[]> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const { data, error } = await supabase
    .from('weight_entries')
    .select('entry_date, weight')
    .eq('profile_id', cloudProfile.id)
    .order('entry_date', {
      ascending: true,
    });

  if (error) {
    console.error(
      'Unable to load weights from cloud:',
      error
    );

    throw error;
  }

  const localProfileId: ProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  return (data ?? []).map(
    (row): StoredWeight => ({
      profileId: localProfileId,
      date: row.entry_date,
      weight: Number(row.weight),
    })
  );
}

export async function restoreWeightsFromCloud(): Promise<
  StoredWeight[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const localProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  const cloudWeights =
    await loadWeightsFromCloud();

  const localWeights =
    await loadWeights();

  const preservedOtherProfiles =
    localWeights.filter(
      (entry) =>
        entry.profileId !== localProfileId
    );

  const mergedWeights = [
    ...preservedOtherProfiles,
    ...cloudWeights,
  ];

  await saveWeights(mergedWeights);

  return mergedWeights;
}
export async function loadWorkoutsFromCloud(): Promise<StoredWorkout[]> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      local_id,
      workout_date,
      completed_at,
      workout_name,
      workout_type,
      duration_seconds,
      completed_sets,
      total_sets,
      total_volume,
      exercises
    `)
    .eq('profile_id', cloudProfile.id)
    .order('completed_at', {
      ascending: false,
    });

  if (error) {
    console.error(
      'Unable to load workouts from cloud:',
      error
    );
    throw error;
  }

  const localProfileId: ProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  return (data ?? []).map(
    (row): StoredWorkout => ({
      id: row.local_id,
      profileId: localProfileId,
      date: row.workout_date,
      completedAt: row.completed_at,
      workoutName: row.workout_name,
      workoutType: row.workout_type,
      durationSeconds: Number(
        row.duration_seconds
      ),
      completedSets: Number(
        row.completed_sets
      ),
      totalSets: Number(
        row.total_sets
      ),
      totalVolume: Number(
        row.total_volume
      ),
      exercises: Array.isArray(
        row.exercises
      )
        ? row.exercises
        : [],
    })
  );
}

export async function restoreWorkoutsFromCloud(): Promise<
  StoredWorkout[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const localProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  const cloudWorkouts =
    await loadWorkoutsFromCloud();

  const localWorkouts =
    await loadWorkouts();

  const preservedOtherProfiles =
    localWorkouts.filter(
      (workout) =>
        workout.profileId !== localProfileId
    );

  const mergedWorkouts = [
    ...preservedOtherProfiles,
    ...cloudWorkouts,
  ];

  await saveWorkouts(mergedWorkouts);

  return mergedWorkouts;
}
export async function getLatestWeight(
  profileId: ProfileId
): Promise<StoredWeight | null> {
  const weights = await loadWeights();

  const profileWeights = weights
    .filter(
      (entry) =>
        entry.profileId === profileId
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date)
    );

  return profileWeights[0] ?? null;
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
      savedProfile &&
      savedProfile.trim().length > 0
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
export async function saveWorkoutDraft(
  draft: StoredWorkoutDraft
): Promise<void> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        WORKOUT_DRAFT_STORAGE_KEY
      );

    const drafts: Record<
      string,
      StoredWorkoutDraft
    > = jsonValue
      ? JSON.parse(jsonValue)
      : {};

    drafts[draft.profileId] = draft;

    await AsyncStorage.setItem(
      WORKOUT_DRAFT_STORAGE_KEY,
      JSON.stringify(drafts)
    );
  } catch (error) {
    console.error(
      'Error saving workout draft:',
      error
    );
    throw error;
  }
}

export async function loadWorkoutDraft(
  profileId?: ProfileId
): Promise<StoredWorkoutDraft | null> {
  try {
    const jsonValue =
      await AsyncStorage.getItem(
        WORKOUT_DRAFT_STORAGE_KEY
      );

    if (jsonValue === null) {
      return null;
    }

    const parsed = JSON.parse(jsonValue);

    // Support the old single-draft format during migration.
    if (
      parsed &&
      typeof parsed === 'object' &&
      'profileId' in parsed &&
      'exercises' in parsed
    ) {
      const legacyDraft =
        parsed as StoredWorkoutDraft;

      if (
        profileId &&
        legacyDraft.profileId !== profileId
      ) {
        return null;
      }

      await AsyncStorage.setItem(
        WORKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify({
          [legacyDraft.profileId]:
            legacyDraft,
        })
      );

      return legacyDraft;
    }

    const drafts = parsed as Record<
      string,
      StoredWorkoutDraft
    >;

    if (profileId) {
      return drafts[profileId] ?? null;
    }

    return (
      Object.values(drafts)[0] ?? null
    );
  } catch (error) {
    console.error(
      'Error loading workout draft:',
      error
    );
    throw error;
  }
}

export async function clearWorkoutDraft(
  profileId?: ProfileId
): Promise<void> {
  try {
    if (!profileId) {
      await AsyncStorage.removeItem(
        WORKOUT_DRAFT_STORAGE_KEY
      );
      return;
    }

    const jsonValue =
      await AsyncStorage.getItem(
        WORKOUT_DRAFT_STORAGE_KEY
      );

    if (jsonValue === null) {
      return;
    }

    const parsed = JSON.parse(jsonValue);

    // Handle an old single-draft record.
    if (
      parsed &&
      typeof parsed === 'object' &&
      'profileId' in parsed &&
      'exercises' in parsed
    ) {
      if (parsed.profileId === profileId) {
        await AsyncStorage.removeItem(
          WORKOUT_DRAFT_STORAGE_KEY
        );
      }

      return;
    }

    const drafts = parsed as Record<
      string,
      StoredWorkoutDraft
    >;

    delete drafts[profileId];

    if (Object.keys(drafts).length === 0) {
      await AsyncStorage.removeItem(
        WORKOUT_DRAFT_STORAGE_KEY
      );
    } else {
      await AsyncStorage.setItem(
        WORKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify(drafts)
      );
    }
  } catch (error) {
    console.error(
      'Error clearing workout draft:',
      error
    );
    throw error;
  }
}
export async function syncFoodToCloud(
  food: StoredFood
): Promise<void> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile found for the signed-in user.'
    );
  }

  const localProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  if (food.profileId !== localProfileId) {
    throw new Error(
      `Refusing to sync food for profile ${food.profileId ?? 'unknown'} while signed in as ${localProfileId}.`
    );
  }

  const entryDate =
    food.date ?? getTodayDate();

  const { error } = await supabase
    .from('food_entries')
    .upsert(
      {
        profile_id: cloudProfile.id,
        local_id: food.id,
        entry_date: entryDate,
        meal: food.meal,
        name: food.name,
        serving_size: food.servingSize,
        serving_unit: food.servingUnit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        source: food.source ?? null,
        usda_food_id:
          food.usdaFoodId ?? null,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'profile_id,local_id',
      }
    );

  if (error) {
    console.error(
      'Unable to sync food to cloud:',
      error
    );

    throw error;
  }
}
export async function deleteFoodFromCloud(
  localId: string
): Promise<void> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('profile_id', cloudProfile.id)
    .eq('local_id', localId);

  if (error) {
    console.error(
      'Unable to delete food from cloud:',
      error
    );

    throw error;
  }
}
export async function syncWorkoutToCloud(
  workout: StoredWorkout
): Promise<void> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const { error } = await supabase
    .from('workouts')
    .upsert(
      {
        profile_id: cloudProfile.id,
        local_id: workout.id,
        workout_date: workout.date,
        completed_at: workout.completedAt,
        workout_name: workout.workoutName,
        workout_type: workout.workoutType,
        duration_seconds:
          workout.durationSeconds,
        completed_sets:
          workout.completedSets,
        total_sets: workout.totalSets,
        total_volume: workout.totalVolume,
        exercises: workout.exercises,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'profile_id,local_id',
      }
    );

  if (error) {
    console.error(
      'Unable to sync workout to cloud:',
      error
    );

    throw error;
  }
}
   export async function loadFoodsFromCloud(): Promise<
  StoredFood[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const { data, error } = await supabase
    .from('food_entries')
    .select(
      `
        local_id,
        entry_date,
        meal,
        name,
        serving_size,
        serving_unit,
        calories,
        protein,
        carbs,
        fat,
        source,
        usda_food_id
      `
    )
    .eq('profile_id', cloudProfile.id)
    .order('entry_date', {
      ascending: true,
    });

  if (error) {
    console.error(
      'Unable to load foods from cloud:',
      error
    );

    throw error;
  }

  return (data ?? []).map(
    (row): StoredFood => ({
      id: row.local_id,
      name: row.name,
      servingSize: row.serving_size,
      servingUnit: row.serving_unit,
      calories: Number(row.calories),
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fat: Number(row.fat),
      meal: row.meal,
      date: row.entry_date,

      // The signed-in cloud profile corresponds
      // to this device's active local profile.
      profileId:
        getLocalProfileIdFromCloudProfileId(
          cloudProfile.id
        ),

      source:
        row.source === 'manual' ||
        row.source === 'usda' ||
        row.source === 'barcode'
          ? row.source
          : undefined,

      usdaFoodId:
        row.usda_food_id ?? undefined,
    })
  );
}
export async function restoreFoodsFromCloud(): Promise<
  StoredFood[]
> {
  const cloudProfile =
    await getCurrentUserCloudProfile();

  if (!cloudProfile) {
    throw new Error(
      'No cloud profile is linked to the signed-in user.'
    );
  }

  const localProfileId =
    getLocalProfileIdFromCloudProfileId(
      cloudProfile.id
    );

  const cloudFoods =
    await loadFoodsFromCloud();

  const localFoods =
    (await loadFoods<StoredFood>()) ?? [];

  const preservedOtherProfiles =
    localFoods.filter(
      (food) =>
        food.profileId !== localProfileId
    );

  const mergedFoods = [
    ...preservedOtherProfiles,
    ...cloudFoods,
  ];

  await saveFoods(mergedFoods);

  return mergedFoods;
}
