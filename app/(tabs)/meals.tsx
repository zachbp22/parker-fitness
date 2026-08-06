import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MealsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Meals</Text>

      <MealCard
        meal="Breakfast"
        food="Protein Shake"
        calories="220 cal"
      />

      <MealCard
        meal="Lunch"
        food="Chicken Rice Bowl"
        calories="510 cal"
      />

      <MealCard
        meal="Dinner"
        food="Not Logged"
        calories="+ Add Meal"
      />
    </ScrollView>
  );
}

function MealCard({
  meal,
  food,
  calories,
}: {
  meal: string;
  food: string;
  calories: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.meal}>{meal}</Text>

      <Text style={styles.food}>{food}</Text>

      <Text style={styles.calories}>{calories}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  content: {
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#17211C',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  meal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D6B48',
  },

  food: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    color: '#17211C',
  },

  calories: {
    marginTop: 10,
    color: '#6D7972',
    fontSize: 15,
  },
});