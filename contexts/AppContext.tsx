import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Day, createInitialDays, isDayCompleted } from '../lib/models';
import { StorageService } from '../lib/services';

interface AppState {
  days: Day[];
  currentDayIndex: number;
  startDate: string | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DAYS_SUCCESS'; payload: Day[] }
  | { type: 'UPDATE_DAY'; payload: { dayIndex: number; day: Day } }
  | { type: 'SET_CURRENT_DAY'; payload: number }
  | { type: 'SET_START_DATE'; payload: string };

const initialState: AppState = {
  days: [],
  currentDayIndex: 0,
  startDate: null,
  isLoading: true,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_DAYS_SUCCESS':
      return { ...state, days: action.payload, isLoading: false, error: null };
    case 'UPDATE_DAY':
      const updatedDays = [...state.days];
      updatedDays[action.payload.dayIndex] = action.payload.day;
      return { ...state, days: updatedDays };
    case 'SET_CURRENT_DAY':
      return { ...state, currentDayIndex: action.payload };
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  actions: {
    loadDays: () => Promise<void>;
    updateDay: (dayIndex: number, day: Day) => Promise<void>;
    updateDays: (days: Day[]) => Promise<void>;
    setCurrentDay: (dayIndex: number) => void;
    getCurrentDay: () => Day | null;
    getCompletedDaysCount: () => number;
    getStreakCount: () => number;
    resetChallenge: () => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadDays = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check if challenge is already initialized
      const isInitialized = await StorageService.isChallengeInitialized();
      
      if (isInitialized) {
        // Load existing challenge data
        const challengeData = await StorageService.loadChallengeData();
        if (challengeData) {
          dispatch({ type: 'LOAD_DAYS_SUCCESS', payload: challengeData.days });
          dispatch({ type: 'SET_CURRENT_DAY', payload: challengeData.currentDayIndex - 1 }); // Convert to 0-based index
          dispatch({ type: 'SET_START_DATE', payload: challengeData.startDate });
        }
      } else {
        // Initialize new challenge
        const startDate = new Date();
        const challengeData = await StorageService.initializeChallenge(startDate);
        dispatch({ type: 'LOAD_DAYS_SUCCESS', payload: challengeData.days });
        dispatch({ type: 'SET_CURRENT_DAY', payload: challengeData.currentDayIndex - 1 }); // Convert to 0-based index
        dispatch({ type: 'SET_START_DATE', payload: challengeData.startDate });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load days' });
    }
  };

  const updateDay = async (dayIndex: number, day: Day) => {
    try {
      dispatch({ type: 'UPDATE_DAY', payload: { dayIndex, day } });
      
      // Load current challenge data and update it
      const challengeData = await StorageService.loadChallengeData();
      if (challengeData) {
        const updatedChallengeData = await StorageService.updateDay(challengeData, day);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update day' });
    }
  };

  const updateDays = async (days: Day[]) => {
    try {
      // Update all days in the state
      days.forEach((day, index) => {
        dispatch({ type: 'UPDATE_DAY', payload: { dayIndex: index, day } });
      });
      
      // Load current challenge data and update it with all days at once
      const challengeData = await StorageService.loadChallengeData();
      if (challengeData) {
        const updatedChallengeData = await StorageService.updateDays(challengeData, days);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update days' });
    }
  };

  const setCurrentDay = (dayIndex: number) => {
    dispatch({ type: 'SET_CURRENT_DAY', payload: dayIndex });
  };

  const getCurrentDay = (): Day | null => {
    return state.days[state.currentDayIndex] || null;
  };

  const getCompletedDaysCount = (): number => {
    return state.days.filter(day => isDayCompleted(day)).length;
  };

  const getStreakCount = (): number => {
    let streak = 0;
    for (const day of state.days) {
      if (isDayCompleted(day)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const resetChallenge = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear all stored data
      await StorageService.clearChallengeData();
      
      // Initialize new challenge
      const startDate = new Date();
      const challengeData = await StorageService.initializeChallenge(startDate);
      
      // Update state with new days
      dispatch({ type: 'LOAD_DAYS_SUCCESS', payload: challengeData.days });
      dispatch({ type: 'SET_CURRENT_DAY', payload: challengeData.currentDayIndex - 1 }); // Convert to 0-based index
      dispatch({ type: 'SET_START_DATE', payload: challengeData.startDate });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset challenge' });
    }
  };

  // Load days on mount
  useEffect(() => {
    loadDays();
  }, []);

  const contextValue: AppContextType = {
    state,
    actions: {
      loadDays,
      updateDay,
      updateDays,
      setCurrentDay,
      getCurrentDay,
      getCompletedDaysCount,
      getStreakCount,
      resetChallenge,
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}