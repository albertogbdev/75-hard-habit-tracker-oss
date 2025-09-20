/**
 * Service for validating user inputs
 */
export class ValidationService {
  /**
   * Validates weight input
   */
  static validateWeight(weight: number | string): {
    isValid: boolean;
    error?: string;
    value?: number;
  } {
    // Convert string to number if needed
    const numericWeight = typeof weight === 'string' ? parseFloat(weight) : weight;

    // Check if it's a valid number
    if (isNaN(numericWeight)) {
      return {
        isValid: false,
        error: 'Please enter a valid number',
      };
    }

    // Check for reasonable decimal places (max 1)
    const decimalPlaces = (numericWeight.toString().split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      return {
        isValid: false,
        error: 'Weight can have at most 1 decimal place',
      };
    }

    return {
      isValid: true,
      value: numericWeight,
    };
  }

  /**
   * Validates if a string is not empty
   */
  static validateRequired(value: string, fieldName: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!value || value.trim().length === 0) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates if a date is within reasonable bounds
   */
  static validateDate(date: Date): {
    isValid: boolean;
    error?: string;
  } {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    if (date < oneYearAgo) {
      return {
        isValid: false,
        error: 'Date cannot be more than a year in the past',
      };
    }

    if (date > oneYearFromNow) {
      return {
        isValid: false,
        error: 'Date cannot be more than a year in the future',
      };
    }

    return { isValid: true };
  }

  /**
   * Formats weight for display
   */
  static formatWeight(weight: number): string {
    return `${weight.toFixed(1)} kg`;
  }

  /**
   * Formats date for display
   */
  static formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Formats day index for display
   */
  static formatDayIndex(index: number): string {
    return `Day ${index} / 75`;
  }

  /**
   * Calculates progress percentage
   */
  static calculateProgress(currentDay: number, totalDays: number = 75): number {
    return Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
  }

  /**
   * Validates if a day index is within valid range
   */
  static validateDayIndex(index: number): {
    isValid: boolean;
    error?: string;
  } {
    if (index < 1) {
      return {
        isValid: false,
        error: 'Day index must be at least 1',
      };
    }

    if (index > 75) {
      return {
        isValid: false,
        error: 'Day index cannot exceed 75',
      };
    }

    return { isValid: true };
  }
}