export type FoodSearchResult = {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type USDANutrient = {
  nutrientName?: string;
  nutrientNumber?: string;
  value?: number;
  unitName?: string;
};

type USDAFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: USDANutrient[];
};

type USDASearchResponse = {
  foods?: USDAFood[];
};

const USDA_API_URL =
  'https://api.nal.usda.gov/fdc/v1/foods/search';

function getNutrientByName(
  food: USDAFood,
  names: string[]
): number {
  const nutrient = food.foodNutrients?.find((item) => {
    const nutrientName =
      item.nutrientName?.toLowerCase() ?? '';

    return names.some((name) =>
      nutrientName.includes(name.toLowerCase())
    );
  });

  return nutrient?.value ?? 0;
}

function getCalories(food: USDAFood): number {
  const nutrients = food.foodNutrients ?? [];

  // First choice: Energy explicitly reported in kcal
  const kcalNutrient = nutrients.find((item) => {
    const name =
      item.nutrientName?.toLowerCase() ?? '';

    const unit =
      item.unitName?.toLowerCase() ?? '';

    return (
      name.includes('energy') &&
      unit === 'kcal'
    );
  });

  if (kcalNutrient?.value != null) {
    return Math.round(kcalNutrient.value);
  }

  // Second choice: Energy reported in kJ
  const kjNutrient = nutrients.find((item) => {
    const name =
      item.nutrientName?.toLowerCase() ?? '';

    const unit =
      item.unitName?.toLowerCase() ?? '';

    return (
      name.includes('energy') &&
      unit === 'kj'
    );
  });

  if (kjNutrient?.value != null) {
    return Math.round(kjNutrient.value / 4.184);
  }

  // Last fallback: calculate calories from macros
  const protein = getProtein(food);
  const carbs = getCarbs(food);
  const fat = getFat(food);

  return Math.round(
    protein * 4 +
    carbs * 4 +
    fat * 9
  );
}

function getProtein(food: USDAFood): number {
  return getNutrientByName(food, ['protein']);
}

function getCarbs(food: USDAFood): number {
  return getNutrientByName(food, [
    'carbohydrate, by difference',
    'carbohydrate',
  ]);
}

function getFat(food: USDAFood): number {
  return getNutrientByName(food, [
    'total lipid (fat)',
    'total lipid',
    'total fat',
  ]);
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function searchFoods(
  query: string
): Promise<FoodSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const apiKey =
    process.env.EXPO_PUBLIC_USDA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'USDA API key is missing.'
    );
  }

  const response = await fetch(
    `${USDA_API_URL}?api_key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        query: trimmedQuery,
        pageSize: 25,

        dataType: [
          'Branded',
          'Foundation',
          'SR Legacy',
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `USDA search failed: ${response.status} ${errorText}`
    );
  }

  const data =
    (await response.json()) as USDASearchResponse;

  return (data.foods ?? []).map((food) => ({
    id: String(food.fdcId),

    name: food.description,

    brand: food.brandOwner,

    servingSize:
      food.servingSize ?? 100,

    servingUnit:
      food.servingSizeUnit ?? 'g',

    calories: getCalories(food),

    protein: roundMacro(
      getProtein(food)
    ),

    carbs: roundMacro(
      getCarbs(food)
    ),

    fat: roundMacro(
      getFat(food)
    ),
  }));
}
