import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserCloudProfile } from '@/services/supabase';
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
  FoodServingOption,
  getFoodDetails,
  searchFoods,
} from '@/services/foodApi';

import {
  getTodayDate,
  loadActiveProfile,
  loadFoods,
  loadProfiles,
  saveActiveProfile,
  saveFoods,
  syncFoodToCloud,
  type Profile,
  type ProfileId,
} from '@/services/storage';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

type PlannedMeal = {
  id: string;
  profileId: ProfileId;
  date: string;
  meal: MealType;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: 'usda';
  usdaFoodId?: string;
  loggedAt?: string;
  sharedMealId?: string;
  sharedMealName?: string;
  sharedSourceItemId?: string;
  grams?: number;
  notes?: string;
};

const mealTypes: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

const PLANNED_MEALS_KEY = '@parker_fitness_planned_meals';
const GROCERY_CHECKED_KEY = '@parker_fitness_grocery_checked';
const MANUAL_GROCERY_KEY = '@parker_fitness_manual_grocery';
const OUNCES_TO_GRAMS = 28.3495;

type ServingChoice = 'g' | 'oz' | 'cup' | 'unit';

const groceryCategories: GroceryCategory[] = [
  'Protein',
  'Produce',
  'Dairy',
  'Pantry',
  'Frozen',
  'Other',
];

type GroceryCategory =
  | 'Protein'
  | 'Produce'
  | 'Dairy'
  | 'Pantry'
  | 'Frozen'
  | 'Other';

type GroceryItem = {
  id: string;
  foodKey: string;
  name: string;
  quantityLabel: string;
  uses: number;
  profileCount: number;
  category: GroceryCategory;
  manual?: boolean;
};

type ManualGroceryItem = {
  id: string;
  name: string;
  quantity: string;
  category: GroceryCategory;
};

type LoggedFood = {
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

export default function MealPlanScreen() {
  const [activeProfile, setActiveProfile] =
    useState<ProfileId>('zach');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [signedInCloudProfileId, setSignedInCloudProfileId] =
    useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(
    getMonday(getTodayDate())
  );
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [plannerModalVisible, setPlannerModalVisible] =
    useState(false);
  const [planningDate, setPlanningDate] =
    useState(getTodayDate());
  const [planningMeal, setPlanningMeal] =
    useState<MealType>('Breakfast');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] =
    useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedFood, setSelectedFood] =
    useState<FoodSearchResult | null>(null);
  const [servingChoice, setServingChoice] =
    useState<ServingChoice>('g');
  const [selectedServingOption, setSelectedServingOption] =
    useState<FoodServingOption | null>(null);
  const [amount, setAmount] = useState('100');

  const [sharedMealVisible, setSharedMealVisible] =
    useState(false);
  const [sharedMealDate, setSharedMealDate] =
    useState(getTodayDate());
  const [sharedMealType, setSharedMealType] =
    useState<MealType>('Dinner');
  const [sharedMealName, setSharedMealName] =
    useState('');
  const [sharedSourceItems, setSharedSourceItems] =
    useState<PlannedMeal[]>([]);
  const [sharedAmounts, setSharedAmounts] =
    useState<Record<string, Record<string, string>>>({});

  const [groceryVisible, setGroceryVisible] =
    useState(false);
  const [groceryChecked, setGroceryChecked] =
    useState<Record<string, boolean>>({});

  const [manualGroceryItems, setManualGroceryItems] =
    useState<ManualGroceryItem[]>([]);
  const [manualGroceryName, setManualGroceryName] =
    useState('');
  const [manualGroceryQuantity, setManualGroceryQuantity] =
    useState('');
  const [manualGroceryCategory, setManualGroceryCategory] =
    useState<GroceryCategory>('Other');

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
    async function restore() {
      try {
        const AsyncStorage =
          require('@react-native-async-storage/async-storage').default;

        const [
          savedProfile,
          savedProfiles,
          savedPlans,
          savedGroceryChecked,
          savedManualGrocery,
        ] = await Promise.all([
          loadActiveProfile(),
          loadProfiles(),
          AsyncStorage.getItem(PLANNED_MEALS_KEY),
          AsyncStorage.getItem(GROCERY_CHECKED_KEY),
          AsyncStorage.getItem(MANUAL_GROCERY_KEY),
        ]);

        setActiveProfile(savedProfile);
        setProfiles(savedProfiles);

        if (savedPlans) {
          setPlannedMeals(JSON.parse(savedPlans));
        }

        if (savedGroceryChecked) {
          setGroceryChecked(
            JSON.parse(savedGroceryChecked)
          );
        }

        if (savedManualGrocery) {
          setManualGroceryItems(
            JSON.parse(savedManualGrocery)
          );
        }
      } catch (error) {
        console.error('Unable to restore meal plan:', error);
      } finally {
        setLoaded(true);
      }
    }

    restore();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    async function persist() {
      try {
        const AsyncStorage =
          require('@react-native-async-storage/async-storage').default;

        await AsyncStorage.setItem(
          PLANNED_MEALS_KEY,
          JSON.stringify(plannedMeals)
        );
      } catch (error) {
        console.error('Unable to save meal plan:', error);
      }
    }

    persist();
  }, [plannedMeals, loaded]);

  useEffect(() => {
    if (!loaded) return;

    async function persistGroceryChecked() {
      try {
        const AsyncStorage =
          require('@react-native-async-storage/async-storage').default;

        await AsyncStorage.setItem(
          GROCERY_CHECKED_KEY,
          JSON.stringify(groceryChecked)
        );
      } catch (error) {
        console.error(
          'Unable to save grocery checks:',
          error
        );
      }
    }

    persistGroceryChecked();
  }, [groceryChecked, loaded]);

  useEffect(() => {
    if (!loaded) return;

    async function persistManualGrocery() {
      try {
        const AsyncStorage =
          require('@react-native-async-storage/async-storage').default;

        await AsyncStorage.setItem(
          MANUAL_GROCERY_KEY,
          JSON.stringify(manualGroceryItems)
        );
      } catch (error) {
        console.error(
          'Unable to save manual grocery items:',
          error
        );
      }
    }

    persistManualGrocery();
  }, [manualGroceryItems, loaded]);

  const currentProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === activeProfile),
    [profiles, activeProfile]
  );

  const isSignedInProfile =
    currentProfile?.cloudProfileId ===
    signedInCloudProfileId;

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index)
      ),
    [weekStart]
  );

  const groceryItems = useMemo(() => {
    const weekDateSet = new Set(weekDates);

    const weekItems = plannedMeals.filter(
      (item) => weekDateSet.has(item.date)
    );

    const planned = buildGroceryItems(
      weekItems,
      weekStart
    );

    const manual = manualGroceryItems.map(
      (item): GroceryItem => ({
        id: `manual|${item.id}`,
        foodKey: `manual|${item.id}`,
        name: item.name,
        quantityLabel:
          item.quantity.trim() || '1',
        uses: 0,
        profileCount: 0,
        category: item.category,
        manual: true,
      })
    );

    return [...planned, ...manual].sort((a, b) => {
      const categoryCompare =
        groceryCategories.indexOf(a.category) -
        groceryCategories.indexOf(b.category);

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return a.name.localeCompare(b.name);
    });
  }, [
    plannedMeals,
    weekDates,
    weekStart,
    manualGroceryItems,
  ]);

  const groceryCheckedCount = groceryItems.filter(
    (item) => groceryChecked[item.id]
  ).length;

  const groceryByCategory = useMemo(() => {
    return groceryCategories
      .map((category) => ({
        category,
        items: groceryItems.filter(
          (item) => item.category === category
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groceryItems]);

  async function changeProfile(profileId: ProfileId) {
    setActiveProfile(profileId);

    try {
      await saveActiveProfile(profileId);
    } catch (error) {
      console.error('Unable to save active profile:', error);
    }
  }

  function changeWeek(days: number) {
    setWeekStart(addDays(weekStart, days));
  }

  function openFoodPlanner(
    date: string,
    meal: MealType
  ) {
    setPlanningDate(date);
    setPlanningMeal(meal);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setSelectedFood(null);
    setSelectedServingOption(null);
    setServingChoice('g');
    setAmount('100');
    setPlannerModalVisible(true);
  }

  function closeFoodPlanner() {
    setPlannerModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setSelectedFood(null);
    setSelectedServingOption(null);
    setServingChoice('g');
    setAmount('100');
  }

  async function runFoodSearch() {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      Alert.alert(
        'Enter a food',
        'Type a food name before searching.'
      );
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSelectedFood(null);

    try {
      const results = await searchFoods(trimmed);

      setSearchResults(results);

      if (results.length === 0) {
        setSearchError(
          'No matching USDA foods were found.'
        );
      }
    } catch (error) {
      console.error('Meal plan USDA search error:', error);
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

  async function chooseFood(food: FoodSearchResult) {
    setIsSearching(true);
    setSearchError('');

    try {
      const detailed = await getFoodDetails(food.id);

      setSelectedFood(detailed);

      const preferred =
        getPreferredHouseholdServing(
          detailed.servingOptions ?? []
        );

      if (preferred) {
        setSelectedServingOption(preferred);
        setServingChoice(
          getHouseholdChoiceType(preferred)
        );
        setAmount('1');
      } else {
        setSelectedServingOption(null);
        setServingChoice('g');
        setAmount('100');
      }
    } catch (error) {
      console.error(
        'Unable to load USDA food details:',
        error
      );

      setSelectedFood(food);
      setSelectedServingOption(null);
      setServingChoice('g');
      setAmount('100');
    } finally {
      setIsSearching(false);
    }
  }

  function changeServingChoice(
    choice: ServingChoice
  ) {
    if (!selectedFood) return;

    setServingChoice(choice);

    if (choice === 'g') {
      setSelectedServingOption(null);
      setAmount('100');
      return;
    }

    if (choice === 'oz') {
      setSelectedServingOption(null);
      setAmount('4');
      return;
    }

    const option = findServingOptionForChoice(
      selectedFood.servingOptions ?? [],
      choice
    );

    if (option) {
      setSelectedServingOption(option);
      setAmount('1');
    }
  }

  const selectedNutrition = useMemo(() => {
    if (!selectedFood) {
      return null;
    }

    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return null;
    }

    const grams = convertAmountToGrams(
      parsedAmount,
      servingChoice,
      selectedServingOption
    );

    if (!grams || grams <= 0) {
      return null;
    }

    const multiplier = grams / 100;

    return {
      calories: Math.round(
        selectedFood.calories * multiplier
      ),
      protein: roundMacro(
        selectedFood.protein * multiplier
      ),
      carbs: roundMacro(
        selectedFood.carbs * multiplier
      ),
      fat: roundMacro(
        selectedFood.fat * multiplier
      ),
    };
  }, [
    selectedFood,
    amount,
    servingChoice,
    selectedServingOption,
  ]);

  function savePlannedFood() {
    if (!selectedFood || !selectedNutrition) {
      Alert.alert(
        'Invalid serving',
        'Choose a food and enter a valid amount.'
      );
      return;
    }

    const parsedAmount = Number(amount);

    const servingUnit =
      getPlannedServingUnitLabel(
        servingChoice,
        selectedServingOption
      );

    const plannedGrams = convertAmountToGrams(
      parsedAmount,
      servingChoice,
      selectedServingOption
    );

    const plannedFood: PlannedMeal = {
      id: createId(),
      profileId: activeProfile,
      date: planningDate,
      meal: planningMeal,
      name: selectedFood.name,
      servingSize: formatNumber(parsedAmount),
      servingUnit,
      calories: selectedNutrition.calories,
      protein: selectedNutrition.protein,
      carbs: selectedNutrition.carbs,
      fat: selectedNutrition.fat,
      source: 'usda',
      usdaFoodId: selectedFood.id,
      grams:
        plannedGrams && plannedGrams > 0
          ? roundMacro(plannedGrams)
          : undefined,
    };

    setPlannedMeals((current) => [
      ...current,
      plannedFood,
    ]);

    closeFoodPlanner();
  }

  function openSharedMeal(
    date: string,
    meal: MealType
  ) {
    const sourceItems = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === date &&
        item.meal === meal
    );

    if (sourceItems.length === 0) {
      Alert.alert(
        'Plan foods first',
        `Add at least one food to ${meal.toLowerCase()} before sharing the meal.`
      );
      return;
    }

    const invalidItems = sourceItems.filter(
      (item) => !isStructuredPlannedFood(item)
    );

    if (invalidItems.length > 0) {
      Alert.alert(
        'Food needs to be re-added',
        `${invalidItems.map((item) => item.name).join(', ')} was saved before the nutrition-aware meal planner was added. Remove that item and add it again through USDA so Parker Fitness has a serving amount and nutrition data.`
      );
      return;
    }

    const existingSharedMealId =
      sourceItems.find((item) => item.sharedMealId)
        ?.sharedMealId;

    const initialAmounts: Record<
      string,
      Record<string, string>
    > = {};

    profiles.forEach((profile) => {
      initialAmounts[String(profile.id)] = {};

      sourceItems.forEach((sourceItem) => {
        let plannedAmount = sourceItem.servingSize;

        if (existingSharedMealId) {
          const matchingSharedItem =
            plannedMeals.find(
              (item) =>
                item.sharedMealId ===
                  existingSharedMealId &&
                item.profileId === profile.id &&
                (
                  item.sharedSourceItemId ===
                    sourceItem.sharedSourceItemId ||
                  item.sharedSourceItemId ===
                    sourceItem.id ||
                  (
                    !item.sharedSourceItemId &&
                    item.usdaFoodId ===
                      sourceItem.usdaFoodId &&
                    item.name === sourceItem.name
                  )
                )
            );

          if (matchingSharedItem) {
            plannedAmount =
              matchingSharedItem.servingSize;
          }
        }

        initialAmounts[String(profile.id)][
          sourceItem.id
        ] = plannedAmount;
      });
    });

    setSharedMealDate(date);
    setSharedMealType(meal);
    setSharedSourceItems(sourceItems);
    setSharedMealName(
      sourceItems.find((item) => item.sharedMealName)
        ?.sharedMealName ??
      `${formatWeekday(date)} ${meal}`
    );
    setSharedAmounts(initialAmounts);
    setSharedMealVisible(true);
  }

  function closeSharedMeal() {
    setSharedMealVisible(false);
    setSharedSourceItems([]);
    setSharedAmounts({});
    setSharedMealName('');
  }

  function changeSharedAmount(
    profileId: ProfileId,
    sourceItemId: string,
    value: string
  ) {
    setSharedAmounts((current) => ({
      ...current,
      [String(profileId)]: {
        ...(current[String(profileId)] ?? {}),
        [sourceItemId]: value,
      },
    }));
  }

  function saveSharedMeal() {
    if (sharedSourceItems.length === 0) {
      return;
    }

    const normalizedName =
      sharedMealName.trim() ||
      `${formatWeekday(sharedMealDate)} ${sharedMealType}`;

    const existingSharedMealId =
      sharedSourceItems.find(
        (item) => item.sharedMealId
      )?.sharedMealId;

    const sharedMealId =
      existingSharedMealId ??
      `shared-${createId()}`;

    const generatedItems: PlannedMeal[] = [];

    for (const profile of profiles) {
      for (const sourceItem of sharedSourceItems) {
        const rawAmount =
          sharedAmounts[String(profile.id)]?.[
            sourceItem.id
          ] ?? '';

        const requestedAmount = Number(rawAmount);
        const sourceAmount = Number(
          sourceItem.servingSize
        );

        if (
          !Number.isFinite(requestedAmount) ||
          requestedAmount < 0 ||
          !Number.isFinite(sourceAmount) ||
          sourceAmount <= 0
        ) {
          Alert.alert(
            'Invalid serving amount',
            `Check ${profile.name}'s amount for ${sourceItem.name}. Use 0 if they will not have that item.`
          );
          return;
        }

        if (requestedAmount === 0) {
          continue;
        }

        const multiplier =
          requestedAmount / sourceAmount;

        const isSourceProfile =
          profile.id === activeProfile;

        generatedItems.push({
          ...sourceItem,
          id: isSourceProfile
            ? sourceItem.id
            : createId(),
          profileId: profile.id,
          servingSize:
            formatNumber(requestedAmount),
          servingUnit:
            getCleanPlannedUnit(
              sourceItem.servingUnit
            ),
          calories: Math.round(
            sourceItem.calories * multiplier
          ),
          protein: roundMacro(
            sourceItem.protein * multiplier
          ),
          carbs: roundMacro(
            sourceItem.carbs * multiplier
          ),
          fat: roundMacro(
            sourceItem.fat * multiplier
          ),
          grams:
            getPlannedGrams(sourceItem) != null
              ? roundMacro(
                  getPlannedGrams(sourceItem)! *
                    multiplier
                )
              : undefined,
          loggedAt: undefined,
          sharedMealId,
          sharedMealName: normalizedName,
          sharedSourceItemId:
            sourceItem.sharedSourceItemId ??
            sourceItem.id,
        });
      }
    }

    const sourceIds = new Set(
      sharedSourceItems.map((item) => item.id)
    );

    setPlannedMeals((current) => {
      const withoutPreviousCopies =
        current.filter((item) => {
          if (sourceIds.has(item.id)) {
            return false;
          }

          if (
            item.sharedMealId === sharedMealId
          ) {
            return false;
          }

          return true;
        });

      return [
        ...withoutPreviousCopies,
        ...generatedItems,
      ];
    });

    closeSharedMeal();

    Alert.alert(
      'Shared meal saved',
      `${normalizedName} now has individualized portions for ${profiles.length} profile${profiles.length === 1 ? '' : 's'}.`
    );
  }

  async function logPlannedMeal(
    date: string,
    meal: MealType
  ) {
    const itemsToLog = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === date &&
        item.meal === meal &&
        !item.loggedAt
    );

    if (itemsToLog.length === 0) {
      Alert.alert(
        'Nothing new to log',
        `${meal} has already been logged or has no planned foods.`
      );
      return;
    }

    Alert.alert(
      `Log ${meal}?`,
      `Add ${itemsToLog.length} planned item${itemsToLog.length === 1 ? '' : 's'} to ${currentProfile?.name ?? 'this profile'}'s actual food log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Meal',
          onPress: async () => {
            try {
              const existingFoods =
                (await loadFoods<LoggedFood>()) ?? [];

              const loggedFoods: LoggedFood[] =
                itemsToLog.map((item) => ({
                  id: createId(),
                  name: item.name,
                  servingSize: item.servingSize,
                  servingUnit: item.servingUnit,
                  calories: item.calories,
                  protein: item.protein,
                  carbs: item.carbs,
                  fat: item.fat,
                  meal: item.meal,
                  date: item.date,
                  profileId: item.profileId,
                  source: item.source,
                  usdaFoodId: item.usdaFoodId,
                }));

              await saveFoods([
                ...existingFoods,
                ...loggedFoods,
              ]);

              if (isSignedInProfile) {
                try {
                  await Promise.all(
                    loggedFoods.map((food) =>
                      syncFoodToCloud(food)
                    )
                  );
                } catch (cloudError) {
                  console.error(
                    'Unable to sync planned meal to cloud:',
                    cloudError
                  );

                  Alert.alert(
                    'Cloud Sync Warning',
                    'The meal was logged on this device, but cloud sync did not complete.'
                  );
                }
              }

              const loggedAt =
                new Date().toISOString();

              const loggedIds =
                new Set(itemsToLog.map((item) => item.id));

              setPlannedMeals((current) =>
                current.map((item) =>
                  loggedIds.has(item.id)
                    ? { ...item, loggedAt }
                    : item
                )
              );

              Alert.alert(
                'Meal logged',
                `${meal} was added to the actual food log.`
              );
            } catch (error) {
              console.error(
                'Unable to log planned meal:',
                error
              );

              Alert.alert(
                'Unable to Log Meal',
                'The planned meal could not be added to the food log.'
              );
            }
          },
        },
      ]
    );
  }

  function clonePlannedItems(
    sourceItems: PlannedMeal[],
    dateOffsetDays: number,
    preserveSharing: boolean
  ) {
    const itemIdMap = new Map<string, string>();
    const sharedMealIdMap = new Map<string, string>();

    sourceItems.forEach((item) => {
      itemIdMap.set(item.id, createId());

      if (
        preserveSharing &&
        item.sharedMealId &&
        !sharedMealIdMap.has(item.sharedMealId)
      ) {
        sharedMealIdMap.set(
          item.sharedMealId,
          createId()
        );
      }
    });

    return sourceItems.map((item) => {
      const copied: PlannedMeal = {
        ...item,
        id: itemIdMap.get(item.id) ?? createId(),
        date: addDays(item.date, dateOffsetDays),
        loggedAt: undefined,
      };

      if (preserveSharing && item.sharedMealId) {
        copied.sharedMealId =
          sharedMealIdMap.get(item.sharedMealId);

        copied.sharedSourceItemId =
          item.sharedSourceItemId
            ? itemIdMap.get(item.sharedSourceItemId)
            : undefined;
      } else {
        copied.sharedMealId = undefined;
        copied.sharedMealName = undefined;
        copied.sharedSourceItemId = undefined;
      }

      return copied;
    });
  }

  function copyPreviousWeek() {
    const previousWeekStart = addDays(
      weekStart,
      -7
    );

    const sourceDates = new Set(
      Array.from({ length: 7 }, (_, index) =>
        addDays(previousWeekStart, index)
      )
    );

    const currentDates = new Set(weekDates);

    const sourceItems = plannedMeals.filter(
      (item) => sourceDates.has(item.date)
    );

    if (sourceItems.length === 0) {
      Alert.alert(
        'Nothing to copy',
        'There are no planned foods in the previous week.'
      );
      return;
    }

    const existingCount = plannedMeals.filter(
      (item) => currentDates.has(item.date)
    ).length;

    const copyIntoWeek = (replaceExisting: boolean) => {
      const copiedItems = clonePlannedItems(
        sourceItems,
        7,
        true
      );

      setPlannedMeals((current) => {
        const base = replaceExisting
          ? current.filter(
              (item) => !currentDates.has(item.date)
            )
          : current;

        return [...base, ...copiedItems];
      });

      Alert.alert(
        'Week copied',
        `${sourceItems.length} planned food${
          sourceItems.length === 1 ? '' : 's'
        } copied into this week for the household.`
      );
    };

    if (existingCount > 0) {
      Alert.alert(
        'This week already has plans',
        'Do you want to add last week to the existing plan or replace this week first?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add',
            onPress: () => copyIntoWeek(false),
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => copyIntoWeek(true),
          },
        ]
      );

      return;
    }

    copyIntoWeek(false);
  }

  function copyPreviousDay(date: string) {
    const sourceDate = addDays(date, -1);

    const sourceItems = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === sourceDate
    );

    if (sourceItems.length === 0) {
      Alert.alert(
        'Nothing to copy',
        `${formatWeekday(sourceDate)} has no planned foods for ${
          currentProfile?.name ?? 'this profile'
        }.`
      );
      return;
    }

    const existingItems = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === date
    );

    const copyIntoDay = (replaceExisting: boolean) => {
      const copiedItems = clonePlannedItems(
        sourceItems,
        1,
        false
      );

      setPlannedMeals((current) => {
        const base = replaceExisting
          ? current.filter(
              (item) =>
                !(
                  item.profileId === activeProfile &&
                  item.date === date
                )
            )
          : current;

        return [...base, ...copiedItems];
      });
    };

    if (existingItems.length > 0) {
      Alert.alert(
        'Day already has plans',
        `Add ${formatWeekday(sourceDate)} to this day or replace the current plan?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add',
            onPress: () => copyIntoDay(false),
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => copyIntoDay(true),
          },
        ]
      );

      return;
    }

    copyIntoDay(false);
  }

  function repeatMealTomorrow(
    date: string,
    meal: MealType
  ) {
    const sourceItems = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === date &&
        item.meal === meal
    );

    if (sourceItems.length === 0) {
      return;
    }

    const targetDate = addDays(date, 1);

    const existingItems = plannedMeals.filter(
      (item) =>
        item.profileId === activeProfile &&
        item.date === targetDate &&
        item.meal === meal
    );

    const copyMeal = (replaceExisting: boolean) => {
      const copiedItems = clonePlannedItems(
        sourceItems,
        1,
        false
      );

      setPlannedMeals((current) => {
        const base = replaceExisting
          ? current.filter(
              (item) =>
                !(
                  item.profileId === activeProfile &&
                  item.date === targetDate &&
                  item.meal === meal
                )
            )
          : current;

        return [...base, ...copiedItems];
      });
    };

    if (existingItems.length > 0) {
      Alert.alert(
        `${meal} already planned`,
        `${formatWeekday(targetDate)} already has ${meal.toLowerCase()} foods. Add these too or replace that meal?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add',
            onPress: () => copyMeal(false),
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => copyMeal(true),
          },
        ]
      );

      return;
    }

    copyMeal(false);
  }

  function toggleGroceryItem(id: string) {
    setGroceryChecked((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function addManualGroceryItem() {
    const name = manualGroceryName.trim();

    if (!name) {
      Alert.alert(
        'Item name required',
        'Enter a grocery item first.'
      );
      return;
    }

    setManualGroceryItems((current) => [
      ...current,
      {
        id: createId(),
        name,
        quantity:
          manualGroceryQuantity.trim() || '1',
        category: manualGroceryCategory,
      },
    ]);

    setManualGroceryName('');
    setManualGroceryQuantity('');
    setManualGroceryCategory('Other');
  }

  function removeManualGroceryItem(
    groceryId: string
  ) {
    const rawId = groceryId.replace(
      /^manual\|/,
      ''
    );

    setManualGroceryItems((current) =>
      current.filter(
        (item) => item.id !== rawId
      )
    );

    setGroceryChecked((current) => {
      const next = { ...current };
      delete next[groceryId];
      return next;
    });
  }

  function clearGroceryChecks() {
    const idsForWeek = new Set(
      groceryItems.map((item) => item.id)
    );

    setGroceryChecked((current) => {
      const next = { ...current };

      idsForWeek.forEach((id) => {
        delete next[id];
      });

      return next;
    });
  }

  function deletePlannedMeal(id: string) {
    Alert.alert(
      'Remove planned food?',
      'This only removes it from the meal plan. It does not affect logged nutrition.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            setPlannedMeals((current) =>
              current.filter((item) => item.id !== id)
            ),
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
      <Text style={styles.title}>Meal Plan</Text>
      <Text style={styles.subtitle}>
        Plan the week without changing your logged nutrition.
      </Text>

      <View style={styles.profileCard}>
        <Text style={styles.label}>ACTIVE PROFILE</Text>

        <View style={styles.profileSelector}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={[
                styles.profileButton,
                activeProfile === profile.id &&
                  styles.profileButtonActive,
              ]}
              onPress={() => changeProfile(profile.id)}
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
          Planning for {currentProfile?.name ?? 'profile'}
        </Text>
      </View>

      <View style={styles.weekCard}>
        <Pressable
          style={styles.weekArrow}
          onPress={() => changeWeek(-7)}
        >
          <Text style={styles.weekArrowText}>‹</Text>
        </Pressable>

        <View style={styles.weekCenter}>
          <Text style={styles.label}>WEEK OF</Text>
          <Text style={styles.weekText}>
            {formatDisplayDate(weekStart)}
          </Text>
        </View>

        <Pressable
          style={styles.weekArrow}
          onPress={() => changeWeek(7)}
        >
          <Text style={styles.weekArrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekUtilityRow}>
        <Pressable
          style={styles.weekUtilityButton}
          onPress={() =>
            setWeekStart(getMonday(getTodayDate()))
          }
        >
          <Text style={styles.weekUtilityButtonText}>
            This Week
          </Text>
        </Pressable>

        <Pressable
          style={styles.weekUtilityButton}
          onPress={copyPreviousWeek}
        >
          <Text style={styles.weekUtilityButtonText}>
            Copy Last Week
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.groceryButton}
        onPress={() => setGroceryVisible(true)}
      >
        <View>
          <Text style={styles.groceryButtonLabel}>
            HOUSEHOLD
          </Text>
          <Text style={styles.groceryButtonText}>
            🛒 Grocery List
          </Text>
        </View>

        <View style={styles.groceryButtonCount}>
          <Text style={styles.groceryButtonCountText}>
            {groceryCheckedCount}/{groceryItems.length}
          </Text>
        </View>
      </Pressable>

      {weekDates.map((date) => (
        <DayCard
          key={date}
          date={date}
          profileId={activeProfile}
          plannedMeals={plannedMeals}
          onAdd={openFoodPlanner}
          onDelete={deletePlannedMeal}
          onLogMeal={logPlannedMeal}
          onShareMeal={openSharedMeal}
          onCopyPreviousDay={copyPreviousDay}
          onRepeatMealTomorrow={repeatMealTomorrow}
        />
      ))}
    </ScrollView>

    <Modal
      visible={plannerModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeFoodPlanner}
    >
      <ScrollView
        style={styles.modalScreen}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.modalTitle}>
          Plan Food
        </Text>

        <Text style={styles.modalMeta}>
          {currentProfile?.name ?? 'Profile'} •{' '}
          {planningMeal} •{' '}
          {formatDisplayDate(planningDate)}
        </Text>

        {!selectedFood ? (
          <>
            <Text style={styles.inputLabel}>
              Search USDA
            </Text>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ground turkey, rice, yogurt..."
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

            {searchResults.map((food) => (
              <Pressable
                key={food.id}
                style={styles.resultCard}
                onPress={() => chooseFood(food)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {food.name}
                  </Text>

                  {food.brand ? (
                    <Text style={styles.resultBrand}>
                      {food.brand}
                    </Text>
                  ) : null}

                  <Text style={styles.resultNutrition}>
                    Per 100 g: {food.calories} cal •{' '}
                    {food.protein}g protein •{' '}
                    {food.carbs}g carbs •{' '}
                    {food.fat}g fat
                  </Text>
                </View>

                <Text style={styles.resultArrow}>›</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <View style={styles.selectedFoodCard}>
              <Text style={styles.selectedFoodName}>
                {selectedFood.name}
              </Text>

              {selectedFood.brand ? (
                <Text style={styles.resultBrand}>
                  {selectedFood.brand}
                </Text>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>
              How much are you planning?
            </Text>

            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              placeholderTextColor="#9AA39E"
              keyboardType="decimal-pad"
            />

            <View style={styles.servingButtons}>
              {findServingOptionForChoice(
                selectedFood.servingOptions ?? [],
                'cup'
              ) ? (
                <ServingButton
                  label="Cups"
                  active={servingChoice === 'cup'}
                  onPress={() =>
                    changeServingChoice('cup')
                  }
                />
              ) : null}

              <ServingButton
                label="Grams"
                active={servingChoice === 'g'}
                onPress={() =>
                  changeServingChoice('g')
                }
              />

              <ServingButton
                label="Ounces"
                active={servingChoice === 'oz'}
                onPress={() =>
                  changeServingChoice('oz')
                }
              />

              {findServingOptionForChoice(
                selectedFood.servingOptions ?? [],
                'unit'
              ) ? (
                <ServingButton
                  label="1 Unit"
                  active={servingChoice === 'unit'}
                  onPress={() =>
                    changeServingChoice('unit')
                  }
                />
              ) : null}
            </View>

            {selectedServingOption ? (
              <Text style={styles.servingExplanation}>
                USDA measure: {selectedServingOption.label} ={' '}
                {roundMacro(
                  selectedServingOption.gramWeight
                )} g
              </Text>
            ) : null}

            {selectedNutrition ? (
              <View style={styles.nutritionPreview}>
                <Text style={styles.previewLabel}>
                  PLANNED NUTRITION
                </Text>

                <Text style={styles.previewCalories}>
                  {selectedNutrition.calories} calories
                </Text>

                <Text style={styles.previewMacros}>
                  {selectedNutrition.protein}g protein •{' '}
                  {selectedNutrition.carbs}g carbs •{' '}
                  {selectedNutrition.fat}g fat
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.saveButton}
              onPress={savePlannedFood}
              disabled={!selectedNutrition}
            >
              <Text style={styles.saveButtonText}>
                Add to Meal Plan
              </Text>
            </Pressable>

            <Pressable
              style={styles.changeFoodButton}
              onPress={() => {
                setSelectedFood(null);
                setSelectedServingOption(null);
              }}
            >
              <Text style={styles.changeFoodText}>
                Choose Different Food
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={styles.cancelButton}
          onPress={closeFoodPlanner}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>

    <Modal
      visible={sharedMealVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeSharedMeal}
    >
      <ScrollView
        style={styles.modalScreen}
        contentContainerStyle={[
          styles.modalContent,
          styles.sharedModalContent,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.modalTitle}>
          Shared Meal
        </Text>

        <Text style={styles.modalMeta}>
          {sharedMealType} •{' '}
          {formatDisplayDate(sharedMealDate)}
        </Text>

        <Text style={styles.sharedIntro}>
          Plan this meal once, then set how much each
          profile will have. Use 0 for an item that a
          person will not eat.
        </Text>

        <Text style={styles.inputLabel}>
          Meal name
        </Text>

        <TextInput
          style={styles.amountInput}
          value={sharedMealName}
          onChangeText={setSharedMealName}
          placeholder="Example: Turkey taco dinner"
          placeholderTextColor="#9AA39E"
        />

        {profiles.map((profile) => (
          <View
            key={profile.id}
            style={styles.sharedProfileCard}
          >
            <View style={styles.sharedProfileHeader}>
              <Text style={styles.sharedProfileName}>
                {profile.name}
              </Text>

              {profile.id === activeProfile ? (
                <Text style={styles.sourceProfileBadge}>
                  SOURCE
                </Text>
              ) : null}
            </View>

            {sharedSourceItems.map((item) => {
              const currentAmount =
                sharedAmounts[
                  String(profile.id)
                ]?.[item.id] ??
                item.servingSize;

              const sourceAmount =
                Number(item.servingSize);

              const plannedAmount =
                Number(currentAmount);

              const hasValidNutrition =
                isStructuredPlannedFood(item);

              const multiplier =
                hasValidNutrition &&
                Number.isFinite(plannedAmount) &&
                Number.isFinite(sourceAmount) &&
                sourceAmount > 0
                  ? plannedAmount / sourceAmount
                  : 0;

              const previewCalories =
                hasValidNutrition
                  ? Math.round(
                      item.calories * multiplier
                    )
                  : 0;

              const previewProtein =
                hasValidNutrition
                  ? roundMacro(
                      item.protein * multiplier
                    )
                  : 0;

              return (
                <View
                  key={`${profile.id}-${item.id}`}
                  style={styles.sharedFoodRow}
                >
                  <View style={styles.sharedFoodHeader}>
                    <View style={styles.sharedFoodNameWrap}>
                      <Text style={styles.sharedFoodName}>
                        {item.name}
                      </Text>

                      <Text style={styles.sharedFoodUnit}>
                        {getCleanPlannedUnit(
                          item.servingUnit
                        )}
                      </Text>
                    </View>

                    <Text style={styles.sharedFoodPreview}>
                      {hasValidNutrition
                        ? `${previewCalories} cal • ${previewProtein}g P`
                        : 'Needs food details'}
                    </Text>
                  </View>

                  <TextInput
                    style={[
                      styles.sharedAmountInput,
                      !hasValidNutrition &&
                        styles.sharedAmountInputDisabled,
                    ]}
                    value={
                      hasValidNutrition
                        ? currentAmount
                        : ''
                    }
                    onChangeText={(value) =>
                      changeSharedAmount(
                        profile.id,
                        item.id,
                        value
                      )
                    }
                    placeholder={
                      hasValidNutrition
                        ? 'Amount'
                        : 'Re-add food first'
                    }
                    placeholderTextColor="#9AA39E"
                    keyboardType="decimal-pad"
                    editable={hasValidNutrition}
                  />
                </View>
              );
            })}
          </View>
        ))}

        <Pressable
          style={styles.saveButton}
          onPress={saveSharedMeal}
        >
          <Text style={styles.saveButtonText}>
            Save Shared Portions
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={closeSharedMeal}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>

    <Modal
      visible={groceryVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() =>
        setGroceryVisible(false)
      }
    >
      <ScrollView
        style={styles.modalScreen}
        contentContainerStyle={[
          styles.modalContent,
          styles.groceryModalContent,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.modalTitle}>
          Grocery List
        </Text>

        <Text style={styles.modalMeta}>
          Household • Week of{' '}
          {formatDisplayDate(weekStart)}
        </Text>

        <View style={styles.grocerySummaryCard}>
          <View>
            <Text style={styles.grocerySummaryLabel}>
              WEEKLY SHOPPING
            </Text>

            <Text style={styles.grocerySummaryValue}>
              {groceryItems.length} item
              {groceryItems.length === 1
                ? ''
                : 's'}
            </Text>
          </View>

          <Text style={styles.grocerySummaryProgress}>
            {groceryCheckedCount} checked
          </Text>
        </View>

        {groceryItems.length === 0 ? (
          <View style={styles.emptyGroceryCard}>
            <Text style={styles.emptyGroceryTitle}>
              Nothing to shop for yet
            </Text>

            <Text style={styles.emptyGroceryText}>
              Add foods to this week's meal plan or add a household item below.
            </Text>
          </View>
        ) : (
          groceryByCategory.map((group) => (
            <View
              key={group.category}
              style={styles.groceryCategorySection}
            >
              <Text style={styles.groceryCategoryTitle}>
                {getCategoryIcon(group.category)}{' '}
                {group.category}
              </Text>

              {group.items.map((item) => {
                const checked =
                  Boolean(groceryChecked[item.id]);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.groceryRow,
                      checked &&
                        styles.groceryRowChecked,
                    ]}
                  >
                    <Pressable
                      style={styles.groceryMainPress}
                      onPress={() =>
                        toggleGroceryItem(item.id)
                      }
                    >
                      <View
                        style={[
                          styles.groceryCheckbox,
                          checked &&
                            styles.groceryCheckboxChecked,
                        ]}
                      >
                        <Text
                          style={styles.groceryCheckmark}
                        >
                          {checked ? '✓' : ''}
                        </Text>
                      </View>

                      <View style={styles.groceryInfo}>
                        <Text
                          style={[
                            styles.groceryName,
                            checked &&
                              styles.groceryNameChecked,
                          ]}
                        >
                          {item.name}
                        </Text>

                        <Text style={styles.groceryQuantity}>
                          {item.quantityLabel}
                        </Text>

                        {item.manual ? (
                          <Text style={styles.groceryUses}>
                            Manually added household item
                          </Text>
                        ) : (
                          <Text style={styles.groceryUses}>
                            Used in {item.uses} planned item
                            {item.uses === 1 ? '' : 's'} •{' '}
                            {item.profileCount} profile
                            {item.profileCount === 1
                              ? ''
                              : 's'}
                          </Text>
                        )}
                      </View>
                    </Pressable>

                    {item.manual ? (
                      <Pressable
                        style={styles.manualRemoveButton}
                        onPress={() =>
                          removeManualGroceryItem(item.id)
                        }
                        hitSlop={8}
                      >
                        <Text style={styles.manualRemoveText}>
                          Remove
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={styles.manualGroceryCard}>
          <Text style={styles.manualGroceryTitle}>
            + Add Household Item
          </Text>

          <Text style={styles.manualGroceryHelp}>
            Add things not tied to a meal plan, like paper towels, coffee, or cleaning supplies.
          </Text>

          <TextInput
            style={styles.amountInput}
            value={manualGroceryName}
            onChangeText={setManualGroceryName}
            placeholder="Item name"
            placeholderTextColor="#9AA39E"
          />

          <TextInput
            style={[
              styles.amountInput,
              styles.manualQuantityInput,
            ]}
            value={manualGroceryQuantity}
            onChangeText={setManualGroceryQuantity}
            placeholder="Quantity (example: 2 boxes)"
            placeholderTextColor="#9AA39E"
          />

          <View style={styles.groceryCategoryPicker}>
            {groceryCategories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.groceryCategoryButton,
                  manualGroceryCategory === category &&
                    styles.groceryCategoryButtonActive,
                ]}
                onPress={() =>
                  setManualGroceryCategory(category)
                }
              >
                <Text
                  style={[
                    styles.groceryCategoryButtonText,
                    manualGroceryCategory === category &&
                      styles.groceryCategoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.addManualButton}
            onPress={addManualGroceryItem}
          >
            <Text style={styles.addManualButtonText}>
              Add to Grocery List
            </Text>
          </Pressable>
        </View>

        {groceryItems.length > 0 ? (
          <Pressable
            style={styles.clearChecksButton}
            onPress={clearGroceryChecks}
          >
            <Text style={styles.clearChecksText}>
              Clear Checkmarks
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.saveButton}
          onPress={() =>
            setGroceryVisible(false)
          }
        >
          <Text style={styles.saveButtonText}>
            Done
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>
    </>
  );
}

type DayCardProps = {
  date: string;
  profileId: ProfileId;
  plannedMeals: PlannedMeal[];
  onAdd: (date: string, meal: MealType) => void;
  onDelete: (id: string) => void;
  onLogMeal: (date: string, meal: MealType) => void;
  onShareMeal: (date: string, meal: MealType) => void;
  onCopyPreviousDay: (date: string) => void;
  onRepeatMealTomorrow: (
    date: string,
    meal: MealType
  ) => void;
};

function DayCard({
  date,
  profileId,
  plannedMeals,
  onAdd,
  onDelete,
  onLogMeal,
  onShareMeal,
  onCopyPreviousDay,
  onRepeatMealTomorrow,
}: DayCardProps) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayName}>
            {formatWeekday(date)}
          </Text>
          <Text style={styles.dayDate}>
            {formatShortDate(date)}
          </Text>
        </View>

        <Pressable
          style={styles.copyDayButton}
          onPress={() => onCopyPreviousDay(date)}
        >
          <Text style={styles.copyDayButtonText}>
            Copy Previous Day
          </Text>
        </Pressable>
      </View>

      <DayPlannedTotals
        items={plannedMeals.filter(
          (item) =>
            item.profileId === profileId &&
            item.date === date
        )}
      />

      {mealTypes.map((meal) => {
        const items = plannedMeals.filter(
          (item) =>
            item.profileId === profileId &&
            item.date === date &&
            item.meal === meal
        );

        return (
          <MealPlannerRow
            key={meal}
            date={date}
            meal={meal}
            items={items}
            onAdd={() => onAdd(date, meal)}
            onDelete={onDelete}
            onLogMeal={() => onLogMeal(date, meal)}
            onShareMeal={() => onShareMeal(date, meal)}
            onRepeatTomorrow={() =>
              onRepeatMealTomorrow(date, meal)
            }
          />
        );
      })}
    </View>
  );
}

type MealPlannerRowProps = {
  date: string;
  meal: MealType;
  items: PlannedMeal[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onLogMeal: () => void;
  onShareMeal: () => void;
  onRepeatTomorrow: () => void;
};

function MealPlannerRow({
  meal,
  items,
  onAdd,
  onDelete,
  onLogMeal,
  onShareMeal,
  onRepeatTomorrow,
}: MealPlannerRowProps) {
  const mealCalories = Math.round(
    items.reduce(
      (total, item) => total + item.calories,
      0
    )
  );

  const unloggedCount = items.filter(
    (item) => !item.loggedAt
  ).length;

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealTitleRow}>
        <Text style={styles.mealTitle}>{meal}</Text>

        <Text style={styles.mealCalories}>
          {mealCalories} cal planned
        </Text>
      </View>

      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.plannedRow,
            item.loggedAt && styles.plannedRowLogged,
          ]}
        >
          <View style={styles.plannedInfo}>
            <Text style={styles.plannedFood}>
              {item.name}
            </Text>

            <Text style={styles.plannedServing}>
              {item.servingSize} {item.servingUnit}
            </Text>

            <Text style={styles.plannedMacros}>
              {item.calories} cal •{' '}
              {item.protein}g protein •{' '}
              {item.carbs}g carbs •{' '}
              {item.fat}g fat
            </Text>

            {item.loggedAt ? (
              <Text style={styles.loggedLabel}>
                ✓ Logged
              </Text>
            ) : null}

            {item.sharedMealId ? (
              <Text style={styles.sharedLabel}>
                👥 {item.sharedMealName ?? 'Shared meal'}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => onDelete(item.id)}
            hitSlop={8}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        style={[
          styles.shareMealButton,
          items.length === 0 &&
            styles.shareMealButtonDisabled,
        ]}
        onPress={onShareMeal}
        disabled={items.length === 0}
      >
        <Text
          style={[
            styles.shareMealButtonText,
            items.length === 0 &&
              styles.shareMealButtonTextDisabled,
          ]}
        >
          {items.length === 0
            ? '👥 Add Food Before Sharing'
            : '👥 Share / Adjust Portions'}
        </Text>
      </Pressable>

      {items.length > 0 ? (
        <>
          <Pressable
            style={[
              styles.logMealButton,
              unloggedCount === 0 &&
                styles.logMealButtonDisabled,
            ]}
            onPress={onLogMeal}
            disabled={unloggedCount === 0}
          >
            <Text style={styles.logMealButtonText}>
              {unloggedCount === 0
                ? `${meal} Logged`
                : `Log ${meal} (${unloggedCount})`}
            </Text>
          </Pressable>

          <Pressable
            style={styles.repeatMealButton}
            onPress={onRepeatTomorrow}
          >
            <Text style={styles.repeatMealButtonText}>
              ↻ Repeat Tomorrow
            </Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        style={styles.addFoodButton}
        onPress={onAdd}
      >
        <Text style={styles.addFoodButtonText}>
          + Add Food
        </Text>
      </Pressable>
    </View>
  );
}

type DayPlannedTotalsProps = {
  items: PlannedMeal[];
};

function DayPlannedTotals({
  items,
}: DayPlannedTotalsProps) {
  const calories = Math.round(
    items.reduce(
      (total, item) => total + item.calories,
      0
    )
  );

  const protein = roundMacro(
    items.reduce(
      (total, item) => total + item.protein,
      0
    )
  );

  const carbs = roundMacro(
    items.reduce(
      (total, item) => total + item.carbs,
      0
    )
  );

  const fat = roundMacro(
    items.reduce(
      (total, item) => total + item.fat,
      0
    )
  );

  return (
    <View style={styles.dayTotalsCard}>
      <View>
        <Text style={styles.dayTotalsLabel}>
          PLANNED
        </Text>
        <Text style={styles.dayTotalsCalories}>
          {calories} cal
        </Text>
      </View>

      <Text style={styles.dayTotalsMacros}>
        {protein}g P • {carbs}g C • {fat}g F
      </Text>
    </View>
  );
}

type ServingButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function ServingButton({
  label,
  active,
  onPress,
}: ServingButtonProps) {
  return (
    <Pressable
      style={[
        styles.servingButton,
        active && styles.servingButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.servingButtonText,
          active && styles.servingButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getPlannedGrams(
  item: PlannedMeal
): number | null {
  if (
    item.grams != null &&
    Number.isFinite(item.grams) &&
    item.grams > 0
  ) {
    return item.grams;
  }

  const amount = Number(item.servingSize);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const unit =
    getCleanPlannedUnit(item.servingUnit);

  if (unit === 'g') {
    return amount;
  }

  if (unit === 'oz') {
    return amount * OUNCES_TO_GRAMS;
  }

  return null;
}

function groceryFoodKey(
  item: PlannedMeal
) {
  return (
    item.usdaFoodId ??
    item.name.trim().toLowerCase()
  );
}

function buildGroceryQuantityLabel(
  items: PlannedMeal[]
) {
  const unitGroups = new Map<string, number>();

  items.forEach((item) => {
    const amount = Number(item.servingSize);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    const unit =
      getCleanPlannedUnit(item.servingUnit);

    unitGroups.set(
      unit,
      (unitGroups.get(unit) ?? 0) + amount
    );
  });

  if (unitGroups.size === 1) {
    const [unit, amount] =
      Array.from(unitGroups.entries())[0];

    return `${formatNumber(
      roundMacro(amount)
    )} ${formatGroceryUnit(
      unit,
      amount
    )}`;
  }

  const grams = items
    .map(getPlannedGrams)
    .filter(
      (value): value is number =>
        value != null
    );

  if (
    grams.length === items.length &&
    grams.length > 0
  ) {
    const totalGrams = grams.reduce(
      (total, value) => total + value,
      0
    );

    const totalOunces =
      totalGrams / OUNCES_TO_GRAMS;

    if (totalOunces >= 16) {
      const pounds = totalOunces / 16;

      return `${formatNumber(
        roundMacro(pounds)
      )} lb (${Math.round(totalGrams)} g)`;
    }

    return `${formatNumber(
      roundMacro(totalOunces)
    )} oz (${Math.round(totalGrams)} g)`;
  }

  return Array.from(unitGroups.entries())
    .map(
      ([unit, amount]) =>
        `${formatNumber(
          roundMacro(amount)
        )} ${formatGroceryUnit(
          unit,
          amount
        )}`
    )
    .join(' + ');
}

function formatGroceryUnit(
  unit: string,
  amount: number
) {
  if (unit === 'cup') {
    return amount === 1 ? 'cup' : 'cups';
  }

  if (unit === 'piece') {
    return amount === 1 ? 'piece' : 'pieces';
  }

  if (unit === 'slice') {
    return amount === 1 ? 'slice' : 'slices';
  }

  if (unit === 'egg') {
    return amount === 1 ? 'egg' : 'eggs';
  }

  if (unit === 'unit') {
    return amount === 1 ? 'unit' : 'units';
  }

  return unit;
}

function getGroceryCategory(
  name: string
): GroceryCategory {
  const value = name.toLowerCase();

  const proteinWords = [
    'chicken',
    'turkey',
    'beef',
    'pork',
    'steak',
    'salmon',
    'tuna',
    'fish',
    'shrimp',
    'egg',
    'bison',
    'lamb',
    'sausage',
    'ground meat',
  ];

  const produceWords = [
    'apple',
    'banana',
    'berry',
    'berries',
    'orange',
    'grape',
    'melon',
    'avocado',
    'lettuce',
    'spinach',
    'broccoli',
    'asparagus',
    'bean',
    'pepper',
    'onion',
    'tomato',
    'potato',
    'carrot',
    'cucumber',
    'zucchini',
    'fruit',
    'vegetable',
  ];

  const dairyWords = [
    'milk',
    'cheese',
    'yogurt',
    'cottage cheese',
    'cream',
    'butter',
  ];

  const frozenWords = [
    'frozen',
    'ice cream',
  ];

  const pantryWords = [
    'rice',
    'pasta',
    'bread',
    'tortilla',
    'oat',
    'cereal',
    'granola',
    'flour',
    'sugar',
    'oil',
    'sauce',
    'seasoning',
    'spice',
    'peanut butter',
    'beans',
    'lentil',
    'quinoa',
  ];

  if (
    proteinWords.some((word) =>
      value.includes(word)
    )
  ) {
    return 'Protein';
  }

  if (
    produceWords.some((word) =>
      value.includes(word)
    )
  ) {
    return 'Produce';
  }

  if (
    dairyWords.some((word) =>
      value.includes(word)
    )
  ) {
    return 'Dairy';
  }

  if (
    frozenWords.some((word) =>
      value.includes(word)
    )
  ) {
    return 'Frozen';
  }

  if (
    pantryWords.some((word) =>
      value.includes(word)
    )
  ) {
    return 'Pantry';
  }

  return 'Other';
}

function getCategoryIcon(
  category: GroceryCategory
) {
  if (category === 'Protein') return '🥩';
  if (category === 'Produce') return '🥦';
  if (category === 'Dairy') return '🥛';
  if (category === 'Pantry') return '🥫';
  if (category === 'Frozen') return '❄️';
  return '🛒';
}

function buildGroceryItems(
  items: PlannedMeal[],
  weekStart: string
): GroceryItem[] {
  const groups = new Map<
    string,
    PlannedMeal[]
  >();

  items.forEach((item) => {
    const key = groceryFoodKey(item);

    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([foodKey, groupedItems]) => {
      const quantityLabel =
        buildGroceryQuantityLabel(
          groupedItems
        );

      const profileIds = new Set(
        groupedItems.map(
          (item) => String(item.profileId)
        )
      );

      const name =
        groupedItems[0]?.name ??
        'Food';

      const id = [
        weekStart,
        foodKey,
        quantityLabel,
      ].join('|');

      return {
        id,
        foodKey,
        name,
        quantityLabel,
        uses: groupedItems.length,
        profileCount: profileIds.size,
        category: getGroceryCategory(name),
      };
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );
}

function isStructuredPlannedFood(
  item: PlannedMeal
) {
  const servingSize = Number(item.servingSize);

  return (
    Number.isFinite(servingSize) &&
    servingSize > 0 &&
    typeof item.servingUnit === 'string' &&
    item.servingUnit.trim().length > 0 &&
    Number.isFinite(item.calories) &&
    Number.isFinite(item.protein) &&
    Number.isFinite(item.carbs) &&
    Number.isFinite(item.fat)
  );
}

function getCleanPlannedUnit(
  unit: string
) {
  const normalized = (unit ?? '')
    .trim()
    .toLowerCase();

  if (normalized.includes('cup')) {
    return 'cup';
  }

  if (
    normalized === 'g' ||
    normalized.includes('gram')
  ) {
    return 'g';
  }

  if (
    normalized === 'oz' ||
    normalized.includes('ounce') ||
    normalized.includes('onz')
  ) {
    return 'oz';
  }

  if (
    normalized.includes('slice')
  ) {
    return 'slice';
  }

  if (
    normalized.includes('piece')
  ) {
    return 'piece';
  }

  if (
    normalized.includes('egg')
  ) {
    return 'egg';
  }

  if (
    normalized.includes('unit')
  ) {
    return 'unit';
  }

  return unit?.trim() || 'unit';
}

function getPlannedServingUnitLabel(
  choice: ServingChoice,
  option: FoodServingOption | null
) {
  if (choice === 'cup') {
    return 'cup';
  }

  if (choice === 'g') {
    return 'g';
  }

  if (choice === 'oz') {
    return 'oz';
  }

  if (option) {
    return getCleanPlannedUnit(
      option.unit || option.label
    );
  }

  return 'unit';
}

function servingOptionText(
  option: FoodServingOption
) {
  return `${option.label} ${option.unit}`.toLowerCase();
}

function getHouseholdChoiceType(
  option: FoodServingOption
): 'cup' | 'unit' {
  return servingOptionText(option).includes('cup')
    ? 'cup'
    : 'unit';
}

function findServingOptionForChoice(
  options: FoodServingOption[],
  choice: ServingChoice
): FoodServingOption | null {
  if (choice === 'cup') {
    return (
      options.find((option) =>
        servingOptionText(option).includes('cup')
      ) ?? null
    );
  }

  if (choice === 'unit') {
    const excluded = [
      'cup',
      'tbsp',
      'tablespoon',
      'tsp',
      'teaspoon',
      'ml',
      'liter',
      'fluid ounce',
      ' oz',
      'ounce',
      'ounces',
      'onz',
      'gram',
      'grams',
      ' g ',
    ];

    return (
      options.find((option) => {
        const text = servingOptionText(option);

        return !excluded.some((word) =>
          text.includes(word)
        );
      }) ?? null
    );
  }

  return null;
}

function getPreferredHouseholdServing(
  options: FoodServingOption[]
) {
  return (
    findServingOptionForChoice(options, 'cup') ??
    findServingOptionForChoice(options, 'unit')
  );
}

function convertAmountToGrams(
  amount: number,
  choice: ServingChoice,
  option: FoodServingOption | null
) {
  if (choice === 'g') {
    return amount;
  }

  if (choice === 'oz') {
    return amount * OUNCES_TO_GRAMS;
  }

  if (
    option &&
    option.gramWeight > 0 &&
    option.amount > 0
  ) {
    return (
      amount *
      option.gramWeight /
      option.amount
    );
  }

  return null;
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : roundMacro(value).toString();
}

function getMonday(dateString: string) {
  const date = parseLocalDate(dateString);
  const day = date.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);
  return formatLocalDate(date);
}

function addDays(dateString: string, days: number) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWeekday(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
  });
}

function formatShortDate(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
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

  label: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  profileSelector: {
    flexDirection: 'row',
    backgroundColor: '#EDF1EF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginTop: 10,
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

  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  weekArrow: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekArrowText: {
    color: '#2D6B48',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
  },

  weekCenter: {
    flex: 1,
    alignItems: 'center',
  },

  weekText: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  weekUtilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },

  weekUtilityButton: {
    flex: 1,
    backgroundColor: '#EDF4EF',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE7E1',
  },

  weekUtilityButtonText: {
    color: '#2D6B48',
    fontSize: 12,
    fontWeight: '900',
  },

  groceryButton: {
    backgroundColor: '#1D4A32',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  groceryButtonLabel: {
    color: '#C8D6CE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  groceryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  groceryButtonCount: {
    minWidth: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },

  groceryButtonCountText: {
    color: '#1D4A32',
    fontSize: 12,
    fontWeight: '900',
  },

  groceryModalContent: {
    paddingBottom: 120,
  },

  grocerySummaryCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  grocerySummaryLabel: {
    color: '#C8D6CE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  grocerySummaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },

  grocerySummaryProgress: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  emptyGroceryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  emptyGroceryTitle: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyGroceryText: {
    color: '#6D7972',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  groceryCategorySection: {
    marginTop: 14,
  },

  groceryCategoryTitle: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },

  groceryRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  groceryMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  groceryRowChecked: {
    opacity: 0.58,
  },

  groceryCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2D6B48',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  groceryCheckboxChecked: {
    backgroundColor: '#2D6B48',
  },

  groceryCheckmark: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  groceryInfo: {
    flex: 1,
  },

  groceryName: {
    color: '#17211C',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },

  groceryNameChecked: {
    textDecorationLine: 'line-through',
  },

  groceryQuantity: {
    color: '#2D6B48',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },

  groceryUses: {
    color: '#77817C',
    fontSize: 10,
    marginTop: 5,
  },

  manualRemoveButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  manualRemoveText: {
    color: '#B84A4A',
    fontSize: 11,
    fontWeight: '800',
  },

  manualGroceryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  manualGroceryTitle: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
  },

  manualGroceryHelp: {
    color: '#6D7972',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },

  manualQuantityInput: {
    marginTop: 10,
  },

  groceryCategoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  groceryCategoryButton: {
    width: '31%',
    backgroundColor: '#EDF1EF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  groceryCategoryButtonActive: {
    backgroundColor: '#2D6B48',
  },

  groceryCategoryButtonText: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '800',
  },

  groceryCategoryButtonTextActive: {
    color: '#FFFFFF',
  },

  addManualButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },

  addManualButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  clearChecksButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },

  clearChecksText: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '800',
  },

  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEA',
  },

  copyDayButton: {
    backgroundColor: '#EDF4EF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  copyDayButtonText: {
    color: '#2D6B48',
    fontSize: 10,
    fontWeight: '900',
  },

  dayName: {
    color: '#17211C',
    fontSize: 21,
    fontWeight: '900',
  },

  dayDate: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '800',
  },

  mealSection: {
    paddingTop: 16,
    paddingBottom: 4,
  },

  mealTitle: {
    color: '#17211C',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },

  plannedRow: {
    backgroundColor: '#EDF4EF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  plannedFood: {
    flex: 1,
    color: '#17211C',
    fontSize: 14,
    fontWeight: '700',
  },

  removeText: {
    color: '#B84A4A',
    fontSize: 12,
    fontWeight: '800',
  },

  dayTotalsCard: {
    backgroundColor: '#F4F6F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dayTotalsLabel: {
    color: '#557063',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  dayTotalsCalories: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  dayTotalsMacros: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '800',
  },

  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  mealCalories: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '800',
  },

  plannedInfo: {
    flex: 1,
    paddingRight: 10,
  },

  plannedServing: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  plannedMacros: {
    color: '#77817C',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  plannedRowLogged: {
    opacity: 0.68,
  },

  loggedLabel: {
    color: '#2D6B48',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },

  sharedLabel: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },

  shareMealButton: {
    backgroundColor: '#EDF4EF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DCE4DF',
  },

  shareMealButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '900',
  },

  shareMealButtonDisabled: {
    backgroundColor: '#F1F2F1',
    borderColor: '#E2E7E4',
  },

  shareMealButtonTextDisabled: {
    color: '#9AA39E',
  },

  logMealButton: {
    backgroundColor: '#1D4A32',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },

  logMealButtonDisabled: {
    backgroundColor: '#9AA39E',
  },

  logMealButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  repeatMealButton: {
    borderWidth: 1,
    borderColor: '#D7E4DC',
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F8FAF9',
  },

  repeatMealButtonText: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '900',
  },

  addFoodButton: {
    backgroundColor: '#EDF4EF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },

  addFoodButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '900',
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

  sharedModalContent: {
    paddingBottom: 260,
  },

  modalTitle: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '900',
  },

  modalMeta: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 12,
  },

  inputLabel: {
    color: '#17211C',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
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
    fontWeight: '700',
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

  resultInfo: {
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

  resultNutrition: {
    color: '#77817C',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  resultArrow: {
    color: '#2D6B48',
    fontSize: 28,
    fontWeight: '700',
  },

  selectedFoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE4DF',
    marginTop: 12,
  },

  selectedFoodName: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
  },

  amountInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#17211C',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  servingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  servingButton: {
    width: '48%',
    backgroundColor: '#EDF1EF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  servingButtonActive: {
    backgroundColor: '#2D6B48',
  },

  servingButtonText: {
    color: '#557063',
    fontSize: 13,
    fontWeight: '800',
  },

  servingButtonTextActive: {
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

  saveButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 24,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  changeFoodButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  changeFoodText: {
    color: '#2D6B48',
    fontSize: 14,
    fontWeight: '800',
  },

  cancelButton: {
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 6,
  },

  cancelButtonText: {
    color: '#6D7972',
    fontSize: 15,
    fontWeight: '700',
  },

  sharedIntro: {
    color: '#6D7972',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 4,
  },

  sharedProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  sharedProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  sharedProfileName: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
  },

  sourceProfileBadge: {
    color: '#2D6B48',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    backgroundColor: '#EDF4EF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  sharedFoodRow: {
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEA',
  },

  sharedFoodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  sharedFoodNameWrap: {
    flex: 1,
  },

  sharedFoodName: {
    color: '#17211C',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },

  sharedFoodUnit: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  sharedFoodPreview: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },

  sharedAmountInput: {
    backgroundColor: '#F4F6F5',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 14,
    minHeight: 50,
    fontSize: 17,
    fontWeight: '800',
    color: '#17211C',
    borderWidth: 1,
    borderColor: '#E2E7E4',
    marginTop: 10,
  },

  sharedAmountInputDisabled: {
    opacity: 0.55,
  },

  addRow: {
    flexDirection: 'row',
    gap: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: '#17211C',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  addButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 12,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
