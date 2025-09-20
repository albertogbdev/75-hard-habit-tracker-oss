import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Day, isDayCompleted, getCurrentAttempt } from '../lib/models';
import { theme } from '../styles';

interface DayCardProps {
  day: Day;
  isCurrentDay: boolean;
  isUnlocked: boolean;
  onPress: (dayIndex: number) => void;
  progressPercentage?: number;
}

/**
 * DayCard component for displaying day information in the day selector
 */
export const DayCard: React.FC<DayCardProps> = ({
  day,
  isCurrentDay,
  isUnlocked,
  onPress,
  progressPercentage = 0,
}) => {
  const isCompleted = isDayCompleted(day);
  const progress = isCompleted ? 100 : progressPercentage;

  const handlePress = () => {
    if (isUnlocked) {
      onPress(day.index);
    }
  };

  // Circle properties for progress indicator
  const size = 60;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Colors based on completion status
  const getCircleColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isCurrentDay) return theme.colors.primary;
    return theme.colors.border;
  };

  const getTextColor = () => {
    if (isCompleted) return theme.colors.success;
    if (isCurrentDay) return '#FFFFFF';
    return theme.colors.textSecondary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.dayCard,
        isCurrentDay && styles.currentDay,
        !isUnlocked && styles.lockedDay,
      ]}
      onPress={handlePress}
      disabled={!isUnlocked}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day.index + 1}`}
    >
      <View style={styles.circleContainer}>
        <Svg width={size} height={size} style={styles.progressCircle}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.3}
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getCircleColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.dayNumber}>
          <Text style={[styles.dayText, { color: getTextColor() }]}>
            {day.index}
          </Text>
        </View>
      </View>
      <Text style={[styles.dateText, { color: getTextColor() }]}>
        {new Date(day.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayCard: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  currentDay: {
    // Additional styling for current day if needed
  },
  lockedDay: {
    opacity: 0.5,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressCircle: {
    // SVG styling if needed
  },
  dayNumber: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  dayText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
});