/**
 * Represents a single task that must be completed each day
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  /** Display title of the task */
  title: string;
  /** Whether the task has been completed */
  completed: boolean;
}

/**
 * Default tasks for the 75 Hard challenge
 */
export const DEFAULT_TASKS: Omit<Task, 'completed'>[] = [
  { id: 'workout', title: '45 min workout' },
  { id: 'rawdogging', title: '10 min rawdogging' },
  { id: 'reading', title: 'Read 10 pages' },
  { id: 'water', title: 'Drink 2L water' },
];

/**
 * Creates a new task with default completion state
 */
export const createTask = (id: string, title: string, completed = false): Task => ({
  id,
  title,
  completed,
});

/**
 * Creates the default set of tasks for a new day
 */
export const createDefaultTasks = (): Task[] => 
  DEFAULT_TASKS.map(task => createTask(task.id, task.title, false));