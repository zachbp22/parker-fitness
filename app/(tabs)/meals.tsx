import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getTodayDate,
  loadFoods,
} from '@/services/storage';

type WorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};

type Exercise = {
  id: number;
  name: string;
  muscle: string;
  sets: WorkoutSet[];
};

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

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
};

const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 160;
const WATER_GOAL = 96;

const STARTING_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: 'Chest Press Machine',
    muscle: 'Chest',
    sets: [
      { id: 1, weight: '80', reps: '12', completed: false },
      { id: 2, weight: '80', reps: '12', completed: false },
      { id: 3, weight: '80', reps: '10', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Shoulder Press Machine',
    muscle: 'Shoulders',
    sets: [
      { id: 1, weight: '50', reps: '12', completed: false },
      { id: 2, weight: '50', reps: '10', completed: false },
      { id: 3, weight: '50', reps: '10', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Pec Deck',
    muscle: 'Chest',
    sets: [
      { id: 1, weight: '70', reps: '12', completed: false },
      { id: 2, weight: '70', reps: '12', completed: false },
      { id: 3, weight: '70', reps: '10', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Cable Triceps Pushdown',
    muscle: 'Triceps',
    sets: [
      { id: 1, weight: '40', reps: '12', completed: false },
      { id: 2, weight: '40', reps: '12', completed: false },
      { id: 3, weight: '40', reps: '10', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Abdominal Machine',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '50', reps: '15', completed: false },
      { id: 2, weight: '50', reps: '15', completed: false },
      { id: 3, weight: '50', reps: '15', completed: false },
    ],
  },
];

export default function HomeScreen() {
  const [screen, setScreen] =
    useState<'home' | 'workout' | 'summary'>('home');

  const [exercises, setExercises] =
    useState<Exercise[]>(STARTING_EXERCISES);

  const [foods, setFoods] = useState<FoodItem[]>([]);

  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);

  const loadDashboardFoods = useCallback(async () => {
    try {
      const savedFoods = await loadFoods<FoodItem>();

      const today = getTodayDate();

      const todaysFoods = (savedFoods ?? []).filter(
        (food) => food.date === today
      );

      setFoods(todaysFoods);
    } catch (error) {
      console.error(
        'Unable to load dashboard foods:',
        error
      );
    }
  }, []);

  useEffect(() => {
    loadDashboardFoods();
  }, [loadDashboardFoods]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardFoods();
    }, [loadDashboardFoods])
  );

  useEffect(() => {
    if (!workoutRunning) {
      return;
    }

    const interval = setInterval(() => {
      setWorkoutSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutRunning]);

  useEffect(() => {
    if (restSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restSeconds]);

  const totalSets = useMemo(() => {
    return exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  }, [exercises]);

  const completedSets = useMemo(() => {
    return exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.filter(
          (workoutSet) => workoutSet.completed
        ).length,
      0
    );
  }, [exercises]);

  const totalVolume = useMemo(() => {
    return exercises.reduce((exerciseTotal, exercise) => {
      const exerciseVolume = exercise.sets.reduce(
        (setTotal, workoutSet) => {
          if (!workoutSet.completed) {
            return setTotal;
          }

          const weight = Number(workoutSet.weight) || 0;
          const reps = Number(workoutSet.reps) || 0;

          return setTotal + weight * reps;
        },
        0
      );

      return exerciseTotal + exerciseVolume;
    }, 0);
  }, [exercises]);

  function startWorkout() {
    setWorkoutSeconds(0);
    setWorkoutRunning(true);
    setScreen('workout');
  }

  function updateSet(
    exerciseId: number,
    setId: number,
    field: 'weight' | 'reps',
    value: string
  ) {
    const numericValue = value.replace(/[^0-9.]/g, '');

    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((workoutSet) => {
            if (workoutSet.id !== setId) {
              return workoutSet;
            }

            return {
              ...workoutSet,
              [field]: numericValue,
            };
          }),
        };
      })
    );
  }

  function toggleSet(exerciseId: number, setId: number) {
    let wasCompleted = false;

    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((workoutSet) => {
            if (workoutSet.id !== setId) {
              return workoutSet;
            }

            wasCompleted = workoutSet.completed;

            return {
              ...workoutSet,
              completed: !workoutSet.completed,
            };
          }),
        };
      })
    );

    if (!wasCompleted) {
      setRestSeconds(90);
    }
  }

  function addSet(exerciseId: number) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const lastSet =
          exercise.sets[exercise.sets.length - 1];

        const newSet: WorkoutSet = {
          id: Date.now(),
          weight: lastSet?.weight ?? '',
          reps: lastSet?.reps ?? '',
          completed: false,
        };

        return {
          ...exercise,
          sets: [...exercise.sets, newSet],
        };
      })
    );
  }

  function finishWorkout() {
    if (completedSets === 0) {
      Alert.alert(
        'No completed sets',
        'Complete at least one set before finishing the workout.'
      );
      return;
    }

    setWorkoutRunning(false);
    setRestSeconds(0);
    setScreen('summary');
  }

  function returnHome() {
    setScreen('home');
  }

  if (screen === 'workout') {
    return (
      <WorkoutScreen
        exercises={exercises}
        workoutSeconds={workoutSeconds}
        restSeconds={restSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
        onUpdateSet={updateSet}
        onToggleSet={toggleSet}
        onAddSet={addSet}
        onFinishWorkout={finishWorkout}
        onCancel={() => {
          setWorkoutRunning(false);
          setRestSeconds(0);
          setScreen('home');
        }}
        onStartRest={() => setRestSeconds(90)}
        onStopRest={() => setRestSeconds(0)}
      />
    );
  }

  if (screen === 'summary') {
    return (
      <WorkoutSummary
        completedSets={completedSets}
        totalSets={totalSets}
        totalVolume={totalVolume}
        workoutSeconds={workoutSeconds}
        onDone={returnHome}
      />
    );
  }

  return (
    <HomeDashboard
      foods={foods}
      onStartWorkout={startWorkout}
    />
  );
}

type HomeDashboardProps = {
  foods: FoodItem[];
  onStartWorkout: () => void;
};

function HomeDashboard({
  foods,
  onStartWorkout,
}: HomeDashboardProps) {
  const caloriesUsed = foods.reduce(
    (total, food) => total + food.calories,
    0
  );

  const proteinUsed = foods.reduce(
    (total, food) => total + food.protein,
    0
  );

  const caloriesRemaining = Math.max(
    CALORIE_GOAL - caloriesUsed,
    0
  );

  const calorieProgress = Math.min(
    caloriesUsed / CALORIE_GOAL,
    1
  );

  const breakfastFoods = foods.filter(
    (food) => food.meal === 'Breakfast'
  );

  const lunchFoods = foods.filter(
    (food) => food.meal === 'Lunch'
  );

  const dinnerFoods = foods.filter(
    (food) => food.meal === 'Dinner'
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.smallHeading}>
        PARKER FITNESS
      </Text>

      <Text style={styles.title}>
        Good morning, Zach
      </Text>

      <Text style={styles.subtitle}>
        Here is today's progress.
      </Text>

      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>
          CALORIES REMAINING
        </Text>

        <Text style={styles.largeNumber}>
          {caloriesRemaining.toLocaleString()}
        </Text>

        <Text style={styles.cardText}>
          {caloriesUsed.toLocaleString()} of{' '}
          {CALORIE_GOAL.toLocaleString()} calories used
        </Text>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${calorieProgress * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Daily goals
      </Text>

      <View style={styles.row}>
        <StatCard
          title="Protein"
          value={`${proteinUsed}g`}
          goal={`${PROTEIN_GOAL}g goal`}
        />

        <StatCard
          title="Water"
          value="48 oz"
          goal={`${WATER_GOAL} oz goal`}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Today's workout
      </Text>

      <View style={styles.whiteCard}>
        <Text style={styles.workoutLabel}>
          UPPER BODY
        </Text>

        <Text style={styles.workoutTitle}>
          Push Day
        </Text>

        <Text style={styles.cardDescription}>
          Chest press, shoulder press, triceps and core
        </Text>

        <View style={styles.workoutDetailsRow}>
          <WorkoutDetail
            value="5"
            label="Exercises"
          />

          <WorkoutDetail
            value="15"
            label="Sets"
          />

          <WorkoutDetail
            value="45-60"
            label="Minutes"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onStartWorkout}
        >
          <Text style={styles.startButtonText}>
            Start workout
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Meals
      </Text>

      <View style={styles.whiteCard}>
        <DashboardMealRow
          title="Breakfast"
          foods={breakfastFoods}
        />

        <View style={styles.divider} />

        <DashboardMealRow
          title="Lunch"
          foods={lunchFoods}
        />

        <View style={styles.divider} />

        <DashboardMealRow
          title="Dinner"
          foods={dinnerFoods}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Weekly progress
      </Text>

      <View style={styles.whiteCard}>
        <Text style={styles.cardLabelDark}>
          CURRENT WEIGHT
        </Text>

        <Text style={styles.weight}>
          238.4 lb
        </Text>

        <Text style={styles.change}>
          Down 2.1 lb this week
        </Text>
      </View>
    </ScrollView>
  );
}

type DashboardMealRowProps = {
  title: string;
  foods: FoodItem[];
};

function DashboardMealRow({
  title,
  foods,
}: DashboardMealRowProps) {
  const calories = foods.reduce(
    (total, food) => total + food.calories,
    0
  );

  const detail =
    foods.length === 0
      ? 'Not logged'
      : foods.map((food) => food.name).join(', ');

  return (
    <View style={styles.mealRow}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle}>
          {title}
        </Text>

        <Text
          style={styles.mealDetail}
          numberOfLines={2}
        >
          {detail}
        </Text>
      </View>

      <Text style={styles.mealCalories}>
        {foods.length === 0
          ? '0 cal'
          : `${calories} cal`}
      </Text>
    </View>
  );
}

type WorkoutScreenProps = {
  exercises: Exercise[];
  workoutSeconds: number;
  restSeconds: number;
  completedSets: number;
  totalSets: number;
  onUpdateSet: (
    exerciseId: number,
    setId: number,
    field: 'weight' | 'reps',
    value: string
  ) => void;
  onToggleSet: (
    exerciseId: number,
    setId: number
  ) => void;
  onAddSet: (exerciseId: number) => void;
  onFinishWorkout: () => void;
  onCancel: () => void;
  onStartRest: () => void;
  onStopRest: () => void;
};

function WorkoutScreen({
  exercises,
  workoutSeconds,
  restSeconds,
  completedSets,
  totalSets,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onFinishWorkout,
  onCancel,
  onStartRest,
  onStopRest,
}: WorkoutScreenProps) {
  const progress =
    totalSets === 0
      ? 0
      : Math.round(
          (completedSets / totalSets) * 100
        );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.workoutContent
        }
      >
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.smallHeading}>
              PUSH DAY
            </Text>

            <Text style={styles.title}>
              Today's workout
            </Text>
          </View>

          <Pressable onPress={onCancel}>
            <Text style={styles.cancelText}>
              Exit
            </Text>
          </Pressable>
        </View>

        <View style={styles.workoutStatusCard}>
          <View>
            <Text style={styles.statusLabel}>
              WORKOUT TIME
            </Text>

            <Text style={styles.statusValue}>
              {formatTime(workoutSeconds)}
            </Text>
          </View>

          <View style={styles.statusRight}>
            <Text style={styles.statusLabel}>
              PROGRESS
            </Text>

            <Text style={styles.statusValue}>
              {progress}%
            </Text>
          </View>

          <View
            style={
              styles.workoutProgressBackground
            }
          >
            <View
              style={[
                styles.workoutProgressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.setProgressText}>
            {completedSets} of {totalSets} sets
            completed
          </Text>
        </View>

        {restSeconds > 0 ? (
          <View style={styles.restCard}>
            <View>
              <Text style={styles.restLabel}>
                REST TIMER
              </Text>

              <Text style={styles.restTime}>
                {formatTime(restSeconds)}
              </Text>
            </View>

            <Pressable
              style={styles.restButton}
              onPress={onStopRest}
            >
              <Text style={styles.restButtonText}>
                Skip rest
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.manualRestButton}
            onPress={onStartRest}
          >
            <Text style={styles.manualRestButtonText}>
              Start 90-second rest timer
            </Text>
          </Pressable>
        )}

        {exercises.map(
          (exercise, exerciseIndex) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseNumber={
                exerciseIndex + 1
              }
              onUpdateSet={onUpdateSet}
              onToggleSet={onToggleSet}
              onAddSet={onAddSet}
            />
          )
        )}

        <Pressable
          style={({ pressed }) => [
            styles.finishButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onFinishWorkout}
        >
          <Text style={styles.finishButtonText}>
            Finish workout
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

type ExerciseCardProps = {
  exercise: Exercise;
  exerciseNumber: number;
  onUpdateSet: (
    exerciseId: number,
    setId: number,
    field: 'weight' | 'reps',
    value: string
  ) => void;
  onToggleSet: (
    exerciseId: number,
    setId: number
  ) => void;
  onAddSet: (exerciseId: number) => void;
};

function ExerciseCard({
  exercise,
  exerciseNumber,
  onUpdateSet,
  onToggleSet,
  onAddSet,
}: ExerciseCardProps) {
  return (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseMuscle}>
        {exerciseNumber}.{' '}
        {exercise.muscle.toUpperCase()}
      </Text>

      <Text style={styles.exerciseName}>
        {exercise.name}
      </Text>

      <View style={styles.setHeaderRow}>
        <Text style={styles.setHeaderNumber}>
          SET
        </Text>

        <Text style={styles.setHeaderInput}>
          WEIGHT
        </Text>

        <Text style={styles.setHeaderInput}>
          REPS
        </Text>

        <Text style={styles.setHeaderDone}>
          DONE
        </Text>
      </View>

      {exercise.sets.map(
        (workoutSet, index) => (
          <View
            key={workoutSet.id}
            style={[
              styles.setRow,
              workoutSet.completed &&
                styles.completedSetRow,
            ]}
          >
            <View
              style={styles.setNumberCircle}
            >
              <Text
                style={styles.setNumberText}
              >
                {index + 1}
              </Text>
            </View>

            <TextInput
              style={styles.setInput}
              value={workoutSet.weight}
              onChangeText={(value) =>
                onUpdateSet(
                  exercise.id,
                  workoutSet.id,
                  'weight',
                  value
                )
              }
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0"
            />

            <TextInput
              style={styles.setInput}
              value={workoutSet.reps}
              onChangeText={(value) =>
                onUpdateSet(
                  exercise.id,
                  workoutSet.id,
                  'reps',
                  value
                )
              }
              keyboardType="number-pad"
              selectTextOnFocus
              placeholder="0"
            />

            <Pressable
              style={[
                styles.checkButton,
                workoutSet.completed &&
                  styles.checkButtonCompleted,
              ]}
              onPress={() =>
                onToggleSet(
                  exercise.id,
                  workoutSet.id
                )
              }
            >
              <Text
                style={[
                  styles.checkText,
                  workoutSet.completed &&
                    styles.checkTextCompleted,
                ]}
              >
                {workoutSet.completed
                  ? '✓'
                  : ''}
              </Text>
            </Pressable>
          </View>
        )
      )}

      <Pressable
        style={styles.addSetButton}
        onPress={() =>
          onAddSet(exercise.id)
        }
      >
        <Text style={styles.addSetButtonText}>
          + Add set
        </Text>
      </Pressable>
    </View>
  );
}

type WorkoutSummaryProps = {
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  workoutSeconds: number;
  onDone: () => void;
};

function WorkoutSummary({
  completedSets,
  totalSets,
  totalVolume,
  workoutSeconds,
  onDone,
}: WorkoutSummaryProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.summaryContent
      }
    >
      <View style={styles.summaryCheck}>
        <Text style={styles.summaryCheckText}>
          ✓
        </Text>
      </View>

      <Text style={styles.summaryTitle}>
        Workout complete
      </Text>

      <Text style={styles.summarySubtitle}>
        Great job finishing your Push Day
        workout.
      </Text>

      <View style={styles.summaryCard}>
        <SummaryRow
          label="Duration"
          value={formatTime(
            workoutSeconds
          )}
        />

        <View style={styles.divider} />

        <SummaryRow
          label="Sets completed"
          value={`${completedSets} / ${totalSets}`}
        />

        <View style={styles.divider} />

        <SummaryRow
          label="Training volume"
          value={`${totalVolume.toLocaleString()} lb`}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.finishButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onDone}
      >
        <Text style={styles.finishButtonText}>
          Return home
        </Text>
      </Pressable>
    </ScrollView>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>
        {label}
      </Text>

      <Text style={styles.summaryRowValue}>
        {value}
      </Text>
    </View>
  );
}

type WorkoutDetailProps = {
  value: string;
  label: string;
};

function WorkoutDetail({
  value,
  label,
}: WorkoutDetailProps) {
  return (
    <View style={styles.workoutDetail}>
      <Text
        style={styles.workoutDetailValue}
      >
        {value}
      </Text>

      <Text
        style={styles.workoutDetailLabel}
      >
        {label}
      </Text>
    </View>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  goal: string;
};

function StatCard({
  title,
  value,
  goal,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statGoal}>
        {goal}
      </Text>
    </View>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 110,
  },
  smallHeading: {
    color: '#557063',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#6D7972',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
  },
  mainCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },
  cardLabel: {
    color: '#C8D6CE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  largeNumber: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    marginTop: 8,
  },
  cardText: {
    color: '#D7E1DB',
    fontSize: 14,
    marginTop: 2,
  },
  progressBackground: {
    height: 10,
    backgroundColor: '#52705E',
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sectionTitle: {
    color: '#17211C',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  statTitle: {
    color: '#68756E',
    fontSize: 13,
    fontWeight: '700',
  },
  statValue: {
    color: '#17211C',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
  },
  statGoal: {
    color: '#87918C',
    fontSize: 12,
    marginTop: 4,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  workoutLabel: {
    color: '#34704D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  workoutTitle: {
    color: '#17211C',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 6,
  },
  cardDescription: {
    color: '#6C7771',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  workoutDetailsRow: {
    flexDirection: 'row',
    marginTop: 22,
    marginBottom: 20,
  },
  workoutDetail: {
    flex: 1,
  },
  workoutDetailValue: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
  },
  workoutDetailLabel: {
    color: '#7A857F',
    fontSize: 11,
    marginTop: 3,
  },
  startButton: {
    backgroundColor: '#2D6B48',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  mealRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInfo: {
    flex: 1,
    paddingRight: 12,
  },
  mealTitle: {
    color: '#17211C',
    fontSize: 15,
    fontWeight: '800',
  },
  mealDetail: {
    color: '#77817C',
    fontSize: 13,
    marginTop: 4,
  },
  mealCalories: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEA',
  },
  cardLabelDark: {
    color: '#78837D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  weight: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  change: {
    color: '#2D6B48',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  workoutContent: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 120,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  cancelText: {
    color: '#9A4E4E',
    fontSize: 14,
    fontWeight: '800',
    paddingTop: 8,
  },
  workoutStatusCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusRight: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  statusLabel: {
    color: '#C8D6CE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 5,
  },
  workoutProgressBackground: {
    width: '100%',
    height: 9,
    backgroundColor: '#52705E',
    borderRadius: 8,
    marginTop: 18,
    overflow: 'hidden',
  },
  workoutProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  setProgressText: {
    color: '#D7E1DB',
    fontSize: 12,
    marginTop: 9,
  },
  restCard: {
    backgroundColor: '#E4EEE8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restLabel: {
    color: '#517060',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  restTime: {
    color: '#1D4A32',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 4,
  },
  restButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  restButtonText: {
    color: '#2D6B48',
    fontSize: 12,
    fontWeight: '800',
  },
  manualRestButton: {
    backgroundColor: '#E4EEE8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  manualRestButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
  },
  exerciseMuscle: {
    color: '#34704D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  exerciseName: {
    color: '#17211C',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 17,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  setHeaderNumber: {
    width: 42,
    color: '#86918B',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  setHeaderInput: {
    flex: 1,
    color: '#86918B',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  setHeaderDone: {
    width: 48,
    color: '#86918B',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 5,
    marginBottom: 6,
  },
  completedSetRow: {
    backgroundColor: '#EFF6F1',
  },
  setNumberCircle: {
    width: 34,
    height: 34,
    marginHorizontal: 4,
    borderRadius: 17,
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    color: '#59655F',
    fontSize: 13,
    fontWeight: '800',
  },
  setInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F5F4',
    borderRadius: 10,
    marginHorizontal: 4,
    color: '#17211C',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  checkButton: {
    width: 38,
    height: 38,
    marginLeft: 5,
    marginRight: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CAD1CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#2D6B48',
    borderColor: '#2D6B48',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  checkTextCompleted: {
    color: '#FFFFFF',
  },
  addSetButton: {
    borderWidth: 1,
    borderColor: '#D7DEDA',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 7,
  },
  addSetButtonText: {
    color: '#2D6B48',
    fontSize: 13,
    fontWeight: '800',
  },
  finishButton: {
    backgroundColor: '#1D4A32',
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  summaryContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  summaryCheck: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#2D6B48',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  summaryCheckText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  summaryTitle: {
    color: '#17211C',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 24,
  },
  summarySubtitle: {
    color: '#6D7972',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 28,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  summaryRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRowLabel: {
    color: '#6D7972',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRowValue: {
    color: '#17211C',
    fontSize: 17,
    fontWeight: '900',
  },
});
