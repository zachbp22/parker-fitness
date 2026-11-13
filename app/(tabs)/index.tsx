import {
  Exercise,
  LEG_EXERCISES,
  PULL_EXERCISES,
  PUSH_EXERCISES,
  WIFE_CARDIO_CORE,
  WIFE_FULL_BODY_A,
  WIFE_FULL_BODY_B,
  WIFE_FULL_BODY_C,
  WorkoutSet,
} from '@/data/defaultworkouts';
import {
  addWorkout,
  clearWorkoutDraft,
  getLatestWeight,
  getProfile,
  getTodayDate,
  getWaterForDate,
  loadActiveProfile,
  loadFoods,
  loadLastExercisePerformance,
  loadProfiles as loadStoredProfiles,
  loadWorkoutDraft,
  loadWorkoutsForProfile,
  saveActiveProfile,
  saveWorkoutDraft,
  setWaterForDate,
  setWeightForDate,
  syncWaterToCloud,
  syncWeightToCloud,
  syncWorkoutToCloud,
  type Profile,
  type ProfileId,
  type StoredWorkout,
  type StoredWorkoutDraft
} from '@/services/storage';
import {
  getCurrentUserCloudProfile,
  supabase,
} from '@/services/supabase';
import { router, useFocusEffect } from 'expo-router';
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
  getTodaysWorkout,
  getTomorrowsWorkout,
} from '@/data/workoutSchedule';

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
  profileId?: ProfileId;
};

const WATER_GOAL = 96;

function createFreshExercises(
  profileId: ProfileId = 'zach'
): Exercise[] {
  const todaysWorkout =
    getTodaysWorkout(profileId);

  let workoutExercises: Exercise[];

  if (profileId === 'wife') {
    if (todaysWorkout.name === 'Full Body A') {
      workoutExercises = WIFE_FULL_BODY_A;
    } else if (
      todaysWorkout.name === 'Full Body B'
    ) {
      workoutExercises = WIFE_FULL_BODY_B;
    } else if (
      todaysWorkout.name === 'Full Body C'
    ) {
      workoutExercises = WIFE_FULL_BODY_C;
    } else if (
      todaysWorkout.name === 'Cardio & Core'
    ) {
      workoutExercises = WIFE_CARDIO_CORE;
    } else {
      workoutExercises = [];
    }
  } else {
    if (todaysWorkout.name === 'Pull Day') {
      workoutExercises = PULL_EXERCISES;
    } else if (
      todaysWorkout.name === 'Legs & Core'
    ) {
      workoutExercises = LEG_EXERCISES;
    } else if (
      todaysWorkout.name === 'Push Day'
    ) {
      workoutExercises = PUSH_EXERCISES;
    } else {
      workoutExercises = [];
    }
  }

  const workoutId = Date.now();

  return workoutExercises.map(
    (exercise, exerciseIndex) => ({
      ...exercise,

      sets: exercise.sets.map(
        (workoutSet, setIndex) => ({
          ...workoutSet,

          id:
            workoutId +
            exerciseIndex * 100 +
            setIndex,

          completed: false,
        })
      ),
    })
  );
}


export default function HomeScreen() {
 
  const [screen, setScreen] =
    useState<'home' | 'workout' | 'summary'>('home');

const [exercises, setExercises] =
  useState<Exercise[]>(() =>
    createFreshExercises('zach')
  );

  const [foods, setFoods] = useState<FoodItem[]>([]);

const [activeProfile, setActiveProfile] =
  useState<ProfileId>('zach');
const [profiles, setProfiles] =
  useState<Profile[]>([]);

const [currentProfile, setCurrentProfile] =
  useState<Profile | null>(null);
  const [
  signedInCloudProfileId,
  setSignedInCloudProfileId,
] = useState<string | null>(null);
  useEffect(() => {
  async function loadSignedInCloudProfile() {
    try {
      const cloudProfile =
        await getCurrentUserCloudProfile();

      setSignedInCloudProfileId(
        cloudProfile?.id ?? null
      );
    } catch (error) {
      console.error(
        'Unable to load signed-in cloud profile:',
        error
      );

      setSignedInCloudProfileId(null);
    }
  }

  loadSignedInCloudProfile();
}, []);
const [waterOunces, setWaterOunces] =
  useState(0);
  const [currentWeight, setCurrentWeight] =
  useState<number | null>(null);
  const [showWeightForm, setShowWeightForm] =
  useState(false);

const [weightInput, setWeightInput] =
  useState('');
useEffect(() => {
  async function loadCurrentProfile() {
    const profile =
      await getProfile(activeProfile);

    setCurrentProfile(profile);
  }

  loadCurrentProfile();
}, [activeProfile]);
useEffect(() => {
  async function loadCurrentWater() {
    const today = getTodayDate();

    const savedWater =
      await getWaterForDate(
        activeProfile,
        today
      );

    setWaterOunces(savedWater);
  }

  loadCurrentWater();
}, [activeProfile]);
useEffect(() => {
  async function loadCurrentWeight() {
    const latestWeight =
      await getLatestWeight(activeProfile);

    setCurrentWeight(
      latestWeight?.weight ?? null
    );
  }

  loadCurrentWeight();
}, [activeProfile]);
async function updateWater(amount: number) {
  const today = getTodayDate();

  const newAmount = Math.max(
    0,
    waterOunces + amount
  );

  setWaterOunces(newAmount);

  try {
    await setWaterForDate(
      activeProfile,
      today,
      newAmount
    );

    const isSignedInProfile =
      currentProfile?.cloudProfileId ===
      signedInCloudProfileId;

    if (isSignedInProfile) {
      try {
        await syncWaterToCloud(
          today,
          newAmount
        );
      } catch (cloudError) {
        console.error(
          'Unable to sync water to cloud:',
          cloudError
        );
      }
    } else {
      console.log(
        'Skipping cloud water sync because the viewed profile is not the signed-in profile.'
      );
    }
  } catch (error) {
    console.error(
      'Unable to update water:',
      error
    );

    setWaterOunces(waterOunces);
  }
}
async function saveCurrentWeight() {
  const parsedWeight = Number(weightInput);

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
    const today = getTodayDate();

    // Always save the viewed profile locally.
    await setWeightForDate(
      activeProfile,
      today,
      parsedWeight
    );

    setCurrentWeight(parsedWeight);
    setWeightInput('');
    setShowWeightForm(false);

    // Only sync to Supabase when the viewed
    // profile belongs to the signed-in account.
    const isSignedInProfile =
      currentProfile?.cloudProfileId ===
      signedInCloudProfileId;

    if (isSignedInProfile) {
      try {
        await syncWeightToCloud(
          today,
          parsedWeight
        );
      } catch (cloudError) {
        console.error(
          'Unable to sync weight to cloud:',
          cloudError
        );
      }
    } else {
      console.log(
        'Skipping cloud weight sync because the viewed profile is not the signed-in profile.'
      );
    }
  } catch (error) {
    console.error(
      'Unable to save weight:',
      error
    );

    Alert.alert(
      'Unable to Save',
      'Your weight could not be saved.'
    );
  }
}
const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);

  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [newPRs, setNewPRs] = useState<
  { exerciseName: string; weight: number }[]
>([]);

  const loadDashboardFoods = useCallback(async () => {
    try {
const savedFoods =
  await loadFoods<FoodItem>();
const savedProfile = await loadActiveProfile();
const savedProfiles =
  await loadStoredProfiles();
const today = getTodayDate();

      const todaysProfileFoods = (savedFoods ?? []).filter(
        (food) =>
          food.date === today &&
          food.profileId === savedProfile
      );

  setActiveProfile(savedProfile);
setProfiles(savedProfiles);
setFoods(todaysProfileFoods);
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
  if (!workoutRunning || screen !== 'workout') {
    return;
  }

  const saveDraft = async () => {
    const todaysWorkout =
      getTodaysWorkout(activeProfile);

    const draft: StoredWorkoutDraft = {
      profileId: activeProfile,
      date: getTodayDate(),
      workoutName: todaysWorkout.name,
      workoutType: todaysWorkout.type,
      durationSeconds: workoutSeconds,
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle,
        sets: exercise.sets.map((workoutSet) => ({
          id: workoutSet.id,
          weight: workoutSet.weight,
          reps: workoutSet.reps,
          completed: workoutSet.completed,
        })),
      })),
      savedAt: new Date().toISOString(),
    };

    try {
      await saveWorkoutDraft(draft);
    } catch (error) {
      console.error(
        'Unable to save workout draft:',
        error
      );
    }
  };

if (workoutSeconds % 10 === 0) {
  void saveDraft();
}
}, [
  exercises,
  workoutSeconds,
  workoutRunning,
  screen,
  activeProfile,
]);
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
      (total, exercise) =>
        total + exercise.sets.length,
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
    return exercises.reduce(
      (exerciseTotal, exercise) => {
        const exerciseVolume =
          exercise.sets.reduce(
            (setTotal, workoutSet) => {
              if (!workoutSet.completed) {
                return setTotal;
              }

              const weight =
                Number(workoutSet.weight) || 0;

              const reps =
                Number(workoutSet.reps) || 0;

              return (
                setTotal +
                weight * reps
              );
            },
            0
          );

        return exerciseTotal + exerciseVolume;
      },
      0
    );
  }, [exercises]);
async function startWorkout() {
    try {
const draft =
  await loadWorkoutDraft(activeProfile);
    const today = getTodayDate();

    if (
      draft &&
      draft.profileId === activeProfile &&
      draft.date === today
    ) {
      Alert.alert(
        'Resume workout?',
        'You have an unfinished workout from today.',
        [
          {
            text: 'Discard & Start New',
            style: 'destructive',
onPress: async () => {
await clearWorkoutDraft(
  activeProfile
);
await startFreshWorkout();
},
          },
          {
            text: 'Resume Workout',
            onPress: () => {
              setExercises(draft.exercises);
              setWorkoutSeconds(
                draft.durationSeconds
              );
              setRestSeconds(0);
              setWorkoutSaved(false);
              setIsSavingWorkout(false);
              setNewPRs([]);
              setWorkoutRunning(true);
              setScreen('workout');
            },
          },
        ]
      );

      return;
    }
      if (draft && draft.date !== today) {
  await clearWorkoutDraft(
    activeProfile
  );
}
  } catch (error) {
    console.error(
      'Unable to load workout draft:',
      error
    );
  }

  await startFreshWorkout();
}
async function startFreshWorkout() {
  const freshExercises =
    createFreshExercises(activeProfile);

  try {
    const exercisesWithHistory =
      await Promise.all(
        freshExercises.map(
          async (exercise) => {
            const previousExercise =
              await loadLastExercisePerformance(
                activeProfile,
                exercise.name
              );
              

            if (!previousExercise) {
              return exercise;
            }

            const completedPreviousSets =
              previousExercise.sets.filter(
                (set) => set.completed
              );

            if (
              completedPreviousSets.length === 0
            ) {
              return exercise;
            }
const previousWeight =
  Number(
    completedPreviousSets[0].weight
  );

const allSetsCompleted =
  previousExercise.sets.length > 0 &&
  previousExercise.sets.every(
    (set) => set.completed
  );

const suggestedWeight =
  Number.isFinite(previousWeight)
    ? allSetsCompleted
      ? previousWeight + 5
      : previousWeight
    : null;
          return {
  ...exercise,

  previousWeight:
    completedPreviousSets[0].weight,

  previousReps:
    completedPreviousSets[0].reps,
suggestedWeight:
  suggestedWeight !== null
    ? String(suggestedWeight)
    : undefined,
     progressionStatus:
  allSetsCompleted
    ? ('increase' as const)
    : ('hold' as const),
  sets: exercise.sets.map(
    (workoutSet, setIndex) => {
                  const previousSet =
                    completedPreviousSets[
                      Math.min(
                        setIndex,
                        completedPreviousSets.length -
                          1
                      )
                    ];

                  return {
                    ...workoutSet,
                    weight:
                      previousSet.weight ||
                      workoutSet.weight,
                    reps:
                      previousSet.reps ||
                      workoutSet.reps,
                    completed: false,
                  };
                }
              ),
            };
          }
        )
      );

    setExercises(
      exercisesWithHistory
    );
  } catch (error) {
    console.error(
      'Unable to load previous workout performance:',
      error
    );

    setExercises(freshExercises);
  }

  setWorkoutSeconds(0);
  setRestSeconds(0);

  setWorkoutSaved(false);
  setIsSavingWorkout(false);
  setNewPRs([]);

  setWorkoutRunning(true);

  setScreen('workout');
}

  function updateSet(
    exerciseId: number,
    setId: number,
    field: 'weight' | 'reps',
    value: string
  ) {
    const numericValue =
      value.replace(/[^0-9.]/g, '');

    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map(
            (workoutSet) => {
              if (workoutSet.id !== setId) {
                return workoutSet;
              }

              return {
                ...workoutSet,
                [field]: numericValue,
              };
            }
          ),
        };
      })
    );
  }

  function toggleSet(
    exerciseId: number,
    setId: number
  ) {
    let wasCompleted = false;

    setExercises((currentExercises) =>
      currentExercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map(
            (workoutSet) => {
              if (workoutSet.id !== setId) {
                return workoutSet;
              }

              wasCompleted =
                workoutSet.completed;

              return {
                ...workoutSet,
                completed:
                  !workoutSet.completed,
              };
            }
          ),
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
          exercise.sets[
            exercise.sets.length - 1
          ];

        const newSet: WorkoutSet = {
          id:
            Date.now() +
            Math.floor(Math.random() * 1000),
          weight: lastSet?.weight ?? '',
          reps: lastSet?.reps ?? '',
          completed: false,
        };

        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            newSet,
          ],
        };
      })
    );
  }

 async function finishWorkout() {
  if (completedSets === 0) {
    Alert.alert(
      'No completed sets',
      'Complete at least one set before finishing the workout.'
    );

    return;
  }

  if (
    isSavingWorkout ||
    workoutSaved
  ) {
    return;
  }

  setIsSavingWorkout(true);
  setWorkoutRunning(false);
  setRestSeconds(0);

  try {
    const completedAt = new Date();
  const todaysWorkout =
  getTodaysWorkout(activeProfile);

    const workout: StoredWorkout = {
      id: `${activeProfile}-${completedAt.getTime()}`,
      profileId: activeProfile,
      date: getTodayDate(),
      completedAt:
        completedAt.toISOString(),
      workoutName: todaysWorkout.name,
      workoutType: todaysWorkout.type,
      durationSeconds:
        workoutSeconds,
      completedSets,
      totalSets,
      totalVolume,

      exercises: exercises.map(
        (exercise) => ({
          id: exercise.id,
          name: exercise.name,
          muscle: exercise.muscle,

          sets: exercise.sets.map(
            (workoutSet) => ({
              id: workoutSet.id,
              weight:
                workoutSet.weight,
              reps: workoutSet.reps,
              completed:
                workoutSet.completed,
            })
          ),
        })
      ),
    };
const previousWorkouts =
  await loadWorkoutsForProfile(
    activeProfile
  );

const detectedPRs: {
  exerciseName: string;
  weight: number;
}[] = [];

workout.exercises.forEach(
  (currentExercise) => {
    const completedCurrentWeights =
      currentExercise.sets
        .filter((set) => set.completed)
        .map((set) => Number(set.weight))
        .filter((weight) =>
          Number.isFinite(weight)
        );

    if (
      completedCurrentWeights.length === 0
    ) {
      return;
    }

    const currentMaxWeight = Math.max(
      ...completedCurrentWeights
    );

    const previousWeights =
      previousWorkouts.flatMap(
        (previousWorkout) =>
          previousWorkout.exercises
            .filter(
              (exercise) =>
                exercise.name ===
                currentExercise.name
            )
            .flatMap((exercise) =>
              exercise.sets
                .filter(
                  (set) => set.completed
                )
                .map((set) =>
                  Number(set.weight)
                )
                .filter((weight) =>
                  Number.isFinite(weight)
                )
            )
      );

    const previousMaxWeight =
      previousWeights.length > 0
        ? Math.max(...previousWeights)
        : 0;

    if (
      currentMaxWeight >
      previousMaxWeight
    ) {
      detectedPRs.push({
        exerciseName:
          currentExercise.name,
        weight: currentMaxWeight,
      });
    }
  }
);

setNewPRs(detectedPRs);

await addWorkout(workout);
await syncWorkoutToCloud(workout);

await clearWorkoutDraft(
  activeProfile
);

setWorkoutSaved(true);

setScreen('summary');
  } catch (error) {
    console.error(
      'Unable to save workout:',
      error
    );

    setWorkoutRunning(true);

    Alert.alert(
      'Workout not saved',
      'There was a problem saving your workout. Please try again.'
    );
  } finally {
    setIsSavingWorkout(false);
  }
}

  function returnHome() {
    setScreen('home');
  }
async function changeActiveProfile(
  profileId: ProfileId
) {
  try {
    await saveActiveProfile(profileId);

    setActiveProfile(profileId);

    const savedFoods =
      await loadFoods<FoodItem>();

    const today = getTodayDate();

    const todaysProfileFoods =
      (savedFoods ?? []).filter(
        (food) =>
          food.date === today &&
          food.profileId === profileId
      );

    setFoods(todaysProfileFoods);
  } catch (error) {
    console.error(
      'Unable to change active profile:',
      error
    );
  }
}
  if (screen === 'workout') {
    return (
      <WorkoutScreen
      activeProfile={activeProfile}
        exercises={exercises}
        workoutSeconds={workoutSeconds}
        restSeconds={restSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
        isSavingWorkout={isSavingWorkout}
        onUpdateSet={updateSet}
        onToggleSet={toggleSet}
        onAddSet={addSet}
        onFinishWorkout={finishWorkout}
       onCancel={async () => {
const today = getTodayDate();
const todaysWorkout =
  getTodaysWorkout(activeProfile);

const draft: StoredWorkoutDraft = {
  profileId: activeProfile,
  date: today,
  workoutName: todaysWorkout.name,
  workoutType: todaysWorkout.type,
    durationSeconds: workoutSeconds,
    exercises: exercises.map(
      (exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle,
        sets: exercise.sets.map(
          (workoutSet) => ({
            id: workoutSet.id,
            weight: workoutSet.weight,
            reps: workoutSet.reps,
            completed:
              workoutSet.completed,
          })
        ),
      })
    ),
    savedAt: new Date().toISOString(),
  };

  try {
    await saveWorkoutDraft(draft);

    setWorkoutRunning(false);
    setRestSeconds(0);
    setScreen('home');
  } catch (error) {
    console.error(
      'Unable to save workout draft on exit:',
      error
    );

    Alert.alert(
      'Unable to Save Workout',
      'Your unfinished workout could not be saved. Please try again.'
    );
  }
}}
        onStartRest={() =>
          setRestSeconds(90)
        }
        onStopRest={() =>
          setRestSeconds(0)
        }
      />
    );
  }

  if (screen === 'summary') {
    return (
 <WorkoutSummary
  activeProfile={activeProfile}
  profileName={
    currentProfile?.name ?? 'User'
  }
        completedSets={completedSets}
        totalSets={totalSets}
        totalVolume={totalVolume}
        workoutSeconds={workoutSeconds}
       newPRs={newPRs} 
        onDone={returnHome}
      />
    );
  }

  return (
<HomeDashboard
  foods={foods}
  waterOunces={waterOunces}
  currentWeight={currentWeight}
  showWeightForm={showWeightForm}
weightInput={weightInput}
onWeightInputChange={setWeightInput}
onShowWeightFormChange={setShowWeightForm}
onSaveWeight={saveCurrentWeight}
  profiles={profiles}
  activeProfile={activeProfile}
  currentProfile={currentProfile}
  onProfileChange={changeActiveProfile}
  onUpdateWater={updateWater}
  onStartWorkout={startWorkout}
/>
);
}

type HomeDashboardProps = {
  foods: FoodItem[];
  waterOunces: number;
  currentWeight: number | null;
  showWeightForm: boolean;
  weightInput: string;
  onWeightInputChange: (value: string) => void;
  onShowWeightFormChange: (show: boolean) => void;
  onSaveWeight: () => void;
  onUpdateWater: (amount: number) => void;
  profiles: Profile[];
  activeProfile: ProfileId;
  currentProfile: Profile | null;
  onProfileChange: (
    profileId: ProfileId
  ) => void;
  onStartWorkout: () => void;
};

function HomeDashboard({
  foods,
  waterOunces,
  currentWeight,
  showWeightForm,
  weightInput,
  onWeightInputChange,
  onShowWeightFormChange,
  onUpdateWater,
  onSaveWeight,
  profiles,
  activeProfile,
  currentProfile,
  onProfileChange,
  onStartWorkout,
}: HomeDashboardProps) {

   const todaysWorkout =
  getTodaysWorkout(activeProfile);

const tomorrowsWorkout =
  getTomorrowsWorkout(activeProfile);

const calorieGoal =
  currentProfile?.calorieGoal ?? 0;

const proteinGoal =
  currentProfile?.proteinGoal ?? 0;

  const caloriesUsed = foods.reduce(
    (total, food) =>
      total + food.calories,
    0
  );

  const proteinUsed = foods.reduce(
    (total, food) =>
      total + food.protein,
    0
  );

  const caloriesRemaining = Math.max(
    calorieGoal - caloriesUsed,
    0
  );

  const calorieProgress =
    calorieGoal === 0
      ? 0
      : Math.min(
          caloriesUsed / calorieGoal,
          1
        );

  const breakfastFoods =
    foods.filter(
      (food) =>
        food.meal === 'Breakfast'
    );

  const lunchFoods =
    foods.filter(
      (food) =>
        food.meal === 'Lunch'
    );

  const dinnerFoods =
    foods.filter(
      (food) =>
        food.meal === 'Dinner'
    );

  async function handleSignOut() {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace('/auth');
    } catch (error) {
      console.error(
        'Unable to sign out:',
        error
      );

      Alert.alert(
        'Unable to Sign Out',
        'There was a problem signing out. Please try again.'
      );
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
    >
      <Pressable
        onPress={handleSignOut}
        style={{
          backgroundColor: '#1f6b45',
          padding: 14,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          SIGN OUT
        </Text>
      </Pressable>
<Pressable
  onPress={() => router.push('/household')}
  style={{
    backgroundColor: '#1c1f26',
    borderWidth: 1,
    borderColor: '#2D6B48',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  }}
>
  <Text
    style={{
      color: '#2D6B48',
      fontWeight: '800',
      textAlign: 'center',
    }}
  >
    HOUSEHOLD
  </Text>
</Pressable>
      <Text style={styles.smallHeading}>
        PARKER FITNESS
      </Text>

      <Text style={styles.title}>
  {getGreeting()},{' '}
  {currentProfile?.name ?? 'User'}
</Text>

      <Text style={styles.subtitle}>
        Here is today's progress.
      </Text>
<View style={styles.profileCard}>
        <Text style={styles.profileLabel}>
          ACTIVE PROFILE
        </Text>

        <View style={styles.profileSelector}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={[
                styles.profileButton,
                activeProfile === profile.id &&
                  styles.profileButtonActive,
              ]}
              onPress={() =>
                onProfileChange(profile.id)
              }
            >
              <Text
                style={[
                  styles.profileButtonText,
                  activeProfile === profile.id &&
                    styles.profileButtonTextActive,
                ]}
              >
                {profile.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.profileViewingText}>
          Viewing {currentProfile?.name ?? 'User'}'s dashboard
        </Text>
    <Pressable
  style={styles.manageProfilesButton}
  onPress={() => router.push('/profiles')}
>
  <Text style={styles.manageProfilesButtonText}>
    Manage Profiles
  </Text>
</Pressable>
</View>
      <View style={styles.mainCard}>
        <Text style={styles.cardLabel}>
          CALORIES REMAINING
        </Text>

        <Text style={styles.largeNumber}>
          {caloriesRemaining.toLocaleString()}
        </Text>

        <Text style={styles.cardText}>
          {caloriesUsed.toLocaleString()}{' '}
          of{' '}
          {calorieGoal.toLocaleString()}{' '}
          calories used
        </Text>

        <View
          style={
            styles.progressBackground
          }
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  calorieProgress * 100
                }%`,
              },
            ]}
          />
        </View>
      </View>

      <Text
        style={styles.sectionTitle}
      >
        Daily goals
      </Text>

      <View style={styles.row}>
        <StatCard
          title="Protein"
          value={`${proteinUsed}g`}
          goal={`${proteinGoal}g goal`}
        />

        <StatCard
          title="Water"
          value={`${waterOunces} oz`}
          goal={`${WATER_GOAL} oz goal`}
        />
      </View>
<View style={styles.waterControls}>
  <Pressable
    style={styles.waterButton}
    onPress={() => onUpdateWater(-8)}
  >
    <Text style={styles.waterButtonText}>
      -8 oz
    </Text>
  </Pressable>

  <Pressable
    style={styles.waterButton}
    onPress={() => onUpdateWater(8)}
  >
    <Text style={styles.waterButtonText}>
      +8 oz
    </Text>
  </Pressable>

  <Pressable
    style={styles.waterButton}
    onPress={() => onUpdateWater(16)}
  >
    <Text style={styles.waterButtonText}>
      +16 oz
    </Text>
  </Pressable>
</View>
<Text style={styles.sectionTitle}>
  Weight progress
</Text>

<View style={styles.weightCard}>
  {!showWeightForm ? (
    <>
      <View>
        <Text style={styles.weightLabel}>
          CURRENT WEIGHT
        </Text>

        <Text style={styles.weightValue}>
          {currentWeight !== null
            ? `${currentWeight} lbs`
            : 'Not logged'}
        </Text>
      </View>

      <Pressable
        style={styles.logWeightButton}
        onPress={() => {
          onWeightInputChange(
            currentWeight !== null
              ? String(currentWeight)
              : ''
          );

          onShowWeightFormChange(true);
        }}
      >
        <Text style={styles.logWeightButtonText}>
          Log Weight
        </Text>
      </Pressable>
    </>
  ) : (
    <View style={styles.weightForm}>
      <Text style={styles.weightLabel}>
        ENTER WEIGHT
      </Text>

      <View style={styles.weightInputRow}>
        <TextInput
          style={styles.weightInput}
          value={weightInput}
          onChangeText={onWeightInputChange}
          keyboardType="decimal-pad"
          placeholder="225"
          placeholderTextColor="#9AA39E"
          autoFocus
        />

        <Text style={styles.weightUnit}>
          lbs
        </Text>
      </View>

      <View style={styles.weightActionRow}>
        <Pressable
          style={styles.cancelWeightButton}
          onPress={() => {
            onWeightInputChange('');
            onShowWeightFormChange(false);
          }}
        >
          <Text style={styles.cancelWeightButtonText}>
            Cancel
          </Text>
        </Pressable>

        <Pressable
          style={styles.saveWeightButton}
          onPress={onSaveWeight}
        >
          <Text style={styles.saveWeightButtonText}>
            Save Weight
          </Text>
        </Pressable>
      </View>
    </View>
  )}
</View>

      <Text
        style={styles.sectionTitle}
      >
        Today's workout
      </Text>

      <View style={styles.whiteCard}>
        <Text
  style={styles.workoutLabel}
>
  {todaysWorkout.type.toUpperCase()}
</Text>

<Text
  style={styles.workoutTitle}
>
  {todaysWorkout.name}
</Text>

<Text
  style={styles.cardDescription}
>
  {todaysWorkout.description}
</Text>

        <View
          style={
            styles.workoutDetailsRow
          }
        >
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
{todaysWorkout.isRestDay ? (
  <View style={styles.restDayMessage}>
    <Text style={styles.restDayMessageText}>
      Recovery day - no workout scheduled
    </Text>
  </View>
) : (
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
)}
        
      </View>
      <Text style={styles.sectionTitle}>
        Up next
      </Text>

      <View style={styles.nextWorkoutCard}>
        <View style={styles.nextWorkoutHeader}>
          <View style={styles.nextWorkoutInfo}>
            <Text style={styles.nextWorkoutDay}>
              TOMORROW
            </Text>

            <Text style={styles.nextWorkoutTitle}>
              {tomorrowsWorkout.name}
            </Text>

            <Text style={styles.nextWorkoutType}>
              {tomorrowsWorkout.type}
            </Text>
          </View>

          <View style={styles.nextWorkoutBadge}>
            <Text style={styles.nextWorkoutBadgeText}>
              NEXT
            </Text>
          </View>
        </View>

        <Text style={styles.nextWorkoutDescription}>
          {tomorrowsWorkout.description}
        </Text>
      </View>

      <Text
        style={styles.sectionTitle}
      >
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
    {currentWeight !== null
      ? `${currentWeight} lb`
      : 'Not logged'}
  </Text>

  <Text style={styles.change}>
    {currentWeight !== null
      ? `${currentProfile?.name ?? 'User'}'s latest weight`
      : 'Log a weight to begin tracking progress'}
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
    (total, food) =>
      total + food.calories,
    0
  );

  const detail =
    foods.length === 0
      ? 'Not logged'
      : foods
          .map(
            (food) => food.name
          )
          .join(', ');

  return (
    <View style={styles.mealRow}>
      <View style={styles.mealInfo}>
        <Text
          style={styles.mealTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.mealDetail}
          numberOfLines={2}
        >
          {detail}
        </Text>
      </View>

      <Text
        style={styles.mealCalories}
      >
        {foods.length === 0
          ? '0 cal'
          : `${calories} cal`}
      </Text>
    </View>
  );
}

type WorkoutScreenProps = {
  activeProfile: ProfileId;
  exercises: Exercise[];
  workoutSeconds: number;
  restSeconds: number;
  completedSets: number;
  totalSets: number;
  isSavingWorkout: boolean;

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

  onAddSet: (
    exerciseId: number
  ) => void;

  onFinishWorkout: () => void;
  onCancel: () => void;
  onStartRest: () => void;
  onStopRest: () => void;
};


 function WorkoutScreen({
  activeProfile,
  exercises,
  workoutSeconds,
  restSeconds,
  completedSets,
  totalSets,
  isSavingWorkout,
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
          (completedSets /
            totalSets) *
            100
        );

  const todaysWorkout =
  getTodaysWorkout(activeProfile);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.workoutContent
        }
      >
        <View
          style={styles.workoutHeader}
        >
          <View>
            <Text
              style={
                styles.smallHeading
              }
            >
              {todaysWorkout.name.toUpperCase()}
            </Text>

            <Text style={styles.title}>
              Today's workout
            </Text>
          </View>

          <Pressable
            onPress={() => {
 Alert.alert(
  'Exit workout?',
  'Your unfinished workout will be saved so you can resume it later.',
    [
      {
        text: 'Keep Working',
        style: 'cancel',
      },
      {
        text: 'Exit Workout',
        style: 'destructive',
        onPress: onCancel,
      },
    ]
  );
}}
            disabled={
              isSavingWorkout
            }
          >
            <Text
              style={styles.cancelText}
            >
              Exit
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.workoutStatusCard
          }
        >
          <View>
            <Text
              style={
                styles.statusLabel
              }
            >
              WORKOUT TIME
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              {formatTime(
                workoutSeconds
              )}
            </Text>
          </View>

          <View
            style={styles.statusRight}
          >
            <Text
              style={
                styles.statusLabel
              }
            >
              PROGRESS
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
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

          <Text
            style={
              styles.setProgressText
            }
          >
            {completedSets} of{' '}
            {totalSets} sets completed
          </Text>
        </View>

        {restSeconds > 0 ? (
          <View
            style={styles.restCard}
          >
            <View>
              <Text
                style={
                  styles.restLabel
                }
              >
                REST TIMER
              </Text>

              <Text
                style={
                  styles.restTime
                }
              >
                {formatTime(
                  restSeconds
                )}
              </Text>
            </View>

            <Pressable
              style={
                styles.restButton
              }
              onPress={onStopRest}
            >
              <Text
                style={
                  styles.restButtonText
                }
              >
                Skip rest
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={
              styles.manualRestButton
            }
            onPress={onStartRest}
          >
            <Text
              style={
                styles.manualRestButtonText
              }
            >
              Start 90-second rest
              timer
            </Text>
          </Pressable>
        )}

        {exercises.map(
          (
            exercise,
            exerciseIndex
          ) => (
            <ExerciseCard
              key={`${exercise.id}-${exercise.sets[0]?.id ?? 0}`}
              exercise={exercise}
              exerciseNumber={
                exerciseIndex + 1
              }
              onUpdateSet={
                onUpdateSet
              }
              onToggleSet={
                onToggleSet
              }
              onAddSet={onAddSet}
            />
          )
        )}

        <Pressable
          style={({ pressed }) => [
            styles.finishButton,
            pressed &&
              styles.buttonPressed,
            isSavingWorkout &&
              styles.disabledButton,
          ]}
          onPress={onFinishWorkout}
          disabled={
            isSavingWorkout
          }
        >
          <Text
            style={
              styles.finishButtonText
            }
          >
            {isSavingWorkout
              ? 'Saving workout...'
              : 'Finish workout'}
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

  onAddSet: (
    exerciseId: number
  ) => void;
};

function ExerciseCard({
  exercise,
  exerciseNumber,
  onUpdateSet,
  onToggleSet,
  onAddSet,
}: ExerciseCardProps) {
  return (
    <View
      style={styles.exerciseCard}
    >
      <Text
        style={
          styles.exerciseMuscle
        }
      >
        {exerciseNumber}.{' '}
        {exercise.muscle.toUpperCase()}
      </Text>

      <Text
        style={styles.exerciseName}
      >
        {exercise.name}
      </Text>
{exercise.previousWeight &&
  exercise.previousReps && (
    <Text
      style={styles.previousPerformance}
    >
      Previous: {exercise.previousWeight} lb Ã—{' '}
      {exercise.previousReps} reps
    </Text>
  )}
{exercise.suggestedWeight &&
  exercise.progressionStatus && (
    <Text
      style={styles.suggestedPerformance}
    >
      {exercise.progressionStatus === 'increase'
        ? `Ready to increase â†’ ${exercise.suggestedWeight} lb`
        : `Hold at ${exercise.suggestedWeight} lb`}
    </Text>
  )}
      <View
        style={styles.setHeaderRow}
      >
        <Text
          style={
            styles.setHeaderNumber
          }
        >
          SET
        </Text>

        <Text
          style={
            styles.setHeaderInput
          }
        >
          WEIGHT
        </Text>

        <Text
          style={
            styles.setHeaderInput
          }
        >
          REPS
        </Text>

        <Text
          style={
            styles.setHeaderDone
          }
        >
          DONE
        </Text>
      </View>

      {exercise.sets.map(
        (
          workoutSet,
          index
        ) => (
          <View
            key={workoutSet.id}
            style={[
              styles.setRow,
              workoutSet.completed &&
                styles.completedSetRow,
            ]}
          >
            <View
              style={
                styles.setNumberCircle
              }
            >
              <Text
                style={
                  styles.setNumberText
                }
              >
                {index + 1}
              </Text>
            </View>

            <TextInput
              style={styles.setInput}
              value={
                workoutSet.weight
              }
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
              value={
                workoutSet.reps
              }
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
                  ? 'âœ“'
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
        <Text
          style={
            styles.addSetButtonText
          }
        >
          + Add set
        </Text>
      </Pressable>
    </View>
  );
}

type WorkoutSummaryProps = {
  activeProfile: ProfileId;
  profileName: string;
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  workoutSeconds: number;
  newPRs: {
    exerciseName: string;
    weight: number;
  }[];
  onDone: () => void;
};

function WorkoutSummary({
  activeProfile,
  profileName,
  completedSets,
  totalSets,
  totalVolume,
  workoutSeconds,
  newPRs,
  onDone,
}: WorkoutSummaryProps) {
const todaysWorkout =
  getTodaysWorkout(activeProfile);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.summaryContent
      }
    >
      <View
        style={styles.summaryCheck}
      >
        <Text
          style={
            styles.summaryCheckText
          }
        >
          âœ“
        </Text>
      </View>

      <Text
        style={styles.summaryTitle}
      >
        Workout complete
      </Text>

      <Text
        style={
          styles.summarySubtitle
        }
      >
        Great job, {profileName}.
        {' '}Your {todaysWorkout.name} workout was saved.
      </Text>
{newPRs.length > 0 && (
  <View style={styles.prCard}>
    <Text style={styles.prTitle}>
      ðŸ† NEW PERSONAL RECORD
    </Text>

    {newPRs.map((pr) => (
      <View
        key={pr.exerciseName}
        style={styles.prRow}
      >
        <Text style={styles.prExercise}>
          {pr.exerciseName}
        </Text>

        <Text style={styles.prWeight}>
          {pr.weight} lb
        </Text>
      </View>
    ))}
  </View>
)}
      <View
        style={styles.summaryCard}
      >
        <SummaryRow
          label="Workout"
          value={todaysWorkout.name}
        />

        <View style={styles.divider} />

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
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={onDone}
      >
        <Text
          style={
            styles.finishButtonText
          }
        >
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
      <Text
        style={
          styles.summaryRowLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.summaryRowValue
        }
      >
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
    <View
      style={styles.workoutDetail}
    >
      <Text
        style={
          styles.workoutDetailValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.workoutDetailLabel
        }
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
      <Text
        style={styles.statTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.statValue}
      >
        {value}
      </Text>

      <Text
        style={styles.statGoal}
      >
        {goal}
      </Text>
    </View>
  );
}
function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}


function formatTime(
  totalSeconds: number
) {
  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

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
  profileCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 16,
  marginBottom: 20,
},

profileLabel: {
  color: '#557063',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1.5,
  marginBottom: 10,
},

profileSelector: {
  flexDirection: 'row',
  backgroundColor: '#E9EEEB',
  borderRadius: 16,
  padding: 4,
},

profileButton: {
  flex: 1,
  paddingVertical: 13,
  borderRadius: 13,
  alignItems: 'center',
},

profileButtonActive: {
  backgroundColor: '#2D6B48',
},

profileButtonText: {
  color: '#557063',
  fontSize: 15,
  fontWeight: '800',
},

profileButtonTextActive: {
  color: '#FFFFFF',
},

profileViewingText: {
  color: '#6D7972',
  fontSize: 14,
  fontWeight: '600',
  textAlign: 'center',
  marginTop: 12,
},
manageProfilesButton: {
  marginTop: 12,
  paddingVertical: 10,
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: '#E2E8E4',
},

manageProfilesButtonText: {
  color: '#2D6B48',
  fontSize: 14,
  fontWeight: '800',
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
  waterControls: {
  flexDirection: 'row',
  gap: 8,
  marginTop: -16,
  marginBottom: 28,
},

waterButton: {
  flex: 1,
  backgroundColor: '#E4EEE8',
  borderRadius: 12,
  paddingVertical: 11,
  alignItems: 'center',
  justifyContent: 'center',
},

waterButtonText: {
  color: '#2D6B48',
  fontSize: 13,
  fontWeight: '800',
},
weightCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 18,
  marginBottom: 28,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

weightLabel: {
  color: '#68756E',
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1,
},

weightValue: {
  color: '#17211C',
  fontSize: 26,
  fontWeight: '900',
  marginTop: 4,
},

logWeightButton: {
  backgroundColor: '#2D6B48',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 11,
},

logWeightButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '800',
},
weightForm: {
  flex: 1,
},

weightInputRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
},

weightInput: {
  flex: 1,
  backgroundColor: '#F3F6F4',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#17211C',
  fontSize: 22,
  fontWeight: '800',
},

weightUnit: {
  color: '#68756E',
  fontSize: 16,
  fontWeight: '800',
  marginLeft: 10,
},

weightActionRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 14,
},

cancelWeightButton: {
  flex: 1,
  backgroundColor: '#E4EEE8',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
},

cancelWeightButtonText: {
  color: '#2D6B48',
  fontSize: 13,
  fontWeight: '800',
},

saveWeightButton: {
  flex: 1,
  backgroundColor: '#2D6B48',
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
},

saveWeightButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '800',
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

restDayMessage: {
  backgroundColor: '#E4EEE8',
  borderRadius: 12,
  paddingVertical: 13,
  paddingHorizontal: 16,
  alignItems: 'center',
},

restDayMessageText: {
  color: '#34704D',
  fontSize: 14,
  fontWeight: '700',
},

nextWorkoutCard: {
  backgroundColor: '#E4EEE8',
  borderRadius: 20,
  padding: 18,
  marginBottom: 28,
},

nextWorkoutHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

nextWorkoutInfo: {
  flex: 1,
  paddingRight: 12,
},

nextWorkoutDay: {
  color: '#557063',
  fontSize: 11,
  fontWeight: '800',
  letterSpacing: 1.2,
},

nextWorkoutTitle: {
  color: '#17211C',
  fontSize: 21,
  fontWeight: '900',
  marginTop: 5,
},

nextWorkoutType: {
  color: '#34704D',
  fontSize: 13,
  fontWeight: '700',
  marginTop: 3,
},

nextWorkoutDescription: {
  color: '#6C7771',
  fontSize: 14,
  lineHeight: 20,
  marginTop: 12,
},

nextWorkoutBadge: {
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

nextWorkoutBadgeText: {
  color: '#2D6B48',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
},

buttonPressed: {
  opacity: 0.75,
},
 
  disabledButton: {
    opacity: 0.55,
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
 
previousPerformance: {
  marginTop: -10,
  marginBottom: 3,
  fontSize: 13,
  fontWeight: '600',
  color: '#6B7280',
},

suggestedPerformance: {
  marginBottom: 14,
  fontSize: 13,
  fontWeight: '800',
  color: '#34704D',
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
  prCard: {
  backgroundColor: '#E4EEE8',
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
},

prTitle: {
  color: '#2D6B48',
  fontSize: 13,
  fontWeight: '900',
  letterSpacing: 1,
  marginBottom: 12,
},

prRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 4,
},

prExercise: {
  color: '#17211C',
  fontSize: 16,
  fontWeight: '800',
  flex: 1,
  marginRight: 12,
},

prWeight: {
  color: '#2D6B48',
  fontSize: 18,
  fontWeight: '900',
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



