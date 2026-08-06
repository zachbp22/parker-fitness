import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    deleteWorkout,
    loadActiveProfile,
    loadWorkoutsForProfile,
    ProfileId,
    PROFILES,
    StoredWorkout,
} from '@/services/storage';

export default function HistoryScreen() {
  const [activeProfile, setActiveProfile] =
    useState<ProfileId>('zach');

  const [workouts, setWorkouts] =
    useState<StoredWorkout[]>([]);

  const [expandedWorkoutId, setExpandedWorkoutId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const profileId =
        await loadActiveProfile();

      const savedWorkouts =
        await loadWorkoutsForProfile(profileId);

      const sortedWorkouts =
        [...savedWorkouts].sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime()
        );

      setActiveProfile(profileId);
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.error(
        'Unable to load workout history:',
        error
      );

      Alert.alert(
        'Unable to load history',
        'There was a problem loading your workout history.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const totalWorkouts = workouts.length;

  const totalSets = useMemo(() => {
    return workouts.reduce(
      (total, workout) =>
        total + workout.completedSets,
      0
    );
  }, [workouts]);

  const totalVolume = useMemo(() => {
    return workouts.reduce(
      (total, workout) =>
        total + workout.totalVolume,
      0
    );
  }, [workouts]);

  const totalSeconds = useMemo(() => {
    return workouts.reduce(
      (total, workout) =>
        total + workout.durationSeconds,
      0
    );
  }, [workouts]);

  function toggleWorkout(workoutId: string) {
    setExpandedWorkoutId((current) =>
      current === workoutId
        ? null
        : workoutId
    );
  }

  function confirmDelete(workout: StoredWorkout) {
    Alert.alert(
      'Delete workout?',
      `${workout.workoutName} will be permanently removed from ${PROFILES[activeProfile].name}'s history.`,
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
              await deleteWorkout(workout.id);

              if (
                expandedWorkoutId === workout.id
              ) {
                setExpandedWorkoutId(null);
              }

              await loadHistory();
            } catch (error) {
              console.error(
                'Unable to delete workout:',
                error
              );

              Alert.alert(
                'Unable to delete',
                'There was a problem deleting this workout.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.smallHeading}>
        PARKER FITNESS
      </Text>

      <Text style={styles.title}>
        Workout History
      </Text>

      <Text style={styles.subtitle}>
        {PROFILES[activeProfile].name}'s completed
        workouts and training progress.
      </Text>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            Loading workouts...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              TRAINING SUMMARY
            </Text>

            <View style={styles.summaryStats}>
              <SummaryStat
                value={String(totalWorkouts)}
                label="Workouts"
              />

              <SummaryStat
                value={String(totalSets)}
                label="Sets"
              />

              <SummaryStat
                value={formatDuration(totalSeconds)}
                label="Time"
              />
            </View>

            <View style={styles.volumeBox}>
              <Text style={styles.volumeLabel}>
                TOTAL TRAINING VOLUME
              </Text>

              <Text style={styles.volumeValue}>
                {totalVolume.toLocaleString()} lb
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Previous workouts
            </Text>

            <Text style={styles.workoutCount}>
              {totalWorkouts}
            </Text>
          </View>

          {workouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>
                🏋️
              </Text>

              <Text style={styles.emptyTitle}>
                No workouts yet
              </Text>

              <Text style={styles.emptyText}>
                Finish a workout from the Home tab
                and it will appear here automatically.
              </Text>
            </View>
          ) : (
            workouts.map((workout) => {
              const isExpanded =
                expandedWorkoutId === workout.id;

              return (
                <WorkoutHistoryCard
                  key={workout.id}
                  workout={workout}
                  expanded={isExpanded}
                  onToggle={() =>
                    toggleWorkout(workout.id)
                  }
                  onDelete={() =>
                    confirmDelete(workout)
                  }
                />
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

type SummaryStatProps = {
  value: string;
  label: string;
};

function SummaryStat({
  value,
  label,
}: SummaryStatProps) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatValue}>
        {value}
      </Text>

      <Text style={styles.summaryStatLabel}>
        {label}
      </Text>
    </View>
  );
}

type WorkoutHistoryCardProps = {
  workout: StoredWorkout;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

function WorkoutHistoryCard({
  workout,
  expanded,
  onToggle,
  onDelete,
}: WorkoutHistoryCardProps) {
  const completedExercises =
    workout.exercises.filter((exercise) =>
      exercise.sets.some(
        (workoutSet) => workoutSet.completed
      )
    );

  return (
    <View style={styles.workoutCard}>
      <Pressable
        style={({ pressed }) => [
          styles.workoutCardHeader,
          pressed && styles.pressed,
        ]}
        onPress={onToggle}
      >
        <View style={styles.workoutHeaderLeft}>
          <Text style={styles.workoutType}>
            {workout.workoutType.toUpperCase()}
          </Text>

          <Text style={styles.workoutName}>
            {workout.workoutName}
          </Text>

          <Text style={styles.workoutDate}>
            {formatWorkoutDate(
              workout.completedAt
            )}
          </Text>
        </View>

        <View style={styles.expandArea}>
          <Text style={styles.expandText}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.workoutStats}>
        <WorkoutStat
          value={formatTime(
            workout.durationSeconds
          )}
          label="Duration"
        />

        <WorkoutStat
          value={`${workout.completedSets}/${workout.totalSets}`}
          label="Sets"
        />

        <WorkoutStat
          value={`${workout.totalVolume.toLocaleString()} lb`}
          label="Volume"
        />
      </View>

      {expanded && (
        <View style={styles.expandedArea}>
          <View style={styles.divider} />

          <Text style={styles.exerciseSectionTitle}>
            Exercises
          </Text>

          {completedExercises.length === 0 ? (
            <Text style={styles.noExerciseText}>
              No completed exercise data.
            </Text>
          ) : (
            completedExercises.map(
              (exercise) => {
                const completedSets =
                  exercise.sets.filter(
                    (workoutSet) =>
                      workoutSet.completed
                  );

                return (
                  <View
                    key={exercise.id}
                    style={styles.exerciseBlock}
                  >
                    <View
                      style={
                        styles.exerciseHeading
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.exerciseName
                          }
                        >
                          {exercise.name}
                        </Text>

                        <Text
                          style={
                            styles.exerciseMuscle
                          }
                        >
                          {exercise.muscle}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.exerciseSetCount
                        }
                      >
                        {completedSets.length}{' '}
                        {completedSets.length === 1
                          ? 'set'
                          : 'sets'}
                      </Text>
                    </View>

                    {completedSets.map(
                      (
                        workoutSet,
                        index
                      ) => (
                        <View
                          key={workoutSet.id}
                          style={styles.setRow}
                        >
                          <View
                            style={
                              styles.setNumber
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

                          <Text
                            style={
                              styles.setDetail
                            }
                          >
                            {workoutSet.weight ||
                              '0'}{' '}
                            lb ×{' '}
                            {workoutSet.reps ||
                              '0'}{' '}
                            reps
                          </Text>

                          <Text
                            style={
                              styles.setCheck
                            }
                          >
                            ✓
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                );
              }
            )
          )}

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
            onPress={onDelete}
          >
            <Text style={styles.deleteButtonText}>
              Delete workout
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type WorkoutStatProps = {
  value: string;
  label: string;
};

function WorkoutStat({
  value,
  label,
}: WorkoutStatProps) {
  return (
    <View style={styles.workoutStat}>
      <Text style={styles.workoutStatValue}>
        {value}
      </Text>

      <Text style={styles.workoutStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function formatTime(totalSeconds: number) {
  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes =
    Math.floor(totalSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours =
    Math.floor(totalMinutes / 60);

  const minutes =
    totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatWorkoutDate(
  completedAt: string
) {
  const date = new Date(completedAt);

  return date.toLocaleString(
    undefined,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 120,
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
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 24,
  },

  summaryCard: {
    backgroundColor: '#1D4A32',
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
  },

  summaryLabel: {
    color: '#C8D6CE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  summaryStats: {
    flexDirection: 'row',
    marginTop: 20,
  },

  summaryStat: {
    flex: 1,
  },

  summaryStatValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  summaryStatLabel: {
    color: '#C8D6CE',
    fontSize: 11,
    marginTop: 4,
  },

  volumeBox: {
    backgroundColor: '#315C43',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
  },

  volumeLabel: {
    color: '#C8D6CE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  volumeValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#17211C',
    fontSize: 20,
    fontWeight: '800',
  },

  workoutCount: {
    marginLeft: 9,
    backgroundColor: '#E2EAE5',
    color: '#2D6B48',
    fontSize: 12,
    fontWeight: '900',
    minWidth: 25,
    textAlign: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  emptyTitle: {
    color: '#17211C',
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: '#77817C',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },

  workoutCardHeader: {
    flexDirection: 'row',
    padding: 18,
  },

  workoutHeaderLeft: {
    flex: 1,
  },

  workoutType: {
    color: '#34704D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  workoutName: {
    color: '#17211C',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },

  workoutDate: {
    color: '#7A857F',
    fontSize: 12,
    marginTop: 5,
  },

  expandArea: {
    justifyContent: 'center',
    paddingLeft: 15,
  },

  expandText: {
    color: '#557063',
    fontSize: 14,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#E9ECEA',
  },

  workoutStats: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },

  workoutStat: {
    flex: 1,
  },

  workoutStatValue: {
    color: '#17211C',
    fontSize: 15,
    fontWeight: '900',
  },

  workoutStatLabel: {
    color: '#85908A',
    fontSize: 10,
    marginTop: 3,
  },

  expandedArea: {
    paddingBottom: 18,
  },

  exerciseSectionTitle: {
    color: '#17211C',
    fontSize: 16,
    fontWeight: '900',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 13,
  },

  exerciseBlock: {
    marginHorizontal: 18,
    marginBottom: 18,
  },

  exerciseHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  exerciseName: {
    color: '#17211C',
    fontSize: 14,
    fontWeight: '800',
  },

  exerciseMuscle: {
    color: '#77817C',
    fontSize: 11,
    marginTop: 2,
  },

  exerciseSetCount: {
    color: '#2D6B48',
    fontSize: 11,
    fontWeight: '800',
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F6',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 5,
  },

  setNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#E3E9E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  setNumberText: {
    color: '#59655F',
    fontSize: 11,
    fontWeight: '900',
  },

  setDetail: {
    flex: 1,
    color: '#26332C',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },

  setCheck: {
    color: '#2D6B48',
    fontSize: 17,
    fontWeight: '900',
  },

  noExerciseText: {
    color: '#77817C',
    fontSize: 13,
    marginHorizontal: 18,
    marginBottom: 18,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#E4CACA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 2,
  },

  deleteButtonText: {
    color: '#A34D4D',
    fontSize: 13,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.65,
  },
});
