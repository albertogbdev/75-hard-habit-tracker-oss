import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Task } from '../lib/models';
import { theme } from '../styles';

interface TaskRowProps {
  task: Task;
  onToggle: (taskId: string) => void;
  disabled?: boolean;
}

/**
 * TaskRow component for displaying and toggling individual tasks
 */
export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggle,
  disabled = false,
}) => {
  const [scaleValue] = React.useState(new Animated.Value(1));

  const handlePress = () => {
    if (disabled) return;

    // Animate the press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(task.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.completed }}
      accessibilityLabel={`${task.title}, ${task.completed ? 'completed' : 'not completed'}`}
    >
      <Animated.View
        style={[
          styles.container,
          disabled && styles.disabled,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <View style={styles.content}>
          {/* Checkbox */}
          <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
            {task.completed && (
              <Text style={styles.checkmark} accessibilityLabel="completed">
                ✓
              </Text>
            )}
          </View>

          {/* Task title */}
          <Text
            style={[
              styles.title,
              task.completed && styles.titleCompleted,
              disabled && styles.titleDisabled,
            ]}
          >
            {task.title}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    marginVertical: theme.spacing.xs / 2,
    ...theme.shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  titleCompleted: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  titleDisabled: {
    color: theme.colors.disabled,
  },
  disabled: {
    opacity: 0.6,
  },
});