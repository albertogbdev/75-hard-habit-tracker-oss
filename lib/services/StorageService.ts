import AsyncStorage from '@react-native-async-storage/async-storage';
import { Day, createInitialDays } from '../models';

/**
 * Storage keys for the application data
 */
const STORAGE_KEYS = {
  CHALLENGE_DATA: '75hard_state_v1',
  CHALLENGE_START_DATE: '75hard_start_date_v1',
  WEIGHT_UNIT_PREFERENCE: '75hard_weight_unit_v1',
} as const;

/**
 * Challenge data structure stored in AsyncStorage
 */
export interface ChallengeData {
  version: number;
  startDate: string;
  days: Day[];
  currentDayIndex: number;
}

/**
 * Service for handling local data persistence
 */
export class StorageService {
  private static readonly CURRENT_VERSION = 1;

  /**
   * Initializes a new 75 Hard challenge
   */
  static async initializeChallenge(startDate: Date): Promise<ChallengeData> {
    const days = createInitialDays(startDate);
    const challengeData: ChallengeData = {
      version: this.CURRENT_VERSION,
      startDate: startDate.toISOString(),
      days,
      currentDayIndex: 1,
    };

    await this.saveChallengeData(challengeData);
    return challengeData;
  }

  /**
   * Loads the current challenge data from storage
   */
  static async loadChallengeData(): Promise<ChallengeData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_DATA);
      if (!data) {
        return null;
      }

      const challengeData: ChallengeData = JSON.parse(data);
      
      // Handle version migration if needed
      if (challengeData.version !== this.CURRENT_VERSION) {
        return await this.migrateData(challengeData);
      }

      return challengeData;
    } catch (error) {
      console.error('Error loading challenge data:', error);
      return null;
    }
  }

  /**
   * Gets all days from the current challenge
   */
  static async getDays(): Promise<Day[] | null> {
    const challengeData = await this.loadChallengeData();
    return challengeData ? challengeData.days : null;
  }

  /**
   * Saves all days to the current challenge
   */
  static async saveDays(days: Day[]): Promise<void> {
    const challengeData = await this.loadChallengeData();
    if (challengeData) {
      challengeData.days = days;
      await this.saveChallengeData(challengeData);
    }
  }

  /**
   * Saves the current challenge data to storage
   */
  static async saveChallengeData(challengeData: ChallengeData): Promise<void> {
    try {
      const dataString = JSON.stringify(challengeData);
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_DATA, dataString);
    } catch (error) {
      console.error('Error saving challenge data:', error);
      throw new Error('Failed to save challenge data');
    }
  }

  /**
   * Updates a specific day in the challenge data
   */
  static async updateDay(challengeData: ChallengeData, updatedDay: Day): Promise<ChallengeData> {
    const updatedDays = challengeData.days.map(day => 
      day.index === updatedDay.index ? updatedDay : day
    );

    const updatedChallengeData = {
      ...challengeData,
      days: updatedDays,
    };

    await this.saveChallengeData(updatedChallengeData);
    return updatedChallengeData;
  }

  /**
   * Updates multiple days in the challenge data in a single operation
   */
  static async updateDays(challengeData: ChallengeData, updatedDays: Day[]): Promise<ChallengeData> {
    const updatedChallengeData = {
      ...challengeData,
      days: updatedDays,
    };

    await this.saveChallengeData(updatedChallengeData);
    return updatedChallengeData;
  }

  /**
   * Updates the current day index
   */
  static async updateCurrentDayIndex(challengeData: ChallengeData, newIndex: number): Promise<ChallengeData> {
    const updatedChallengeData = {
      ...challengeData,
      currentDayIndex: Math.max(1, Math.min(75, newIndex)),
    };

    await this.saveChallengeData(updatedChallengeData);
    return updatedChallengeData;
  }

  /**
   * Clears all challenge data (for reset functionality)
   */
  static async clearChallengeData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CHALLENGE_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.CHALLENGE_START_DATE);
    } catch (error) {
      console.error('Error clearing challenge data:', error);
      throw new Error('Failed to clear challenge data');
    }
  }

  /**
   * Migrates data from older versions (future-proofing)
   */
  private static async migrateData(oldData: ChallengeData): Promise<ChallengeData> {
    // For now, just update the version number
    // In the future, add migration logic here
    const migratedData = {
      ...oldData,
      version: this.CURRENT_VERSION,
    };

    await this.saveChallengeData(migratedData);
    return migratedData;
  }

  /**
   * Checks if a challenge is already initialized
   */
  static async isChallengeInitialized(): Promise<boolean> {
    const data = await this.loadChallengeData();
    return data !== null;
  }

  /**
   * Saves the weight unit preference to storage
   */
  static async saveWeightUnitPreference(unit: 'lbs' | 'kg'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT_PREFERENCE, unit);
    } catch (error) {
      console.error('Error saving weight unit preference:', error);
      throw new Error('Failed to save weight unit preference');
    }
  }

  /**
   * Loads the weight unit preference from storage
   */
  static async loadWeightUnitPreference(): Promise<'lbs' | 'kg'> {
    try {
      const unit = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_UNIT_PREFERENCE);
      return (unit as 'lbs' | 'kg') || 'lbs'; // Default to 'lbs' if not set
    } catch (error) {
      console.error('Error loading weight unit preference:', error);
      return 'lbs'; // Default fallback
    }
  }
}

export default StorageService;