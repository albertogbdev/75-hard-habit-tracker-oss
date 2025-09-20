import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../styles';

interface StreakModalProps {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  visible,
  streakCount,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>🔥</Text>
            <Text style={styles.title}>Streak!</Text>
            <Text style={styles.message}>
              {streakCount} day{streakCount > 1 ? 's' : ''} streak, keep going!
            </Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Continue</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.base,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.base,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
});