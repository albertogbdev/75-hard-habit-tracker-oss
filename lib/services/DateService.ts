/**
 * Service for handling date calculations and time-based logic
 */
export class DateService {
  /**
   * Calculates which day should be unlocked based on the challenge start date
   * Days unlock at midnight after the previous day
   */
  static getMaxUnlockedDay(startDate: string | Date): number {
    const challengeStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const now = new Date();
    
    // Set the start date to midnight to ensure consistent calculations
    const startMidnight = new Date(challengeStartDate);
    startMidnight.setHours(0, 0, 0, 0);
    
    // Set current time to midnight to get the current day
    const currentMidnight = new Date(now);
    currentMidnight.setHours(0, 0, 0, 0);
    
    // Calculate the difference in days
    const timeDifference = currentMidnight.getTime() - startMidnight.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    
    // Day 1 is unlocked on the start date
    // Day 2 is unlocked the day after start date (at midnight)
    // And so on...
    const maxUnlockedDay = Math.max(1, daysDifference + 1);
    
    // Cap at 75 days maximum
    return Math.min(75, maxUnlockedDay);
  }
  
  /**
   * Checks if a specific day should be unlocked based on time
   */
  static isDayUnlockedByTime(dayIndex: number, startDate: string | Date): boolean {
    const maxUnlockedDay = this.getMaxUnlockedDay(startDate);
    return dayIndex <= maxUnlockedDay;
  }
  
  /**
   * Gets the time remaining until the next day unlocks
   */
  static getTimeUntilNextUnlock(): { hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    
    const timeRemaining = nextMidnight.getTime() - now.getTime();
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }
  
  /**
   * Formats the time until next unlock for display
   */
  static formatTimeUntilNextUnlock(): string {
    const { hours, minutes, seconds } = this.getTimeUntilNextUnlock();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Checks if it's currently past midnight (new day has started)
   */
  static isNewDayAvailable(lastCheckDate: string | Date): boolean {
    const lastCheck = typeof lastCheckDate === 'string' ? new Date(lastCheckDate) : lastCheckDate;
    const now = new Date();
    
    // Set both dates to midnight for comparison
    const lastCheckMidnight = new Date(lastCheck);
    lastCheckMidnight.setHours(0, 0, 0, 0);
    
    const currentMidnight = new Date(now);
    currentMidnight.setHours(0, 0, 0, 0);
    
    return currentMidnight.getTime() > lastCheckMidnight.getTime();
  }
}