import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type ServingChoice = 'g' | 'oz' | 'cup' | 'unit';
type IngredientMode = 'closed' | 'usda' | 'manual';

export type RecipeIngredient = {
  id: string;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  grams?: number;
  source: 'usda' | 'manual';
  usdaFoodId?: string;
};

export type SavedRecipe = {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
};

const RECIPES_KEY = '@parker_fitness_recipes';
const OUNCES_TO_GRAMS = 28.3495;

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingRecipeId, setEditingRecipeId] =
    useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  const [recipeName, setRecipeName] = useState('');
  const [recipeServings, setRecipeServings] = useState('4');
  const [recipeNotes, setRecipeNotes] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [editingIngredientId, setEditingIngredientId] =
    useState<string | null>(null);
  const [editingIngredientAmount, setEditingIngredientAmount] =
    useState('');

  const [ingredientMode, setIngredientMode] =
    useState<IngredientMode>('closed');

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

  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('1');
  const [manualUnit, setManualUnit] = useState('serving');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  useEffect(() => {
    async function loadRecipes() {
      try {
        const saved = await AsyncStorage.getItem(RECIPES_KEY);

        if (saved) {
          setRecipes(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Unable to load recipes:', error);
      } finally {
        setLoaded(true);
      }
    }

    loadRecipes();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      RECIPES_KEY,
      JSON.stringify(recipes)
    ).catch((error) => {
      console.error('Unable to save recipes:', error);
    });
  }, [recipes, loaded]);

  const recipeTotals = useMemo(
    () => calculateIngredientTotals(ingredients),
    [ingredients]
  );

  const parsedRecipeServings = Number(recipeServings);

  const perServingNutrition = useMemo(() => {
    if (
      !Number.isFinite(parsedRecipeServings) ||
      parsedRecipeServings <= 0
    ) {
      return null;
    }

    return divideNutrition(
      recipeTotals,
      parsedRecipeServings
    );
  }, [recipeTotals, parsedRecipeServings]);

  const selectedNutrition = useMemo(() => {
    if (!selectedFood) return null;

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
      fiber: roundMacro(
        (selectedFood.fiber ?? 0) *
          multiplier
      ),
      sugar: roundMacro(
        (selectedFood.sugar ?? 0) *
          multiplier
      ),
      sodium: roundMacro(
        (selectedFood.sodium ?? 0) *
          multiplier
      ),
      saturatedFat: roundMacro(
        (selectedFood.saturatedFat ?? 0) *
          multiplier
      ),
      grams: roundMacro(grams),
    };
  }, [
    selectedFood,
    amount,
    servingChoice,
    selectedServingOption,
  ]);

  function resetIngredientForm() {
    setIngredientMode('closed');
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchError('');
    setSelectedFood(null);
    setServingChoice('g');
    setSelectedServingOption(null);
    setAmount('100');

    setManualName('');
    setManualAmount('1');
    setManualUnit('serving');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
  }

  function resetBuilder() {
    setEditingRecipeId(null);
    setRecipeName('');
    setRecipeServings('4');
    setRecipeNotes('');
    setIngredients([]);
    setEditingIngredientId(null);
    setEditingIngredientAmount('');
    resetIngredientForm();
  }

  function startNewRecipe() {
    resetBuilder();
    setBuilderOpen(true);
  }

  function editRecipe(recipe: SavedRecipe) {
    setEditingRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setRecipeServings(
      formatNumber(recipe.servings)
    );
    setRecipeNotes(recipe.notes ?? '');
    setIngredients(recipe.ingredients);
    resetIngredientForm();
    setBuilderOpen(true);
  }

  function closeBuilder() {
    setBuilderOpen(false);
    resetBuilder();
  }

  async function runFoodSearch() {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      Alert.alert(
        'Enter an ingredient',
        'Type an ingredient before searching USDA.'
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
      console.error('Recipe USDA search error:', error);
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
      const detailed =
        await getFoodDetails(food.id);

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
        'Unable to load USDA ingredient details:',
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

  function addUsdaIngredient() {
    if (!selectedFood || !selectedNutrition) {
      Alert.alert(
        'Invalid ingredient',
        'Choose an ingredient and enter a valid amount.'
      );
      return;
    }

    const parsedAmount = Number(amount);

    const ingredient: RecipeIngredient = {
      id: createId(),
      name: selectedFood.name,
      servingSize: formatNumber(parsedAmount),
      servingUnit: getServingUnitLabel(
        servingChoice,
        selectedServingOption
      ),
      calories: selectedNutrition.calories,
      protein: selectedNutrition.protein,
      carbs: selectedNutrition.carbs,
      fat: selectedNutrition.fat,
      fiber: selectedNutrition.fiber,
      sugar: selectedNutrition.sugar,
      sodium: selectedNutrition.sodium,
      saturatedFat:
        selectedNutrition.saturatedFat,
      grams: selectedNutrition.grams,
      source: 'usda',
      usdaFoodId: selectedFood.id,
    };

    setIngredients((current) => [
      ...current,
      ingredient,
    ]);

    resetIngredientForm();
  }

  function addManualIngredient() {
    const parsedAmount = Number(manualAmount);
    const parsedCalories = Number(manualCalories);
    const parsedProtein = Number(manualProtein);
    const parsedCarbs = Number(manualCarbs);
    const parsedFat = Number(manualFat);

    if (!manualName.trim()) {
      Alert.alert(
        'Ingredient name required',
        'Enter an ingredient name.'
      );
      return;
    }

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      Alert.alert(
        'Invalid amount',
        'Enter an amount greater than zero.'
      );
      return;
    }

    if (!manualUnit.trim()) {
      Alert.alert(
        'Unit required',
        'Enter a serving unit.'
      );
      return;
    }

    const nutritionValues = [
      parsedCalories,
      parsedProtein,
      parsedCarbs,
      parsedFat,
    ];

    if (
      nutritionValues.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0
      )
    ) {
      Alert.alert(
        'Invalid nutrition',
        'Enter valid calories and macro values for this ingredient amount.'
      );
      return;
    }

    const ingredient: RecipeIngredient = {
      id: createId(),
      name: manualName.trim(),
      servingSize: formatNumber(parsedAmount),
      servingUnit: manualUnit.trim(),
      calories: Math.round(parsedCalories),
      protein: roundMacro(parsedProtein),
      carbs: roundMacro(parsedCarbs),
      fat: roundMacro(parsedFat),
      source: 'manual',
    };

    setIngredients((current) => [
      ...current,
      ingredient,
    ]);

    resetIngredientForm();
  }

  function startEditingIngredient(
    ingredient: RecipeIngredient
  ) {
    setEditingIngredientId(ingredient.id);
    setEditingIngredientAmount(
      ingredient.servingSize
    );
  }

  function cancelEditingIngredient() {
    setEditingIngredientId(null);
    setEditingIngredientAmount('');
  }

  function saveIngredientAmount(
    ingredient: RecipeIngredient
  ) {
    const oldAmount = Number(
      ingredient.servingSize
    );
    const newAmount = Number(
      editingIngredientAmount
    );

    if (
      !Number.isFinite(newAmount) ||
      newAmount <= 0
    ) {
      Alert.alert(
        'Invalid amount',
        'Enter an amount greater than zero.'
      );
      return;
    }

    if (
      !Number.isFinite(oldAmount) ||
      oldAmount <= 0
    ) {
      Alert.alert(
        'Unable to edit amount',
        'This ingredient does not have a valid original amount. Remove it and add it again.'
      );
      return;
    }

    const multiplier = newAmount / oldAmount;

    setIngredients((current) =>
      current.map((item) =>
        item.id === ingredient.id
          ? {
              ...item,
              servingSize:
                formatNumber(newAmount),
              calories: Math.round(
                item.calories * multiplier
              ),
              protein: roundMacro(
                item.protein * multiplier
              ),
              carbs: roundMacro(
                item.carbs * multiplier
              ),
              fat: roundMacro(
                item.fat * multiplier
              ),
              fiber:
                item.fiber != null
                  ? roundMacro(
                      item.fiber * multiplier
                    )
                  : undefined,
              sugar:
                item.sugar != null
                  ? roundMacro(
                      item.sugar * multiplier
                    )
                  : undefined,
              sodium:
                item.sodium != null
                  ? roundMacro(
                      item.sodium * multiplier
                    )
                  : undefined,
              saturatedFat:
                item.saturatedFat != null
                  ? roundMacro(
                      item.saturatedFat *
                        multiplier
                    )
                  : undefined,
              grams:
                item.grams != null
                  ? roundMacro(
                      item.grams * multiplier
                    )
                  : undefined,
            }
          : item
      )
    );

    cancelEditingIngredient();
  }

  function removeIngredient(id: string) {
    setIngredients((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function saveRecipe() {
    const name = recipeName.trim();
    const servings = Number(recipeServings);

    if (!name) {
      Alert.alert(
        'Recipe name required',
        'Give the recipe a name.'
      );
      return;
    }

    if (
      !Number.isFinite(servings) ||
      servings <= 0
    ) {
      Alert.alert(
        'Invalid servings',
        'Enter how many servings the full recipe makes.'
      );
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert(
        'Add ingredients',
        'A recipe needs at least one ingredient.'
      );
      return;
    }

    const now = new Date().toISOString();

    if (editingRecipeId) {
      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === editingRecipeId
            ? {
                ...recipe,
                name,
                servings,
                ingredients,
                notes: recipeNotes.trim(),
                updatedAt: now,
              }
            : recipe
        )
      );
    } else {
      setRecipes((current) => [
        {
          id: createId(),
          name,
          servings,
          ingredients,
          notes: recipeNotes.trim(),
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    setBuilderOpen(false);
    resetBuilder();
  }

  function deleteRecipe(recipe: SavedRecipe) {
    Alert.alert(
      'Delete recipe?',
      `Delete "${recipe.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setRecipes((current) =>
              current.filter(
                (item) => item.id !== recipe.id
              )
            ),
        },
      ]
    );
  }

  if (!loaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#2D6B48" />
        <Text style={styles.loadingText}>
          Loading recipes...
        </Text>
      </View>
    );
  }

  if (builderOpen) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={closeBuilder}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              ‹ Recipes
            </Text>
          </Pressable>

          <Text style={styles.brand}>
            PARKER FITNESS
          </Text>
        </View>

        <Text style={styles.title}>
          {editingRecipeId
            ? 'Edit Recipe'
            : 'Create Recipe'}
        </Text>

        <Text style={styles.subtitle}>
          Add ingredients once and Parker Fitness will calculate the full recipe and per-serving nutrition automatically.
        </Text>

        <Text style={styles.inputLabel}>
          Recipe name
        </Text>

        <TextInput
          style={styles.textInput}
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder="Example: Turkey Taco Bowls"
          placeholderTextColor="#9AA39E"
        />

        <Text style={styles.inputLabel}>
          Servings recipe makes
        </Text>

        <TextInput
          style={styles.textInput}
          value={recipeServings}
          onChangeText={setRecipeServings}
          placeholder="4"
          placeholderTextColor="#9AA39E"
          keyboardType="decimal-pad"
        />

        <NutritionSummary
          totals={recipeTotals}
          perServing={perServingNutrition}
          servings={parsedRecipeServings}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Ingredients
            </Text>
            <Text style={styles.sectionMeta}>
              {ingredients.length} ingredient
              {ingredients.length === 1
                ? ''
                : 's'}
            </Text>
          </View>
        </View>

        {ingredients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No ingredients yet
            </Text>
            <Text style={styles.emptyText}>
              Search USDA for automatic nutrition, or add a manual ingredient.
            </Text>
          </View>
        ) : (
          ingredients.map((ingredient) => (
            <View
              key={ingredient.id}
              style={styles.ingredientCard}
            >
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>
                  {ingredient.name}
                </Text>

                <Text style={styles.ingredientServing}>
                  {ingredient.servingSize}{' '}
                  {ingredient.servingUnit}
                </Text>

                <Text style={styles.ingredientNutrition}>
                  {ingredient.calories} cal •{' '}
                  {ingredient.protein}g protein •{' '}
                  {ingredient.carbs}g carbs •{' '}
                  {ingredient.fat}g fat
                </Text>

                <Text style={styles.ingredientMicros}>
                  {roundMacro(
                    ingredient.fiber ?? 0
                  )}g fiber •{' '}
                  {roundMacro(
                    ingredient.sugar ?? 0
                  )}g sugar •{' '}
                  {Math.round(
                    ingredient.sodium ?? 0
                  )}mg sodium •{' '}
                  {roundMacro(
                    ingredient.saturatedFat ?? 0
                  )}g sat fat
                </Text>

                <Text style={styles.sourceLabel}>
                  {ingredient.source === 'usda'
                    ? 'USDA'
                    : 'MANUAL'}
                </Text>
              </View>

              <View style={styles.ingredientActions}>
                <Pressable
                  onPress={() =>
                    startEditingIngredient(
                      ingredient
                    )
                  }
                >
                  <Text style={styles.editIngredientText}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    removeIngredient(ingredient.id)
                  }
                >
                  <Text style={styles.removeText}>
                    Remove
                  </Text>
                </Pressable>
              </View>

              {editingIngredientId ===
              ingredient.id ? (
                <View style={styles.ingredientEditPanel}>
                  <Text style={styles.ingredientEditLabel}>
                    Amount ({ingredient.servingUnit})
                  </Text>

                  <View style={styles.ingredientEditRow}>
                    <TextInput
                      style={styles.ingredientEditInput}
                      value={editingIngredientAmount}
                      onChangeText={
                        setEditingIngredientAmount
                      }
                      keyboardType="decimal-pad"
                      placeholder="Amount"
                      placeholderTextColor="#9AA39E"
                    />

                    <Pressable
                      style={styles.ingredientSaveButton}
                      onPress={() =>
                        saveIngredientAmount(
                          ingredient
                        )
                      }
                    >
                      <Text
                        style={
                          styles.ingredientSaveButtonText
                        }
                      >
                        Save
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.ingredientCancelButton}
                      onPress={
                        cancelEditingIngredient
                      }
                    >
                      <Text
                        style={
                          styles.ingredientCancelButtonText
                        }
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.ingredientEditHelp}>
                    Nutrition updates automatically when the amount changes.
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        {ingredientMode === 'closed' ? (
          <View style={styles.addIngredientRow}>
            <Pressable
              style={styles.addIngredientButton}
              onPress={() =>
                setIngredientMode('usda')
              }
            >
              <Text style={styles.addIngredientText}>
                + USDA Ingredient
              </Text>
            </Pressable>

            <Pressable
              style={styles.addIngredientButton}
              onPress={() =>
                setIngredientMode('manual')
              }
            >
              <Text style={styles.addIngredientText}>
                + Manual Ingredient
              </Text>
            </Pressable>
          </View>
        ) : null}

        {ingredientMode === 'usda' ? (
          <View style={styles.ingredientBuilder}>
            <View style={styles.builderHeader}>
              <Text style={styles.builderTitle}>
                USDA Ingredient
              </Text>

              <Pressable
                onPress={resetIngredientForm}
              >
                <Text style={styles.cancelSmall}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            {!selectedFood ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Chicken, rice, olive oil..."
                    placeholderTextColor="#9AA39E"
                    returnKeyType="search"
                    onSubmitEditing={runFoodSearch}
                  />

                  <Pressable
                    style={styles.searchButton}
                    onPress={runFoodSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text
                        style={styles.searchButtonText}
                      >
                        Search
                      </Text>
                    )}
                  </Pressable>
                </View>

                {searchError ? (
                  <Text style={styles.errorText}>
                    {searchError}
                  </Text>
                ) : null}

                {searchResults.map((food) => (
                  <Pressable
                    key={food.id}
                    style={styles.searchResult}
                    onPress={() => chooseFood(food)}
                  >
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>
                        {food.name}
                      </Text>

                      {food.brand ? (
                        <Text
                          style={styles.resultBrand}
                        >
                          {food.brand}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.resultArrow}>
                      ›
                    </Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.selectedFoodName}>
                  {selectedFood.name}
                </Text>

                <Text style={styles.inputLabel}>
                  Amount
                </Text>

                <TextInput
                  style={styles.textInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="Amount"
                  placeholderTextColor="#9AA39E"
                />

                <View style={styles.servingButtons}>
                  {findServingOptionForChoice(
                    selectedFood.servingOptions ?? [],
                    'cup'
                  ) ? (
                    <ServingButton
                      label="Cups"
                      active={
                        servingChoice === 'cup'
                      }
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
                      active={
                        servingChoice === 'unit'
                      }
                      onPress={() =>
                        changeServingChoice('unit')
                      }
                    />
                  ) : null}
                </View>

                {selectedServingOption ? (
                  <Text
                    style={styles.servingExplanation}
                  >
                    USDA measure:{' '}
                    {selectedServingOption.label} ={' '}
                    {roundMacro(
                      selectedServingOption.gramWeight
                    )}{' '}
                    g
                  </Text>
                ) : null}

                {selectedNutrition ? (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>
                      INGREDIENT NUTRITION
                    </Text>
                    <Text
                      style={styles.previewCalories}
                    >
                      {selectedNutrition.calories}{' '}
                      calories
                    </Text>
                    <Text style={styles.previewMacros}>
                      {selectedNutrition.protein}g protein
                      {' • '}
                      {selectedNutrition.carbs}g carbs
                      {' • '}
                      {selectedNutrition.fat}g fat
                    </Text>

                    <Text style={styles.previewMicros}>
                      {selectedNutrition.fiber}g fiber
                      {' • '}
                      {selectedNutrition.sugar}g sugar
                      {' • '}
                      {Math.round(
                        selectedNutrition.sodium
                      )}mg sodium
                      {' • '}
                      {selectedNutrition.saturatedFat}g sat fat
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.primaryButton}
                  onPress={addUsdaIngredient}
                  disabled={!selectedNutrition}
                >
                  <Text
                    style={styles.primaryButtonText}
                  >
                    Add Ingredient
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setSelectedFood(null);
                    setSelectedServingOption(null);
                    setSearchResults([]);
                  }}
                >
                  <Text
                    style={styles.secondaryButtonText}
                  >
                    Choose Different Food
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {ingredientMode === 'manual' ? (
          <View style={styles.ingredientBuilder}>
            <View style={styles.builderHeader}>
              <Text style={styles.builderTitle}>
                Manual Ingredient
              </Text>

              <Pressable
                onPress={resetIngredientForm}
              >
                <Text style={styles.cancelSmall}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>
              Ingredient name
            </Text>
            <TextInput
              style={styles.textInput}
              value={manualName}
              onChangeText={setManualName}
              placeholder="Ingredient name"
              placeholderTextColor="#9AA39E"
            />

            <View style={styles.twoColumnRow}>
              <View style={styles.flexField}>
                <Text style={styles.inputLabel}>
                  Amount
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={manualAmount}
                  onChangeText={setManualAmount}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor="#9AA39E"
                />
              </View>

              <View style={styles.flexField}>
                <Text style={styles.inputLabel}>
                  Unit
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={manualUnit}
                  onChangeText={setManualUnit}
                  placeholder="serving"
                  placeholderTextColor="#9AA39E"
                />
              </View>
            </View>

            <Text style={styles.manualHelp}>
              Enter nutrition for the amount above.
            </Text>

            <View style={styles.twoColumnRow}>
              <ManualMacroInput
                label="Calories"
                value={manualCalories}
                onChange={setManualCalories}
              />
              <ManualMacroInput
                label="Protein"
                value={manualProtein}
                onChange={setManualProtein}
              />
            </View>

            <View style={styles.twoColumnRow}>
              <ManualMacroInput
                label="Carbs"
                value={manualCarbs}
                onChange={setManualCarbs}
              />
              <ManualMacroInput
                label="Fat"
                value={manualFat}
                onChange={setManualFat}
              />
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={addManualIngredient}
            >
              <Text style={styles.primaryButtonText}>
                Add Ingredient
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>
          Notes (optional)
        </Text>

        <TextInput
          style={[
            styles.textInput,
            styles.notesInput,
          ]}
          value={recipeNotes}
          onChangeText={setRecipeNotes}
          placeholder="Prep notes, cooking instructions, etc."
          placeholderTextColor="#9AA39E"
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={styles.saveRecipeButton}
          onPress={saveRecipe}
        >
          <Text style={styles.saveRecipeButtonText}>
            {editingRecipeId
              ? 'Save Recipe Changes'
              : 'Save Recipe'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelRecipeButton}
          onPress={closeBuilder}
        >
          <Text style={styles.cancelRecipeText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            ‹ Back
          </Text>
        </Pressable>

        <Text style={styles.brand}>
          PARKER FITNESS
        </Text>
      </View>

      <Text style={styles.title}>
        Recipes
      </Text>

      <Text style={styles.subtitle}>
        Build recipes from USDA ingredients and log them later by serving.
      </Text>

      <Pressable
        style={styles.createButton}
        onPress={startNewRecipe}
      >
        <Text style={styles.createButtonText}>
          + Create Recipe
        </Text>
      </Pressable>

      {recipes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No recipes saved yet
          </Text>
          <Text style={styles.emptyText}>
            Create your first recipe. Nutrition will be calculated from the ingredients and divided by the number of servings.
          </Text>
        </View>
      ) : (
        recipes.map((recipe) => {
          const totals =
            calculateIngredientTotals(
              recipe.ingredients
            );
          const perServing =
            divideNutrition(
              totals,
              recipe.servings
            );

          return (
            <View
              key={recipe.id}
              style={styles.recipeCard}
            >
              <View style={styles.recipeHeader}>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName}>
                    {recipe.name}
                  </Text>
                  <Text style={styles.recipeMeta}>
                    {recipe.servings} serving
                    {recipe.servings === 1
                      ? ''
                      : 's'}
                    {' • '}
                    {recipe.ingredients.length}{' '}
                    ingredient
                    {recipe.ingredients.length === 1
                      ? ''
                      : 's'}
                  </Text>
                </View>
              </View>

              <View style={styles.recipeNutritionRow}>
                <View style={styles.recipeNutritionBox}>
                  <Text
                    style={styles.recipeNutritionLabel}
                  >
                    PER SERVING
                  </Text>
                  <Text
                    style={styles.recipeNutritionCalories}
                  >
                    {perServing.calories} cal
                  </Text>
                </View>

                <Text style={styles.recipeMacros}>
                  {perServing.protein}g protein
                  {' • '}
                  {perServing.carbs}g carbs
                  {' • '}
                  {perServing.fat}g fat
                </Text>

                <Text style={styles.recipeMicros}>
                  {perServing.fiber}g fiber
                  {' • '}
                  {Math.round(
                    perServing.sodium
                  )}mg sodium
                </Text>
              </View>

              <View style={styles.recipeActions}>
                <Pressable
                  onPress={() => editRecipe(recipe)}
                >
                  <Text style={styles.editText}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    deleteRecipe(recipe)
                  }
                >
                  <Text style={styles.deleteText}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

type NutritionSummaryProps = {
  totals: Nutrition;
  perServing: Nutrition | null;
  servings: number;
};

function NutritionSummary({
  totals,
  perServing,
  servings,
}: NutritionSummaryProps) {
  return (
    <View style={styles.nutritionSummary}>
      <Text style={styles.previewLabel}>
        RECIPE NUTRITION
      </Text>

      <Text style={styles.summaryTotal}>
        {totals.calories} total calories
      </Text>

      <Text style={styles.summaryMacros}>
        {totals.protein}g protein •{' '}
        {totals.carbs}g carbs •{' '}
        {totals.fat}g fat
      </Text>

      <Text style={styles.summaryMicros}>
        {totals.fiber}g fiber •{' '}
        {totals.sugar}g sugar •{' '}
        {Math.round(totals.sodium)}mg sodium •{' '}
        {totals.saturatedFat}g sat fat
      </Text>

      <View style={styles.summaryDivider} />

      {perServing ? (
        <>
          <Text style={styles.perServingLabel}>
            PER SERVING • {formatNumber(servings)} serving
            {servings === 1 ? '' : 's'}
          </Text>
          <Text style={styles.perServingCalories}>
            {perServing.calories} calories
          </Text>
          <Text style={styles.summaryMacros}>
            {perServing.protein}g protein •{' '}
            {perServing.carbs}g carbs •{' '}
            {perServing.fat}g fat
          </Text>

          <Text style={styles.summaryMicros}>
            {perServing.fiber}g fiber •{' '}
            {perServing.sugar}g sugar •{' '}
            {Math.round(
              perServing.sodium
            )}mg sodium •{' '}
            {perServing.saturatedFat}g sat fat
          </Text>
        </>
      ) : (
        <Text style={styles.invalidServingText}>
          Enter a valid number of recipe servings.
        </Text>
      )}
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

type ManualMacroInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function ManualMacroInput({
  label,
  value,
  onChange,
}: ManualMacroInputProps) {
  return (
    <View style={styles.flexField}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#9AA39E"
      />
    </View>
  );
}

function calculateIngredientTotals(
  ingredients: RecipeIngredient[]
): Nutrition {
  return ingredients.reduce(
    (total, ingredient) => ({
      calories:
        total.calories + ingredient.calories,
      protein:
        total.protein + ingredient.protein,
      carbs:
        total.carbs + ingredient.carbs,
      fat:
        total.fat + ingredient.fat,
      fiber:
        total.fiber +
        (ingredient.fiber ?? 0),
      sugar:
        total.sugar +
        (ingredient.sugar ?? 0),
      sodium:
        total.sodium +
        (ingredient.sodium ?? 0),
      saturatedFat:
        total.saturatedFat +
        (ingredient.saturatedFat ?? 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      saturatedFat: 0,
    }
  );
}

function divideNutrition(
  nutrition: Nutrition,
  servings: number
): Nutrition {
  if (
    !Number.isFinite(servings) ||
    servings <= 0
  ) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      saturatedFat: 0,
    };
  }

  return {
    calories: Math.round(
      nutrition.calories / servings
    ),
    protein: roundMacro(
      nutrition.protein / servings
    ),
    carbs: roundMacro(
      nutrition.carbs / servings
    ),
    fat: roundMacro(
      nutrition.fat / servings
    ),
    fiber: roundMacro(
      nutrition.fiber / servings
    ),
    sugar: roundMacro(
      nutrition.sugar / servings
    ),
    sodium: roundMacro(
      nutrition.sodium / servings
    ),
    saturatedFat: roundMacro(
      nutrition.saturatedFat / servings
    ),
  };
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

function getServingUnitLabel(
  choice: ServingChoice,
  option: FoodServingOption | null
) {
  if (choice === 'g') return 'g';
  if (choice === 'oz') return 'oz';
  if (choice === 'cup') return 'cup';

  if (option) {
    const value = (
      option.unit ||
      option.label ||
      'unit'
    ).trim();

    return cleanUnit(value);
  }

  return 'unit';
}

function cleanUnit(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes('cup')) return 'cup';
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
  if (normalized.includes('slice')) return 'slice';
  if (normalized.includes('piece')) return 'piece';
  if (normalized.includes('egg')) return 'egg';

  return value || 'unit';
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 180,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    color: '#557063',
    fontWeight: '700',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  backButton: {
    paddingVertical: 7,
    paddingRight: 14,
  },

  backButtonText: {
    color: '#2D6B48',
    fontSize: 15,
    fontWeight: '900',
  },

  brand: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    color: '#17211C',
    fontSize: 34,
    fontWeight: '900',
  },

  subtitle: {
    color: '#6D7972',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 22,
  },

  createButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  recipeInfo: {
    flex: 1,
  },

  recipeName: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
  },

  recipeMeta: {
    color: '#6D7972',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  recipeNutritionRow: {
    backgroundColor: '#F4F6F5',
    borderRadius: 13,
    padding: 13,
    marginTop: 13,
  },

  recipeNutritionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recipeNutritionLabel: {
    color: '#557063',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  recipeNutritionCalories: {
    color: '#2D6B48',
    fontSize: 17,
    fontWeight: '900',
  },

  recipeMacros: {
    color: '#6D7972',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  recipeMicros: {
    color: '#87918C',
    fontSize: 10,
    marginTop: 4,
  },

  recipeActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 13,
  },

  editText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '900',
  },

  deleteText: {
    color: '#B84A4A',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E7E4',
    marginBottom: 16,
  },

  emptyTitle: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    color: '#6D7972',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  inputLabel: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 15,
    marginBottom: 6,
  },

  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 49,
    color: '#17211C',
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  notesInput: {
    minHeight: 100,
  },

  nutritionSummary: {
    backgroundColor: '#1D4A32',
    borderRadius: 18,
    padding: 17,
    marginTop: 18,
    marginBottom: 18,
  },

  previewLabel: {
    color: '#C8D6CE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  summaryTotal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },

  summaryMacros: {
    color: '#E3ECE7',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  summaryMicros: {
    color: '#C8D6CE',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#41644F',
    marginVertical: 13,
  },

  perServingLabel: {
    color: '#C8D6CE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  perServingCalories: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },

  invalidServingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  sectionTitle: {
    color: '#17211C',
    fontSize: 21,
    fontWeight: '900',
  },

  sectionMeta: {
    color: '#6D7972',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  ingredientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  ingredientInfo: {
    flex: 1,
    paddingRight: 6,
  },

  ingredientName: {
    color: '#17211C',
    fontSize: 14,
    fontWeight: '900',
  },

  ingredientServing: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  ingredientNutrition: {
    color: '#77817C',
    fontSize: 11,
    marginTop: 4,
  },

  ingredientMicros: {
    color: '#8A948F',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  sourceLabel: {
    color: '#2D6B48',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
  },

  ingredientActions: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 14,
  },

  editIngredientText: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '900',
  },

  ingredientEditPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEA',
  },

  ingredientEditLabel: {
    color: '#557063',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
  },

  ingredientEditRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  ingredientEditInput: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#17211C',
    fontSize: 14,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  ingredientSaveButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  ingredientSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  ingredientCancelButton: {
    backgroundColor: '#EDF1EF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },

  ingredientCancelButtonText: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '900',
  },

  ingredientEditHelp: {
    color: '#77817C',
    fontSize: 10,
    marginTop: 7,
  },

  removeText: {
    color: '#B84A4A',
    fontSize: 11,
    fontWeight: '800',
  },

  addIngredientRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 7,
    marginBottom: 15,
  },

  addIngredientButton: {
    flex: 1,
    backgroundColor: '#EDF4EF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  addIngredientText: {
    color: '#2D6B48',
    fontSize: 12,
    fontWeight: '900',
  },

  ingredientBuilder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DDE7E1',
  },

  builderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  builderTitle: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
  },

  cancelSmall: {
    color: '#B84A4A',
    fontSize: 12,
    fontWeight: '800',
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#17211C',
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  searchButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 12,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  errorText: {
    color: '#B84A4A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 13,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E7E4',
  },

  resultInfo: {
    flex: 1,
  },

  resultName: {
    color: '#17211C',
    fontSize: 13,
    fontWeight: '800',
  },

  resultBrand: {
    color: '#6D7972',
    fontSize: 10,
    marginTop: 3,
  },

  resultArrow: {
    color: '#2D6B48',
    fontSize: 24,
    fontWeight: '700',
  },

  selectedFoodName: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },

  servingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  servingButton: {
    backgroundColor: '#EDF1EF',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  servingButtonActive: {
    backgroundColor: '#2D6B48',
  },

  servingButtonText: {
    color: '#557063',
    fontSize: 11,
    fontWeight: '800',
  },

  servingButtonTextActive: {
    color: '#FFFFFF',
  },

  servingExplanation: {
    color: '#6D7972',
    fontSize: 11,
    marginTop: 10,
  },

  previewCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 14,
    padding: 14,
    marginTop: 13,
  },

  previewCalories: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },

  previewMacros: {
    color: '#E3ECE7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  previewMicros: {
    color: '#C8D6CE',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  primaryButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '800',
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  flexField: {
    flex: 1,
  },

  manualHelp: {
    color: '#6D7972',
    fontSize: 11,
    marginTop: 13,
    marginBottom: -4,
  },

  saveRecipeButton: {
    backgroundColor: '#1D4A32',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  saveRecipeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  cancelRecipeButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  cancelRecipeText: {
    color: '#6D7972',
    fontSize: 13,
    fontWeight: '800',
  },
});
