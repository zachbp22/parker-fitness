import {
  getCurrentUserCloudProfile,
} from '@/services/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  FoodSearchResult,
  searchFoods,
} from '@/services/foodApi';

import {
  addDateToExistingFoods,
  addProfileToExistingFoods,
  deleteFoodFromCloud,
  getProfile,
  getTodayDate,
  loadActiveProfile,
  loadFavoriteFoods,
  loadFoods,
  loadProfiles as loadStoredProfiles,
  saveActiveProfile,
  saveFavoriteFoods,
  saveFoods,
  syncFoodToCloud,
  type FavoriteFood,
  type Profile,
  type ProfileId
} from '@/services/storage';

type MealType =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks';

type ServingChoice = 'g' | 'oz' | 'serving';

type EntryMode =
  | 'recent'
  | 'favorites'
  | 'search'
  | 'manual';

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
  date?: string;
  profileId?: ProfileId;
  source?: 'manual' | 'usda' | 'barcode';
  usdaFoodId?: string;
};

const mealTypes: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

const OUNCES_TO_GRAMS = 28.3495;

export default function MealsScreen() {
  const routeParams = useLocalSearchParams<{
    scannedBarcode?: string;
    scannedName?: string;
    scannedBrand?: string;
    scannedServingSize?: string;
    scannedServingUnit?: string;
    scannedCalories?: string;
    scannedProtein?: string;
    scannedCarbs?: string;
    scannedFat?: string;
    scannedMeal?: string;
    scannedDate?: string;
    scannedProfile?: string;
  }>();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [storageLoaded, setStorageLoaded] =
    useState(false);
  const [favoritesLoaded, setFavoritesLoaded] =
    useState(false);

const [activeProfile, setActiveProfile] =
  useState<ProfileId>('zach');

const [profiles, setProfiles] =
  useState<Profile[]>([]);

const [currentProfile, setCurrentProfile] =
  useState<Profile>({
    id: 'loading',
    name: 'User',
    calorieGoal: 0,
    proteinGoal: 0,
    cloudProfileId: undefined,
  });
  const [
  signedInCloudProfileId,
  setSignedInCloudProfileId,
] = useState<string | null>(null);
useEffect(() => {
  async function loadSignedInCloudProfile() {
    try {
      const cloudProfile =
        await getCurrentUserCloudProfile();

      setSignedInCloudProfileId(
        cloudProfile?.id ?? null
      );
    } catch (error) {
      console.error(
        'Unable to load signed-in cloud profile:',
        error
      );

      setSignedInCloudProfileId(null);
    }
  }

  loadSignedInCloudProfile();
}, []);

useEffect(() => {
  async function loadCurrentProfile() {
    const profile =
      await getProfile(activeProfile);

    if (profile) {
      setCurrentProfile(profile);
    }
  }

  loadCurrentProfile();
}, [activeProfile]);

const isSignedInProfile =
  currentProfile.cloudProfileId ===
  signedInCloudProfileId;

const [selectedDate, setSelectedDate] = useState(
  getTodayDate()
);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [selectedMeal, setSelectedMeal] =
    useState<MealType>('Breakfast');

  const [editingFoodId, setEditingFoodId] =
    useState<string | null>(null);

  const [entryMode, setEntryMode] =
    useState<EntryMode>('recent');

  /*
   * USDA search state
   */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    FoodSearchResult[]
  >([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [searchError, setSearchError] = useState('');

  const [selectedSearchFood, setSelectedSearchFood] =
    useState<FoodSearchResult | null>(null);

  const [selectedAmount, setSelectedAmount] =
    useState('100');

  const [selectedServingChoice, setSelectedServingChoice] =
    useState<ServingChoice>('g');

  /*
   * Manual food form state
   */
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [servingUnit, setServingUnit] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [manualSource, setManualSource] = useState<'manual' | 'usda' | 'barcode'>('manual');

  useEffect(() => {
    async function restoreData() {
      try {
        await addDateToExistingFoods<FoodItem>();
        await addProfileToExistingFoods<FoodItem>();

   const savedFoods =
  await loadFoods<FoodItem>();

const savedProfile =
  await loadActiveProfile();

const savedProfiles =
  await loadStoredProfiles();

const savedFavorites =
  await loadFavoriteFoods();

setProfiles(savedProfiles);

if (savedFoods !== null) {
  setFoods(savedFoods);
}

        setActiveProfile(savedProfile);
        setFavorites(savedFavorites);
      } catch (error) {
        console.error(
          'Unable to restore meal data:',
          error
        );
      } finally {
        setStorageLoaded(true);
        setFavoritesLoaded(true);
      }
    }

    restoreData();
  }, []);

  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    async function persistFoods() {
      try {
        await saveFoods(foods);
      } catch (error) {
        console.error(
          'Unable to save foods:',
          error
        );
      }
    }

    persistFoods();
  }, [foods, storageLoaded]);

  useEffect(() => {
    if (!favoritesLoaded) {
      return;
    }

    async function persistFavorites() {
      try {
        await saveFavoriteFoods(favorites);
      } catch (error) {
        console.error(
          'Unable to save favorite foods:',
          error
        );
      }
    }

    persistFavorites();
  }, [favorites, favoritesLoaded]);

  useEffect(() => {
    if (!routeParams.scannedBarcode || !routeParams.scannedName) {
      return;
    }

    const scannedMeal = mealTypes.includes(
      routeParams.scannedMeal as MealType
    )
      ? (routeParams.scannedMeal as MealType)
      : 'Breakfast';

    const scannedProfile =
      routeParams.scannedProfile === 'wife'
        ? 'wife'
        : 'zach';

    setActiveProfile(scannedProfile);
    setSelectedMeal(scannedMeal);
    setSelectedDate(
      routeParams.scannedDate ?? getTodayDate()
    );

    setEditingFoodId(null);
    setFoodName(routeParams.scannedName);
    setServingSize(
      routeParams.scannedServingSize ?? '100'
    );
    setServingUnit(
      routeParams.scannedServingUnit ?? 'g'
    );
    setCalories(routeParams.scannedCalories ?? '0');
    setProtein(routeParams.scannedProtein ?? '0');
    setCarbs(routeParams.scannedCarbs ?? '0');
    setFat(routeParams.scannedFat ?? '0');
    setManualSource('barcode');
    setEntryMode('manual');
    setModalVisible(true);

    router.setParams({
      scannedBarcode: undefined,
      scannedName: undefined,
      scannedBrand: undefined,
      scannedServingSize: undefined,
      scannedServingUnit: undefined,
      scannedCalories: undefined,
      scannedProtein: undefined,
      scannedCarbs: undefined,
      scannedFat: undefined,
      scannedMeal: undefined,
      scannedDate: undefined,
      scannedProfile: undefined,
    });
  }, [
    routeParams.scannedBarcode,
    routeParams.scannedName,
  ]);

  const selectedDateFoods = useMemo(() => {
    return foods.filter(
      (food) =>
        food.date === selectedDate &&
        food.profileId === activeProfile
    );
  }, [foods, selectedDate, activeProfile]);

  const totalCalories = Math.round(
    selectedDateFoods.reduce(
      (total, food) => total + food.calories,
      0
    )
  );

  const totalProtein = roundMacro(
    selectedDateFoods.reduce(
      (total, food) => total + food.protein,
      0
    )
  );

  const totalCarbs = roundMacro(
    selectedDateFoods.reduce(
      (total, food) => total + food.carbs,
      0
    )
  );

  const totalFat = roundMacro(
    selectedDateFoods.reduce(
      (total, food) => total + food.fat,
      0
    )
  );

  const isToday =
    selectedDate === getTodayDate();


  const profileFavorites = useMemo(
    () =>
      favorites.filter(
        (favorite) =>
          favorite.profileId === activeProfile
      ),
    [favorites, activeProfile]
  );

  const recentFoods = useMemo(() => {
    const seen = new Set<string>();
    const recent: FoodItem[] = [];

    [...foods]
      .reverse()
      .filter(
        (food) => food.profileId === activeProfile
      )
      .forEach((food) => {
        const key = reusableFoodKey(food);

        if (!seen.has(key) && recent.length < 10) {
          seen.add(key);
          recent.push(food);
        }
      });

    return recent;
  }, [foods, activeProfile]);

  const selectedNutrition = useMemo(() => {
    if (!selectedSearchFood) {
      return null;
    }

    const amount = Number(selectedAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return null;
    }

    const grams = convertAmountToGrams(
      amount,
      selectedServingChoice,
      selectedSearchFood
    );

    const multiplier = grams / 100;

    return {
      grams,
      calories: Math.round(
        selectedSearchFood.calories * multiplier
      ),
      protein: roundMacro(
        selectedSearchFood.protein * multiplier
      ),
      carbs: roundMacro(
        selectedSearchFood.carbs * multiplier
      ),
      fat: roundMacro(
        selectedSearchFood.fat * multiplier
      ),
    };
  }, [
    selectedSearchFood,
    selectedAmount,
    selectedServingChoice,
  ]);

  function resetManualForm() {
    setFoodName('');
    setServingSize('');
    setServingUnit('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setManualSource('manual');
  }

  function resetSearchForm() {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setSelectedSearchFood(null);
    setSelectedAmount('100');
    setSelectedServingChoice('g');
    setIsSearching(false);
  }

  function resetModal() {
    setEditingFoodId(null);
    setEntryMode('recent');
    resetManualForm();
    resetSearchForm();
  }

  async function changeProfile(
    profileId: ProfileId
  ) {
    if (profileId === activeProfile) {
      return;
    }

    setModalVisible(false);
    resetModal();
    setActiveProfile(profileId);

    try {
      await saveActiveProfile(profileId);
    } catch (error) {
      console.error(
        'Unable to save active profile:',
        error
      );
    }
  }
  function openAddFood(meal: MealType) {
    resetModal();
    setSelectedMeal(meal);
    setEntryMode('recent');
    setModalVisible(true);
  }

  function openEditFood(food: FoodItem) {
    resetModal();

    setEditingFoodId(food.id);
    setSelectedMeal(food.meal);
    setEntryMode('manual');

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
    resetModal();
  }

  function changeDate(days: number) {
    const date = parseLocalDate(selectedDate);

    date.setDate(date.getDate() + days);

    setSelectedDate(formatLocalDate(date));
  }

  function goToToday() {
    setSelectedDate(getTodayDate());
  }

  function copyMealFromPreviousDay(meal: MealType) {
    const currentDate = parseLocalDate(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = formatLocalDate(currentDate);

    const foodsToCopy = foods.filter(
      (food) =>
        food.profileId === activeProfile &&
        food.date === previousDate &&
        food.meal === meal
    );

    if (foodsToCopy.length === 0) {
      Alert.alert(
        'Nothing to copy',
        `${currentProfile.name} has no ${meal.toLowerCase()} foods logged on ${formatDisplayDate(previousDate)}.`
      );
      return;
    }

    Alert.alert(
      `Copy ${meal}?`,
      `Copy ${foodsToCopy.length} item${foodsToCopy.length === 1 ? '' : 's'} from ${formatDisplayDate(previousDate)} to ${formatDisplayDate(selectedDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: async () => {
            const copiedFoods: FoodItem[] = foodsToCopy.map((food) => ({
              ...food,
              id: createId(),
              date: selectedDate,
              profileId: activeProfile,
            }));
           setFoods((currentFoods) => [
  ...currentFoods,
  ...copiedFoods,
]);
if (isSignedInProfile) {
  try {
    await Promise.all(
      copiedFoods.map((food) =>
        syncFoodToCloud(food)
      )
    );
  } catch (cloudError) {
    console.error(
      'Unable to sync copied meal to cloud:',
      cloudError
    );

    Alert.alert(
      'Food Cloud Sync Error',
      cloudError instanceof Error
        ? cloudError.message
        : JSON.stringify(cloudError)
    );

    return;
  }
}

Alert.alert(
  'Meal copied',
  `${meal} was copied successfully.`
);
          },
        },
      ]
    );
  }

  function copyDayFromPreviousDay() {
    const currentDate = parseLocalDate(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = formatLocalDate(currentDate);

    const foodsToCopy = foods.filter(
      (food) =>
        food.profileId === activeProfile &&
        food.date === previousDate
    );

    if (foodsToCopy.length === 0) {
      Alert.alert(
        'Nothing to copy',
        `${currentProfile.name} has no foods logged on ${formatDisplayDate(previousDate)}.`
      );
      return;
    }

    Alert.alert(
      'Copy Entire Day?',
      `Copy all ${foodsToCopy.length} food item${foodsToCopy.length === 1 ? '' : 's'} from ${formatDisplayDate(previousDate)} to ${formatDisplayDate(selectedDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy Day',
          onPress: async () => {
            const copiedFoods: FoodItem[] = foodsToCopy.map((food) => ({
              ...food,
              id: createId(),
              date: selectedDate,
              profileId: activeProfile,
            }));
           setFoods((currentFoods) => [
  ...currentFoods,
  ...copiedFoods,
]);
if (isSignedInProfile) {
  try {
    await Promise.all(
      copiedFoods.map((food) =>
        syncFoodToCloud(food)
      )
    );
  } catch (cloudError) {
    console.error(
      'Unable to sync copied day to cloud:',
      cloudError
    );

    Alert.alert(
      'Food Cloud Sync Error',
      cloudError instanceof Error
        ? cloudError.message
        : JSON.stringify(cloudError)
    );

    return;
  }
}

Alert.alert(
  'Day copied',
  `All foods from ${formatDisplayDate(previousDate)} were copied successfully.`
);
          },
        },
      ]
    );
  }

  function openBarcodeScanner() {
    setModalVisible(false);

    router.push({
      pathname: '/barcode-scanner',
      params: {
        meal: selectedMeal,
        date: selectedDate,
        profile: activeProfile,
      },
    });
  }

  async function runFoodSearch() {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      Alert.alert(
        'Enter a food',
        'Type a food name before searching.'
      );
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSelectedSearchFood(null);

    try {
      const results =
        await searchFoods(trimmedQuery);

      /*
       * Generic USDA foods are shown first.
       * Branded foods remain available underneath.
       */
      const sortedResults = [...results].sort(
        (a, b) => {
          const aIsGeneric = !a.brand;
          const bIsGeneric = !b.brand;

          if (aIsGeneric && !bIsGeneric) {
            return -1;
          }

          if (!aIsGeneric && bIsGeneric) {
            return 1;
          }

          return a.name.localeCompare(b.name);
        }
      );

      setSearchResults(sortedResults);

      if (sortedResults.length === 0) {
        setSearchError(
          'No USDA foods were found. Try another search or use manual entry.'
        );
      }
    } catch (error) {
      console.error('USDA search error:', error);

      setSearchResults([]);
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Unable to search USDA foods.'
      );
    } finally {
      setIsSearching(false);
    }
  }

  function chooseSearchFood(
    food: FoodSearchResult
  ) {
    setSelectedSearchFood(food);

    const originalServingSize =
      Number(food.servingSize);

    const originalServingUnit =
      food.servingUnit.toLowerCase();

    if (
      Number.isFinite(originalServingSize) &&
      originalServingSize > 0 &&
      isGramUnit(originalServingUnit)
    ) {
      setSelectedAmount(
        formatNumber(originalServingSize)
      );

      setSelectedServingChoice('g');
    } else {
      setSelectedAmount('100');
      setSelectedServingChoice('g');
    }
  }

  function changeServingChoice(
    choice: ServingChoice
  ) {
    setSelectedServingChoice(choice);

    if (!selectedSearchFood) {
      return;
    }

    if (choice === 'g') {
      setSelectedAmount('100');
      return;
    }

    if (choice === 'oz') {
      setSelectedAmount('4');
      return;
    }

    setSelectedAmount('1');
  }

  async function saveSearchedFood() {
    if (
      !selectedSearchFood ||
      !selectedNutrition
    ) {
      Alert.alert(
        'Invalid serving',
        'Select a food and enter a valid serving amount.'
      );
      return;
    }

    const amount = Number(selectedAmount);

    const displayedUnit =
      selectedServingChoice === 'serving'
        ? getOriginalServingLabel(
            selectedSearchFood
          )
        : selectedServingChoice;

    const foodData: FoodItem = {
      id: createId(),
      name: selectedSearchFood.name,
      servingSize: formatNumber(amount),
      servingUnit: displayedUnit,
      calories: selectedNutrition.calories,
      protein: selectedNutrition.protein,
      carbs: selectedNutrition.carbs,
      fat: selectedNutrition.fat,
      meal: selectedMeal,
      date: selectedDate,
      profileId: activeProfile,
      source: 'usda',
      usdaFoodId: selectedSearchFood.id,
    };

   setFoods((currentFoods) => [
  ...currentFoods,
  foodData,
]);
if (isSignedInProfile) {
  try {
    await syncFoodToCloud(foodData);

  
  } catch (cloudError) {
    console.error(
      'Unable to sync USDA food to cloud:',
      cloudError
    );

    Alert.alert(
      'Food Cloud Sync Error',
      cloudError instanceof Error
        ? cloudError.message
        : JSON.stringify(cloudError)
    );
  }
} else {
  console.log(
    'Skipping USDA food cloud sync because the viewed profile is not the signed-in profile.'
  );
}

closeModal();
  }

async function saveManualFood() {
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFat = Number(fat);

    if (!foodName.trim()) {
      Alert.alert(
        'Food name required',
        'Enter a food name.'
      );
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
      calories.trim() === '' ||
      !Number.isFinite(parsedCalories) ||
      parsedCalories < 0
    ) {
      Alert.alert(
        'Invalid calories',
        'Enter valid calories.'
      );
      return;
    }

    if (
      protein.trim() === '' ||
      !Number.isFinite(parsedProtein) ||
      parsedProtein < 0
    ) {
      Alert.alert(
        'Invalid protein',
        'Enter valid protein.'
      );
      return;
    }

    if (
      carbs.trim() === '' ||
      !Number.isFinite(parsedCarbs) ||
      parsedCarbs < 0
    ) {
      Alert.alert(
        'Invalid carbs',
        'Enter valid carbohydrates.'
      );
      return;
    }

    if (
      fat.trim() === '' ||
      !Number.isFinite(parsedFat) ||
      parsedFat < 0
    ) {
      Alert.alert(
        'Invalid fat',
        'Enter valid fat.'
      );
      return;
    }

    const existingFood = editingFoodId
      ? foods.find(
          (food) => food.id === editingFoodId
        )
      : undefined;

    const foodData: FoodItem = {
      id: editingFoodId ?? createId(),
      name: foodName.trim(),
      servingSize: servingSize.trim(),
      servingUnit: servingUnit.trim(),
      calories: Math.round(parsedCalories),
      protein: roundMacro(parsedProtein),
      carbs: roundMacro(parsedCarbs),
      fat: roundMacro(parsedFat),
      meal: selectedMeal,
      date: existingFood?.date ?? selectedDate,
      profileId:
        existingFood?.profileId ?? activeProfile,
      source: existingFood?.source ?? manualSource,
      usdaFoodId: existingFood?.usdaFoodId,
    };

      if (editingFoodId) {
      setFoods((currentFoods) =>
        currentFoods.map((food) =>
          food.id === editingFoodId
            ? foodData
            : food
        )
      );
    } else {
      setFoods((currentFoods) => [
        ...currentFoods,
        foodData,
      ]);
    }
    if (isSignedInProfile) {
      try {
        await syncFoodToCloud(foodData);
     } catch (cloudError) {
  console.error(
    'Unable to sync food to cloud:',
    cloudError
  );

  Alert.alert(
    'Food Cloud Sync Error',
    cloudError instanceof Error
      ? cloudError.message
      : JSON.stringify(cloudError)
  );
}
    } else {
      console.log(
        'Skipping cloud food sync because the viewed profile is not the signed-in profile.'
      );
    }

    closeModal();
  }

 async function addReusableFood(
  food: FoodItem | FavoriteFood
) {
    const newFood: FoodItem = {
      id: createId(),
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      meal: selectedMeal,
      date: selectedDate,
      profileId: activeProfile,
      source: food.source,
      usdaFoodId: food.usdaFoodId,
    };

  setFoods((currentFoods) => [
  ...currentFoods,
  newFood,
]);
if (isSignedInProfile) {
  try {
    await syncFoodToCloud(newFood);
  } catch (cloudError) {
    console.error(
      'Unable to sync reusable food to cloud:',
      cloudError
    );

    Alert.alert(
      'Food Cloud Sync Error',
      cloudError instanceof Error
        ? cloudError.message
        : JSON.stringify(cloudError)
    );
  }
} else {
  console.log(
    'Skipping reusable food cloud sync because the viewed profile is not the signed-in profile.'
  );
}

closeModal();
  }

  function adjustReusableFood(
    food: FoodItem | FavoriteFood
  ) {
    resetManualForm();
    setEditingFoodId(null);
    setFoodName(food.name);
    setServingSize(food.servingSize);
    setServingUnit(food.servingUnit);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setEntryMode('manual');
  }

  function isFavorite(food: FoodItem) {
    return profileFavorites.some(
      (favorite) =>
        reusableFoodKey(favorite) ===
        reusableFoodKey(food)
    );
  }

  function toggleFavorite(food: FoodItem) {
    const matchingFavorite = profileFavorites.find(
      (favorite) =>
        reusableFoodKey(favorite) ===
        reusableFoodKey(food)
    );

    if (matchingFavorite) {
      setFavorites((currentFavorites) =>
        currentFavorites.filter(
          (favorite) =>
            favorite.id !== matchingFavorite.id
        )
      );
      return;
    }

    const favorite: FavoriteFood = {
      id: createId(),
      profileId: activeProfile,
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      source: food.source,
      usdaFoodId: food.usdaFoodId,
    };

    setFavorites((currentFavorites) => [
      favorite,
      ...currentFavorites,
    ]);
  }

  function removeFavorite(favoriteId: string) {
    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (favorite) => favorite.id !== favoriteId
      )
    );
  }

  function deleteFood(id: string) {
    Alert.alert(
      'Delete food?',
      `This food will be removed from ${currentProfile.name}'s log for this day.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
         onPress: async () => {
  const foodToDelete = foods.find(
    (food) => food.id === id
  );

  if (!foodToDelete) {
    return;
  }
  if (isSignedInProfile) {
    try {
      await deleteFoodFromCloud(id);
    } catch (cloudError) {
      console.error(
        'Unable to delete food from cloud:',
        cloudError
      );

      Alert.alert(
        'Unable to Delete',
        'The food could not be deleted from the cloud.'
      );

      return;
    }
  }

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
        <Text style={styles.brand}>
          PARKER FITNESS
        </Text>

        <Text style={styles.title}>
          Meals
        </Text>

        <Text style={styles.subtitle}>
          Track daily nutrition separately for each profile.
        </Text>

              <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>
            ACTIVE PROFILE
          </Text>

          <View style={styles.profileSelector}>
            {profiles.map((profile) => (
              <Pressable
                key={profile.id}
                style={[
                  styles.profileButton,
                  activeProfile === profile.id &&
                    styles.profileButtonActive,
                ]}
                onPress={() =>
                  changeProfile(profile.id)
                }
              >
                <Text
                  style={[
                    styles.profileButtonText,
                    activeProfile === profile.id &&
                      styles.profileButtonTextActive,
                  ]}
                >
                  {profile.name}
                </Text>
              </Pressable>
            ))}
          </View>

<Text style={styles.profileStatus}>
  Viewing {currentProfile.name}'s nutrition
</Text>

        </View>

        <View style={styles.dateCard}>
          <Pressable
            style={styles.dateArrowButton}
            onPress={() => changeDate(-1)}
          >
            <Text style={styles.dateArrow}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>
              {isToday
                ? 'TODAY'
                : 'SELECTED DAY'}
            </Text>

            <Text style={styles.dateValue}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>

          <Pressable
            style={[
              styles.dateArrowButton,
              isToday &&
                styles.dateArrowDisabled,
            ]}
            onPress={() => {
              if (!isToday) {
                changeDate(1);
              }
            }}
            disabled={isToday}
          >
            <Text
              style={[
                styles.dateArrow,
                isToday &&
                  styles.dateArrowTextDisabled,
              ]}
            >
              ›
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.copyDayButton}
          onPress={copyDayFromPreviousDay}
        >
          <Text style={styles.copyDayButtonText}>
            Copy Previous Day
          </Text>
        </Pressable>

        {!isToday && (
          <Pressable
            style={styles.todayButton}
            onPress={goToToday}
          >
            <Text style={styles.todayButtonText}>
              Return to Today
            </Text>
          </Pressable>
        )}

        <View style={styles.calorieCard}>
          <Text style={styles.summaryLabel}>
            {currentProfile.name.toUpperCase()} • CALORIES LOGGED
          </Text>

          <Text style={styles.calorieValue}>
            {totalCalories}
          </Text>

          <Text style={styles.calorieGoalText}>
            Goal: {currentProfile.calorieGoal} calories
          </Text>

          <Text style={styles.calorieDateText}>
            {isToday
              ? "Today's total"
              : formatDisplayDate(selectedDate)}
          </Text>
        </View>

        <View style={styles.macroRow}>
          <MacroCard
            label="Protein"
            value={`${totalProtein}g`}
            goal={`${currentProfile.proteinGoal}g goal`}
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
          const mealFoods =
            selectedDateFoods.filter(
              (food) => food.meal === meal
            );

          const mealCalories = Math.round(
            mealFoods.reduce(
              (total, food) =>
                total + food.calories,
              0
            )
          );

          return (
            <View
              key={meal}
              style={styles.mealCard}
            >
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
                  Nothing logged for {currentProfile.name}
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

                      <Text style={styles.servingText}>
                        {food.servingSize}{' '}
                        {food.servingUnit}
                      </Text>

                      <Text style={styles.foodDetails}>
                        {food.calories} cal •{' '}
                        {food.protein}g protein •{' '}
                        {food.carbs}g carbs •{' '}
                        {food.fat}g fat
                      </Text>

                      {food.source === 'usda' && (
                        <Text style={styles.usdaLabel}>
                          USDA FoodData Central
                        </Text>
                      )}

                      {food.source === 'barcode' && (
                        <Text style={styles.usdaLabel}>
                          Barcode scan
                        </Text>
                      )}
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() =>
                          toggleFavorite(food)
                        }
                        hitSlop={8}
                      >
                        <Text style={styles.favoriteText}>
                          {isFavorite(food) ? '★ Favorite' : '☆ Favorite'}
                        </Text>
                      </Pressable>

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
                        <Text style={styles.deleteText}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Pressable
                style={styles.copyMealButton}
                onPress={() => copyMealFromPreviousDay(meal)}
              >
                <Text style={styles.copyMealButtonText}>
                  Copy Previous {meal}
                </Text>
              </Pressable>

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

          <Text style={styles.modalProfile}>
            {currentProfile.name}
          </Text>

          <Text style={styles.modalMeal}>
            {selectedMeal}
          </Text>

          <Text style={styles.modalDate}>
            {formatDisplayDate(selectedDate)}
          </Text>

          {!editingFoodId && (
            <View style={styles.entryModeSelector}>
              <EntryModeButton
                label="Recent"
                active={entryMode === 'recent'}
                onPress={() => setEntryMode('recent')}
              />

              <EntryModeButton
                label="Favorites"
                active={entryMode === 'favorites'}
                onPress={() => setEntryMode('favorites')}
              />

              <EntryModeButton
                label="USDA Search"
                active={entryMode === 'search'}
                onPress={() => setEntryMode('search')}
              />

              <EntryModeButton
                label="Manual Entry"
                active={entryMode === 'manual'}
                onPress={() => setEntryMode('manual')}
              />
            </View>
          )}

          {!editingFoodId && (
            <Pressable
              style={styles.scanBarcodeButton}
              onPress={openBarcodeScanner}
            >
              <Text style={styles.scanBarcodeButtonText}>
                Scan Barcode
              </Text>
            </Pressable>
          )}

          {!editingFoodId && entryMode === 'recent' && (
            <ReusableFoodSection
              title="Recent Foods"
              emptyMessage={`No recent foods for ${currentProfile.name} yet.`}
              foods={recentFoods}
              onAdd={addReusableFood}
              onAdjust={adjustReusableFood}
            />
          )}

          {!editingFoodId && entryMode === 'favorites' && (
            <ReusableFoodSection
              title="Favorite Foods"
              emptyMessage={`No favorites saved for ${currentProfile.name} yet.`}
              foods={profileFavorites}
              onAdd={addReusableFood}
              onAdjust={adjustReusableFood}
              onRemoveFavorite={removeFavorite}
            />
          )}

          {entryMode === 'search' && !editingFoodId && (
            <>
              <Text style={styles.inputLabel}>
                Search for a food
              </Text>

              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Chicken breast, banana, yogurt..."
                  placeholderTextColor="#9AA39E"
                  returnKeyType="search"
                  autoCapitalize="none"
                  onSubmitEditing={runFoodSearch}
                />

                <Pressable
                  style={styles.searchButton}
                  onPress={runFoodSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchButtonText}>
                      Search
                    </Text>
                  )}
                </Pressable>
              </View>

              {searchError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>
                    {searchError}
                  </Text>
                </View>
              ) : null}

              {selectedSearchFood ? (
                <SelectedFoodCard
                  food={selectedSearchFood}
                  amount={selectedAmount}
                  onChangeAmount={setSelectedAmount}
                  servingChoice={selectedServingChoice}
                  onChangeServingChoice={changeServingChoice}
                  nutrition={selectedNutrition}
                  onClear={() => setSelectedSearchFood(null)}
                  onSave={saveSearchedFood}
                  profileName={currentProfile.name}
                />
              ) : (
                <>
                  {searchResults.length > 0 && (
                    <Text style={styles.resultHeading}>
                      Select a food
                    </Text>
                  )}

                  {searchResults.map((result, index) => (
                    <Pressable
                      key={`${result.id}-${index}`}
                      style={styles.resultCard}
                      onPress={() => chooseSearchFood(result)}
                    >
                      <View style={styles.resultInformation}>
                        <Text style={styles.resultName}>
                          {result.name}
                        </Text>

                        {result.brand ? (
                          <Text style={styles.resultBrand}>
                            {result.brand}
                          </Text>
                        ) : (
                          <Text style={styles.genericLabel}>
                            Generic USDA food
                          </Text>
                        )}

                        <Text style={styles.resultNutrition}>
                          Per 100 g: {result.calories} cal •{' '}
                          {result.protein}g protein •{' '}
                          {result.carbs}g carbs • {result.fat}g fat
                        </Text>
                      </View>

                      <Text style={styles.selectArrow}>•</Text>
                    </Pressable>
                  ))}
                </>
              )}
            </>
          )}

          {(entryMode === 'manual' || editingFoodId) && (
            <>
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
                onPress={saveManualFood}
              >
                <Text style={styles.saveButtonText}>
                  {editingFoodId
                    ? 'Save Changes'
                    : `Save Food for ${currentProfile.name}`}
                </Text>
              </Pressable>
            </>
          )}

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

type EntryModeButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function EntryModeButton({
  label,
  active,
  onPress,
}: EntryModeButtonProps) {
  return (
    <Pressable
      style={[
        styles.entryModeButton,
        active && styles.entryModeButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.entryModeText,
          active && styles.entryModeTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ReusableFood = FoodItem | FavoriteFood;

type ReusableFoodSectionProps = {
  title: string;
  emptyMessage: string;
  foods: ReusableFood[];
  onAdd: (food: ReusableFood) => void;
  onAdjust: (food: ReusableFood) => void;
  onRemoveFavorite?: (id: string) => void;
};

function ReusableFoodSection({
  title,
  emptyMessage,
  foods,
  onAdd,
  onAdjust,
  onRemoveFavorite,
}: ReusableFoodSectionProps) {
  return (
    <View style={styles.reusableSection}>
      <Text style={styles.resultHeading}>{title}</Text>

      {foods.length === 0 ? (
        <View style={styles.emptyReusableCard}>
          <Text style={styles.emptyReusableText}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        foods.map((food) => (
          <View key={food.id} style={styles.reusableCard}>
            <Text style={styles.resultName}>{food.name}</Text>

            <Text style={styles.servingText}>
              {food.servingSize} {food.servingUnit}
            </Text>

            <Text style={styles.resultNutrition}>
              {food.calories} cal • {food.protein}g protein •{' '}
              {food.carbs}g carbs • {food.fat}g fat
            </Text>

            <View style={styles.reusableActions}>
              <Pressable
                style={styles.quickAddButton}
                onPress={() => onAdd(food)}
              >
                <Text style={styles.quickAddButtonText}>
                  Add
                </Text>
              </Pressable>

              <Pressable
                style={styles.adjustButton}
                onPress={() => onAdjust(food)}
              >
                <Text style={styles.adjustButtonText}>
                  Adjust
                </Text>
              </Pressable>

              {onRemoveFavorite ? (
                <Pressable
                  style={styles.removeFavoriteButton}
                  onPress={() => onRemoveFavorite(food.id)}
                >
                  <Text style={styles.removeFavoriteText}>
                    Remove
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

type SelectedFoodCardProps = {
  food: FoodSearchResult;
  amount: string;
  onChangeAmount: (value: string) => void;
  servingChoice: ServingChoice;
  onChangeServingChoice: (
    value: ServingChoice
  ) => void;
  nutrition: {
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  onClear: () => void;
  onSave: () => void;
  profileName: string;
};

function SelectedFoodCard({
  food,
  amount,
  onChangeAmount,
  servingChoice,
  onChangeServingChoice,
  nutrition,
  onClear,
  onSave,
  profileName,
}: SelectedFoodCardProps) {
  return (
    <View style={styles.selectedFoodCard}>
      <View style={styles.selectedFoodHeader}>
        <View style={styles.selectedFoodInformation}>
          <Text style={styles.selectedFoodTitle}>
            {food.name}
          </Text>

          {food.brand ? (
            <Text style={styles.selectedFoodBrand}>
              {food.brand}
            </Text>
          ) : (
            <Text style={styles.genericLabel}>
              Generic USDA food
            </Text>
          )}
        </View>

        <Pressable
          onPress={onClear}
          hitSlop={8}
        >
          <Text style={styles.changeFoodText}>
            Change
          </Text>
        </Pressable>
      </View>

      <Text style={styles.inputLabel}>
        Serving amount
      </Text>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={onChangeAmount}
        placeholder="Enter amount"
        placeholderTextColor="#9AA39E"
        keyboardType="decimal-pad"
      />

      <View style={styles.servingChoiceRow}>
        <ServingChoiceButton
          label="Grams"
          active={servingChoice === 'g'}
          onPress={() =>
            onChangeServingChoice('g')
          }
        />

        <ServingChoiceButton
          label="Ounces"
          active={servingChoice === 'oz'}
          onPress={() =>
            onChangeServingChoice('oz')
          }
        />

        <ServingChoiceButton
          label="Servings"
          active={servingChoice === 'serving'}
          onPress={() =>
            onChangeServingChoice('serving')
          }
        />
      </View>

      {servingChoice === 'serving' && (
        <Text style={styles.servingExplanation}>
          One serving uses the USDA serving size:{' '}
          {formatNumber(food.servingSize)}{' '}
          {food.servingUnit}.
        </Text>
      )}

      {nutrition ? (
        <View style={styles.nutritionPreview}>
          <Text style={styles.previewLabel}>
            NUTRITION FOR THIS AMOUNT
          </Text>

          <Text style={styles.previewCalories}>
            {nutrition.calories} calories
          </Text>

          <Text style={styles.previewMacros}>
            {nutrition.protein}g protein •{' '}
            {nutrition.carbs}g carbs •{' '}
            {nutrition.fat}g fat
          </Text>

          <Text style={styles.previewGrams}>
            Equivalent to approximately{' '}
            {roundMacro(nutrition.grams)} g
          </Text>
        </View>
      ) : (
        <Text style={styles.invalidAmountText}>
          Enter a valid amount greater than zero.
        </Text>
      )}

      <Pressable
        style={[
          styles.saveButton,
          !nutrition &&
            styles.saveButtonDisabled,
        ]}
        onPress={onSave}
        disabled={!nutrition}
      >
        <Text style={styles.saveButtonText}>
          Add Food for {profileName}
        </Text>
      </Pressable>
    </View>
  );
}

type ServingChoiceButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function ServingChoiceButton({
  label,
  active,
  onPress,
}: ServingChoiceButtonProps) {
  return (
    <Pressable
      style={[
        styles.servingChoiceButton,
        active &&
          styles.servingChoiceButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.servingChoiceText,
          active &&
            styles.servingChoiceTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type MacroCardProps = {
  label: string;
  value: string;
  goal?: string;
};

function MacroCard({
  label,
  value,
  goal,
}: MacroCardProps) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>
        {label}
      </Text>

      <Text style={styles.macroValue}>
        {value}
      </Text>

      {goal ? (
        <Text style={styles.macroGoal}>
          {goal}
        </Text>
      ) : null}
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

function convertAmountToGrams(
  amount: number,
  servingChoice: ServingChoice,
  food: FoodSearchResult
) {
  if (servingChoice === 'g') {
    return amount;
  }

  if (servingChoice === 'oz') {
    return amount * OUNCES_TO_GRAMS;
  }

  const servingSize = Number(food.servingSize);
  const servingUnit =
    food.servingUnit.toLowerCase();

  if (
    Number.isFinite(servingSize) &&
    servingSize > 0
  ) {
    if (isGramUnit(servingUnit)) {
      return amount * servingSize;
    }

    if (isOunceUnit(servingUnit)) {
      return (
        amount *
        servingSize *
        OUNCES_TO_GRAMS
      );
    }
  }

  /*
   * If USDA does not provide a convertible serving,
   * use 100 g as one serving.
   */
  return amount * 100;
}

function isGramUnit(unit: string) {
  return (
    unit === 'g' ||
    unit === 'gram' ||
    unit === 'grams'
  );
}

function isOunceUnit(unit: string) {
  return (
    unit === 'oz' ||
    unit === 'ounce' ||
    unit === 'ounces'
  );
}

function getOriginalServingLabel(
  food: FoodSearchResult
) {
  const size = Number(food.servingSize);

  if (
    Number.isFinite(size) &&
    size > 0 &&
    food.servingUnit
  ) {
    return `serving (${formatNumber(size)} ${food.servingUnit})`;
  }

  return 'serving (100 g)';
}

function reusableFoodKey(
  food: Pick<
    FoodItem,
    | 'name'
    | 'servingSize'
    | 'servingUnit'
    | 'usdaFoodId'
  >
) {
  return [
    food.usdaFoodId ?? '',
    food.name.trim().toLowerCase(),
    food.servingSize.trim().toLowerCase(),
    food.servingUnit.trim().toLowerCase(),
  ].join('|');
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : roundMacro(value).toString();
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string) {
  const date = parseLocalDate(dateString);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
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
    marginBottom: 20,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },

  profileLabel: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  profileSelector: {
    flexDirection: 'row',
    backgroundColor: '#EDF1EF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },

  profileButton: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
  },

  profileButtonActive: {
    backgroundColor: '#2D6B48',
  },

  profileButtonText: {
    color: '#557063',
    fontSize: 15,
    fontWeight: '800',
  },

  profileButtonTextActive: {
    color: '#FFFFFF',
  },

  profileStatus: {
    color: '#6D7972',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },

  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateArrowDisabled: {
    backgroundColor: '#F1F2F1',
  },

  dateArrow: {
    color: '#2D6B48',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '600',
  },

  dateArrowTextDisabled: {
    color: '#B8BFBB',
  },

  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },

  dateLabel: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  dateValue: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  todayButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  todayButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
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

  calorieGoalText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  calorieDateText: {
    color: '#C8D6CE',
    fontSize: 12,
    marginTop: 4,
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

  macroGoal: {
    color: '#557063',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
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

  usdaLabel: {
    color: '#2D6B48',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },

  favoriteText: {
    color: '#A06A00',
    fontSize: 13,
    fontWeight: '800',
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

  modalProfile: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },

  modalMeal: {
    color: '#2D6B48',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 3,
  },

  modalDate: {
    color: '#6D7972',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 18,
  },

  entryModeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#E8EDEA',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },

  entryModeButton: {
    width: '48%',
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
  },

  entryModeButtonActive: {
    backgroundColor: '#2D6B48',
  },

  entryModeText: {
    color: '#557063',
    fontSize: 14,
    fontWeight: '800',
  },

  entryModeTextActive: {
    color: '#FFFFFF',
  },

  scanBarcodeButton: {
    backgroundColor: '#17211C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  scanBarcodeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  copyDayButton: {
    backgroundColor: '#17211C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  copyDayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  copyMealButton: {
    backgroundColor: '#F4F6F5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCE4DF',
  },

  copyMealButtonText: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '800',
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

  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#17211C',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  searchButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  errorCard: {
    backgroundColor: '#FCECEC',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },

  errorText: {
    color: '#A64040',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  resultHeading: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 8,
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  resultInformation: {
    flex: 1,
    paddingRight: 10,
  },

  resultName: {
    color: '#17211C',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },

  resultBrand: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  genericLabel: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },

  resultNutrition: {
    color: '#77817C',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  selectArrow: {
    color: '#2D6B48',
    fontSize: 28,
    fontWeight: '700',
  },

  reusableSection: {
    marginTop: 4,
  },

  emptyReusableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  emptyReusableText: {
    color: '#77817C',
    fontSize: 14,
    lineHeight: 20,
  },

  reusableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  reusableActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  quickAddButton: {
    flex: 1,
    backgroundColor: '#2D6B48',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  quickAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  adjustButton: {
    flex: 1,
    backgroundColor: '#EDF4EF',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  adjustButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '900',
  },

  removeFavoriteButton: {
    flex: 1,
    backgroundColor: '#FCECEC',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  removeFavoriteText: {
    color: '#B84A4A',
    fontSize: 13,
    fontWeight: '900',
  },

  selectedFoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DCE4DF',
  },

  selectedFoodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  selectedFoodInformation: {
    flex: 1,
    paddingRight: 10,
  },

  selectedFoodTitle: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },

  selectedFoodBrand: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  changeFoodText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
  },

  servingChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  servingChoiceButton: {
    flex: 1,
    backgroundColor: '#EDF1EF',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },

  servingChoiceButtonActive: {
    backgroundColor: '#2D6B48',
  },

  servingChoiceText: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '800',
  },

  servingChoiceTextActive: {
    color: '#FFFFFF',
  },

  servingExplanation: {
    color: '#6D7972',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  nutritionPreview: {
    backgroundColor: '#EDF4EF',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },

  previewLabel: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  previewCalories: {
    color: '#17211C',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6,
  },

  previewMacros: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 5,
  },

  previewGrams: {
    color: '#6D7972',
    fontSize: 11,
    marginTop: 5,
  },

  invalidAmountText: {
    color: '#B84A4A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },

  saveButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 30,
  },

  saveButtonDisabled: {
    opacity: 0.45,
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


