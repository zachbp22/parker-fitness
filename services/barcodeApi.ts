export type BarcodeFoodResult = {
  barcode: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type OpenFoodFactsResponse = {
  status?: number;

  product?: {
    product_name?: string;
    brands?: string;

    serving_quantity?: number | string;
    serving_quantity_unit?: string;
    serving_size?: string;

    nutriments?: {
      ['energy-kcal_100g']?: number | string;
      ['proteins_100g']?: number | string;
      ['carbohydrates_100g']?: number | string;
      ['fat_100g']?: number | string;

      ['energy-kcal_serving']?: number | string;
      ['proteins_serving']?: number | string;
      ['carbohydrates_serving']?: number | string;
      ['fat_serving']?: number | string;
    };
  };
};

export async function lookupBarcode(
  barcode: string
): Promise<BarcodeFoodResult | null> {
  const cleanedBarcode = barcode.trim();

  if (!cleanedBarcode) {
    return null;
  }

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      cleanedBarcode
    )}.json`
  );

  if (!response.ok) {
    throw new Error(
      `Barcode lookup failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as OpenFoodFactsResponse;

  if (
    data.status !== 1 ||
    !data.product
  ) {
    return null;
  }

  const product = data.product;

  const productName =
    product.product_name?.trim();

  if (!productName) {
    return null;
  }

  const nutriments =
    product.nutriments ?? {};

  /*
   * ----------------------------------------------------------
   * SERVING SIZE
   * ----------------------------------------------------------
   */

  const servingInfo =
    getServingInfo(product);

  const servingSize =
    servingInfo.size;

  const servingUnit =
    servingInfo.unit;

  /*
   * ----------------------------------------------------------
   * NUTRITION
   * ----------------------------------------------------------
   *
   * Prefer Open Food Facts' explicit per-serving values.
   *
   * If they aren't available, calculate the serving nutrition
   * from the per-100-g values.
   */

  const caloriesServing =
    toNumber(
      nutriments['energy-kcal_serving']
    );

  const proteinServing =
    toNumber(
      nutriments['proteins_serving']
    );

  const carbsServing =
    toNumber(
      nutriments['carbohydrates_serving']
    );

  const fatServing =
    toNumber(
      nutriments['fat_serving']
    );

  const calories100g =
    toNumber(
      nutriments['energy-kcal_100g']
    );

  const protein100g =
    toNumber(
      nutriments['proteins_100g']
    );

  const carbs100g =
    toNumber(
      nutriments['carbohydrates_100g']
    );

  const fat100g =
    toNumber(
      nutriments['fat_100g']
    );

  /*
   * If Open Food Facts supplies per-serving values,
   * use them directly.
   */

  const hasServingNutrition =
    caloriesServing !== null ||
    proteinServing !== null ||
    carbsServing !== null ||
    fatServing !== null;

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  if (hasServingNutrition) {
    calories =
      caloriesServing ?? 0;

    protein =
      proteinServing ?? 0;

    carbs =
      carbsServing ?? 0;

    fat =
      fatServing ?? 0;
  } else {
    /*
     * Otherwise convert the 100-g nutrition to
     * the actual serving size.
     *
     * This conversion is only safe when the
     * serving unit is grams.
     */

    const canConvertFrom100g =
      servingUnit.toLowerCase() === 'g' &&
      servingSize > 0;

    if (canConvertFrom100g) {
      const multiplier =
        servingSize / 100;

      calories =
        (calories100g ?? 0) *
        multiplier;

      protein =
        (protein100g ?? 0) *
        multiplier;

      carbs =
        (carbs100g ?? 0) *
        multiplier;

      fat =
        (fat100g ?? 0) *
        multiplier;
    } else {
      /*
       * If we cannot safely convert the serving,
       * return the 100-g nutrition as a 100-g
       * serving instead of attaching 100-g
       * nutrition to the wrong serving size.
       */

      return build100GramResult(
        cleanedBarcode,
        productName,
        product.brands,
        calories100g,
        protein100g,
        carbs100g,
        fat100g
      );
    }
  }

  /*
   * A product name with absolutely no nutrition
   * should not appear as a valid zero-calorie food.
   */

  const hasNutrition =
    calories > 0 ||
    protein > 0 ||
    carbs > 0 ||
    fat > 0;

  if (!hasNutrition) {
    return null;
  }

  return {
    barcode: cleanedBarcode,

    name: productName,

    brand:
      product.brands?.trim() ||
      undefined,

    servingSize,

    servingUnit,

    calories: Math.round(calories),

    protein: roundMacro(protein),

    carbs: roundMacro(carbs),

    fat: roundMacro(fat),
  };
}

/*
 * ============================================================
 * SERVING HELPERS
 * ============================================================
 */

function getServingInfo(
  product: NonNullable<
    OpenFoodFactsResponse['product']
  >
): {
  size: number;
  unit: string;
} {
  const servingQuantity =
    toNumber(
      product.serving_quantity
    );

  const explicitUnit =
    product.serving_quantity_unit
      ?.trim()
      .toLowerCase();

  if (
    servingQuantity !== null &&
    servingQuantity > 0
  ) {
    if (
      explicitUnit === 'g' ||
      explicitUnit === 'gram' ||
      explicitUnit === 'grams'
    ) {
      return {
        size: servingQuantity,
        unit: 'g',
      };
    }

    if (
      explicitUnit === 'ml' ||
      explicitUnit === 'milliliter' ||
      explicitUnit === 'milliliters'
    ) {
      return {
        size: servingQuantity,
        unit: 'ml',
      };
    }
  }

  /*
   * Some Open Food Facts records only provide
   * a text value such as:
   *
   * "2 tbsp (33 g)"
   * "1 bar (40g)"
   * "30 g"
   */

  const servingText =
    product.serving_size?.trim();

  if (servingText) {
    const gramMatch =
      servingText.match(
        /(\d+(?:\.\d+)?)\s*g\b/i
      );

    if (gramMatch) {
      return {
        size:
          Number(gramMatch[1]),
        unit: 'g',
      };
    }

    const mlMatch =
      servingText.match(
        /(\d+(?:\.\d+)?)\s*ml\b/i
      );

    if (mlMatch) {
      return {
        size:
          Number(mlMatch[1]),
        unit: 'ml',
      };
    }
  }

  /*
   * Unknown serving size:
   * fall back to the database's 100-g basis.
   */

  return {
    size: 100,
    unit: 'g',
  };
}

/*
 * ============================================================
 * 100-G FALLBACK
 * ============================================================
 */

function build100GramResult(
  barcode: string,
  name: string,
  brand: string | undefined,
  calories100g: number | null,
  protein100g: number | null,
  carbs100g: number | null,
  fat100g: number | null
): BarcodeFoodResult | null {
  const calories =
    calories100g ?? 0;

  const protein =
    protein100g ?? 0;

  const carbs =
    carbs100g ?? 0;

  const fat =
    fat100g ?? 0;

  const hasNutrition =
    calories > 0 ||
    protein > 0 ||
    carbs > 0 ||
    fat > 0;

  if (!hasNutrition) {
    return null;
  }

  return {
    barcode,

    name,

    brand:
      brand?.trim() ||
      undefined,

    servingSize: 100,

    servingUnit: 'g',

    calories:
      Math.round(calories),

    protein:
      roundMacro(protein),

    carbs:
      roundMacro(carbs),

    fat:
      roundMacro(fat),
  };
}

/*
 * ============================================================
 * NUMBER HELPERS
 * ============================================================
 */

function toNumber(
  value:
    | number
    | string
    | undefined
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (typeof value === 'string') {
    const parsed =
      Number.parseFloat(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function roundMacro(
  value: number
): number {
  return (
    Math.round(value * 10) / 10
  );
}