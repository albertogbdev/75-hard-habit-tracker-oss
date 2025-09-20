import * as DocumentPicker from 'expo-document-picker';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayCard } from '../components/DayCard';
import { DayCompletionModal } from '../components/DayCompletionModal';
import { EmojiPicker } from '../components/EmojiPicker';
import { PhotoPicker } from '../components/PhotoPicker';
import { StreakModal } from '../components/StreakModal';
import { TaskRow } from '../components/TaskRow';
import { TasksModifiedModal } from '../components/TasksModifiedModal';
import { WeightInput } from '../components/WeightInput';
import { useApp } from '../contexts/AppContext';
import { useDay } from '../hooks/useDay';
import { Day, getCurrentAttempt, isAttemptComplete, isDayCompleted, updateCurrentAttempt } from '../lib/models';
import { Task } from '../lib/models/Task';
import { DataService, DateService, StorageService } from '../lib/services';
import { theme } from '../styles/theme';

/**
 * Main screen component for the 75 Hard Habit Tracker
 */
export const MainScreen: React.FC = () => {
  // Load custom font
  const [fontsLoaded] = useFonts({
    'DM-Sans': require('../assets/fonts/DM-Sans.otf'),
    'Bebas-Neue': require('../assets/fonts/Bebas-Neue.ttf'),
  });

  // Use app context and hooks
  const { state, actions } = useApp();
  const currentDay = actions.getCurrentDay();
  const dayHook = useDay(state.currentDayIndex);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [isModifyTasksVisible, setIsModifyTasksVisible] = useState(false);
  const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
  const [isTasksModifiedModalVisible, setIsTasksModifiedModalVisible] = useState(false);
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);
  const [editableTasks, setEditableTasks] = useState<Task[]>([]);
  const [modalShownForAttempt, setModalShownForAttempt] = useState<string | null>(null);

  // Load weight unit preference on initialization
  useEffect(() => {
    const loadWeightUnitPreference = async () => {
      try {
        const savedUnit = await StorageService.loadWeightUnitPreference();
        setWeightUnit(savedUnit);
      } catch (error) {
        console.error('Error loading weight unit preference:', error);
      }
    };
    
    loadWeightUnitPreference();
  }, []);

  // Add debug log for modal state changes
  useEffect(() => {
    console.log('🎭 Modal state changed:', { isCompletionModalVisible });
  }, [isCompletionModalVisible]);

  // Initialize editable tasks when modal opens
  const openModifyTasksModal = () => {
    // Find the first future day to show its tasks as the template
    // This way, users can see what tasks will be applied to future days
    const futureDay = state.days.find((day, index) => index > state.currentDayIndex);
    
    if (futureDay?.attempts && futureDay.attempts.length > 0) {
      // Use tasks from the first future day
      setEditableTasks([...futureDay.attempts[0].tasks]);
    } else if (dayHook.currentAttempt?.tasks) {
      // Fallback to current day tasks if no future days exist
      setEditableTasks([...dayHook.currentAttempt.tasks]);
    } else {
      // Default empty tasks if nothing is available
      setEditableTasks([]);
    }
    setIsModifyTasksVisible(true);
  };

  // Add new task
  const addTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '',
      completed: false,
    };
    setEditableTasks([...editableTasks, newTask]);
  };

  // Remove task
  const removeTask = (taskId: string) => {
    setEditableTasks(editableTasks.filter(task => task.id !== taskId));
  };

  // Update task title
  const updateTaskTitle = (taskId: string, title: string) => {
    setEditableTasks(editableTasks.map(task => 
      task.id === taskId ? { ...task, title } : task
    ));
  };

  // Save tasks
  const saveTasks = async () => {
    // Filter out empty tasks
    const validTasks = editableTasks.filter(task => task.title.trim() !== '');
    
    if (validTasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task.');
      return;
    }

    try {
      // Update tasks for incomplete days and future days
      const updatedDays = state.days.map((day, index) => {
        const isCompletedDay = isDayCompleted(day);
        const isFutureDay = index > state.currentDayIndex;
        
        // Apply changes to incomplete days OR future days (regardless of completion status)
        if (!isCompletedDay || isFutureDay) {
          // Get current attempt and preserve completion status and other data
          const currentAttempt = getCurrentAttempt(day);
          
          // Create new tasks with preserved completion status where possible
          const updatedTasks = validTasks.map(newTask => {
            // Try to find existing task with same ID to preserve completion status
            const existingTask = currentAttempt.tasks.find(t => t.id === newTask.id);
            return {
              ...newTask,
              completed: existingTask ? existingTask.completed : false,
            };
          });

          // Update the current attempt with new tasks
          const updatedAttempt = {
            ...currentAttempt,
            tasks: updatedTasks,
          };

          // Update the day with the new attempt
          return updateCurrentAttempt(day, updatedAttempt);
        }
        
        return day; // Return unchanged for completed past days only
      });

      // Use the new batch update function instead of updating each day individually
      await actions.updateDays(updatedDays);

      setIsModifyTasksVisible(false);
      setIsTasksModifiedModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save task modifications. Please try again.');
    }
  };

  // Handle weight unit change with persistence
  const handleWeightUnitChange = async (unit: 'lbs' | 'kg') => {
    setWeightUnit(unit);
    try {
      await StorageService.saveWeightUnitPreference(unit);
    } catch (error) {
      console.error('Error saving weight unit preference:', error);
    }
  };

  // Handle data export
  const handleExportData = async () => {
    try {
      const result = await DataService.exportDataAsZip();
      
      if (result.success) {
        Alert.alert('Export Successful', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Export Error', 'An unexpected error occurred during export.');
    }
  };

  // Handle data import
  const handleImportData = async () => {
    try {
      // Open document picker to select backup ZIP file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return; // User cancelled
      }

      const file = result.assets[0];
      
      // Show backup info before importing
      const backupInfo = await DataService.getBackupInfoFromZip(file.uri);
      
      if (!backupInfo.success) {
        Alert.alert('Invalid Backup File', backupInfo.message);
        return;
      }

      // Show backup details and confirm import
      Alert.alert(
        'Backup File Details',
        `Export Date: ${new Date(backupInfo.info!.exportDate).toLocaleDateString()}\n` +
        `Challenge Start: ${new Date(backupInfo.info!.challengeStartDate).toLocaleDateString()}\n` +
        `Current Day: ${backupInfo.info!.currentDay}\n` +
        `Completed Days: ${backupInfo.info!.completedDays}/75\n\n` +
        'Do you want to import this backup?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              const importResult = await DataService.importDataFromZip(file.uri);
              
              if (importResult.success) {
                Alert.alert(
                  'Import Successful',
                  importResult.message,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Reload the app data
                        actions.loadDays();
                        setIsSettingsVisible(false);
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Import Failed', importResult.message);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Import Error', 'An unexpected error occurred during import.');
    }
  };
  const handlePhotoSelect = async (photoUri: string) => {
    const wasCompleted = dayHook.getCompletionProgress() === 1;
    
    console.log('📸 Photo select - Before:', { wasCompleted, progress: dayHook.getCompletionProgress(), photoUri });
    const result = await dayHook.setPhoto(photoUri);
    
    if (result) {
      const { newProgress, updatedAttempt } = result;
      
      console.log('📸 Photo select - After:', { 
        newProgress, 
        shouldShowModal: !wasCompleted && newProgress === 1
      });
      
      // Generate unique identifier for this attempt state
      const attemptId = `${state.currentDayIndex}-${updatedAttempt.tasks.filter(t => t.completed).length}-${updatedAttempt.mood || 'no-mood'}-${updatedAttempt.weight || 'no-weight'}-${updatedAttempt.photoUri ? 'has-photo' : 'no-photo'}`;
      
      // Check for completion after setting photo - show modal if just completed and not shown for this attempt
      if (!wasCompleted && newProgress === 1 && modalShownForAttempt !== attemptId) {
        console.log('🎉 Attempting to show completion modal from photo select');
        
        // Check if all requirements are met using the updated attempt
        if (isAttemptComplete(updatedAttempt)) {
          console.log('🎉 All requirements met, showing modal directly');
          setModalShownForAttempt(attemptId);
          setIsCompletionModalVisible(true);
        } else {
          // Fallback to completeCurrentAttempt
          const result = dayHook.completeCurrentAttempt(() => {
            console.log('🎉 Modal callback triggered from photo select');
            setModalShownForAttempt(attemptId);
            setIsCompletionModalVisible(true);
          });
          console.log('🎉 Complete attempt result:', result);
        }
      }
      
      // Reset modal tracking if progress drops below 1
      if (newProgress < 1) {
        setModalShownForAttempt(null);
      }
    }
  };

  const handlePhotoDelete = async () => {
    const result = await dayHook.clearPhoto();
    
    if (result) {
      const { newProgress } = result;
      
      // Reset modal tracking if progress drops below 1
      if (newProgress < 1) {
        setModalShownForAttempt(null);
      }
    }
  };

  const handleTaskToggle = useCallback(async (taskId: string) => {
    const wasCompleted = dayHook.getCompletionProgress() === 1;
    const currentProgress = dayHook.getCompletionProgress();
    
    console.log('🔄 Task toggle - Before:', { 
      taskId, 
      progress: currentProgress, 
      wasCompleted 
    });
    
    const result = await dayHook.toggleTask(taskId);
    const newProgress = result?.newProgress || 0;
    const updatedAttempt = result?.updatedAttempt;
    
    console.log('🔄 Task toggle - After:', { 
      taskId,
      newProgress, 
      shouldShowModal: !wasCompleted && newProgress === 1
    });

    // Generate unique identifier for this attempt state
    const attemptId = updatedAttempt ? `${state.currentDayIndex}-${updatedAttempt.tasks.filter(t => t.completed).length}-${updatedAttempt.mood || 'no-mood'}-${updatedAttempt.weight || 'no-weight'}-${updatedAttempt.photoUri ? 'has-photo' : 'no-photo'}` : null;
    
    // Check for completion after task toggle - show modal if just completed and not shown for this attempt
    if (!wasCompleted && newProgress === 1 && updatedAttempt && modalShownForAttempt !== attemptId) {
      console.log('🎉 Attempting to show completion modal after task toggle');
      console.log('🎉 Using updated attempt directly for completion check');
      
      // Use the updated attempt directly instead of relying on state
      if (updatedAttempt.tasks.every(t => t.completed) && 
          updatedAttempt.mood && 
          updatedAttempt.photoUri && 
          updatedAttempt.weight && updatedAttempt.weight > 0) {
        console.log('🎉 All requirements met, showing modal directly');
        setModalShownForAttempt(attemptId);
        setIsCompletionModalVisible(true);
      } else {
        console.log('🎉 Requirements not met, trying completeCurrentAttempt');
        const result = dayHook.completeCurrentAttempt(() => {
          console.log('🎉 Task completion modal callback triggered');
          setModalShownForAttempt(attemptId);
          setIsCompletionModalVisible(true);
        });
        console.log('🎉 Complete attempt result:', result);
      }
    }
    
    // Reset modal tracking if progress drops below 1
    if (newProgress < 1) {
      console.log('📉 Progress dropped, resetting modal tracking');
      setModalShownForAttempt(null);
    }
  }, [dayHook, setIsCompletionModalVisible, modalShownForAttempt, state.currentDayIndex]);

  const handleWeightChange = useCallback(async (weight: number | undefined) => {
    const wasCompleted = dayHook.getCompletionProgress() === 1;
    
    console.log('⚖️ Weight change - Before:', { 
      weight, 
      progress: dayHook.getCompletionProgress(), 
      wasCompleted 
    });
    
    let result;
    if (weight !== undefined) {
      result = await dayHook.setWeight(weight);
    } else {
      result = await dayHook.clearWeight();
    }
    
    if (result) {
      const { newProgress, updatedAttempt } = result;
      console.log('⚖️ Weight change - After:', { 
        weight, 
        newProgress, 
        wasCompleted,
        shouldShowModal: newProgress === 1 && !wasCompleted
      });

      // Generate unique identifier for this attempt state
      const attemptId = `${state.currentDayIndex}-${updatedAttempt.tasks.filter(t => t.completed).length}-${updatedAttempt.mood || 'no-mood'}-${updatedAttempt.weight || 'no-weight'}-${updatedAttempt.photoUri ? 'has-photo' : 'no-photo'}`;

      // Check for completion after weight change - show modal if just completed and not shown for this attempt
      if (newProgress === 1 && !wasCompleted && modalShownForAttempt !== attemptId) {
        console.log('🎉 Attempting to show completion modal after weight change');
        
        // Check if all requirements are met using the updated attempt
        if (isAttemptComplete(updatedAttempt)) {
          console.log('🎉 All requirements met, showing modal directly');
          setModalShownForAttempt(attemptId);
          setIsCompletionModalVisible(true);
        } else {
          // Fallback to completeCurrentAttempt
          const completeResult = dayHook.completeCurrentAttempt(() => {
            console.log('🎉 Weight completion modal callback triggered');
            setModalShownForAttempt(attemptId);
            setIsCompletionModalVisible(true);
          });
          console.log('🎉 Complete attempt result:', completeResult);
        }
      }
      
      // Reset modal tracking if progress drops below 1
      if (newProgress < 1) {
        console.log('📉 Progress dropped, resetting modal tracking');
        setModalShownForAttempt(null);
      }
    }
  }, [dayHook, setIsCompletionModalVisible, modalShownForAttempt, state.currentDayIndex]);

  // Handle day navigation
  const handleDayPress = async (dayIndex: number) => {
    // Check if day is unlocked by time (midnight rule)
    if (!state.startDate) return;
    
    const isUnlockedByTime = DateService.isDayUnlockedByTime(dayIndex + 1, state.startDate); // Convert to 1-based
    
    // Check if all previous days are completed
    const allPreviousDaysCompleted = state.days.slice(0, dayIndex).every(day => isDayCompleted(day));
    
    // Only allow navigation if both conditions are met - no alerts, just silent return
    if (!isUnlockedByTime || !allPreviousDaysCompleted) {
      return;
    }
    
    actions.setCurrentDay(dayIndex);
  };

  const handleResetChallenge = () => {
    Alert.alert(
      'Reset Challenge',
      'Are you sure you want to reset the entire 75 Hard Challenge? This will delete all your progress and cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            actions.resetChallenge();
            setIsSettingsVisible(false);
            Alert.alert('Challenge Reset', 'Your 75 Hard Challenge has been reset successfully.');
          },
        },
      ]
    );
  };
    // Show loading state
  if (!fontsLoaded || state.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get completion stats
  const completedDaysCount = actions.getCompletedDaysCount();
  const streakCount = actions.getStreakCount();
  
  // Calculate progress for current day (7 steps: tasks + mood + weight + photo)
  const calculateDayProgress = useCallback((day: Day) => {
    if (!day) return 0;
    const currentAttempt = getCurrentAttempt(day);
    if (!currentAttempt) return 0;
    
    let completedSteps = 0;
    const totalSteps = 7; // 4 tasks + mood + weight + photo
    
    // Count completed tasks
    completedSteps += currentAttempt.tasks.filter((task: Task) => task.completed).length;
    
    // Count mood (if selected)
    if (currentAttempt.mood) completedSteps += 1;
    
    // Count weight (if entered)
    if (currentAttempt.weight && currentAttempt.weight > 0) completedSteps += 1;
    
    // Count photo (if taken)
    if (currentAttempt.photoUri) completedSteps += 1;
    
    return (completedSteps / totalSteps) * 100;
  }, [state.days]); // Add state.days as dependency to make it reactive

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {streakCount > 0 && (
          <TouchableOpacity
            style={styles.streakButton}
            onPress={() => setIsStreakModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`${streakCount} day streak`}
          >
            <Text style={styles.streakButtonText}>🔥 {streakCount}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>75 Hard Challenge</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setIsSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Day Selector */}
        <View style={[styles.section, {paddingTop: theme.spacing.sm}]}>
          <FlatList
            data={state.days}
            renderItem={({ item, index }: { item: Day; index: number }) => (
              <DayCard
                day={item}
                isCurrentDay={index === state.currentDayIndex}
                isUnlocked={
                  state.startDate 
                    ? DateService.isDayUnlockedByTime(index + 1, state.startDate) && 
                      state.days.slice(0, index).every(day => isDayCompleted(day))
                    : false
                }
                onPress={() => handleDayPress(index)}
                progressPercentage={calculateDayProgress(item)}
              />
            )}
            keyExtractor={(item: Day, index: number) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayList}
          />
        </View>

        {currentDay && (
          <>
            {/* Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Tasks</Text>
              {dayHook.currentAttempt?.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                />
              ))}
            </View>

            {/* Mood and Weight Row */}
            <View style={styles.section}>
              <View style={styles.moodWeightContainer}>
                <View style={styles.moodSection}>
                  <Text style={styles.moodTitle}>Mood</Text>
                  <EmojiPicker
                    selectedMood={dayHook.currentAttempt?.mood}
                    onMoodSelect={async (mood) => {
                      const wasCompleted = dayHook.getCompletionProgress() === 1;
                      
                      console.log('😊 Mood select - Before:', { mood, wasCompleted, progress: dayHook.getCompletionProgress() });
                      
                      let result;
                      if (mood === null) {
                        // Clear mood if null is passed
                        result = await dayHook.clearMood();
                      } else {
                        // Set mood directly - no mapping needed
                        result = await dayHook.setMood(mood);
                      }
                      
                      if (result) {
                        const { newProgress, updatedAttempt } = result;
                        
                        console.log('😊 Mood select - After:', { mood, newProgress, shouldShowModal: !wasCompleted && newProgress === 1 });
                        
                        // Generate unique identifier for this attempt state
                        const attemptId = `${state.currentDayIndex}-${updatedAttempt.tasks.filter(t => t.completed).length}-${updatedAttempt.mood || 'no-mood'}-${updatedAttempt.weight || 'no-weight'}-${updatedAttempt.photoUri ? 'has-photo' : 'no-photo'}`;
                        
                        // Check for completion after setting mood - show modal if just completed and not shown for this attempt
                        if (!wasCompleted && newProgress === 1 && modalShownForAttempt !== attemptId) {
                          console.log('🎉 Attempting to show completion modal from mood select');
                          
                          // Check if all requirements are met using the updated attempt
                          if (isAttemptComplete(updatedAttempt)) {
                            console.log('🎉 All requirements met, showing modal directly');
                            setModalShownForAttempt(attemptId);
                            setIsCompletionModalVisible(true);
                          } else {
                            // Fallback to completeCurrentAttempt
                            const result = dayHook.completeCurrentAttempt(() => {
                              console.log('🎉 Modal callback triggered from mood select');
                              setModalShownForAttempt(attemptId);
                              setIsCompletionModalVisible(true);
                            });
                            console.log('🎉 Complete attempt result:', result);
                          }
                        }
                        
                        // Reset modal tracking if progress drops below 1
                        if (newProgress < 1) {
                          setModalShownForAttempt(null);
                        }
                      }
                    }}
                  />
                </View>
                <View style={styles.weightSection}>
                  <Text style={styles.weightTitle}>Weight</Text>
                  <WeightInput
                    weight={dayHook.currentAttempt?.weight}
                    unit={weightUnit}
                    onWeightChange={handleWeightChange}
                  />
                </View>
              </View>
            </View>

            {/* Photo Picker */}
            <View style={styles.section}>
              <PhotoPicker
                photoUri={dayHook.currentAttempt?.photoUri}
                onPhotoSelect={handlePhotoSelect}
                onPhotoDelete={handlePhotoDelete}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsSettingsVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalContent}
              onPress={() => {}}
              activeOpacity={1}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsSettingsVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Settings Content */}
              <View style={styles.settingsContent}>
                {/* Weight Unit Selector */}
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Weight Unit</Text>
                  <View style={styles.unitSelector}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        weightUnit === 'lbs' && styles.unitButtonActive
                      ]}
                      onPress={() => handleWeightUnitChange('lbs')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        weightUnit === 'lbs' && styles.unitButtonTextActive
                      ]}>lbs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        weightUnit === 'kg' && styles.unitButtonActive
                      ]}
                      onPress={() => handleWeightUnitChange('kg')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        weightUnit === 'kg' && styles.unitButtonTextActive
                      ]}>kg</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetChallenge}
                >
                  <Text style={styles.resetButtonText}>Reset Challenge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setIsSettingsVisible(false);
                    openModifyTasksModal();
                  }}
                >
                  <Text style={styles.settingButtonText}>Modify Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                   style={[styles.settingButton, { marginBottom: theme.spacing.sm }]}
                   onPress={() => {
                     Alert.alert(
                       'Import/Export Data',
                       'Choose an option:',
                       [
                         {
                           text: 'Export Data',
                           onPress: handleExportData,
                         },
                         {
                           text: 'Import Data',
                           onPress: handleImportData,
                         },
                         {
                           text: 'Cancel',
                           style: 'cancel',
                         },
                       ]
                     );
                   }}
                 >
                   <Text style={styles.settingButtonText}>Import/Export Data</Text>
                 </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modify Tasks Modal */}
      <Modal
        visible={isModifyTasksVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModifyTasksVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsModifyTasksVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalContent}
              onPress={() => {}}
              activeOpacity={1}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modify Tasks</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModifyTasksVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Tasks Content */}
              <View style={styles.settingsContent}>
                <Text style={styles.modifyTasksDescription}>
                  Customize your daily tasks. Changes will apply to all future and incomplete days.
                </Text>
                
                {editableTasks.map((task, index) => (
                  <View key={task.id} style={styles.taskEditItem}>
                    <View style={styles.taskEditHeader}>
                      <Text style={styles.taskEditLabel}>Task {index + 1}</Text>
                      {editableTasks.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeTaskButton}
                          onPress={() => removeTask(task.id)}
                        >
                          <Text style={styles.removeTaskText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.taskEditInput}
                      value={task.title}
                      onChangeText={(text) => updateTaskTitle(task.id, text)}
                      placeholder="Enter task title"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={addTask}
                >
                  <Text style={styles.addTaskText}>+ Add Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveTasks}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Day Completion Modal */}
      <DayCompletionModal
        visible={isCompletionModalVisible}
        dayNumber={state.currentDayIndex + 1}
        streak={actions.getStreakCount()}
        onClose={() => {
          console.log('🎉 Closing completion modal');
          setIsCompletionModalVisible(false);
        }}
      />
      {/* Tasks Modified Modal */}
      <TasksModifiedModal
        visible={isTasksModifiedModalVisible}
        onClose={() => setIsTasksModifiedModalVisible(false)}
      />

      {/* Streak Modal */}
      <StreakModal
        visible={isStreakModalVisible}
        streakCount={streakCount}
        onClose={() => setIsStreakModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    marginTop: theme.spacing.sm,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
  },
  streakButton: {
    position: 'absolute',
    left: theme.spacing.base,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 10,
  },
  streakButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.titleFontFamily,
    color: theme.colors.text,
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: theme.spacing.base,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsIcon: {
    fontSize: theme.typography.fontSize.base,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  streakText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.base,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dayList: {
    paddingHorizontal: theme.spacing.xs,
  },
  currentDayTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  completedBadge: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
  },
  progressSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  moodWeightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.base,
  },
  moodSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  weightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  moodTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  weightTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surfaceElevated,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  settingsContent: {
    minHeight: 200,
    alignItems: 'stretch',
  },
  resetButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.lg,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  settingsPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: theme.spacing.lg,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.base,
    padding: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.base - 2,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  unitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  unitButtonTextActive: {
    color: theme.colors.text,
  },
  settingButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.lg,
  },
  settingButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  modifyTasksDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  taskEditItem: {
    marginBottom: theme.spacing.base,
  },
  taskEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  taskEditLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  removeTaskButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTaskText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  taskEditInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
  },
  addTaskButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.base,
  },
  addTaskText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
});