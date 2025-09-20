import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ValidationService } from '../lib/services';
import { theme } from '../styles';

interface WeightInputProps {
  weight?: number;
  onWeightChange: (weight: number | undefined) => void;
  disabled?: boolean;
  unit?: 'lbs' | 'kg';
}

/**
 * WeightInput component for entering daily weight
 */
export const WeightInput: React.FC<WeightInputProps> = ({
  weight,
  onWeightChange,
  disabled = false,
  unit = 'kg',
}) => {
  const [inputValue, setInputValue] = useState(weight?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  // Update input value when weight prop changes
  useEffect(() => {
    setInputValue(weight?.toString() || '');
  }, [weight]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    setError(null);
    
    // Only validate but don't save yet
    if (text.trim() !== '') {
      const validation = ValidationService.validateWeight(text);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid weight');
      }
    }
  };

  const handleBlur = () => {
    // Save weight only on blur (when user finishes typing)
    if (inputValue.trim() === '') {
      onWeightChange(undefined);
      return;
    }

    const validation = ValidationService.validateWeight(inputValue);
    if (validation.isValid && validation.value !== undefined) {
      onWeightChange(validation.value);
      setInputValue(validation.value.toString()); // Format the display value
      setError(null);
    } else {
      setError(validation.error || 'Invalid weight');
    }
  };

  const handleSubmitEditing = () => {
    // Also save on Enter key press
    handleBlur();
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={inputValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          editable={!disabled}
          maxLength={6}
          accessibilityLabel="Weight input"
          accessibilityHint={`Enter your current weight in ${unit}`}
        />
        <View style={styles.divider} />
        <Text style={styles.unitText}>{unit}</Text>
      </View>


      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Text style={styles.hint}>
        Track your weight to monitor progress
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    height: 60,
    width: 120,
    margin: 'auto',
    ...theme.shadows.sm,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.disabled,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    textAlign: 'center',
    paddingLeft: theme.spacing.sm,
  },
  inputError: {
    color: theme.colors.error,
  },
  inputDisabled: {
    color: theme.colors.disabled,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  unitText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    minWidth: 30,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  hint: {
    display: 'none', // Hide hint text to save space
  },
});