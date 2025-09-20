import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../styles';
import { Mood } from '../lib/models/Attempt';

interface EmojiPickerProps {
  selectedMood?: Mood;
  onMoodSelect: (mood: Mood | null) => void;
  disabled?: boolean;
}

// Centralized emoji dictionary with both emoji and label
const MOOD_DATA: Record<Mood, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Happy' },
  sad: { emoji: '😢', label: 'Sad' },
  angry: { emoji: '😠', label: 'Angry' },
  fearful: { emoji: '😨', label: 'Fearful' },
  strong: { emoji: '💪', label: 'Strong' },
  excited: { emoji: '🤩', label: 'Excited' },
  calm: { emoji: '😌', label: 'Calm' },
  tired: { emoji: '😴', label: 'Tired' },
};

const moods: Mood[] = ['happy', 'sad', 'angry', 'fearful', 'strong', 'excited', 'calm', 'tired'];

/**
 * EmojiPicker component for selecting daily mood
 * Uses the Mood type directly without unnecessary label mapping
 */
export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  selectedMood,
  onMoodSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Emojis ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        indicatorStyle="white"
      >
        {moods.map((mood) => {
          const isSelected = mood === selectedMood;
          
          return (
            <TouchableOpacity
              key={mood}
              style={styles.emojiContainer}
              onPress={() => {
                if (!disabled) {
                  // If the mood is already selected, deselect it
                  if (mood === selectedMood) {
                    onMoodSelect(null);
                  } else {
                    onMoodSelect(mood);
                  }
                }
              }}
              disabled={disabled}
            >
              <View style={[
                styles.emojiCircle,
                isSelected && styles.selectedEmojiCircle,
              ]}>
                <Text style={styles.emoji}>{MOOD_DATA[mood].emoji}</Text>
              </View>
              <Text style={[
                styles.label,
                isSelected && styles.selectedLabel
              ]}>{MOOD_DATA[mood].label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  emojiContainer: {
    width: 55,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    paddingVertical: 0,
  },
  emojiCircle: {
    width: 38,
    height: 38,
    backgroundColor: theme.colors.background,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: 2,
  },
  selectedEmojiCircle: {
    borderColor: '#22c55e',
    backgroundColor: theme.colors.surfaceElevated,
 },
  emoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily,
  },
  selectedLabel: {
    color: '#16a34a',
    fontWeight: theme.typography.fontWeight.semibold,
  },
});