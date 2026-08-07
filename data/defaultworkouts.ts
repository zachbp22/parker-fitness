export type WorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};
export type Exercise = {
  id: number;
  name: string;
  muscle: string;
  sets: WorkoutSet[];
  previousWeight?: string;
  previousReps?: string;
  suggestedWeight?: string;
  progressionStatus?: 'hold' | 'increase';
};
export const PUSH_EXERCISES: Exercise[] = [
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

export const PULL_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: 'Lat Pulldown',
    muscle: 'Back',
    sets: [
      { id: 1, weight: '70', reps: '12', completed: false },
      { id: 2, weight: '70', reps: '12', completed: false },
      { id: 3, weight: '70', reps: '10', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Seated Row Machine',
    muscle: 'Back',
    sets: [
      { id: 1, weight: '70', reps: '12', completed: false },
      { id: 2, weight: '70', reps: '12', completed: false },
      { id: 3, weight: '70', reps: '10', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Reverse Pec Deck',
    muscle: 'Rear Delts',
    sets: [
      { id: 1, weight: '50', reps: '12', completed: false },
      { id: 2, weight: '50', reps: '12', completed: false },
      { id: 3, weight: '50', reps: '12', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Biceps Curl Machine',
    muscle: 'Biceps',
    sets: [
      { id: 1, weight: '40', reps: '12', completed: false },
      { id: 2, weight: '40', reps: '12', completed: false },
      { id: 3, weight: '40', reps: '10', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Cable Hammer Curl',
    muscle: 'Biceps',
    sets: [
      { id: 1, weight: '30', reps: '12', completed: false },
      { id: 2, weight: '30', reps: '12', completed: false },
      { id: 3, weight: '30', reps: '10', completed: false },
    ],
  },
];

export const LEG_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: 'Leg Press',
    muscle: 'Legs',
    sets: [
      { id: 1, weight: '100', reps: '12', completed: false },
      { id: 2, weight: '100', reps: '12', completed: false },
      { id: 3, weight: '100', reps: '10', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Leg Extension',
    muscle: 'Quads',
    sets: [
      { id: 1, weight: '50', reps: '12', completed: false },
      { id: 2, weight: '50', reps: '12', completed: false },
      { id: 3, weight: '50', reps: '10', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Seated Leg Curl',
    muscle: 'Hamstrings',
    sets: [
      { id: 1, weight: '50', reps: '12', completed: false },
      { id: 2, weight: '50', reps: '12', completed: false },
      { id: 3, weight: '50', reps: '10', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Calf Raise',
    muscle: 'Calves',
    sets: [
      { id: 1, weight: '70', reps: '15', completed: false },
      { id: 2, weight: '70', reps: '15', completed: false },
      { id: 3, weight: '70', reps: '15', completed: false },
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
export const WIFE_FULL_BODY_A: Exercise[] = [
  {
    id: 1,
    name: 'Leg Press',
    muscle: 'Legs',
    sets: [
      { id: 1, weight: '40', reps: '12', completed: false },
      { id: 2, weight: '40', reps: '12', completed: false },
      { id: 3, weight: '40', reps: '12', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Chest Press Machine',
    muscle: 'Chest',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Lat Pulldown',
    muscle: 'Back',
    sets: [
      { id: 1, weight: '30', reps: '12', completed: false },
      { id: 2, weight: '30', reps: '12', completed: false },
      { id: 3, weight: '30', reps: '12', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Seated Leg Curl',
    muscle: 'Hamstrings',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Abdominal Machine',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '20', reps: '15', completed: false },
      { id: 2, weight: '20', reps: '15', completed: false },
      { id: 3, weight: '20', reps: '15', completed: false },
    ],
  },
];

export const WIFE_FULL_BODY_B: Exercise[] = [
  {
    id: 1,
    name: 'Leg Press',
    muscle: 'Glutes & Legs',
    sets: [
      { id: 1, weight: '40', reps: '12', completed: false },
      { id: 2, weight: '40', reps: '12', completed: false },
      { id: 3, weight: '40', reps: '12', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Seated Row Machine',
    muscle: 'Back',
    sets: [
      { id: 1, weight: '30', reps: '12', completed: false },
      { id: 2, weight: '30', reps: '12', completed: false },
      { id: 3, weight: '30', reps: '12', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Shoulder Press Machine',
    muscle: 'Shoulders',
    sets: [
      { id: 1, weight: '15', reps: '12', completed: false },
      { id: 2, weight: '15', reps: '12', completed: false },
      { id: 3, weight: '15', reps: '12', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Leg Extension',
    muscle: 'Quads',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Abdominal Machine',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '20', reps: '15', completed: false },
      { id: 2, weight: '20', reps: '15', completed: false },
      { id: 3, weight: '20', reps: '15', completed: false },
    ],
  },
];

export const WIFE_FULL_BODY_C: Exercise[] = [
  {
    id: 1,
    name: 'Leg Press',
    muscle: 'Legs',
    sets: [
      { id: 1, weight: '40', reps: '12', completed: false },
      { id: 2, weight: '40', reps: '12', completed: false },
      { id: 3, weight: '40', reps: '12', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Chest Press Machine',
    muscle: 'Chest',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Seated Row Machine',
    muscle: 'Back',
    sets: [
      { id: 1, weight: '30', reps: '12', completed: false },
      { id: 2, weight: '30', reps: '12', completed: false },
      { id: 3, weight: '30', reps: '12', completed: false },
    ],
  },
  {
    id: 4,
    name: 'Seated Leg Curl',
    muscle: 'Hamstrings',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
  {
    id: 5,
    name: 'Abdominal Machine',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '20', reps: '15', completed: false },
      { id: 2, weight: '20', reps: '15', completed: false },
      { id: 3, weight: '20', reps: '15', completed: false },
    ],
  },
];

export const WIFE_CARDIO_CORE: Exercise[] = [
  {
    id: 1,
    name: 'Treadmill Walk',
    muscle: 'Cardio',
    sets: [
      { id: 1, weight: '0', reps: '20', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Abdominal Machine',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '20', reps: '15', completed: false },
      { id: 2, weight: '20', reps: '15', completed: false },
      { id: 3, weight: '20', reps: '15', completed: false },
    ],
  },
  {
    id: 3,
    name: 'Back Extension',
    muscle: 'Core',
    sets: [
      { id: 1, weight: '20', reps: '12', completed: false },
      { id: 2, weight: '20', reps: '12', completed: false },
      { id: 3, weight: '20', reps: '12', completed: false },
    ],
  },
];