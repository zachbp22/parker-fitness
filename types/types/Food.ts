export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
  id: string;

  name: string;

  brand?: string;

  barcode?: string;

  servingSize: number;

  servingUnit: string;

  calories: number;

  protein: number;

  carbohydrates: number;

  fat: number;

  fiber: number;

  sugar: number;

  sodium: number;

  mealType: MealType;

  createdAt: string;
}