export type ScheduledWorkout = {
  name: string;
  type: string;
  description: string;
  isRestDay?: boolean;
};

export const WORKOUT_SCHEDULE: Record<
  number,
  ScheduledWorkout
> = {
  0: {
    name: 'Rest Day',
    type: 'Recovery',
    description:
      'Recovery, mobility, and light activity.',
    isRestDay: true,
  },

  1: {
    name: 'Push Day',
    type: 'Upper Body',
    description:
      'Chest, shoulders, triceps and core.',
  },

  2: {
    name: 'Pull Day',
    type: 'Upper Body',
    description:
      'Back, biceps and rear delts.',
  },

  3: {
    name: 'Legs & Core',
    type: 'Lower Body',
    description:
      'Quads, hamstrings, glutes and core.',
  },

  4: {
    name: 'Push Day',
    type: 'Upper Body',
    description:
      'Chest, shoulders, triceps and core.',
  },

  5: {
    name: 'Pull Day',
    type: 'Upper Body',
    description:
      'Back, biceps and rear delts.',
  },

  6: {
    name: 'Legs & Core',
    type: 'Lower Body',
    description:
      'Quads, hamstrings, glutes and core.',
  },
};

export function getWorkoutForDate(
  date: Date
): ScheduledWorkout {
  return WORKOUT_SCHEDULE[date.getDay()];
}

export function getTodaysWorkout() {
  return getWorkoutForDate(new Date());
}

export function getTomorrowsWorkout() {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  return getWorkoutForDate(tomorrow);
}