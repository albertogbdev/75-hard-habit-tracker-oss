import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Attempt, Mood, addNewAttempt, completeAttempt, getCurrentAttempt, isAttemptComplete, updateCurrentAttempt } from '../lib/models';
import { ImageService, ValidationService } from '../lib/services';

export function useDay(dayIndex: number) {
  const { state, actions } = useApp();
  const day = state.days[dayIndex];

  // Function to get progress from a specific attempt (for immediate calculations)
  const getProgressFromAttempt = useCallback((attempt: Attempt): number => {
    let completed = 0;
    let total = 4; // 4 requirements: tasks, mood, photo, weight

    // Check tasks
    const tasksCompleted = attempt.tasks.every(task => task.completed);
    if (tasksCompleted) {
      completed++;
    }

    // Check mood
    const hasMood = !!attempt.mood;
    if (hasMood) {
      completed++;
    }

    // Check photo
    const hasPhoto = !!attempt.photoUri;
    if (hasPhoto) {
      completed++;
    }

    // Check weight
    const hasWeight = !!(attempt.weight && attempt.weight > 0);
    if (hasWeight) {
      completed++;
    }

    const progress = completed / total;
    
    console.log('📊 Progress from attempt:', {
      tasksCompleted,
      hasMood,
      hasPhoto,
      hasWeight,
      completed,
      total,
      progress,
      photoUri: attempt.photoUri,
      mood: attempt.mood,
      weight: attempt.weight,
      tasks: attempt.tasks.map(t => ({ id: t.id, completed: t.completed }))
    });

    return progress;
  }, []);

  const getCurrentAttemptData = useCallback((): Attempt | null => {
    if (!day) return null;
    return getCurrentAttempt(day);
  }, [day]);

  const toggleTask = useCallback(async (taskId: string) => {
    if (!day) return;

    console.log('🔄 toggleTask called:', { taskId, dayIndex });

    const currentAttempt = getCurrentAttempt(day);
    console.log('🔄 Current attempt before toggle:', { 
      tasks: currentAttempt.tasks.map(t => ({ id: t.id, completed: t.completed })),
      mood: currentAttempt.mood,
      weight: currentAttempt.weight,
      photoUri: currentAttempt.photoUri
    });

    const updatedTasks = currentAttempt.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    console.log('🔄 Updated tasks after toggle:', updatedTasks.map(t => ({ id: t.id, completed: t.completed })));

    const updatedAttempt: Attempt = {
      ...currentAttempt,
      tasks: updatedTasks,
    };

    // Calculate progress immediately with the updated attempt
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('🔄 New progress calculated:', newProgress);

    // Check if the attempt should still be marked as completed
    const shouldBeCompleted = isAttemptComplete(updatedAttempt);
    console.log('🔄 Should be completed:', shouldBeCompleted);
    
    updatedAttempt.completed = shouldBeCompleted;
    updatedAttempt.timestamp = shouldBeCompleted ? updatedAttempt.timestamp : null;

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    console.log('🔄 About to update day with attempt:', {
      tasks: updatedAttempt.tasks.map(t => ({ id: t.id, completed: t.completed })),
      completed: updatedAttempt.completed,
      newProgress
    });
    
    await actions.updateDay(dayIndex, updatedDay);
    console.log('🔄 Day updated successfully');

    // Return both the new progress and the updated attempt for immediate use
    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  const setMood = useCallback(async (mood: Mood) => {
    if (!day) return;

    const currentAttempt = getCurrentAttempt(day);
    const updatedAttempt: Attempt = {
      ...currentAttempt,
      mood,
      // If the attempt was completed but no longer meets requirements, unmark it
      completed: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, mood }) ? currentAttempt.completed : false,
      // Clear timestamp if no longer complete
      timestamp: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, mood }) ? currentAttempt.timestamp : null,
    };

    // Check if this update completes the attempt
    if (isAttemptComplete(updatedAttempt) && !updatedAttempt.completed) {
      updatedAttempt.completed = true;
      updatedAttempt.timestamp = new Date().toISOString();
    }

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    await actions.updateDay(dayIndex, updatedDay);

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('😊 Mood set, new progress:', newProgress);
    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  const setWeight = useCallback(async (weight: number): Promise<{ success: boolean; newProgress: number; updatedAttempt: Attempt } | false> => {
    if (!day) return false;

    const validation = ValidationService.validateWeight(weight);
    if (!validation.isValid) {
      return false;
    }

    const currentAttempt = getCurrentAttempt(day);
    const updatedAttempt: Attempt = {
      ...currentAttempt,
      weight,
      // If the attempt was completed but no longer meets requirements, unmark it
      completed: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, weight }) ? currentAttempt.completed : false,
      // Clear timestamp if no longer complete
      timestamp: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, weight }) ? currentAttempt.timestamp : null,
    };

    // Check if this update completes the attempt
    if (isAttemptComplete(updatedAttempt) && !updatedAttempt.completed) {
      updatedAttempt.completed = true;
      updatedAttempt.timestamp = new Date().toISOString();
    }

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    await actions.updateDay(dayIndex, updatedDay);

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('⚖️ Weight set, new progress:', newProgress);
    return { success: true, newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  const setPhoto = useCallback(async (photoUri: string) => {
    if (!day) return;

    console.log('🔧 setPhoto called with:', { dayIndex, photoUri });
    
    const currentAttempt = getCurrentAttempt(day);
    console.log('🔧 Current attempt before update:', { 
      currentPhotoUri: currentAttempt.photoUri,
      newPhotoUri: photoUri 
    });

    const updatedAttempt: Attempt = {
      ...currentAttempt,
      photoUri,
    };

    // Check if this update completes the attempt
    if (isAttemptComplete(updatedAttempt) && !updatedAttempt.completed) {
      updatedAttempt.completed = true;
      updatedAttempt.timestamp = new Date().toISOString();
    }

    const isComplete = isAttemptComplete(updatedAttempt);
    console.log('🔧 Updated attempt:', { 
      photoUri: updatedAttempt.photoUri,
      isComplete,
      completed: updatedAttempt.completed
    });

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    console.log('🔧 Updated day attempts:', { 
      originalAttempts: day.attempts.length,
      updatedAttempts: updatedDay.attempts.length,
      lastAttemptPhoto: updatedDay.attempts[updatedDay.attempts.length - 1].photoUri
    });
    
    await actions.updateDay(dayIndex, updatedDay);
    console.log('🔧 Day updated successfully');

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('📸 Photo set, new progress:', newProgress);
    
    // Verify the update after a short delay
    setTimeout(() => {
      const verifyAttempt = getCurrentAttemptData();
      console.log('🔧 Verification after update:', { 
        photoUri: verifyAttempt?.photoUri,
        hasPhoto: !!verifyAttempt?.photoUri
      });
    }, 50);

    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getCurrentAttemptData, getProgressFromAttempt]);

  const selectPhoto = useCallback(async (): Promise<boolean> => {
    try {
      const result = await ImageService.showImagePicker();
      if (result) {
        await setPhoto(result.uri);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [setPhoto]);

  const completeCurrentAttempt = useCallback((onDayCompleted?: () => void): { success: boolean; message?: string } => {
    if (!day) return { success: false, message: 'Day not found' };

    const currentAttempt = getCurrentAttempt(day);
    
    console.log('🎯 completeCurrentAttempt called with attempt:', {
      tasks: currentAttempt.tasks.map(t => ({ id: t.id, completed: t.completed })),
      mood: currentAttempt.mood,
      photoUri: currentAttempt.photoUri,
      weight: currentAttempt.weight
    });
    
    if (!isAttemptComplete(currentAttempt)) {
      console.log('🎯 Attempt not complete, returning false');
      return { success: false, message: 'All requirements must be completed' };
    }

    console.log('🎯 Attempt is complete, proceeding with completion');
    const completedAttempt = completeAttempt(currentAttempt);
    const updatedDay = updateCurrentAttempt(day, completedAttempt);
    actions.updateDay(dayIndex, updatedDay);

    // Call the completion callback if provided
    if (onDayCompleted) {
      console.log('🎯 Calling completion callback');
      onDayCompleted();
    }

    return { success: true };
  }, [day, dayIndex, actions]);

  const startNewAttempt = useCallback(async () => {
    if (!day) return;

    const updatedDay = addNewAttempt(day);
    await actions.updateDay(dayIndex, updatedDay);
  }, [day, dayIndex, actions]);

  const getCurrentAttemptNumber = useCallback((): number => {
    if (!day) return 1;
    return day.attempts.length;
  }, [day]);

  const areAllTasksCompleted = useCallback((): boolean => {
    const currentAttempt = getCurrentAttemptData();
    if (!currentAttempt) return false;
    return currentAttempt.tasks.every(task => task.completed);
  }, [getCurrentAttemptData]);

  const getCompletionProgress = useCallback((): number => {
    const currentAttempt = getCurrentAttemptData();
    if (!currentAttempt) return 0;

    let completed = 0;
    let total = 4; // 4 requirements: tasks, mood, photo, weight

    // Check tasks
    const tasksCompleted = currentAttempt.tasks.every(task => task.completed);
    if (tasksCompleted) {
      completed++;
    }

    // Check mood
    const hasMood = !!currentAttempt.mood;
    if (hasMood) {
      completed++;
    }

    // Check photo
    const hasPhoto = !!currentAttempt.photoUri;
    if (hasPhoto) {
      completed++;
    }

    // Check weight
    const hasWeight = !!(currentAttempt.weight && currentAttempt.weight > 0);
    if (hasWeight) {
      completed++;
    }

    const progress = completed / total;
    
    console.log('📊 Progress calculation:', {
      tasksCompleted,
      hasMood,
      hasPhoto,
      hasWeight,
      completed,
      total,
      progress,
      photoUri: currentAttempt.photoUri,
      mood: currentAttempt.mood,
      weight: currentAttempt.weight,
      tasks: currentAttempt.tasks.map(t => ({ id: t.id, completed: t.completed }))
    });

    return progress;
  }, [getCurrentAttemptData]);

  const clearMood = useCallback(async () => {
    if (!day) return;

    const currentAttempt = getCurrentAttempt(day);
    const updatedAttempt: Attempt = {
      ...currentAttempt,
      mood: undefined,
      // If the attempt was completed but no longer meets requirements, unmark it
      completed: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, mood: undefined }) ? currentAttempt.completed : false,
      // Clear timestamp if no longer complete
      timestamp: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, mood: undefined }) ? currentAttempt.timestamp : null,
    };

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    await actions.updateDay(dayIndex, updatedDay);

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('🗑️ Mood cleared, new progress:', newProgress);
    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  const clearWeight = useCallback(async () => {
    if (!day) return;

    const currentAttempt = getCurrentAttempt(day);
    const updatedAttempt: Attempt = {
      ...currentAttempt,
      weight: undefined,
      // If the attempt was completed but no longer meets requirements, unmark it
      completed: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, weight: undefined }) ? currentAttempt.completed : false,
      // Clear timestamp if no longer complete
      timestamp: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, weight: undefined }) ? currentAttempt.timestamp : null,
    };

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    await actions.updateDay(dayIndex, updatedDay);

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('🗑️ Weight cleared, new progress:', newProgress);
    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  const clearPhoto = useCallback(async () => {
    if (!day) return;

    const currentAttempt = getCurrentAttempt(day);
    const updatedAttempt: Attempt = {
      ...currentAttempt,
      photoUri: undefined,
      // If the attempt was completed but no longer meets requirements, unmark it
      completed: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, photoUri: undefined }) ? currentAttempt.completed : false,
      // Clear timestamp if no longer complete
      timestamp: currentAttempt.completed && isAttemptComplete({ ...currentAttempt, photoUri: undefined }) ? currentAttempt.timestamp : null,
    };

    const updatedDay = updateCurrentAttempt(day, updatedAttempt);
    await actions.updateDay(dayIndex, updatedDay);

    // Calculate and return new progress for immediate use
    const newProgress = getProgressFromAttempt(updatedAttempt);
    console.log('🗑️ Photo cleared, new progress:', newProgress);
    return { newProgress, updatedAttempt };
  }, [day, dayIndex, actions, getProgressFromAttempt]);

  return {
    currentAttempt: getCurrentAttemptData(),
    toggleTask,
    setMood,
    setWeight,
    setPhoto,
    selectPhoto,
    completeCurrentAttempt,
    startNewAttempt,
    getCurrentAttemptNumber,
    getCurrentAttemptData,
    areAllTasksCompleted,
    getCompletionProgress,
    getProgressFromAttempt,
    clearMood,
    clearWeight,
    clearPhoto,
  };
}