import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

if (Platform.OS !== 'web') {
  AppState.addEventListener(
    'change',
    (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    }
  );
}
export type CloudProfile = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  calorie_goal: number;
  protein_goal: number;
  water_goal: number;
  starting_weight: number | null;
  goal_weight: number | null;
};

export async function getCloudProfiles(): Promise<
  CloudProfile[]
> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        household_id,
        user_id,
        name,
        calorie_goal,
        protein_goal,
        water_goal,
        starting_weight,
        goal_weight
      `
    )
    .order('name');

  if (error) {
    throw error;
  }

  return data ?? [];
}