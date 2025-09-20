import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { theme } from '../styles';

interface DayCompletionModalProps {
  visible: boolean;
  dayNumber: number;
  streak: number;
  onClose: () => void;
}

export const DayCompletionModal: React.FC<DayCompletionModalProps> = ({
  visible,
  dayNumber,
  streak,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.container} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.successIcon}>🎉</Text>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>Day Completed!</Text>
            
            {/* Day Number */}
            <Text style={styles.dayText}>
              Day {dayNumber} of 75
            </Text>
            
            {/* Streak */}
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>
                {streak} day streak
              </Text>
            </View>
            
            {/* Motivational Message */}
            <Text style={styles.message}>
              Great job! You're one step closer to completing the 75 Hard Challenge.
            </Text>
            
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 350,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  dayText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  streakEmoji: {
    fontSize: theme.typography.fontSize.sm,
    marginRight: theme.spacing.sm,
  },
  streakText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
});