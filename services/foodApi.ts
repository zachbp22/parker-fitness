export type FoodServingOption = {
  id: string;
  label: string;
  unit: string;
  amount: number;
  gramWeight: number;
};

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
  servingOptions?: FoodServingOption[];
};

type USDANutrient = {
  nutrientName?: string;
  nutrientNumber?: string;
  value?: number;
  unitName?: string;

  // Detailed-food endpoint shape
  amount?: number;
  nutrient?: {
    name?: string;
    number?: string;
    unitName?: string;
  };
};

type USDAFoodPortion = {
  id?: number;
  amount?: number;
  gramWeight?: number;
  modifier?: string;
  portionDescription?: string;
  measureUnit?: {
    id?: number;
    name?: string;
    abbreviation?: string;
  };
};

type USDAFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: USDANutrient[];
  foodPortions?: USDAFoodPortion[];
};

type USDASearchResponse = {
  foods?: USDAFood[];
};

const USDA_API_BASE =
  'https://api.nal.usda.gov/fdc/v1';

const USDA_SEARCH_URL =
  `${USDA_API_BASE}/foods/search`;

function nutrientName(item: USDANutrient) {
  return (
    item.nutrientName ??
    item.nutrient?.name ??
    ''
  ).toLowerCase();
}

function nutrientUnit(item: USDANutrient) {
  return (
    item.unitName ??
    item.nutrient?.unitName ??
    ''
  ).toLowerCase();
}

function nutrientValue(item: USDANutrient) {
  if (item.value != null) {
    return item.value;
  }

  return item.amount ?? 0;
}

function getNutrientByName(
  food: USDAFood,
  names: string[]
): number {
  const nutrient = food.foodNutrients?.find((item) => {
    const name = nutrientName(item);

    return names.some((candidate) =>
      name.includes(candidate.toLowerCase())
    );
  });

  return nutrient ? nutrientValue(nutrient) : 0;
}

function getCalories(food: USDAFood): number {
  const nutrients = food.foodNutrients ?? [];

  const kcalNutrient = nutrients.find((item) => {
    const name = nutrientName(item);
    const unit = nutrientUnit(item);

    return (
      name.includes('energy') &&
      unit === 'kcal'
    );
  });

  if (kcalNutrient) {
    return Math.round(
      nutrientValue(kcalNutrient)
    );
  }

  const kjNutrient = nutrients.find((item) => {
    const name = nutrientName(item);
    const unit = nutrientUnit(item);

    return (
      name.includes('energy') &&
      unit === 'kj'
    );
  });

  if (kjNutrient) {
    return Math.round(
      nutrientValue(kjNutrient) / 4.184
    );
  }

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

function normalizeUnit(value?: string) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

function buildServingOptions(
  food: USDAFood
): FoodServingOption[] {
  const options: FoodServingOption[] = [];
  const seen = new Set<string>();

  for (const portion of food.foodPortions ?? []) {
    const gramWeight = Number(portion.gramWeight);
    const amount = Number(portion.amount ?? 1);

    if (
      !Number.isFinite(gramWeight) ||
      gramWeight <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      continue;
    }

    const measureName =
      portion.measureUnit?.name ??
      portion.measureUnit?.abbreviation ??
      portion.modifier ??
      portion.portionDescription ??
      'unit';

    const unit = normalizeUnit(measureName) || 'unit';

    const label =
      portion.portionDescription?.trim() ||
      portion.modifier?.trim() ||
      `${amount} ${measureName}`;

    const key =
      `${unit}|${amount}|${gramWeight}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    options.push({
      id: String(
        portion.id ??
        `${unit}-${amount}-${gramWeight}`
      ),
      label,
      unit,
      amount,
      gramWeight,
    });
  }

  /*
   * Branded foods often expose a household serving outside foodPortions.
   * If we can safely tie that serving to a gram/oz serving size, preserve it.
   */
  const servingSize = Number(food.servingSize);
  const servingUnit =
    normalizeUnit(food.servingSizeUnit);

  if (
    food.householdServingFullText &&
    Number.isFinite(servingSize) &&
    servingSize > 0
  ) {
    let gramWeight: number | null = null;

    if (
      servingUnit === 'g' ||
      servingUnit === 'gram' ||
      servingUnit === 'grams'
    ) {
      gramWeight = servingSize;
    } else if (
      servingUnit === 'oz' ||
      servingUnit === 'ounce' ||
      servingUnit === 'ounces'
    ) {
      gramWeight = servingSize * 28.3495;
    }

    if (gramWeight) {
      const household =
        food.householdServingFullText.trim();

      const key =
        `household|1|${gramWeight}`;

      if (!seen.has(key)) {
        options.unshift({
          id: 'household-serving',
          label: household,
          unit: normalizeUnit(household),
          amount: 1,
          gramWeight,
        });
      }
    }
  }

  return options;
}

function mapFood(
  food: USDAFood
): FoodSearchResult {
  return {
    id: String(food.fdcId),
    name: food.description,
    brand: food.brandOwner,
    servingSize:
      food.servingSize ?? 100,
    servingUnit:
      food.servingSizeUnit ?? 'g',
    calories: getCalories(food),
    protein: roundMacro(getProtein(food)),
    carbs: roundMacro(getCarbs(food)),
    fat: roundMacro(getFat(food)),
    servingOptions: buildServingOptions(food),
  };
}

function getApiKey() {
  const apiKey =
    process.env.EXPO_PUBLIC_USDA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'USDA API key is missing.'
    );
  }

  return apiKey;
}


function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQueryTokens(query: string) {
  return normalizeSearchText(query)
    .split(' ')
    .filter((token) => token.length > 1);
}

function scoreFoodRelevance(
  food: USDAFood,
  query: string
) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = getQueryTokens(query);
  const description = normalizeSearchText(food.description);
  const brand = normalizeSearchText(food.brandOwner ?? '');
  const combined = `${description} ${brand}`;

  if (!queryTokens.length) {
    return 0;
  }

  let score = 0;

  // Strongly favor exact phrase matches.
  if (description === normalizedQuery) {
    score += 1000;
  } else if (description.startsWith(normalizedQuery)) {
    score += 700;
  } else if (description.includes(normalizedQuery)) {
    score += 500;
  }

  // Every query word should ideally appear in the result.
  const matchedTokens = queryTokens.filter((token) =>
    combined.includes(token)
  );

  score += matchedTokens.length * 120;

  // Reward foods where all important query terms are present.
  if (matchedTokens.length === queryTokens.length) {
    score += 400;
  }

  // Penalize results missing any query term heavily.
  score -=
    (queryTokens.length - matchedTokens.length) * 500;

  /*
   * If the user searches for a specific animal/protein,
   * do not let a different animal rank alongside it simply
   * because USDA matched words like "ground" or "meat."
   */
  const proteinTerms = [
    'turkey',
    'chicken',
    'beef',
    'pork',
    'lamb',
    'duck',
    'goose',
    'ostrich',
    'bison',
    'buffalo',
    'venison',
    'rabbit',
    'salmon',
    'tuna',
    'shrimp',
    'cod',
    'tilapia',
  ];

  const requestedProteins = proteinTerms.filter((term) =>
    queryTokens.includes(term)
  );

  if (requestedProteins.length > 0) {
    const hasRequestedProtein = requestedProteins.some((term) =>
      description.includes(term)
    );

    if (!hasRequestedProtein) {
      score -= 2000;
    }
  }

  return score;
}

function sortAndFilterFoods(
  foods: USDAFood[],
  query: string
) {
  const queryTokens = getQueryTokens(query);

  const scored = foods
    .map((food) => ({
      food,
      score: scoreFoodRelevance(food, query),
    }))
    .sort((a, b) => b.score - a.score);

  /*
   * For multi-word searches such as "ground turkey", require
   * all query words when possible. If USDA has no such matches,
   * fall back to the best-scoring results rather than returning nothing.
   */
  const allTokenMatches = scored.filter(({ food }) => {
    const combined = normalizeSearchText(
      `${food.description} ${food.brandOwner ?? ''}`
    );

    return queryTokens.every((token) =>
      combined.includes(token)
    );
  });

  const usable =
    allTokenMatches.length > 0
      ? allTokenMatches
      : scored.filter(({ score }) => score > 0);

  return usable
    .slice(0, 25)
    .map(({ food }) => food);
}

export async function searchFoods(
  query: string
): Promise<FoodSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const apiKey = getApiKey();

  const response = await fetch(
    `${USDA_SEARCH_URL}?api_key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: trimmedQuery,
        pageSize: 50,
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

  const relevantFoods = sortAndFilterFoods(
    data.foods ?? [],
    trimmedQuery
  );

  return relevantFoods.map(mapFood);
}

export async function getFoodDetails(
  fdcId: string
): Promise<FoodSearchResult> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${USDA_API_BASE}/food/${encodeURIComponent(
      fdcId
    )}?api_key=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `USDA food details failed: ${response.status} ${errorText}`
    );
  }

  const food =
    (await response.json()) as USDAFood;

  return mapFood(food);
}
