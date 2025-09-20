import { Task } from './Task';

/**
 * Available mood options for the user to select
 */
export type Mood = 'happy' | 'sad' | 'angry' | 'fearful' | 'strong' | 'excited' | 'calm' | 'tired';

/**
 * Represents a single attempt at completing a day's requirements
 */
export interface Attempt {
  /** Attempt number (1, 2, 3, etc.) */
  number: number;
  /** Timestamp when the attempt was completed (null if not completed) */
  timestamp: string | null;
  /** URI of the uploaded photo for this attempt */
  photoUri?: string;
  /** Selected mood for this attempt */
  mood?: Mood;
  /** Recorded weight in kg for this attempt */
  weight?: number;
  /** Tasks and their completion status for this attempt */
  tasks: Task[];
  /** Whether this attempt is fully completed */
  completed: boolean;
}

/**
 * Creates a new attempt with default values
 */
export const createAttempt = (number: number, tasks: Task[]): Attempt => ({
  number,
  timestamp: null,
  tasks: tasks.map(task => ({ ...task, completed: false })),
  completed: false,
});

/**
 * Checks if an attempt meets all completion requirements
 */
export const isAttemptComplete = (attempt: Attempt): boolean => {
  const allTasksCompleted = attempt.tasks.every(task => task.completed);
  const hasMood = attempt.mood !== undefined;
  const hasPhoto = attempt.photoUri !== undefined && attempt.photoUri !== '';
  const hasWeight = attempt.weight !== undefined && attempt.weight > 0;
  
  console.log('🔍 isAttemptComplete check:', {
    allTasksCompleted,
    hasMood,
    hasPhoto,
    hasWeight,
    mood: attempt.mood,
    photoUri: attempt.photoUri,
    weight: attempt.weight,
    tasks: attempt.tasks.map(t => ({ id: t.id, completed: t.completed }))
  });
  
  const isComplete = allTasksCompleted && hasMood && hasPhoto && hasWeight;
  console.log('🔍 Final isComplete result:', isComplete);
  
  return isComplete;
};

/**
 * Marks an attempt as completed with current timestamp
 */
export const completeAttempt = (attempt: Attempt): Attempt => ({
  ...attempt,
  completed: true,
  timestamp: new Date().toISOString(),
});