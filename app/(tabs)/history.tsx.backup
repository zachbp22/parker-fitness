import {
  deleteWeightForDate,
  getProfile,
  getTodayDate,
  loadActiveProfile,
  loadFoods,
  loadProfiles as loadStoredProfiles,
  loadWeights,
  loadWorkouts,
  saveActiveProfile,
  setWeightForDate,
  type Profile,
  type ProfileId,
  type StoredFood,
  type StoredWeight,
  type StoredWorkout
} from '@/services/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type HistoryTab =
  | 'nutrition'
  | 'workouts'
  | 'weight';

type NutritionDay = {
  date: string;
  foods: StoredFood[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEALS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

export default function HistoryScreen() {
  const [activeProfile, setActiveProfile] =
    useState<ProfileId>('zach');
  const [profiles, setProfiles] =
    useState<Profile[]>([]);

  const [activeTab, setActiveTab] =
    useState<HistoryTab>('nutrition');

  const [foods, setFoods] =
    useState<StoredFood[]>([]);

  const [workouts, setWorkouts] =
    useState<StoredWorkout[]>([]);
const [weights, setWeights] =
  useState<StoredWeight[]>([]);

const [editingWeight, setEditingWeight] =
  useState<StoredWeight | null>(null);

const [editWeightValue, setEditWeightValue] =
  useState('');
async function handleSaveWeightEdit() {
  if (!editingWeight) {
    return;
  }

  const parsedWeight = Number(editWeightValue);

  if (
    !Number.isFinite(parsedWeight) ||
    parsedWeight <= 0
  ) {
    Alert.alert(
      'Invalid Weight',
      'Please enter a valid weight.'
    );
    return;
  }

  try {
    await setWeightForDate(
      editingWeight.profileId,
      editingWeight.date,
      parsedWeight
    );

    const updatedWeights = await loadWeights();

    setWeights(updatedWeights);
    setEditingWeight(null);
    setEditWeightValue('');
  } catch (error) {
    console.error(
      'Unable to update weight:',
      error
    );

    Alert.alert(
      'Unable to Update',
      'The weight could not be updated.'
    );
  }
}
  const [expandedDate, setExpandedDate] =
    useState<string | null>(null);

  const [
    expandedWorkoutId,
    setExpandedWorkoutId,
  ] = useState<string | null>(null);
const [
  expandedExerciseName,
  setExpandedExerciseName,
] = useState<string | null>(null);
  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

const [profile, setProfile] =
  useState<Profile>({
    id: 'loading',
    name: 'User',
    calorieGoal: 0,
    proteinGoal: 0,
  });

  const loadHistory = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
const [
  savedProfile,
  savedFoods,
  savedWorkouts,
  savedProfiles,
  savedWeights,
] = await Promise.all([
  loadActiveProfile(),
  loadFoods<StoredFood>(),
  loadWorkouts(),
  loadStoredProfiles(),
  loadWeights(),
]);

setActiveProfile(savedProfile);
setFoods(savedFoods ?? []);
setWorkouts(savedWorkouts);
setWeights(savedWeights);
setProfiles(savedProfiles);

const selectedProfile =
  savedProfiles.find(
    (item) => item.id === savedProfile
  );

if (selectedProfile) {
  setProfile(selectedProfile);
}
      } catch (error) {
        console.error(
          'Error loading history:',
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  
function handleDeleteWeight(entry: StoredWeight) {
  Alert.alert(
    'Delete weight?',
    `Delete the ${entry.weight} lb entry from ${formatDate(
      entry.date
    )}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWeightForDate(
              entry.profileId,
              entry.date
            );

            const updatedWeights =
              await loadWeights();

            setWeights(updatedWeights);

            if (
              editingWeight?.profileId ===
                entry.profileId &&
              editingWeight?.date === entry.date
            ) {
              setEditingWeight(null);
              setEditWeightValue('');
            }
          } catch (error) {
            console.error(
              'Unable to delete weight:',
              error
            );

            Alert.alert(
              'Unable to Delete',
              'The weight could not be deleted.'
            );
          }
        },
      },
    ]
  );
}
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  async function changeProfile(
  profileId: ProfileId
) {
  setActiveProfile(profileId);

  setExpandedDate(null);
  setExpandedWorkoutId(null);

  try {
    const selectedProfile =
      await getProfile(profileId);

    if (selectedProfile) {
      setProfile(selectedProfile);
    }

    await saveActiveProfile(profileId);
  } catch (error) {
    console.error(
      'Error changing active profile:',
      error
    );
  }
}
  function refresh() {
    setRefreshing(true);
    loadHistory(false);
  }

  const profileFoods = useMemo(() => {
    return foods.filter(
      (food) =>
        food.profileId === activeProfile
    );
  }, [foods, activeProfile]);

  const profileWorkouts = useMemo(() => {
    return workouts
      .filter(
        (workout) =>
          workout.profileId ===
          activeProfile
      )
      .sort(
        (a, b) =>
          new Date(
            b.completedAt
          ).getTime() -
          new Date(
            a.completedAt
          ).getTime()
      );
  }, [workouts, activeProfile]);
  const exerciseProgress = useMemo(() => {
  const exerciseMap = new Map<
    string,
    {
      name: string;
      sessions: {
        date: string;
        weight: number;
        reps: number;
      }[];
    }
  >();

  const chronologicalWorkouts = [
    ...profileWorkouts,
  ].reverse();

  for (const workout of chronologicalWorkouts) {
    for (const exercise of workout.exercises) {
      const completedSets = exercise.sets.filter(
        (set) => set.completed
      );

      if (completedSets.length === 0) {
        continue;
      }

      const validSets = completedSets
        .map((set) => ({
          weight: Number(set.weight),
          reps: Number(set.reps),
        }))
        .filter(
          (set) =>
            Number.isFinite(set.weight) &&
            Number.isFinite(set.reps)
        );

      if (validSets.length === 0) {
        continue;
      }

      const bestSet = validSets.reduce(
        (best, current) =>
          current.weight > best.weight
            ? current
            : best
      );

      const existing =
        exerciseMap.get(exercise.name);

      const session = {
        date: workout.date,
        weight: bestSet.weight,
        reps: bestSet.reps,
      };

      if (existing) {
        existing.sessions.push(session);
      } else {
        exerciseMap.set(exercise.name, {
          name: exercise.name,
          sessions: [session],
        });
      }
    }
  }

  return Array.from(exerciseMap.values()).map(
    (exercise) => {
      const latest =
        exercise.sessions[
          exercise.sessions.length - 1
        ];

      const previous =
        exercise.sessions.length > 1
          ? exercise.sessions[
              exercise.sessions.length - 2
            ]
          : null;

      const bestWeight = Math.max(
        ...exercise.sessions.map(
          (session) => session.weight
        )
      );

      return {
        ...exercise,
        latestWeight: latest.weight,
        latestReps: latest.reps,
        previousWeight:
          previous?.weight ?? null,
        bestWeight,
        weightChange:
          previous !== null
            ? latest.weight - previous.weight
            : null,
      };
    }
  );
}, [profileWorkouts]);
const profileWeights = useMemo(() => {
  return weights
    .filter(
      (weight) =>
        weight.profileId === activeProfile
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date)
    );
}, [weights, activeProfile]);
const weightChartData = [...profileWeights]
  .reverse()
  .map((entry) => ({
    date: entry.date,
    weight: entry.weight,
  }));
const currentWeight =
  profileWeights.length > 0
    ? profileWeights[0].weight
    : null;

const startingWeight =
  profileWeights.length > 0
    ? profileWeights[
        profileWeights.length - 1
      ].weight
    : null;

const weightChange =
  currentWeight !== null &&
  startingWeight !== null
    ? currentWeight - startingWeight
    : null;
    const goalWeight =
  profile.weightGoal ?? null;

const weightRemaining =
  currentWeight !== null &&
  startingWeight !== null &&
  goalWeight !== null
    ? goalWeight < startingWeight
      ? Math.max(0, currentWeight - goalWeight)
      : goalWeight > startingWeight
        ? Math.max(0, goalWeight - currentWeight)
        : 0
    : null;
    const weightProgress =
  currentWeight !== null &&
  startingWeight !== null &&
  goalWeight !== null &&
  startingWeight !== goalWeight
    ? Math.min(
        100,
        Math.max(
          0,
          ((startingWeight - currentWeight) /
            (startingWeight - goalWeight)) *
            100
        )
      )
    : 0;
    const poundsChanged =
  currentWeight !== null &&
  startingWeight !== null
    ? Math.abs(
        currentWeight - startingWeight
      )
    : null;
    const weightChangeLabel =
  startingWeight !== null &&
  goalWeight !== null
    ? goalWeight < startingWeight
      ? 'LOST'
      : goalWeight > startingWeight
        ? 'GAINED'
        : 'CHANGED'
    : 'CHANGED';
  const nutritionDays =
    useMemo<NutritionDay[]>(() => {
      const grouped =
        new Map<string, StoredFood[]>();

      for (const food of profileFoods) {
        const date =
          food.date ?? getTodayDate();

        const current =
          grouped.get(date) ?? [];

        current.push(food);

        grouped.set(date, current);
      }

      return Array.from(
        grouped.entries()
      )
        .map(([date, dayFoods]) => {
          return {
            date,
            foods: dayFoods,

            calories: dayFoods.reduce(
              (sum, food) =>
                sum + food.calories,
              0
            ),

            protein: dayFoods.reduce(
              (sum, food) =>
                sum + food.protein,
              0
            ),

            carbs: dayFoods.reduce(
              (sum, food) =>
                sum + food.carbs,
              0
            ),

            fat: dayFoods.reduce(
              (sum, food) =>
                sum + food.fat,
              0
            ),
          };
        })
        .sort(
          (a, b) =>
            parseDate(
              b.date
            ).getTime() -
            parseDate(
              a.date
            ).getTime()
        );
    }, [profileFoods]);

  const averageCalories =
    nutritionDays.length > 0
      ? Math.round(
          nutritionDays.reduce(
            (sum, day) =>
              sum + day.calories,
            0
          ) / nutritionDays.length
        )
      : 0;

  const averageProtein =
    nutritionDays.length > 0
      ? Math.round(
          nutritionDays.reduce(
            (sum, day) =>
              sum + day.protein,
            0
          ) / nutritionDays.length
        )
      : 0;

  const totalWorkoutMinutes =
    Math.round(
      profileWorkouts.reduce(
        (sum, workout) =>
          sum +
          workout.durationSeconds /
            60,
        0
      )
    );

  const totalWorkoutVolume =
    Math.round(
      profileWorkouts.reduce(
        (sum, workout) =>
          sum +
          workout.totalVolume,
        0
      )
    );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#24583B"
        />

        <Text style={styles.loadingText}>
          Loading history...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <Text style={styles.appName}>
        PARKER FITNESS
      </Text>

      <Text style={styles.title}>
        History
      </Text>

      <Text style={styles.subtitle}>
        Review your nutrition and
        workout progress.
      </Text>

      <View style={styles.profileCard}>
        <Text style={styles.smallLabel}>
          ACTIVE PROFILE
        </Text>

        <View
          style={
            styles.profileSwitcher
          }
        >
         {profiles.map((item) => (
  <ProfileButton
    key={item.id}
    label={item.name}
    selected={
      activeProfile === item.id
    }
    onPress={() =>
      changeProfile(item.id)
    }
  />
))}
        </View>

        <Text style={styles.viewingText}>
          Viewing {profile.name}'s
          history
        </Text>
      </View>

      <View style={styles.tabSwitcher}>
        <TabButton
          label="Nutrition"
          selected={
            activeTab === 'nutrition'
          }
          onPress={() =>
            setActiveTab('nutrition')
          }
        />

        <TabButton
          label="Workouts"
          selected={
            activeTab === 'workouts'
          }
          onPress={() =>
            setActiveTab('workouts')
          }
        />
        <TabButton
  label="Weight"
  selected={
    activeTab === 'weight'
  }
  onPress={() =>
    setActiveTab('weight')
  }
/>
      </View>

      {activeTab ===
      'nutrition' ? (
        <>
          <View
            style={styles.heroCard}
          >
            <Text
              style={
                styles.heroEyebrow
              }
            >
              {profile.name.toUpperCase()}
              {' • '}
              NUTRITION
            </Text>

            <View
              style={
                styles.heroStats
              }
            >
              <HeroStat
                value={String(
                  nutritionDays.length
                )}
                label="Days Logged"
              />

              <HeroStat
                value={String(
                  averageCalories
                )}
                label="Avg Calories"
              />

              <HeroStat
                value={`${averageProtein}g`}
                label="Avg Protein"
              />
            </View>
          </View>

          <View style={styles.goalCard}>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Daily Goals
            </Text>

            <View style={styles.goalRow}>
              <Goal
                value={String(
                  profile.calorieGoal
                )}
                label="Calories"
              />

              <View
                style={
                  styles.goalDivider
                }
              />

              <Goal
                value={`${profile.proteinGoal}g`}
                label="Protein"
              />
            </View>
          </View>

          <Text
            style={
              styles.historyTitle
            }
          >
            Daily Nutrition
          </Text>

          {nutritionDays.length ===
          0 ? (
            <EmptyCard
              title="No nutrition history yet"
              message="Foods you log in Meals will appear here automatically."
            />
          ) : (
            nutritionDays.map(
              (day) => {
                const expanded =
                  expandedDate ===
                  day.date;

                return (
                  <View
                    key={day.date}
                    style={
                      styles.dayCard
                    }
                  >
                    <Pressable
                      onPress={() =>
                        setExpandedDate(
                          expanded
                            ? null
                            : day.date
                        )
                      }
                    >
                      <View
                        style={
                          styles.cardHeader
                        }
                      >
                        <View
                          style={
                            styles.flex
                          }
                        >
                          <Text
                            style={
                              styles.dayTitle
                            }
                          >
                            {formatDate(
                              day.date
                            )}
                          </Text>

                          <Text
                            style={
                              styles.daySubtitle
                            }
                          >
                            {
                              day.foods
                                .length
                            }{' '}
                            food
                            {day.foods
                              .length ===
                            1
                              ? ''
                              : 's'}{' '}
                            logged
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.expand
                          }
                        >
                          {expanded
                            ? '−'
                            : '+'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.macroRow
                        }
                      >
                        <Macro
                          value={String(
                            Math.round(
                              day.calories
                            )
                          )}
                          label="CAL"
                        />

                        <Macro
                          value={`${roundMacro(
                            day.protein
                          )}g`}
                          label="PROTEIN"
                        />

                        <Macro
                          value={`${roundMacro(
                            day.carbs
                          )}g`}
                          label="CARBS"
                        />

                        <Macro
                          value={`${roundMacro(
                            day.fat
                          )}g`}
                          label="FAT"
                        />
                      </View>

                      <Progress
                        label="Calories"
                        current={Math.round(
                          day.calories
                        )}
                        goal={
                          profile.calorieGoal
                        }
                      />

                      <Progress
                        label="Protein"
                        current={roundMacro(
                          day.protein
                        )}
                        goal={
                          profile.proteinGoal
                        }
                        suffix="g"
                      />
                    </Pressable>

                    {expanded && (
                      <View
                        style={
                          styles.details
                        }
                      >
                        {MEALS.map(
                          (meal) => {
                            const mealFoods =
                              day.foods.filter(
                                (
                                  food
                                ) =>
                                  food.meal ===
                                  meal
                              );

                            if (
                              mealFoods.length ===
                              0
                            ) {
                              return null;
                            }

                            const mealCalories =
                              mealFoods.reduce(
                                (
                                  sum,
                                  food
                                ) =>
                                  sum +
                                  food.calories,
                                0
                              );

                            return (
                              <View
                                key={
                                  meal
                                }
                                style={
                                  styles.meal
                                }
                              >
                                <View
                                  style={
                                    styles.mealHeader
                                  }
                                >
                                  <Text
                                    style={
                                      styles.mealName
                                    }
                                  >
                                    {
                                      meal
                                    }
                                  </Text>

                                  <Text
                                    style={
                                      styles.mealTotal
                                    }
                                  >
                                    {Math.round(
                                      mealCalories
                                    )}{' '}
                                    cal
                                  </Text>
                                </View>

                                {mealFoods.map(
                                  (
                                    food
                                  ) => (
                                    <View
                                      key={
                                        food.id
                                      }
                                      style={
                                        styles.foodRow
                                      }
                                    >
                                      <View
                                        style={
                                          styles.flex
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.foodName
                                          }
                                        >
                                          {
                                            food.name
                                          }
                                        </Text>

                                        <Text
                                          style={
                                            styles.foodServing
                                          }
                                        >
                                          {
                                            food.servingSize
                                          }{' '}
                                          {
                                            food.servingUnit
                                          }
                                        </Text>
                                      </View>

                                      <View
                                        style={
                                          styles.foodNumbers
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.foodCalories
                                          }
                                        >
                                          {Math.round(
                                            food.calories
                                          )}{' '}
                                          cal
                                        </Text>

                                        <Text
                                          style={
                                            styles.foodProtein
                                          }
                                        >
                                          {roundMacro(
                                            food.protein
                                          )}
                                          g protein
                                        </Text>
                                      </View>
                                    </View>
                                  )
                                )}
                              </View>
                            );
                          }
                        )}
                      </View>
                    )}
                  </View>
                );
              }
            )
          )}
        </>
      ) : activeTab === 'workouts' ? (
  <>
          <View
            style={styles.heroCard}
          >
            <Text
              style={
                styles.heroEyebrow
              }
            >
              {profile.name.toUpperCase()}
              {' • '}
              WORKOUTS
            </Text>

            <View
              style={
                styles.heroStats
              }
            >
              <HeroStat
                value={String(
                  profileWorkouts.length
                )}
                label="Workouts"
              />

              <HeroStat
                value={String(
                  totalWorkoutMinutes
                )}
                label="Minutes"
              />

              <HeroStat
                value={formatVolume(
                  totalWorkoutVolume
                )}
                label="Volume"
              />
            </View>
          </View>
          <Text style={styles.historyTitle}>
            Exercise Progress
          </Text>

          {exerciseProgress.length === 0 ? (
  <EmptyCard
    title="No exercise progress yet"
    message="Complete workouts to build your exercise progress history."
  />
) : (
  exerciseProgress.map((exercise) => (
    <View
      key={exercise.name}
      style={styles.exerciseProgressCard}
    >
      <View style={styles.exerciseProgressHeader}>
        <View style={styles.exerciseProgressTitleArea}>
          <Text style={styles.exerciseProgressName}>
            {exercise.name}
          </Text>

          <Text style={styles.exerciseProgressSessions}>
            {exercise.sessions.length}{' '}
            {exercise.sessions.length === 1
              ? 'session'
              : 'sessions'}
          </Text>
        </View>

        <View style={styles.exerciseProgressPR}>
          <Text style={styles.exerciseProgressPRLabel}>
            BEST
          </Text>

          <Text style={styles.exerciseProgressPRValue}>
            {exercise.bestWeight} lb
          </Text>
        </View>
      </View>

      <View style={styles.exerciseProgressStats}>
        <View style={styles.exerciseProgressStat}>
          <Text style={styles.exerciseProgressValue}>
            {exercise.latestWeight}
          </Text>
          <Text style={styles.exerciseProgressLabel}>
            Latest lb
          </Text>
        </View>

        <View style={styles.exerciseProgressStat}>
          <Text style={styles.exerciseProgressValue}>
            {exercise.latestReps}
          </Text>
          <Text style={styles.exerciseProgressLabel}>
            Latest reps
          </Text>
        </View>

        <View style={styles.exerciseProgressStat}>
          <Text style={styles.exerciseProgressValue}>
            {exercise.bestWeight}
          </Text>
          <Text style={styles.exerciseProgressLabel}>
            Best lb
          </Text>
        </View>
      </View>

        {exercise.weightChange !== null && (
        <View style={styles.exerciseProgressChange}>
          <Text style={styles.exerciseProgressChangeText}>
            {exercise.weightChange > 0
              ? `Up ${exercise.weightChange} lb from last session`
              : exercise.weightChange < 0
                ? `Down ${Math.abs(
                    exercise.weightChange
                  )} lb from last session`
                : 'Same weight as last session'}
          </Text>
        </View>
      )}
      <Pressable
        style={styles.exerciseProgressToggle}
        onPress={() =>
          setExpandedExerciseName(
            expandedExerciseName === exercise.name
              ? null
              : exercise.name
          )
        }
      >
        <Text style={styles.exerciseProgressToggleText}>
          {expandedExerciseName === exercise.name
            ? 'Hide Progress'
            : 'Show Progress'}
        </Text>
      </Pressable>
      {expandedExerciseName === exercise.name &&
  exercise.sessions.length >= 2 && (
    <View style={styles.exerciseTrendChartCard}>
      <Text style={styles.exerciseTrendTitle}>
        Weight Trend
      </Text>

      <LineChart
        data={{
          labels: exercise.sessions.map((session) =>
            new Date(
              `${session.date}T00:00:00`
            ).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
            })
          ),
          datasets: [
            {
              data: exercise.sessions.map(
                (session) => session.weight
              ),
            },
          ],
        }}
        width={
          Dimensions.get('window').width - 76
        }
        height={190}
        yAxisSuffix=" lb"
        chartConfig={{
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 1,
          color: (opacity = 1) =>
            `rgba(45, 107, 72, ${opacity})`,
          labelColor: (opacity = 1) =>
            `rgba(116, 128, 120, ${opacity})`,
          propsForDots: {
            r: '5',
          },
        }}
        bezier
        style={styles.exerciseTrendChart}
      />
    </View>
  )}
  {expandedExerciseName === exercise.name &&
  exercise.sessions.length < 2 && (
    <Text style={styles.exerciseTrendEmpty}>
      Complete this exercise in another workout to see a trend chart.
    </Text>
  )}
    </View>
  ))
)}

    
          <Text
            style={
              styles.historyTitle
            }
          >
            Workout History
          </Text>

          {profileWorkouts.length ===
          0 ? (
            <EmptyCard
              title="No workout history yet"
              message="Completed workouts will appear here automatically."
            />
          ) : (
            profileWorkouts.map(
              (workout) => {
                const expanded =
                  expandedWorkoutId ===
                  workout.id;

                return (
                  <View
                    key={workout.id}
                    style={
                      styles.workoutCard
                    }
                  >
                    <Pressable
                      onPress={() =>
                        setExpandedWorkoutId(
                          expanded
                            ? null
                            : workout.id
                        )
                      }
                    >
                      <View
                        style={
                          styles.cardHeader
                        }
                      >
                        <View
                          style={
                            styles.flex
                          }
                        >
                          <Text
                            style={
                              styles.workoutName
                            }
                          >
                            {
                              workout.workoutName
                            }
                          </Text>

                          <Text
                            style={
                              styles.daySubtitle
                            }
                          >
                            {formatDate(
                              workout.date
                            )}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.expand
                          }
                        >
                          {expanded
                            ? '−'
                            : '+'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.workoutStats
                        }
                      >
                        <WorkoutStat
                          value={`${Math.round(
                            workout.durationSeconds /
                              60
                          )} min`}
                          label="Duration"
                        />

                        <WorkoutStat
                          value={`${workout.completedSets}/${workout.totalSets}`}
                          label="Sets"
                        />

                        <WorkoutStat
                          value={formatVolume(
                            workout.totalVolume
                          )}
                          label="Volume"
                        />
                      </View>
                    </Pressable>

                    {expanded && (
                      <View
                        style={
                          styles.details
                        }
                      >
                        <Text
                          style={
                            styles.workoutType
                          }
                        >
                          {
                            workout.workoutType
                          }
                        </Text>

                        {workout.exercises.map(
                          (
                            exercise
                          ) => (
                            <View
                              key={
                                exercise.id
                              }
                              style={
                                styles.exercise
                              }
                            >
                              <Text
                                style={
                                  styles.exerciseName
                                }
                              >
                                {
                                  exercise.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.exerciseMuscle
                                }
                              >
                                {
                                  exercise.muscle
                                }
                              </Text>

                              {exercise.sets.map(
                                (
                                  set,
                                  index
                                ) => (
                                  <View
                                    key={
                                      set.id
                                    }
                                    style={
                                      styles.setRow
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.setNumber
                                      }
                                    >
                                      Set{' '}
                                      {index +
                                        1}
                                    </Text>

                                    <Text
                                      style={
                                        styles.setDetails
                                      }
                                    >
                                      {set.weight ||
                                        '0'}{' '}
                                      lb ×{' '}
                                      {set.reps ||
                                        '0'}{' '}
                                      reps
                                    </Text>

                                    <Text
                                      style={
                                        set.completed
                                          ? styles.complete
                                          : styles.incomplete
                                      }
                                    >
                                      {set.completed
                                        ? '✓'
                                        : '—'}
                                    </Text>
                                  </View>
                                )
                              )}
                            </View>
                          )
                        )}
                      </View>
                    )}
                  </View>
                );
              }
            )
          )}
      </>
) : (
  <>
    <View style={styles.heroCard}>
      <Text style={styles.heroEyebrow}>
        {profile.name.toUpperCase()}
        {' • '}
        WEIGHT
      </Text>

      <View style={styles.heroStats}>
       <HeroStat
  value={
    currentWeight !== null
      ? `${currentWeight} lb`
      : '--'
  }
  label="Current"
/>

<HeroStat
  value={
    goalWeight !== null
      ? `${goalWeight} lb`
      : '--'
  }
  label="Goal"
/>

<HeroStat
  value={`${weightProgress.toFixed(0)}%`}
  label="Progress"
/>
      </View>
    </View>
<View style={styles.weightProgressCard}>
  <View style={styles.weightProgressRow}>
    <View style={styles.weightProgressStat}>
      <Text style={styles.weightProgressLabel}>
        STARTING
      </Text>
      <Text style={styles.weightProgressValue}>
        {startingWeight !== null
          ? `${startingWeight} lb`
          : '--'}
      </Text>
    </View>

    <View style={styles.weightProgressStat}>
    <Text style={styles.weightProgressLabel}>
  {weightChangeLabel}
</Text>
      <Text style={styles.weightProgressValue}>
        {poundsChanged !== null
          ? `${poundsChanged.toFixed(1)} lb`
          : '--'}
      </Text>
    </View>

    <View style={styles.weightProgressStat}>
      <Text style={styles.weightProgressLabel}>
        REMAINING
      </Text>
      <Text style={styles.weightProgressValue}>
        {weightRemaining !== null
          ? `${weightRemaining.toFixed(1)} lb`
          : '--'}
      </Text>
    </View>
  </View>

  <View style={styles.weightProgressTrack}>
    <View
      style={[
        styles.weightProgressFill,
        {
          width: `${weightProgress}%`,
        },
      ]}
    />
  </View>
</View>
{weightChartData.length >= 2 && (
  <>
    <Text style={styles.historyTitle}>
      Weight Trend
    </Text>

    <View style={styles.weightChartCard}>
      <LineChart
        data={{
          labels: weightChartData.map((entry) =>
            new Date(
              `${entry.date}T00:00:00`
            ).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
            })
          ),
          datasets: [
            {
              data: weightChartData.map(
                (entry) => entry.weight
              ),
            },
          ],
        }}
        width={
          Dimensions.get('window').width - 76
        }
        height={220}
        yAxisSuffix=" lb"
        chartConfig={{
          backgroundGradientFrom: '#FFFFFF',
          backgroundGradientTo: '#FFFFFF',
          decimalPlaces: 1,
          color: (opacity = 1) =>
            `rgba(45, 107, 72, ${opacity})`,
          labelColor: (opacity = 1) =>
            `rgba(116, 128, 120, ${opacity})`,
          propsForDots: {
            r: '5',
          },
        }}
        bezier
        style={styles.weightChart}
      />
    </View>
  </>
)}
    <Text style={styles.historyTitle}>
      Weight History
    </Text>

    {profileWeights.length === 0 ? (
   
      <EmptyCard
        title="No weight history yet"
        message="Weights you log on Home will appear here automatically."
      />
    ) : (
profileWeights.map((entry, index) => {
  const previousEntry =
    profileWeights[index + 1];

  const changeFromPrevious =
    previousEntry
      ? entry.weight - previousEntry.weight
      : null;

 return (
  <View
    key={`${entry.profileId}-${entry.date}`}
    style={styles.workoutCard}
  >
    {editingWeight?.profileId === entry.profileId &&
    editingWeight?.date === entry.date ? (
      <>
        <Text style={styles.workoutName}>
          Edit Weight
        </Text>

        <Text style={styles.daySubtitle}>
          {formatDate(entry.date)}
        </Text>

        <TextInput
          value={editWeightValue}
          onChangeText={setEditWeightValue}
          keyboardType="decimal-pad"
          placeholder="Weight"
          style={styles.weightEditInput}
        />

        <View style={styles.weightActionRow}>
          <Pressable
            style={styles.weightSaveButton}
            onPress={handleSaveWeightEdit}
          >
            <Text style={styles.weightSaveButtonText}>
              Save
            </Text>
          </Pressable>

          <Pressable
            style={styles.weightCancelButton}
            onPress={() => {
              setEditingWeight(null);
              setEditWeightValue('');
            }}
          >
            <Text style={styles.weightCancelButtonText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </>
    ) : (
      <>
        <Text style={styles.workoutName}>
          {entry.weight} lb
        </Text>

        <Text style={styles.daySubtitle}>
          {formatDate(entry.date)}
        </Text>

        <Text style={styles.weightHistoryChange}>
          {changeFromPrevious === null
            ? 'Starting weight'
            : changeFromPrevious < 0
              ? `Down ${Math.abs(
                  changeFromPrevious
                ).toFixed(1)} lb`
              : changeFromPrevious > 0
                ? `Up ${changeFromPrevious.toFixed(
                    1
                  )} lb`
                : 'No change'}
        </Text>

        <View style={styles.weightActionRow}>
          <Pressable
            style={styles.weightEditButton}
            onPress={() => {
              setEditingWeight(entry);
              setEditWeightValue(
                String(entry.weight)
              );
            }}
          >
            <Text style={styles.weightEditButtonText}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.weightDeleteButton}
            onPress={() =>
              handleDeleteWeight(entry)
            }
          >
            <Text style={styles.weightDeleteButtonText}>
              Delete
            </Text>
          </Pressable>
        </View>
      </>
    )}
  </View>
);
})
    )}
  </>
)}
    </ScrollView>
  );
}

function ProfileButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.profileButton,
        selected &&
          styles.profileButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.profileButtonText,
          selected &&
            styles.profileButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TabButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.tabButton,
        selected &&
          styles.tabButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabText,
          selected &&
            styles.tabTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroValue}>
        {value}
      </Text>

      <Text style={styles.heroLabel}>
        {label}
      </Text>
    </View>
  );
}

function Goal({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.goal}>
      <Text style={styles.goalValue}>
        {value}
      </Text>

      <Text style={styles.goalLabel}>
        {label}
      </Text>
    </View>
  );
}

function Macro({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>
        {value}
      </Text>

      <Text style={styles.macroLabel}>
        {label}
      </Text>
    </View>
  );
}

function Progress({
  label,
  current,
  goal,
  suffix = '',
}: {
  label: string;
  current: number;
  goal: number;
  suffix?: string;
}) {
  const percentage =
    goal > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (current / goal) * 100
          )
        )
      : 0;

  return (
    <View style={styles.progress}>
      <View
        style={
          styles.progressHeader
        }
      >
        <Text
          style={
            styles.progressLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.progressNumbers
          }
        >
          {current}
          {suffix} / {goal}
          {suffix}
        </Text>
      </View>

      <View
        style={styles.progressTrack}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function WorkoutStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={styles.workoutStat}
    >
      <Text
        style={
          styles.workoutStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.workoutStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.emptyMessage}
      >
        {message}
      </Text>
    </View>
  );
}

function parseDate(
  dateString: string
) {
  const [year, month, day] =
    dateString
      .split('-')
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatDate(
  dateString: string
) {
  if (
    dateString === getTodayDate()
  ) {
    return 'Today';
  }

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    dateString ===
    toDateString(yesterday)
  ) {
    return 'Yesterday';
  }

  return parseDate(
    dateString
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );
}

function toDateString(
  date: Date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function roundMacro(
  value: number
) {
  return (
    Math.round(value * 10) / 10
  );
}

function formatVolume(
  value: number
) {
  if (value >= 1000000) {
    return `${(
      value / 1000000
    ).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(1)}K`;
  }

  return String(
    Math.round(value)
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#F4F6F5',
    },
exerciseProgressCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 18,
  marginBottom: 12,
},

exerciseProgressHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 18,
},

exerciseProgressTitleArea: {
  flex: 1,
  paddingRight: 12,
},

exerciseProgressName: {
  color: '#18231D',
  fontSize: 18,
  fontWeight: '900',
},

exerciseProgressSessions: {
  color: '#748078',
  fontSize: 13,
  fontWeight: '700',
  marginTop: 4,
},

exerciseProgressPR: {
  alignItems: 'flex-end',
  backgroundColor: '#EDF5F0',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 8,
},

exerciseProgressPRLabel: {
  color: '#607068',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

exerciseProgressPRValue: {
  color: '#24583B',
  fontSize: 16,
  fontWeight: '900',
  marginTop: 2,
},

exerciseProgressStats: {
  flexDirection: 'row',
  backgroundColor: '#F4F6F5',
  borderRadius: 14,
  paddingVertical: 14,
},

exerciseProgressStat: {
  flex: 1,
  alignItems: 'center',
},

exerciseProgressValue: {
  color: '#18231D',
  fontSize: 20,
  fontWeight: '900',
},

exerciseProgressLabel: {
  color: '#748078',
  fontSize: 10,
  fontWeight: '700',
  marginTop: 3,
},

exerciseProgressChange: {
  marginTop: 12,
},

exerciseProgressChangeText: {
  color: '#24583B',
  fontSize: 12,
  fontWeight: '800',
},
exerciseProgressToggle: {
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 14,
  paddingVertical: 10,
  borderTopWidth: 1,
  borderTopColor: '#E5EAE7',
},

exerciseProgressToggleText: {
  color: '#24583B',
  fontSize: 12,
  fontWeight: '900',
},
exerciseTrendChartCard: {
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#E5EAE7',
  overflow: 'hidden',
},

exerciseTrendTitle: {
  color: '#18231D',
  fontSize: 14,
  fontWeight: '900',
  marginBottom: 10,
},

exerciseTrendChart: {
  borderRadius: 14,
},

exerciseTrendEmpty: {
  color: '#748078',
  fontSize: 12,
  fontWeight: '700',
  lineHeight: 18,
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: '#E5EAE7',
},
    content: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 120,
    },

    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F4F6F5',
    },

    loadingText: {
      marginTop: 12,
      color: '#607068',
      fontWeight: '700',
    },

    appName: {
      color: '#607068',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5,
    },

    title: {
      color: '#18231D',
      fontSize: 34,
      fontWeight: '900',
      marginTop: 7,
    },

    subtitle: {
      color: '#748078',
      fontSize: 15,
      lineHeight: 21,
      marginTop: 4,
      marginBottom: 20,
    },

    profileCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
    },

    smallLabel: {
      color: '#607068',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      marginBottom: 10,
    },

    profileSwitcher: {
      flexDirection: 'row',
      backgroundColor: '#EDF1EF',
      borderRadius: 14,
      padding: 4,
    },

    profileButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 11,
    },

    profileButtonSelected: {
      backgroundColor: '#24583B',
    },

    profileButtonText: {
      color: '#607068',
      fontSize: 14,
      fontWeight: '800',
    },

    profileButtonTextSelected: {
      color: '#FFFFFF',
    },

    viewingText: {
      color: '#7C8881',
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 9,
    },

    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: '#E7ECE9',
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
    },

    tabButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 11,
    },

    tabButtonSelected: {
      backgroundColor: '#24583B',
    },

    tabText: {
      color: '#607068',
      fontSize: 14,
      fontWeight: '800',
    },

    tabTextSelected: {
      color: '#FFFFFF',
    },

    heroCard: {
      backgroundColor: '#24583B',
      borderRadius: 23,
      padding: 21,
      marginBottom: 12,
    },

    heroEyebrow: {
      color: '#C7D7CD',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },

    heroStats: {
      flexDirection: 'row',
      marginTop: 18,
    },

    heroStat: {
      flex: 1,
      alignItems: 'center',
    },

    heroValue: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '900',
    },

    heroLabel: {
      color: '#C7D7CD',
      fontSize: 9,
      fontWeight: '700',
      marginTop: 4,
      textAlign: 'center',
    },

    goalCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      marginBottom: 22,
    },

    sectionTitle: {
      color: '#18231D',
      fontSize: 17,
      fontWeight: '900',
      marginBottom: 14,
    },

    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    goal: {
      flex: 1,
      alignItems: 'center',
    },

    goalValue: {
      color: '#24583B',
      fontSize: 24,
      fontWeight: '900',
    },

    goalLabel: {
      color: '#748078',
      fontSize: 10,
      fontWeight: '700',
      marginTop: 3,
    },

    goalDivider: {
      height: 40,
      width: 1,
      backgroundColor: '#E4E9E6',
    },

    historyTitle: {
      color: '#18231D',
      fontSize: 20,
      fontWeight: '900',
      marginBottom: 11,
    },

    dayCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 17,
      marginBottom: 12,
    },

    workoutCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 17,
      marginBottom: 12,
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    flex: {
      flex: 1,
    },

    dayTitle: {
      color: '#18231D',
      fontSize: 17,
      fontWeight: '900',
    },

    workoutName: {
      color: '#18231D',
      fontSize: 17,
      fontWeight: '900',
    },

    daySubtitle: {
      color: '#87918C',
      fontSize: 11,
      fontWeight: '600',
      marginTop: 3,
    },

    expand: {
      color: '#24583B',
      fontSize: 26,
      fontWeight: '700',
      paddingLeft: 12,
    },

    macroRow: {
      flexDirection: 'row',
      marginTop: 17,
      marginBottom: 13,
    },

    macro: {
      flex: 1,
      alignItems: 'center',
    },

    macroValue: {
      color: '#18231D',
      fontSize: 15,
      fontWeight: '900',
    },

    macroLabel: {
      color: '#87918C',
      fontSize: 8,
      fontWeight: '800',
      marginTop: 3,
    },

    progress: {
      marginTop: 10,
    },

    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },

    progressLabel: {
      color: '#607068',
      fontSize: 10,
      fontWeight: '800',
    },

    progressNumbers: {
      color: '#7C8881',
      fontSize: 10,
      fontWeight: '700',
    },

    progressTrack: {
      height: 7,
      borderRadius: 999,
      backgroundColor: '#E5EAE7',
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: '#24583B',
    },

    details: {
      borderTopWidth: 1,
      borderTopColor: '#E9ECEA',
      marginTop: 17,
      paddingTop: 4,
    },

    meal: {
      marginTop: 14,
    },

    mealHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },

    mealName: {
      color: '#24583B',
      fontSize: 13,
      fontWeight: '900',
    },

    mealTotal: {
      color: '#748078',
      fontSize: 10,
      fontWeight: '800',
    },

    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F2F1',
    },

    foodName: {
      color: '#18231D',
      fontSize: 13,
      fontWeight: '800',
    },

    foodServing: {
      color: '#87918C',
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
    },

    foodNumbers: {
      alignItems: 'flex-end',
      marginLeft: 10,
    },

    foodCalories: {
      color: '#18231D',
      fontSize: 11,
      fontWeight: '900',
    },

    foodProtein: {
      color: '#748078',
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
    },

    workoutStats: {
      flexDirection: 'row',
      backgroundColor: '#F4F6F5',
      borderRadius: 14,
      paddingVertical: 12,
      marginTop: 15,
    },

    workoutStat: {
      flex: 1,
      alignItems: 'center',
    },

    workoutStatValue: {
      color: '#18231D',
      fontSize: 14,
      fontWeight: '900',
    },

    workoutStatLabel: {
      color: '#87918C',
      fontSize: 9,
      fontWeight: '700',
      marginTop: 3,
    },

    workoutType: {
      color: '#24583B',
      fontSize: 12,
      fontWeight: '900',
      marginTop: 9,
      marginBottom: 4,
    },

    exercise: {
      backgroundColor: '#F7F9F8',
      borderRadius: 14,
      padding: 13,
      marginTop: 9,
    },

    exerciseName: {
      color: '#18231D',
      fontSize: 14,
      fontWeight: '900',
    },

    exerciseMuscle: {
      color: '#748078',
      fontSize: 10,
      fontWeight: '700',
      marginTop: 2,
      marginBottom: 8,
    },

    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: '#E7ECE9',
    },

    setNumber: {
      width: 55,
      color: '#607068',
      fontSize: 11,
      fontWeight: '800',
    },

    setDetails: {
      flex: 1,
      color: '#18231D',
      fontSize: 11,
      fontWeight: '800',
    },

    complete: {
      color: '#24583B',
      fontSize: 15,
      fontWeight: '900',
    },

    incomplete: {
      color: '#A0AAA5',
      fontSize: 15,
      fontWeight: '900',
    },
weightProgressCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 18,
  marginBottom: 24,
},

weightProgressRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 18,
},

weightProgressStat: {
  flex: 1,
  alignItems: 'center',
},

weightProgressLabel: {
  color: '#748078',
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1,
  marginBottom: 6,
},

weightProgressValue: {
  color: '#18231D',
  fontSize: 20,
  fontWeight: '900',
},

weightProgressTrack: {
  height: 10,
  backgroundColor: '#E4ECE7',
  borderRadius: 999,
  overflow: 'hidden',
},
weightHistoryChange: {
  color: '#2D6B48',
  fontSize: 13,
  fontWeight: '800',
  marginTop: 8,
},
weightEditInput: {
  backgroundColor: '#F4F6F5',
  borderWidth: 1,
  borderColor: '#DCE4DF',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  marginTop: 14,
  fontSize: 16,
  fontWeight: '700',
  color: '#18231D',
},

weightActionRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 14,
},

weightEditButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E7EFEA',
  borderRadius: 12,
  paddingVertical: 11,
},

weightEditButtonText: {
  color: '#24583B',
  fontSize: 13,
  fontWeight: '900',
},

weightDeleteButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FCE9E9',
  borderRadius: 12,
  paddingVertical: 11,
},

weightDeleteButtonText: {
  color: '#A33A3A',
  fontSize: 13,
  fontWeight: '900',
},

weightSaveButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#24583B',
  borderRadius: 12,
  paddingVertical: 11,
},

weightSaveButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '900',
},

weightCancelButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#EDF1EF',
  borderRadius: 12,
  paddingVertical: 11,
},

weightCancelButtonText: {
  color: '#607068',
  fontSize: 13,
  fontWeight: '900',
},
weightChartCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  paddingVertical: 16,
  paddingHorizontal: 4,
  marginBottom: 28,
  overflow: 'hidden',
},

weightChart: {
  borderRadius: 16,
},
weightProgressFill: {
  height: '100%',
  backgroundColor: '#2D6B48',
  borderRadius: 999,
},

    emptyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
    },

    emptyTitle: {
      color: '#18231D',
      fontSize: 17,
      fontWeight: '900',
      textAlign: 'center',
    },

    emptyMessage: {
      color: '#748078',
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 7,
    },
  });