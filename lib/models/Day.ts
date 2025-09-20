import { Attempt, createAttempt } from './Attempt';
import { createDefaultTasks } from './Task';

/**
 * Represents a single day in the 75 Hard challenge
 */
export interface Day {
  /** Day index (1-75) */
  index: number;
  /** ISO date string for this day */
  date: string;
  /** All attempts made for this day */
  attempts: Attempt[];
}

/**
 * Creates a new day with initial attempt
 */
export const createDay = (index: number, date: string): Day => {
  const defaultTasks = createDefaultTasks();
  const initialAttempt = createAttempt(1, defaultTasks);
  
  return {
    index,
    date,
    attempts: [initialAttempt],
  };
};

/**
 * Gets the current (latest) attempt for a day
 */
export const getCurrentAttempt = (day: Day): Attempt => {
  return day.attempts[day.attempts.length - 1];
};

/**
 * Checks if a day is completed (has at least one completed attempt)
 */
export const isDayCompleted = (day: Day): boolean => {
  return day.attempts.some(attempt => attempt.completed);
};

/**
 * Gets the completed attempt for a day (if any)
 */
export const getCompletedAttempt = (day: Day): Attempt | null => {
  return day.attempts.find(attempt => attempt.completed) || null;
};

/**
 * Adds a new attempt to a day
 */
export const addNewAttempt = (day: Day): Day => {
  const defaultTasks = createDefaultTasks();
  const newAttemptNumber = day.attempts.length + 1;
  const newAttempt = createAttempt(newAttemptNumber, defaultTasks);
  
  return {
    ...day,
    attempts: [...day.attempts, newAttempt],
  };
};

/**
 * Updates the current attempt for a day
 */
export const updateCurrentAttempt = (day: Day, updatedAttempt: Attempt): Day => {
  const attempts = [...day.attempts];
  attempts[attempts.length - 1] = updatedAttempt;
  
  return {
    ...day,
    attempts,
  };
};

/**
 * Creates the initial 75 days for the challenge
 */
export const createInitialDays = (startDate: Date): Day[] => {
  const days: Day[] = [];
  
  for (let i = 1; i <= 75; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (i - 1));
    
    const day = createDay(i, dayDate.toISOString().split('T')[0]);
    days.push(day);
  }
  
  return days;
};