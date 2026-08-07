import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  FoodSearchResult,
  searchFoods,
} from '@/services/foodApi';

export default function UsdaTestScreen() {
  const [foods, setFoods] =
    useState<FoodSearchResult[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  async function testSearch() {
    try {
      setLoading(true);
      setError('');
      setFoods([]);

      const results =
        await searchFoods('banana');

      setFoods(results);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        USDA Test
      </Text>

      <Text style={styles.subtitle}>
        Test the nutrition database before
        connecting it to Meals.
      </Text>

      <Pressable
        style={styles.button}
        onPress={testSearch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Searching...'
            : 'Search Banana'}
        </Text>
      </Pressable>

      {loading && (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      )}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            Search failed
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : null}

      {foods.map((food) => (
        <View
          key={food.id}
          style={styles.foodCard}
        >
          <Text style={styles.foodName}>
            {food.name}
          </Text>

          {food.brand ? (
            <Text style={styles.brand}>
              {food.brand}
            </Text>
          ) : null}

          <Text style={styles.serving}>
            Serving: {food.servingSize}{' '}
            {food.servingUnit}
          </Text>

          <Text style={styles.nutrition}>
            {food.calories} cal •{' '}
            {food.protein}g protein •{' '}
            {food.carbs}g carbs •{' '}
            {food.fat}g fat
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 80,
  },

  title: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#6D7972',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 25,
  },

  button: {
    backgroundColor: '#1D4A32',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  loader: {
    marginTop: 30,
  },

  errorCard: {
    backgroundColor: '#FBEAEA',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },

  errorTitle: {
    color: '#A34D4D',
    fontSize: 16,
    fontWeight: '900',
  },

  errorText: {
    color: '#A34D4D',
    fontSize: 13,
    marginTop: 6,
  },

  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },

  foodName: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '900',
  },

  brand: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  serving: {
    color: '#77817C',
    fontSize: 12,
    marginTop: 8,
  },

  nutrition: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
});