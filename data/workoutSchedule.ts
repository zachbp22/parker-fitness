import { ProfileId } from '@/services/storage';

export type ScheduledWorkout = {
  name: string;
  type: string;
  description: string;
  isRestDay?: boolean;
};

export type WeeklyWorkoutSchedule = Record<
  number,
  ScheduledWorkout
>;

const ZACH_WORKOUT_SCHEDULE: WeeklyWorkoutSchedule = {
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
const WIFE_WORKOUT_SCHEDULE: WeeklyWorkoutSchedule = {
  0: {
    name: 'Rest Day',
    type: 'Recovery',
    description:
      'Complete rest or light walking and mobility.',
    isRestDay: true,
  },

  1: {
    name: 'Full Body A',
    type: 'Strength',
    description:
      'Full-body strength with legs, chest, back and core.',
  },

  2: {
    name: 'Cardio & Core',
    type: 'Conditioning',
    description:
      'Low-impact cardio followed by focused core work.',
  },

  3: {
    name: 'Full Body B',
    type: 'Strength',
    description:
      'Full-body strength with glutes, back, shoulders and core.',
  },

  4: {
    name: 'Recovery Day',
    type: 'Recovery',
    description:
      'Light walking, mobility and recovery.',
    isRestDay: true,
  },

  5: {
    name: 'Full Body C',
    type: 'Strength',
    description:
      'Full-body strength with legs, upper body and core.',
  },

  6: {
    name: 'Cardio & Core',
    type: 'Conditioning',
    description:
      'Low-impact cardio followed by focused core work.',
  },
};

export const WORKOUT_SCHEDULES: Record<
  ProfileId,
  WeeklyWorkoutSchedule
> = {
  zach: ZACH_WORKOUT_SCHEDULE,
  wife: WIFE_WORKOUT_SCHEDULE,
};

export function getWorkoutForDate(
  date: Date,
  profileId: ProfileId = 'zach'
): ScheduledWorkout {
  const schedule =
    WORKOUT_SCHEDULES[profileId] ??
    ZACH_WORKOUT_SCHEDULE;

  return schedule[date.getDay()];
}

export function getTodaysWorkout(
  profileId: ProfileId = 'zach'
): ScheduledWorkout {
  return getWorkoutForDate(
    new Date(),
    profileId
  );
}
export function getTomorrowsWorkout(
  profileId: ProfileId = 'zach'
): ScheduledWorkout {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  return getWorkoutForDate(
    tomorrow,
    profileId
  );
}